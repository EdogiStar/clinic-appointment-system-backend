const appointmentService = require("../services/appointment.service");

/**
 * Patient creates an appointment
 */
const createAppointment = async (req, res) => {
  try {
    const appointment =
      await appointmentService.createAppointment(
        req.body,
        req.user
      );

    res.status(201).json({
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create appointment",
      error: error.message,
    });
  }
};

/**
 * Patient views their own appointments
 */
const getPatientAppointments = async (req, res) => {
  try {
    const appointments =
      await appointmentService.getPatientAppointments(
        req.user.id,
        req.query
      );

    res.status(200).json({
      message:
        "Patient appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve patient appointments",
      error: error.message,
    });
  }
};

/**
 * Doctor views their own appointments
 */
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments =
      await appointmentService.getDoctorAppointments(
        req.user
      );

    res.status(200).json({
      message:
        "Doctor appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    console.error(
      "GET DOCTOR APPOINTMENTS ERROR:",
      error
    );

    res.status(403).json({
      message:
        "Failed to retrieve doctor appointments",
      error: error.message,
    });
  }
};

/**
 * Get a single appointment by ID
 */
const getAppointmentById = async (req, res) => {
  try {
    const appointment =
      await appointmentService.getAppointmentById(
        req.params.id,
        req.user
      );

    res.status(200).json({
      message:
        "Appointment retrieved successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(404).json({
      message:
        "Failed to retrieve appointment",
      error: error.message,
    });
  }
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async (
  req,
  res
) => {
  try {
    const appointment =
      await appointmentService.updateAppointmentStatus(
        req.params.id,
        req.body.status,
        req.user
      );

    res.status(200).json({
      message:
        "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      message:
        "Failed to update appointment status",
      error: error.message,
    });
  }
};

/**
 * Admin views all appointments
 */
const getAllAppointments = async (
  req,
  res
) => {
  try {
    const appointments =
      await appointmentService.getAllAppointments();

    res.status(200).json({
      message:
        "All appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    console.error(
      "GET ALL APPOINTMENTS ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to retrieve appointments",
      error: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAllAppointments,
};