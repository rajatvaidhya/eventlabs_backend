const express = require("express");
const router = express.Router();
const Requirement = require("../models/Requirement");
const User = require("../models/User");

router.post("/createRequirement", async (req, res) => {
  const { eventId, title, radius, selectedInterests, numberOfPosts, location } =
    req.body;

  const requirement = await Requirement.create({
    eventId: eventId,
    requirementTitle: title,
    requirementNumber: numberOfPosts,
    requirementDistance: radius,
    seeking: selectedInterests,
    location: {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
    },
  });

  await requirement.save();
  res.send({ msg: "Requirement added successfully", reqId: requirement._id });
});

router.get("/fetchRequirements/:eventId", async (req, res) => {
  const { eventId } = req.params;
  const requirements = await Requirement.find({ eventId: eventId });

  res.send(requirements);
});

router.delete("/deleteRequirement/:id", async (req, res) => {
  const { id } = req.params;
  await Requirement.findByIdAndDelete({ _id: id });

  const users = await User.find({ "notifications.reqId": id });

  for (const user of users) {
    user.notifications = user.notifications.filter(
      (notification) => notification.reqId.toString() !== id
    );
    await user.save();
  }

  res.send({ msg: "Requirement deleted successfully" });
});

router.post("/applyRequirement", async (req, res) => {
  const { requirementId, userId } = req.body;

  const requirement = await Requirement.findById(requirementId);

  requirement.appliedBy.push(userId);
  await requirement.save();
  res.send({ msg: "Applied Successfully" });
});

router.get("/fetchRequirementUsers/:requirementId", async (req, res) => {
  const { requirementId } = req.params;

  const requirement = await Requirement.findById(requirementId);

  const users = [];

  for (var i = 0; i < requirement.appliedBy.length; i++) {
    const user = await User.findById(requirement.appliedBy[i]);
    users.push(user);
  }


  res.send(users);
});
module.exports = router;
