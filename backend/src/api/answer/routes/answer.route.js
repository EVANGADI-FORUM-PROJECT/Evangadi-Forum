import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { createAnswerController, updateAnswerController, deleteAnswerController, toggleAnswerLikeController } from "../controller/answer.controller.js";

import {createAnswerValidation} from "../validation/answer.validation.js"


const router = express.Router();
// # Task: Create Answer [T-12]
// POST: /api/answers
router.post("/", authenticateUser, createAnswerValidation, createAnswerController)
router.put('/:answerId', authenticateUser, createAnswerValidation.slice(1), updateAnswerController);
router.delete('/:answerId', authenticateUser, deleteAnswerController);
router.put('/:answerId/like', authenticateUser, toggleAnswerLikeController);

 


export default router;
