// Import the Express framework
import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { createAnswerController } from "../controller/answer.controller.js";

import { createAnswerValidation } from "../validation/answer.validation.js";

const router = express.Router();
// # Task: Create Answer [T-12]
// POST: /api/answers
