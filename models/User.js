const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true,
    },
    profilePic: {
      url: { type: String },
      asset_id: { type: String },
      public_id: { type: String },
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Number,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Number,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSaltSync(
      Number(process.env.BCRYPT_SALT_ROUNDS)
    );
    const hash = await bcrypt.hashSync(this.password, salt);
    this.password = hash;
  }

  next();
});

userSchema.methods.didPasswordMatch = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(64).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 1000 * 60 * 10; //10 minutes

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
