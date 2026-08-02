const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getAllDoctors,
  activateDoctor,
  rejectDoctor,
  getAllAppointments,
  updateAppointmentStatus,
} = require("../controllers/admin.controller");

const router = express.Router();


// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  authenticate,
  requireRole("admin"),
  getDashboardStats
);


// ==========================================
// USERS
// ==========================================

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


// ==========================================
// DOCTORS
// ==========================================

// Get all doctors
router.get(
  "/doctors",
  authenticate,
  requireRole("admin"),
  getAllDoctors
);


// Activate pending doctor
router.patch(
  "/doctors/:id/activate",
  authenticate,
  requireRole("admin"),
  activateDoctor
);


// Reject pending doctor
router.patch(
  "/doctors/:id/reject",
  authenticate,
  requireRole("admin"),
  rejectDoctor
);


// ==========================================
// APPOINTMENTS
// ==========================================

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