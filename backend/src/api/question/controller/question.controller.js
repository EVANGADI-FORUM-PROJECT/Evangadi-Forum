import { StatusCodes } from "http-status-codes";

import {createQuestionWithVectorService, getQuestionsService, searchQuestionsSemanticService, getSingleQuestionService, assessAnswerAgainstQuestionsService,getSimilarQuestionsService, updateQuestionService, deleteQuestionService, toggleSavedQuestionService, getSavedQuestionsService} from "../service/question.service.js"
import {generateQuestionDraftCoachService} from "../service/geminiTextCoach.service.js"


// # Task: Create Question & Auto-Embed[T-9]
// POST /api/questions
export const createQuestionController = async (req, res, next) => {
    try {
        const {title, content} = req.body;// frontend: {title:..., content: .....}
        const result= await createQuestionWithVectorService({
            userId: req.user.id,
            authorFirstName: req.user.firstName, // asker's id attached in authenticateUser middleware from payload
            title,
            content
        })
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Question created successfully",
            data: result.question,
        })
    } catch (error) {
        next(error);
    }
}


// ! ===============================================
// # Task: List Questions[T-10]
//GET /api/questions
export const getQuestionsController = async(req, res, next)=>{
 try {
    const filters = {
        search: req.query.search,
        limit: req.query.limit,
        offset: req.query.offset,
        mine: req.query.mine,
        userId: req.user.id,
    }// get request doesnt have body that why we are sending data through query params

    const result = await getQuestionsService(filters);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Questions fetched successfully',
        ...result // to directly place results properties inside thie object w/o result:{ }
    });

 } catch (error) {
    next(error);
 }
}

// ! ===============================================
// # Task: Semantic Search Questions[T-11]
// GET /api/questions/search
export const searchQuestionsSemanticController = async (req, res, next)=>{
    try {
        
        const result = await searchQuestionsSemanticService({
            query: req.query.query,
            limit: req.query.limit,
            offset: req.query.offset,
            k: req.query.k ? Number(req.query.k): 0,
            threshold: req.query.threshold !== undefined ? Number(req.query.threshold): undefined,
        });

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Questions fetched successfully using semantic search',
            ...result,
            
        });
    } catch (error) {
        next(error);
    }
}


// ! ===========================================
// # Task: Get Single Question Details[T-10]
// GET /api/questions/:questionHash
export const getSingleQuestionController = async (req, res, next)=>{
    try {
    const {questionHash}= req.params
  

    const result =await getSingleQuestionService({questionHash, userId: req.user.id})

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Question fetched successfully',
        ...result,
    });
        
    } catch (error) {
        next(error);
    }
}

export const updateQuestionController = async (req, res, next) => {
    try {
        const data = await updateQuestionService({ questionHash: req.params.questionHash, userId: req.user.id, ...req.body });
        res.status(StatusCodes.OK).json({ success: true, message: 'Question updated successfully.', data });
    } catch (error) { next(error); }
};

export const deleteQuestionController = async (req, res, next) => {
    try {
        await deleteQuestionService({ questionHash: req.params.questionHash, userId: req.user.id });
        res.status(StatusCodes.OK).json({ success: true, message: 'Question deleted successfully.' });
    } catch (error) { next(error); }
};

export const toggleSavedQuestionController = async (req, res, next) => {
    try {
        const data = await toggleSavedQuestionService({ questionHash: req.params.questionHash, userId: req.user.id, saved: req.body.saved });
        res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) { next(error); }
};

export const getSavedQuestionsController = async (req, res, next) => {
    try {
        const result = await getSavedQuestionsService(req.user.id);
        res.status(StatusCodes.OK).json({ success: true, ...result });
    } catch (error) { next(error); }
};

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
        
        
		const result= await assessAnswerAgainstQuestionsService({
			questionTitle: question.title,
			questionContent: question.content,
			answerText,
		});
console.log('assessAnswerAgainstQuestionsService', result);

		res.status(StatusCodes.OK).json({
			success: true,
			message: 'Answer assessed successfully',
			...result,
		});
	}catch(error){
		next(error);
	}
}

// ! ===========================================
// # Task: AI Question Draft Coach[T-17]
//POST /api/questions/draft-coach
export const generateQuestionDraftCoachController = async (req, res, next)=>{
    try {
       const {title, content}= req.body;
    const data = await generateQuestionDraftCoachService({title, content});
    

    res.status(StatusCodes.OK).json({
        success: true,
        message:"Draft suggestions Generated.",
        data,
    }) 
    } catch (error) {
        next(error);
    }
    
};

// ! =========================================

// # Task: Find Similar Questions (T-11)
//Endpoint: GET /api/questions/:questionHash/similar
export const getSimilarQuestionsController  = async (req, res, next)=>{
    try{
        const { questionHash } = req.params;
        const { k, threshold } = req.query;
        
        const result = await getSimilarQuestionsService({
            questionHash,
            k: k ? Number(k) : undefined,
            threshold: threshold !== undefined
                ? Number(threshold)
                : undefined,
        });
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Similar questions fetched successfully',
            ...result,
        });
    }catch(error){
        next(error);
    }

}
