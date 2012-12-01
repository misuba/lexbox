exports.control = function(models) {
  var LBox = models.LBox,
      LText = models.LText,
      _ = require('underscore'),
      utils = require('../utils'),
      errout = utils.errout,
      endHappily = utils.endHappily;

  return {
    fetch: function(req, res, callback) {
      console.log("fetched");
      LText.findOne({slug: req.params.slug}, function(err, text) {
        if (err) res.send(500);
        else if (text == null) res.send(404);
        else callback(req, res, text);
      });
    },

    show: function(req, res, text) {
      res.render('text', {err: null, newtext: false, text: text, _: _});
    },

    edit: function(req, res, text) {
      
      text.title = req.body.title;
      text.body = req.body.body;
      text.tags = req.body.tags || [];
      text.save(function(err, text) {
        console.log(utils);
        if (err) errout(req, res, err, "text", {text: text});
        else {
          utils.endHappily(req, res, '/');
        }
      });
    },

    remove: function(req, res, dels) {
      console.log(dels);
      var unhiddenCt = dels.length;
      _(dels).each(function(delkey) {
        var myId = delkey.match(/del_(.*)/)[1];
        LText.update({_id: myId}, { $set: { alive: false } }, function(err) {
          if (--unhiddenCt <= 0) endHappily(req, res, '/');
        });
      });
    }
  };
};