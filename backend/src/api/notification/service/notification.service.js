import { NotFoundError, ForbiddenError } from "../../../utils/errors/index.js";
import { safeExecute } from "../../../../db/config.js";
import { getIO, userRoom } from "../../../utils/socket/io.js";

const mapNotification = row => ({
    id: row.id,
    type: row.type,
    message: row.message,
    isRead: !!row.isRead,
    createdAt: row.createdAt,
    questionHash: row.questionHash,
});

// ! ==========================================================================
// # LIST / GET
// GET /api/notifications
// ! ==========================================================================
export const getNotificationsService = async ({ userId, limit }) => {
    // mysql2 prepared statements don't reliably support a placeholder for LIMIT,
    // so we validate+clamp the number ourselves and inline it directly — safe,
    // since it's a checked integer, never a raw string from the request.
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const rows = await safeExecute(
        `SELECT n.notification_id AS id,
                n.type,
                n.message,
                n.is_read AS isRead,
                n.created_at AS createdAt,
                q.question_hash AS questionHash
         FROM notifications n
         JOIN questions q ON q.question_id = n.question_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT ${safeLimit}`,
        [userId]
    );

    return rows.map(mapNotification);
};

// ! ==========================================================================
// # UNREAD COUNT
// GET /api/notifications/unread-count
// ! ==========================================================================
export const getUnreadCountService = async ({ userId }) => {
    const rows = await safeExecute(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );
    return rows[0].count;
};

// ! ==========================================================================
// # MARK ONE READ
// PATCH /api/notifications/:notificationId/read
// ! ==========================================================================
export const markNotificationReadService = async ({ userId, notificationId }) => {
    const rows = await safeExecute(
        `SELECT notification_id, user_id FROM notifications WHERE notification_id = ? LIMIT 1`,
        [notificationId]
    );
    if (rows.length === 0) {
        throw new NotFoundError("Notification not found");
    }
    // Don't trust the frontend: re-derive ownership from the DB before allowing the update.
    if (rows[0].user_id !== userId) {
        throw new ForbiddenError("This notification does not belong to you");
    }

    await safeExecute(`UPDATE notifications SET is_read = TRUE WHERE notification_id = ?`, [notificationId]);
    return { id: notificationId, isRead: true };
};

// ! ==========================================================================
// # MARK ALL READ
// PATCH /api/notifications/read-all
// ! ==========================================================================
export const markAllNotificationsReadService = async ({ userId }) => {
    await safeExecute(`UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`, [userId]);
    return { success: true };
};

// ! ==========================================================================
// # SIDE-EFFECT HELPERS — called by question/answer creation, never by a route directly.
// Both are "fire and forget": a notification failure must never break the
// question/answer that triggered it, so every failure is caught and logged here.
// ! ==========================================================================

// Called right after a question is successfully created. Notifies every OTHER
// user (not the asker) that a new question was posted.
export const notifyNewQuestion = async ({ questionId, questionHash, title, authorId, authorFirstName }) => {
    try {
        const message = `${authorFirstName} posted a new question: "${title}"`;

        // One query fans this out to every other user at once, instead of
        // looping and inserting one row at a time.
        await safeExecute(
            `INSERT INTO notifications (user_id, type, question_id, message)
             SELECT user_id, 'new_question', ?, ?
             FROM users
             WHERE user_id != ?`,
            [questionId, message, authorId]
        );

        // Live push to everyone currently connected except the asker themself.
        // (The exact per-recipient notification id isn't sent here — the socket
        // event is just a "something new happened" nudge; the notification bell
        // re-fetches the real list from the REST API to get accurate ids/state.)
        getIO().except(userRoom(authorId)).emit("notification:new", {
            type: "new_question",
            message,
            questionHash,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("notifyNewQuestion failed (non-fatal):", error);
    }
};

// Called right after an answer is successfully created. Notifies only the
// question's author (createAnswerService already blocks self-answering, so
// the recipient is never the answerer themself).
export const notifyNewAnswer = async ({ questionId, answerId, recipientUserId, answererFirstName }) => {
    try {
        const rows = await safeExecute(
            `SELECT question_hash AS questionHash, title FROM questions WHERE question_id = ? LIMIT 1`,
            [questionId]
        );
        if (rows.length === 0) return; // question vanished between requests — nothing to notify about

        const { questionHash, title } = rows[0];
        const message = `${answererFirstName} answered your question: "${title}"`;

        const result = await safeExecute(
            `INSERT INTO notifications (user_id, type, question_id, answer_id, message)
             VALUES (?, 'new_answer', ?, ?, ?)`,
            [recipientUserId, questionId, answerId, message]
        );

        // This one has exactly one recipient, so we can send the real id/state.
        getIO().to(userRoom(recipientUserId)).emit("notification:new", {
            id: result.insertId,
            type: "new_answer",
            message,
            questionHash,
            isRead: false,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("notifyNewAnswer failed (non-fatal):", error);
    }
};
