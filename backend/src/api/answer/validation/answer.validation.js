// Import body, param, and query validators from express-validator
import { body, param, query } from "express-validator";
// Import our custom middleware that handles validation errors
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

// Validation rules for creating a new answer
export const createAnswerValidation = [

     // Validate the "questionId" field from the request body
    body("questionId")
        // Make sure questionId is not empty
        .notEmpty()
                // Error message if questionId is missing
        .withMessage("Question ID is required")
                // Make sure questionId is an integer greater than or equal to 1
        .isInt({ min: 1 })
                // Error message if questionId is not a positive integer
        .withMessage("Question ID must be a positive integer")
                // Convert questionId from a string to an integer
        .toInt(),
    // Validate the "content" field from the request body
    body("content")
            // Make sure content is not empty
        .notEmpty()