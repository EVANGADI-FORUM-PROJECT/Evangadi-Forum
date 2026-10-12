import { db, safeExecute } from '../../../../db/config.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../utils/errors/index.js';
import { saveAttachment, removeAttachment, attachmentPath } from '../../chat/config/chat.upload.js';

export const listRooms = (userId) => safeExecute(`
  SELECT r.room_id AS id, r.name, r.description, r.user_id AS userId,
    r.created_at AS createdAt, u.first_name AS firstName, u.last_name AS lastName,
    (SELECT COUNT(*) FROM discussion_messages m WHERE m.room_id = r.room_id
      AND m.user_id <> ? AND m.message_id > COALESCE(s.last_message_id, 0) AND m.deleted_for_everyone = 0
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'discussion' AND h.message_id = m.message_id)) AS unreadCount,
    (SELECT CASE WHEN p.deleted_for_everyone = 1 THEN 'Message deleted'
      WHEN p.content <> '' THEN p.content WHEN p.message_type = 'image' THEN 'Photo'
      WHEN p.message_type = 'voice' THEN 'Voice message' ELSE 'File' END
      FROM discussion_messages p WHERE p.room_id = r.room_id
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'discussion' AND h.message_id = p.message_id)
      ORDER BY p.message_id DESC LIMIT 1) AS lastMessage
  FROM discussion_rooms r JOIN users u ON u.user_id = r.user_id
  LEFT JOIN message_read_state s ON s.target_type = 'discussion' AND s.target_id = r.room_id AND s.user_id = ?
  ORDER BY r.created_at DESC, r.room_id DESC`, [userId, userId, userId, userId]);

export const createRoom = async (userId, name, description = '') => {
  const result = await safeExecute(
    'INSERT INTO discussion_rooms (user_id, name, description) VALUES (?, ?, ?)',
    [userId, name.trim(), description.trim()]);
  return { id: result.insertId };
};

export const getRoom = async (roomId) => {
  const rows = await safeExecute('SELECT room_id FROM discussion_rooms WHERE room_id = ?', [roomId]);
  if (!rows.length) throw new NotFoundError('Discussion room not found.');
};

export const listMessages = async (roomId, userId) => {
  await getRoom(roomId);
  return safeExecute(`
    SELECT m.message_id AS id, m.content, m.user_id AS userId,
      m.created_at AS createdAt, m.edited_at AS editedAt,
      m.message_type AS messageType, m.attachment_name AS attachmentName,
      m.attachment_size AS attachmentSize, m.duration_seconds AS durationSeconds,
      m.deleted_for_everyone AS deletedForEveryone,
      u.first_name AS firstName, u.last_name AS lastName
    FROM discussion_messages m JOIN users u ON u.user_id = m.user_id
    WHERE m.room_id = ?
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'discussion' AND h.message_id = m.message_id)
    ORDER BY m.message_id ASC`, [roomId, userId]);
};

export const sendMessage = async (roomId, userId, content) => {
  await getRoom(roomId);
  const result = await safeExecute(
    'INSERT INTO discussion_messages (room_id, user_id, content) VALUES (?, ?, ?)',
    [roomId, userId, content.trim()]);
  return { id: result.insertId };
};

const getMessage = async (roomId, messageId, userId) => {
  const rows = await safeExecute(
    `SELECT m.* FROM discussion_messages m WHERE m.room_id = ? AND m.message_id = ?
      AND NOT EXISTS (SELECT 1 FROM message_hidden h WHERE h.user_id = ? AND h.target_type = 'discussion' AND h.message_id = m.message_id)`, [roomId, messageId, userId]);
  if (!rows.length) throw new NotFoundError('Message not found.');
  return rows[0];
};

export const editMessage = async (roomId, messageId, userId, content) => {
  const message = await getMessage(roomId, messageId, userId);
  if (Number(message.user_id) !== Number(userId)) throw new ForbiddenError('You can only change your own messages.');
  if (message.deleted_for_everyone) throw new BadRequestError('This message was deleted.');
  if (message.message_type === 'text' && !content.trim()) throw new BadRequestError('Message cannot be empty.');
  await safeExecute('UPDATE discussion_messages SET content = ?, edited_at = NOW() WHERE message_id = ?', [content.trim(), messageId]);
};

