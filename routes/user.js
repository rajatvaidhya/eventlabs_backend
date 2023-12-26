const express = require("express");
const router = express.Router();
const User = require("../models/User");
const formidable = require("formidable");
const Post = require("../models/Post");
const fs = require("fs");

router.post("/fetchNotifications", async (req, res) => {
  const userId = req.body.userId;
  const user = await User.findById(userId);
  res.status(200).json({ notifications: user.notifications });
});

router.post("/fetchUserData", async (req, res) => {
  const userId = req.body.userId;
  const user = await User.findById(userId);
  res.status(200).json({ user: user });
});

router.post("/addPost", async (req, res) => {
  try {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      const { caption, userId } = fields;

      const post = await Post.create({
        uploadedBy: userId[0],
        caption: caption[0],
      });

      if (files?.image?.[0]) {
        post.image.data = fs.readFileSync(files.image?.[0].filepath);
        post.image.contentType = files.image?.[0].mimetype;
      }

      await post.save();
      res.status(200).json({ msg: "OK" });
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/posts/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const posts = await Post.find({ uploadedBy: userId });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/post/photo/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (post) {
      res.set("Content-Type", post.image.contentType);
      res.send(post.image.data);
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
