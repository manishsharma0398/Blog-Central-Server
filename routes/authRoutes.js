const express = require("express");
const router = express.Router();

const {
  login,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyAccount,
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/verifyJWT");

router.post("/login", login);
router.post("/logout", verifyToken, logout);
// router.post("/refresh", handleRefreshToken);
// router.put("/verify-account", verifyToken, verifyAccount);
router.put("/password-update", verifyToken, updatePassword);
router.post("/password-forgot", forgotPassword);
router.post("/password-reset/:token", resetPassword);

module.exports = router;
