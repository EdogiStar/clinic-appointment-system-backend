const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getAllDoctors,
  getAllAppointments,
  updateAppointmentStatus,
} = require("../controllers/admin.controller");

const router = express.Router();

// Admin dashboard statistics
router.get(
  "/dashboard",
  authenticate,
  requireRole("admin"),
  getDashboardStats
);

// Get all users
router.get(
  "/users",
  authenticate,
  requireRole("admin"),
  getAllUsers
);

// Get single user
router.get(
  "/users/:id",
  authenticate,
  requireRole("admin"),
  getUserById
);

// Get all doctors
router.get(
  "/doctors",
  authenticate,
  requireRole("admin"),
  getAllDoctors
);

// Get all appointments
router.get(
  "/appointments",
  authenticate,
  requireRole("admin"),
  getAllAppointments
);

// Admin updates appointment status
router.patch(
  "/appointments/:id/status",
  authenticate,
  requireRole("admin"),
  updateAppointmentStatus
);


module.exports = router;