require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const specialtyRoutes = require("./routes/specialty.routes");
const doctorRoutes = require("./routes/doctor.routes");
const availabilityRoutes = require("./routes/availability.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const adminRoutes = require("./routes/admin.routes");
const patientRoutes = require("./routes/patient.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const slotRoutes = require("./routes/slot.routes");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Clinic Appointment System API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/specialties", specialtyRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use(
  "/api/slots",
  slotRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});