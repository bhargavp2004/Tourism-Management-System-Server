const mongoose = require('mongoose');
const schema = mongoose.Schema;

const travellerSchema = new schema({
    type: String,
    name : String,
    age : Number,
    gender : String,
})