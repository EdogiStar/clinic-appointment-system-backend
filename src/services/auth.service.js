const supabase = require("../config/supabase");
const supabaseAdmin = require("../config/supabaseAdmin");

/**
 * Login user
 */
const loginUser = async ({ email, password }) => {
  // 1. Authenticate with Supabase Auth
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user || !authData.session) {
    throw new Error(
      "Unable to authenticate user"
    );
  }

  // 2. Get application user profile
  const {
    data: user,
    error: userError,
  } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error(
      "User profile not found"
    );
  }

  // 3. Check account status
  if (user.status === "pending") {
    throw new Error(
      "Your account is awaiting admin approval"
    );
  }

  if (user.status === "rejected") {
    throw new Error(
      "Your account registration has been rejected"
    );
  }

  if (user.status !== "active") {
    throw new Error(
      "Your account is not active"
    );
  }

  // 4. Return authenticated user
  return {
    user,
    token:
      authData.session.access_token,
    refreshToken:
      authData.session.refresh_token,
  };
};


/**
 * Register a new patient or doctor
 */
const registerUser = async ({
  full_name,
  email,
  password,
  phone,
  role,
  specialty_id,
  license_number,
  bio,
}) => {
  // Only patient and doctor registration
  // are allowed
  if (
    !["patient", "doctor"].includes(role)
  ) {
    throw new Error(
      "Invalid registration role"
    );
  }

  // Doctors must select a specialty
  if (
    role === "doctor" &&
    !specialty_id
  ) {
    throw new Error(
      "Specialty is required for doctor registration"
    );
  }

  // Doctors require admin approval
  const status =
    role === "doctor"
      ? "pending"
      : "active";

  let authUserId = null;

  try {
    // 1. Create user in Supabase Auth
    //
    // Admin client is required because this
    // operation is performed server-side.
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: true,
        }
      );

    if (authError) {
      throw new Error(
        authError.message
      );
    }

    if (!authData.user) {
      throw new Error(
        "Failed to create authentication account"
      );
    }

    authUserId =
      authData.user.id;


    // 2. Create user profile
    //
    // IMPORTANT:
    // Use supabaseAdmin here because RLS
    // is enabled on the users table.
    const {
      data: user,
      error: userError,
    } = await supabaseAdmin
      .from("users")
      .insert({
        id: authUserId,
        full_name,
        email,
        phone: phone || null,
        role,
        status,
      })
      .select()
      .single();

    if (userError) {
      throw new Error(
        userError.message
      );
    }


    // 3. Create doctor profile
    if (role === "doctor") {
      // IMPORTANT:
      // Use supabaseAdmin because RLS
      // is enabled on the doctors table.
      const {
        data: doctor,
        error: doctorError,
      } = await supabaseAdmin
        .from("doctors")
        .insert({
          user_id: authUserId,
          specialty_id,
          license_number:
            license_number || null,
          bio: bio || null,
        })
        .select()
        .single();

      if (doctorError) {
        throw new Error(
          doctorError.message
        );
      }

      return {
        user,
        doctor,
      };
    }


    // 4. Patient registration
    return {
      user,
    };

  } catch (error) {
    // Rollback:
    // If user profile or doctor profile
    // creation fails, delete the Supabase
    // Auth account.
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(
        authUserId
      );
    }

    throw error;
  }
};


/**
 * Backward-compatible patient registration
 *
 * Keeps existing code working if anything
 * still calls registerPatient().
 */
const registerPatient = async ({
  full_name,
  email,
  password,
  phone,
}) => {
  return registerUser({
    full_name,
    email,
    password,
    phone,
    role: "patient",
  });
};


module.exports = {
  loginUser,
  registerUser,
  registerPatient,
};