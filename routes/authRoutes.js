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
  generateNewVerificationToken,
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/verifyJWT");

router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/refresh", verifyToken, handleRefreshToken);
// router.post("/refresh", handleRefreshToken);
router.post(
  "/generateVerificationToken",
  verifyToken,
  generateNewVerificationToken
);
router.put("/verify-account/:verifyToken", verifyToken, verifyAccount);
router.put("/password-update", verifyToken, updatePassword);
router.post("/password-forgot", forgotPassword);
router.post("/password-reset/:token", resetPassword);

module.exports = router;
