const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
  createAvailability,
  getDoctorAvailability,
  updateAvailability,
  deleteAvailability,
} = require("../controllers/availability.controller");

const {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} = require("../validations/availability.validation");

const router = express.Router();

// Create availability
router.post(
  "/",
  authenticate,
  requireRole("doctor", "admin"),
  validate(createAvailabilitySchema),
  createAvailability
);

// Get doctor's availability
router.get(
  "/doctor/:doctorId",
  getDoctorAvailability
);

// Update availability
router.patch(
  "/:id",
  authenticate,
  requireRole("doctor", "admin"),
  validate(updateAvailabilitySchema),
  updateAvailability
);

// Delete availability
router.delete(
  "/:id",
  authenticate,
  requireRole("doctor", "admin"),
  deleteAvailability
);

module.exports = router;