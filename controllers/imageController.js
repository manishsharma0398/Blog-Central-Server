const fs = require("fs");
const asyncHandler = require("express-async-handler");

const { compressImage } = require("../middlewares/uploadImage");

const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("../config/cloudinary");

module.exports.deleteImages = asyncHandler(async (req, res) => {
  const { public_id } = req.body;
  try {
    const response = await cloudinaryDeleteImg(public_id);

    if (response === "ok") return res.status(204).json();

    return res.json({ message: "Cannot delete images" });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports.uploadImages = asyncHandler(async (req, res) => {
  const url = req?.url?.split("/")[1];

  try {
    const file = req.file;
    const originalImage = file.path;
    const compressedImage = await compressImage(file);

    const newPath = await cloudinaryUploadImg(compressedImage, url);

    console.log("image uploaded: ", newPath);

    fs.closeSync(fs.openSync(originalImage, "r"));
    fs.closeSync(fs.openSync(compressedImage, "r"));

    // Delete the file
    fs.unlinkSync(originalImage);
    fs.unlinkSync(compressedImage);

    return res.status(201).json(newPath);
  } catch (error) {
    throw new Error(error);
  }
});
