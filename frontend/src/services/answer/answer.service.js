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

async function updateAnswer(answerId, content) {
  try { return (await apiClient.put(`/api/answers/${answerId}`, { content })).data; }
  catch (error) { throw new Error(getMessage(error, 'Unable to update your answer.')); }
}

async function deleteAnswer(answerId) {
  try { return (await apiClient.delete(`/api/answers/${answerId}`)).data; }
  catch (error) { throw new Error(getMessage(error, 'Unable to delete this answer.')); }
}

async function likeAnswer(answerId, liked) {
  try { return (await apiClient.put(`/api/answers/${answerId}/like`, { liked })).data; }
  catch (error) { throw new Error(getMessage(error, 'Unable to update answer like.')); }
}

export const answerService = { postAnswer, updateAnswer, deleteAnswer, likeAnswer };
