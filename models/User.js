const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  image:{
    type:String
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
  location: {
    type: {
      type: String,
      enum: ['Point'], // GeoJSON point type
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0], // Default location coordinates
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