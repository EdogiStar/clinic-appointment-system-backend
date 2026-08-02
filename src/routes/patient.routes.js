const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  getPatientDashboard,
  getPatients,
  getDoctors,
  getDoctorAvailability,
  getDoctorSlots,
} = require("../controllers/patient.controller");

const router = express.Router();

/**
 * Admin
 * Get all patients
 */
router.get(
  "/",
  authenticate,
  requireRole("admin"),
  getPatients
);

/**
 * Patient dashboard
 */
router.get(
  "/dashboard",
  authenticate,
  requireRole("patient"),
  getPatientDashboard
);

/**
 * Patient doctors
 */
router.get(
  "/doctors",
  authenticate,
  requireRole("patient"),
  getDoctors
);

/**
 * Patient doctor availability
 */
router.get(
  "/doctors/:doctorId/availability",
  authenticate,
  requireRole("patient"),
  getDoctorAvailability
);

/**
 * Patient doctor slots
 */
router.get(
  "/doctors/:doctorId/slots",
  authenticate,
  requireRole("patient"),
  getDoctorSlots
);

module.exports = router;