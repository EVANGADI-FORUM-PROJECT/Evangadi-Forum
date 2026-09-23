import express from "express";
import { createDocumentController, searchInDocumentController , queryDocumentController, getDocumentMetaController, getDocumentFileController , listDocumentsController, deleteDocumentController } from "../controller/rag.controller.js";
import { uploadDocument } from "../config/rag.upload.config.js";
import { authenticateUser } from "../../../middleware/authentication.js";
import { searchDocumentValidation, queryDocumentValidation , documentIdParamValidation1, documentIdParamValidation2 , deleteDocumentValidation } from "../validation/rag.validation.js";

const router = express.Router();

router.post("/documents", authenticateUser,uploadDocument, createDocumentController)




// # Task: Semantic Search in RAG Document[T-23]
//Endpoint: GET /api/rag/documents/:documentId/search
//Which parts of this document are relevant to the user's question
// * /search finds the context
router.get("/documents/:documentId/search",authenticateUser,searchDocumentValidation, searchInDocumentController )

// # Task: List My RAG Documents[T-24]
// Endpoint: GET /api/rag/documents
router.get("/documents", authenticateUser, listDocumentsController)



// ! ======================
// # Task: AI Query Grounded in RAG Document[T-23]
// Endpoint: POST /api/rag/documents/:documentId/query
//Using those relevant parts of the document, what is the answer to the user's question?
//It internally does semantic search again, gets the relevant chunks, then builds a prompt
// * /query uses that context to generate the answer
router.post("/documents/:documentId/query", authenticateUser,queryDocumentValidation,queryDocumentController  )



// # Task: Get RAG Document Metadata[T-24]
//Endpoint: GET /api/rag/documents/:documentId
router.get("/documents/:documentId",authenticateUser, documentIdParamValidation1  ,getDocumentMetaController  )

// # Task: Stream RAG Document PDF[T-24]
//Endpoint: GET /api/rag/documents/:documentId/file
router.get("/documents/:documentId/file", authenticateUser, documentIdParamValidation2, getDocumentFileController );


// # Task: Delete RAG Document
// Endpoint: DELETE /api/rag/documents/:documentId
router.delete("/documents/:documentId", authenticateUser, deleteDocumentValidation, deleteDocumentController);


export default router;
