import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText } from '../src/utils/rag/chunk.js';

test('splits text into overlapping chunks without losing content', () => {
  assert.deepEqual(chunkText('abcdefghij', 4, 1), ['abcd', 'defg', 'ghij', 'j']);
  assert.deepEqual(chunkText('abcdefgh', 4, 0), ['abcd', 'efgh']);
  assert.deepEqual(chunkText('', 4, 1), []);
});

test('rejects settings that cannot advance the chunking loop', () => {
  for (const size of [0, -1, NaN, Infinity, 2.5, '4']) {
    assert.throws(() => chunkText('text', size, 0), RangeError);
  }
  for (const overlap of [-1, 4, 5, NaN, Infinity, 0.5, '1']) {
    assert.throws(() => chunkText('text', 4, overlap), RangeError);
  }
  assert.throws(() => chunkText(null, 4, 0), TypeError);
});
