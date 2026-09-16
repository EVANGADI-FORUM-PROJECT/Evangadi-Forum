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