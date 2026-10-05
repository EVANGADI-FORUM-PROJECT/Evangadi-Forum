import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db } from '../db/config.js';
import { deleteDocumentService } from '../src/api/rag/service/rag.service.js';

after(() => db.end());

test('deletes owned metadata even when its PDF is already missing', async t => {
  const queries = [];
  t.mock.method(db, 'execute', async (sql, params) => {
    queries.push({ sql, params });
    return sql.includes('SELECT')
      ? [[{ storage_path: 'uploads/rag/missing.pdf' }]]
      : [{ affectedRows: 1 }];
  });
  t.mock.method(fs, 'unlink', async () => {
    throw Object.assign(new Error('Missing'), { code: 'ENOENT' });
  });
  assert.deepEqual(await deleteDocumentService(7, 2), { id: 7 });
  assert.equal(queries.length, 2);
  assert.match(queries[1].sql, /DELETE FROM documents/);
  assert.deepEqual(queries[1].params, [7, 2]);
});

test('does not remove metadata when file deletion fails for another reason', async t => {
  const execute = t.mock.method(db, 'execute', async () => [[{ storage_path: 'locked.pdf' }]]);
  t.mock.method(fs, 'unlink', async () => {
    throw Object.assign(new Error('Denied'), { code: 'EACCES' });
  });
  await assert.rejects(deleteDocumentService(7, 2), { code: 'EACCES' });
  assert.equal(execute.mock.callCount(), 1);
});

test('rejects documents not owned by the current user before touching files', async t => {
  t.mock.method(db, 'execute', async () => [[]]);
  const unlink = t.mock.method(fs, 'unlink', async () => {});
  await assert.rejects(deleteDocumentService(7, 3), /Document not found/);
  assert.equal(unlink.mock.callCount(), 0);
});
