const asyncHandler = require("express-async-handler");

const Profile = require("../models/Profile");

// get all profiles
module.exports.getAllProfiles = asyncHandler(async (req, res) => {
  const allProfiles = await Profile.find({}).exec();

  return res.status(200).json(allProfiles);
});

// get a profile
module.exports.getProfile = asyncHandler(async (req, res) => {
  const profileId = req?.params?.profileId;

  const profile = await Profile.findById(profileId).exec();
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  return res.status(201).json(profile);
});

// upload
module.exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const mobile = req?.body?.mobile;
  const gender = req?.body?.gender;
  const profilePic = req?.body?.profilePic;
  const dateOfBirth = req?.body?.dateOfBirth;
  const country = req?.body?.country;
  const state = req?.body?.state;
  const city = req?.body?.city;
  const zipCode = req?.body?.zipCode;
  const socialMediaLinks = req?.body?.socialMediaLinks;

  const profile = await Profile.findOne({ user: userId }).exec();

  if (!profile) {
    const newProfile = await Profile.create({
      user: userId,
      mobile,
      gender,
      profilePic,
      dateOfBirth,
      country,
      state,
      city,
      zipCode,
      socialMediaLinks,
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
  profile.state = state;
  profile.city = city;
  profile.zipCode = zipCode;
  profile.socialMediaLinks = socialMediaLinks;

  const profileUpdt = await profile.save();

  return res.status(201).json(profileUpdt);
});
