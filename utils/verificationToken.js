const crypto = require("crypto");

module.exports.createVerificationToken = async function () {
  const token = crypto.randomBytes(64).toString("hex");
  const verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const verificationTokenExpires = Date.now() + 1000 * 60 * 60 * 24 * 3; // 3days
  return { token, verificationToken, verificationTokenExpires };
};
