exports.control = function(models) {
  var LBox = models.LBox,
      _ = require('underscore');

  function finish(res, err, tmpl, goods) {
    res.render(tmpl, _.extend(goods, {err: err}));
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
      LBox.create({
        name: req.body.name,
        summary: req.body.summary,
        body: req.body.body,
        tags: req.body.tags || []
      }, function(err, box) {
        console.log(box);
        finishBoxToRoot(res, err, box);
      });
    },

    update: function(req, res) {
      console.log(req.params);
      LBox.findOne({slug: req.params.slug}, function(err, box) {
        box.name = req.body.name;
        box.summary = req.body.summary;
        box.body = req.body.body;
        box.tags = req.body.tags || [];
        box.save(function(saverr, savedbox) {
          res.redirect("/");
        });
      });
    },

    remove: function(req, res, id) {
      LBox.findOne({_id: id}, function(err, box) {
        box.alive = false;
        box.save(function(saverr, savedbox) {
          res.redirect("/");
        });
      });
    },

    tag: function(req, res) {
      LBox.find({_id: { $in: req.body.boxids }}, function(err, boxes) {
        if (err) res.redirect('/');
        else {
          var box,
              saveCt = 0,
              boxsavehandler = function(serr) {
                if (!serr) {
                  if (++saveCt == boxes.length) res.redirect('/');
                }
              };
          for (var r = boxes.length; r > 0; r--) {
            box = boxes[r - 1];
            box.addTag(req.body.tagname);
            box.save(boxsavehandler);
          }
        }
      });
    }

  };

};