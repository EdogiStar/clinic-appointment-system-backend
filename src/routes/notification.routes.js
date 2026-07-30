const express = require("express");

const authenticate = require("../middleware/auth.middleware");

const {
  getMyNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notification.controller");

const router = express.Router();

// Get logged-in user's notifications
router.get(
  "/",
  authenticate,
  getMyNotifications
);

// Mark all notifications as read
router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsAsRead
);

// Mark one notification as read
router.patch(
  "/:id/read",
  authenticate,
  markNotificationAsRead
);

// Get a single notification
router.get(
  "/:id",
  authenticate,
  getNotificationById
);

module.exports = router;