const mongoose = require('mongoose');
const schema = mongoose.Schema;
const userSchema = require('./userSchema');
const User = mongoose.model('User', userSchema);
const packageSchema = require('./packageSchema');
const Package = mongoose.model('Package', packageSchema);

const bookingSchema = new schema({
   book_date: Date,
   book_adult: Number,
   book_child: Number,
   book_cost: Number,
   book_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
   },
   book_pack:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
   } 
});


module.exports = bookingSchema;