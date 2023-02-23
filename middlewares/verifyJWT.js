const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const User = require("../models/User");

module.exports.verifyToken = asyncHandler(async (req, res, next) => {
  console.log("I am getting called");

  const authHeader =
    req?.headers?.authorization || req?.headers?.Authorization || "";

  console.log({ authHeader });

  if (!authHeader?.startsWith("Bearer ")) {
    res.statusCode = 401;
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    // check token of user
    const user = await User.findById(decoded.id)
      .select("_id role")
      .lean()
      .exec();

    if (!user) throw new Error("Some error occured");
    req.userId = user._id.toString();
    req.role = user.role;
    next();
  });
});

module.exports.checkLoggedIn = asyncHandler(async (req, res, next) => {
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization;

  const token = authHeader?.split(" ")[1] || "";

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.userId = "";
      req.role = "";
      return next();
    }

    // check token of user
    const user = await User.findById(decoded.id)
      .select("_id role")
      .lean()
      .exec();

    if (!user) {
      req.userId = "";
      req.role = "";
      return next();
    }

    if (user.role === "admin") {
      req.role = "admin";
      req.userId = "";
      return next();
    }

    req.userId = user._id.toString();
    req.role = user.role;
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
