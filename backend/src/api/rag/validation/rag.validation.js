/*
 * MILESTONE 3 — RAG VALIDATION
 *
 * T-23:
 * - Validate documentId, query and optional k for semantic search.
 * - Validate documentId and query for AI-grounded query.
 *
 * T-24:
 * - Validate documentId for metadata, file and delete endpoints.
 *
 * Reference: M-3/Backend/rag/*.md
 */

export const searchDocumentValidation = [
  // TODO [T-23]: Add express-validator rules for GET /documents/:documentId/search.
];

export const queryDocumentValidation = [
  // TODO [T-23]: Add express-validator rules for POST /documents/:documentId/query.
];

export const documentIdParamValidation1 = [
 param("documentId")
    .isInt()
    .withMessage('documentId must be an integer'),
    validationErrorHandler
];

export const documentIdParamValidation2 = [
 param("documentId")
    .isInt()
    .withMessage('documentId must be an integer'),
    validationErrorHandler
];

export const deleteDocumentValidation = [
  param("documentId").isInt().withMessage("documentId must be an integer"),
  validationErrorHandler,
];
