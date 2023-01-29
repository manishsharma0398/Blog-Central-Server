const asyncHandler = require("express-async-handler");

const User = require("../models/User");

const { sendEmail } = require("./emailController");
const { logEvents } = require("../middlewares/logger");
const { isValidUserId } = require("../utils/checkId");
const {
  USER_BLOCKED_LOG_FILE,
  USER_UNBLOCKED_LOG_FILE,
} = require("../utils/variables");

// register
module.exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword: password2 } = req.body;

  // ?validate all fields

  if (!name || !email || !password || !password2)
    return res.status(400).json({ message: "All fields required" });

  if (password !== password2)
    return res.status(400).json({ message: "Passwords do not match" });

  const user = await User.findOne({ email }).exec();

  if (user)
    return res.status(400).json({ message: "Email already registered" });

  const { confirmPassword, ...userdata } = req.body;

  await User.create(userdata);

  // ?Generate verify account token

  const verifyToken = await user.createVerificationToken();

  const htm = `Congratulations! ${name}, your Blog Central account has been successfully created. <br/> Please click on the following link to complete your verification process:
  <br/>
  <a href="http://localhost:${process.env.PORT}/api/user/verify-account/${verifyToken}">Verify Account</a>
  `;

  const data = {
    to: email,
    subject: "New Blog Central Account Created",
    htm,
    text: "Please complete verification process",
  };

  await sendEmail(data);
  return res.status(201).json({ message: "User created" });
});

// get all users - @admin
module.exports.getAllUsers = asyncHandler(async (req, res) => {
  try {
    const allUsers = await User.find()
      .select("_id name email role blocked verified createdAt")
      .lean()
      .exec();
    return res.json(allUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// get a user
module.exports.getUser = asyncHandler(async (req, res) => {
  const userId = req.params?.userId;
  isValidUserId(userId);

  try {
    const user = await User.findById(userId)
      .select("_id name email role blocked verified createdAt")
      .lean()
      .exec();

    if (!user) return res.status(404).json({ message: "No user found" });

    if (user.blocked)
      return res.status(200).json({ message: "Cannot fetch user details" });

    return res.json(user);
  } catch (error) {
    throw new Error("Invalid User Id");
  }
});

// update user
module.exports.updateUser = asyncHandler(async (req, res) => {
  const userId = req?.params?.userId;
  isValidUserId(userId);

  // ? validate req.body

  const userSentData = {
    name: req.body?.name,
    email: req.body?.email,
    password: req.body?.password,
  };

  const user = await User.findById(userId).exec();
  if (!user) return res.status(400).json({ message: "User not found" });

  if (req.userId !== user._id.toString())
    return res.status(403).json({ message: "Unauthorized" });

  if (userSentData.name.length < 5)
    return res.status(400).json({ message: "Enter Valid Name" });

  if (user.email !== userSentData.email) {
    const emailExist = await User.findOne({ email: userSentData.email }).exec();
    if (emailExist)
      return res
        .status(400)
        .json({ message: "Email registered with another account" });
  }

  if (!userSentData?.password)
    return res.status(400).json({ message: "Enter valid Password" });

  const passwordMatched = await user.didPasswordMatch(userSentData.password);

  if (!passwordMatched)
    return res.status(401).json({ message: "Password did not match" });

  try {
    user.name = userSentData.name;
    user.email = userSentData.email;

    const updatedUser = await user.save();

    const emailChanged = userSentData.email === updatedUser.email;

    if (emailChanged) {
      const htm = `Congratulations! ${
        updatedUser.name?.split(" ")[0]
      }, your Blog Central account registered email has been successfully changed. 
  `;

      const data = {
        to: updatedUser.email,
        subject: "Email account changed",
        htm,
        text: "Registered email account for your account",
      };

      await sendEmail(data);
    }

    return res.status(201).json({
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// delete user
module.exports.deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  isValidUserId(userId);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "No user found" });

    // ?only user himself can delete his account
    if (req.userId !== user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await user.delete();
    return res.json({ message: "User deleted" });
  } catch (error) {
    throw new Error(error);
  }
});

// block user
module.exports.blockUser = asyncHandler(async (req, res) => {
  const userToBlock = req.params?.userId;
  isValidUserId(userToBlock);

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

// unblock user
module.exports.unBlockUser = asyncHandler(async (req, res) => {
  const userId = req.params?.userId;
  isValidUserId(userId);

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
