const mongoose = require('mongoose');
const schema = mongoose.Schema;
const packageSchema = require('./packageSchema');
const ps = mongoose.model('Package', packageSchema);


const packageDateSchema = new schema({
   package_id : {
    type : mongoose.Schema.ObjectId,
    ref : 'Package'
   },
   start_date : Date,
   end_date : Date,
});


module.exports = packageDateSchema;
