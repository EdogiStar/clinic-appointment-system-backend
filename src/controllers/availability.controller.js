const availabilityService = require("../services/availability.service");

const createAvailability = async (req, res) => {
  try {
    const availability =
      await availabilityService.createAvailability(
        req.body,
        req.user
      );

    res.status(201).json({
      message: "Availability created successfully",
      data: availability,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create availability",
      error: error.message,
    });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const availability =
      await availabilityService.getDoctorAvailability(
        req.params.doctorId
      );

    res.status(200).json({
      message: "Availability retrieved successfully",
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve availability",
      error: error.message,
    });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const availability =
      await availabilityService.updateAvailability(
        req.params.id,
        req.body,
        req.user
      );

    res.status(200).json({
      message: "Availability updated successfully",
      data: availability,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update availability",
      error: error.message,
    });
  }
};

const deleteAvailability = async (req, res) => {
  try {
    await availabilityService.deleteAvailability(
      req.params.id,
      req.user
    );

    res.status(200).json({
      message: "Availability deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete availability",
      error: error.message,
    });
  }
};

module.exports = {
  createAvailability,
  getDoctorAvailability,
  updateAvailability,
  deleteAvailability,
};