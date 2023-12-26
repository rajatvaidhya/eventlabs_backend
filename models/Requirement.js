const mongoose = require("mongoose");

const RequirementSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  requirementTitle: String,
  requirementNumber: Number,
  requirementDistance: Number,
  seeking: {
    type: [String],
    default: [],
  },
  appliedBy:[{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
});

const Requirement = mongoose.model("Requirement", RequirementSchema);
module.exports = Requirement;
