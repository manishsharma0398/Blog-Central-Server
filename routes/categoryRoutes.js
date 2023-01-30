const router = require("express").Router();

const {
  addNewCategory,
  getAllCategories,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");

const { verifyToken, isAdmin } = require("../middlewares/verifyJWT");

router.post("/", verifyToken, isAdmin, addNewCategory);
router.get("/all", verifyToken, isAdmin, getAllCategories);
router.delete("/:categoryId", verifyToken, isAdmin, deleteCategory);
router.patch("/:categoryId", verifyToken, isAdmin, updateCategory);

module.exports = router;
