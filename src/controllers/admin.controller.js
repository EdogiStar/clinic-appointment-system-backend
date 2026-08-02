const adminService = require("../services/admin.service");
const appointmentService = require("../services/appointment.service");


/**
 * Get dashboard statistics
 */
const getDashboardStats = async (
  req,
  res
) => {
  try {
    const stats =
      await adminService.getDashboardStats();

    res.status(200).json({
      message:
        "Dashboard statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve dashboard statistics",
      error: error.message,
    });
  }
};


/**
 * Get all users
 */
const getAllUsers = async (
  req,
  res
) => {
  try {
    const users =
      await adminService.getAllUsers(
        req.query
      );

    res.status(200).json({
      message:
        "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve users",
      error: error.message,
    });
  }
};


/**
 * Get single user
 */
const getUserById = async (
  req,
  res
) => {
  try {
    const user =
      await adminService.getUserById(
        req.params.id
      );

    res.status(200).json({
      message:
        "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      message:
        "Failed to retrieve user",
      error: error.message,
    });
  }
};


/**
 * Get all doctors
 */
const getAllDoctors = async (
  req,
  res
) => {
  try {
    const doctors =
      await adminService.getAllDoctors();

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
 * Activate doctor
 *
 * Admin only
 */
const activateDoctor = async (
  req,
  res
) => {
  try {
    const user =
      await adminService.activateDoctor(
        req.params.id
      );

    res.status(200).json({
      message:
        "Doctor account activated successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      message:
        "Failed to activate doctor account",
      error: error.message,
    });
  }
};


/**
 * Reject doctor
 *
 * Admin only
 */
const rejectDoctor = async (
  req,
  res
) => {
  try {
    const user =
      await adminService.rejectDoctor(
        req.params.id
      );

    res.status(200).json({
      message:
        "Doctor account rejected successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      message:
        "Failed to reject doctor account",
      error: error.message,
    });
  }
};


/**
 * Get all appointments
 */
const getAllAppointments = async (
  req,
  res
) => {
  try {
    const appointments =
      await adminService.getAllAppointments(
        req.query
      );

    res.status(200).json({
      message:
        "Appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve appointments",
      error: error.message,
    });
  }
};


/**
 * Admin updates appointment status
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


module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getAllDoctors,
  activateDoctor,
  rejectDoctor,
  getAllAppointments,
  updateAppointmentStatus,
};