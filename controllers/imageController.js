const asyncHandler = require("express-async-handler");
const fs = require("fs");

const {
  blogImageCloudinary,
  profilePicCloudinary,
} = require("../config/cloudinary");

// upload blog image
module.exports.uploadBlogImage = asyncHandler(async (req, res) => {
  const urls = [];
  const files = req.files;

  try {
    for (const file of files) {
      const originalImage = file.path;
      const compressedImage = file.path.replace(
        "\\public\\images",
        "\\public\\images\\compressed"
      );
      const newPath = await blogImageCloudinary(compressedImage, "images");

      urls.push(newPath);
      fs.unlinkSync(originalImage);
      fs.unlinkSync(compressedImage);
    }

    return res.status(200).json(urls);
  } catch (error) {
    throw new Error(error);
  }
});

// upload blog image
module.exports.uploadProfilePic = asyncHandler(async (req, res) => {
  const urls = [];
  const files = req.files;

  try {
    for (const file of files) {
      const originalImage = file.path;
      const compressedImage = file.path.replace(
        "\\public\\images",
        "\\public\\images\\compressed"
      );
      const newPath = await profilePicCloudinary(compressedImage, "images");

      urls.push(newPath);
      fs.unlinkSync(originalImage);
      fs.unlinkSync(compressedImage);
    }

    return res.status(200).json(urls);
  } catch (error) {
    throw new Error(error);
  }
});
