import e from "express";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../utils/errors/index.js";
import { safeExecute } from "../../../../db/config.js";
import { notifyNewAnswer } from "../../notification/service/notification.service.js";

const getQuestionOwner = async (questionId)=>{
    const rows = await safeExecute(`SELECT question_id, user_id FROM questions WHERE question_id=? LIMIT 1`, [questionId] );
    if(rows.length ===0){
        throw new NotFoundError("Question not found");
    }
    return rows[0];
}

const mapAnswer=(row)=>{
    return {
        id: row.id,
        questionId: row.questionId,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
            id: row.userId,
            firstName: row.firstName,
            lastName: row.lastName,
            avatar: row.avatar
        },
        likeCount: Number(row.likeCount || 0)
    }
}

export const getSingleAnswerService = async (answerId)=>{
    const sql = `SELECT a.answer_id AS id,
    a.question_id AS questionId,
    a.content,
    a.created_at AS createdAt,
    a.updated_at AS updatedAt,
    u.user_id AS userId,
    u.first_name AS firstName,
    u.last_name AS lastName,
    u.avatar AS avatar,
    (SELECT COUNT(*) FROM answer_likes al WHERE al.answer_id = a.answer_id) AS likeCount
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    WHERE a.answer_id = ?
    LIMIT 1
    `
    const rows = await safeExecute(sql, [answerId]);
    if(rows.length === 0){
        throw new NotFoundError("Answer not found")
    }
    return mapAnswer(rows[0]);
}
//=====================================
// # Task: Create Answer [T-12]
// POST: /api/answers
export const createAnswerService= async({questionId,content,userId,answererFirstName})=>{
    const question = await getQuestionOwner(questionId);
    if(question.user_id === userId){
        throw new BadRequestError("you can not answer your own answer");// infronend we dont show answering box if the answerer and owner are same. 

    }
    const inserSql = `INSERt INTO answers (question_id, user_id, content)
    VALUES(?,?,?)`;
    const result = await safeExecute(inserSql, [questionId, userId, content]);

    // Fire-and-forget: notification failures must never break answer creation.
    notifyNewAnswer({
        questionId,
        answerId: result.insertId,
        recipientUserId: question.user_id,
        answererFirstName,
    });

    return getSingleAnswerService(result.insertId);
}

const getAnswerOwner = async (answerId) => {
    const rows = await safeExecute('SELECT answer_id, user_id FROM answers WHERE answer_id = ? LIMIT 1', [answerId]);
    if (!rows.length) throw new NotFoundError('Answer not found');
    return rows[0];
};

export const updateAnswerService = async ({ answerId, userId, content }) => {
    const answer = await getAnswerOwner(answerId);
    if (answer.user_id !== userId) throw new ForbiddenError('You can only edit your own answer.');
    await safeExecute('UPDATE answers SET content = ? WHERE answer_id = ?', [content, answerId]);
    return getSingleAnswerService(answerId);
};

export const deleteAnswerService = async ({ answerId, userId }) => {
    const answer = await getAnswerOwner(answerId);
    if (answer.user_id !== userId) throw new ForbiddenError('You can only delete your own answer.');
    await safeExecute('DELETE FROM answers WHERE answer_id = ?', [answerId]);
};

export const toggleAnswerLikeService = async ({ answerId, userId, liked }) => {
    await getAnswerOwner(answerId);
    if (liked) await safeExecute('INSERT IGNORE INTO answer_likes (answer_id, user_id) VALUES (?, ?)', [answerId, userId]);
    else await safeExecute('DELETE FROM answer_likes WHERE answer_id = ? AND user_id = ?', [answerId, userId]);
    const rows = await safeExecute('SELECT COUNT(*) AS likeCount FROM answer_likes WHERE answer_id = ?', [answerId]);
    return { liked, likeCount: Number(rows[0].likeCount || 0) };
};
