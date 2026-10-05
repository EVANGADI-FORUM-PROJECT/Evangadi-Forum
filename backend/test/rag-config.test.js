import test from 'node:test';
import assert from 'node:assert/strict';
import { getVectorConfig } from '../src/utils/rag/vector.js';

test('RAG search uses defaults and validates configured values', () => {
  const oldThreshold = process.env.RAG_SEARCH_THRESHOLD;
  const oldK = process.env.RAG_SEARCH_K;
  try {
    delete process.env.RAG_SEARCH_THRESHOLD;
    delete process.env.RAG_SEARCH_K;
    assert.deepEqual(getVectorConfig(), { ragThreshold: 0.45, ragK: 10 });
    process.env.RAG_SEARCH_THRESHOLD = '0';
    process.env.RAG_SEARCH_K = '5';
    assert.deepEqual(getVectorConfig(), { ragThreshold: 0, ragK: 5 });
    for (const threshold of ['abc', '-1', '1.1', 'Infinity']) {
      process.env.RAG_SEARCH_THRESHOLD = threshold;
      assert.throws(getVectorConfig, RangeError);
    }
    process.env.RAG_SEARCH_THRESHOLD = '0.45';
    for (const k of ['0', '-1', '1.5', '51', 'abc']) {
      process.env.RAG_SEARCH_K = k;
      assert.throws(getVectorConfig, RangeError);
    }
  } finally {
    if (oldThreshold === undefined) delete process.env.RAG_SEARCH_THRESHOLD;
    else process.env.RAG_SEARCH_THRESHOLD = oldThreshold;
    if (oldK === undefined) delete process.env.RAG_SEARCH_K;
    else process.env.RAG_SEARCH_K = oldK;
  }
});
