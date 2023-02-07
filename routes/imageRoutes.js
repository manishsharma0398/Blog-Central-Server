const router = require("express").Router();

const { verifyToken } = require("../middlewares/verifyJWT");
const {
  uploadImages,
  deleteImages,
} = require("../controllers/imageController");
const { uploadPhoto, compressImage } = require("../middlewares/uploadImage");

// upload blog image
router.post(
  "/blogs",
  verifyToken,
  uploadPhoto.array("images", 1),
  compressImage,
  uploadImages
);

router.post("/", verifyToken, deleteImages);

// upload profile picture
router.post(
  "/profile",
  verifyToken,
  uploadPhoto.array("images", 1),
  compressImage,
  uploadImages
);

module.exports = router;
