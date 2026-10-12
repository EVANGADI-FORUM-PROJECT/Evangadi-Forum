import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import * as controller from '../controller/chat.controller.js';
import { idValidation, messageIdValidation, contentValidation, createValidation, readValidation, deleteValidation, editValidation, attachmentValidation } from '../validation/chat.validation.js';

import { uploadMessage } from '../config/chat.upload.js';

const router = express.Router();
router.use(authenticateUser);
router.get('/users', controller.listUsers);
router.get('/conversations', controller.list);
router.post('/conversations', createValidation, validationErrorHandler, controller.create);
router.get('/conversations/:id/messages', idValidation, validationErrorHandler, controller.listMessages);
router.post('/conversations/:id/read', idValidation, readValidation, validationErrorHandler, controller.markRead);
router.post('/conversations/:id/messages', idValidation, contentValidation, validationErrorHandler, controller.sendMessage);
router.put('/conversations/:id/messages/:messageId', messageIdValidation, editValidation, validationErrorHandler, controller.editMessage);
router.delete('/conversations/:id/messages/:messageId', messageIdValidation, deleteValidation, validationErrorHandler, controller.deleteMessage);
router.post('/conversations/:id/attachments', idValidation, validationErrorHandler, controller.checkAccess, uploadMessage, attachmentValidation, validationErrorHandler, controller.sendAttachment);
router.get('/conversations/:id/messages/:messageId/attachment', messageIdValidation, validationErrorHandler, controller.getAttachment);
export default router;
