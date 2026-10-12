import { apiClient } from '../core/api.client.js';

async function request(method, url, data) {
  try { return (await apiClient.request({ method, url: '/api/chat' + url, data })).data; }
  catch (error) { throw new Error(error.response?.data?.message || error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || 'Unable to complete the request. Please try again.'); }
}

export const chatService = {
  list: () => request('get', '/conversations'),
  markRead: (id, lastMessageId) => request('post', `/conversations/${id}/read`, { lastMessageId }),
  create: (userId) => request('post', '/conversations', { userId }),
  listUsers: () => request('get', '/users'),
  listMessages: id => request('get', `/conversations/${id}/messages`),
  sendMessage: (id, content) => request('post', `/conversations/${id}/messages`, { content }),
  editMessage: (id, messageId, content) => request('put', `/conversations/${id}/messages/${messageId}`, { content }),
  deleteMessage: (id, messageId, scope = 'me') => request('delete', `/conversations/${id}/messages/${messageId}?scope=${scope}`),
  sendAttachment: async (id, file, { kind = 'file', caption = '', duration = 0 } = {}) => {
    const data = new FormData();
    data.append('kind', kind);
    data.append('caption', caption);
    data.append('duration', String(duration));
    data.append('file', file);
    try {
      return (await apiClient.post(`/api/chat/conversations/${id}/attachments`, data, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })).data;
    } catch (error) { throw new Error(error.response?.data?.message || error.response?.data?.msg || 'Unable to send this attachment.'); }
  },
  getAttachment: async (id, messageId) => {
    try { return (await apiClient.get(`/api/chat/conversations/${id}/messages/${messageId}/attachment`, { responseType: 'blob', timeout: 120000 })).data; }
    catch { throw new Error('Unable to load this attachment. Please try again.'); }
  },
};
