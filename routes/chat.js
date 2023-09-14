const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat"); // Import your Chat model here
const TOKEN_SECRET = "enclave";
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, "../public/images");
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

//Upload Room Image
router.post("/uploadRoomImage", upload.single("image"), async (req, res) => {

  try {
    const roomid = req.body.roomid; 
    const imageFile = req.file; 

    if (!roomid || !imageFile) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const room = await Chat.findById(roomid);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    room.image = imageFile.filename;

    await room.save();

    res.status(200).json({ msg: "Successfully uploaded room image!" });
  } catch (error) {
    console.error("Error uploading room image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to create a new chat room
router.post("/create", async (req, res) => {
  try {
    const token = req.header("auth-token");

    if (!token) {
      return res.status(401).json({ error: "Authentication token not found" });
    }

    const decoded = jwt.verify(token, TOKEN_SECRET);
    const userId = decoded._id;
    const user = await User.findById(userId);
    const { name, description, location, address, seeking } = req.body;

    // Create a new chat room
    const chatRoom = new Chat({
      name,
      createdBy: user,
      description,
      location: {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      },
      address,
      seeking:seeking,
    });

    // Save the chat room to the database
    await chatRoom.save();
    res.status(201).json(chatRoom);
  } catch (error) {
    res.status(500).json({ error: "Error creating chat room" });
  }
});


router.post("/fetchAllRooms", async (req, res) => {
  try {
    const { userId } = req.body;

    const chatRooms = await Chat.find({ "participants": userId });

    res.status(200).json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Route to fetch chat room data and messages by roomId
router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find the chat room by its ID
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
    const { roomId, userId } = req.body; // Assuming you send user information in the request body

    // Check if the chat room with the specified ID exists
    const chatRoom = await Chat.findById(roomId);
    const user = await User.findById(userId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    let isParticipant=1;

    for(var i=0; i<chatRoom.participants.length; i++){
      if((chatRoom.participants[i])===userId){
        isParticipant=0;
        break;
      }
    }

    if (isParticipant) {
      chatRoom.participants.push(userId); // Set userId to the ObjectId

      // Save the updated chat room
      await chatRoom.save();

      return res.status(200).json({ message: "User added to the chat room" });
    } else {
      return res.status(200).json({ message: "User is already a participant in the chat room" });
    }
  } catch (error) {
    console.error("Error adding participant:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/getChatRoomData", async (req,res)=>{
  try {
    const { roomId } = req.body;
    let users = [];

    
    const chatRoom = await Chat.findById(roomId);
    const adminId = chatRoom.createdBy._id;
    const admin = await User.findById(adminId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    for(var i=0; i<chatRoom.participants.length; i++){
      let user = await User.findById(chatRoom.participants[i]);
      users.push(user);
    }

    res.status(200).json({chatRoom, users, admin});
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})

router.post("/setLiveLocation", async (req, res)=>{
  try{
    const {userId, userLocation} = req.body;
    const user = await User.findById(userId);


    user.location = {
      type: "Point",
      coordinates: [userLocation.longitude, userLocation.latitude],
    };
    await user.save();
    res.status(200).json({ msg: "Location updated successfully" });
  } catch{
    res.status(500).json({msg:"Error updating location"});
  }
})

router.post("/getNearbyEvents", async(req, res)=>{
  const {userId, interest, radius} = req.body;
  const interests = [];
  interests.push(interest);

  const user = await User.findById(userId);

  const nearbyChatRooms = await Chat.aggregate([
    {
      $geoNear: {
        near: user.location,
        distanceField: "distance",
        spherical: true,
        maxDistance: radius*1000,
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

  res.status(200).json({nearbyChatRooms});
})


router.post("/getYourEvents", async(req,res)=>{
  try{
  const {userId} = req.body;
  const user = await User.findById(userId);

  const chatRooms = await Chat.find({createdBy:user._id});
  res.status(200).json({chatRooms});
  } catch{
    res.status(500).json({msg:'Internal Server Error'});
  }
})


module.exports = router;
