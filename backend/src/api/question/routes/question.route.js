import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import {
  createQuestionController,
  getQuestionsController,
  searchQuestionsSemanticController,
  getSingleQuestionController,
  assessAnswerAgainstQuestionController,
  generateQuestionDraftCoachController,
  getSimilarQuestionsController,
} from "../controller/question.controller.js";

import {
  createQuestionValidation,
  getQuestionsValidation,
  searchQuestionsSemanticValidation,
  getSingleQuestionValidation,
  assessAnswerAgainstQuestionsValidation,
  generateQuestionDraftCoachValidation,
  similarQuestionsValidation,
} from "../validation/question.validation.js";

const router = express.Router();

// POST /api/questions
router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

// GET /api/questions : used for fetching all questions and again for filtering the current user questions
// Middleware: authenticateUser -> getQuestionsValidation -> getQuestionsController
router.get("/", authenticateUser, getQuestionsValidation, getQuestionsController);

//==================================
/**
 * @param GET /api/questions/search
 * @desc semantic search for questions using vector embeddings based on a text query
 */

//GET /api/questions/search
router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

//POST /api/questions/draft-coach
router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

// # Task: Get Single Question Details[T-10]
// GET /api/questions/:questionHash    >>>> Route definition for fetching a specific question by its unique hash
router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

//==========================================
// # Task: AI Answer Fit Evaluation[T-18]
//POST /api/questions/:questionHash/answer-fit

router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionsValidation,
  assessAnswerAgainstQuestionController,
);

// # Task: Find Similar Questions(t-11)
// GET /api/questions/:questionHash/similar
//this request will be send by front end app not by user to show similar questions the user watching the question deatils
router.get(
  "/:questionHash/similar",
  authenticateUser,
  similarQuestionsValidation,
  getSimilarQuestionsController,
);
export default router;
