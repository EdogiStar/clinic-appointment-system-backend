const supabaseAdmin = require("../config/supabaseAdmin");

const getAdminDashboard = async () => {
  // Get today's date
  const today = new Date()
    .toISOString()
    .split("T")[0];

  // Get current time
  const currentTime = new Date()
    .toTimeString()
    .slice(0, 8);

  // 1. Get today's appointments
  const {
    data: todayAppointments,
    error: todayAppointmentsError,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      patient:patient_id (
        id,
        full_name,
        email,
        phone
      ),
      doctor:doctor_id (
        id,
        user_id,
        specialty_id,
        users:user_id (
          id,
          full_name,
          email
        )
      )
    `)
    .eq("appointment_date", today)
    .order("start_time", {
      ascending: true,
    });

  if (todayAppointmentsError) {
    throw new Error(
      todayAppointmentsError.message
    );
  }

  // 2. Get upcoming appointments
  const {
    data: upcomingAppointments,
    error: upcomingAppointmentsError,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      patient:patient_id (
        id,
        full_name,
        email
      ),
      doctor:doctor_id (
        id,
        user_id,
        users:user_id (
          id,
          full_name
        )
      )
    `)
    .gte("appointment_date", today)
    .neq("status", "cancelled")
    .order("appointment_date", {
      ascending: true,
    })
    .order("start_time", {
      ascending: true,
    })
    .limit(10);

  if (upcomingAppointmentsError) {
    throw new Error(
      upcomingAppointmentsError.message
    );
  }

  // 3. Get pending appointments
  const {
    count: pendingAppointments,
    error: pendingError,
  } = await supabaseAdmin
    .from("appointments")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "pending");

  if (pendingError) {
    throw new Error(
      pendingError.message
    );
  }

  // 4. Get total patients
  const {
    count: totalPatients,
    error: patientsError,
  } = await supabaseAdmin
    .from("users")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("role", "patient");

  if (patientsError) {
    throw new Error(
      patientsError.message
    );
  }

  // 5. Get total doctors
  const {
    count: totalDoctors,
    error: doctorsError,
  } = await supabaseAdmin
    .from("doctors")
    .select("id", {
      count: "exact",
      head: true,
    });

  if (doctorsError) {
    throw new Error(
      doctorsError.message
    );
  }

  // 6. Calculate today's active appointments
  const activeTodayAppointments =
    todayAppointments.filter(
      (appointment) =>
        appointment.status !== "cancelled"
    );

  // 7. Calculate completed appointments today
  const completedToday =
    todayAppointments.filter(
      (appointment) =>
        appointment.status === "completed"
    );

  // 8. Calculate doctors with appointments today
  const doctorsWithAppointments =
    new Set(
      activeTodayAppointments.map(
        (appointment) =>
          appointment.doctor_id
      )
    ).size;

  // 9. Calculate doctors available
  // For now, this represents doctors
  // who do not have an appointment today.
  //
  // Later we can replace this with
  // actual doctor availability logic.
  const doctorsAvailable = Math.max(
    totalDoctors - doctorsWithAppointments,
    0
  );

  return {
    stats: {
      appointmentsToday:
        activeTodayAppointments.length,

      doctorsAvailable,

      totalPatients:
        totalPatients || 0,

      pendingAppointments:
        pendingAppointments || 0,

      totalDoctors:
        totalDoctors || 0,

      completedToday:
        completedToday.length,
    },

    todayAppointments:
      todayAppointments || [],

    upcomingAppointments:
      upcomingAppointments || [],
  };
};

module.exports = {
  getAdminDashboard,
};