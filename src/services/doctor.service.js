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
    await supabase
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

module.exports = {
  createDoctor,
};