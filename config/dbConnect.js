const mongoose = require("mongoose");

module.exports.connectToDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URL);
  } catch (error) {
    throw new Error(error);
  }
};
