const appointmentService = require("../services/appointment.service");

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

const getPatientAppointments = async (req, res) => {
  try {
    const appointments =
      await appointmentService.getPatientAppointments(
        req.user.id
      );

    res.status(200).json({
      message: "Patient appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve appointments",
      error: error.message,
    });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const appointments =
      await appointmentService.getDoctorAppointments(
        req.params.doctorId
      );

    res.status(200).json({
      message: "Doctor appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve appointments",
      error: error.message,
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment =
      await appointmentService.getAppointmentById(
        req.params.id,
        req.user
      );

    res.status(200).json({
      message: "Appointment retrieved successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(404).json({
      message: "Failed to retrieve appointment",
      error: error.message,
    });
  }
};


const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment =
      await appointmentService.updateAppointmentStatus(
        req.params.id,
        req.body.status,
        req.user
      );

    res.status(200).json({
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update appointment status",
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
};