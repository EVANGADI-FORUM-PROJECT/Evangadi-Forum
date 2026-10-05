import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
export const googleLoginValidation = [
  body('credential').isString().bail().notEmpty().isLength({ max: 10000 }).withMessage('A Google credential is required.'),
  validationErrorHandler,
];
