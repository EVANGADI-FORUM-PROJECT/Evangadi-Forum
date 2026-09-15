import { StatusCodes } from "http-status-codes";

import {
  createQuestionWithVectorService,
  getQuestionsService,
  searchQuestionsSemanticService,
  getSingleQuestionService,
  assessAnswerAgainstQuestionsService,
  getSimilarQuestionsService,
} from "../service/question.service.js";
import { generateQuestionDraftCoachService } from "../service/geminiTextCoach.service.js";

// # Task: Create Question & Auto-Embed[T-9]
// POST /api/questions

// ! ===============================================
// # Task: List Questions[T-10]
//GET /api/questions

// ! ===============================================
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search

// ! ===========================================
// # Task: Get Single Question Details[T-10]
// GET /api/questions/:questionHash

// ! =============================================
// # Task: AI Answer Fit Evaluation[T-18]
//POST /api/questions/:questionHash/answer-fit

// ! ===========================================
// # Task: AI Question Draft Coach[T-17]
//POST /api/questions/draft-coach

// ! =========================================

// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
