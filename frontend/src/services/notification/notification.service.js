import { apiClient } from '../core/api.client.js';

function getMessage(error, fallback) {
  return (
    error.response?.data?.msg ||
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    fallback
  );
}

async function list(limit = 20) {
  try {
    const response = await apiClient.get('/api/notifications', { params: { limit } });
    return response.data.data;
  } catch (error) {
    throw new Error(getMessage(error, "Couldn't load notifications right now."));
  }
}

async function getUnreadCount() {
  try {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data.data.count;
  } catch (error) {
    throw new Error(getMessage(error, "Couldn't load your unread count right now."));
  }
}

async function markRead(notificationId) {
  try {
    const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
    return response.data.data;
  } catch (error) {
    throw new Error(getMessage(error, "Couldn't mark that notification as read."));
  }
}

async function markAllRead() {
  try {
    const response = await apiClient.patch('/api/notifications/read-all');
    return response.data.data;
  } catch (error) {
    throw new Error(getMessage(error, "Couldn't mark all notifications as read."));
  }
}

export const notificationService = { list, getUnreadCount, markRead, markAllRead };
