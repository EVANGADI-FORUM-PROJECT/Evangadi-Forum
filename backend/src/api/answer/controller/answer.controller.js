import { StatusCodes } from "http-status-codes";
import { createAnswerService } from "../services/answer.service.js";

// # Task: Create Answer [T-12]
// POST: /api/answers
export const createAnswerController = async  (req, res, next)=>{
    try {
        const {questionId, content}= req.body;
        const answer = await createAnswerService({
            questionId,
            content, 
            userId: req.user.id
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