import { ServiceUnavailableError } from '../../../utils/errors/index.js';

export function recoveryConfig(env = process.env) {
  const origin = new URL(env.FRONTEND_URL || 'http://localhost:5173');
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) {
    throw new ServiceUnavailableError('Password recovery is not configured correctly.');
  }
  return { origin: origin.origin, expiresMinutes: 15, cooldownSeconds: 60 };
}

export function googleClientId(env = process.env) {
  const id = env.GOOGLE_CLIENT_ID?.trim();
  if (!id || id.startsWith('your_')) {
    throw new ServiceUnavailableError('Google sign-in is not configured. Use email and password.');
  }
  return id;
}
