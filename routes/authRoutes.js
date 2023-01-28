const express = require("express");
const router = express.Router();

const {
  login,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
// const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/login", login);
// router.post("/logout", logout);
// router.post("/refresh", handleRefreshToken);
// router.put("/password/update", verifyToken, updatePassword);
// router.post("/password/forgot", forgotPassword);
// router.post("/password/reset/:token", resetPassword);

module.exports = router;
