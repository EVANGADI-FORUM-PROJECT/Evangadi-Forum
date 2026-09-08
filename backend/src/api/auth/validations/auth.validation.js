import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';


// Each body() call creates a validation middleware for a field in req.body.
// The validation rules are executed in order and the results are stored
// for the current request. validationErrorHandler checks those results.

export const registerValidation = [
  //firstName-middleware 
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 3 })
    .withMessage('First name must be at least 3 characters long'),
  //lastName-middleware 
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 3 })
    .withMessage('Last name must be at least 3 characters long'),
  //email-middleware 
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  //password-middleware 
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  // Checks the validation results collected above.
  validationErrorHandler,
];




export const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),

  validationErrorHandler,
];
