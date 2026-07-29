const express = require("express");

const validate = require("../middleware/validate.middleware");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  createDoctor,
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  getMyAvailability,
} = require("../controllers/doctor.controller");

const {
  createDoctorSchema,
} = require("../validations/doctor.validation");

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createDoctorSchema),
  createDoctor
);

// Doctor dashboard
router.get(
  "/dashboard",
  authenticate,
  requireRole("doctor"),
  getDoctorDashboard
);

// Doctor appointments
router.get(
  "/appointments",
  authenticate,
  requireRole("doctor"),
  getDoctorAppointments
);

// Doctor updates appointment status
router.patch(
  "/appointments/:id/status",
  authenticate,
  requireRole("doctor"),
  updateAppointmentStatus
);

// Doctor availability
router.get(
  "/availability",
  authenticate,
  requireRole("doctor"),
  getMyAvailability
);

module.exports = router;