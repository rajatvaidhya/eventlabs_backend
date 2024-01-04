const mongoose = require("mongoose");

const RequirementSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  requirementTitle: String,
  freeCancellation : Boolean,
  startDay: String,
  endDay: String, 
  startTiming : String,
  endTiming : String,
  price : Number,
});

const Requirement = mongoose.model("Requirement", RequirementSchema);
module.exports = Requirement;
