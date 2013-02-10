exports.control = function(models) {
  var LBox = models.LBox,
      _ = require('underscore');

  function finish(res, err, tmpl, goods) {
    res.render(tmpl, _.extend(goods, {err: err, _: _}));
  }

  function finishBoxToRoot(res, err, box) {
    if (err) finish(res, err, "text", {text: box});
    else res.redirect('/');
  }

  return {
    index: function(req, res) {
      LBox.findLiving(function(err, texts) { //.populate("children")
        //if (err) errout(req, res, err, 'index', texts);
        console.log("texts ===", texts);
        finish(res, err, 'index', {boxes: texts});
      });
    },

    show: function(req, res) {
      LBox.findOne({slug: req.params.slug}, function(err, box) {
        if (err) res.send(500);
        else if (box === null) res.send(404);
        else finish(res, err, 'text', {text: box});
      });
    },

    newbox: function(req, res) {
      finish(res, null, 'text', {text: { name: '', body: '', tags: [], children: [] } });
    },

    create: function(req, res, callback) {
      var nuu = new LBox({
        name: req.body.name,
        summary: req.body.summary,
        body: req.body.body,
        tags: req.body.tags || []
      });
      nuu.save(function(err, box) {
        finishBoxToRoot(res, err, box);
      });
    },

    update: function(req, res) {
      LBox.update({_id: req.body.id}, { $set: {
        name: req.body.name, summary: req.body.summary, body: req.body.body, tags: req.body.tags || []
      } }, function(err, box) {
        finishBoxToRoot(res, err, box);
      });
    },

    remove: function(req, res, box) {
      LBox.update({_id: box.id}, { $set: { alive: false } }, function(err, box) {
        finishBoxToRoot(res, err, box);
      });
    },

    unbox: function(req, res, box) {
      var unhandledTextCt = texts.length;
      _(texts).each(function(txt) {
        LBox.update({ _id: txt._id }, { $set: { box: null }}).exec();
        if (--unhandledTextCt <= 0) endHappily(req, res, '/');
      });
    }
  };

};