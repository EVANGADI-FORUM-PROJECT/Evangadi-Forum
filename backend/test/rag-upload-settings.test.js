import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { getRagUploadSettings } from '../src/utils/rag/uploadSettings.js';

test('upload defaults enforce a 10 MB cap and a backend-relative directory', () => {
  const settings = getRagUploadSettings({});
  assert.equal(settings.maxBytes, 10 * 1024 * 1024);
  assert.ok(path.isAbsolute(settings.directory));
  assert.ok(settings.directory.endsWith(path.join('backend', 'uploads', 'rag')));
});

test('honors custom upload paths and size limits', () => {
  const directory = path.resolve('custom-pdfs');
  assert.deepEqual(getRagUploadSettings({ RAG_UPLOAD_DIR: directory, RAG_MAX_UPLOAD_MB: '2.5' }), {
    directory, maxBytes: 2.5 * 1024 * 1024,
  });
});

test('rejects invalid upload size limits', () => {
  for (const value of ['0', '-1', 'abc', 'Infinity']) {
    assert.throws(() => getRagUploadSettings({ RAG_MAX_UPLOAD_MB: value }), RangeError);
  }
});
