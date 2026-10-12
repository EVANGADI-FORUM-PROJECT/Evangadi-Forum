import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import {
    getNotificationsController,
    getUnreadCountController,
    markNotificationReadController,
    markAllNotificationsReadController,
} from "../controller/notification.controller.js";
import {
    getNotificationsValidation,
    notificationIdParamValidation,
} from "../validation/notification.validation.js";

const router = express.Router();

// GET /api/notifications
router.get("/", authenticateUser, getNotificationsValidation, getNotificationsController);

// GET /api/notifications/unread-count
router.get("/unread-count", authenticateUser, getUnreadCountController);

// PATCH /api/notifications/read-all
// (must be registered before the "/:notificationId/read" route so "read-all" isn't parsed as an id)
router.patch("/read-all", authenticateUser, markAllNotificationsReadController);

// PATCH /api/notifications/:notificationId/read
router.patch(
    "/:notificationId/read",
    authenticateUser,
    notificationIdParamValidation,
    markNotificationReadController
);

export default router;
