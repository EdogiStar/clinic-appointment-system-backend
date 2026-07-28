const supabaseAdmin = require("../config/supabaseAdmin");

const createAppointment = async (
  {
    doctor_id,
    appointment_date,
    start_time,
    end_time,
    reason,
  },
  currentUser
) => {
  // 1. Check that the doctor exists
  const { data: doctor, error: doctorError } =
    await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq("id", doctor_id)
      .maybeSingle();

  if (doctorError) {
    throw new Error(doctorError.message);
  }

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // 2. Get the day of the week
  const [year, month, day] = appointment_date
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  const dayOfWeek = date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  // 3. Check doctor's availability
  const { data: availability, error: availabilityError } =
    await supabaseAdmin
      .from("doctor_availabilities")
      .select("*")
      .eq("doctor_id", doctor_id)
      .eq("day_of_week", dayOfWeek)
      .lte("start_time", start_time)
      .gte("end_time", end_time);

  if (availabilityError) {
    throw new Error(availabilityError.message);
  }

  if (!availability || availability.length === 0) {
    throw new Error(
      "Doctor is not available at the selected time"
    );
  }

  // 4. Check for overlapping appointments
  const {
    data: conflictingAppointments,
    error: conflictError,
  } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctor_id)
    .eq("appointment_date", appointment_date)
    .neq("status", "cancelled")
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (conflictError) {
    throw new Error(conflictError.message);
  }

  if (
    conflictingAppointments &&
    conflictingAppointments.length > 0
  ) {
    throw new Error(
      "Doctor already has an appointment at this time"
    );
  }

  // 5. Create appointment
  const {
    data: appointment,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .insert({
      patient_id: currentUser.id,
      doctor_id,
      appointment_date,
      start_time,
      end_time,
      reason,
      status: "pending",
    })
    .select()
    .single();

  if (appointmentError) {
    throw new Error(appointmentError.message);
  }

  return appointment;
};

const getPatientAppointments = async (patientId) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      doctors (
        id,
        user_id
      )
    `)
    .eq("patient_id", patientId)
    .order("appointment_date", {
      ascending: true,
    })
    .order("start_time", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getDoctorAppointments = async (doctorId) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      users:patient_id (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq("doctor_id", doctorId)
    .order("appointment_date", {
      ascending: true,
    })
    .order("start_time", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getAppointmentById = async (
  appointmentId,
  currentUser
) => {
  const { data: appointment, error } =
    await supabaseAdmin
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
          license_number,
          bio
        )
      `)
      .eq("id", appointmentId)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Get current user's role
  const role = currentUser.profile.role;

  // Patient can only view their own appointment
  if (role === "patient") {
    if (appointment.patient_id !== currentUser.id) {
      throw new Error(
        "You can only view your own appointments"
      );
    }
  }

  // Doctor can only view their assigned appointments
  if (role === "doctor") {
    const { data: doctor, error: doctorError } =
      await supabaseAdmin
        .from("doctors")
        .select("id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (doctorError) {
      throw new Error(doctorError.message);
    }

    if (
      !doctor ||
      doctor.id !== appointment.doctor_id
    ) {
      throw new Error(
        "You can only view your own appointments"
      );
    }
  }

  // Admin can view any appointment

  return appointment;
};


const updateAppointmentStatus = async (
  appointmentId,
  status,
  currentUser
) => {
  // 1. Get appointment
  const {
    data: appointment,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError) {
    throw new Error(appointmentError.message);
  }

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 2. Validate status transition
  const currentStatus = appointment.status;

  const allowedTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  if (
    !allowedTransitions[currentStatus].includes(status)
  ) {
    throw new Error(
      `Cannot change appointment status from ${currentStatus} to ${status}`
    );
  }

  // 3. Get current user's role
  const role = currentUser.profile.role;

  // 4. Patient can only cancel their own appointment
  if (role === "patient") {
    if (appointment.patient_id !== currentUser.id) {
      throw new Error(
        "You can only manage your own appointments"
      );
    }

    if (status !== "cancelled") {
      throw new Error(
        "Patients can only cancel appointments"
      );
    }
  }

  // 5. Doctor can manage appointments assigned to them
  if (role === "doctor") {
    const {
      data: doctor,
      error: doctorError,
    } = await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (doctorError) {
      throw new Error(doctorError.message);
    }

    if (
      !doctor ||
      doctor.id !== appointment.doctor_id
    ) {
      throw new Error(
        "You can only manage your own appointments"
      );
    }

    const allowedStatuses = [
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error(
        "Invalid appointment status"
      );
    }
  }

  // 6. Admin can update any appointment
  if (role === "admin") {
    // No additional restrictions
  }

  // 7. Update appointment
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("appointments")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
};