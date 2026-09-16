// Import body, param, and query validators from express-validator
import { body, param, query } from "express-validator";
// Import our custom middleware that handles validation errors
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
