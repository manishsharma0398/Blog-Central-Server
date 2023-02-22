const router = require("express").Router();

const {
  uploadImages,
  deleteImages,
} = require("../controllers/imageController");
const { uploadPhoto } = require("../middlewares/uploadImage");
const { verifyToken } = require("../middlewares/verifyJWT");

// delete images from cloudinary
router.post("/", verifyToken, deleteImages);

// upload blog image
router.post("/blogs", verifyToken, uploadPhoto.single("images"), uploadImages);

// upload profile picture
router.post(
  "/profile",
  verifyToken,
  uploadPhoto.single("images"),
  uploadImages
);

module.exports = router;
