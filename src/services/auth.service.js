const supabase = require("../config/supabase");

const loginUser = async ({ email, password }) => {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: users, error: userError } =
    await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id);

  if (userError) {
    throw new Error(userError.message);
  }

  if (!users || users.length === 0) {
    throw new Error("User profile not found");
  }

  return {
    user: users[0],
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
};

const registerPatient = async ({
  full_name,
  email,
  password,
  phone,
}) => {
  // Create account in Supabase Auth
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  // Create user profile in our users table
  const {
    data: user,
    error: userError,
  } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      full_name,
      email,
      phone,
      role: "patient",
    })
    .select()
    .single();

  if (userError) {
    // If profile creation fails, remove the Auth account
    await supabase.auth.admin.deleteUser(
      authData.user.id
    );

    throw new Error(userError.message);
  }

  return user;
};

module.exports = {
  registerPatient,
  loginUser,
};