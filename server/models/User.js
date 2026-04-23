const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  profession: {
    type: String,
    required: true, 
  },
  usagePurpose: {
    type: String,
    required: true,
  },
  companyOrSchool: {
    type: String,
  },
  savedRooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
