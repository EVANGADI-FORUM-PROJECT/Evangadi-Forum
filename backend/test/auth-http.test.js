import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { db } from '../db/config.js';
let server; let origin;
before(async () => {
  process.env.JWT_SECRET = 'test-only-secret';
  const { default: router } = await import('../src/api/auth/routes/auth.route.js');
  const app = express(); app.use(express.json()); app.use('/api/auth', router);
  app.use((error, req, res, next) => { void next; res.status(error.statusCode || 500).json({ message: error.message }); });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  origin = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await db.end(); });
for (const [path, body] of [
  ['forgot-password', { email: 'invalid' }], ['reset-password', { token: 'bad', password: 'abcdef' }],
  ['reset-password', { token: 'a'.repeat(64), password: 'short' }], ['google', { credential: '' }],
]) {
  test(path + ' rejects malformed input without contacting providers', async () => {
    const response = await fetch(origin + '/api/auth/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 400);
  });
}
