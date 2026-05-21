const { Notification } = require('../models');

/**
 * GET /api/notifications
 * Protected — all authenticated users.
 * Returns all notifications for the authenticated user, ordered by newest first.
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    console.error('[NOTIFICATION] getNotifications error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/notifications/unread-count
 * Protected — all authenticated users.
 * Returns the count of unread notifications for the authenticated user.
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    res.status(200).json({ success: true, unread_count: count });
  } catch (error) {
    console.error('[NOTIFICATION] getUnreadCount error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/notifications/:id/mark-read
 * Protected — all authenticated users.
 * Marks a specific notification as read.
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await notification.update({ is_read: true });

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('[NOTIFICATION] markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Protected — all authenticated users.
 * Marks all notifications for the authenticated user as read.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[NOTIFICATION] markAllAsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
