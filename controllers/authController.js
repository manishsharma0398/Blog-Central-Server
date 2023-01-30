const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Profile = require("../models/Profile");

const { logEvents } = require("../middlewares/logger");
const { sendEmail } = require("./emailController");
const { generateToken } = require("../config/jwtToken");
const { generateRefreshToken } = require("../config/refreshToken");
const {
  COOKIE_NAME,
  PWD_LOG_FILE,
  VERIFIED_LOG_FILE,
} = require("../utils/variables");
const { isEmailValid } = require("../utils/emailValidator");
const { isValidUserId } = require("../utils/checkId");
const { isInputValid } = require("../validation/formValidation");
const { login_validator } = require("../validation/authValidation");

// login
module.exports.login = asyncHandler(async (req, res) => {
  if (await isInputValid(req, res, login_validator)) return;

  const { email, password } = req.body;

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

// verify account
module.exports.verifyAccount = asyncHandler(async (req, res) => {
  const verifyToken = req?.params?.verifyToken;
  if (!verifyToken) return res.status(400).json({ message: "Invalid URL" });

  const hashedToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  const user = await User.findOne({ verificationToken: hashedToken }).exec();
  if (!user) return res.status(401).json({ message: "Token Invalid" });

  // ? check if token valid
  if (Date.now() > user.verificationTokenExpires)
    return res.status(400).json({
      message: "Verification token link expired. Please generate new",
    });

  user.verified = true;
  user.verificationToken = null;

  try {
    await user.save();
    logEvents(`${user.email}:${user._id}`, VERIFIED_LOG_FILE);
    return res.json({
      message: "Verification Process Continue. Please login to continue",
    });
  } catch (error) {
    throw new Error(error);
  }
});

// generate new verification token
module.exports.generateNewVerificationToken = asyncHandler(async (req, res) => {
  const userId = req?.params?.userId;
  isValidUserId(userId);

  const user = await User.findById(userId).exec();
  if (!user) return res.status(400).json({ message: "User not found" });

  if (req.userId !== userId)
    return res.status(403).json({ message: "Unauthorized" });

  // ?Generate verify account token

  const verifyToken = await user.createVerificationToken();

  await user.save();

  const htm = `Hey! ${
    user.name.split(" ")[0]
  }, <br /> Please click on the following link to complete your verification process:
  <br/>
  <a href="http://localhost:${
    process.env.PORT
  }/api/user/verify-account/${verifyToken}">Verify Account</a>
  `;

  const data = {
    to: email,
    subject: "Blog Central Account Verification",
    htm,
    text: "Please complete verification process",
  };

  await sendEmail(data);
  return res.status(201).json({ message: "User created" });
});

// ? doubt in refresh token check once
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
