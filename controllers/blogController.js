const asyncHandler = require("express-async-handler");

const Blog = require("../models/Blog");

// create
module.exports.createBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const title = req?.body?.title;
  const blog = req?.body?.blog;
  const img = req?.body?.img;
  const category = req?.body?.category;
  const tags = req?.body?.tags;

  const newBlog = await Blog.create({
    user: userId,
    title,
    blog,
    img,
    category,
    tags,
  });

  return res.status(201).json(newBlog);
});

// get all blogs
module.exports.getAllBlogs = asyncHandler(async (req, res) => {
  const allBlogs = await Blog.find({}).exec();

  return res.status(201).json(allBlogs);
});

// get a blog
module.exports.getABlog = asyncHandler(async (req, res) => {
  const blogId = req?.params?.blogId;

  const blog = await Blog.findById(blogId).exec();
  if (!blog) return res.status(404).json({ message: "Blog not found" });

  return res.status(201).json(blog);
});

// get all users blog
module.exports.getUserBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;

  const blogs = await Blog.find({ user: userId }).exec();
  if (!blogs) return res.status(404).json({ message: "Blog not found" });

  return res.status(201).json({ blogs });
});

// upload
module.exports.updateBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const blogId = req?.params?.blogId;
  const title = req?.body?.title;
  const blog = req?.body?.blog;
  const img = req?.body?.img;
  const category = req?.body?.category;
  const tags = req?.body?.tags;

  const blogExist = await Blog.findById(blogId).exec();

  if (!blogExist) return res.status(404).json({ message: "Blog do not exist" });

  if (userId !== blog.user.toString())
    return res.status(403).json({ message: "Forbidden" });

  const updtBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      title,
      blog,
      img,
      category,
      tags,
    },
    { new: true }
  );

  if (!updtBlog)
    return res.status(400).json({ message: "Could not update blog" });

  return res.status(200).json(updtBlog);
});

// delete
module.exports.deleteBlog = asyncHandler(async (req, res) => {
  const blogId = req?.params?.blogId;
  const userId = req?.userId;

  const blog = await Blog.findById(blogId).exec();

  if (!blog) return res.status(404).json({ message: "Blog does not exist" });

  // check if category belongs to user
  if (userId !== blog.user.toString())
    return res.status(401).json({ message: "Forbidden" });

  const isBlogDeleted = await Blog.deleteOne({
    _id: blogId,
  }).exec();

  if (!isBlogDeleted)
    return res.status(500).json({ message: "Could not delete blog" });

  return res.status(204).json();
});
