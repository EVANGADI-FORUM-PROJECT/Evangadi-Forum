import express from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../../middleware/authentication.js';
import { validationErrorHandler } from '../../middleware/validation-handler.js';
import { getProfileController, updateProfileController } from './profile.controller.js';

const router = express.Router();
router.get('/', authenticateUser, getProfileController);
router.put('/', authenticateUser, [
  body('firstName').isString().trim().isLength({ min: 3, max: 50 }).withMessage('First name must be between 3 and 50 characters.'),
  body('lastName').isString().trim().isLength({ min: 3, max: 50 }).withMessage('Last name must be between 3 and 50 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('avatar').optional({ nullable: true }).isString(),
  validationErrorHandler,
], updateProfileController);

export default router;
