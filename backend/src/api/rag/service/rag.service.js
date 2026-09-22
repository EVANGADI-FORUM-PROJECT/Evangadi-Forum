/*createDocumentFromUploadService must first save the file information and create the document record with status = 'processing'*/
import { safeExecute } from "../../../../db/config.js";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { generateQuestionEmbedding } from "../../../utils/ai/embedding.js";
import { chunkText } from "../../../utils/rag/chunk.js";
import {
  normalizeQueryText,
  getVectorConfig,
  calculateCosineSimilarity,
} from "../../../utils/rag/vector.js";
import { answerFromRagChunks } from "../../../utils/rag/answer.js";
import { NotFoundError } from "../../../utils/errors/index.js";
import path from "path";

/*
 * MILESTONE 3 — RAG BACKEND SERVICES
 *
 * TASKS:
 * T-22 — Upload & Process RAG Document
 * T-23 — Semantic Search in RAG Document
 * T-23 — AI Query Grounded in RAG Document
 * T-24 — Get RAG Document Metadata
 * T-24 — Stream RAG Document PDF
 * T-24 — List My RAG Documents
 * T-24 — Delete RAG Document
 *
 * The implementation has intentionally been removed.
 * Write the service logic from the Milestone 3 task specifications.
 */

export let createDocumentFromUploadService = async (file, userId) => {
  //first check if user has uploaded more than 20 docs
  let countSql = `
    SELECT COUNT(*) AS documentCount
    FROM documents
    WHERE user_id = ?
    `;

  let countRows = await safeExecute(countSql, [userId]);

  console.log("countRows:", countRows);

  let maxPerUser = Number(process.env.RAG_MAX_PDFS_PER_USER);

  if (countRows[0].documentCount >= maxPerUser) {
    throw new Error("You have reached the maximum number of PDFs.");
  }

  //inser doc as processsing  if user doc isnt macx

  let title = file.originalname;
  let mimeType = file.mimetype;
  let storagePath = file.path;
  let byteSize = file.size;

  let sql = `
        INSERT INTO documents
        (user_id, title, mime_type, storage_path, byte_size, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
  let documentResult;
  try {
    documentResult = await safeExecute(sql, [
      userId,
      title,
      mimeType,
      storagePath,
      byteSize,
      "processing",
    ]);
    //console.log("result",documentResult);
  } catch (error) {
    console.log("error fron mysql when processing", error);
    throw error;
  }

  let documentId = documentResult.insertId;

  try {
    let pdfBuffer = await fs.readFile(storagePath); //pdfbuffef is bytes of our pdf

    let pdfData = new PDFParse({ data: pdfBuffer }); // it turns the bytes to parser-object so we can extract information from it.

    let result = await pdfData.getText();

    let text = result.text;

    await pdfData.destroy(); // clean up parser to our backend  process many PDFs. Without proper cleanup, resources used by the parser could remain allocated longer than necessary. so we say "I'm finished with this PDF parser; clean up what you were using"

    let minTextLength = Number(
      process.env.RAG_MIN_TEXT_CHARS || process.env.RAG_TEXT_CHARS || 50,
    );
    if (text.length < minTextLength) {
      throw new Error("PDF does not contain enough usable text.");
    }
    //console.log("text", text);

    let chunks = chunkText(text, chunkSize, overlap);
    //console.log("chunks", chunks);

    let chunkPerDoc = Number(process.env.RAG_MAX_CHUNKS_PER_DOC);
    if (chunks.length > chunkPerDoc) {
      throw new Error("Document contains too many chunks.");
    }

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];

      let chunkResult;

      let chunkSql = `
        INSERT INTO document_chunks
        (document_id, chunk_index, content)
        VALUES (?, ?, ?)
        `;

      chunkResult = await safeExecute(chunkSql, [documentId, i, chunk]);

      let embedding = await generateQuestionEmbedding(chunk, {
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,
      });

      let vectorSql = `
            INSERT INTO document_chunk_vectors
            (chunk_id, source_text, embedding, status)
            VALUES (?, ?, ?, ?)
        `; //we can do database transaction so the chunk/vector inserts can be rolled back if processing fails.we can save chunks in memory and only insert them at the end (so we dont insert partial data into the database when something fails).we should also wrap the file reading and chunking into a transaction.

      await safeExecute(vectorSql, [
        chunkResult.insertId,
        chunk,
        JSON.stringify(embedding),
        "ready",
      ]);
    }

    let updateSql = `
            UPDATE documents
            SET status = ?
            WHERE document_id = ?
        `;

    await safeExecute(updateSql, ["ready", documentId]);

    return {
      document_id: documentId,
      title: title,
      mime_type: mimeType,
      byte_size: byteSize,
      status: "ready",
      storage_path: storagePath,
      user_id: userId,
    };
  } catch (error) {
    let errorSql = `
        UPDATE documents
        SET status = ?, error_message = ?
        WHERE document_id = ?
    `;
    await safeExecute(errorSql, ["failed", error.message, documentId]);

    throw error;
  }
};

export const searchInDocumentService = async (
  documentId,
  searchQuery,
  k,
  userId,
) => {
  // TODO [T-23]: Implement semantic search over the document's chunk embeddings.
  throw new Error("TODO: Implement T-23 semantic search");
};

export const queryDocumentService = async (documentId, searchQuery, userId) => {
  // TODO [T-23]: Implement RAG query generation using retrieved document chunks.
  throw new Error("TODO: Implement T-23 RAG query");
};

export const getDocumentMetaService = async (documentId, userId) => {
  const sql = `
        SELECT
            document_id,
            title,
            mime_type,
            byte_size,
            status,
            error_message,
            created_at,
            updated_at,
            user_id,
            storage_path
        FROM documents
        WHERE document_id = ?
          AND user_id = ?
    `;

    const rows = await safeExecute(sql, [documentId, userId]);

    if (rows.length === 0) {
        throw new NotFoundError('Document not found.');
    }

    return rows[0];
};

export const getAssertOwnedDocumentPathService = async (documentId, userId) => {
  const sql = `
        SELECT storage_path, mime_type
        FROM documents
        WHERE document_id = ?
          AND user_id = ?
    `;

     const rows = await safeExecute(sql, [documentId, userId]);

      if (rows.length === 0) {
        throw new NotFoundError("No document found for this user.");
      }
const filePath = path.resolve(rows[0].storage_path);

};

export const listDocumentsForUserService = async (userId) => {
  const sql = `
        SELECT
            document_id,
            title,
            mime_type,
            byte_size,
            status,
            error_message,
            created_at,
            updated_at
        FROM documents
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

  return await safeExecute(sql, [userId]);
}; 
export const deleteDocumentService = async (documentId, userId) => {
  const document = await getAssertOwnedDocumentPathService(documentId, userId);

  try {
    await fs.unlink(document.filePath);
  } catch (error) {
    // A missing file should not prevent deletion of its database record.
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const deleteSql = `
        DELETE FROM documents
        WHERE document_id = ?
          AND user_id = ?
    `;

  await safeExecute(deleteSql, [documentId, userId]);

  return { id: Number(documentId) };
};

