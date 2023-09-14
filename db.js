const mongoose = require('mongoose');

function connectToMongo() {
  try {
    mongoose.connect("mongodb+srv://vrinxsystem:rajat-123@cluster0.zkbwolf.mongodb.net/eventlabs", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = connectToMongo;
