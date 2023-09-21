const mongoose = require('mongoose');
const schema = mongoose.Schema;

const travellerSchema = new schema({
    name : String,
    age : Number,
    gender : String,
})