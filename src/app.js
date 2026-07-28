require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const specialtyRoutes = require("./routes/specialty.routes");
const doctorRoutes = require("./routes/doctor.routes");
const availabilityRoutes = require("./routes/availability.routes");
const appointmentRoutes = require("./routes/appointment.routes");



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


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});