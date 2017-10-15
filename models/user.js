var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  user_id: {type: String, required: true, unique: true},
  lends: [{lendId: Schema.Types.ObjectId, //not sure if this is right
          created_at: Date,
          name: String,
          amount: Number,
          reason: String }],
  borrows: [{borrowId: Schema.Types.ObjectId,
            created_at: Date,
            name: String,
            amount: Number,
            reason: String }],//not sure if array methoid is right eiuthetr
});

module.exports = mongoose.model("User", UserSchema);
