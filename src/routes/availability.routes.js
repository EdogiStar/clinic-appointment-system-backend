const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const {
  createAvailability,
  getDoctorAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
} = require("../controllers/availability.controller");

const {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} = require("../validations/availability.validation");

const router = express.Router();

/**
 * ==========================================
 * Doctor Availability Routes
 * ==========================================
 */

/**
 * Get availability for the logged-in doctor
 * Doctor/Admin only
 */
router.get(
  "/",
  authenticate,
  requireRole("doctor", "admin"),
  getMyAvailability
);

/**
 * Get availability for a specific doctor
 * Public (used when patients book appointments)
 */
router.get(
  "/doctor/:doctorId",
  getDoctorAvailability
);

/**
 * Create availability
 * Doctor/Admin only
 */
router.post(
  "/",
  authenticate,
  requireRole("doctor", "admin"),
  validate(createAvailabilitySchema),
  createAvailability
);

/**
 * Update availability
 * Doctor/Admin only
 */
router.patch(
  "/:id",
  authenticate,
  requireRole("doctor", "admin"),
  validate(updateAvailabilitySchema),
  updateAvailability
);

/**
 * Delete availability
 * Doctor/Admin only
 */
router.delete(
  "/:id",
  authenticate,
  requireRole("doctor", "admin"),
  deleteAvailability
);

module.exports = router;