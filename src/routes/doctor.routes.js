const express = require("express");

const validate = require("../middleware/validate.middleware");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const {
  createDoctor,
} = require("../controllers/doctor.controller");

const {
  createDoctorSchema,
} = require("../validations/doctor.validation");

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createDoctorSchema),
  createDoctor
);

module.exports = router;