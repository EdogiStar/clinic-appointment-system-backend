const supabaseAdmin = require("../config/supabaseAdmin");
const slotService = require("./slot.service");
const notificationService = require("./notification.service");

/**
 * Create appointment
 *
 * Patient:
 * - Books an appointment for themselves
 *
 * Admin:
 * - Books an appointment on behalf of a patient
 */
const createAppointment = async (
  {
    patient_id,
    doctor_id,
    appointment_date,
    start_time,
    end_time,
    reason,
  },
  currentUser
) => {
  const role =
    currentUser.profile.role;

  // ----------------------------------
  // 1. Determine patient
  // ----------------------------------

  let patientId;

  if (role === "patient") {
    // Patients can only book
    // appointments for themselves
    patientId = currentUser.id;
  }

  if (role === "admin") {
    // Admin must provide
    // the patient to book for
    if (!patient_id) {
      throw new Error(
        "Patient is required when an admin creates an appointment"
      );
    }

    patientId = patient_id;
  }

  // ----------------------------------
  // 2. Verify patient exists
  // ----------------------------------

  const {
    data: patient,
    error: patientError,
  } = await supabaseAdmin
    .from("users")
    .select(
      "id, full_name, email, phone, role"
    )
    .eq("id", patientId)
    .maybeSingle();

  if (patientError) {
    throw new Error(
      patientError.message
    );
  }

  if (!patient) {
    throw new Error(
      "Patient not found"
    );
  }

  if (patient.role !== "patient") {
    throw new Error(
      "Selected user is not a patient"
    );
  }

  // ----------------------------------
  // 3. Prevent booking in the past
  // ----------------------------------

  const appointmentStart =
    new Date(
      `${appointment_date}T${start_time}`
    );

  const now = new Date();

  if (appointmentStart <= now) {
    throw new Error(
      "You cannot book an appointment in the past"
    );
  }

  // ----------------------------------
  // 4. Check doctor exists
  // ----------------------------------

  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      user_id,
      users:user_id (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq("id", doctor_id)
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

  // ----------------------------------
  // 5. Generate available slots
  // ----------------------------------

  const availableSlots =
    await slotService.generateAvailableSlots(
      doctor_id,
      appointment_date
    );

  const selectedSlot =
    start_time.slice(0, 5);

  if (
    !availableSlots.includes(
      selectedSlot
    )
  ) {
    throw new Error(
      "Selected time slot is not available"
    );
  }

  // ----------------------------------
  // 6. Check overlapping appointments
  // ----------------------------------

  const {
    data: conflictingAppointments,
    error: conflictError,
  } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq(
      "doctor_id",
      doctor_id
    )
    .eq(
      "appointment_date",
      appointment_date
    )
    .neq(
      "status",
      "cancelled"
    )
    .lt(
      "start_time",
      end_time
    )
    .gt(
      "end_time",
      start_time
    );

  if (conflictError) {
    throw new Error(
      conflictError.message
    );
  }

  if (
    conflictingAppointments &&
    conflictingAppointments.length > 0
  ) {
    throw new Error(
      "Doctor already has an appointment at this time"
    );
  }

  // ----------------------------------
  // 7. Create appointment
  // ----------------------------------

  const {
    data: appointment,
    error: appointmentError,
  } = await supabaseAdmin
    .from("appointments")
    .insert({
      patient_id: patientId,
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
    throw new Error(
      appointmentError.message
    );
  }

  // ----------------------------------
  // 8. Notify doctor
  // ----------------------------------

  await notificationService.createNotification({
    user_id:
      doctor.user_id,
    title:
      "New Appointment",
    message: `You have a new appointment request for ${appointment_date} at ${start_time.slice(
      0,
      5
    )}.`,
    type:
      "appointment_created",
  });

  // ----------------------------------
  // 9. Notify patient if admin
  //    booked on their behalf
  // ----------------------------------

  if (
    role === "admin"
  ) {
    await notificationService.createNotification({
      user_id:
        patientId,
      title:
        "Appointment Booked",
      message: `An appointment has been booked for you on ${appointment_date} at ${start_time.slice(
        0,
        5
      )}.`,
      type:
        "appointment_created",
    });
  }

  return appointment;
};

/**
 * Get patient appointments
 */
const getPatientAppointments = async (
  patientId
) => {
  const {
    data,
    error,
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
        license_number,
        bio,
        users:user_id (
          id,
          full_name,
          email,
          phone
        )
      )
    `)
    .eq(
      "patient_id",
      patientId
    )
    .order(
      "appointment_date",
      {
        ascending: true,
      }
    )
    .order(
      "start_time",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data;
};

/**
 * Get appointments for the
 * currently authenticated doctor
 */
const getDoctorAppointments = async (
  currentUser
) => {
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select("id")
    .eq(
      "user_id",
      currentUser.id
    )
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

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
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
    .order(
      "appointment_date",
      {
        ascending: true,
      }
    )
    .order(
      "start_time",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data;
};

/**
 * Get a single appointment by ID
 */
const getAppointmentById = async (
  appointmentId,
  currentUser
) => {
  const {
    data: appointment,
    error,
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
        license_number,
        bio
      )
    `)
    .eq(
      "id",
      appointmentId
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!appointment) {
    throw new Error(
      "Appointment not found"
    );
  }

  const role =
    currentUser.profile.role;

  // Patient can only view
  // their own appointment
  if (
    role === "patient" &&
    appointment.patient_id !==
      currentUser.id
  ) {
    throw new Error(
      "You can only view your own appointments"
    );
  }

  // Doctor can only view
  // their assigned appointments
  if (role === "doctor") {
    const {
      data: doctor,
      error: doctorError,
    } = await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();

    if (doctorError) {
      throw new Error(
        doctorError.message
      );
    }

    if (
      !doctor ||
      doctor.id !==
        appointment.doctor_id
    ) {
      throw new Error(
        "You can only view your own appointments"
      );
    }
  }

  // Admin can view any appointment

  return appointment;
};

/**
 * Update appointment status
 */
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
    .eq(
      "id",
      appointmentId
    )
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

  // 2. Validate status transition
  const currentStatus =
    appointment.status;

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
      currentStatus
    ]?.includes(status)
  ) {
    throw new Error(
      `Cannot change appointment status from ${currentStatus} to ${status}`
    );
  }

  // 3. Get current user's role
  const role =
    currentUser.profile.role;

  // 4. Prevent confirming
  //    a past appointment
  if (
    status === "confirmed" &&
    appointment.appointment_date &&
    appointment.start_time
  ) {
    const appointmentStart =
      new Date(
        `${appointment.appointment_date}T${appointment.start_time}`
      );

    const now = new Date();

    if (
      appointmentStart <= now
    ) {
      throw new Error(
        "Cannot confirm an appointment whose scheduled time has passed"
      );
    }
  }

  // 5. Prevent completing
  //    before scheduled end time
  if (
    status === "completed" &&
    appointment.appointment_date &&
    appointment.end_time
  ) {
    const appointmentEnd =
      new Date(
        `${appointment.appointment_date}T${appointment.end_time}`
      );

    const now = new Date();

    if (
      appointmentEnd > now
    ) {
      throw new Error(
        "Cannot complete an appointment before its scheduled time"
      );
    }
  }

  // 6. Patient can only cancel
  //    their own appointment
  if (role === "patient") {
    if (
      appointment.patient_id !==
      currentUser.id
    ) {
      throw new Error(
        "You can only manage your own appointments"
      );
    }

    if (
      status !== "cancelled"
    ) {
      throw new Error(
        "Patients can only cancel appointments"
      );
    }
  }

  // 7. Doctor can manage
  //    appointments assigned to them
  if (role === "doctor") {
    const {
      data: doctor,
      error: doctorError,
    } = await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();

    if (doctorError) {
      throw new Error(
        doctorError.message
      );
    }

    if (
      !doctor ||
      doctor.id !==
        appointment.doctor_id
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

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid appointment status"
      );
    }
  }

  // 8. Admin can update
  //    any appointment

  // 9. Update appointment
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("appointments")
    .update({
      status,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      appointmentId
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      error.message
    );
  }

  // ----------------------------------
  // 10. Notifications
  // ----------------------------------

  // Appointment confirmed
  if (
    status === "confirmed"
  ) {
    await notificationService.createNotification({
      user_id:
        appointment.patient_id,
      title:
        "Appointment Confirmed",
      message: `Your appointment on ${appointment.appointment_date} at ${appointment.start_time.slice(
        0,
        5
      )} has been confirmed.`,
      type:
        "appointment_confirmed",
    });
  }

  // Appointment cancelled
  if (
    status === "cancelled"
  ) {
    let recipientUserId;

    if (
      role === "patient"
    ) {
      // Patient cancelled
      // Notify doctor
      const {
        data: doctor,
        error: doctorError,
      } = await supabaseAdmin
        .from("doctors")
        .select("user_id")
        .eq(
          "id",
          appointment.doctor_id
        )
        .maybeSingle();

      if (doctorError) {
        throw new Error(
          doctorError.message
        );
      }

      recipientUserId =
        doctor.user_id;
    } else {
      // Doctor or admin cancelled
      // Notify patient
      recipientUserId =
        appointment.patient_id;
    }

    await notificationService.createNotification({
      user_id:
        recipientUserId,
      title:
        "Appointment Cancelled",
      message: `The appointment scheduled for ${appointment.appointment_date} at ${appointment.start_time.slice(
        0,
        5
      )} has been cancelled.`,
      type:
        "appointment_cancelled",
    });
  }

  // Appointment completed
  if (
    status === "completed"
  ) {
    await notificationService.createNotification({
      user_id:
        appointment.patient_id,
      title:
        "Appointment Completed",
      message: `Your appointment on ${appointment.appointment_date} at ${appointment.start_time.slice(
        0,
        5
      )} has been marked as completed.`,
      type:
        "appointment_completed",
    });
  }

  return data;
};

/**
 * Admin gets all appointments
 */
const getAllAppointments = async () => {
  const {
    data,
    error,
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
        license_number,
        bio,
        users:user_id (
          id,
          full_name,
          email,
          phone
        )
      )
    `)
    .order(
      "appointment_date",
      {
        ascending: true,
      }
    )
    .order(
      "start_time",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data;
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAllAppointments,
};