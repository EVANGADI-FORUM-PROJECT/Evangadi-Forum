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

export const createDocumentFromUploadService = async (file, userId) => {
  // TODO [T-22]: Implement PDF upload, parsing, chunking, embedding and DB storage.
  throw new Error("TODO: Implement T-22");
};

export const searchInDocumentService = async (documentId, searchQuery, k, userId) => {
  // TODO [T-23]: Implement semantic search over the document's chunk embeddings.
  throw new Error("TODO: Implement T-23 semantic search");
};

export const queryDocumentService = async (documentId, searchQuery, userId) => {
  // TODO [T-23]: Implement RAG query generation using retrieved document chunks.
  throw new Error("TODO: Implement T-23 RAG query");
};

export const getDocumentMetaService = async (documentId, userId) => {
  // TODO [T-24]: Fetch document metadata after verifying ownership.
  throw new Error("TODO: Implement T-24 metadata");
};

export const getAssertOwnedDocumentPathService = async (documentId, userId) => {
  // TODO [T-24]: Verify ownership and return the absolute PDF path.
  throw new Error("TODO: Implement T-24 PDF file streaming");
};

export const listDocumentsForUserService = async (userId) => {
  // TODO [T-24]: Return the authenticated user's RAG documents.
  throw new Error("TODO: Implement T-24 document listing");
};

export const deleteDocumentService = async (documentId, userId) => {
  // TODO [T-24]: Verify ownership, delete the PDF, then delete the DB record.
  throw new Error("TODO: Implement T-24 document deletion");
};
