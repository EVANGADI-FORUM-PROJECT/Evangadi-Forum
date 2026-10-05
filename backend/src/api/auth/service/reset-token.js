import { randomBytes, createHash } from 'node:crypto';

export const hashResetToken = token => createHash('sha256').update(token).digest('hex');
export const isResetToken = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
export function createResetToken() {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashResetToken(token) };
}
