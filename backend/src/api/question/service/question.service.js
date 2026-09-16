import crypto from 'crypto'; //for generating random hash its built in node crypto module 
import { BadRequestError, NotFoundError, ServiceUnavailableError } from "../../../utils/errors/index.js";
import { safeExecute } from "../../../../db/config.js"
import { findSimilarQuestionsByQuestionHash, findSimilarQuestionsByText, generatingQuestionEmbedding, getVectorConfig, storeQuestionVector, normalizeQuestionText , } from "./vector.service.js"
import {fetchGeminiJsonTextResponse, parseJsonObjectGeminiText}from"./geminiTextCoach.service.js"


const generateQuestionHash = () => crypto.randomBytes(8).toString('hex') //  gives unique string for every question 

// # Task: Create Question & Auto-Embed[T-9]
// POST /api/questions
export const createQuestionWithVectorService = async payload => {
    //extract payload fields from payload authentication
    const { userId, title, content } = payload; //the asker, the question title and content

    //prepare the sql statement for inserting a new question 
    const insertQuestionsql = 'INSERT INTO QUESTIONS (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)';

    //generate a unique hash for the question
    const questionHash = generateQuestionHash();// if itsnt unique db throw error
    let questionResult;

    try {
        //execute the insertion quesrt safely
        questionResult = await safeExecute(insertQuestionsql, [
            questionHash,
            userId,
            title,
            content
        ]);

    } catch (error) {
        //handle specific foreign key constraint error for non-existent user(we cant insert if user doest exist in db first)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            throw new BadRequestError("user does not exist");
        } // to be safe because foregin-key constriant that doesnt let to insert duplicate userid, if user is deleted it also gets deleted because its foreign key constriant (on-delete-cascade)
        //re-throw any other unexpected errors
        throw error

    }

    //retrive the auto-generated ID of the question
    const questionId = questionResult.insertId;

    // construct the result object representing the creted question
    const creationResult = {
        id: questionId,
        questionHash,
        title,
        content,
        userId
    }

    const sourceText = normalizeQuestionText({
        title: payload.title
    });//to get more optimized embedding

    // # after noramlizing the question lets do the embedding
    try {
        const embeddingResult = await generatingQuestionEmbedding(sourceText, { questionId: creationResult.id });

        //validate that a valid embedding was returned fromthe api cause we may finished our free  tokens
        if (!embeddingResult || !embeddingResult.embedding || !embeddingResult.embedding.length === 0) {
            throw new Error('gemini Api did not return valid embedding')
        }
        // ! if embedding fails go to catch block to insert empty array, so that later we can try again to generate the embedding

        //if embedding is done successfully, store the generated vector embedding in the database with a 'ready' status
        await storeQuestionVector({
            questionId: creationResult.id,
            sourceText,
            embedding: embeddingResult.embedding,
            status: 'ready'
        });
    } catch (error) {
        console.error('failed to store vector for question')
        console.error(`Question ID: ${creationResult.id}`)
        console.error('question: questioncreation')
        console.error('error', error);
        console.error('=====================')
        //we will not throw error so that user can still see his question
        // but the question will not be searchable by vector search
        // so it will not be recommended to other users

        await storeQuestionVector({
            questionId: creationResult.id,
            sourceText,
            embedding: [],
            status: 'failed'
        }).catch((e) => console.error("failed to save failed status:", e))
    }

    return { question: creationResult }; // we send it to controller  for frontend

}

// ! =======================================
//used inside // * getQuestionsService[T-10], 
//it builds the SQL WHERE clause dynamically based on filters passed
/**
 * T-10: Build the WHERE clause and params array for the list-questions query.
 * Supports optional `search` (matches title OR content) and `mine` (own questions).
 */

const buildQuestionFilters = filters => {
    const conditions = [];
    const params = [];

    if (filters.search) {
        // Search filter is optional — only applied when ?search=<keyword> is present
        conditions.push(`(q.title LIKE ? OR q.content LIKE ?)`);//LIKE operator is used to search for pattern inside text : it asks does this search value appears in title or content of the question in db : LIKE %search% means search's value can appear anywher in the text : in sql db its case-sensitive, so we dont need normalize the text that comes from user b/se we used COLLATE=utf8mb4_unicode_ci when we crete the tablle : ci means case-insensitive so The collation handles the case comparison for you.
        const searchTerm = `%${filters.search}%`; // any text starts with %search% or ends with %search% or contains %search% in the middle
        params.push(searchTerm, searchTerm);// the first is for title and second is for content
    }

    if (filters.mine && filters.userId) {
        // Mine filter is optional — only applied when ?mine=true and user is authenticated
        conditions.push(`q.user_id = ?`);//when u select questions only add 'my questions' conditon if mine is truthy and userid exists to show the user's only questions 
        params.push(filters.userId);
    }

    if (conditions.length === 0) {
        // When no filters were provided, return an empty WHERE clause so the query selects all rows
        return { whereClause: '', params };// to prevent WHERE if no condioons cause we use where to set cdn for our selection , instead if no conditions just select all by removing the where clause
    }

    // *  if there are cdns:-
    return {
        whereClause: `WHERE ${conditions.join(' AND ')}`,
        params,
    };
};

