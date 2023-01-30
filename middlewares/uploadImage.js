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

module.exports.compressImage = async (req, res, next) => {
  if (!req.files) return next();
  await compressedFolder();
  await Promise.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/compressed/${file.filename}`);
    })
  );
  next();
};
