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
    throw new Error("embedding must be an array of numbers"); // NAN has typeof 'number' so checks not NAN to be safe
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
  const { questionId, sourceText, embedding, status = "ready" } = payload;

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
    // ! execute the insertion query safely
    await safeExecute(insertVectorSql, [
      questionId,
      sourceText,
      embedding,
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
    const rows = await safeExecute(sql, ["ready"]); // rows returned from the db structurally looks like [{}, {}, ...] so like [{questionId: 1, embedding: [0.1, 0.2, ..., 0.768]}, {questionId: 2, embedding: [0.1, 0.2, ..., 0.768]}, ...]

    const embeddings = [];

    //iterates over the rows to give us each object
    for (const row of rows) {
      try {
        const embedding =
          typeof row.embedding === "string"
            ? JSON.parse(row.embedding)
            : row.embedding; // db stores arrays of floats as JSON strings; this line converts it back to js array so now the embedding = [0.1, 0.2, ...]

        //add valid embedding to result
        embeddings.push({
          questionId: row.question_id,
          embedding: embedding,
        }); //so the final embeddings = [
        // {questionId: 1, embedding: [0.1, 0.2, ...]},
        // {questionId: 2, embedding: [0.1, 0.2, ...]}, ...
        // ]
      } catch (parseError) {
        console.warn(
          `skipping question  ${row.question_id}: failed to parse embedding JSON`,
          parseError,
        );
      } //this try catch is to catch the parsing error and skip the question or log the warning and continue if it fails the parsing if it was string
    }
    return embeddings; //its array of arrays and each array has questionId and embedding it looks like: [[{questionId: 1, embedding: [0.1, 0.2, ...]},
    // {questionId: 2, embedding: [0.1, 0.2, ...]}, ...
    // ]
  } catch (error) {
    console.error("== mysql retrive embeddings query error ==");
    console.error("operation: retriveReadyEmbeddings");
    console.error("error:", error);
    console.error("============");
    return null; // returning sth predictable to service
  } //this try cath cath the db connection /query errors, but not parsing errors
}

