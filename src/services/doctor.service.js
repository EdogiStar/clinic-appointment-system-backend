const supabaseAdmin = require("../config/supabaseAdmin");

/**
 * Create a doctor
 * Admin only
 */
const createDoctor = async ({
  full_name,
  email,
  password,
  phone,
  specialty_id,
  license_number,
}) => {
  // Create doctor authentication account
  const {
    data: authData,
    error: authError,
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  // Create user profile
  const {
    data: user,
    error: userError,
  } = await supabaseAdmin
    .from("users")
    .insert({
      id: authData.user.id,
      full_name,
      email,
      phone,
      role: "doctor",
    })
    .select()
    .single();

  if (userError) {
    // Roll back Auth account
    await supabaseAdmin.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(userError.message);
  }

  // Create doctor profile
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .insert({
      user_id: authData.user.id,
      specialty_id,
      license_number,
    })
    .select()
    .single();

  if (doctorError) {
    // Roll back user profile
    await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", authData.user.id);

    // Roll back Auth account
    await supabaseAdmin.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(doctorError.message);
  }

  return {
    user,
    doctor,
  };
};


/**
 * Get all doctors
 *
 * Accessible by:
 * - Admin
 * - Doctor
 * - Patient
 *
 * Includes the linked user's account status.
 *
 * Status values:
 * - active
 * - pending
 * - rejected
 */
const getDoctors = async () => {
  const {
    data: doctors,
    error,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      user_id,
      specialty_id,
      license_number,
      bio,
      created_at,
      updated_at,

      user:user_id (
        id,
        full_name,
        email,
        phone,
        role,
        status,
        created_at,
        updated_at
      ),

      specialty:specialty_id (
        id,
        name
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return doctors;
};


/**
 * Get doctor dashboard
 */
const getDoctorDashboard = async (
  userId
) => {
  // Get doctor profile
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      license_number,
      bio,

      user:user_id (
        id,
        full_name,
        email,
        phone,
        role,
        status
      ),

      specialty:specialty_id (
        id,
        name
      )
    `)
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

  // Get doctor appointments
  const {
    data: appointments,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      status,
      appointment_date
    `)
    .eq("doctor_id", doctor.id);

  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }

  const appointmentStats = {
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

  // Today's appointments
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayCount =
    appointments.filter(
      (item) =>
        item.appointment_date === today
    ).length;

  // Availability count
  const {
    count: availabilityDays,
    error: availabilityError,
  } = await supabaseAdmin
    .from("doctor_availabilities")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "doctor_id",
      doctor.id
    );

  if (availabilityError) {
    throw new Error(
      availabilityError.message
    );
  }

  return {
    profile: {
      id: doctor.id,
      name: doctor.user.full_name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      status: doctor.user.status,
      specialty:
        doctor.specialty?.name,
      license_number:
        doctor.license_number,
      bio: doctor.bio,
    },

    appointments:
      appointmentStats,

    today: {
      total: todayCount,
    },

    availability: {
      days:
        availabilityDays || 0,
    },
  };
};


/**
 * Get doctor appointments
 */
const getDoctorAppointments = async (
  userId
) => {
  // Find doctor profile
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

  // Get appointments
  const {
    data: appointments,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      reason,
      status,

      patient:patient_id (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq(
      "doctor_id",
      doctor.id
    )
    .order("appointment_date", {
      ascending: true,
    });

  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }

  return appointments;
};


module.exports = {
  createDoctor,
  getDoctors,
  getDoctorDashboard,
  getDoctorAppointments,
};