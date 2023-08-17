const mongoose = require('mongoose');
const schema = mongoose.Schema;
const placeSchema = require('./placeSchema');
const Place = mongoose.model('Place', placeSchema);

const packageSchema = new schema({
   package_name: String,
   package_overview: String,
   package_days : Number,
   package_price: Number,
   package_place : [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
   }]
});
module.exports = packageSchema;