const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: String,
  image: Buffer, // Store the image data as a Buffer
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;