import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import * as controller from '../controller/discussion.controller.js';
import { idValidation, messageIdValidation, contentValidation, createValidation, readValidation, deleteValidation, editValidation, attachmentValidation } from '../validation/discussion.validation.js';

import { uploadMessage } from '../../chat/config/chat.upload.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/rooms', controller.list);
router.post('/rooms', createValidation, validationErrorHandler, controller.create);
router.put('/rooms/:id', idValidation, createValidation, validationErrorHandler, controller.renameRoom);
router.delete('/rooms/:id', idValidation, validationErrorHandler, controller.deleteRoom);
router.get('/rooms/:id/messages', idValidation, validationErrorHandler, controller.listMessages);
router.post('/rooms/:id/read', idValidation, readValidation, validationErrorHandler, controller.markRead);
router.post('/rooms/:id/messages', idValidation, contentValidation, validationErrorHandler, controller.sendMessage);
router.put('/rooms/:id/messages/:messageId', messageIdValidation, editValidation, validationErrorHandler, controller.editMessage);
router.delete('/rooms/:id/messages/:messageId', messageIdValidation, deleteValidation, validationErrorHandler, controller.deleteMessage);
router.post('/rooms/:id/attachments', idValidation, validationErrorHandler, controller.checkAccess, uploadMessage, attachmentValidation, validationErrorHandler, controller.sendAttachment);
router.get('/rooms/:id/messages/:messageId/attachment', messageIdValidation, validationErrorHandler, controller.getAttachment);
export default router;
