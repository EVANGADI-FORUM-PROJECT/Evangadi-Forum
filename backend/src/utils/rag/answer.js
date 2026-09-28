/*
 * TASK: T-23 — AI Query Grounded in RAG Document
 *
 * TODO:
 * - Build a prompt from retrieved chunks.
 * - Ask Gemini to answer using only the supplied context.
 * - Return the answer and source/citation information.
 *
 * Reference: M-3/Backend/rag/query-document.md
 */
import { getGeminiClient, getGeminiTextModel } from "../ai/gemini.js";
// TODO [T-23]: Generate an answer grounded only in the retrieved chunks.
// Generate an answer using only the chunks retrieved from the user's PDF.
export const answerFromRagChunks = async (searchQuery, chunks) => {
    let context = '';

    // Build a readable evidence context from the retrieved chunks so the model
    // can answer strictly from the document excerpts supplied by RAG.
    for (let i = 0; i < chunks.length; i++) {
        context += `
            Source ${i + 1}
            Chunk ID: ${chunks[i].chunkId}
            Chunk Index: ${chunks[i].chunkIndex}

                ${chunks[i].excerpt}

                --------------------
                `;
    }

    const prompt = `
                You are answering a question using information retrieved
                from a document.

                Answer the user's question ONLY using the information
                provided in the context below.

                If the context does not contain enough information to answer
                the question, say that the information is not available in
                the provided document.

                Do not use outside knowledge.

                User question:
                ${searchQuery}

                Context:
                ${context}
                `;

    const response = await getGeminiClient().models.generateContent({
        model: getGeminiTextModel(),
        contents: prompt,
        config: {
            maxOutputTokens: 300,
        },
    });

    const text = response?.text;
    return typeof text === 'string' ? text : '';
};

