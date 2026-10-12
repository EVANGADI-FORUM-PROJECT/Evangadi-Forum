import { body, param, query } from 'express-validator';
export const readValidation = [body('lastMessageId').isInt({ min: 0 }).withMessage('A valid last message ID is required.')];

export const idValidation = [param('id').isInt({ min: 1 }).withMessage('A valid ID is required.')];
export const messageIdValidation = [...idValidation, param('messageId').isInt({ min: 1 }).withMessage('A valid message ID is required.')];
export const contentValidation = [body('content').isString().bail().trim().isLength({ min: 1, max: 5000 }).withMessage('Message must contain 1 to 5000 characters.')];
export const createValidation = [body('userId').isInt({ min: 1 }).withMessage('Choose a member.')];

export const deleteValidation = [query('scope').optional().isIn(['me', 'everyone']).withMessage('Choose a valid delete option.')];
export const editValidation = [body('content').isString().bail().trim().isLength({ max: 5000 }).withMessage('Message must be 5000 characters or fewer.')];
export const attachmentValidation = [
  body('kind').optional().isIn(['file', 'image', 'voice']).withMessage('Choose a supported attachment type.'),
  body('caption').optional().isString().bail().trim().isLength({ max: 5000 }).withMessage('Caption must be 5000 characters or fewer.'),
  body('duration').optional().isInt({ min: 0, max: 3600 }).withMessage('Voice duration must be at most one hour.'),
];
