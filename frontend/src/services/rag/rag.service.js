import { apiClient } from "../core/api.client.js";

// Same helper style as question.service.js: pick the best message the
// backend sent, otherwise use our own friendly fallback.
function getMessage(error, fallback) {
  return (
    error.response?.data?.msg ||
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    fallback
  );
}

const BASE = "/api/rag/documents";

/** GET /api/rag/documents */
export async function listDocuments() {
  try {
    const response = await apiClient.get(BASE);
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, "Could not load documents."));
  }
}

/**
 * POST /api/rag/documents  (multipart/form-data)
 * TODO: 'file' must match the backend's multer field name,
 * e.g. upload.single('file').
 */
export async function uploadPdf(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(BASE, formData, {
      // Needed if apiClient defaults to JSON, otherwise Axios would turn the
      // FormData into JSON. The browser still adds the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, "Upload failed. Please try again."));
  }
}

/** DELETE /api/rag/documents/:documentId */
export async function deleteDocument(documentId) {
  try {
    const response = await apiClient.delete(`${BASE}/${documentId}`);
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, "Could not delete this document."));
  }
}

/** GET /api/rag/documents/:documentId/search?query=... */
export async function searchInDocument(documentId, query) {
  try {
    const response = await apiClient.get(`${BASE}/${documentId}/search`, {
      params: { query },
    });
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, "Search failed."));
  }
}

/** POST /api/rag/documents/:documentId/query   body: { query } */
export async function queryDocument(documentId, query) {
  try {
    const response = await apiClient.post(`${BASE}/${documentId}/query`, {
      query,
    });
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, "Could not get an answer."));
  }
}

/**
 * GET /api/rag/documents/:documentId/file
 * Downloads the PDF as a Blob and returns a temporary blob: URL string for
 * <iframe src>. The CALLER must revoke it with URL.revokeObjectURL
 * (RagPreview.jsx does this).
 */
export async function fetchPdfObjectUrl(documentId) {
  try {
    const response = await apiClient.get(`${BASE}/${documentId}/file`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(getMessage(error, "Could not load the PDF preview."));
  }
}

// Same shape as questionService, in case you prefer ragService.listDocuments().
export const ragService = {
  listDocuments,
  uploadPdf,
  deleteDocument,
  searchInDocument,
  queryDocument,
  fetchPdfObjectUrl,
};
