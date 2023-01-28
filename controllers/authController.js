const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");

const { logEvents } = require("../middlewares/logger");
const User = require("../models/User");
const { generateToken } = require("../config/jwtToken");
const { COOKIE_NAME, PWD_LOG_FILE } = require("../utils/variables");
const { generateRefreshToken } = require("../config/refreshToken");
// const { isValidMongoId } = require("../utils/validMongoId");
// const { isEmailValid } = require("../utils/emailValidator");
const { sendEmail } = require("./emailController");

module.exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });

  const user = await User.findOne({ email }).exec();

  if (!user) return res.status(400).json({ message: "Email not registered" });

  // check password
  if (!(await user.didPasswordMatch(password)))
    return res.status(400).json({ message: "Error credentials" });

  if (user.blocked) return res.status(400).json({ message: "You are blocked" });

  const refreshToken = generateRefreshToken(user._id);

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { refreshToken },
    { new: true }
  );

  res.cookie(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 3,
  });

  return res.status(200).json({
    _id: updatedUser?._id,
    name: updatedUser?.name,
    email: updatedUser?.email,
    mobile: updatedUser?.mobile,
    token: generateToken(updatedUser._id),
  });
});

module.exports.handleRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    res.statusCode = 401;
    throw new Error("Unauthorized");
  }

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        res.statusCode = 403;
        throw new Error("Forbidden");
      }

      const user = await User.findOne({ refreshToken })
        .select("-password")
        .lean()
        .exec();

      if (!user) {
        res.statusCode = 404;
        throw new Error("No user with this refresh Token");
      }

      const accessToken = generateToken(user._id);

      res.json({ accessToken });
    }
  );
});

module.exports.logout = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;
  try {
    await User.findOneAndUpdate(
      refreshToken,
      { refreshToken: "" },
      { new: true }
    );
  } catch (error) {
    throw new Error(error);
  }
  res.clearCookie("jwt", { httpOnly: true, secure: true });
  return res.json({ message: "Log Out" });
});

module.exports.updatePassword = asyncHandler(async (req, res) => {
  const userId = req.userId;
  isValidMongoId(userId);

  const newPassword = req.body?.password;

  if (!newPassword || newPassword.length < 1 || newPassword === null)
    return res.status(400).json({ message: "Password required" });

  const user = await User.findById(userId).exec();

  if (!user) throw new Error("User Do Not Exist!");

  try {
    user.password = newPassword;
    const updatedPass = await user.save();
    return res.json(updatedPass);
  } catch (err) {
    throw new Error(err);
  }
});

module.exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body?.email;

  if (!isEmailValid(email))
    return res.status(400).json({ message: "Invalid Email Id" });

  const user = await User.findOne({ email }).exec();
  if (!user) return res.status(404).json({ message: "User Not Found" });

  const token = await user.createPasswordResetToken();
  await user.save();

  const resetURL = `Hi, Please follow this link to reset your password. This link is valid till 10 minutes.<a href="http://localhost:${process.env.PORT}/api/user/reset-password/${token}">Click Here</a>`;

  const data = {
    to: email,
    subject: "Forgot Password Link",
    htm: resetURL,
    text: "Hey, User",
  };

  await sendEmail(data);
  return res.status(200).json(token);
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword)
    return res.status(400).json({ message: "Required" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const token = req.params?.token;
  if (!token) return res.status(400).json({ message: "No token" });

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({ passwordResetToken: hashedToken }).exec();
  if (!user)
    return res.status(401).json({ message: "Token Expired or Wrong Token" });

  if (Date.now() > user.passwordResetTokenExpires)
    return res.json({ message: "Token expired. Generate a new token" });

  user.password = password;
  // user.passwordChangedAt = Date.now();
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  try {
    await user.save();
    logEvents(`${user.email}:${user._id}`, PWD_LOG_FILE);
    return res.json(user);
  } catch (error) {
    throw new Error(error);
  }
});
