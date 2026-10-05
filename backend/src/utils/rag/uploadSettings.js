import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../../../', import.meta.url));

export function getRagUploadSettings(env = process.env) {
  const value = env.RAG_MAX_UPLOAD_MB;
  const megabytes = value?.trim() ? Number(value) : 10;
  if (!Number.isFinite(megabytes) || megabytes <= 0) {
    throw new RangeError('RAG_MAX_UPLOAD_MB must be a positive number');
  }
  return {
    directory: path.resolve(backendDirectory, env.RAG_UPLOAD_DIR || 'uploads/rag'),
    maxBytes: megabytes * 1024 * 1024,
  };
}
