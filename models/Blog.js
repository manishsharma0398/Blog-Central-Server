const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    blog: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      required: true,
    },
    placeholderImg: {
      url: { type: String },
      asset_id: { type: String },
      public_id: { type: String },
    },
    images: [
      {
        url: { type: String },
        asset_id: { type: String },
        public_id: { type: String },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Blog", blogSchema);
