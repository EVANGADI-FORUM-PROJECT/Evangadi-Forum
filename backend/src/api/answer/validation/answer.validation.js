import {body, param, query} from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const createAnswerValidation = [
    body('questionId')
        .notEmpty()
        .withMessage('Question ID is required')
        .isInt({min: 1})
        .withMessage('Question ID must be a positive integer')
        .toInt(),
    body('content')
        .notEmpty()
        .withMessage('Answer content is required')
        .isString()
        .withMessage('Answer content must be a string')
        .isLength({min: 20})
        .withMessage('Answer content must be at least 50 characters long'),
    validationErrorHandler
] 



export const getAnswerValidation = [
    query('questionId')
        .notEmpty()
        .withMessage('Question ID is required')
        .isInt()
        .withMessage('Question ID must be a number')
        .toInt(),
    query("sortBy")
        .optional()
        .isIn(["newest", "oldest"])
        .withMessage("sortBy must be either newest or oldest"),

    validationErrorHandler
    

]