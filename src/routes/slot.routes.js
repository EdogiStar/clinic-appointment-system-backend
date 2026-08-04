const express = require("express");

const {
  getAvailableSlots,
} = require("../controllers/slot.controller");

const router = express.Router();

/**
 * Get available appointment slots
 *
 * Example:
 *
 * GET /api/slots/doctor/:doctorId?date=2026-08-10
 */
router.get(
  "/doctor/:doctorId",
  getAvailableSlots
);

module.exports = router;