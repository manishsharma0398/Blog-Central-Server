const asyncHandler = require("express-async-handler");

const Profile = require("../models/Profile");
const User = require("../models/User");

// get all profiles
module.exports.getAllProfiles = asyncHandler(async (req, res) => {
  const allProfiles = await Profile.find({}).exec();

  return res.status(200).json(allProfiles);
});

// get a profile
module.exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req?.query?.userId;
  const email = req?.query?.email;
  const username = req?.query?.username;

  let user = "";

  if (email || username) {
    user = await User.findOne({ email }).exec();
  } else {
    user = await User.findById(userId).exec();
  }

  if (!user) return res.status(500).json({ message: "user not found" });

  const profile = await Profile.findOne({ user: user._id })
    .populate("user", "profilePic name")
    .exec();

  const response = {
    ownProfile: false,
    profile,
    name: user?.name,
    profilePic: user?.profilePic,
  };

  if (req?.userId === user._id.toString()) {
    response.ownProfile = true;
    return res.status(200).json(response);
  }

  return res.status(200).json(response);
});

// upload
module.exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const mobile = req?.body?.mobile;
  const gender = req?.body?.gender;
  const profilePic = req?.body?.profilePic;
  const dateOfBirth = req?.body?.dateOfBirth;
  const country = req?.body?.country;
  const stateOrRegion = req?.body?.stateOrRegion;
  const city = req?.body?.city;
  const zipCode = req?.body?.zipCode;
  const twitter = req?.body?.twitter;
  const facebook = req?.body?.facebook;
  const linkedin = req?.body?.linkedin;
  const instagram = req?.body?.instagram;

  const socialProfiles = { twitter, facebook, linkedin, instagram };

  const data = {
    mobile,
    gender,
    profilePic,
    dateOfBirth,
    country,
    stateOrRegion,
    city,
    zipCode,
    socialProfiles,
  };

  const profile = await Profile.findOne({ user: userId })
    .select("-__v -createdAt -updatedAt")
    .exec();

  if (!profile) {
    const newProfile = await Profile.create({
      user: userId,
      ...data,
    });
    return res.status(201).json(newProfile);
  }

  if (userId !== profile.user.toString())
    return res.status(403).json({ message: "Forbidden" });

  profile.mobile = mobile;
  profile.gender = gender;
  profile.profilePic = profilePic;
  profile.dateOfBirth = dateOfBirth;
  profile.country = country;
  profile.stateOrRegion = stateOrRegion;
  profile.city = city;
  profile.zipCode = zipCode;
  profile.socialProfiles = socialProfiles;

  await profile.save();

  return res.status(201).json(profile);
});
