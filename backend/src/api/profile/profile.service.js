import { isAvatarPath, saveAvatar, removeAvatar } from './avatar.files.js';
import { safeExecute } from '../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../utils/errors/index.js';

const mapProfile = row => ({
  id: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  avatar: row.avatar,
});

export const getProfileService = async userId => {
  const rows = await safeExecute('SELECT user_id, first_name, last_name, email, avatar FROM users WHERE user_id = ? LIMIT 1', [userId]);
  if (!rows.length) throw new NotFoundError('Profile not found.');
  return mapProfile(rows[0]);
};

export const updateProfileService = async (userId, { firstName, lastName, email, avatar }) => {
  const previous = await getProfileService(userId);
  let savedAvatar = previous.avatar;
  let created = false;
  if (avatar === null || avatar === '') savedAvatar = null;
  else if (avatar !== undefined && avatar !== previous.avatar) {
    // Existing paths are kept; newly selected photos are written to the uploads folder.
    if (isAvatarPath(avatar)) throw new BadRequestError('Choose your own profile image.');
    savedAvatar = await saveAvatar(avatar);
    created = true;
  }
  try {
    await safeExecute('UPDATE users SET first_name = ?, last_name = ?, email = ?, avatar = ? WHERE user_id = ?', [firstName.trim(), lastName.trim(), email.trim().toLowerCase(), savedAvatar, userId]);
  } catch (error) {
    if (created) await removeAvatar(savedAvatar);
    if (error.code === 'ER_DUP_ENTRY') throw new BadRequestError('That email address is already in use.');
    throw error;
  }
  if (previous.avatar !== savedAvatar) await removeAvatar(previous.avatar);
  return getProfileService(userId);
};
