const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Notification Endpoints ─────────────────────────────────────────────────────
router.get('/',                       protect, notificationController.getNotifications);
router.get('/unread-count',           protect, notificationController.getUnreadCount);
router.patch('/:id/mark-read',        protect, notificationController.markAsRead);
router.patch('/mark-all-read',        protect, notificationController.markAllAsRead);

module.exports = router;
