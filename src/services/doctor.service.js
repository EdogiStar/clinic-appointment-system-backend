const supabaseAdmin = require("../config/supabaseAdmin");

const createDoctor = async ({
  full_name,
  email,
  password,
  phone,
  specialty_id,
  license_number,
}) => {
  // Create doctor authentication account
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(authError.message);
  }

  // Create user profile
  const { data: user, error: userError } = await supabaseAdmin
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
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(userError.message);
  }

  // Create doctor profile
  const { data: doctor, error: doctorError } = await supabaseAdmin
    .from("doctors")
    .insert({
      user_id: authData.user.id,
      specialty_id,
      license_number,
    })
    .select()
    .single();

  if (doctorError) {
    // Roll back both records if doctor profile fails
    await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", authData.user.id);

    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    throw new Error(doctorError.message);
  }

  return {
    user,
    doctor,
  };
};

const getDoctorDashboard = async (userId) => {
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
        phone
      ),
      specialty:specialty_id (
        id,
        name
      )
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (doctorError) {
    throw new Error(doctorError.message);
  }

  if (!doctor) {
    throw new Error("Doctor profile not found");
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
    throw new Error(appointmentError.message);
  }


  const appointmentStats = {
    total: appointments.length,

    pending: appointments.filter(
      (item) => item.status === "pending"
    ).length,

    confirmed: appointments.filter(
      (item) => item.status === "confirmed"
    ).length,

    completed: appointments.filter(
      (item) => item.status === "completed"
    ).length,

    cancelled: appointments.filter(
      (item) => item.status === "cancelled"
    ).length,
  };


  // Today's appointments
  const today = new Date()
    .toISOString()
    .split("T")[0];


  const todayCount = appointments.filter(
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
    .eq("doctor_id", doctor.id);


  if (availabilityError) {
    throw new Error(availabilityError.message);
  }


  return {
    profile: {
      id: doctor.id,
      name: doctor.user.full_name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.specialty?.name,
      license_number: doctor.license_number,
      bio: doctor.bio,
    },

    appointments: appointmentStats,

    today: {
      total: todayCount,
    },

    availability: {
      days: availabilityDays || 0,
    },
  };
};

const getDoctorAppointments = async (userId) => {
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
    throw new Error(doctorError.message);
  }


  if (!doctor) {
    throw new Error("Doctor profile not found");
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

const updateAppointmentStatus = async (
  userId,
  appointmentId,
  status
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
    throw new Error(doctorError.message);
  }


  if (!doctor) {
    throw new Error("Doctor profile not found");
  }


  // Verify appointment belongs to doctor
  const {
    data: appointment,
    error: appointmentError,
  } =
    await supabaseAdmin
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .eq("doctor_id", doctor.id)
      .maybeSingle();


  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }


  if (!appointment) {
    throw new Error(
      "Appointment not found"
    );
  }


  // Validate status transition
  const allowedTransitions = {
    pending: [
      "confirmed",
      "cancelled",
    ],

    confirmed: [
      "completed",
      "cancelled",
    ],

    completed: [],
    cancelled: [],
  };


  if (
    !allowedTransitions[
      appointment.status
    ].includes(status)
  ) {
    throw new Error(
      `Cannot change appointment from ${appointment.status} to ${status}`
    );
  }


  // Update status
  const {
    data: updatedAppointment,
    error: updateError,
  } =
    await supabaseAdmin
      .from("appointments")
      .update({
        status,
      })
      .eq("id", appointmentId)
      .select()
      .single();


  if (updateError) {
    throw new Error(
      updateError.message
    );
  }


  return updatedAppointment;
};


module.exports = {
  createDoctor,
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
};