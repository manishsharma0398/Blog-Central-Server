module.exports.isInputValid = async (req, res, validation_model) => {
  try {
    await validation_model.validateAsync(req.body, {
      abortEarly: false,
    });
    return null;
  } catch (errors) {
    const authErr = [];
    errors.details.forEach((err) => {
      const key = err.path[0] + "_error";
      const obj = {};
      obj[key] = err.message;
      authErr.push(obj);
    });
    return res.status(409).json(authErr);
  }
};
