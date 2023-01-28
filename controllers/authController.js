const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Profile = require("../models/Profile");

const { logEvents } = require("../middlewares/logger");
const { sendEmail } = require("./emailController");
const { generateToken } = require("../config/jwtToken");
const { generateRefreshToken } = require("../config/refreshToken");
const { COOKIE_NAME, PWD_LOG_FILE } = require("../utils/variables");
const { isEmailValid } = require("../utils/emailValidator");
const { isValidUserId } = require("../utils/checkId");

// login
module.exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ? validation check
  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });

  const user = await User.findOne({ email }).exec();

  if (!user) return res.status(400).json({ message: "Email not registered" });

  // check password
  if (!(await user.didPasswordMatch(password)))
    return res.status(400).json({ message: "Error credentials" });

  if (user.blocked) return res.status(400).json({ message: "You are blocked" });

  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;

  await user.save();

  res.cookie(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 3, // 3days
  });

  const userProfile = await Profile.findOne({ user: user._id }).populate(
    "user"
  );

  return res.status(200).json({
    user: {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      verified: user?.verified,
    },
    profile: userProfile,
    token: generateToken(user._id),
  });
});

module.exports.verifyAccount = asyncHandler(async (req, res) => {});

module.exports.handleRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies[COOKIE_NAME]) {
    res.statusCode = 401;
    throw new Error("Unauthorized");
  }

  const refreshToken = cookies[COOKIE_NAME];

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

// logout
module.exports.logout = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies[COOKIE_NAME]) return res.sendStatus(204); //No content

  // ? check userId with token id

  const refreshToken = cookies[COOKIE_NAME];
  try {
    const user = await User.findOne({ refreshToken }).exec();
    user.refreshToken = "";
    await user.save();
  } catch (error) {
    throw new Error("Could not logout. Please try again later.");
  }
  res.cookie(COOKIE_NAME, "");
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: true });
  return res.json({ message: "Log Out" });
});

// update or change password
module.exports.updatePassword = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  isValidUserId(userId);

  // ?validate passwords

  const oldPassword = req?.body?.oldPassword;
  const newPassword = req?.body?.newPassword;
  const confirmNewPassword = req?.body?.confirmNewPassword;

  // confirm password
  const user = await User.findById(userId).exec();
  if (!user) throw new Error("User Do Not Exist!");

  const passwordMatched = user.didPasswordMatch(oldPassword);

  if (!passwordMatched)
    return res.status(403).json({ message: "Password incorrect" });

  if (newPassword !== confirmNewPassword)
    return res.status(400).json({ message: "Password did not match" });

  try {
    user.password = newPassword;
    await user.save();
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    throw new Error(err);
  }
});

// forgot password
module.exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body?.email;

  if (!isEmailValid(email))
    return res.status(400).json({ message: "Invalid Email Id" });

  const user = await User.findOne({ email }).exec();
  if (!user)
    return res
      .status(404)
      .json({ message: "Email not registered with any account" });

  const token = await user.createPasswordResetToken();
  await user.save();

  const resetURL = `Hi, Please follow this link to reset your password. This link is valid till 10 minutes.<a href="http://localhost:${process.env.PORT}/api/user/reset-password/${token}">Click Here</a>`;

  const data = {
    to: email,
    subject: "Password Reset Link",
    text: "Reset your password by clicking on the link provided in the email.",
    htm: resetURL,
  };

  await sendEmail(data);
  // ? tokens
  return res.status(201).json({
    message: "A password reset email has been sent to your registered email.",
  });
});

// reset password
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword)
    return res.status(400).json({ message: "Required" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const token = req.params?.token;
  if (!token) return res.status(400).json({ message: "Link not valid" });

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({ passwordResetToken: hashedToken }).exec();
  if (!user)
    return res.status(401).json({ message: "Token Expired or Invalid" });

  if (Date.now() > user.passwordResetTokenExpires)
    return res.json({ message: "Password reset token link expired." });

  // ? check if user doesn't set the same password

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  try {
    await user.save();
    logEvents(`${user.email}:${user._id}`, PWD_LOG_FILE);
    return res.json({
      message: "Password Successfully Changed. Please log in to continue",
    });
  } catch (error) {
    throw new Error(error);
  }
});
