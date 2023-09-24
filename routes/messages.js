const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

router.get('/room/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await Chat.findById(roomId);

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const messages = chatRoom.messages;

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching chat room messages:', error);
    res.status(500).json({ error: 'Error fetching chat room messages' });
  }
});

module.exports = router;
