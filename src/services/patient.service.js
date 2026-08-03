const supabaseAdmin = require("../config/supabaseAdmin");
const availabilityService = require("./availability.service");

/**
 * Get patient dashboard
 */
const getPatientDashboard = async (
  userId
) => {
  // Get patient profile
  const {
    data: patient,
    error: patientError,
  } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone
    `)
    .eq("id", userId)
    .eq("role", "patient")
    .maybeSingle();

  if (patientError) {
    throw new Error(
      patientError.message
    );
  }

  if (!patient) {
    throw new Error(
      "Patient profile not found"
    );
  }

  // Get appointments
  const {
    data: appointments,
    error: appointmentError,
  } =
    await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        reason,
        status,

        doctor:doctor_id (
          id,
          user:user_id (
            full_name
          ),
          specialty:specialty_id (
            name
          )
        )
      `)
      .eq("patient_id", userId)
      .order("appointment_date", {
        ascending: true,
      });

  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }

  const stats = {
    total: appointments.length,

    pending: appointments.filter(
      (item) =>
        item.status === "pending"
    ).length,

    confirmed: appointments.filter(
      (item) =>
        item.status === "confirmed"
    ).length,

    completed: appointments.filter(
      (item) =>
        item.status === "completed"
    ).length,

    cancelled: appointments.filter(
      (item) =>
        item.status === "cancelled"
    ).length,
  };

  const upcoming =
    appointments.find(
      (item) =>
        item.status === "confirmed"
    ) || null;

  return {
    profile: patient,

    appointments: stats,

    upcomingAppointment:
      upcoming,
  };
};

/**
 * Get all doctors
 *
 * Patient only
 */
const getDoctors = async () => {
  const {
    data: doctors,
    error,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      license_number,
      bio,

      user:user_id (
        full_name,
        email,
        phone
      ),

      specialty:specialty_id (
        id,
        name
      )
    `);

  if (error) {
    throw new Error(
      error.message
    );
  }

  return doctors;
};

/**
 * Get doctor availability
 */
const getDoctorAvailability = async (
  doctorId
) => {
  const availability =
    await availabilityService.getDoctorAvailability(
      doctorId
    );

  return availability;
};

/**
 * Get all patients
 *
 * Admin only
 */
const getPatients = async () => {
  const {
    data: patients,
    error,
  } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone,
      created_at
    `)
    .eq("role", "patient")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      error.message
    );
  }

  return patients;
};

/**
 * Get patients who have appointments
 * with the currently logged-in doctor
 *
 * Doctor only
 */
const getDoctorPatients = async (
  userId
) => {
  // 1. Find the doctor profile
  // belonging to the authenticated user
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (doctorError) {
    throw new Error(
      doctorError.message
    );
  }

  if (!doctor) {
    throw new Error(
      "Doctor profile not found"
    );
  }

  // 2. Get appointments belonging
  // to this doctor
  const {
    data: appointments,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      patient_id,
      patient:patient_id (
        id,
        full_name,
        email,
        phone,
        created_at
      )
    `)
    .eq(
      "doctor_id",
      doctor.id
    );

  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }

  // 3. Remove duplicate patients
  // if a patient has multiple appointments
  const uniquePatients = [];
  const patientIds = new Set();

  for (
    const appointment of appointments
  ) {
    if (
      appointment.patient &&
      !patientIds.has(
        appointment.patient.id
      )
    ) {
      patientIds.add(
        appointment.patient.id
      );

      uniquePatients.push(
        appointment.patient
      );
    }
  }

  return uniquePatients;
};

module.exports = {
  getPatientDashboard,
  getDoctors,
  getDoctorAvailability,
  getPatients,
  getDoctorPatients,
};