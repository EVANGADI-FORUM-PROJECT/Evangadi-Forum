import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/config.js';
process.env.JWT_SECRET = 'local-login-test-secret';
const { loginService } = await import('../src/api/auth/service/auth.service.js');
after(() => db.end());
test('Google-only accounts reject local passwords with a normal auth error', async t => {
  t.mock.method(db, 'execute', async () => [[{ user_id: 1, password_hash: null }]]);
  await assert.rejects(loginService({ email: 'member@gmail.com', password: 'anything' }), { statusCode: 401 });
});
test('local password login retains its session response and normalized lookup', async t => {
  const hash = await bcrypt.hash('password', 10);
  t.mock.method(db, 'execute', async (sql, params) => {
    assert.equal(params[0], 'member@gmail.com');
    return [[{ user_id: 1, first_name: 'Member', last_name: 'Test', email: params[0], password_hash: hash, auth_version: 2 }]];
  });
  const result = await loginService({ email: ' MEMBER@GMAIL.COM ', password: 'password' });
  assert.equal(result.user.id, 1);
  assert.equal(jwt.verify(result.token, process.env.JWT_SECRET).version, 2);
});
