const slotService = require("../services/slot.service");


/**
 * Get available appointment slots
 * for a doctor on a specific date
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

    if (!date) {
      return res.status(400).json({
        message:
          "Appointment date is required",
      });
    }

    const slots =
      await slotService.generateAvailableSlots(
        doctorId,
        date
      );

    res.status(200).json({
      message:
        "Available slots retrieved successfully",
      data: slots,
    });
  } catch (error) {
    console.error(
      "GET AVAILABLE SLOTS ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to retrieve available slots",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailableSlots,
};