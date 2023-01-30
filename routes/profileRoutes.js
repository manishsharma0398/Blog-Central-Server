const router = require("express").Router();

const {
  getAllProfiles,
  getProfile,
  updateProfile,
} = require("../controllers/profileController");
const { uploadProfilePic } = require("../controllers/imageController");
const { verifyToken, isAdmin } = require("../middlewares/verifyJWT");
const { uploadPhoto, compressImage } = require("../middlewares/uploadImage");

router.get("/all", verifyToken, isAdmin, getAllProfiles);
router.get("/:profileId", getProfile);
router.patch("/", verifyToken, updateProfile);
// upload blog image
router.post(
  "/image",
  verifyToken,
  uploadPhoto.array("images", 1),
  compressImage,
  uploadProfilePic
);

module.exports = router;
