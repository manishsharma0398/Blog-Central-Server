const router = require("express").Router();

const {
  getABlog,
  likeBlog,
  deleteBlog,
  createBlog,
  updateBlog,
  getAllBlogs,
} = require("../controllers/blogController");

const { verifyToken } = require("../middlewares/verifyJWT");

// create new blog
router.post("/", verifyToken, createBlog);

// get blogs
// router.get("/all", getAllBlogs);
router.get("/all", verifyToken, getAllBlogs);
router.get("/:blogId", getABlog);
// update blog
router.patch("/:blogId", verifyToken, updateBlog);
// delete blog
router.delete("/:blogId", verifyToken, deleteBlog);
// like blog
router.post("/like/:blogId", verifyToken, likeBlog);

module.exports = router;
