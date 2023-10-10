const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  image:{
    data:Buffer,
    contentType:String
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  interests: [{ type: String }], 
  notifications: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
      eventName: { type: String },
      eventAddress: {type: String}
    }
  ],
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      type: [Number], 
      default: [0, 0], 
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries (if using geolocation)
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;