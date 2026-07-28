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
} = require("../controllers/appointment.controller");

const {
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("../validations/appointment.validation");

const router = express.Router();

// Patient creates an appointment
router.post(
  "/",
  authenticate,
  requireRole("patient"),
  validate(createAppointmentSchema),
  createAppointment
);

// Patient views their own appointments
router.get(
  "/patient",
  authenticate,
  requireRole("patient"),
  getPatientAppointments
);

// Doctor views their appointments
router.get(
  "/doctor/:doctorId",
  authenticate,
  requireRole("doctor", "admin"),
  getDoctorAppointments
);

// Get a single appointment by ID
router.get(
  "/:id",
  authenticate,
  requireRole("patient", "doctor", "admin"),
  getAppointmentById
);

// Patient, doctor, or admin updates appointment status
router.patch(
  "/:id/status",
  authenticate,
  requireRole("patient", "doctor", "admin"),
  validate(updateAppointmentSchema),
  updateAppointmentStatus
);

module.exports = router;