const mongoose = require('mongoose');
const schema = mongoose.Schema;


const guideSchema = new schema({
   firstname : String,
   lastname : String,
   email : String,
   username : String,
   password : String,
   mobilenumber : String
});


module.exports = guideSchema;
