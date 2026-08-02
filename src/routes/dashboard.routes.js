const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  getAdminDashboard,
} = require("../controllers/dashboard.controller");

const router = express.Router();

// Admin dashboard
router.get(
  "/admin",
  authenticate,
  requireRole("admin"),
  getAdminDashboard
);

module.exports = router;