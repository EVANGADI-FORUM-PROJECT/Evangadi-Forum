import jwt from 'jsonwebtoken';
import { safeExecute } from '../../db/config.js';
import { UnauthenticatedError } from '../utils/errors/index.js';

export const authenticateUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new UnauthenticatedError('Authentication invalid');
  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isInteger(payload.id) || payload.id < 1 || (payload.type && payload.type !== 'session')) throw new Error('Invalid session');
    if (payload.version !== undefined && (!Number.isInteger(payload.version) || payload.version < 0)) throw new Error('Invalid session');
  } catch { throw new UnauthenticatedError('Authentication invalid'); }
  const rows = await safeExecute('SELECT auth_version FROM users WHERE user_id = ? LIMIT 1', [payload.id]);
  // Existing versionless tokens remain valid until a user's first password reset.
  if (!rows.length || Number(rows[0].auth_version) !== (payload.version ?? 0)) {
    throw new UnauthenticatedError('Your session has expired. Please sign in again.');
  }
  req.user = { id: payload.id, firstName: payload.firstName, lastName: payload.lastName };
  next();
};
