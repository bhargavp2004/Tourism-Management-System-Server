const mongoose = require('mongoose');
const schema = mongoose.Schema;


const places = new schema({
   place_name: String,
   place_desc: String,
   title: { type: String, required: true },
   image: { 
      data: Buffer,
      contentType: String
    },
});


module.exports = places;
