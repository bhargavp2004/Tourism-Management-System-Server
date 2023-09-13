const mongoose = require('mongoose');
const schema = mongoose.Schema;
const userSchema = require('./userSchema');
const User = mongoose.model('User', userSchema);

const commentSchema = new schema({
   comment_desc : String,
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
   },

});


module.exports = commentSchema;
