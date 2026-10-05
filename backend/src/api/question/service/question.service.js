import crypto from 'crypto'; //for generating random hash its built in node crypto module 
import { BadRequestError, NotFoundError, ServiceUnavailableError } from "../../../utils/errors/index.js";
import { safeExecute } from "../../../../db/config.js"
import { findSimilarQuestionsByQuestionHash, findSimilarQuestionsByText, generatingQuestionEmbedding, getVectorConfig, storeQuestionVector, normalizeQuestionText , } from "./vector.service.js"
import {fetchGeminiJsonTextResponse, parseJsonObjectGeminiText}from"./geminiTextCoach.service.js"


const generateQuestionHash = () => crypto.randomBytes(8).toString('hex') //  gives unique string for every question 

// # Task: Create Question & Auto-Embed[T-9]
// POST /api/questions
export const createQuestionWithVectorService = async payload => {
    
    const { userId, title, content } = payload; 

    const insertQuestionsql = 'INSERT INTO QUESTIONS (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)';

    //generate a unique hash for the question
    const questionHash = generateQuestionHash();
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
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            throw new BadRequestError("user does not exist");
        } 
        throw error

    }

    //retrive the auto-generated ID of the question
    const questionId = questionResult.insertId;

    
    const creationResult = {
        id: questionId,
        questionHash,
        title,
        content,
        userId
    }

    const sourceText = normalizeQuestionText({
        title: payload.title
    });

    try {
        const embeddingResult = await generatingQuestionEmbedding(sourceText, { questionId: creationResult.id });

        
        if (!embeddingResult || !Array.isArray(embeddingResult.embedding) || embeddingResult.embedding.length === 0) {
            throw new Error('gemini Api did not return valid embedding')
        }
       

   
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
const buildQuestionFilters = filters => {
    const conditions = [];
    const params = [];

    if (filters.search) {
        conditions.push(`(q.title LIKE ? OR q.content LIKE ?)`);
        const searchTerm = `%${filters.search}%`; 
        params.push(searchTerm, searchTerm);
    }

    if (filters.mine && filters.userId) {
        conditions.push(`q.user_id = ?`);
        params.push(filters.userId);
    }

    if (conditions.length === 0) {
        return { whereClause: '', params };
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
    const normalizedLimit = 100;
    const sortColumn = 'q.created_at';
    const normalizedSortOrder = 'DESC';



    const { whereClause, params } = buildQuestionFilters(filters);

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
    `   

    const rows = await safeExecute(listSql, params);

    return {
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
            answerCount: Number(question.answerCount || 0),
        })),
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
   

    const questionRows = await safeExecute(questionSql, [questionHash]);


    if (questionRows.length === 0) {
        throw new NotFoundError("Question not found")
    }
    
    if (!includeAnswers) {
        return {
            question: questionRows[0],
        };
    }

    const question = questionRows[0];
    const questionId = question.id;

    


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
   

    const answers = await safeExecute(answerSql, [questionId]);

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



//========================================
// ! semantic search : find semantically similar questions to the user's query (new text typed by the user) - from existing questions in db  
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search
export const searchQuestionsSemanticService = async ({ query, k, threshold }) => {
    
    const sourceText = normalizeQuestionText({ title: query });

    const vectorConfig = getVectorConfig(); 
    const searchThreshold = threshold !== undefined ? threshold : vectorConfig.recommendThreshold; 

    const result = await findSimilarQuestionsByText({ sourceText, threshold: searchThreshold, k: k });

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

