const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  getPatientDashboard,
  getDoctors,
  getDoctorAvailability,
  getDoctorSlots,
} = require("../controllers/patient.controller");


const router = express.Router();


router.get(
  "/dashboard",
  authenticate,
  requireRole("patient"),
  getPatientDashboard
);

router.get(
  "/doctors",
  authenticate,
  requireRole("patient"),
  getDoctors
);

router.get(
  "/doctors/:doctorId/availability",
  authenticate,
  requireRole("patient"),
  getDoctorAvailability
);

router.get(
  "/doctors/:doctorId/slots",
  authenticate,
  requireRole("patient"),
  getDoctorSlots
);

module.exports = router;