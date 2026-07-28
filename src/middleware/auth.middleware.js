const supabase = require("../config/supabase");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        message: "Failed to fetch user profile",
      });
    }

    if (!profile) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    req.user = {
      ...user,
      profile,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
    });
  }
};

module.exports = authenticate;