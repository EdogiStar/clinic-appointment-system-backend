const supabaseAdmin = require("../config/supabaseAdmin");

/**
 * Create availability
 */
const createAvailability = async (
  {
    day_of_week,
    start_time,
    end_time,
  },
  currentUser
) => {
  // Admin must specify a doctor_id
  if (currentUser.profile.role === "admin") {
    throw new Error(
      "Admin availability creation is not supported from this endpoint."
    );
  }

  // Find the logged-in doctor's profile
  const { data: doctor, error: doctorError } =
    await supabaseAdmin
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

  // Check for overlapping availability
  const { data: existing, error: existingError } =
    await supabaseAdmin
      .from("doctor_availabilities")
      .select("*")
      .eq("doctor_id", doctor.id)
      .eq("day_of_week", day_of_week);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const hasOverlap = existing.some((slot) => {
    return (
      start_time < slot.end_time &&
      end_time > slot.start_time
    );
  });

  if (hasOverlap) {
    throw new Error(
      "This availability overlaps with an existing time slot."
    );
  }

  return insertAvailability({
    doctor_id: doctor.id,
    day_of_week,
    start_time,
    end_time,
  });
};

/**
 * Insert availability
 */
const insertAvailability = async ({
  doctor_id,
  day_of_week,
  start_time,
  end_time,
}) => {
  const { data, error } =
    await supabaseAdmin
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

/**
 * Get availability for a specific doctor
 */
const getDoctorAvailability = async (
  doctorId
) => {
  const { data, error } =
    await supabaseAdmin
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

/**
 * Get availability for the logged-in doctor
 */
const getMyAvailability = async (
  currentUser
) => {
  // Admin cannot use this endpoint
  if (currentUser.profile.role === "admin") {
    throw new Error(
      "Admin must specify a doctor."
    );
  }

  const { data: doctor, error } =
    await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!doctor) {
    throw new Error("Doctor profile not found");
  }

  return getDoctorAvailability(doctor.id);
};

/**
 * Update availability
 */
const updateAvailability = async (
  id,
  updates,
  currentUser
) => {
  const availability =
    await getAvailabilityById(id);

  if (!availability) {
    throw new Error(
      "Availability not found"
    );
  }

  await checkOwnership(
    availability.doctor_id,
    currentUser
  );

  const { data, error } =
    await supabaseAdmin
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

/**
 * Delete availability
 */
const deleteAvailability = async (
  id,
  currentUser
) => {
  const availability =
    await getAvailabilityById(id);

  if (!availability) {
    throw new Error(
      "Availability not found"
    );
  }

  await checkOwnership(
    availability.doctor_id,
    currentUser
  );

  const { error } =
    await supabaseAdmin
      .from("doctor_availabilities")
      .delete()
      .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

/**
 * Get availability by ID
 */
const getAvailabilityById = async (
  id
) => {
  const { data, error } =
    await supabaseAdmin
      .from("doctor_availabilities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Check ownership
 */
const checkOwnership = async (
  doctorId,
  currentUser
) => {
  // Admin can manage any doctor's availability
  if (currentUser.profile.role === "admin") {
    return true;
  }

  const { data: doctor, error } =
    await supabaseAdmin
      .from("doctors")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (
    !doctor ||
    doctor.id !== doctorId
  ) {
    throw new Error(
      "You can only manage your own availability"
    );
  }

  return true;
};

module.exports = {
  createAvailability,
  getDoctorAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
};