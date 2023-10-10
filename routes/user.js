const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/fetchNotifications", async(req,res)=>{
    const userId = req.body.userId;
    const user = await User.findById(userId);
    res.status(200).json({notifications:user.notifications});
})

module.exports = router;
