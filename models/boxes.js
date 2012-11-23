var _ = require('underscore'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var box_s = Schema({
  name: { type: String, required: true },
  createdDate: { type: Date, default: Date.now }
});

exports.schema = box_s;