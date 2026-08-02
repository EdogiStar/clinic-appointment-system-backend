const authService = require("../services/auth.service");


/**
 * Register a patient or doctor
 */
const register = async (req, res) => {
  try {
    const user = await authService.registerUser(
      req.body
    );

    const role = req.body.role;

    const message =
      role === "doctor"
        ? "Doctor registration successful. Your account is pending admin approval."
        : "Patient registered successfully.";

    res.status(201).json({
      message,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};


/**
 * Login
 */
const login = async (req, res) => {
  try {
    const result =
      await authService.loginUser(
        req.body
      );

    res.status(200).json({
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      message: "Login failed",
      error: error.message,
    });
  }
};


module.exports = {
  register,
  login,
};