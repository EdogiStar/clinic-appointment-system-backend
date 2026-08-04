const Joi = require("joi");

const createAppointmentSchema =
  Joi.object({
    /**
     * Required when an admin
     * creates an appointment.
     *
     * Optional for patients because
     * the backend automatically uses
     * the authenticated patient's ID.
     */
    patient_id:
      Joi.string()
        .uuid()
        .optional(),

    doctor_id:
      Joi.string()
        .uuid()
        .required(),

    appointment_date:
      Joi.date()
        .iso()
        .required(),

    start_time:
      Joi.string()
        .pattern(
          /^([01]\d|2[0-3]):([0-5]\d)$/
        )
        .required(),

    end_time:
      Joi.string()
        .pattern(
          /^([01]\d|2[0-3]):([0-5]\d)$/
        )
        .required(),

    reason:
      Joi.string()
        .trim()
        .max(500)
        .allow("", null),
  });

const updateAppointmentSchema =
  Joi.object({
    status:
      Joi.string()
        .valid(
          "pending",
          "confirmed",
          "completed",
          "cancelled"
        )
        .required(),
  });

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
};