var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var UserSchema = new Schema({
  user_id: String,
  pending_image: String,//users current image to be classified
  last_image: String,//id of last image classified by user. either an image or 'redone'
  last_message_to: String,//last_message_to is the message from us. (score, picture)
  last_message_from: String,//last message from is the message to us(classification, next image, resend, score)
  score: Number
});

module.exports = mongoose.model("Users", UserSchema, 'user');
