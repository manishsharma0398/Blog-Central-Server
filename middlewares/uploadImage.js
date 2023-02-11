const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;

const imagesFolder = async () => {
  if (!fs.existsSync(path.join(__dirname, "..", "public"))) {
    try {
      await fsPromises.mkdir(path.join(__dirname, "..", "public/images"), {
        recursive: true,
      });
    } catch (error) {
      throw error;
    }
  }
  return path.join(__dirname, "..", "public", "images");
};

const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, await imagesFolder());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e24);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".jpeg");
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file format" }, false);
  }
};

module.exports.uploadPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fieldSize: 2 * 1024 * 1024 },
});

const compressedFolder = async () => {
  if (
    !fs.existsSync(path.join(__dirname, "..", "public", "images", "compressed"))
  ) {
    try {
      await fsPromises.mkdir(
        path.join(__dirname, "..", "public", "images", "compressed"),
        {
          recursive: true,
        }
      );
    } catch (error) {
      throw error;
    }
  }
  return path.join(__dirname, "..", "public", "images", "compressed");
};

module.exports.compressImage = async (req, res, next) => {
  if (!req?.file) return next();
  await compressedFolder();
  await sharp(req?.file?.path)
    // .resize(300, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 50 })
    .toFile(`public/images/compressed/${req?.file?.filename}`);

  next();
};
