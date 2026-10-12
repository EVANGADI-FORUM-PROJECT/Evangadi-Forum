import { apiClient } from '../core/api.client.js';

async function request(method, url, data) {
  try { return (await apiClient.request({ method, url: '/api/discussion' + url, data })).data; }
  catch (error) { throw new Error(error.response?.data?.message || error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || 'Unable to complete the request. Please try again.'); }
}

export const discussionService = {
  rename: (id, name) => request('put', `/rooms/${id}`, { name }),
  remove: id => request('delete', `/rooms/${id}`),
  list: () => request('get', '/rooms'),
  markRead: (id, lastMessageId) => request('post', `/rooms/${id}/read`, { lastMessageId }),
  create: (name, description) => request('post', '/rooms', { name, description }),
  
  listMessages: id => request('get', `/rooms/${id}/messages`),
  sendMessage: (id, content) => request('post', `/rooms/${id}/messages`, { content }),
  editMessage: (id, messageId, content) => request('put', `/rooms/${id}/messages/${messageId}`, { content }),
  deleteMessage: (id, messageId, scope = 'me') => request('delete', `/rooms/${id}/messages/${messageId}?scope=${scope}`),
  sendAttachment: async (id, file, { kind = 'file', caption = '', duration = 0 } = {}) => {
    const data = new FormData();
    data.append('kind', kind);
    data.append('caption', caption);
    data.append('duration', String(duration));
    data.append('file', file);
    try {
      return (await apiClient.post(`/api/discussion/rooms/${id}/attachments`, data, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })).data;
    } catch (error) { throw new Error(error.response?.data?.message || error.response?.data?.msg || 'Unable to send this attachment.'); }
  },
  getAttachment: async (id, messageId) => {
    try { return (await apiClient.get(`/api/discussion/rooms/${id}/messages/${messageId}/attachment`, { responseType: 'blob', timeout: 120000 })).data; }
    catch { throw new Error('Unable to load this attachment. Please try again.'); }
  },
};
