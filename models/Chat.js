const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderNumber: {
      type: Number,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["public", "private"],
    },
    description: {
      type: String,
      required: true,
    },
    image:{
      data:Buffer,
      contentType:String
    },
    address: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    seeking: {
      type: [String],
      default: [],
    },
    participants: [
      {
        type: String,
      },
    ],
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
    messages: [messageSchema],
  },
  { timestamps: true }
);

chatSchema.index({ location: "2dsphere" });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
