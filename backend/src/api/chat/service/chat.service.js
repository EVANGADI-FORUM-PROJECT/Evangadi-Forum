import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../utils/errors/index.js';
import { saveAttachment, removeAttachment, attachmentPath } from '../config/chat.upload.js';

export const listUsers = (userId) => safeExecute(`
  SELECT user_id AS id, first_name AS firstName, last_name AS lastName
  FROM users WHERE user_id <> ? ORDER BY first_name, last_name`, [userId]);

export const listConversations = (userId) => safeExecute(`
  SELECT c.conversation_id AS id, u.user_id AS userId,
    u.first_name AS firstName, u.last_name AS lastName,
    (SELECT COUNT(*) FROM private_messages m WHERE m.conversation_id = c.conversation_id
      AND m.user_id <> ? AND m.message_id > COALESCE(s.last_message_id, 0) AND m.deleted_for_everyone = 0
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'chat' AND h.message_id = m.message_id)) AS unreadCount,
    (SELECT CASE WHEN p.deleted_for_everyone = 1 THEN 'Message deleted'
      WHEN p.content <> '' THEN p.content WHEN p.message_type = 'image' THEN 'Photo'
      WHEN p.message_type = 'voice' THEN 'Voice message' ELSE 'File' END
      FROM private_messages p WHERE p.conversation_id = c.conversation_id
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'chat' AND h.message_id = p.message_id)
      ORDER BY p.message_id DESC LIMIT 1) AS lastMessage
  FROM private_conversations c
  JOIN users u ON u.user_id = IF(c.user_one = ?, c.user_two, c.user_one)
  LEFT JOIN message_read_state s ON s.target_type = 'chat' AND s.target_id = c.conversation_id AND s.user_id = ?
  WHERE c.user_one = ? OR c.user_two = ? ORDER BY c.conversation_id DESC`, [userId, userId, userId, userId, userId, userId, userId]);

export const createConversation = async (userId, otherId) => {
  if (Number(userId) === Number(otherId)) throw new BadRequestError('Choose another member.');
  const users = await safeExecute('SELECT user_id FROM users WHERE user_id = ?', [otherId]);
  if (!users.length) throw new NotFoundError('Member not found.');
  // Always store the smaller ID first so two users have only one conversation.
  const first = Math.min(userId, otherId);
  const second = Math.max(userId, otherId);
  await safeExecute('INSERT IGNORE INTO private_conversations (user_one, user_two) VALUES (?, ?)', [first, second]);
  const rows = await safeExecute('SELECT conversation_id AS id FROM private_conversations WHERE user_one = ? AND user_two = ?', [first, second]);
  return rows[0];
};

export const checkMember = async (conversationId, userId) => {
  const rows = await safeExecute(`SELECT conversation_id FROM private_conversations
    WHERE conversation_id = ? AND (user_one = ? OR user_two = ?)`, [conversationId, userId, userId]);
  if (!rows.length) throw new ForbiddenError('You do not have access to this conversation.');
};

export const listMessages = async (conversationId, userId) => {
  await checkMember(conversationId, userId);
  return safeExecute(`
    SELECT m.message_id AS id, m.content, m.user_id AS userId,
      m.created_at AS createdAt, m.edited_at AS editedAt,
      m.message_type AS messageType, m.attachment_name AS attachmentName,
      m.attachment_size AS attachmentSize, m.duration_seconds AS durationSeconds,
      m.deleted_for_everyone AS deletedForEveryone,
      u.first_name AS firstName, u.last_name AS lastName
    FROM private_messages m JOIN users u ON u.user_id = m.user_id
    WHERE m.conversation_id = ?
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'chat' AND h.message_id = m.message_id)
    ORDER BY m.message_id ASC`, [conversationId, userId]);
};

export const sendMessage = async (conversationId, userId, content) => {
  await checkMember(conversationId, userId);
  const result = await safeExecute('INSERT INTO private_messages (conversation_id, user_id, content) VALUES (?, ?, ?)', [conversationId, userId, content.trim()]);
  return { id: result.insertId };
};

const getMessage = async (conversationId, messageId, userId) => {
  await checkMember(conversationId, userId);
  const rows = await safeExecute(`SELECT m.* FROM private_messages m WHERE m.conversation_id = ? AND m.message_id = ?
    AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'chat' AND h.message_id = m.message_id)`, [conversationId, messageId, userId]);
  if (!rows.length) throw new NotFoundError('Message not found.');
  return rows[0];
};

export const editMessage = async (conversationId, messageId, userId, content) => {
  const message = await getMessage(conversationId, messageId, userId);
  if (Number(message.user_id) !== Number(userId)) throw new ForbiddenError('You can only change your own messages.');
  if (message.deleted_for_everyone) throw new BadRequestError('This message was deleted.');
  if (message.message_type === 'text' && !content.trim()) throw new BadRequestError('Message cannot be empty.');
  await safeExecute('UPDATE private_messages SET content = ?, edited_at = NOW() WHERE message_id = ?', [content.trim(), messageId]);
};

export const deleteMessage = async (conversationId, messageId, userId, scope = 'me') => {
  const message = await getMessage(conversationId, messageId, userId);
  if (scope === 'me') {
    await safeExecute("INSERT IGNORE INTO message_hidden (user_id, target_type, message_id) VALUES (?, 'chat', ?)", [userId, messageId]);
  } else if (scope === 'everyone') {
    if (Number(message.user_id) !== Number(userId)) throw new ForbiddenError('You can only delete your own messages for everyone.');
    await safeExecute(`UPDATE private_messages SET deleted_for_everyone = 1, content = '', message_type = 'text',
      attachment_path = NULL, attachment_name = NULL, attachment_mime = NULL, attachment_size = NULL, duration_seconds = NULL
      WHERE message_id = ?`, [messageId]);
    await removeAttachment(message.attachment_path);
  } else throw new BadRequestError('Choose a valid delete option.');
};

export const sendAttachment = async (conversationId, userId, file, { kind = 'file', caption = '', duration = 0 } = {}) => {
  await checkMember(conversationId, userId);
  const attachment = await saveAttachment(file, kind);
  try {
    const result = await safeExecute(`INSERT INTO private_messages
      (conversation_id, user_id, content, message_type, attachment_path, attachment_name, attachment_mime, attachment_size, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [conversationId, userId, caption.trim(), attachment.type, attachment.filename, attachment.name, attachment.mime, attachment.size, attachment.type === 'voice' ? Number(duration) : null]);
    return { id: result.insertId };
  } catch (error) { await removeAttachment(attachment.filename); throw error; }
};

export const getAttachment = async (conversationId, messageId, userId) => {
  const message = await getMessage(conversationId, messageId, userId);
  if (message.deleted_for_everyone || !message.attachment_path) throw new NotFoundError('Attachment not found.');
  return { path: attachmentPath(message.attachment_path), name: message.attachment_name, mime: message.attachment_mime };
};

export const markRead = async (conversationId, userId, lastMessageId) => {
  await checkMember(conversationId, userId);
  const rows = await safeExecute('SELECT MAX(message_id) AS lastId FROM private_messages WHERE conversation_id = ? AND message_id <= ?', [conversationId, lastMessageId]);
  await safeExecute(`INSERT INTO message_read_state (user_id, target_type, target_id, last_message_id)
    VALUES (?, 'chat', ?, ?)
    ON DUPLICATE KEY UPDATE last_message_id = GREATEST(last_message_id, VALUES(last_message_id))`,
    [userId, conversationId, Number(rows[0].lastId || 0)]);
};
