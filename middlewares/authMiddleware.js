const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

module.exports.verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.statusCode = 401;
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    const user = await User.findById(decoded.id)
      .select("-password")
      .lean()
      .exec();
    req.userId = user._id.toString();
    req.roles = user.role;
    next();
  });
});

module.exports.isAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId).lean().exec();

  if (user.role !== "admin") {
    res.statusCode = 401;
    throw new Error("Unauthorized. You are not admin");
  } else {
    next();
  }
});
