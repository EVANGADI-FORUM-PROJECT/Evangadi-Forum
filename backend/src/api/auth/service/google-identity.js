import { OAuth2Client } from 'google-auth-library';
import { googleClientId } from './auth.config.js';
import { UnauthenticatedError } from '../../../utils/errors/index.js';

export function verifiedGoogleClaims(payload) {
  if (!payload || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255 ||
      typeof payload.email !== 'string' || !payload.email.includes('@') || payload.email.length > 320 || payload.email_verified !== true) {
    throw new UnauthenticatedError('Unable to verify your Google account.');
  }
  const email = payload.email.trim().toLowerCase();
  return {
    googleId: payload.sub, email,
    firstName: String(payload.given_name || payload.name || 'Google user').slice(0, 50),
    lastName: String(payload.family_name || '').slice(0, 50),
    authoritativeEmail: email.endsWith('@gmail.com') || (typeof payload.hd === 'string' && Boolean(payload.hd)),
  };
}

export async function verifyGoogleCredential(credential, verifier) {
  const audience = googleClientId();
  if (typeof credential !== 'string' || !credential) throw new UnauthenticatedError('Google credential is required.');
  try {
    const client = verifier || new OAuth2Client(audience);
    const ticket = await client.verifyIdToken({ idToken: credential, audience });
    return verifiedGoogleClaims(ticket.getPayload());
  } catch { throw new UnauthenticatedError('Invalid or expired Google credential. Please try again.'); }
}
