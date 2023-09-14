const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TOKEN_SECRET = "enclave";
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


//Upload user profile picture
router.post("/uploadUserImage", upload.single("image"), async (req, res) => {
  try {
    const userId = req.body.userId; 
    const imageFile = req.file; 

    if (!userId || !imageFile) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.image = imageFile.filename;

    await user.save();

    res.status(200).json({ msg: "Successfully uploaded user image!" });
  } catch (error) {
    console.error("Error uploading user image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    phoneNumber,
    email,
    password,
    interests,
    location,
  } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      interests,
      location: {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      },
    });

    const authtoken = jwt.sign({ _id: user._id }, TOKEN_SECRET);

    res.json({ success: true, authtoken, userId:user._id, firstName:user.firstName});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const authtoken = jwt.sign({ _id: user._id }, TOKEN_SECRET);

    res.json({ success: true, authtoken, userId:user._id, firstName:user.firstName});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/interest-selection", async (req, res) => {
  const token = req.header("auth-token");
  const interests = req.body.interests;

  if (!token) {
    return res.status(401).json({ error: "Authentication token not found" });
  }

  const decoded = jwt.verify(token, TOKEN_SECRET);
  const userId = decoded._id;
  const user = await User.findById(userId);

  user.interests = interests;
  await user.save();
  res.status(200).json({ msg: "OK" });
});

module.exports = router;
