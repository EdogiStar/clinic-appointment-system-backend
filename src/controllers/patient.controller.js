const patientService = require("../services/patient.service");


const getPatientDashboard = async (req, res) => {
  try {

    const dashboard =
      await patientService.getPatientDashboard(
        req.user.id
      );


    res.status(200).json({
      message:
        "Patient dashboard retrieved successfully",
      data: dashboard,
    });


  } catch (error) {

    res.status(500).json({
      message:
        "Failed to retrieve patient dashboard",
      error: error.message,
    });

  }
};

const getDoctors = async (req, res) => {
  try {
    const doctors =
      await patientService.getDoctors();


    res.status(200).json({
      message:
        "Doctors retrieved successfully",
      data: doctors,
    });


  } catch (error) {

    res.status(500).json({
      message:
        "Failed to retrieve doctors",
      error: error.message,
    });

  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const availability =
      await patientService.getDoctorAvailability(
        req.params.doctorId
      );


    res.status(200).json({
      message:
        "Doctor availability retrieved successfully",
      data: availability,
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Failed to retrieve doctor availability",
      error: error.message,
    });
  }
};


module.exports = {
  getPatientDashboard,
  getDoctors,
  getDoctorAvailability,
};