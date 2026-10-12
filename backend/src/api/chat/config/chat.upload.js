import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { BadRequestError } from '../../../utils/errors/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1, fields: 3, fieldSize: 25000 } });
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const audioTypes = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav']);
const blockedExtensions = new Set(['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.ps1', '.vbs']);

export const uploadMessage = (req, res, next) => {
  upload.single('file')(req, res, error => {
    if (error) return next(new BadRequestError(error.code === 'LIMIT_FILE_SIZE' ? 'File is too large. The limit is 25 MB.' : 'Unable to upload this file.'));
    next();
  });
};

export const attachmentPath = filename => path.join(process.cwd(), 'uploads', 'chat', path.basename(filename));

export const saveAttachment = async (file, kind) => {
  if (!file?.size) throw new BadRequestError('Choose a file or record a voice message first.');
  if (blockedExtensions.has(path.extname(file.originalname).toLowerCase())) throw new BadRequestError('This file type is not supported.');
  const mime = (file.mimetype || 'application/octet-stream').split(';')[0].toLowerCase();
  if (kind === 'voice' && !audioTypes.has(mime)) throw new BadRequestError('Voice messages must contain supported audio.');
  const type = kind === 'voice' ? 'voice' : imageTypes.has(mime) ? 'image' : 'file';
  const filename = crypto.randomBytes(16).toString('hex');
  await fs.mkdir(path.dirname(attachmentPath(filename)), { recursive: true });
  await fs.writeFile(attachmentPath(filename), file.buffer);
  return { filename, type, mime: type === 'file' ? 'application/octet-stream' : mime, name: path.basename(file.originalname).slice(0, 255), size: file.size };
};

export const removeAttachment = async filename => {
  if (!filename) return;
  try { await fs.unlink(attachmentPath(filename)); }
  catch (error) { if (error.code !== 'ENOENT') console.error('Unable to remove chat attachment:', error.message); }
};
