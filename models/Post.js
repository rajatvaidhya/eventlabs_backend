const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  caption: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
    },
  ],
  image: {
    data: Buffer,
    contentType: String,
  },
});

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;
