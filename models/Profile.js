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
      length: 10,
      required: true,
      default: "",
    },
    gender: {
      type: String,
      required: true,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "",
    },
    stateOrRegion: {
      type: String,
      required: true,
      default: "",
    },
    city: {
      type: String,
      required: true,
      default: "",
    },
    zipCode: {
      type: Number,
      required: true,
      default: "",
    },
    socialProfiles: {
      twitter: String,
      facebook: String,
      linkedin: String,
      instagram: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
