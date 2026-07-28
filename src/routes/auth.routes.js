const express = require("express");

const validate = require("../middleware/validate.middleware");

const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.validation");

const {
  register,
  login,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

module.exports = router;