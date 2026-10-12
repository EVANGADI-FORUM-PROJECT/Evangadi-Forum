import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { db } from '../db/config.js';

process.env.JWT_SECRET = 'socket-test-secret';
const { initSocket } = await import('../src/socket/socket.server.js');
const server = http.createServer();
const io = initSocket(server);
const authenticate = io.of('/')._fns[0];
after(async () => { await io.close(); await db.end(); });
const attempt = token => new Promise(resolve => {
  const socket = { handshake: { auth: { token } } };
  authenticate(socket, error => resolve({ socket, error }));
});

test('socket connections reject password-reset-revoked sessions', async t => {
  t.mock.method(db, 'execute', async () => [[{ auth_version: 2 }]]);
  const token = version => jwt.sign({ id: 1, type: 'session', version }, process.env.JWT_SECRET);
  assert.ok((await attempt(token(1))).error);
  const result = await attempt(token(2));
  assert.equal(result.error, undefined);
  assert.equal(result.socket.userId, 1);
});

test('socket connections reject missing credentials and non-session tokens', async t => {
  const execute = t.mock.method(db, 'execute', async () => [[{ auth_version: 0 }]]);
  assert.ok((await attempt(undefined)).error);
  assert.ok((await attempt(jwt.sign({ id: 1, type: 'password-reset' }, process.env.JWT_SECRET))).error);
  assert.equal(execute.mock.callCount(), 0);
});
