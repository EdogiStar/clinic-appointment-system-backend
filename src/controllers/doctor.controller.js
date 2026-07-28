const doctorService = require("../services/doctor.service");

const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.createDoctor(req.body);

    res.status(201).json({
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create doctor",
      error: error.message,
    });
  }
};

module.exports = {
  createDoctor,
};