const asyncHandler = require("express-async-handler");
const fs = require("fs");

const User = require("../models/User");
const Like = require("../models/Like");
const Blog = require("../models/Blog");
const Profile = require("../models/Profile");

const { sendEmail } = require("./emailController");
const { logEvents } = require("../middlewares/logger");
const { isValidUserId } = require("../utils/checkId");
const {
  USER_BLOCKED_LOG_FILE,
  USER_UNBLOCKED_LOG_FILE,
} = require("../utils/variables");
const { isInputValid } = require("../validation/formValidation");
const { register_validator } = require("../validation/authValidation");
const { createVerificationToken } = require("../utils/verificationToken");
const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("../config/cloudinary");
const Category = require("../models/Category");

// register
module.exports.register = asyncHandler(async (req, res) => {
  // if (await isInputValid(req, res, register_validator)) return;

  const { email } = req.body;

  const user = await User.findOne({ email }).exec();

  if (user)
    return res.status(400).json({ message: "Email already registered" });

  const { confirmPassword, ...userdata } = req.body;

  const { token, verificationToken, verificationTokenExpires } =
    await createVerificationToken();

  const newUser = await User.create({
    ...userdata,
    verificationToken,
    verificationTokenExpires,
  });

  const htm = `Congratulations! ${newUser?.name}, your Blog Central account has been successfully created. <br/> Please click on the following link to complete your verification process:
  <br/>
  <a href="${process.env.FRONT_END_BASE_URL}/verify-account/${token}">Verify Account</a>
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
  console.log("yaa");
  try {
    const allUsers = await User.find({})
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

// TODO: implement in front end
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

    await Like.deleteMany({ user: userId }).exec();

    const blogs = await Blog.find({ user: userId }).exec();

    for (let i = 0; i < blogs.length; i++) {
      const blog = blogs[i];

      await Like.deleteMany({ blog: blog._id }).exec();

      // delete images
      blog.images.forEach(async (bl) => {
        await cloudinaryDeleteImg(bl.public_id);
      });

      // delete placeholder image
      if (blog?.placeholderImg)
        await cloudinaryDeleteImg(blog?.placeholderImg?.public_id);

      await Blog.deleteOne(blog?._id).exec();
    }

    await Profile.findOneAndRemove({ user: userId }).exec();

    await user.delete();
    return res.json({ message: "User deleted" });
  } catch (error) {
    throw new Error(error);
  }
});

// TODO: implement in front end
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

// TODO: implement in front end
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

// update profile picture
module.exports.updateProfilePicture = asyncHandler(async (req, res) => {
  const userId = req?.params?.userId;

  if (userId !== req?.userId)
    return res.status(401).json({ message: "Not allowed" });

  const user = await User.findById(userId)
    .select("_id name email role verified profilePic")
    .exec();

  if (!user) return res.status(404).json({ message: "user not found" });

  let profilePic = "";

  try {
    const file = req.file;
    const originalImage = file.path;
    const compressedImage = originalImage.replace(
      "\\public\\images",
      "\\public\\images\\compressed"
    );
    const newPath = await cloudinaryUploadImg(compressedImage, "profile");
    profilePic = newPath;
    fs.unlinkSync(originalImage);
    fs.unlinkSync(compressedImage);

    if (user?.profilePic?.public_id) {
      await cloudinaryDeleteImg(user?.profilePic?.public_id);
    }
  } catch (error) {
    throw new Error(error);
  }

  user.profilePic = profilePic;
  await user.save();

  return res.status(200).json(user);
});

module.exports.deleteProfilePicture = asyncHandler(async (req, res) => {
  const userId = req?.params?.userId;

  if (userId !== req?.userId)
    return res.status(401).json({ message: "Not allowed" });

  const user = await User.findById(userId)
    .select("_id name email role verified profilePic")
    .exec();

  if (!user) return res.status(404).json({ message: "user not found" });

  try {
    await cloudinaryDeleteImg(user?.profilePic?.public_id);
  } catch (err) {
    throw new Error(err);
  }

  user.profilePic = {};
  await user.save();

  return res.status(200).json(user);
});

module.exports.getDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const blockedUsers = await User.countDocuments({
    role: "user",
    blocked: true,
  });
  const activeUsers = await User.countDocuments({
    role: "user",
    blocked: false,
  });

  const categories = await Category.find();

  const blogCounts = await Blog.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const response = {
    totalUsers,
    blockedUsers,
    activeUsers,
    totalBlogs: blogCounts.reduce((acc, val) => acc + val.count, 0),
    blogCounts: blogCounts.reduce((acc, val) => {
      acc[val._id] = val.count;
      return acc;
    }, {}),
    categories: categories.reduce((acc, val) => {
      acc[val.category] = val._id;
      return acc;
    }, {}),
  };

  return res.status(200).json(response);
});
