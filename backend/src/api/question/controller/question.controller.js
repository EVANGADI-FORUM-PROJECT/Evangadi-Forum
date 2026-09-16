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

/**
 * T-10: List Questions
 * GET /api/questions
 *
 * Reads ?search and ?mine from the request, then calls getQuestionsService
 * to fetch questions with author details and answer counts.
 */
export const getQuestionsController = async (req, res, next) => {
  try {
    // GET requests have no body, so filters come via query params.
    // `userId` is attached by authenticateUser from the JWT payload.
    const filters = {
      search: req.query.search,
      mine: req.query.mine,
      userId: req.user.id,
    }; // get request doesnt have body that why we are sending data through query params

    const result = await getQuestionsService(filters);

    // T-10: Return 200 OK with the question list wrapped in a standard envelope
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully",
      // Spread `data` and `meta` from the service result into the response body
      ...result, // to directly place results properties inside thie object w/o result:{ }
    });
  } catch (error) {
    next(error);
  }
};

// ! ===============================================
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search

// ! ===========================================
// # Task: Get Single Question Details[T-10]
// GET /api/questions/:questionHash

// ! =============================================
// # Task: AI Answer Fit Evaluation[T-18]
//POST /api/questions/:questionHash/answer-fit
export const assessAnswerAgainstQuestionController = async (req, res, next)=>{
	try{
        const {questionHash}= req.params;
        const {answerText} = req.body;
        const {question}= await getSingleQuestionService({
            questionHash,
            includeAnswers: false 
        });
        

// ! ===========================================
// # Task: AI Question Draft Coach[T-17]
//POST /api/questions/draft-coach
export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await generateQuestionDraftCoachService({ title, content });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions Generated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
// ! =========================================

// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
