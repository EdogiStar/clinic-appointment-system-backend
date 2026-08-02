const dashboardService = require("../services/dashboard.service");

const getAdminDashboard = async (
  req,
  res
) => {
  try {
    const dashboard =
      await dashboardService.getAdminDashboard();

    res.status(200).json({
      message:
        "Admin dashboard data retrieved successfully",

      data: dashboard,
    });
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to retrieve admin dashboard data",

      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
};