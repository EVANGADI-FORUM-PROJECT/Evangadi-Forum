import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { googleLoginService } from '../src/api/auth/service/google.service.js';

const identity = { googleId: 'subject', email: 'person@gmail.com', firstName: 'Person', lastName: 'Test', authoritativeEmail: true };
function dependencies(subjects = [], emails = [], override = {}) {
  const queries = []; let rolledBack = false; let released = false;
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => { rolledBack = true; }, release: () => { released = true; },
    execute: async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('WHERE google_id')) return [subjects];
      if (sql.includes('WHERE email')) return [emails];
      return [{ insertId: 7, affectedRows: 1 }];
    },
  };
  return { verify: async () => ({ ...identity, ...override }), getConnection: async () => connection, queries, released: () => released, rolledBack: () => rolledBack };
}
test('new Google users get a passwordless account and a forum session', async () => {
  process.env.JWT_SECRET = 'test-only-secret';
  const deps = dependencies(); const result = await googleLoginService('credential', deps);
  assert.equal(result.user.id, 7);
  assert.match(deps.queries[2].sql, /NULL/);
  assert.equal(jwt.verify(result.token, process.env.JWT_SECRET).type, 'session');
  assert.ok(deps.released());
});
test('returning subjects retain their existing forum identity even if email changes', async () => {
  process.env.JWT_SECRET = 'test-only-secret';
  const deps = dependencies([{ user_id: 2, email: 'old@gmail.com', first_name: 'Existing', auth_version: 3 }]);
  const result = await googleLoginService('credential', deps);
  assert.equal(result.user.id, 2); assert.equal(deps.queries.length, 1);
  assert.equal(jwt.verify(result.token, process.env.JWT_SECRET).version, 3);
});
test('authoritative verified emails link to local accounts without removing passwords', async () => {
  process.env.JWT_SECRET = 'test-only-secret';
  const deps = dependencies([], [{ user_id: 2, email: identity.email, first_name: 'Existing', google_id: null }]);
  await googleLoginService('credential', deps);
  assert.match(deps.queries[2].sql, /UPDATE users SET google_id/);
  assert.doesNotMatch(deps.queries[2].sql, /password_hash/);
});
test('untrusted matching emails and conflicting subjects cannot link accounts', async () => {
  for (const [user, override] of [[{ user_id: 2, google_id: null }, { authoritativeEmail: false }], [{ user_id: 2, google_id: 'different' }, {}]]) {
    const deps = dependencies([], [user], override);
    await assert.rejects(googleLoginService('credential', deps), { statusCode: 400 });
    assert.equal(deps.queries.length, 2); assert.ok(deps.rolledBack()); assert.ok(deps.released());
  }
});
