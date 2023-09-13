const mongoose = require('mongoose');
const schema = mongoose.Schema;
const userSchema = require('./userSchema');
const User = mongoose.model('User', userSchema);
const bookingSchema = require('./bookingSchema');
const Booking = mongoose.model('Booking', bookingSchema);

const announcementSchema = new schema({
   announcement_desc : String,
   Booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
   }

});


module.exports = announcementSchema;
