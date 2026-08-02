const supabase = require("../config/supabase");


const authenticate = async (
  req,
  res,
  next
) => {
  try {
    // 1. Get Authorization header
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    // 2. Extract token
    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication token is missing",
      });
    }

    // 3. Validate Supabase token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(
      token
    );

    if (error || !user) {
      return res.status(401).json({
        message:
          "Invalid or expired token",
      });
    }

    // 4. Get application user profile
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        message:
          "Failed to fetch user profile",
      });
    }

    if (!profile) {
      return res.status(404).json({
        message:
          "User profile not found",
      });
    }

    // 5. Check account status
    if (profile.status === "pending") {
      return res.status(403).json({
        message:
          "Your account is awaiting admin approval",
      });
    }

    if (profile.status === "rejected") {
      return res.status(403).json({
        message:
          "Your account registration has been rejected",
      });
    }

    if (profile.status !== "active") {
      return res.status(403).json({
        message:
          "Your account is not active",
      });
    }

    // 6. Attach authenticated user
    // and application profile to request
    req.user = {
      ...user,
      profile,
    };

    // 7. Continue
    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(401).json({
      message:
        "Authentication failed",
    });
  }
};


module.exports = authenticate;