import { getGeminiClient, getGeminiEmbeddingModel } from './gemini.js';

/**
 * Generate one embedding vector for a text input using the Gemini Embedding API.
 * The task type is important: document embeddings and retrieval-query embeddings
 * are intended for different sides of a retrieval system.
 */
export const generateQuestionEmbedding = async (
  text,
  { taskType = 'RETRIEVAL_DOCUMENT', title } = {},
) => {
  const normalizedText = String(text ?? '').trim();
  if (!normalizedText) {
    throw new Error('Text is required to generate an embedding');
  }

  const config = { taskType };
  if (title) config.title = title;

  const response = await getGeminiClient().models.embedContent({
    model: getGeminiEmbeddingModel(),
    contents: normalizedText,
    config,
  });

  const values = response?.embeddings?.[0]?.values ?? response?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Gemini returned an invalid embedding response');
  }

  return {
    embedding: values.map(Number),
    model: getGeminiEmbeddingModel(),
  };
};
