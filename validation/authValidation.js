const Joi = require("joi");

const { customErrorMessages } = require("./customErrorList");

module.exports.register_validator = Joi.object({
  name: Joi.string().required().min(5).max(100).messages(customErrorMessages),
  password: Joi.string()
    .required()
    .min(6)
    .max(30)
    .messages(customErrorMessages),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ ...customErrorMessages, "any.only": "Passwords do not match" }),
  email: Joi.string().email().required().messages(customErrorMessages),
});

module.exports.login_validator = Joi.object({
  email: Joi.string().email().required().messages(customErrorMessages),
  password: Joi.string().required().messages(customErrorMessages),
});
