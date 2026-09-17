import { apiClient } from '../core/api.client.js';

function getMessage(error, fallback) {
  return (
    error.response?.data?.msg ||
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    fallback
  );
}

async function getQuestions(params = {}) {
  try {
    const response = await apiClient.get('/api/questions', { params });
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, 'Unable to load questions. Please try again.'));
  }
}

async function searchQuestionsSemantic(query, options = {}) {
  try {
    const response = await apiClient.get('/api/questions/search', {
      params: { query, ...options },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getMessage(error, 'AI search is temporarily unavailable. Please try again.')
    );
  }
}

async function getSingleQuestion(questionHash) {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}`);
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, 'Unable to load this question. Please try again.'));
  }
}

async function createQuestion(payload) {
  try {
    const response = await apiClient.post('/api/questions', payload);
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, 'Unable to post your question. Please try again.'));
  }
}

async function generateQuestionDraftCoach(payload) {
  try {
    const response = await apiClient.post('/api/questions/draft-coach', payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getMessage(error, 'AI draft suggestions are temporarily unavailable. Please try again.')
    );
  }
}

async function assessAnswerFit(questionHash, answerText) {
  try {
    const response = await apiClient.post(
      `/api/questions/${questionHash}/answer-fit`,
      { answerText }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getMessage(error, 'AI answer-fit checking is temporarily unavailable. Please try again.')
    );
  }
}

async function getSimilarQuestions(questionHash, options = {}) {
  try {
    const response = await apiClient.get(
      `/api/questions/${questionHash}/similar`,
      { params: options }
    );
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, 'Unable to load related questions.'));
  }
}

export const questionService = {
  getQuestions,
  searchQuestionsSemantic,
  getSingleQuestion,
  createQuestion,
  generateQuestionDraftCoach,
  assessAnswerFit,
  getSimilarQuestions,
};
