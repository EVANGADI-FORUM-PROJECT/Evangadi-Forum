/*
 * MILESTONE 3 — RAG FRONTEND SERVICE
 *
 * TASKS:
 * T-22 — Upload PDF
 * T-24 — List / Delete / Fetch PDF
 * T-23 — Semantic Search / Ask AI
 *
 * TODO: Implement these API calls using the project's apiClient.
 * Reference: M-3/Front end/rag-documents/task-rag-documents.md
 */

export const ragService = {
  listDocuments: async () => {
    // TODO [T-24]: GET /api/rag/documents
    throw new Error("TODO: Implement T-24 listDocuments");
  },

  uploadPdf: async (file) => {
    // TODO [T-22]: POST /api/rag/documents using multipart/form-data.
    throw new Error("TODO: Implement T-22 uploadPdf");
  },

  deleteDocument: async (documentId) => {
    // TODO [T-24]: DELETE /api/rag/documents/:documentId
    throw new Error("TODO: Implement T-24 deleteDocument");
  },

  searchInDocument: async (documentId, query, k) => {
    // TODO [T-23]: GET /api/rag/documents/:documentId/search
    throw new Error("TODO: Implement T-23 searchInDocument");
  },

  queryDocument: async (documentId, query) => {
    // TODO [T-23]: POST /api/rag/documents/:documentId/query
    throw new Error("TODO: Implement T-23 queryDocument");
  },

  fetchPdfObjectUrl: async (documentId) => {
    // TODO [T-24]: GET /api/rag/documents/:documentId/file and create a Blob URL.
    throw new Error("TODO: Implement T-24 fetchPdfObjectUrl");
  },
};
