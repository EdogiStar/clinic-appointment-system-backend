const supabaseAdmin = require("../config/supabaseAdmin");
const slotService = require("./slot.service");
const notificationService = require("./notification.service");

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
  const {
    data: doctor,
    error: doctorError,
  } = await supabaseAdmin
    .from("doctors")
    .select(`
      id,
      user_id,
      users:user_id (
        full_name
      )
    `)
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

  const selectedSlot =
    start_time.slice(0, 5);

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
    .eq(
      "appointment_date",
      appointment_date
    )
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
    throw new Error(
      appointmentError.message
    );
  }

  // 6. Notify doctor
  await notificationService.createNotification({
    user_id: doctor.user_id,
    title: "New Appointment",
    message: `You have a new appointment request for ${appointment_date} at ${start_time.slice(
      0,
      5
    )}.`,
    type: "appointment_created",
  });

  return appointment;
};

const getPatientAppointments = async (patientId) => {
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

const getDoctorAppointments = async (
  doctorId
) => {
  const { data, error } =
    await supabaseAdmin
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
      .eq(
        "doctor_id",
        doctorId
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
    throw new Error(error.message);
  }

  return data;
};

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
    throw new Error(error.message);
  }

  if (!appointment) {
    throw new Error(
      "Appointment not found"
    );
  }

  // Get current user's role
  const role =
    currentUser.profile.role;

  // Patient can only view their own appointment
  if (role === "patient") {
    if (
      appointment.patient_id !==
      currentUser.id
    ) {
      throw new Error(
        "You can only view your own appointments"
      );
    }
  }

  // Doctor can only view their assigned appointments
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
    ].includes(status)
  ) {
    throw new Error(
      `Cannot change appointment status from ${currentStatus} to ${status}`
    );
  }

  // 3. Get current user's role
  const role =
    currentUser.profile.role;

  // 4. Prevent confirming a past appointment
  if (
    status === "confirmed" &&
    appointment.appointment_date &&
    appointment.start_time
  ) {
    const appointmentStart =
      new Date(
        `${appointment.appointment_date}T${appointment.start_time}`
      );

    const now =
      new Date();

    if (
      appointmentStart <= now
    ) {
      throw new Error(
        "Cannot confirm an appointment whose scheduled time has passed"
      );
    }
  }

  // 5. Prevent completing an appointment
  // before its scheduled end time
  if (
    status === "completed" &&
    appointment.appointment_date &&
    appointment.end_time
  ) {
    const appointmentEnd =
      new Date(
        `${appointment.appointment_date}T${appointment.end_time}`
      );

    const now =
      new Date();

    if (
      appointmentEnd > now
    ) {
      throw new Error(
        "Cannot complete an appointment before its scheduled time"
      );
    }
  }

  // 6. Patient can only cancel their own appointment
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

  // 7. Doctor can manage appointments assigned to them
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

  // 10. Create notification
  // based on the new status

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

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
};