// ! =================================

// # Task: List Questions[T-10]
//GET /api/questions
export const getQuestionsService = async (filters) => {
    // Query tuning constants — fixed limit and sort order for the question list
    const normalizedLimit = 100;
    const sortColumn = 'q.created_at';
    const normalizedSortOrder = 'DESC';



    // Build WHERE clause + bound params from the incoming filters
    const { whereClause, params } = buildQuestionFilters(filters);

    // SQL query: joins users for author info and LEFT JOINs answers to count responses
    const listSql = `SELECT q.question_id AS id, 
    q.question_hash AS questionHash,
    q.title, 
    q.content,
    q.created_at AS createdAt,
    q.updated_at AS updatedAt,
    u.user_id AS userId,
    u.first_name AS firstName,
    u.last_name AS lastName,
    COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id 
    LEFT JOIN answers a ON a.question_id = q.question_id
    ${whereClause}
    GROUP BY q.question_id, u.user_id
    ORDER BY ${sortColumn} ${normalizedSortOrder}
    LIMIT ${normalizedLimit}
    `// COUNT: counts how many answeres for that question are there; DISTINCT: is used to prevent duplicate answer IDs from being counted if joins later cause duplicated rows
    // GROUP BY: is needed because we are using an aggregate function COUNT() . it gives  one result per question/user combination and count the answers belonging to that question.
    //JOIN: connects the question to the user who created it. and its an inner join, so a question must have a matching user to appear in the result.
    //LEFT JOIN: ensures that a question appears in the results even if it has no answers (the count will be 0).    

    // Execute the query with bound parameters to prevent SQL injection
    const rows = await safeExecute(listSql, params);

    return {
        // Transform each DB row into the API response shape (nested author object)
        data: rows.map(question => ({
            id: question.id,
            questionHash: question.questionHash,
            title: question.title,
            content: question.content,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
            author: {
                id: question.userId,
                firstName: question.firstName,
                lastName: question.lastName,
            },

        })),
        // Include pagination and sort metadata alongside the question list
        meta: {
            limit: normalizedLimit,
            total: rows.length,
            sortBy: "newest",
            sortOrder: normalizedSortOrder,
        },
    };
};

// ! ==================================
// # Task: Get Single Question Details[T-10] AND  # Task: AI Answer Fit Evaluation[T-18]
// GET /api/questions/:questionHash AND POST /api/questions/:questionHash/answer-fit
export const getSingleQuestionService = async ({ questionHash, includeAnswers = true }) => {
    //console.log('service questionHsh:' , questionHash);
    const normalizedAnswerLimit = 100;

    
    const questionSql = `SELECT 
    q.question_id AS id,
    q.question_hash AS questionHash,
    q.title, 
    q.content,
    q.created_at AS createdAt,
    q.updated_at AS updatedAt,
    u.user_id AS userId,
    u.first_name AS firstName,
    u.last_name AS lastName,
    COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id 
    LEFT JOIN answers a ON a.question_id = q.question_id
    WHERE q.question_hash = ?
    GROUP BY q.question_id, u.user_id
    `;
    //a question must have a matching user to apper on the resuklt because its an inner join

    //console.log('questionsql:', questionSql);
    //console.log('questionHash:', questionHash);

    const questionRows = await safeExecute(questionSql, [questionHash]);// its array of array and inside the array, the first array is the actual row of table so we access it with questionRows[0]

    //console.log('questionresult:', questionRows);

    if (questionRows.length === 0) {
        throw new NotFoundError("Question not found")
    }
    //when getsingleQuestionService called from getSingleQuestionController questionHash only passes as parameter so it takes default icludeAnswers: true
    //when its called in the assessAnswerAgainstQuestionController it is passed {includeAnswers: false},so !false=true
    if (!includeAnswers) {
        return {
            question: questionRows[0],//returns only the question
        };
    }

    const question = questionRows[0];
    const questionId = question.id;

    //console.log('questionId:', questionId);


    //fetch answeres
    const answerSql = `SELECT
    a.answer_id AS id,
    a.content,
    a.created_at AS createdAt,
    a.updated_at AS updatedAt,
    au.user_id AS userId,
    au.first_name AS firstName,
    au.last_name AS lastName
    FROM answers a
    JOIN users au ON au.user_id = a.user_id
    WHERE a.question_id = ?
    ORDER BY a.created_at DESC
    LIMIT ${normalizedAnswerLimit}
    `;
    // answer must have a matching user to apper on the result because its an inner join

    //console.log('answerSql:', answerSql);

    const answers = await safeExecute(answerSql, [questionId]);

    //console.log('answer:', answers);
    return {
        question: {
            id: question.id,
            questionHash: question.questionHash,
            title: question.title,
            content: question.content,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
            author: {
                id: question.userId,
                firstName: question.firstName,
                lastName: question.lastName,
            },
            answerCount: question.answerCount,
        },
        answers: answers.map(answer => ({
            id: answer.id,
            content: answer.content,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
            author: {
                id: answer.userId,
                firstName: answer.firstName,
                lastName: answer.lastName,
            },

        })),
        answersMeta: {
            limit: normalizedAnswerLimit,
            total: answers.length,
        },
    };


};
/* the request was: http://localhost:3777/api/questions/eaf196b6ad4e977f
and i got the json below from postman
{
    "success": true,
    "message": "Question fetched successfully",
    "question": {
        "id": 2,
        "questionHash": "eaf196b6ad4e977f",
        "title": "How to handle API rate limits when streaming responses from OpenAI GPT-4 in Node.js?",
        "content": "I am building a Node.js backend that forwards stream responses from OpenAI's API to my frontend using Server-Sent Events (SSE).\n\nUnder high traffic, I hit 429 Too Many Requests errors. What is the recommended strategy for managing rate limits and retries without dropping the client stream connection?\n\nHere is my current setup:\n```javascript\nconst response = await openai.chat.completions.create({\n    model: \"gpt-4\",\n    messages: [{ role: \"user\", content: prompt }],\n    stream: true,\n});\n```",
        "createdAt": "2026-09-13T08:59:30.000Z",
        "updatedAt": "2026-09-13T08:59:30.000Z",
        "author": {
            "id": 2,
            "firstName": "kebede",
            "lastName": "abebe"
        },
        "answerCount": 0
    },
    "answers": [],
    "answersMeta": {
        "limit": 100,
        "total": 0
    }
}
*/




