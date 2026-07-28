const authService = require("../services/auth.service");

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

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

const register = async (req, res) => {
  try {
    const user = await authService.registerPatient(req.body);

    res.status(201).json({
      message: "Patient registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};