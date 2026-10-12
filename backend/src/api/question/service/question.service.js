import crypto from 'crypto'; //for generating random hash its built in node crypto module 
import { BadRequestError, ForbiddenError, NotFoundError, ServiceUnavailableError } from "../../../utils/errors/index.js";
import { safeExecute } from "../../../../db/config.js"
import { findSimilarQuestionsByQuestionHash, findSimilarQuestionsByText, generatingQuestionEmbedding, getVectorConfig, storeQuestionVector, normalizeQuestionText , } from "./vector.service.js"
import {fetchGeminiJsonTextResponse, parseJsonObjectGeminiText}from"./geminiTextCoach.service.js"
import { notifyNewQuestion } from "../../notification/service/notification.service.js"


const generateQuestionHash = () => crypto.randomBytes(8).toString('hex') //  gives unique string for every question 

// # Task: Create Question & Auto-Embed[T-9]
// POST /api/questions
export const createQuestionWithVectorService = async payload => {
    
    const { userId, authorFirstName, title, content } = payload; 

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

    // Fire-and-forget: notification failures must never break question creation.
    notifyNewQuestion({
        questionId,
        questionHash,
        title,
        authorId: userId,
        authorFirstName,
    });

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
    if (filters.savedOnly && filters.userId) {
        conditions.push(`EXISTS (SELECT 1 FROM saved_questions sq WHERE sq.question_id = q.question_id AND sq.user_id = ?)`);
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
    const normalizedLimit = Number.isInteger(Number(filters.limit)) && Number(filters.limit) > 0 ? Math.min(Number(filters.limit), 100) : 100;
    const offset = Number.isInteger(Number(filters.offset)) && Number(filters.offset) >= 0 ? Number(filters.offset) : 0;
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
    u.avatar AS avatar,
    COUNT(DISTINCT a.answer_id) AS answerCount,
    EXISTS(SELECT 1 FROM saved_questions sq WHERE sq.question_id = q.question_id AND sq.user_id = ?) AS isSaved
    FROM questions q
    JOIN users u ON u.user_id = q.user_id 
    LEFT JOIN answers a ON a.question_id = q.question_id
    ${whereClause}
    GROUP BY q.question_id, u.user_id
    ORDER BY ${sortColumn} ${normalizedSortOrder}, q.question_id DESC
    LIMIT ${normalizedLimit} OFFSET ${offset}
    `   

    const rows = await safeExecute(listSql, [filters.userId || 0, ...params]);
    const counts = await safeExecute(`SELECT COUNT(*) AS total FROM questions q ${whereClause}`, params);
    const total = Number(counts[0].total);

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
                avatar: question.avatar,
            },
            answerCount: Number(question.answerCount || 0),
            isSaved: Boolean(question.isSaved),
        })),
        meta: {
            limit: normalizedLimit,
            offset,
            total,
            hasMore: offset + rows.length < total,
            sortBy: "newest",
            sortOrder: normalizedSortOrder,
        },
    };
};

// ! ==================================
// # Task: Get Single Question Details[T-10] AND  # Task: AI Answer Fit Evaluation[T-18]
// GET /api/questions/:questionHash AND POST /api/questions/:questionHash/answer-fit
export const getSingleQuestionService = async ({ questionHash, includeAnswers = true, userId }) => {
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
    u.avatar AS avatar,
    COUNT(DISTINCT a.answer_id) AS answerCount,
    EXISTS(SELECT 1 FROM saved_questions sq WHERE sq.question_id = q.question_id AND sq.user_id = ?) AS isSaved
    FROM questions q
    JOIN users u ON u.user_id = q.user_id 
    LEFT JOIN answers a ON a.question_id = q.question_id
    WHERE q.question_hash = ?
    GROUP BY q.question_id, u.user_id
    `;
   

    const questionRows = await safeExecute(questionSql, [userId || 0, questionHash]);


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
    au.last_name AS lastName,
    au.avatar AS avatar
    , (SELECT COUNT(*) FROM answer_likes al WHERE al.answer_id = a.answer_id) AS likeCount
    , EXISTS(SELECT 1 FROM answer_likes al WHERE al.answer_id = a.answer_id AND al.user_id = ?) AS likedByMe
    FROM answers a
    JOIN users au ON au.user_id = a.user_id
    WHERE a.question_id = ?
    ORDER BY a.created_at DESC
    LIMIT ${normalizedAnswerLimit}
    `;
   

    const answers = await safeExecute(answerSql, [userId || 0, questionId]);

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
                avatar: question.avatar,
            },
            answerCount: question.answerCount,
            isSaved: Boolean(question.isSaved),
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
                avatar: answer.avatar,
            },
            likeCount: Number(answer.likeCount || 0),
            likedByMe: Boolean(answer.likedByMe),

        })),
        answersMeta: {
            limit: normalizedAnswerLimit,
            total: answers.length,
        },
    };


};

export const updateQuestionService = async ({ questionHash, userId, title, content }) => {
    const rows = await safeExecute('SELECT question_id, user_id FROM questions WHERE question_hash = ? LIMIT 1', [questionHash]);
    if (!rows.length) throw new NotFoundError('Question not found');
    if (rows[0].user_id !== userId) throw new ForbiddenError('You can only edit your own question.');
    await safeExecute('UPDATE questions SET title = ?, content = ? WHERE question_id = ?', [title, content, rows[0].question_id]);
    const sourceText = normalizeQuestionText({ title });
    try {
        const embedded = await generatingQuestionEmbedding(sourceText);
        await storeQuestionVector({ questionId: rows[0].question_id, sourceText, embedding: embedded.embedding, status: 'ready' });
    } catch (error) {
        console.warn('Question updated, but its semantic search vector could not be refreshed:', error.message);
    }
    return { questionHash, title, content };
};

export const deleteQuestionService = async ({ questionHash, userId }) => {
    const rows = await safeExecute('SELECT question_id, user_id FROM questions WHERE question_hash = ? LIMIT 1', [questionHash]);
    if (!rows.length) throw new NotFoundError('Question not found');
    if (rows[0].user_id !== userId) throw new ForbiddenError('You can only delete your own question.');
    await safeExecute('DELETE FROM questions WHERE question_id = ?', [rows[0].question_id]);
};

export const toggleSavedQuestionService = async ({ questionHash, userId, saved }) => {
    const rows = await safeExecute('SELECT question_id FROM questions WHERE question_hash = ? LIMIT 1', [questionHash]);
    if (!rows.length) throw new NotFoundError('Question not found');
    if (saved) {
        await safeExecute('INSERT IGNORE INTO saved_questions (user_id, question_id) VALUES (?, ?)', [userId, rows[0].question_id]);
    } else {
        await safeExecute('DELETE FROM saved_questions WHERE user_id = ? AND question_id = ?', [userId, rows[0].question_id]);
    }
    return { saved };
};

export const getSavedQuestionsService = async (userId) => getQuestionsService({ userId, savedOnly: true });



//========================================
// ! semantic search : find semantically similar questions to the user's query (new text typed by the user) - from existing questions in db  
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search
export const searchQuestionsSemanticService = async ({ query, k, threshold, limit, offset = 0 }) => {
    const sourceText = normalizeQuestionText({ title: query });

    const vectorConfig = getVectorConfig(); 
    const searchThreshold = threshold !== undefined ? threshold : vectorConfig.recommendThreshold; 

    const result = await findSimilarQuestionsByText({ sourceText, threshold: searchThreshold, k: k, limit, offset });

    return {
        data: result.similarQuestions,
        meta: {
            query,
            k,
            threshold: searchThreshold,
            limit: limit || result.similarQuestions.length,
            offset: Number(offset),
            total: result.total ?? result.similarQuestions.length,
            hasMore: Number(offset) + result.similarQuestions.length < (result.total ?? result.similarQuestions.length)
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