//========================================
// ! semantic search : find semantically similar questions to the user's query (new text typed by the user) - from existing questions in db  
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search
export const searchQuestionsSemanticService = async ({ query, k, threshold }) => {
    //  normalizing the  query to  get the optimized embedding
    const sourceText = normalizeQuestionText({ title: query });//the question comes from user as a query

    const vectorConfig = getVectorConfig(); // it returns the recommended default threshold and k from env 
    const searchThreshold = threshold !== undefined ? threshold : vectorConfig.recommendThreshold; // if the user doesn't provide threshold then use the default value

    const result = await findSimilarQuestionsByText({ sourceText, threshold: searchThreshold, k: k });//find the similar questions

    return {
        data: result.similarQuestions,
        meta: {
            query,
            k,
            threshold: searchThreshold,
            total: result.similarQuestions.length
        },
    };

};

//========================================
// # Task: AI Answer Fit Evaluation[T-18]
// POST /api/questions/:questionHash/answer-fit
export const assessAnswerAgainstQuestionsService = async ({ questionTitle, questionContent, answerText }) => {
    //we are saying for ai that we gonna give u the  draft answer , title of the question and content of the question so do userPrompt/system-prompt for the answer to check the relevance and completeness of the answer not the factuality of the answer.
    const userPrompt = `you review whether a forum draft addresses the QUESTION(relevance and completeness of engagement - not whether the answer is factually correct),
    QUESTION TITLE: ${questionTitle}
    QUESTION CONTENT: ${questionContent}
    ANSWER DRAFT: ${answerText}

    Reply with ONLY valid JSON(no markdown forces), exactly this shape: {
    "level":"strong"|"partial"|"weak", 
    "note":"one short sentence"}
    RULES: 
    - level :"strong" if the draft clearly engages with the question; "partial" if somewhat related but missing key parts of the ask; "weak" if mostly off-topic or too vague, 
    - note: one sentence, plain language, no markdown, under 200 characters, frame as fit/relevance, not grading.
    `;

    try {
        const raw = await fetchGeminiJsonTextResponse(userPrompt);

        console.log('"Gemini response received"');

        const parsed = parseJsonObjectGeminiText(raw);

        console.log("Gemini JSON parsed successfully");

        const levelRaw = parsed?.level;
        const noteRaw = parsed?.note;
        const level = levelRaw === 'strong' || levelRaw === 'partial' || levelRaw === 'weak' ? levelRaw : 'partial';//if it hallucinates and gives other thing than these three values, make it partial by default 
        const note = typeof noteRaw === 'string' && noteRaw.trim() ? noteRaw.trim().slice(0, 280) : 'could not summarize fit; trat this as partial match.';
        return { level, note };
    } catch (error) {
        console.error('assessAnswerAgainstQuestionService:', error);
        throw new ServiceUnavailableError('AI fit check is temporarily unavailable, please try again later');
    }
};
/**i got: {
    "success": true,
    "message": "Answer assessed successfully",
    "level": "weak",
    "note": "This draft discusses database caching instead of handling OpenAI API rate limits and streaming retries."
} */



//============================================
// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
export const getSimilarQuestionsService = async ({ questionHash, k, threshold }) => {

    const vectorConfig = getVectorConfig();
    const searchThreshold = threshold !== undefined ? threshold : vectorConfig.recommendThreshold;


    const result = await findSimilarQuestionsByQuestionHash({ questionHash, threshold: searchThreshold, k });

    return {
        data: result.similarQuestions,
        meta: {
            total: result.similarQuestions.length,
            k: result.k,
            threshold: result.threshold,
            query: null,
            questionHash: result.questionHash,
        },
    };


};

