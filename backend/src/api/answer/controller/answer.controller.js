import {StatusCodes} from "http-status-codes"
import {createAnswerService, updateAnswerService, deleteAnswerService, toggleAnswerLikeService} from "../services/answer.service.js"

// # Task: Create Answer [T-12]
// POST: /api/answers
export const createAnswerController = async  (req, res, next)=>{
    try {
        const {questionId, content}= req.body;
        const answer = await createAnswerService({
            questionId,
            content, 
            userId: req.user.id,
            answererFirstName: req.user.firstName,
        });
        res.status(StatusCodes.CREATED).json({
            success:true,
            message:"Answer posted successfully",
            data:answer,
        });
    } catch (error) {
        next(error);
    }
}

export const updateAnswerController = async (req, res, next) => {
    try {
        const data = await updateAnswerService({ answerId: Number(req.params.answerId), userId: req.user.id, content: req.body.content });
        res.status(StatusCodes.OK).json({ success: true, message: 'Answer updated successfully.', data });
    } catch (error) { next(error); }
};

export const deleteAnswerController = async (req, res, next) => {
    try {
        await deleteAnswerService({ answerId: Number(req.params.answerId), userId: req.user.id });
        res.status(StatusCodes.OK).json({ success: true, message: 'Answer deleted successfully.' });
    } catch (error) { next(error); }
};

export const toggleAnswerLikeController = async (req, res, next) => {
    try {
        const data = await toggleAnswerLikeService({ answerId: Number(req.params.answerId), userId: req.user.id, liked: req.body.liked });
        res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) { next(error); }
};
