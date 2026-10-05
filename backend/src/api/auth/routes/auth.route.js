import { forgotPasswordController, resetPasswordController } from '../controller/recovery.controller.js';
import { forgotPasswordValidation, resetPasswordValidation } from '../validations/recovery.validation.js';
import { authRateLimit } from '../../../middleware/auth-rate-limit.js';
import express from 'express';
import {
  registerController,
  loginController,
} from '../controller/auth.controller.js';
import {
  registerValidation,
  loginValidation,
} from '../validations/auth.validation.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, registerController);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', loginValidation, loginController);

router.post('/forgot-password', authRateLimit(), forgotPasswordValidation, forgotPasswordController);
router.post('/reset-password', authRateLimit(), resetPasswordValidation, resetPasswordController);

export default router;
