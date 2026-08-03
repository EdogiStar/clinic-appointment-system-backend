const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAllAppointments,
} = require("../controllers/appointment.controller");

const {
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("../validations/appointment.validation");

const router = express.Router();

/**
 * Patient creates an appointment
 */
router.post(
  "/",
  authenticate,
  requireRole("patient"),
  validate(createAppointmentSchema),
  createAppointment
);

/**
 * Patient views their own appointments
 */
router.get(
  "/patient",
  authenticate,
  requireRole("patient"),
  getPatientAppointments
);

/**
 * Admin views all appointments
 */
router.get(
  "/admin",
  authenticate,
  requireRole("admin"),
  getAllAppointments
);

/**
 * Doctor views their own appointments
 *
 * The backend automatically identifies
 * the doctor using the authenticated user.
 */
router.get(
  "/doctor",
  authenticate,
  requireRole("doctor"),
  getDoctorAppointments
);

/**
 * Get a single appointment by ID
 *
 * Patient:
 * - Can only view their own appointment
 *
 * Doctor:
 * - Can only view appointments assigned to them
 *
 * Admin:
 * - Can view any appointment
 */
router.get(
  "/:id",
  authenticate,
  requireRole("patient", "doctor", "admin"),
  getAppointmentById
);

/**
 * Patient, doctor, or admin updates appointment status
 */
router.patch(
  "/:id/status",
  authenticate,
  requireRole("patient", "doctor", "admin"),
  validate(updateAppointmentSchema),
  updateAppointmentStatus
);

module.exports = router;