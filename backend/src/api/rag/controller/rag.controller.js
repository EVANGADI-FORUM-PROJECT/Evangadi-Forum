import {
  createDocumentFromUploadService,
  searchInDocumentService,
  queryDocumentService,
  getDocumentMetaService,
  getAssertOwnedDocumentPathService,
  listDocumentsForUserService,
  deleteDocumentService,
} from "../service/rag.service.js";

/*
 * MILESTONE 3 — RAG BACKEND CONTROLLERS
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
 * Controller implementations intentionally removed.
 * Keep the Express request/response flow and implement each controller
 * according to the task documentation.
 */

export const createDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required.",
      });
    }

    const document = await createDocumentFromUploadService(
      req.file,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      message: "Document uploaded and processed.",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const searchInDocumentController = async (req, res, next) => {
  try {
        const documentId = req.params.documentId;
        const searchQuery = req.query.query;
        const k = req.query.k ? Number(req.query.k) : undefined;
        const userId = req.user.id;

        const results = await searchInDocumentService(
            documentId,
            searchQuery,
            k,
            userId
        );

        res.status(200).json({
            success: true,
            message: 'Ranked chunk excerpts',
            data: {
                query: searchQuery,
                results
            }
        });
        
  } catch (error) {
    next(error);
  }
};

export const queryDocumentController = async (req, res, next) => {
  // TODO [T-23]: Read documentId/query/userId, call the RAG query service, return answer + citations.
  throw new Error("TODO: Implement T-23 query controller");
};

export const getDocumentFileController = async (req, res, next) => {
  try {
    const result = await getAssertOwnedDocumentPathService(
      req.params.documentId,
      req.user.id,
    );
    return res.sendFile(result.filePath);
  } catch (error) {
    next(error);
  }
};
export const listDocumentsController = async (req, res, next) => {
  try {
    const result = await listDocumentsForUserService(req.user.id);
    res.status(200).json({
      success: true,
      message: "Documents fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};