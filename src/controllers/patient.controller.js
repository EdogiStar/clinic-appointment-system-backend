const patientService = require("../services/patient.service");
const slotService = require("../services/slot.service");

/**
 * Get patient dashboard
 */
const getPatientDashboard = async (req, res) => {
  try {
    const dashboard =
      await patientService.getPatientDashboard(
        req.user.id
      );

    res.status(200).json({
      message:
        "Patient dashboard retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve patient dashboard",
      error: error.message,
    });
  }
};

/**
 * Get all patients
 *
 * Admin only
 */
const getPatients = async (req, res) => {
  try {
    const patients =
      await patientService.getPatients();

    res.status(200).json({
      message:
        "Patients retrieved successfully",
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve patients",
      error: error.message,
    });
  }
};

/**
 * Get doctors
 *
 * Patient only
 */
const getDoctors = async (req, res) => {
  try {
    const doctors =
      await patientService.getDoctors();

    res.status(200).json({
      message:
        "Doctors retrieved successfully",
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve doctors",
      error: error.message,
    });
  }
};

/**
 * Get doctor availability
 *
 * Patient only
 */
const getDoctorAvailability = async (
  req,
  res
) => {
  try {
    const availability =
      await patientService.getDoctorAvailability(
        req.params.doctorId
      );

    res.status(200).json({
      message:
        "Doctor availability retrieved successfully",
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve doctor availability",
      error: error.message,
    });
  }
};

/**
 * Get available doctor slots
 *
 * Patient only
 */
const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
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
      data: {
        date,
        slots,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve available slots",
      error: error.message,
    });
  }
};

module.exports = {
  getPatientDashboard,
  getPatients,
  getDoctors,
  getDoctorAvailability,
  getDoctorSlots,
};