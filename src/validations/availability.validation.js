const Joi = require("joi");

const createAvailabilitySchema = Joi.object({
  doctor_id: Joi.string().uuid().required(),

  day_of_week: Joi.string()
    .valid(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    )
    .required(),

  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),

  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
});

const updateAvailabilitySchema = Joi.object({
  day_of_week: Joi.string()
    .valid(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ),

  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),

  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
}).min(1);

module.exports = {
  createAvailabilitySchema,
  updateAvailabilitySchema,
};