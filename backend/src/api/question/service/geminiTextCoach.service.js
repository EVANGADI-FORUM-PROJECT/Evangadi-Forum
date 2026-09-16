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
  });
  console.log(response);

  const text = response?.text;
  return typeof text === "string" ? text : "";
}

export function parseJsonObjectGeminiText(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON");
    console.error("Gemini text:", text);

    throw new Error("Gemini returned invalid JSON");
  }
}

// # Task: AI Question Draft Coach[T-17]
//POST /api/questions/draft-coach
export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const userPrompt = `you help learners write clearer technical forum posts.
    QUESTIONTITILE: ${title}
    QUESTION BODY(markdown allowed) :${content}
    
    reply with ONLY valid JSON (no markdown fences), exactly this shape: {"tips":["...", "..."]}
    RULES: 
    -tips: array of 3 to  short strings(each under 120 characters).
    -focus on: missing context(error messages, expected vs actual), reproducibility, a sharper title idea if needed, tone for peers
    - do not claim the question is "correct" or grade homework; give constructive checklist-style tips only.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);
    const parsed = parseJsonObjectGeminiText(raw);
    let tips = Array.isArray(parsed?.tips)
      ? parsed.tips
          .filter((t) => typeof t === "string" && t.trim())
          .map((t) => t.trim())
      : [];
    tips = tips.slice(0, 5);
    if (tips.length === 0) {
      tips = [
        "Add any error message or exact behavior you see.",
        "say what you already tried and what you expected instead.",
      ];
    }
    return { tips };
  } catch (error) {
    console.error("generateQuestionDraftCoachService", error);
    throw new ServiceUnavailableError(
      "AI draft sugesstions are temporarily unavailable. please try again later.",
    );
  }
};
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
