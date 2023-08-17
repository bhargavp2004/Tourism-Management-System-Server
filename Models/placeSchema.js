const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  place_name: { type: String, required: true },
  place_desc: { type: String, required: true },
  title: { type: String, required: true },
  image: { 
    data: Buffer,
    contentType: String
  },
});

module.exports = placeSchema;
