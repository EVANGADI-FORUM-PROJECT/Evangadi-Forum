import { normalizeAuthEmail } from './normalize-email.js';
import bcrypt from 'bcryptjs';
import { safeExecute, db } from '../../../../db/config.js';
import { BadRequestError } from '../../../utils/errors/index.js';
import { createResetToken, hashResetToken, isResetToken } from './reset-token.js';
import { createResetMailer } from './reset-mail.js';
import { recoveryConfig } from './auth.config.js';

export const RECOVERY_MESSAGE = 'If an account exists for that email, you will receive a reset link shortly.';

export async function forgotPasswordService(email, dependencies = {}) {
  const query = dependencies.query || safeExecute;
  const config = recoveryConfig();
  const send = dependencies.send || createResetMailer();
  const normalizedEmail = normalizeAuthEmail(email);
  const { token, hash } = createResetToken();
  // Both existing and nonexistent emails use one public database round trip.
  const updated = await query(`UPDATE users SET reset_token_hash = ?,
    reset_token_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), reset_requested_at = UTC_TIMESTAMP()
    WHERE email = ? AND (reset_requested_at IS NULL OR reset_requested_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 SECOND))`,
    [hash, normalizedEmail]);
  if (!updated.affectedRows) return;
  const url = new URL('/reset-password', config.origin);
  url.searchParams.set('token', token);
  const schedule = dependencies.schedule || setImmediate;
  schedule(async () => {
    try {
      const rows = await query('SELECT user_id, email FROM users WHERE email = ? AND reset_token_hash = ? LIMIT 1', [normalizedEmail, hash]);
      if (!rows.length) return;
      await send({ email: rows[0].email, link: url.toString() });
    } catch {
      console.error('Password recovery email delivery failed. Check mail configuration.');
      await query('UPDATE users SET reset_token_hash = NULL, reset_token_expires = NULL, reset_requested_at = NULL WHERE email = ? AND reset_token_hash = ?', [normalizedEmail, hash])
        .catch(() => console.error('Password recovery cleanup failed.'));
    }
  });
}

export async function resetPasswordService({ token, password }, dependencies = {}) {
  const invalid = () => new BadRequestError('Invalid or expired reset link. Request a new one.');
  if (!isResetToken(token)) throw invalid();
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new BadRequestError('Choose a password with at least 6 characters that is not too long.');
  }
  const connection = await (dependencies.getConnection || (() => db.getConnection()))();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(`SELECT user_id FROM users
      WHERE reset_token_hash = ? AND reset_token_expires > UTC_TIMESTAMP() FOR UPDATE`, [hashResetToken(token)]);
    if (!rows.length) throw invalid();
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.execute(`UPDATE users SET password_hash = ?, reset_token_hash = NULL,
      reset_token_expires = NULL, reset_requested_at = NULL, auth_version = auth_version + 1 WHERE user_id = ?`,
      [hashedPassword, rows[0].user_id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
