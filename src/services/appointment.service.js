const supabaseAdmin = require("../config/supabaseAdmin");
const slotService = require("./slot.service");

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
  // 1. Prevent booking appointments in the past
  const appointmentStart = new Date(
    `${appointment_date}T${start_time}`
  );

  const now = new Date();

  if (appointmentStart <= now) {
    throw new Error(
      "You cannot book an appointment in the past"
    );
  }

  // 2. Check that the doctor exists
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

  // 3. Validate selected slot
  const availableSlots =
    await slotService.generateAvailableSlots(
      doctor_id,
      appointment_date
    );

  const selectedSlot = start_time.slice(0, 5);

  if (!availableSlots.includes(selectedSlot)) {
    throw new Error(
      "Selected time slot is not available"
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

const getPatientAppointments = async (
  patientId,
  filters = {}
) => {
  const { status, type } = filters;

  let query = supabaseAdmin
    .from("appointments")
    .select(`
      *,
      doctors (
        id,
        user_id
      )
    `)
    .eq("patient_id", patientId);

  // Filter by appointment status
  if (status) {
    query = query.eq("status", status);
  }

  // Filter upcoming appointments
  if (type === "upcoming") {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    query = query.gte(
      "appointment_date",
      today
    );
  }

  // Filter past appointments
  if (type === "past") {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    query = query.lt(
      "appointment_date",
      today
    );
  }

  const { data, error } = await query
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

const getDoctorAppointments = async (
  doctorId,
  filters = {},
  currentUser
) => {
  const { status, type } = filters;

  // Get current user's role
  const role = currentUser.profile.role;

  // Doctor can only view their own appointments
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

    if (!doctor) {
      throw new Error("Doctor profile not found");
    }

    if (doctor.id !== doctorId) {
      throw new Error(
        "You can only view your own appointments"
      );
    }
  }

  // Admin can view appointments for any doctor

  let query = supabaseAdmin
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
    .eq("doctor_id", doctorId);

  // Filter by appointment status
  if (status) {
    query = query.eq("status", status);
  }

  // Filter upcoming appointments
  if (type === "upcoming") {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    query = query.gte(
      "appointment_date",
      today
    );
  }

  // Filter past appointments
  if (type === "past") {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    query = query.lt(
      "appointment_date",
      today
    );
  }

  const { data, error } = await query
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

  // 4. Prevent confirming a past appointment
  if (
    status === "confirmed" &&
    appointment.appointment_date &&
    appointment.start_time
  ) {
    const appointmentStart = new Date(
      `${appointment.appointment_date}T${appointment.start_time}`
    );

    const now = new Date();

    if (appointmentStart <= now) {
      throw new Error(
        "Cannot confirm an appointment whose scheduled time has passed"
      );
    }
  }

  // 5. Prevent completing an appointment before its scheduled end time
  if (
    status === "completed" &&
    appointment.appointment_date &&
    appointment.end_time
  ) {
    const appointmentEnd = new Date(
      `${appointment.appointment_date}T${appointment.end_time}`
    );

    const now = new Date();

    if (appointmentEnd > now) {
      throw new Error(
        "Cannot complete an appointment before its scheduled time"
      );
    }
  }

  // 6. Patient can only cancel their own appointment
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

  // 7. Doctor can manage appointments assigned to them
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

  // 8. Admin can update any appointment
  if (role === "admin") {
    // No additional restrictions
  }

  // 9. Update appointment
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