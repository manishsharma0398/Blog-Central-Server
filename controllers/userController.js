const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const { sendEmail } = require("./emailController");
const { logEvents } = require("../middlewares/logger");
// const { isValidMongoId } = require("../utils/validMongoId");

const {
  USER_BLOCKED_LOG_FILE,
  USER_UNBLOCKED_LOG_FILE,
} = require("../utils/variables");

module.exports.register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobile,
    password,
    confirmPassword: password2,
  } = req.body;

  if (!name || !email || !mobile || !password || !password2)
    return res.status(400).json({ message: "All fields required" });

  if (password !== password2)
    return res.status(400).json({ message: "Passwords do not match" });

  const user = await User.findOne({ email }).exec();

  if (user)
    return res.status(400).json({ message: "Email already registered" });

  const { confirmPassword, ...userdata } = req.body;

  await User.create(userdata);

  //   const htm = `Hi, Please follow this link to reset your password. This link is valid till 10 minutes.<a href="http://localhost:${process.env.PORT}/api/user/reset-password/${token}">Click Here</a>`;

  const htm = `Congratulations! ${name}, your Blog Central account has been successfully created. <br/> Please click on the following link to complete your verification process`;

  const data = {
    to: email,
    subject: "New Blog Central Account Created",
    htm,
    text: "Please complete verification process",
  };

  await sendEmail(data);
  return res.status(201).json({ message: "User created" });
});

// Route only accessible to admin
module.exports.getAllUsers = asyncHandler(async (req, res) => {
  try {
    const allUsers = await User.find()
      .select("-password -updatedAt -__v")
      .lean();
    return res.json(allUsers);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports.getUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  //   isValidMongoId(userId);

  try {
    const user = await User.findById(userId)
      .select("-password -updatedAt -__v")
      .lean();
    if (!user) return res.status(404).json({ message: "No user found" });
    return res.json(user);
  } catch (error) {
    throw new Error("Invalid User Id");
  }
});

module.exports.updateUser = asyncHandler(async (req, res) => {
  const userId = req.userId;
  //   isValidMongoId(userId);

  const updatedUserData = {
    name: req.body?.name,
    email: req.body?.email,
    mobile: req.body?.mobile,
  };

  if (
    !updatedUserData.firstname ||
    !updatedUserData.email ||
    !updatedUserData.mobile
  )
    return res.status(400).json({ message: "Required" });

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updatedUserData, {
      new: true,
    });

    if (!updatedUser) return res.status(404).json({ message: "No user found" });

    return res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports.deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  isValidMongoId(userId);

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "No user found" });
    return res.json({ message: "User deleted" });
  } catch (error) {
    throw new Error("Invalid User Id");
  }
});

module.exports.blockUser = asyncHandler(async (req, res) => {
  const userToBlock = req.params?.userId;
  isValidMongoId(userToBlock);

  try {
    const user = await User.findByIdAndUpdate(
      userToBlock,
      { blocked: true },
      { new: true }
    ).exec();

    logEvents(`${user._id}: ${user.email}`, USER_BLOCKED_LOG_FILE);

    return res.json({ message: `User ${user._id} blocked` });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports.unBlockUser = asyncHandler(async (req, res) => {
  const userId = req.params?.userId;
  isValidMongoId(userId);

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { blocked: false },
      { new: true }
    ).exec();

    logEvents(`${user._id}: ${user.email}`, USER_UNBLOCKED_LOG_FILE);

    return res.json({ message: `User ${user._id} unblocked` });
  } catch (error) {
    throw new Error(error);
  }
});
