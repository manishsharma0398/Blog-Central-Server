const router = require("express").Router();

const {
  getAllProfiles,
  getProfile,
  updateProfile,
} = require("../controllers/profileController");
const { verifyToken, isAdmin } = require("../middlewares/verifyJWT");

router.get("/all", verifyToken, isAdmin, getAllProfiles);
router.get("/:userId", getProfile);
router.patch("/", verifyToken, updateProfile);

module.exports = router;
