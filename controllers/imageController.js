const fs = require("fs");
const asyncHandler = require("express-async-handler");

const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("../config/cloudinary");

module.exports.uploadImages = asyncHandler(async (req, res) => {
  const folder_name = req.url.split("/")[1];

  try {
    const urls = [];
    const files = req.files;

    for (const file of files) {
      const originalImage = file.path;
      const compressedImage = file.path.replace(
        "\\public\\images",
        "\\public\\images\\compressed"
      );
      const newPath = await cloudinaryUploadImg(compressedImage, folder_name);
      urls.push(newPath);
      fs.unlinkSync(originalImage);
      fs.unlinkSync(compressedImage);
    }

    const images = urls.map((file) => {
      return file;
    });
    res.json(images);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports.deleteImages = asyncHandler(async (req, res) => {
  const { public_id } = req.body;
  try {
    const response = await cloudinaryDeleteImg(public_id, "images");

    if (response === "ok") return res.status(204).json();

    return res.json({ message: "Cannot delete images" });
  } catch (error) {
    throw new Error(error);
  }
});
