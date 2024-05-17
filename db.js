const mongoose = require('mongoose');
require('dotenv').config();

function connectToMongo() {
  try {
    mongoose.connect(process.env.MONGOURI, {
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
