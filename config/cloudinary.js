require("dotenv").config();
const cloudinary = require("cloudinary").v2;

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload
module.exports.blogImageCloudinary = async (fileToUpload) => {
  console.log("here");
  try {
    const res = await cloudinary.uploader.upload(fileToUpload, {
      folder: "blog-central/blog",
    });
    console.log(res.secure_url);
    return res.secure_url;
  } catch (error) {
    throw new Error(error);
  }
};

// Upload
module.exports.profilePicCloudinary = async (fileToUpload) => {
  try {
    const res = await cloudinary.uploader.upload(fileToUpload, {
      folder: "blog-central/profile",
    });
    // console.log(res);
    return res.secure_url;
  } catch (error) {
    throw new Error(error);
  }
};
