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
export const createQuestionController = async (req, res, next) => {
  try {
    const {title, content} = req.body;
        const result= await createQuestionWithVectorService({
            userId: req.user.id, 
            title,
            content
            })
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Question created successfully",
            data: result.question,
        })
  } catch (error) {
    next(error)
  }
}
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
export const generateQuestionDraftCoachController = async (req, res, next)=>{
    try {
         const {title, content}= req.body;
          const data = await generateQuestionDraftCoachService({title, content});
 res.status(StatusCodes.OK).json({
   success: true,
// ! =========================================

// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
