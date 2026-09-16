import { apiClient } from '../core/api.client.js';

function getMessage(error, fallback) {
  return (
    error.response?.data?.msg ||
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    fallback
  );
}

async function postAnswer(questionId, content) {
  try {
    const response = await apiClient.post('/api/answers', {
      questionId,
      content,
    });
    return response.data;
  } catch (error) {
    throw new Error(getMessage(error, 'Unable to post your answer. Please try again.'));
  }
}

export const answerService = { postAnswer };
