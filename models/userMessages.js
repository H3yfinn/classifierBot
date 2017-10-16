var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserMessageSchema = new Schema({
  user_id: String,
  timestamp: Number,
  message_id:String,
  text: String
});

module.exports = mongoose.model("UserMessage", UserMessageSchema, 'userMessage');
