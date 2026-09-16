import { GoogleGenAI } from "@google/genai";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// # Task: AI Question Draft Coach[T-17]
//POST /api/questions/draft-coach
export async function fetchGeminiJsonTextResponse(userPrompt) {
  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: userPrompt,
    config: {
      maxOutputTokens: 300,
    },
    //   max out put Token
  });
  console.log(response);

  const text = response?.text;
  return typeof text === "string" ? text : "";
}
// Create and export a function that converts Gemini's text response into a JavaScript object
export function parseJsonObjectGeminiText(text) {
  // Start a try block to test whether the Gemini response is valid JSON
  try {
    // Convert the text string into a JavaScript object using JSON.parse()
    return JSON.parse(text);
    // If JSON.parse() fails, catch the error here
  } catch (error) {
    // Show an error message in the console
    console.error("Failed to parse Gemini response as JSON");
    // Show the original Gemini response to help with debugging
    console.error("Gemini text:", text);
    // Stop the function and return a clear error message
    throw new Error("Gemini returned invalid JSON");
  }
}

// # Task: AI Question Draft Coach[T-17]
//POST /api/questions/draft-coach
// Create and export an asynchronous service function for generating question-draft coaching tips
export const generateQuestionDraftCoachService = async ({ title, content }) => {
  // Create the prompt that will be sent to Gemini
  // It includes the learner's question title and question body
  const userPrompt = `you help learners write clearer technical forum posts.

    // Add the question title to the Gemini prompt
    QUESTIONTITILE: ${title}

    // Add the question body to the Gemini prompt
    // Markdown is allowed in the question body
    QUESTION BODY(markdown allowed) :${content}
    
    // Tell Gemini to return only JSON without markdown code fences
    // The response must contain a "tips" array
    reply with ONLY valid JSON (no markdown fences), exactly this shape: {"tips":["...", "..."]}

    // Define the rules Gemini must follow when generating the tips
    RULES: 

    // Ask Gemini to provide 3 to 5 short tips
    // Each tip must be less than 120 characters
    -tips: array of 3 to 5 short strings(each under 120 characters).

    // Tell Gemini what areas the tips should focus on
    -focus on: missing context(error messages, expected vs actual), reproducibility, a sharper title idea if needed, tone for peers

    // Tell Gemini not to grade the learner's homework
    // The response should only provide helpful checklist-style suggestions
    - do not claim the question is "correct" or grade homework; give constructive checklist-style tips only.`;

  // Start a try block so we can safely handle errors
  try {
    // Send the userPrompt to Gemini and wait for the JSON text response
    const raw = await fetchGeminiJsonTextResponse(userPrompt);

    // Convert Gemini's JSON text response into a JavaScript object
    const parsed = parseJsonObjectGeminiText(raw);

    // Check if parsed.tips is an array
    // If it is an array, clean and prepare the tips
    // Otherwise, use an empty array
    let tips = Array.isArray(parsed?.tips);


    

    return { tips };
  } catch (error) {
    console.error("generateQuestionDraftCoachService", error);
    throw new ServiceUnavailableError(
      "AI draft sugesstions are temporarily unavailable. please try again later.",
    );
  }
};;
/* i got :
{
    "success": true,
    "message": "Draft suggestions Generated.",
    "data": {
        "tips": [
            "Include the exact error traceback and the specific library names you are using.",
            "Clarify how you want to match embeddings with SQL without vector extensions.",
            "Provide a minimal reproducible code snippet showing your current implementation."
        ]
    }
}*/
