const express = require("express");

const validate = require("../middleware/validate.middleware");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  createDoctor,
  getDoctors,
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  getMyAvailability,
} = require("../controllers/doctor.controller");

const {
  createDoctorSchema,
} = require("../validations/doctor.validation");

const router = express.Router();

/**
 * Get all doctors
 *
 * Accessible by:
 * - Admin
 * - Doctor
 * - Patient
 */
router.get(
  "/",
  authenticate,
  requireRole(
    "admin",
    "doctor",
    "patient"
  ),
  getDoctors
);

/**
 * Create a doctor
 *
 * Admin only
 */
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createDoctorSchema),
  createDoctor
);

/**
 * Doctor dashboard
 *
 * Doctor only
 */
router.get(
  "/dashboard",
  authenticate,
  requireRole("doctor"),
  getDoctorDashboard
);

/**
 * Doctor appointments
 *
 * Doctor only
 */
router.get(
  "/appointments",
  authenticate,
  requireRole("doctor"),
  getDoctorAppointments
);

/**
 * Doctor updates appointment status
 *
 * Doctor only
 */
router.patch(
  "/appointments/:id/status",
  authenticate,
  requireRole("doctor"),
  updateAppointmentStatus
);

/**
 * Doctor availability
 *
 * Doctor only
 */
router.get(
  "/availability",
  authenticate,
  requireRole("doctor"),
  getMyAvailability
);

module.exports = router;