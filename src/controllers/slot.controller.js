const slotService = require("../services/slot.service");

/**
 * Get available appointment slots
 * for a doctor on a specific date
 *
 * Example:
 *
 * GET /api/slots/doctor/:doctorId?date=2026-08-10
 */
const getAvailableSlots = async (
  req,
  res
) => {
  try {
    const {
      doctorId,
    } = req.params;

    const {
      date,
    } = req.query;

    // ----------------------------------
    // Validate doctor ID
    // ----------------------------------

    if (!doctorId) {
      return res.status(400).json({
        message:
          "Doctor ID is required",
      });
    }

    // ----------------------------------
    // Validate appointment date
    // ----------------------------------

    if (!date) {
      return res.status(400).json({
        message:
          "Appointment date is required",
      });
    }

    // ----------------------------------
    // Validate date format
    // ----------------------------------

    const dateFormat =
      /^\d{4}-\d{2}-\d{2}$/;

    if (!dateFormat.test(date)) {
      return res.status(400).json({
        message:
          "Invalid appointment date format. Use YYYY-MM-DD",
      });
    }

    // ----------------------------------
    // Get available slots
    // ----------------------------------

    const slots =
      await slotService.generateAvailableSlots(
        doctorId,
        date
      );

    // ----------------------------------
    // Return available slots
    // ----------------------------------

    return res.status(200).json({
      message:
        "Available slots retrieved successfully",
      data: slots,
    });
  } catch (error) {
    console.error(
      "GET AVAILABLE SLOTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to retrieve available slots",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailableSlots,
};