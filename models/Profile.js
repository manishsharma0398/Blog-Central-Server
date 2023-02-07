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
      max: 10,
      required: true,
    },
    gender: {
      type: String,
      lowercase: true,
      required: true,
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
    socialProfiles: [
      {
        twitter: String,
      },
      {
        facebook: String,
      },
      {
        linkedin: String,
      },
      {
        instagram: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
