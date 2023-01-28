const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mobile: {
      type: Number,
      min: 10,
      max: 9999999999,
      length: 10,
    },
    gender: {
      type: String,
      required: true,
      lowercase: true,
    },
    profilePic: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    country: {
      type: String,
      lowercase: true,
    },
    state: {
      type: String,
      lowercase: true,
    },
    city: {
      type: String,
      lowercase: true,
    },
    zipCode: {
      type: String,
    },
    socialMediaLinks: [{ url: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
