/*var mongoose = require('mongoose'),
    dbURI = "mongodb://localhost/lexbox-test",
    db = mongoose.connect(dbURI),
    LBox = db.model('LBox', require('../models/boxes').schema);

beforeEach(function(nxt) {
  if (mongoose.connection.db) return nxt();
  mongoose.connect(dbURI, nxt);
});




function done (err) {
  if (err) console.error(err.stack);
  mongoose.connection.db.dropDatabase(function () {
    mongoose.connection.close();
  });
} */