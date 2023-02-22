require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const asyncHandler = require("express-async-handler");

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload Image
module.exports.cloudinaryUploadImg = async (fileToUploads, folder_name) => {
  try {
    const response = await cloudinary.uploader.upload(fileToUploads, {
      folder: `blog-central/${folder_name}`,
    });
    return {
      url: response.secure_url,
      asset_id: response.asset_id,
      public_id: response.public_id,
    };
  } catch (error) {
    throw new Error(error);
  }
};

// Delete
module.exports.cloudinaryDeleteImg = asyncHandler(async (public_id) => {
  try {
    if (!public_id) return null;
    const response = await cloudinary.uploader.destroy(public_id);
    return response.result;
  } catch (error) {
    console.log(error);
    throw new Error(typeof error === "object" ? error.message : error);
  }
});
