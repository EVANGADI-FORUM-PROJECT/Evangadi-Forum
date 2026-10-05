import express from "express"
import { authenticateUser } from "../../../middleware/authentication.js"
import { createQuestionController, getQuestionsController, searchQuestionsSemanticController, getSingleQuestionController, assessAnswerAgainstQuestionController, generateQuestionDraftCoachController, getSimilarQuestionsController } from "../controller/question.controller.js";

import {
    createQuestionValidation, getQuestionsValidation, searchQuestionsSemanticValidation, getSingleQuestionValidation, assessAnswerAgainstQuestionsValidation, generateQuestionDraftCoachValidation, similarQuestionsValidation
} from "../validation/question.validation.js"

const router = express.Router();

// # Task: Create Question & Auto-Embed[T-9]
// POST /api/questions
router.post("/", authenticateUser, createQuestionValidation, createQuestionController);
//=================================================
// # Task: List Questions [T-10]
// GET /api/questions : used for fetching all questions and again for filtering the current user questions
router.get("/", authenticateUser, getQuestionsValidation, getQuestionsController);

//==================================
/**
 * @param GET /api/questions/search
 * @desc semantic search for questions using vector embeddings based on a text query
 */
// # Task: Semantic Search Questions[T-11]
//GET /api/questions/search
router.get("/search", authenticateUser, searchQuestionsSemanticValidation, searchQuestionsSemanticController)
//===================================

// # Task: AI Question Draft Coach
//POST /api/questions/draft-coach
router.post("/draft-coach", authenticateUser, generateQuestionDraftCoachValidation, generateQuestionDraftCoachController)

//=================================
// ! :questionHash means: Match any single path segment that comed from /answers and put it into req.params.questionHash so express interprets /search as req.params.questionHash = "search" that why we make :questionHash comes after /search in get request
/*i was getting {
    "msg": "question hash must be a 16-character hex string"
} due to req.params.questionHash = "search" and search isnt hash of 16 chr*/
// # Task: Get Single Question Details[T-10]
// GET /api/questions/:questionHash
router.get("/:questionHash", authenticateUser, getSingleQuestionValidation, getSingleQuestionController)
//==========================================

// # Task: AI Answer Fit Evaluation[T-18]
//POST /api/questions/:questionHash/answer-fit
router.post("/:questionHash/answer-fit", authenticateUser, assessAnswerAgainstQuestionsValidation, assessAnswerAgainstQuestionController);





// # Task: Find Similar Questions(t-11)
// GET /api/questions/:questionHash/similar
//this request will be send by front end app not by user to show similar questions the user watching the question deatils
router.get("/:questionHash/similar", authenticateUser, similarQuestionsValidation,  getSimilarQuestionsController)
export default router;

