exports.control = function(models) {
  var LBox = models.LBox,
      _ = require('underscore'),
      errout = require('../utils').errout,
      endComplaining = require('../utils').endComplaining,
      endHappily = require('../utils').endHappily;

  return {
    index: function(req, res) {
      LBox.find({alive: true}).populate("children").exec(function(err, texts) {
        if (err) errout(req, res, err, 'index', texts);
        console.log("texts === ", texts);
        res.render('index', {err: err, boxes: texts, _: _});
      });
    },

    fetch: function(req, res, callback) {
      LText.find().where('_id').in(req.body.box.texts).exec(function(err, texts) {
        if (err) res.send(500);
        else callback(req, res, texts);
      });
    },

    create: function(req, res, texts) {
      var unhandledTextCt = texts.length;
      LBox.findOneAndUpdate(
          {name: req.body.name}, 
          {name: req.body.name, createdDate: new Date()}, 
          {upsert: true}, 
          function(saverr, nubox) {
        if (saverr) endComplaining(req, res, '/', saverr);
        else {
          _(texts).each(function(txt) {
            txt.box = nubox;
            if (req.body.tag) txt.addTag(req.body.name);
            txt.save(function(tsaverr, txt) {
              if (tsaverr) endComplaining(req, res, '/', tsaverr);
              else {
                if (--unhandledTextCt <= 0) endHappily(req, res, '/'); // fake async, woooo!!! *sigh*
              }
            });
          });
        }
      });
    },

    unbox: function(req, res, texts) {
      var unhandledTextCt = texts.length;
      _(texts).each(function(txt) {
        LText.update({ _id: txt._id }, { $set: { box: null }}).exec();
        if (--unhandledTextCt <= 0) endHappily(req, res, '/');
      });
    }
  };

};