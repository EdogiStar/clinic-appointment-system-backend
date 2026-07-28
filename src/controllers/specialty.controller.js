const specialtyService = require("../services/specialty.service");

const getSpecialties = async (req, res) => {
  try {
    const specialties = await specialtyService.getAllSpecialties();

    res.status(200).json({
      data: specialties,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch specialties",
      error: error.message,
    });
  }
};

module.exports = {
  getSpecialties,
};