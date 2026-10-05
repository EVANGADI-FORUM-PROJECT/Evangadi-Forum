import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const forgotPasswordValidation = [
  body('email').isString().bail().trim().isEmail().withMessage('Enter a valid email address.').isLength({ max: 320 }).toLowerCase(),
  validationErrorHandler,
];
export const resetPasswordValidation = [
  body('token').isString().bail().matches(/^[a-f0-9]{64}$/).withMessage('Invalid reset link.'),
  body('password').isString().bail().isLength({ min: 6 }).withMessage('Password must be at least 6 characters.').isByteLength({ max: 72 }).withMessage('Password is too long.'),
  validationErrorHandler,
];
