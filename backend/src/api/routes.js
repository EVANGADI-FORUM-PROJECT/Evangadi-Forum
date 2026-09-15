import express from "express"
import authRoutes from "./auth/routes/auth.route.js";
import questionRoutes from "./question/routes/question.route.js"
import answerRoutes from "./answer/routes/answer.route.js";

export const mainRouter = express.Router();

// /api/auth
mainRouter.use("/auth", authRoutes)

// /api/questions
mainRouter.use("/questions", questionRoutes)

// /api/answers
mainRouter.use("/answers", answerRoutes)
