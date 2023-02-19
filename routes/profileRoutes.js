const router = require("express").Router();

const {
  getAllProfiles,
  getProfile,
  updateProfile,
} = require("../controllers/profileController");
const {
  verifyToken,
  isAdmin,
  checkLoggedIn,
} = require("../middlewares/verifyJWT");

router.get("/all", verifyToken, isAdmin, getAllProfiles);
router.get("/", checkLoggedIn, getProfile);
router.patch("/", verifyToken, updateProfile);

module.exports = router;
