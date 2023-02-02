const asyncHandler = require("express-async-handler");

const Category = require("../models/Category");

// create
module.exports.addNewCategory = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const category = req?.body?.category;

  const categoryExist = await Category.findOne({ category }).exec();

  if (categoryExist)
    return res.status(400).json({ message: "Category already exists" });

  const newCategory = await Category.create({
    category,
    user: userId,
  });

  return res.status(201).json(newCategory);
});

// read
module.exports.getAllCategories = asyncHandler(async (req, res) => {
  const allCategories = await Category.find({}).exec();

  return res.status(200).json({ categories: allCategories });
});

// update category
module.exports.updateCategory = asyncHandler(async (req, res) => {
  const userId = req?.userId;
  const updtCategory = req?.body?.category;
  const categoryId = req?.params?.categoryId;

  const category = await Category.findById(categoryId).exec();

  if (!category)
    return res.status(404).json({ message: "Category do not exist" });

  if (userId !== category.user.toString())
    return res.status(403).json({ message: "Forbidden" });

  const categoryExist = await Category.find({ category: updtCategory }).exec();

  console.log(categoryExist);

  if (
    categoryExist.length > 0 &&
    categoryExist.every((cat) => cat.id !== categoryId)
  )
    return res.status(400).json({ message: "Category already exist" });

  category.category = updtCategory;
  const updatedCategory = await category.save();

  return res.status(201).json(updatedCategory);
});

// delete
module.exports.deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = req?.params?.categoryId;
  const userId = req?.userId;

  const category = await Category.findById(categoryId).exec();

  if (!category)
    return res.status(404).json({ message: "Category does not exist" });

  // check if category belongs to user
  if (userId !== category.user.toString())
    return res.status(401).json({ message: "Forbidden" });

  const isCategoryDeleted = await Category.deleteOne({
    _id: categoryId,
  }).exec();

  if (!isCategoryDeleted)
    return res.status(500).json({ message: "Could not delete category" });

  return res.status(204).json();
});
