const supabaseAdmin = require("../config/supabaseAdmin");

const createAvailability = async ({
  doctor_id,
  day_of_week,
  start_time,
  end_time,
}, currentUser) => {
  // Admin can create availability for any doctor
  if (currentUser.profile.role === "admin") {
    return insertAvailability({
      doctor_id,
      day_of_week,
      start_time,
      end_time,
    });
  }

  // Find the doctor's profile linked to the logged-in user
  const { data: doctor, error: doctorError } = await supabaseAdmin
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

  // Prevent doctor from creating availability for another doctor
  if (doctor.id !== doctor_id) {
    throw new Error(
      "You can only create availability for yourself"
    );
  }

  return insertAvailability({
    doctor_id,
    day_of_week,
    start_time,
    end_time,
  });
};

const insertAvailability = async ({
  doctor_id,
  day_of_week,
  start_time,
  end_time,
}) => {
  const { data, error } = await supabaseAdmin
    .from("doctor_availabilities")
    .insert({
      doctor_id,
      day_of_week,
      start_time,
      end_time,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getDoctorAvailability = async (doctorId) => {
  const { data, error } = await supabaseAdmin
    .from("doctor_availabilities")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const updateAvailability = async (id, updates, currentUser) => {
  const availability = await getAvailabilityById(id);

  if (!availability) {
    throw new Error("Availability not found");
  }

  await checkOwnership(availability.doctor_id, currentUser);

  const { data, error } = await supabaseAdmin
    .from("doctor_availabilities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const deleteAvailability = async (id, currentUser) => {
  const availability = await getAvailabilityById(id);

  if (!availability) {
    throw new Error("Availability not found");
  }

  await checkOwnership(availability.doctor_id, currentUser);

  const { error } = await supabaseAdmin
    .from("doctor_availabilities")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

const getAvailabilityById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("doctor_availabilities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const checkOwnership = async (doctorId, currentUser) => {
  // Admin can manage any doctor's availability
  if (currentUser.profile.role === "admin") {
    return true;
  }

  // Find doctor profile belonging to logged-in user
  const { data: doctor, error } = await supabaseAdmin
    .from("doctors")
    .select("id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!doctor || doctor.id !== doctorId) {
    throw new Error(
      "You can only manage your own availability"
    );
  }

  return true;
};

module.exports = {
  createAvailability,
  getDoctorAvailability,
  updateAvailability,
  deleteAvailability,
};