export const deleteMessage = async (roomId, messageId, userId, scope = 'me') => {
  const message = await getMessage(roomId, messageId, userId);
  if (scope === 'me') {
    await safeExecute("INSERT IGNORE INTO message_hidden (user_id, target_type, message_id) VALUES (?, 'discussion', ?)", [userId, messageId]);
  } else if (scope === 'everyone') {
    if (Number(message.user_id) !== Number(userId)) throw new ForbiddenError('You can only delete your own messages for everyone.');
    await safeExecute(`UPDATE discussion_messages SET deleted_for_everyone = 1, content = '', message_type = 'text',
      attachment_path = NULL, attachment_name = NULL, attachment_mime = NULL, attachment_size = NULL, duration_seconds = NULL
      WHERE message_id = ?`, [messageId]);
    await removeAttachment(message.attachment_path);
  } else throw new BadRequestError('Choose a valid delete option.');
};

export const sendAttachment = async (roomId, userId, file, { kind = 'file', caption = '', duration = 0 } = {}) => {
  await getRoom(roomId);
  const attachment = await saveAttachment(file, kind);
  try {
    const result = await safeExecute(`INSERT INTO discussion_messages
      (room_id, user_id, content, message_type, attachment_path, attachment_name, attachment_mime, attachment_size, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, userId, caption.trim(), attachment.type, attachment.filename, attachment.name, attachment.mime, attachment.size, attachment.type === 'voice' ? Number(duration) : null]);
    return { id: result.insertId };
  } catch (error) { await removeAttachment(attachment.filename); throw error; }
};

export const getAttachment = async (roomId, messageId, userId) => {
  const message = await getMessage(roomId, messageId, userId);
  if (message.deleted_for_everyone || !message.attachment_path) throw new NotFoundError('Attachment not found.');
  return { path: attachmentPath(message.attachment_path), name: message.attachment_name, mime: message.attachment_mime };
};

export const markRead = async (roomId, userId, lastMessageId) => {
  await getRoom(roomId);
  // Only mark messages included in the displayed response, not messages arriving later.
  const rows = await safeExecute('SELECT MAX(message_id) AS lastId FROM discussion_messages WHERE room_id = ? AND message_id <= ?', [roomId, lastMessageId]);
  await safeExecute(`INSERT INTO message_read_state (user_id, target_type, target_id, last_message_id)
    VALUES (?, 'discussion', ?, ?)
    ON DUPLICATE KEY UPDATE last_message_id = GREATEST(last_message_id, VALUES(last_message_id))`,
    [userId, roomId, Number(rows[0].lastId || 0)]);
};

// Only the member who created a room can manage it.
const getOwnedRoom = async (roomId, userId) => {
  const rows = await safeExecute('SELECT user_id FROM discussion_rooms WHERE room_id = ?', [roomId]);
  if (!rows.length) throw new NotFoundError('Discussion room not found.');
  if (Number(rows[0].user_id) !== Number(userId)) throw new ForbiddenError('Only the room creator can manage this room.');
};

export const renameRoom = async (roomId, userId, name) => {
  await getOwnedRoom(roomId, userId);
  await safeExecute('UPDATE discussion_rooms SET name = ? WHERE room_id = ? AND user_id = ?', [name.trim(), roomId, userId]);
};

export const deleteRoom = async (roomId, userId) => {
  const connection = await db.getConnection();
  let attachments = [];
  try {
    await connection.beginTransaction();
    const [rooms] = await connection.execute('SELECT user_id FROM discussion_rooms WHERE room_id = ? FOR UPDATE', [roomId]);
    if (!rooms.length) throw new NotFoundError('Discussion room not found.');
    if (Number(rooms[0].user_id) !== Number(userId)) throw new ForbiddenError('Only the room creator can delete this room.');
    [attachments] = await connection.execute('SELECT attachment_path FROM discussion_messages WHERE room_id = ? FOR UPDATE', [roomId]);
    await connection.execute("DELETE h FROM message_hidden h JOIN discussion_messages m ON m.message_id = h.message_id WHERE h.target_type = 'discussion' AND m.room_id = ?", [roomId]);
    await connection.execute("DELETE FROM message_read_state WHERE target_type = 'discussion' AND target_id = ?", [roomId]);
    await connection.execute('DELETE FROM discussion_messages WHERE room_id = ?', [roomId]);
    await connection.execute('DELETE FROM discussion_rooms WHERE room_id = ?', [roomId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  for (const message of attachments) await removeAttachment(message.attachment_path);
};
