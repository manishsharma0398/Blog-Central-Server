const router = require("express").Router();

const {
  getAllBlogs,
  getUserBlog,
  getABlog,
  deleteBlog,
  createBlog,
  updateBlog,
} = require("../controllers/blogController");
const { uploadBlogImage } = require("../controllers/imageController");
const { uploadPhoto, compressImage } = require("../middlewares/uploadImage");

const { verifyToken } = require("../middlewares/verifyJWT");

// create new blog
router.post("/create", verifyToken, createBlog);
// upload blog image
router.post(
  "/image",
  verifyToken,
  uploadPhoto.array("images", 1),
  compressImage,
  uploadBlogImage
);
// get blogs
router.get("/all", verifyToken, getAllBlogs);
router.get("/user/:userId", verifyToken, getUserBlog);
router.get("/:blogId", getABlog);
// update blog
router.patch("/:blogId", verifyToken, updateBlog);
// delete blog
router.delete("/:blogId", verifyToken, deleteBlog);

module.exports = router;
