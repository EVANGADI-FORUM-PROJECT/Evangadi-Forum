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

export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const result = await createQuestionWithVectorService({
      userId: req.user.id,
      title,
      content,
    });
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question created successfully",
      data: result.question,
    });
  } catch (error) {
    next(error);
  }
};

//GET /api/questions
export const getQuestionsController = async (req, res, next) => {
  try {
    // GET requests have no body, so filters come via query params
    const filters = {
      search: req.query.search,
      mine: req.query.mine,
      userId: req.user.id,
    };
    // Delegate to the service which builds and executes the SQL query
    const result = await getQuestionsService(filters);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

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

// GET /api/questions/search
export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const result = await searchQuestionsSemanticService({
      query: req.query.query,
      k: req.query.k ? Number(req.query.k) : 0,
      threshold:
        req.query.threshold !== undefined
          ? Number(req.query.threshold)
          : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully using semantic search",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/questions/:questionHash
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    //console.log("questionHash: ",questionHash);

    const result = await getSingleQuestionService({ questionHash });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

//POST /api/questions/:questionHash/answer-fit

export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;
    const { question } = await getSingleQuestionService({
      questionHash,
      includeAnswers: false,
    });

    const result = await assessAnswerAgainstQuestionsService({
      questionTitle: question.title,
      questionContent: question.content,
      answerText,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer assessed successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

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

//Endpoint: GET /api/questions/:questionHash/similar
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { k, threshold } = req.query;

    const result = await getSimilarQuestionsService({
      questionHash,
      k: k ? Number(k) : undefined,
      threshold: threshold !== undefined ? Number(threshold) : undefined,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
