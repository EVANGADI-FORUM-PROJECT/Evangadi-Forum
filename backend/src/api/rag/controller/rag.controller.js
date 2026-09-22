import {
    createDocumentFromUploadService,
    searchInDocumentService,
    queryDocumentService,
    getDocumentMetaService,
    getAssertOwnedDocumentPathService,
    listDocumentsForUserService,
    deleteDocumentService
} from '../service/rag.service.js';

// Task: Upload & Process RAG Document [T-22]
// Endpoint: POST /api/rag/documents
export const createDocumentController = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'PDF file is required.'
            });
        }

        const document = await createDocumentFromUploadService(
            req.file,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Document uploaded and processed.',
            data: document
        });
    } catch (error) {
        next(error);
    }
};

// Task: Semantic Search in RAG Document [T-23]
// Endpoint: GET /api/rag/documents/:documentId/search
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

// Task: AI Query Grounded in RAG Document [T-23]
// Endpoint: POST /api/rag/documents/:documentId/query
export const queryDocumentController = async (req, res, next) => {
    try {
        const documentId = req.params.documentId;
        const searchQuery = req.body.query;
        const userId = req.user.id;

        const result = await queryDocumentService(
            documentId,
            searchQuery,
            userId
        );

        res.status(200).json({
            success: true,
            message: 'Answer and citations',
            data: {
                answer: result.answer,
                citations: result.citations,
                chunksUsed: result.chunksUsed
            }
        });
    } catch (error) {
        next(error);
    }
};

// Task: Get RAG Document Metadata [T-24]
// Endpoint: GET /api/rag/documents/:documentId
export const getDocumentMetaController = async (req, res, next) => {
    try {
        const document = await getDocumentMetaService(
            req.params.documentId,
            req.user.id
        );

        res.status(200).json({
            success: true,
            message: 'Document fetched successfully.',
            data: document
        });
    } catch (error) {
        next(error);
    }
};

// Task: Stream RAG Document PDF [T-24]
// Endpoint: GET /api/rag/documents/:documentId/file
export const getDocumentFileController = async (req, res, next) => {
    try {
        const result = await getAssertOwnedDocumentPathService(
            req.params.documentId,
            req.user.id
        );

        return res.sendFile(result.filePath);
    } catch (error) {
        next(error);
    }
};

// Task: List My RAG Documents [T-24]
// Endpoint: GET /api/rag/documents
export const listDocumentsController = async (req, res, next) => {
    try {
        const result = await listDocumentsForUserService(req.user.id);

        res.status(200).json({
            success: true,
            message: 'Documents fetched successfully.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Task: Delete RAG Document [T-24]
// Endpoint: DELETE /api/rag/documents/:documentId
export const deleteDocumentController = async (req, res, next) => {
    try {
        const result = await deleteDocumentService(
            req.params.documentId,
            req.user.id
        );

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
