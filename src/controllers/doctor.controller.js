const doctorService = require("../services/doctor.service");
const appointmentService = require("../services/appointment.service");
const availabilityService = require("../services/availability.service");
const supabaseAdmin = require("../config/supabaseAdmin");

const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.createDoctor(req.body);

    res.status(201).json({
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create doctor",
      error: error.message,
    });
  }
};

const getDoctorDashboard = async (req, res) => {
  try {
    const dashboard =
      await doctorService.getDoctorDashboard(
        req.user.id
      );

    res.status(200).json({
      message:
        "Doctor dashboard retrieved successfully",
      data: dashboard,
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve doctor dashboard",
      error: error.message,
    });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const appointments =
      await doctorService.getDoctorAppointments(
        req.user.id
      );

    res.status(200).json({
      message:
        "Doctor appointments retrieved successfully",
      data: appointments,
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve doctor appointments",
      error: error.message,
    });
  }
};

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

const getMyAvailability = async (req, res) => {
  try {
    // Find doctor profile using logged-in user
    const { data: doctor, error } =
      await supabaseAdmin
        .from("doctors")
        .select("id")
        .eq("user_id", req.user.id)
        .maybeSingle();


    if (error) {
      throw new Error(error.message);
    }


    if (!doctor) {
      throw new Error(
        "Doctor profile not found"
      );
    }


    const availability =
      await availabilityService.getDoctorAvailability(
        doctor.id
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

module.exports = {
  createDoctor,
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  getMyAvailability,
};