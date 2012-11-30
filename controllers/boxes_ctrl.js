exports.control = function(models) {
  var LBox = models.LBox,
      LText = models.LText,
      _ = require('underscore'),
      errout = require('../utils').errout,
      endComplaining = require('../utils').endComplaining,
      endHappily = require('../utils').endHappily;

  return {
    index: function(req, res) {
      LText.find({alive: true}).populate("box").exec(function(err, texts) {
        if (err) errout(req, res, err, 'index', texts);
        var boxen = _(texts).groupBy("box"),
            boxtest = function(box, boxkey) {
              return boxkey == 'undefined' || boxkey == 'null';
            };
        var boxes = _.reject(boxen, boxtest);
        var unboxed = _.flatten(_.values(_.filter(boxen, boxtest)));
        res.render('index', {err: err, boxes: boxes, unboxed: unboxed, _: _});
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