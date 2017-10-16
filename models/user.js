var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  user_id: {type: String, required: true, unique: true},
  lends: [{lendId: {type: String, unique: true}, //make this the message.mid (message id)
          created_at: Date,
          name: String,
          amount: Number,
          reason: String }],
  borrows: [{borrowId: {type: String, unique: true}, //make this the message.mid (message id)
            created_at: Date,
            name: String,
            amount: Number,
            reason: String }],//not sure if array methoid is right eiuthetr
});

module.exports = mongoose.model("User", UserSchema, 'user');
