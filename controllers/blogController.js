const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { cloudinaryDeleteImg } = require("../config/cloudinary");

const Blog = require("../models/Blog");
const { isValidUserId } = require("../utils/checkId");

// create
module.exports.createBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const blog = req?.body?.blog;
  const tags = req?.body?.tags;
  const title = req?.body?.title;
  const category = req?.body?.category;
  const visibility = req?.body?.visibility;
  const placeholderImg = req?.body?.placeholderImg;
  const images = req?.body?.images;

  const newBlog = await Blog.create({
    tags,
    blog,
    title,
    images,
    category,
    visibility,
    user: userId,
    placeholderImg,
  });

  return res.status(201).json(newBlog);
});

// get all blogs
module.exports.getAllBlogs = asyncHandler(async (req, res) => {
  const allBlogs = await Blog.find({})
    .populate([{ path: "user", select: "name" }])
    .populate([{ path: "category", select: "category" }])
    .exec();

  return res.status(200).json(allBlogs);
});

// get a blog
module.exports.getABlog = asyncHandler(async (req, res) => {
  const blogId = req?.params?.blogId;
  // ? validate blog id
  if (!mongoose.Types.ObjectId.isValid(blogId))
    return res.status(400).json({ message: "Invalid Blog Id" });

  const blog = await Blog.findById(blogId)
    .populate([
      { path: "user", model: "User", select: "_id name" },
      { path: "category", select: "_id category" },
    ])
    .exec();
  if (!blog) return res.status(404).json({ message: "Blog not found" });

  return res.status(200).json(blog);
});

// get users blog
module.exports.getUserBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;

  const blogs = await Blog.find({ user: userId }).exec();
  if (!blogs) return res.status(404).json({ message: "Blog not found" });

  return res.status(201).json({ blogs });
});

// get users all blog
module.exports.getBlogByUserId = asyncHandler(async (req, res) => {
  const userId = req?.params?.userId;
  isValidUserId(userId);

  const blogs = await Blog.find({ user: userId })
    .populate([
      { path: "user", select: "name" },
      { path: "category", select: "category" },
    ])
    .exec();

  return res.status(200).json({ blogs });
});

// upload
module.exports.updateBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const tags = req?.body?.tags;
  const blog = req?.body?.blog;
  const title = req?.body?.title;
  const newImages = req?.body?.images;
  const blogId = req?.params?.blogId;
  const category = req?.body?.category;
  const visibility = req?.body?.visibility;
  const placeholderImg = req?.body?.placeholderImg;

  const blogExist = await Blog.findById(blogId).exec();

  if (!blogExist) return res.status(404).json({ message: "Blog do not exist" });

  if (userId !== blogExist.user.toString())
    return res.status(403).json({ message: "Forbidden" });

  if (
    blogExist.placeholderImg.public_id.toString() !==
    placeholderImg.public_id.toString()
  ) {
    // delete from cloudinary old image
    console.log("about to delete image");
    await cloudinaryDeleteImg(blogExist.placeholderImg.public_id);
    console.log("deleted image");
  }

  let cool = [];
  blogExist.images.forEach(async (blogImage) => {
    if (!blog.includes(blogImage.url)) {
      await cloudinaryDeleteImg(blogImage.public_id);
    } else {
      cool.push(blogImage);
    }
  });
  blogExist.images = cool;

  newImages.forEach((imgs) => {
    blogExist.images.push(imgs);
  });

  blogExist.title = title;
  blogExist.blog = blog;
  blogExist.visibility = visibility;
  blogExist.placeholderImg = placeholderImg;
  blogExist.category = category;
  blogExist.tags = tags;

  const updtBlog = await blogExist.save();

  if (!updtBlog)
    return res.status(400).json({ message: "Could not update blog" });

  return res.status(201).json(updtBlog);
});

// delete
module.exports.deleteBlog = asyncHandler(async (req, res) => {
  const blogId = req?.params?.blogId;
  const userId = req?.userId;

  const blog = await Blog.findById(blogId).exec();

  if (!blog) return res.status(404).json({ message: "Blog does not exist" });

  // check if category belongs to user
  if (userId !== blog.user.toString())
    return res.status(401).json({ message: "Only author can delete blog" });

  // delete images
  blog.images.forEach(async (bl) => {
    await cloudinaryDeleteImg(bl.public_id);
  });
  // delete placeholder image
  await cloudinaryDeleteImg(blog.placeholderImg.public_id);

  const isBlogDeleted = await Blog.deleteOne({
    _id: blogId,
  }).exec();

  if (!isBlogDeleted)
    return res.status(500).json({ message: "Could not delete blog" });

  return res.status(204).json();
});
