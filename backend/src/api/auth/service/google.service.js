import { db } from '../../../../db/config.js';
import { BadRequestError } from '../../../utils/errors/index.js';
import { verifyGoogleCredential } from './google-identity.js';
import { issueSession } from './session.js';

export async function googleLoginService(credential, dependencies = {}) {
  const identity = await (dependencies.verify || verifyGoogleCredential)(credential);
  const connection = await (dependencies.getConnection || (() => db.getConnection()))();
  let user;
  try {
    await connection.beginTransaction();
    const [subjects] = await connection.execute('SELECT * FROM users WHERE google_id = ? FOR UPDATE', [identity.googleId]);
    if (subjects.length) {
      // The immutable Google subject, rather than a mutable email, identifies returning users.
      user = subjects[0];
    } else {
      const [emails] = await connection.execute('SELECT * FROM users WHERE email = ? FOR UPDATE', [identity.email]);
      if (emails.length) {
        user = emails[0];
        if (user.google_id || !identity.authoritativeEmail) {
          throw new BadRequestError('This email already has an account. Sign in with your existing password or reset it.');
        }
        await connection.execute('UPDATE users SET google_id = ? WHERE user_id = ? AND google_id IS NULL', [identity.googleId, user.user_id]);
      } else {
        const [result] = await connection.execute(`INSERT INTO users
          (first_name, last_name, email, password_hash, google_id) VALUES (?, ?, ?, NULL, ?)`,
          [identity.firstName, identity.lastName, identity.email, identity.googleId]);
        user = { user_id: result.insertId, first_name: identity.firstName, last_name: identity.lastName, email: identity.email, auth_version: 0 };
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_LOCK_DEADLOCK') {
      throw new BadRequestError('Another sign-in is in progress. Please try again.');
    }
    throw error;
  } finally { connection.release(); }
  return issueSession(user);
}
