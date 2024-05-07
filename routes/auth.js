const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TOKEN_SECRET = "enclave";
const formidable = require("formidable");
const nodemailer = require("nodemailer");
const fs = require("fs");
let BackendOTP = "";

router.post("/send-otp", async (req, res) => {
  BackendOTP = Math.floor(100000 + Math.random() * 900000).toString();

  const userExistsWithEmail = await User.findOne({ email: req.body.email });

  if (userExistsWithEmail) {
    return res.json({ message: "Email already exists" });
  }

  const userExistsWithPhone = await User.findOne({ phoneNumber: req.body.phoneNumber });

  if (userExistsWithPhone) {
    return res.json({ message: "Phone number already exists" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "rajatvaidhya@gmail.com",
      pass: "oelx dgsr sxyj dxaw",
    },
  });

  async function main() {
    const info = await transporter.sendMail({
      from: '"Eventlabs" <eventlabs@gmail.com>',
      to: `${req.body.email}`,
      subject: "Your Eventlabs Verification Code",
      text: `Your OTP is ${BackendOTP}`,
    });

    res.json({success:true});
  }

  main().catch(console.error);
});

router.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      interests,
      location,
      FrontendOTP
    } = req.body;

    const frontendOTPString = FrontendOTP.join('');

    if (!FrontendOTP || FrontendOTP.length !== 6 || Number(frontendOTPString) != BackendOTP) {
      res.json({message:'Enter valid OTP'})
      return;
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

    res.json({
      success: true,
      authtoken,
      userId: user._id,
      firstName: user.firstName,
    });
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

    res.json({
      success: true,
      authtoken,
      userId: user._id,
      firstName: user.firstName,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/interest-selection", async (req, res) => {
  try {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      const { interests, userId, description } = fields;
      const user = await User.findById(userId?.[0]);

      user.interests = interests[0]?.split(",");
      user.description = description?.[0];

      if (files?.image?.[0]) {
        user.image.data = fs.readFileSync(files.image?.[0].filepath);
        user.image.contentType = files.image?.[0].mimetype;
      }

      await user.save();
      res.status(200).json({ msg: "OK" });
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/photo/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (user) {
      res.set("Content-Type", user.image.contentType);
      res.send(user.image.data);
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
