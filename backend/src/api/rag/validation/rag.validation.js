import {body, query, param} from "express-validator";
import {validationErrorHandler} from "../../../middleware/validation-handler.js";

export let searchDocumentValidation = [
    param('documentId')
        .isInt()
        .withMessage('documentId must be an integer'),

    query('query')
        .trim()
        .notEmpty()
        .withMessage('query is required'),

    query('k')
        .optional()
        .isInt({ min: 1 })
        .withMessage('k must be a positive integer'),
    validationErrorHandler
];

export const queryDocumentValidation=[
    body("query")
    .trim()
    .notEmpty()
    .withMessage("query is required")
    .isString()
    .withMessage("query must be string"),

    param("documentId")
    .isInt()
    .withMessage('documentId must be an integer'),
    validationErrorHandler
]

export const documentIdParamValidation1 =[
    param("documentId")
    .isInt()
    .withMessage('documentId must be an integer'),
    validationErrorHandler
]

export const documentIdParamValidation2 =[
    param("documentId")
    .isInt()
    .withMessage('documentId must be an integer'),
    validationErrorHandler
]

export const deleteDocumentValidation =[
    param("documentId")
    .isInt()
    .withMessage('documentId must be an integer'),
    validationErrorHandler
]