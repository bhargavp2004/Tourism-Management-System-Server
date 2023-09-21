const mongoose = require('mongoose');
const schema = mongoose.Schema;
const userSchema = require('./userSchema');
const User = mongoose.model('User', userSchema);
const packageDateSchema = require('./packageDates');
const PackageDateSchema = mongoose.model('PackageDateSchema', packageDateSchema);

const bookingSchema = new schema({
   book_date: Date,
   book_adult: Number,
   book_child: Number,
   book_cost: Number,
   current_no_of_bookings : Number,
   book_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
   },
   book_pack:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageDateSchema',
   }
   
});


module.exports = bookingSchema;
