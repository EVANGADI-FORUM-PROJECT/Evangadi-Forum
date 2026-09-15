import e from "express";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";
import { safeExecute } from "../../../../db/config.js";

const getQuestionOwner = async (questionId) => {
  const rows = await safeExecute(
    `SELECT question_id, user_id FROM questions WHERE question_id=? LIMIT 1`,
    [questionId],
  );
  if (rows.length === 0) {
    throw new NotFoundError("Question not found");
  }
  return rows[0];
};

const mapAnswer = (row) => {
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
    },
  };
};

export const getSingleAnswerService = async (answerId) => {
  const sql = `SELECT a.answer_id AS id,
    a.question_id AS questionId,
    a.content,
    a.created_at AS createdAt,
    a.updated_at AS updatedAt,
    u.user_id AS userId,
    u.first_name AS firstName,
    u.last_name AS lastName
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    WHERE a.answer_id = ?
    LIMIT 1
    `;
  const rows = await safeExecute(sql, [answerId]);
  if (rows.length === 0) {
    throw new NotFoundError("Answer not found");
  }
  return mapAnswer(rows[0]);
};
//=====================================
// # Task: Create Answer [T-12]
// POST: /api/answers
