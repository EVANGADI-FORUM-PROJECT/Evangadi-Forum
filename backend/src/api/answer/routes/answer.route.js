// Import the Express framework
import express from "express";
// Import middleware used to authenticate the logged-in user
import { authenticateUser } from "../../../middleware/authentication.js";
// Import the controller responsible for creating an answer
import { createAnswerController } from "../controller/answer.controller.js";

import { createAnswerValidation } from "../validation/answer.validation.js";

const router = express.Router();
// # Task: Create Answer [T-12]
// POST: /api/answers
