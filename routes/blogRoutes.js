const router = require("express").Router();

const {
  getAllBlogs,
  getUserBlog,
  getABlog,
  deleteBlog,
  createBlog,
  updateBlog,
  getBlogByUserId,
} = require("../controllers/blogController");

const { verifyToken } = require("../middlewares/verifyJWT");

// create new blog
router.post("/", verifyToken, createBlog);

// get blogs
router.get("/all", verifyToken, getAllBlogs);
router.get("/user", verifyToken, getUserBlog);
router.get("/user/:userId", verifyToken, getBlogByUserId);
router.get("/:blogId", getABlog);
// update blog
router.patch("/:blogId", verifyToken, updateBlog);
// delete blog
router.delete("/:blogId", verifyToken, deleteBlog);

module.exports = router;
