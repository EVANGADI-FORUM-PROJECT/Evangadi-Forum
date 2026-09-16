// Import the Express framework
import express from "express";
// Import middleware used to authenticate the logged-in user
import { authenticateUser } from "../../../middleware/authentication.js";
// Import the controller responsible for creating an answer
import { createAnswerController } from "../controller/answer.controller.js";
// Import validation middleware for validating the answer request
import { createAnswerValidation } from "../validation/answer.validation.js";

// Create a new Express router instance
const router = express.Router();
// # Task: Create Answer [T-12]
// POST: /api/answers

// Define the endpoint for creating a new answer
// HTTP Method: POST
// Endpoint: /api/answers
router.post(
  "/",                    // Route path
  authenticateUser,       // Check whether the user is authenticated
  createAnswerValidation, // Validate the request data
  createAnswerController // Handle the request and create the answer
);