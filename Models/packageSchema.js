const mongoose = require('mongoose');
const schema = mongoose.Schema;
const placeSchema = require('./placeSchema');
const Place = mongoose.model('Place', placeSchema);
const guideSchema = require('./guideSchema');
const Guide = mongoose.model('Guide', guideSchema);
const commentSchema = require('./commentSchema');
const Comment = mongoose.model('Comment', commentSchema);

const packageSchema = new schema({
   package_name: String,
   package_overview: String,
   package_days : Number,
   package_price: Number,
   package_capacity : Number,
   package_place : [{
      type: mongoose.Schema.Types.ObjectId,
        ref: 'Place',
   }],
   package_guide:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide',
   },
   package_comment:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
   }]    
});


module.exports = packageSchema;
