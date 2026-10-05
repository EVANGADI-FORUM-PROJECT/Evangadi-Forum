import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedGoogleClaims, verifyGoogleCredential } from '../src/api/auth/service/google-identity.js';

test('only verified Google identities are accepted', () => {
  for (const payload of [null, {}, { sub: '123', email: 'person@gmail.com', email_verified: false }]) {
    assert.throws(() => verifiedGoogleClaims(payload), { statusCode: 401 });
  }
});
test('Google email authority is restricted to Gmail and hosted domains', () => {
  const claim = { sub: '123', email: ' PERSON@GMAIL.COM ', email_verified: true };
  assert.equal(verifiedGoogleClaims(claim).email, 'person@gmail.com');
  assert.equal(verifiedGoogleClaims(claim).authoritativeEmail, true);
  assert.equal(verifiedGoogleClaims({ ...claim, email: 'person@example.com' }).authoritativeEmail, false);
  assert.equal(verifiedGoogleClaims({ ...claim, email: 'person@company.com', hd: 'company.com' }).authoritativeEmail, true);
});
test('the verifier receives the configured audience and maps invalid tokens to 401', async () => {
  const old = process.env.GOOGLE_CLIENT_ID; process.env.GOOGLE_CLIENT_ID = 'test-client';
  try {
    const verifier = { verifyIdToken: async options => {
      assert.deepEqual(options, { idToken: 'credential', audience: 'test-client' });
      return { getPayload: () => ({ sub: '123', email: 'person@gmail.com', email_verified: true }) };
    } };
    assert.equal((await verifyGoogleCredential('credential', verifier)).googleId, '123');
    await assert.rejects(verifyGoogleCredential('bad', { verifyIdToken: async () => { throw new Error('Invalid signature'); } }), { statusCode: 401 });
  } finally {
    if (old === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID = old;
  }
});

test('malformed email claims cannot create forum accounts', () => {
  for (const email of ['invalid', 'member@', 'a@b@gmail.com']) {
    assert.throws(() => verifiedGoogleClaims({ sub: 'subject', email, email_verified: true }), { statusCode: 401 });
  }
});
