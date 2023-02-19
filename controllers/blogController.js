const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { cloudinaryDeleteImg } = require("../config/cloudinary");

const Blog = require("../models/Blog");
const Like = require("../models/Like");
const Category = require("../models/Category");
const { isValidUserId } = require("../utils/checkId");
const User = require("../models/User");

// create
module.exports.createBlog = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const blog = req?.body?.blog;
  const tags = req?.body?.tags;
  const title = req?.body?.title;
  const category = req?.body?.category;
  const description = req?.body?.description;
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
    description,
  });

  return res.status(201).json(newBlog);
});

// get all blogs
module.exports.getAllBlogs = asyncHandler(async (req, res) => {
  const userId = req?.query?.userId;
  const email = req?.query?.email;
  const page = parseInt(req.query.page) - 1 || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || "";
  let sort = req.query.sort || "views";
  let categoryToFilter = req.query.categories || "All";

  const categoriesFromDB = await Category.find({}).exec();

  let categoryIds = [];

  if (categoryToFilter === "All") {
    categoryIds = categoriesFromDB.map((cat) => cat._id);
  } else {
    const categories = categoryToFilter.split(",");
    categoryIds = categories.filter((cat) =>
      mongoose.Types.ObjectId.isValid(cat)
    );
  }

  req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

  console.log(req.query.sort);

  let sortBy = {};

  if (req.query.sort !== ",") {
    if (sort[1]) {
      sortBy[sort[0]] = sort[1];
    } else {
      sortBy[sort[0]] = "asc";
    }
  }

  const query = {
    title: { $regex: search, $options: "i" },
    category: { $in: categoryIds },
  };

  if (mongoose.Types.ObjectId.isValid(userId)) query.user = userId;

  if (email) {
    const user = await User.findOne({ email: email }).exec();
    if (user) {
      query.user = user._id;
    }
  }

  const allBlogs = await Blog.find(query)
    .sort(sortBy)
    .skip(page * limit)
    .limit(limit)
    .populate([{ path: "user", select: "name profilePic email" }])
    .populate([{ path: "category", select: "category" }])
    .exec();

  const total = await Blog.countDocuments(query);

  const blogWithLikesCount = await Promise.all(
    allBlogs.map(async (blog) => {
      const blogId = blog._id;

      const likes = await Like.countDocuments({ blog: blogId }).exec();

      return { ...blog._doc, likes };
    })
  );

  // sort the blogs by the number of likes count (either ascending or descending based on the `sort` query parameter)
  // if (sort[0] === "likes") {
  //   blogWithLikesCount.sort((a, b) => {
  //     if (sort[1] === "asc") {
  //       return a.likes - b.likes;
  //     } else {
  //       return b.likes - a.likes;
  //     }
  //   });
  // }

  const response = {
    totalDocuments: total,
    totalPages: Math.ceil(total / limit),
    page: page + 1,
    limit,
    categories: categoryToFilter,
  };

  if (!req.userId || req?.role === "admin") {
    response.blogs = blogWithLikesCount;
    return res.status(200).json(response);
  }

  const likes = await Like.find({ user: req?.userId }).exec();

  const blogsWithLikes = blogWithLikesCount.map((blog) => {
    const like = likes.find((l) => l.blog.toString() === blog._id.toString());
    return { ...blog, liked: !!like };
  });

  response.blogs = blogsWithLikes;

  return res.status(200).json(response);
});

// get a blog
module.exports.getABlog = asyncHandler(async (req, res) => {
  const blogId = req?.params?.blogId;
  const userId = req?.userId;

  // ? validate blog id
  if (!mongoose.Types.ObjectId.isValid(blogId))
    return res.status(400).json({ message: "Invalid Blog Id" });

  const blog = await Blog.findOneAndUpdate(
    { _id: blogId },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate([
      { path: "user", model: "User", select: "_id name profilePic" },
      { path: "category", select: "_id category" },
    ])
    .exec();
  if (!blog) return res.status(404).json({ message: "Blog not found" });

  const likes = await Promise.resolve(
    await Like.countDocuments({ blog: blogId })
  );

  if (!userId || userId === null || req?.role === "admin") {
    return res.status(200).json({ ...blog._doc, likes });
  }

  const blogLiked = await Like.findOne({
    blog: blogId,
    user: userId,
  });

  return res
    .status(200)
    .json({ ...blog._doc, likes, liked: blogLiked ? true : false });
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
  const description = req?.body?.description;
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

  blogExist.tags = tags;
  blogExist.blog = blog;
  blogExist.title = title;
  blogExist.category = category;
  blogExist.visibility = visibility;
  blogExist.description = description;
  blogExist.placeholderImg = placeholderImg;

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

  await Like.deleteMany({ blog: blogId });

  return res.status(204).json();
});

module.exports.likeBlog = asyncHandler(async (req, res) => {
  const blogId = req?.params?.blogId;
  const userId = req?.userId;

  const data = { user: userId, blog: blogId };

  const postLiked = await Like.findOne(data).exec();

  let liked;

  if (!postLiked) {
    await Like.create(data);
    res.statusCode = 201;
    liked = true;
  } else {
    await Like.findOneAndRemove(data);
    res.statusCode = 200;
    liked = false;
  }

  const likes = await Like.countDocuments({ blog: blogId }).exec();
  return res.json({ likes, liked, _id: blogId });
});
