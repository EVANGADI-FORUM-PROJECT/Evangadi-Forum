import test from 'node:test';
import assert from 'node:assert/strict';
import { authRateLimit } from '../src/middleware/auth-rate-limit.js';
test('auth limits are scoped by address and expire after their window', () => {
  let time = 0; let accepted = 0; let status; let retry;
  const limiter = authRateLimit({ max: 2, windowMs: 1000, now: () => time });
  const response = { setHeader: (name, value) => { retry = value; }, status: value => { status = value; return response; }, json: () => {} };
  const next = () => { accepted++; };
  limiter({ ip: 'one' }, response, next); limiter({ ip: 'one' }, response, next); limiter({ ip: 'one' }, response, next);
  assert.equal(status, 429); assert.equal(retry, '1'); assert.equal(accepted, 2);
  limiter({ ip: 'two' }, response, next); assert.equal(accepted, 3);
  time = 1001; limiter({ ip: 'one' }, response, next); assert.equal(accepted, 4);
});
