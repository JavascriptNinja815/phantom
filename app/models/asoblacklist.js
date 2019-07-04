var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var asoBlacklistSchema = new mongoose.Schema({
  aso: String,
  description: String,
});
asoBlacklistSchema.plugin(mongoosePaginate);

mongoose.model('AsoBlacklist', asoBlacklistSchema);