const router = require("express").Router();

const {
  register,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  blockUser,
  unBlockUser,
  updateProfilePicture,
  deleteProfilePicture,
  getDashboard,
} = require("../controllers/userController");
const { uploadPhoto, compressImage } = require("../middlewares/uploadImage");

const { verifyToken, isAdmin } = require("../middlewares/verifyJWT");

router.post("/register", register);
router.delete("/:userId", verifyToken, deleteUser);
router.patch("/:userId", verifyToken, updateUser);

// profile picture
router.delete("/profile-pic/:userId", verifyToken, deleteProfilePicture);
router.post(
  "/profile-pic/:userId",
  verifyToken,
  uploadPhoto.single("images"),
  compressImage,
  updateProfilePicture
);

// only admin routes
router.get("/all", verifyToken, getAllUsers);
router.get("/dashboard", verifyToken, isAdmin, getDashboard);
router.patch("/block/:userId", verifyToken, isAdmin, blockUser);
router.patch("/unblock/:userId", verifyToken, isAdmin, unBlockUser);

router.get("/:userId", getUser);

module.exports = router;
