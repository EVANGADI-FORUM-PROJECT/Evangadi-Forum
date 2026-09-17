import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function normalizeWhiteSpace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeQuestionText({ title }) {
  return normalizeWhiteSpace(`${title || ""}`.normalize("NFKC").toLowerCase());
}

function validateEmbedding(embedding) {
  if (!Array.isArray(embedding)) {
    throw new Error("embedding must be an array");
  }
  if (embedding.length === 0) {
    throw new Error("embedding can't be empty");
  }
  if (!embedding.every((v) => typeof v === "number" && !isNaN(v))) {
    throw new Error("embedding must be an array of numbers");
  }
}

// vid-14 #29:30 -> calculating the cosine similarity
function calculateCosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error("embedded vectors are not equal");
  }
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (denominator === 0) {
    return 0;
  }
  return dotProduct / denominator;
}

//generating vector embeding
export async function generatingQuestionEmbedding(sourceText, options = {}) {
  const { taskType = "RETRIEVAL_DOCUMENT", questionId = null } = options;

  try {
    const response = await ai.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: sourceText,
      config: {
        outputDimensionality: 768,
        taskType: taskType,
      },
    });

    const values = response?.embeddings?.[0]?.values;

    if (!Array.isArray(values) || values.length == 0) {
      throw new Error("invalid embedding returned by Gemini API");
    }
    return { embedding: values };
  } catch (error) {
    console.error("error:", error);
    console.error("=================");
    throw error;
  }
}

//====================================
export async function storeQuestionVector(payload) {
  //extract payload fields from payload
  const { questionId, sourceText, embedding, status = "ready" } = payload;

  //handle empty embeddigs for failed status
  if (status === "failed" || !embedding || embedding.length === 0) {
    const sql = `INSERT INTO question_vectors(question_id, source_text,embedding, status) VALUES (?,?,?,?)
        ON DUPLICATE KEY UPDATE 
        source_text=VALUES(source_text),  
        embedding=VALUES(embedding), 
        status=VALUES(status), 
        updated_at = CURRENT_TIMESTAMP`;

    await safeExecute(sql, [
      questionId,
      sourceText,
      JSON.stringify([]),
      "failed",
    ]);
    return;
  }

  validateEmbedding(embedding);

  const insertVectorSql = `INSERT INTO QUESTION_VECTORS (question_id, source_text, embedding, status) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        source_text=VALUES(source_text),  
        embedding=VALUES(embedding), 
        status=VALUES(status), 
        updated_at = CURRENT_TIMESTAMP`;

  try {
    await safeExecute(insertVectorSql, [
      questionId,
      sourceText,
      JSON.stringify(embedding),
      status,
    ]);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError("question does not exist");
    }

    throw error;
  }
}

//=======================threshold & k from .env ======================//
const RECOMMEND_THRESHOLD = Number(process.env.RECOMMEND_THRESHOLD);
const RECOMMEND_K = Number(process.env.RECOMMEND_K);

export function getVectorConfig() {
  return {
    recommendThreshold: RECOMMEND_THRESHOLD,
    recommendK: RECOMMEND_K,
  };
}

//==========================================
async function retrieveReadyEmbeddings() {
  const sql = `SELECT question_id, embedding 
        FROM question_vectors
        WHERE status = ? `;

  try {
    const rows = await safeExecute(sql, ["ready"]);

    const embeddings = [];

    for (const row of rows) {
      try {
        const embedding =
          typeof row.embedding === "string"
            ? JSON.parse(row.embedding)
            : row.embedding;

        embeddings.push({
          questionId: row.question_id,
          embedding: embedding,
        });
      } catch (parseError) {
        console.warn(
          `skipping question  ${row.question_id}: failed to parse embedding JSON`,
          parseError,
        );
      }
    }
    return embeddings;
  } catch (error) {
    console.error("== mysql retrive embeddings query error ==");
    console.error("operation: retriveReadyEmbeddings");
    console.error("error:", error);
    console.error("============");
    return null;
  }
}

//==========================================================
// ! semantic search : find semantically similar questions to the user's query (new text typed by the user) - from existing questions in db
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search
export async function findSimilarQuestionsByText({ sourceText, threshold, k }) {
  const normalizedK = k > 0 ? Math.min(k, 20) : RECOMMEND_K;
  const normalizedThreshold =
    threshold >= 0 && threshold <= 1 ? threshold : RECOMMEND_THRESHOLD;

  let embeddingResult;
  try {
    embeddingResult = await generatingQuestionEmbedding(sourceText, {
      taskType: "RETRIEVAL_QUERY",
    });
  } catch (error) {
    console.error("== gemini api error during search ==");
    console.error("Question: findSimilarQuestionByText");
    console.error("search test :", sourceText);
    console.error("error:", error);
    console.error("==============");
    throw new ServiceUnavailableError(
      "failed to generate embedding for search query. please try again later.",
    );
  }

  const queryEmbedding = embeddingResult.embedding;

  let storedEmbeddings;
  try {
    storedEmbeddings = await retrieveReadyEmbeddings();
    if (!Array.isArray(storedEmbeddings)) {
      throw new Error("Failed to retrieve ready embeddings");
    }
  } catch (error) {
    console.error(
      "== database error during searching for simmilar questions ==",
    );
    console.error("Operation: findSimilarQuestionByText");
    console.error("search text:", sourceText);
    console.error("error:", error);
    console.error("============");
    throw error;
  }

  const similarities = [];
  for (const stored of storedEmbeddings) {
    try {
      const score = calculateCosineSimilarity(queryEmbedding, stored.embedding);

      if (score >= normalizedThreshold) {
        similarities.push({
          questionId: stored.questionId,
          score: score,
        });
      }
    } catch (error) {
      console.warn(
        `failed to caculate similarity for questions ${stored.questionId}`,
        error.message,
      );
      continue;
    }
  }

  if (similarities.length === 0) {
    return {
      ...embeddingResult,
      similarQuestions: [],
    };
  }

  similarities.sort((a, b) => b.score - a.score);
  const topResults = similarities.slice(0, normalizedK);

  if (topResults.length === 0) {
    return {
      ...embeddingResult,
      similarQuestions: [],
    };
  }

  //fetch questions details using IN clause
  const questionIds = topResults.map((r) => r.questionId);
  const placeholders = questionIds.map(() => "?").join(",");

  const sql = `SELECT 
    q.question_id AS questionId,
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
    WHERE q.question_id IN (${placeholders})
    GROUP BY q.question_id, u.user_id
    `;
  let rows;
  try {
    rows = await safeExecute(sql, questionIds);
  } catch (error) {
    console.error("== mysql error fetching top similar questions ==");
    console.error("Operation: findSimilarQuestionsByText - final query");
    console.error("error:", error);
    console.error("============");
    throw error;
  }

  //map mysql results to question object
  const questionMap = {};
  rows.forEach((row) => {
    questionMap[String(row.questionId)] = {
      questionId: row.questionId,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
      answerCount: Number(row.answerCount || 0),
    };
  });

  const similarQuestions = topResults
    .filter((result) => questionMap[String(result.questionId)])
    .map((result) => ({
      score: Number(result.score.toFixed(6)),
      ...questionMap[String(result.questionId)],
    }));

  return {
    ...embeddingResult, //
    similarQuestions,
  };
}

