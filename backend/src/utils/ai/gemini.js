import { GoogleGenAI } from '@google/genai';

let client;

export const getGeminiClient = () => {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  client = new GoogleGenAI({ apiKey });
  return client;
};

export const getGeminiTextModel = () =>
  process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite';

export const getGeminiEmbeddingModel = () =>
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
