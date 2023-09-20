const mongoose = require('mongoose');
const schema = mongoose.Schema;
const placeSchema = require("../Models/placeSchema");
const Place = mongoose.model("Place", placeSchema);
const packageSchema = require("../Models/packageSchema");
const Package = mongoose.model("Package", packageSchema);

const activitySchema = new schema({
   day : Number,
   pack_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
   },
   place_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
   },

});


module.exports = activitySchema;
