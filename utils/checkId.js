const mongoose = require("mongoose");

module.exports.isValidMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports.isValidUserId = (id) => {
  if (!this.isValidMongoId(id)) throw new Error("User does not exist");
};

module.exports.isValidBlogId = (id) => {
  if (!this.isValidMongoId(id)) throw new Error("Blog does not exist");
};
