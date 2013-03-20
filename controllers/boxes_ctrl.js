exports.control = function(models) {
  var LBox = models.LBox,
      _ = require('underscore');

  function finish(res, err, tmpl, goods) {
    if (tmpl === null) tmpl = 'index';
    if (goods === null) goods = {};
    res.render(tmpl, _.extend(goods, {err: err}));
  }

  function finishBoxToRoot(res, err, box) {
    if (err) finish(res, err, 'text', {text: box});
    else res.redirect('/');
  }

  function eachSelected(res, boxes, todo){
    var box,
        boxsavehandler = _.after(boxes.length, function(){res.redirect('/');});

    for (var r = boxes.length; r > 0; r--) {
      box = boxes[r - 1];
      todo.call(box);
      box.save(boxsavehandler);
    }
  }

  return {

    withSelected: function(req, res, next) {
      LBox.find({_id: { $in: req.body.boxids }}, function(err, boxes) {
        if (err) res.redirect('/');
        else next(req, res, boxes);
      });
    },

    index: function(req, res) {
      LBox.findRoots(function(err, texts) {
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

    tag: function(req, res, boxes) {
      eachSelected(res, boxes, function(){
        this.addTag(req.body.tagname);
      });
    },

    color: function(req, res, boxes) {
      eachSelected(res, boxes, function(){
        this.set('color', req.body.boxcolor);
      });
    },

    move: function(req, res, boxes) {
      console.log('boxctrl move',req.body);
      LBox.findById(req.body.parentbox, function(err, parentbox) {
        if (!err) {
          var finisher = _.after(boxes.length, function(){ res.redirect('/'); });
          _.each(boxes, function(box) { box.moveTo(parentbox, finisher); });
        }
        else {
          console.log("move err", err);
          res.redirect('/');
        }
      });
    },

    removetag: function(req, res) {
      LBox.findOne({slug: req.params.slug}, function(err, box) {
        var tagname = box.tags[parseInt(req.params.tagid, 10)].name;
        box.removeTag(tagname);
        box.save(function(serr) {
          finish(res, serr, 'text', {text: box});
        });
      });
    }

  };

};