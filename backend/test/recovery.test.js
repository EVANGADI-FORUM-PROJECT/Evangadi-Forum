import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { forgotPasswordService, resetPasswordService } from '../src/api/auth/service/recovery.service.js';
import { createResetToken } from '../src/api/auth/service/reset-token.js';

test('unknown emails receive no message and no token is persisted', async () => {
  let sent = false;
  await forgotPasswordService('unknown@example.com', { query: async () => [], send: async () => { sent = true; } });
  assert.equal(sent, false);
});
test('recovery stores only a hash and respects the cooldown', async () => {
  const queries = []; let link;
  const query = async (sql, params) => {
    queries.push({ sql, params });
    return sql.startsWith('SELECT') ? [{ user_id: 1, email: 'member@example.com' }] : { affectedRows: 1 };
  };
  await forgotPasswordService(' MEMBER@EXAMPLE.COM ', { query, send: async value => { link = value.link; } });
  const raw = new URL(link).searchParams.get('token');
  assert.notEqual(queries[1].params[0], raw);
  assert.match(queries[1].sql, /60 SECOND/);
  assert.equal(queries[0].params[0], 'member@example.com');
});
test('reset hashes the new password, clears the token, and increments the session version', async () => {
  const { token } = createResetToken(); let consumed = false; let released = 0; let rolledBack = 0;
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => { rolledBack++; }, release: () => { released++; },
    execute: async (sql, params) => {
      if (sql.startsWith('SELECT')) {
        assert.match(sql, /FOR UPDATE/);
        assert.match(sql, /reset_token_expires > UTC_TIMESTAMP/);
        return [consumed ? [] : [{ user_id: 1 }]];
      }
      consumed = true;
      assert.ok(await bcrypt.compare('new-password', params[0]));
      assert.match(sql, /auth_version = auth_version \+ 1/);
      assert.match(sql, /reset_token_hash = NULL/);
      return [{ affectedRows: 1 }];
    },
  };
  const getConnection = async () => connection;
  await resetPasswordService({ token, password: 'new-password' }, { getConnection });
  await assert.rejects(resetPasswordService({ token, password: 'new-password' }, { getConnection }), /Invalid or expired/);
  assert.equal(released, 2); assert.equal(rolledBack, 1);
});
test('malformed links and oversized passwords are rejected before connecting', async () => {
  const getConnection = () => { throw new Error('Should not connect'); };
  await assert.rejects(resetPasswordService({ token: 'bad', password: 'password' }, { getConnection }), /Invalid or expired/);
  await assert.rejects(resetPasswordService({ token: createResetToken().token, password: 'a'.repeat(73) }, { getConnection }), /not too long/);
});
