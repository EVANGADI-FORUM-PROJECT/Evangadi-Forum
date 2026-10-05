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
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await query('SELECT user_id, email FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
  if (!rows.length) return;
  const { token, hash } = createResetToken();
  const updated = await query(`UPDATE users SET reset_token_hash = ?,
    reset_token_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), reset_requested_at = UTC_TIMESTAMP()
    WHERE user_id = ? AND (reset_requested_at IS NULL OR reset_requested_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 SECOND))`,
    [hash, rows[0].user_id]);
  if (!updated.affectedRows) return;
  const url = new URL('/reset-password', config.origin);
  url.searchParams.set('token', token);
  try {
    await send({ email: rows[0].email, link: url.toString() });
  } catch {
    // Keep the public response identical for existing and nonexistent accounts.
    console.error('Password recovery email delivery failed. Check mail configuration.');
    await query('UPDATE users SET reset_token_hash = NULL, reset_token_expires = NULL, reset_requested_at = NULL WHERE user_id = ? AND reset_token_hash = ?', [rows[0].user_id, hash]);
  }
}
