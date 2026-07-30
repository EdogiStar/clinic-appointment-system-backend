const notificationService = require("../services/notification.service");

/**
 * Get current user's notifications
 */
const getMyNotifications = async (req, res) => {
  try {
    const notifications =
      await notificationService.getUserNotifications(
        req.user.id,
        req.query
      );

    res.status(200).json({
      message:
        "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve notifications",
      error: error.message,
    });
  }
};

/**
 * Get a single notification
 */
const getNotificationById = async (req, res) => {
  try {
    const notification =
      await notificationService.getNotificationById(
        req.params.id,
        req.user.id
      );

    res.status(200).json({
      message:
        "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    res.status(404).json({
      message:
        "Failed to retrieve notification",
      error: error.message,
    });
  }
};

/**
 * Mark one notification as read
 */
const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const notification =
      await notificationService.markNotificationAsRead(
        req.params.id,
        req.user.id
      );

    res.status(200).json({
      message:
        "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(404).json({
      message:
        "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsRead = async (
  req,
  res
) => {
  try {
    const notifications =
      await notificationService.markAllNotificationsAsRead(
        req.user.id
      );

    res.status(200).json({
      message:
        "All notifications marked as read",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};