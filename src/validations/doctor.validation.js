const Joi = require("joi");

const createDoctorSchema = Joi.object({
  full_name: Joi.string()
    .min(2)
    .max(100)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .required(),

  phone: Joi.string()
    .max(20)
    .allow("", null),

  specialty_id: Joi.string()
    .uuid()
    .required(),

  license_number: Joi.string()
    .max(50)
    .required(),
});

module.exports = {
  createDoctorSchema,
};