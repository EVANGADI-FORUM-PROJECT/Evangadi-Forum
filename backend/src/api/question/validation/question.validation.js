import { body, query, param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

//[T-9]
export const createQuestionValidation = [
    //checks the request body title
    body("title")
        .notEmpty()
        .withMessage("Question title is required")
        .isString()
        .withMessage("Question title must be a string")
        .isLength({ min: 5, max: 255 })
        .withMessage("Question title must be between 5 and 255 characters")
        .trim(),

    body("content")
        .notEmpty()
        .withMessage("Question content is required")
        .isString()
        .withMessage("Question content must be a string")
        .isLength({ min: 10 })
        .withMessage("Question content must be at least 10 characters")
        .trim(),
    validationErrorHandler,
]

//[T-10]
export const getQuestionsValidation = [
    query("search")
        .optional() // means search is not mandatory if not provided
        .isString()
        .withMessage("Search query must be a string")
        .trim(),
    query("mine")
        .optional()
        .isBoolean() // is it boolean 
        .withMessage("Mine must be a boolean")
        .trim(),
    validationErrorHandler,
]

// export const getSingleQuestionValidation = [
//     param("question")
// ]

//[T-11]
export const searchQuestionsSemanticValidation = [
    query("query")
        .notEmpty()
        .withMessage("Search query is required")
        .isString()
        .withMessage("Search query must be a string")
        .isLength({ min: 5 })
        .withMessage("Search query must be at least 5 characters")
        .trim(),

    query("k")
        .optional()
        .isInt()
        .withMessage("k must be an integer")
        .toInt(),

    query("threshold")
        .optional()
        .isFloat({ min: 0, max: 1 }) // min 0 and max 1
        .withMessage("threshold must be a floating point number between 0 and 1")
        .toFloat(), //converting the string to float or number

    validationErrorHandler,
]


export const getSingleQuestionValidation = [
    param("questionHash")
        .isString()
        .withMessage("Question hash must be a string")
        .matches(/^[a-f0-9]{16}$/)
        .withMessage("question hash must be a 16-character hex string")
        .trim(),
    validationErrorHandler,
];

export const assessAnswerAgainstQuestionsValidation = [
    param('questionHash')
        .isString()
        .withMessage("Question hash must be a string")
        .matches(/^[a-f0-9]{16}$/)
        .withMessage("question hash must be a 16-character hex string")
    ,
    body('answerText')
        .notEmpty()
        .withMessage("Answer text is required")
        .isString()
        .withMessage("Answer text must be a string")
        .isLength({ min: 20 })
        .withMessage("Answer text must be at least 20 characters")
        .trim()
    ,
    validationErrorHandler,
];

export const generateQuestionDraftCoachValidation = [
    body("title")
        .notEmpty()
        .withMessage("Question title is required")
        .isString()
        .withMessage("Question title must be a string")
        .isLength({ min: 5, max: 255 })
        .withMessage("Question title must be between 5 and 255 characters")
        .trim()
    ,
    body("content")
        .notEmpty()
        .withMessage("Question content is required")
        .isString()
        .withMessage("Question content must be a string")
        .isLength({ min: 10 })
        .withMessage("Question content must be at least 10 characters")
        .trim(),
    validationErrorHandler,

]

//[T-11]
export const similarQuestionsValidation = [
    param('questionHash')
        .isString()
        .withMessage("Question hash must be a string")
        .matches(/^[a-f0-9]{16}$/)
        .withMessage("question hash must be a 16-character hex string")
        .trim()
    ,
    query("k")
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage("k must be an integer between 1 and 20")
        .toInt()
    ,
    query("threshold")
        .optional() //if the query parameter is absent, don't validate it; if it's present, validate it
        .isFloat({ min: 0, max: 1 }) // min 0 and max 1
        .withMessage("threshold must be a floating point number between 0 and 1")
        .toFloat() //converting the string to float or number
    ,

    validationErrorHandler,
]