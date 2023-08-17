const mongoose = require('mongoose');
const schema = mongoose.Schema;


const adminSchema = new schema({
   firstname : String,
   lastname : String,
   email : String,
   username : String,
   password : String,
   mobilenumber : String
});

module.exports = adminSchema;