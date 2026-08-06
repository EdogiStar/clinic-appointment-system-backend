const supabaseAdmin = require("../config/supabaseAdmin");


/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  // Users statistics
  const {
    data: users,
    error: usersError,
  } = await supabaseAdmin
    .from("users")
    .select("role");

  if (usersError) {
    throw new Error(usersError.message);
  }

  const userStats = {
    total: users.length,

    patients: users.filter(
      (user) => user.role === "patient"
    ).length,

    doctors: users.filter(
      (user) => user.role === "doctor"
    ).length,

    admins: users.filter(
      (user) => user.role === "admin"
    ).length,
  };


 // Active doctors statistics
const {
  count: doctorCount,
  error: doctorError,
} = await supabaseAdmin
  .from("doctors")
  .select(
    `
    users!inner(status)
    `,
    {
      count: "exact",
      head: true,
    }
  )
  .eq("users.status", "active");

if (doctorError) {
  throw new Error(doctorError.message);
}


  // Specialties count
  const {
    count: specialtyCount,
    error: specialtyError,
  } = await supabaseAdmin
    .from("specialties")
    .select("*", {
      count: "exact",
      head: true,
    });

  if (specialtyError) {
    throw new Error(
      specialtyError.message
    );
  }


  // Appointment statistics
  const {
    data: appointments,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .select("status");

  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }

  const appointmentStats = {
    total: appointments.length,

    pending: appointments.filter(
      (appointment) =>
        appointment.status === "pending"
    ).length,

    confirmed: appointments.filter(
      (appointment) =>
        appointment.status === "confirmed"
    ).length,

    completed: appointments.filter(
      (appointment) =>
        appointment.status === "completed"
    ).length,

    cancelled: appointments.filter(
      (appointment) =>
        appointment.status === "cancelled"
    ).length,
  };


  // Recent appointments
  const {
    data: recentAppointments,
    error: recentAppointmentsError,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      status,

      patient:patient_id (
        full_name
      ),

      doctor:doctor_id (
        user:user_id (
          full_name
        )
      )
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  if (recentAppointmentsError) {
    throw new Error(
      recentAppointmentsError.message
    );
  }


  return {
    users: userStats,

    doctors: {
      total: doctorCount || 0,
      specialties:
        specialtyCount || 0,
    },

    appointments:
      appointmentStats,

    recentAppointments,
  };
};


/**
 * Get all users
 */
const getAllUsers = async (
  filters = {}
) => {
  let query = supabaseAdmin
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      status,
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: false,
    });


  // Optional role filter
  if (filters.role) {
    query = query.eq(
      "role",
      filters.role
    );
  }


  // Optional status filter
  if (filters.status) {
    query = query.eq(
      "status",
      filters.status
    );
  }


  const {
    data: users,
    error,
  } = await query;

  if (error) {
    throw new Error(
      error.message
    );
  }

  return users;
};


/**
 * Get single user by ID
 */
const getUserById = async (
  userId
) => {
  const {
    data: user,
    error,
  } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      status,
      created_at,
      updated_at,

      doctors (
        id,
        specialty_id,
        license_number,
        bio
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  return user;
};


/**
 * Get all doctors
 *
 * Includes account status from users table.
 */
const getAllDoctors = async () => {
  const {
    data: doctors,
    error,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      user_id,
      license_number,
      bio,
      created_at,

      user:user_id (
        id,
        full_name,
        email,
        phone,
        role,
        status,
        created_at
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
    throw new Error(
      error.message
    );
  }

  return doctors;
};


/**
 * Activate doctor
 *
 * Changes the linked user's status
 * from pending to active.
 */
const activateDoctor = async (
  doctorId
) => {
  // Find doctor and linked user
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      user_id,

      user:user_id (
        id,
        role,
        status
      )
    `)
    .eq("id", doctorId)
    .maybeSingle();

  if (doctorError) {
    throw new Error(
      doctorError.message
    );
  }

  if (!doctor) {
    throw new Error(
      "Doctor not found"
    );
  }

  if (!doctor.user) {
    throw new Error(
      "Doctor user profile not found"
    );
  }

  if (
    doctor.user.role !== "doctor"
  ) {
    throw new Error(
      "User account is not a doctor"
    );
  }

  if (
    doctor.user.status === "active"
  ) {
    throw new Error(
      "Doctor account is already active"
    );
  }


  // Activate user account
  const {
    data: user,
    error: updateError,
  } = await supabaseAdmin
    .from("users")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", doctor.user_id)
    .eq("role", "doctor")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      status,
      created_at,
      updated_at
    `)
    .single();

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  return user;
};


/**
 * Reject doctor
 *
 * Changes the linked user's status
 * from pending to rejected.
 */
const rejectDoctor = async (
  doctorId
) => {
  // Find doctor and linked user
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      user_id,

      user:user_id (
        id,
        role,
        status
      )
    `)
    .eq("id", doctorId)
    .maybeSingle();

  if (doctorError) {
    throw new Error(
      doctorError.message
    );
  }

  if (!doctor) {
    throw new Error(
      "Doctor not found"
    );
  }

  if (!doctor.user) {
    throw new Error(
      "Doctor user profile not found"
    );
  }

  if (
    doctor.user.role !== "doctor"
  ) {
    throw new Error(
      "User account is not a doctor"
    );
  }

  if (
    doctor.user.status === "rejected"
  ) {
    throw new Error(
      "Doctor account is already rejected"
    );
  }


  // Reject user account
  const {
    data: user,
    error: updateError,
  } = await supabaseAdmin
    .from("users")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", doctor.user_id)
    .eq("role", "doctor")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      status,
      created_at,
      updated_at
    `)
    .single();

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  return user;
};


/**
 * Get all appointments
 */
const getAllAppointments = async (
  filters = {}
) => {
  let query = supabaseAdmin
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      reason,
      status,
      created_at,

      patient:patient_id (
        id,
        full_name,
        email,
        phone
      ),

      doctor:doctor_id (
        id,
        license_number,

        user:user_id (
          full_name,
          email,
          phone
        ),

        specialty:specialty_id (
          name
        )
      )
    `)
    .order("created_at", {
      ascending: false,
    });


  // Optional status filter
  if (filters.status) {
    query = query.eq(
      "status",
      filters.status
    );
  }


  const {
    data: appointments,
    error,
  } = await query;

  if (error) {
    throw new Error(
      error.message
    );
  }

  return appointments;
};


module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getAllDoctors,
  activateDoctor,
  rejectDoctor,
  getAllAppointments,
};