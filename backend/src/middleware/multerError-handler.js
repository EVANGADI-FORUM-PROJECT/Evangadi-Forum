/*
 * TASK: T-22 — Upload & Process RAG Document
 *
 * TODO: Implement createDocumentMulterErrorHandler so Multer errors
 * (especially file-size and invalid-file errors) return a useful 400 response.
 */

export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  // TODO [T-22]: Handle Multer errors and pass non-Multer errors to Express.
  throw new Error("TODO: Implement T-22 Multer error handler");
};
