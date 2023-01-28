const jwt = require("jsonwebtoken");

module.exports.generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN, {
    expiresIn: "3d",
    // algorithm: "RS256",
  });
};
