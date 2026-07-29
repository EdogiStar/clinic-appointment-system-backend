const supabaseAdmin = require("../config/supabaseAdmin");


const APPOINTMENT_DURATION = 30;


// Convert HH:MM to minutes
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":");

  return (
    Number(hours) * 60 +
    Number(minutes)
  );
};


// Convert minutes back to HH:MM
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};


// Get day name from date
const getDayName = (date) => {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    }
  );
};


const generateAvailableSlots = async (
  doctorId,
  date
) => {

  const dayOfWeek = getDayName(date);


  // 1. Get doctor's availability
  const {
    data: availability,
    error: availabilityError,
  } =
    await supabaseAdmin
      .from("doctor_availabilities")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();


  if (availabilityError) {
    throw new Error(
      availabilityError.message
    );
  }


  if (!availability) {
    return [];
  }



  // 2. Generate slots

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
    current + APPOINTMENT_DURATION <= end
  ) {

    slots.push(
      minutesToTime(current)
    );

    current += APPOINTMENT_DURATION;
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
      .eq("doctor_id", doctorId)
      .eq("appointment_date", date)
      .neq("status", "cancelled");


  if (appointmentError) {
    throw new Error(
      appointmentError.message
    );
  }



  // 4. Remove booked slots

  const bookedSlots =
    appointments.map(
      (appointment) =>
        appointment.start_time.slice(0, 5)
    );


  const availableSlots =
    slots.filter(
      (slot) =>
        !bookedSlots.includes(slot)
    );


  return availableSlots;
};


module.exports = {
  generateAvailableSlots,
};