const router = require("express").Router();

const {
  register,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  blockUser,
  unBlockUser,
} = require("../controllers/userController");

const { verifyToken, isAdmin } = require("../middlewares/verifyJWT");

router.post("/register", register);
router.get("/:userId", getUser);
router.delete("/:userId", verifyToken, deleteUser);
router.patch("/:userId", verifyToken, updateUser);

// only admin routes
router.get("/all", verifyToken, isAdmin, getAllUsers);
router.patch("/block/:userId", verifyToken, isAdmin, blockUser);
router.patch("/unblock/:userId", verifyToken, isAdmin, unBlockUser);

module.exports = router;
