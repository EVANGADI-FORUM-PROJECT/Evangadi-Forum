import nodemailer from 'nodemailer';
import { ServiceUnavailableError } from '../../../utils/errors/index.js';

export function createResetMailer(env = process.env) {
  if (!env.EMAIL_USER || !env.EMAIL_PASSWORD || env.EMAIL_USER.startsWith('your_')) {
    throw new ServiceUnavailableError('Password recovery email is not configured.');
  }
  const smtp = env.SMTP_HOST
    ? { host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true' }
    : { service: env.EMAIL_SERVICE || 'gmail' };
  const transport = nodemailer.createTransport({
    ...smtp, auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
    connectionTimeout: 10000, socketTimeout: 15000,
  });
  return async ({ email, link }) => transport.sendMail({
    from: env.EMAIL_FROM || env.EMAIL_USER,
    to: email,
    subject: 'Reset your Evangadi Forum password',
    text: `Use this link to choose a new password: ${link}\n\nIt expires in 15 minutes and can be used once. If you did not request it, ignore this email.`,
  });
}