//==========================================================
// ! semantic search : find semantically similar questions to the user's query (new text typed by the user) - from existing questions in db
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search
export async function findSimilarQuestionsByText({ sourceText, threshold, k }) {
  const normalizedK = k > 0 ? Math.min(k, 20) : RECOMMEND_K; //it k is > 20 it will take 20 if < 20 but > 0 it will take k : Math.min() takes two or more numbers and returns the smallest one
  const normalizedThreshold =
    threshold >= 0 && threshold <= 1 ? threshold : RECOMMEND_THRESHOLD;

  let embeddingResult; // its the input question's embedding vector value
  try {
    embeddingResult = await generatingQuestionEmbedding(sourceText, {
      taskType: "RETRIEVAL_QUERY",
    }); //the returned value is object so embeddingResult= {embedding: [...]}

    // console.log("embddingResult from findSimilarQuestionsByText", embeddingResult)
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

  const queryEmbedding = embeddingResult.embedding; // the array of 768 floating point values representing the question

  //console.log("queryEmbedding", queryEmbedding);

  let storedEmbeddings; //array of objects each having questionId and embedding
  try {
    storedEmbeddings =
      await retrieveReadyEmbeddings(); /*we are retriving all embeddings of questions which have status = "ready"(means embedding was generated successfully ) to compare it with the current input question's embedding to find similar questions so storedEmbedding = [
               questionId: 1, embedding: [0.1, 0.2, ...]}, 
               questionId: 2, embedding: [0.1, 0.2, ...]}, ...
            ]
            its length is equal to the number of questions with ready embedding  in db*/

    //console.log("storedEmbeddings", storedEmbeddings);
  } catch (error) {
    console.error(
      "== database error during searching for simmilar questions ==",
    );
    console.error("Operation: findSimilarQuestionByText");
    console.error("search text:", sourceText);
    console.error("error:", error);
    console.error("============");
    throw error;
  } // this trycatch handles the errors during retriving the ready embeddings from the db , so if it fails we cant find simmilar questions but we can try again and again

  // * calculate cosine similarity for each stored embedding that are retrived above  with the current questions embedding
  const similarities = [];
  for (const stored of storedEmbeddings) {
    try {
      const score = calculateCosineSimilarity(queryEmbedding, stored.embedding); //score returned as a float value between -1 to 1 then we will filter them by threshold

      //filter by threshold
      if (score >= normalizedThreshold) {
        similarities.push({
          questionId: stored.questionId,
          score: score,
        });
      } // so similarity look like [
      // { questionId: 1, score: 0.862779517178009 },
      // { questionId: 2, score: 0.829517178009 },
      // ...
      // ] respective to the current user question query
    } catch (error) {
      console.warn(
        `failed to caculate similarity for questions ${stored.questionId}`,
        error.message,
      );
      continue; //if one of the calculation fails continue
    }
  }
  //console.log("similarities", similarities);//if similarities [] don go to sorting just return empty array here cause there is nothing to sort
  if (similarities.length === 0) {
    return {
      ...embeddingResult,
      similarQuestions: [],
    }; // i got this from postman :
    /**{
    "success": true,
    "message": "Questions fetched successfully using semantic search",
    "data": [],
    "meta": {
        "query": "how mysql works",
        "k": 0,
        "threshold": 0.75,
        "total": 0
    }
} */
  }

  //sort by score descending
  similarities.sort((a, b) => b.score - a.score); //[
  //a is { questionId: 1, score: 0.862779517178009 },
  // b is { questionId: 2, score: 0.829517178009 },
  // ...
  // ] the result is interpreted roughly like this:
  // Result	          Meaning
  // < 0	           Put a before b
  // > 0	           Put b before a
  // 0	           Keep them equal
  // so it will be sorted in descending order of similarity scores so the most similar questions will be at the top

  //limit to top k results
  const topResults = similarities.slice(0, normalizedK); // to take parts of array from index 0 to normalizedK, topResult look like [ { questionId: 2, score: 0.862779517178009 },{ questionId: 5, score: 0.829517178009 },...] up to normalizedK length

  //console.log("topResults", topResults);

  if (topResults.length === 0) {
    return {
      ...embeddingResult, //Keep everything that was already inside embeddingResult ,its the current questions vector representation so we return it as it is cosidering that no similar questions are found
      similarQuestions: [], //no similar questions found so we return empty array
    };
  }

  //fetch questions details using IN clause
  const questionIds = topResults.map((r) => r.questionId); // it returns array of question ids like[2, 5, ...]
  const placeholders = questionIds.map(() => "?").join(","); // we can create sth new for each element of questionIds using map() so (?,? based on the number of results )so if questionIds = [2,5] then placeholders = (?, ?)

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
    //Iterates over each database record (row) returned by our query array (rows).
    //we are explicitly converting questionmap obj key to string cause object keys are always strings injs and row.questionId is number (id) that comes from db to prevent unexpected behavior/bug(object keys in js are converted to strings internally anyway)
    //for each row(its obj) from db we create new obj structure for every question and store each question inside questionMap using its Id as key:-- key(string num): value(obj format) that inculdes all the fields we selected in our sql query
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
    };
  });

  //return results with scores, preserving sort order : refer the tasks to see the format
  const similarQuestions = topResults
    .filter((result) => questionMap[String(result.questionId)])
    .map((result) => ({
      score: Number(result.score.toFixed(6)),
      ...questionMap[String(result.questionId)],
    })); //filter removes any result from topResults that doesn't have a corresponding questionId in questionMap , map then transform each remaining result into the final desired format looks like this : [
  /*{
    score: 0.946186,//its number cause we said number(result.score.toFixed(6)) to make it decimal with 6 places
    questionId: 1,// from db
    questionHash: 'a1b2c3d4',
    title: 'Why do we need AI?',
    content: 'I want to understand the importance of AI...',
    createdAt: '2023-10-26T10:00:00.000Z',
    updatedAt: '2023-10-26T11:00:00.000Z',
    author: { // we put these fields together in author obj
      id: 101,
      firstName: 'John',
      lastName: 'Doe',
    },//so all in all we get  similarQuestions in descending order based on score so the first one has highest score
   },
 ]*/

  return {
    ...embeddingResult, //
    similarQuestions,
  };
}
//i got this from postman by making k=4 and threshold =0.4 &  this willbe sent to frontend
/*
{
    "success": true,
    "message": "Questions fetched successfully using semantic search",
    "data": [
        {
            "score": 0.701091,
            "questionId": 1,
            "questionHash": "0e90eb832652e948",
            "title": "How MySQL Drivers Connect Node.js to our Database",
            "content": "Architecture Overview:Explain what a MySQL driver actually is (a JS wrapper communicating via MySQL Client/Server Protocol over TCP).How the driver interfaces with the Node.js Event Loop and non-blocking I/O layer (`net` module).Connection Lifecycle & Pool Mechanics: Explain the difference between single connections vs. Connection Pools (`mysql.createPool`).What happens internally when `db.getConnection()`, `connection.query()`, and `connection.release()` are called? How connection queueing works when all pool connections are busy.",
            "createdAt": "2026-09-12T22:50:38.000Z",
            "updatedAt": "2026-09-12T22:50:38.000Z",
            "author": {
                "id": 1,
                "firstName": "abebe",
                "lastName": "kebede"
            }
        },
        {
            "score": 0.504967,
            "questionId": 2,
            "questionHash": "eaf196b6ad4e977f",
            "title": "How to handle API rate limits when streaming responses from OpenAI GPT-4 in Node.js?",
            "content": "I am building a Node.js backend that forwards stream responses from OpenAI's API to my frontend using Server-Sent Events (SSE).\n\nUnder high traffic, I hit 429 Too Many Requests errors. What is the recommended strategy for managing rate limits and retries without dropping the client stream connection?\n\nHere is my current setup:\n```javascript\nconst response = await openai.chat.completions.create({\n    model: \"gpt-4\",\n    messages: [{ role: \"user\", content: prompt }],\n    stream: true,\n});\n```",
            "createdAt": "2026-09-13T08:59:30.000Z",
            "updatedAt": "2026-09-13T08:59:30.000Z",
            "author": {
                "id": 2,
                "firstName": "kebede",
                "lastName": "abebe"
            }
        }
    ], */