//=======================================
// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
//similarity of an existing question
export const findSimilarQuestionsByQuestionHash = async ({
  questionHash,
  threshold: searchThreshold,
  k,
}) => {
  const normalizedK = k > 0 ? Math.min(k, 20) : RECOMMEND_K;
  const normalizedThreshold =
    searchThreshold >= 0 && searchThreshold <= 1
      ? searchThreshold
      : RECOMMEND_THRESHOLD;

  let questionId;
  try {
    let sql = `SELECT question_id FROM questions WHERE question_Hash = ? `;
    const rows = await safeExecute(sql, [questionHash]);

    if (rows.length === 0) {
      return {
        similarities: [],
        reason: "QUESTION_NOT_FOUND",
      };
    }
    questionId = rows[0].question_id;
  } catch (error) {
    console.error("== mysql error finding question by hash ==");
    console.error(
      "Operation: findSimilarQuestionsByQuestionHash - question lookup",
    );
    console.error("questionHash:", questionHash);
    console.error("error:", error);
    console.error("============");
    throw error;
  }

  let sourceEmbedding;
  try {
    let sql = `SELECT embedding FROM question_vectors WHERE question_id = ? AND status = ?`;

    const row = await safeExecute(sql, [questionId, "ready"]);

    if (row.length === 0) {
      return {
        similarities: [],
        reason: "EMBEDDING_NOT_FOUND",
      };
    }

    sourceEmbedding =
      typeof row[0].embedding === "string"
        ? JSON.parse(row[0].embedding)
        : row[0].embedding;
  } catch (error) {
    console.error("== mysql error getting source question embedding ==");
    console.error(
      "Operation: findSimilarQuestionsByQuestionHash - source embedding",
    );
    console.error("questionId:", questionId);
    console.error("error:", error);
    console.error("============");

    throw error;
  }

  // ! Retrieve all embeddings
  const allStoredEmbeddings = await retrieveReadyEmbeddings(); //array of objects

  if (!Array.isArray(allStoredEmbeddings)) {
    throw new Error("Failed to retrieve ready embeddings");
  }

  const otherEmbeddings = allStoredEmbeddings.filter(
    (singleEmbedding) => singleEmbedding.questionId !== questionId,
  );

  const similarities = [];

  for (const stored of otherEmbeddings) {
    try {
      const score = calculateCosineSimilarity(
        sourceEmbedding,
        stored.embedding,
      );

      if (score >= normalizedThreshold) {
        similarities.push({
          questionId: stored.questionId,
          score,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to calculate similarity for question ${stored.questionId}`,
        error.message,
      );

      continue;
    }
  }

  // ! sort scores
  similarities.sort((a, b) => b.score - a.score);

  const topResults = similarities.slice(0, normalizedK);

  if (topResults?.length === 0) {
    return {
      similarQuestions: [],
    };
  }

  const questionIds = topResults.map((result) => result.questionId);

  const placeholders = questionIds.map(() => "?").join(",");

  const sql = `
    SELECT 
        q.question_id AS questionId,
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
         JOIN users u
            ON u.user_id = q.user_id
         LEFT JOIN answers a
            ON a.question_id = q.question_id
         WHERE q.question_id IN (${placeholders})
         GROUP BY q.question_id, u.user_id
   `;

  let rows;

  try {
    rows = await safeExecute(sql, questionIds);
  } catch (error) {
    console.error("== mysql error fetching top similar questions ==");
    console.error(
      "Operation: findSimilarQuestionsByQuestionHash - final query",
    );
    console.error("error:", error);

    throw error;
  }

  const questionMap = {};

  rows.forEach((row) => {
    questionMap[String(row.questionId)] = {
      id: row.questionId,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: Number(row.answerCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    };
  });

  // ! filter  questions by topResults
  const similarQuestions = topResults
    .filter((result) => questionMap[String(result.questionId)])
    .map((result) => ({
      ...questionMap[String(result.questionId)],
      score: Number(result.score.toFixed(6)),
    }));

  return {
    similarQuestions,
    k: normalizedK,
    threshold: normalizedThreshold,
    questionHash,
  };
};
