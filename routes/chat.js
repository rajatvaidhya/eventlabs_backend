const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const TOKEN_SECRET = "enclave";
const User = require("../models/User");
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const formidable = require("formidable");
const fs = require("fs");

router.post("/create", async (req, res) => {
  try {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      const {
        token,
        name,
        description,
        address,
        latitude,
        longitude,
        seeking,
      } = fields;
      console.log("Seeking : ", seeking[0]?.split(","));

      if (!token?.[0]) {
        return res
          .status(401)
          .json({ error: "Authentication token not found" });
      }

      const decoded = jwt.verify(token?.[0], TOKEN_SECRET);
      const userId = decoded._id;
      const user = await User.findById(userId);

      if (files?.image?.[0]) {
        const room = new Chat({
          name: name?.[0],
          createdBy: user,
          description: description?.[0],
          location: {
            type: "Point",
            coordinates: [longitude?.[0], latitude?.[0]],
          },
          address: address?.[0],
          seeking: seeking[0]?.split(","),
        });

        room.image.data = fs.readFileSync(files.image?.[0].filepath);
        room.image.contentType = files.image?.[0].mimetype;
        await room.save();
        res.status(200).json({ roomId: room._id, msg: "OK" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error creating chat room" });
  }
});

router.get("/photo/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const chat = await Chat.findById(id);
    if (chat) {
      res.set("Content-Type", chat.image.contentType);
      res.send(chat.image.data);
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/fetchAllRooms", async (req, res) => {
  try {
    const { userId } = req.body;

    const chatRooms = await Chat.find({ participants: userId });

    res.status(200).json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await Chat.findById(roomId);

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const messages = chatRoom.messages;

    res.status(200).json({ chatRoom, messages });
  } catch (error) {
    console.error("Error fetching chat room data:", error);
    res.status(500).json({ error: "Error fetching chat room data" });
  }
});

router.post("/addParticipant", async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    const chatRoom = await Chat.findById(roomId);
    const user = await User.findById(userId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    let isParticipant = 1;

    for (var i = 0; i < chatRoom.participants.length; i++) {
      if (chatRoom.participants[i] === userId) {
        isParticipant = 0;
        break;
      }
    }

    if (isParticipant) {
      chatRoom.participants.push(userId);

      await chatRoom.save();

      return res.status(200).json({ message: "User added to the chat room" });
    } else {
      return res
        .status(200)
        .json({ message: "User is already a participant in the chat room" });
    }
  } catch (error) {
    console.error("Error adding participant:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/getChatRoomData", async (req, res) => {
  try {
    const { roomId } = req.body;
    let users = [];

    const chatRoom = await Chat.findById(roomId);
    const adminId = chatRoom.createdBy._id;
    const admin = await User.findById(adminId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    for (var i = 0; i < chatRoom.participants.length; i++) {
      let user = await User.findById(chatRoom.participants[i]);
      users.push(user);
    }

    res.status(200).json({ chatRoom, users, admin });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/setLiveLocation", async (req, res) => {
  try {
    const { userId, userLocation } = req.body;
    const user = await User.findById(userId);

    user.location = {
      type: "Point",
      coordinates: [userLocation.longitude, userLocation.latitude],
    };
    await user.save();
    res.status(200).json({ msg: "Location updated successfully" });
  } catch {
    res.status(500).json({ msg: "Error updating location" });
  }
});

router.post("/getNearbyEvents", async (req, res) => {
  const { userId, interest, radius } = req.body;
  const interests = [];
  interests.push(interest);

  const user = await User.findById(userId);

  const nearbyChatRooms = await Chat.aggregate([
    {
      $geoNear: {
        near: user.location,
        distanceField: "distance",
        spherical: true,
        maxDistance: radius * 1000,
      },
    },
    {
      $match: {
        seeking: {
          $in: interests,
        },
      },
    },
  ]);

  res.status(200).json({ nearbyChatRooms });
});

router.post("/getYourEvents", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    const chatRooms = await Chat.find({ createdBy: user._id });
    res.status(200).json({ chatRooms });
  } catch {
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.delete("/deleteEvent", async (req, res) => {
  try {
    const { roomId } = req.body;
    const response = await Chat.findOneAndDelete({ _id: roomId });

    const users = await User.find({ "notifications.id": roomId });

    for (const user of users) {
      user.notifications = user.notifications.filter(
        (notification) => notification.id.toString() !== roomId
      );
      await user.save();
    }

    return res
      .status(200)
      .json({ message: "Chat room and notifications deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat room:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/addPost", async (req, res) => {
  try {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      const { caption, eventId } = fields;

      const post = await Post.create({
        uploadedBy: eventId[0],
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

module.exports = router;
