var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ImageSchema = new Schema({
  image_url: String,
  status: String,//being classified, classified or not classified
  classification: Boolean,
  timestamp: Number,
  user_id: String, //the id of the user who classified this image
  //class: String //the class of the image if we knew it before we uploaded the image to db
});
//when creating new entries we need to make sure image and status are set with values
module.exports = mongoose.model("Images", ImageSchema, 'Images');
