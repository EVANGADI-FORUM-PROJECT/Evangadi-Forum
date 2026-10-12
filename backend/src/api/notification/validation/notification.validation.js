import { param, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const getNotificationsValidation = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("limit must be between 1 and 50")
        .toInt(),
    validationErrorHandler,
];

export const notificationIdParamValidation = [
    param("notificationId")
        .isInt({ min: 1 })
        .withMessage("notificationId must be a positive integer")
        .toInt(),
    validationErrorHandler,
];
