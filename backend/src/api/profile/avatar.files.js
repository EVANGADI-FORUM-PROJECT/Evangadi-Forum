import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { safeExecute } from '../../../db/config.js';
import { BadRequestError } from '../../utils/errors/index.js';

export const avatarDirectory = path.resolve('uploads', 'avatars');
export const isAvatarPath = value => /^\/uploads\/avatars\/[a-f0-9]{32}\.(png|jpg|webp|gif)$/.test(value || '');

export const saveAvatar = async value => {
  const match = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(value || '');
  if (!match) throw new BadRequestError('Choose a valid PNG, JPG, WEBP, or GIF profile image.');
  const image = Buffer.from(match[2], 'base64');
  if (!image.length || image.length > 2 * 1024 * 1024) throw new BadRequestError('Profile images must be smaller than 2 MB.');
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const filename = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
  await fs.mkdir(avatarDirectory, { recursive: true });
  await fs.writeFile(path.join(avatarDirectory, filename), image);
  return `/uploads/avatars/${filename}`;
};

export const removeAvatar = async value => {
  if (!isAvatarPath(value)) return;
  try { await fs.unlink(path.join(avatarDirectory, path.basename(value))); }
  catch (error) { if (error.code !== 'ENOENT') console.error('Unable to remove avatar:', error.message); }
};

// Convert existing Base64 avatars once before the server starts accepting requests.
export const migrateAvatars = async () => {
  const rows = await safeExecute("SELECT user_id, avatar FROM users WHERE avatar LIKE 'data:image/%'", []);
  for (const row of rows) {
    const url = await saveAvatar(row.avatar);
    try { await safeExecute('UPDATE users SET avatar = ? WHERE user_id = ? AND avatar = ?', [url, row.user_id, row.avatar]); }
    catch (error) { await removeAvatar(url); throw error; }
  }
};
