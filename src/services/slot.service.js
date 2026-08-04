const supabaseAdmin = require("../config/supabaseAdmin");

const APPOINTMENT_DURATION = 30;

/**
 * Convert HH:MM or HH:MM:SS to minutes
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time
    .slice(0, 5)
    .split(":");

  return (
    Number(hours) * 60 +
    Number(minutes)
  );
};

/**
 * Convert minutes back to HH:MM
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(2, "0")}`;
};

/**
 * Get day name from YYYY-MM-DD
 *
 * This avoids timezone issues caused by:
 *
 * new Date("YYYY-MM-DD")
 *
 * which can shift the date depending
 * on the server timezone.
 */
const getDayName = (date) => {
  const [
    year,
    month,
    day,
  ] = date
    .split("-")
    .map(Number);

  const dateObject = new Date(
    year,
    month - 1,
    day
  );

  return dateObject.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    }
  );
};

/**
 * Generate available appointment slots
 *
 * Appointment duration:
 * 30 minutes
 *
 * Example:
 *
 * Availability:
 * 09:00 - 12:00
 *
 * Generated slots:
 * 09:00
 * 09:30
 * 10:00
 * 10:30
 * 11:00
 * 11:30
 */
const generateAvailableSlots = async (
  doctorId,
  date
) => {
  const dayOfWeek =
    getDayName(date);

  // 1. Get doctor's availability
  const {
    data: availability,
    error: availabilityError,
  } =
    await supabaseAdmin
      .from(
        "doctor_availabilities"
      )
      .select("*")
      .eq(
        "doctor_id",
        doctorId
      )
      .eq(
        "day_of_week",
        dayOfWeek
      )
      .maybeSingle();

  if (availabilityError) {
    throw new Error(
      availabilityError.message
    );
  }

  // Doctor is not available
  // on this day
  if (!availability) {
    return [];
  }

  // 2. Generate all possible slots
  const slots = [];

  let current =
    timeToMinutes(
      availability.start_time
    );

  const end =
    timeToMinutes(
      availability.end_time
    );

  while (
    current +
      APPOINTMENT_DURATION <=
    end
  ) {
    slots.push(
      minutesToTime(current)
    );

    current +=
      APPOINTMENT_DURATION;
  }

  // 3. Get existing appointments
  const {
    data: appointments,
    error: appointmentError,
  } =
    await supabaseAdmin
      .from("appointments")
      .select(
        "start_time, end_time, status"
      )
      .eq(
        "doctor_id",
        doctorId
      )
      .eq(
        "appointment_date",
        date
      )
      .neq(
        "status",
        "cancelled"
      );

  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }

  // 4. Remove overlapping slots
  const availableSlots =
    slots.filter(
      (slot) => {
        const slotStart =
          timeToMinutes(slot);

        const slotEnd =
          slotStart +
          APPOINTMENT_DURATION;

        const hasConflict =
          appointments.some(
            (appointment) => {
              const appointmentStart =
                timeToMinutes(
                  appointment.start_time
                );

              const appointmentEnd =
                timeToMinutes(
                  appointment.end_time
                );

              return (
                slotStart <
                  appointmentEnd &&
                slotEnd >
                  appointmentStart
              );
            }
          );

        return !hasConflict;
      }
    );

  return availableSlots;
};

module.exports = {
  APPOINTMENT_DURATION,
  timeToMinutes,
  generateAvailableSlots,
};