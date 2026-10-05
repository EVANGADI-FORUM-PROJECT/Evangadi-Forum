import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAuthEmail } from '../src/api/auth/service/normalize-email.js';
test('Google and recovery lookup match existing Gmail normalization', () => {
  assert.equal(normalizeAuthEmail(' Learner.Name+forum@GMAIL.COM '), 'learnername@gmail.com');
  assert.equal(normalizeAuthEmail('Learner.Name@googlemail.com'), 'learnername@gmail.com');
  assert.equal(normalizeAuthEmail(' Learner@Example.com '), 'learner@example.com');
});