//=======================================
// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
//similarity of an existing question
export const findSimilarQuestionsByQuestionHash = async ({
  questionHash,
  threshold: searchThreshold,
  k,
}) => {
  // ! Normalize k and threshold
  const normalizedK = k > 0 ? Math.min(k, 20) : RECOMMEND_K;
  const normalizedThreshold =
    searchThreshold >= 0 && searchThreshold <= 1
      ? searchThreshold
      : RECOMMEND_THRESHOLD;

  // ! Getting the question ID from the hash
  //first get the questionHash's q_id then get the embedding from q_vectors table by using q_id
  let questionId;
  try {
    let sql = `SELECT question_id FROM questions WHERE question_Hash = ? `;
    const rows = await safeExecute(sql, [questionHash]);

    //console.log("getting question_id for hash", questionHash, ":", rows);

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
  // ! Get the source embedding
  let sourceEmbedding;
  try {
    let sql = `SELECT embedding FROM question_vectors WHERE question_id = ? AND status = ?`;

    const row = await safeExecute(sql, [questionId, "ready"]); //returns array of object [ {embedding:[0.1, 0.2, ...]} ]
    //   console.log("EMBEDDING QUERY RESULT:", row);
    //   console.log("IS ARRAY:", Array.isArray(row));

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

  // console.log("all retrived embdikngs:", allStoredEmbeddings);
  // console.log("is allStoredEmbeddings is an array:", Array.isArray(allStoredEmbeddings));

  if (!Array.isArray(allStoredEmbeddings)) {
    throw new Error("Failed to retrieve ready embeddings");
  }

  // ! exculde source question
const otherEmbeddings = allStoredEmbeddings.filter(
    (singleEmbedding) => singleEmbedding.questionId !== questionId,
  );

  // ! calculate similarities
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
  similarities.sort((a, b) => b.score - a.score); //  similarities = [{ questionId: 2, score: 0.94 },{ questionId: 7, score: 0.91 },{ questionId: 4, score: 0.86 },{ questionId: 9, score: 0.81 },{ questionId: 3, score: 0.78 }];

  const topResults = similarities.slice(0, normalizedK); //its array of normaizedk lrngth if it is 3 : topResults = [{ questionId: 2, score: 0.94 },{ questionId: 7, score: 0.91 },{ questionId: 4, score: 0.86 }];

  //console.log("top results:", topResults);// was giving me [] and error from postman {"msg": "Cannot read properties of undefined (reading 'length')"} its from topResults.length cause i was returning similarities : [] and the getSimlarQuestionsSevice  cant do total: result.similarQuestions.length,

  if (topResults?.length === 0) {
    return {
      similarQuestions: [],
    };
  } /**i got : {
    "success": true,
    "message": "Similar questions fetched successfully",
    "data": [],
    "meta": {
        "total": 0, 
        "query": null}
    } */

  // ! Fetch the actual questions with score of >= threshold & k
  const questionIds = topResults.map((result) => result.questionId); //questionIds = [2, 7, 4];
  //console.log('questionIds:', questionIds);

  const placeholders = questionIds.map(() => "?").join(","); //placeholders = (?,?,?)
  //console.log('placeholders:', placeholders);

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
    rows = await safeExecute(sql, [
      questionIds,
    ]); /**it may return like this:-  rows = [
                    {
                        questionId: 2,
                        questionHash: "aaa...",
                        title: "JWT authentication",
                        content: "...",
                        userId: 5,
                        firstName: "John",
                        lastName: "Doe",
                        answerCount: 3
                    },
                    {
                        questionId: 7,
                        questionHash: "bbb...",
                        title: "Token authentication",
                        content: "...",
                        userId: 8,
                        firstName: "Sarah",
                        lastName: "Smith",
                        answerCount: 1
                    },
                    {
                        questionId: 4,
                        questionHash: "ccc...",
                        title: "OAuth vs JWT",
                        content: "...",
                        userId: 3,
                        firstName: "Mike",
                        lastName: "Lee",
                        answerCount: 5
                    }
                ];

       */
  } catch (error) {
    console.error("== mysql error fetching top similar questions ==");
    console.error(
      "Operation: findSimilarQuestionsByQuestionHash - final query",
    );
    console.error("error:", error);

    throw error;
  }

  // ! map db questions
  //as we see the score is in js and the question info from db so lets combine both using the score from js to the question info from db using the questionId as the key : it results in
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
  //so questionMap lookes like :
  /*questionMap = {
    "2": {
        id: 2,
        title: "JWT authentication",
        ...
    },

    "7": {
        id: 7,
        title: "Token authentication",
        ...
    },

    "4": {
        id: 4,
        title: "OAuth vs JWT",
        ...
    }
};*/

  // ! filter  questions by topResults
  const similarQuestions = topResults
    .filter(
      (result) => questionMap[String(result.questionId)], //Does questionMap have questionId 2? YES → keep it so we are checking if db actually returned detailes for each questionId of topResults ena this filter keeps only the actual rresults that successfully retrived
      //we have [{ questionId: 2, score: 0.94 },{ questionId: 4, score: 0.86 }] lets say questionId: 7 isnt retrived
    )
    .map((result) => ({
      ...questionMap[String(result.questionId)],
      score: Number(result.score.toFixed(6)),
    })); /* For:result = {questionId: 2, score: 0.94 } we find: questionMap["2"]--> 
    {
        id: 2,
        questionHash: "aaa...",
        title: "JWT authentication",
        content: "...",
        answerCount: 3,
        author: {
            id: 5,
            firstName: "John",
            lastName: "Doe"
        }
    } ---> then ...questionMap["2"] copies all those prperties into a new object--> and score: Number(result.score.toFixed(6)) addrd the cosine scote
     * final will looks like {
    id: 2,
    questionHash: "aaa...",
    title: "JWT authentication",
    content: "...",
    answerCount: 3,
    author: {
        id: 5,
        firstName: "John",
        lastName: "Doe"
    },
    score: 0.94
}


*/

  // ! return the filtered similar questions
  return {
    similarQuestions, //its array of objects
    k: normalizedK,
    threshold: normalizedThreshold,
    questionHash,
  };
};
