import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { db } from '../db/config.js';
import { authenticateUser } from '../src/middleware/authentication.js';
after(() => db.end());

test('reset sessions are rejected while matching versioned sessions pass', async t => {
  process.env.JWT_SECRET = 'test-only-secret';
  t.mock.method(db, 'execute', async () => [[{ auth_version: 1 }]]);
  const request = version => ({ headers: { authorization: 'Bearer ' + jwt.sign({ id: 1, type: 'session', version }, process.env.JWT_SECRET) } });
  await assert.rejects(authenticateUser(request(0), {}, () => {}), { statusCode: 401 });
  let called = false; const req = request(1);
  await authenticateUser(req, {}, () => { called = true; });
  assert.ok(called); assert.equal(req.user.id, 1);
});
test('non-session JWTs cannot authenticate and old sessions expire after reset', async t => {
  process.env.JWT_SECRET = 'test-only-secret';
  const execute = t.mock.method(db, 'execute', async () => [[{ auth_version: 0 }]]);
  const token = jwt.sign({ id: 1, type: 'password-reset' }, process.env.JWT_SECRET);
  await assert.rejects(authenticateUser({ headers: { authorization: 'Bearer ' + token } }, {}, () => {}), { statusCode: 401 });
  assert.equal(execute.mock.callCount(), 0);
  const legacy = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  await authenticateUser({ headers: { authorization: 'Bearer ' + legacy } }, {}, () => {});
});
