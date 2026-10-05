import test from 'node:test';
import assert from 'node:assert/strict';
import { createResetToken, hashResetToken, isResetToken } from '../src/api/auth/service/reset-token.js';
import { recoveryConfig, googleClientId } from '../src/api/auth/service/auth.config.js';

test('reset tokens are random and stored as hashes', () => {
  const first = createResetToken();
  assert.equal(first.token.length, 64);
  assert.ok(isResetToken(first.token));
  assert.notEqual(first.token, first.hash);
  assert.equal(first.hash, hashResetToken(first.token));
  assert.notEqual(first.token, createResetToken().token);
  for (const value of ['', 'x'.repeat(64), {}, null]) assert.equal(isResetToken(value), false);
});
test('recovery links use a configured origin without URL credentials', () => {
  assert.equal(recoveryConfig({}).origin, 'http://localhost:5173');
  assert.equal(recoveryConfig({ FRONTEND_URL: 'https://forum.example/path' }).origin, 'https://forum.example');
  assert.throws(() => recoveryConfig({ FRONTEND_URL: 'file:///tmp' }));
  assert.throws(() => recoveryConfig({ FRONTEND_URL: 'https://user:pass@example.com' }));
});
test('Google settings are optional until Google login is requested', () => {
  assert.throws(() => googleClientId({}), { statusCode: 503 });
  assert.equal(googleClientId({ GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com' }), 'client.apps.googleusercontent.com');
});
