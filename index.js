const connectToMongo = require("./db");
const express = require("express");
const http = require("http");
const cors = require("cors");
const Chat = require("./models/Chat");
const User = require("./models/User");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const TOKEN_SECRET = "enclave";

const PORT = process.env.PORT || 5000;

connectToMongo();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/requirements", require("./routes/requirements"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/user", require("./routes/user"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://eventlabs-frontend.vercel.app",
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`user id : ${socket.id} join room id : ${roomId}`);
  });

  socket.on("message", async ({ roomId, newMessage, token }) => {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    const userId = decoded._id;
    const user = await User.findById(userId);
    let senderName = user.firstName;
    let senderNumber = user.phoneNumber;
    let content = newMessage;
    let sender = userId;
    let time = "";
    let image = user.image;

    const messageObj = {
      senderName: senderName,
      senderNumber: senderNumber,
      sender: sender,
      content: content,
      image: image,
    };

    Chat.findById(roomId)
      .then((chatRoom) => {
        if (!chatRoom) {
          console.log("Chat room not found");
          return;
        }

        chatRoom.messages.push(messageObj);

        chatRoom
          .save()
          .then(() => {
            console.log("Message added to chat room:", newMessage);
            const lastMessage = chatRoom.messages[chatRoom.messages.length - 1];
            time = lastMessage.createdAt;

            io.to(roomId).emit("sendMessage", {
              sender,
              senderName,
              senderNumber,
              content,
              createdAt: time,
              image,
            });
          })
          .catch((error) => {
            console.error("Error saving chat room:", error);
          });
      })
      .catch((error) => {
        console.error("Error finding chat room:", error);
      });
  });

  socket.on(
    "notify",
    async ({
      location,
      title,
      eventName,
      radius,
      selectedInterests,
      eventId,
      reqId,
    }) => {
      console.log("title : ", title);

      try {
        const eventLocation = {
          type: "Point",
          coordinates: [Number(location.longitude), Number(location.latitude)],
        };

        const nearbyUsers = await User.aggregate([
          {
            $geoNear: {
              near: eventLocation,
              distanceField: "distance",
              spherical: true,
              maxDistance: Number(radius) * 1000,
            },
          },
          {
            $match: {
              interests: {
                $in: selectedInterests,
              },
            },
          },
        ]);

        for (var i = 0; i < nearbyUsers.length; i++) {
          const notificationObject = {
            id: eventId,
            title: title,
            eventName: eventName,
            reqId: reqId,
          };

          await User.updateOne(
            { _id: nearbyUsers[i]._id },
            { $push: { notifications: notificationObject } }
          );
        }
      } catch (error) {
        console.error("Error in aggregation:", error);
      }
    }
  );
});

server.listen(PORT, () => {
  console.log(
    `Eventlabs' Backend is running at Port - http://localhost:${PORT}`
  );
});
