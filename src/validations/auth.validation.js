const Joi = require("joi");


/**
 * Registration validation
 *
 * Supports:
 * - Patient
 * - Doctor
 */
const registerSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty":
        "Full name is required",
      "string.min":
        "Full name must be at least 2 characters",
      "any.required":
        "Full name is required",
    }),

  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      "string.email":
        "Please provide a valid email address",
      "any.required":
        "Email is required",
    }),

  phone: Joi.string()
    .trim()
    .allow("", null)
    .optional(),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min":
        "Password must be at least 6 characters",
      "any.required":
        "Password is required",
    }),

  role: Joi.string()
    .valid("patient", "doctor")
    .required()
    .messages({
      "any.only":
        "Role must be either patient or doctor",
      "any.required":
        "Role is required",
    }),

  specialty_id: Joi.when("role", {
    is: "doctor",
    then: Joi.string()
      .uuid()
      .required()
      .messages({
        "string.guid":
          "Please select a valid specialty",
        "any.required":
          "Specialty is required for doctors",
      }),
    otherwise: Joi.forbidden(),
  }),

  license_number: Joi.when("role", {
    is: "doctor",
    then: Joi.string()
      .trim()
      .max(100)
      .allow("", null)
      .optional(),
    otherwise: Joi.forbidden(),
  }),

  bio: Joi.when("role", {
    is: "doctor",
    then: Joi.string()
      .trim()
      .max(1000)
      .allow("", null)
      .optional(),
    otherwise: Joi.forbidden(),
  }),
})
.options({
  abortEarly: false,
  stripUnknown: true,
});


/**
 * Login validation
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      "string.email":
        "Please provide a valid email address",
      "any.required":
        "Email is required",
    }),

  password: Joi.string()
    .required()
    .messages({
      "any.required":
        "Password is required",
    }),
})
.options({
  abortEarly: false,
  stripUnknown: true,
});


module.exports = {
  registerSchema,
  loginSchema,
};