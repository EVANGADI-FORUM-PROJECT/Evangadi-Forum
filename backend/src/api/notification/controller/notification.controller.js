import { StatusCodes } from "http-status-codes";
import {
    getNotificationsService,
    getUnreadCountService,
    markNotificationReadService,
    markAllNotificationsReadService,
} from "../service/notification.service.js";

// GET /api/notifications
export const getNotificationsController = async (req, res, next) => {
    try {
        const data = await getNotificationsService({ userId: req.user.id, limit: req.query.limit });
        res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// GET /api/notifications/unread-count
export const getUnreadCountController = async (req, res, next) => {
    try {
        const count = await getUnreadCountService({ userId: req.user.id });
        res.status(StatusCodes.OK).json({ success: true, data: { count } });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/notifications/:notificationId/read
export const markNotificationReadController = async (req, res, next) => {
    try {
        const data = await markNotificationReadService({
            userId: req.user.id,
            notificationId: req.params.notificationId,
        });
        res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/notifications/read-all
export const markAllNotificationsReadController = async (req, res, next) => {
    try {
        const data = await markAllNotificationsReadService({ userId: req.user.id });
        res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
