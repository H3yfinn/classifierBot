var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var NumberSchema = new Schema({
  image: Number,
  status: String,//being classified, classified or not classified
  classification: Boolean,
  timestamp: Number,
  user_id: String //the id of the user who classified this image
});
//when creating new entries we need to make sure image and status are set with values
module.exports = mongoose.model("Numbers", NumberSchema, 'number');
