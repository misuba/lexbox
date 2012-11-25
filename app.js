
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore')
  , cons = require('consolidate');

var app = express();

// read in the config
var LConf = JSON.parse(fs.readFileSync("./config.json"));

// express on its own is pretty bare-bones
// so the next superficially forbidding section is all about making it do basic webby things
// the cookie parser secret should be changed for every install above.
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  
  app.engine('ejs', cons.ejs);
  app.set("view engine", "ejs");
  app.set('views', __dirname + '/views');
  
  app.set("mongo_url", LConf.MONGO_URL);

  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(LConf.COOKIE_SECRET));
  app.use(express.session());
  
  app.use(require('node-sass').middleware({src: __dirname, dest: __dirname + '/public', debug: true}));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// require models
var mongoose = require('mongoose'),
    db = mongoose.connect(LConf.MONGO_URL),
    LBox = db.model('LBox', require('./models/boxes').schema),
    LText = db.model('LText', require('./models/texts').schema);

var errout = function(req, res, err, tmpl, goods) {
  if (req.xhr) res.send({err: err});
  else {
    res.render(tmpl, _.extend(goods, {err: err, _: _}));
  }
};
var endHappily = function(req, res, dest) {
  if (req.xhr) res.send("ok");
  else res.redirect(dest);
};
var endComplaining = function(req, res, dest, err) {
  if (req.xhr) res.send({err: err});
  else res.redirect(dest + "?err=" + encodeURIComponent(err));
}

/*
// this will be what to use once I find a good async lib
var finishout = function(req, res, err, tmpl, goods) {
  if (req.xhr) res.send(err ? {err: err} : ._extend({ok: 'ok'}, goods);
  else {
    res.render(tmpl, _.extend(goods, {err: err, _: _}));
  }
}
*/

app.get('/', function(req, res) {
  LText.find().populate("box").exec(function(err, texts) {
    if (err) errout(req, res, err, 'index', texts);
    var boxen = _(texts).groupBy("box"),
        boxtest = function(box, boxkey) {
          return boxkey == 'undefined' || boxkey == 'null';
        };
    var boxes = _.reject(boxen, boxtest);
    var unboxed = _.flatten(_.values(_.filter(boxen, boxtest)));
    res.render('index', {err: err, boxes: boxes, unboxed: unboxed, _: _});
  });
});

app.get('/:slug', function(req, res) {
  LText.findOne({slug: req.params.slug}, function(err, text) {
    res.render('text', {err: err, text: text, _: _});
  });
});

app.post('/:slug', function(req, res) {
  LText.findOne({_id: req.body.id}, function(err1, text) {
    console.log("find cb");
    if (err1) errout(req, res, err1, "text", {text: text});
    else {
      text.title = req.body.title;
      text.body = req.body.body;
      text.tags = req.body.tags || [];
      text.save(function(err2, text) {
        console.log("save cb");
        if (err2) errout(req, res, err2, "text", {text: text});
        else {
          endHappily(req, res, '/');
        }
      });
    }
  });
});

app.post("/boxes/new", function(req, res) {
  console.log(req.body);
  //res.send("m");
  LText.find().where('_id').in(req.body.box.texts).exec(function(finderr, texts) {
    if (finderr) endComplaining(req, res, '/', finderr);
    else {
      var unhandledTextCt = texts.length;
      if (unhandledTextCt > 0) {
        if (req.body.dobox == "Do it") {
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
        }
        else if (req.body.unbox == "Unbox selected") {
          _(texts).each(function(txt) {
            LText.update({ _id: txt._id }, { $set: { box: null }}).exec();
            if (--unhandledTextCt <= 0) endHappily(req, res, '/');
          });
        }
      }
    }
  });
});

app.get("/history", function(req,res) {
  LEvent.getHistory(function(histerr, evts) {
    res.send(histerr ? {err: histerr} : {ok: "ok", history: evts});
  });
})

app.get('/texts/new', function(req, res) {
  res.render('text', {err: null, text: { title: '', body: '', tags: [], box: null }, _: _});
});

app.post('/texts/new', function(req, res) {
  var thething = new LText(req.body);
  thething.save(function(err) {
    if (err) {
      res.render('text', {err: err, text: req.body, _: _});
    }
    else {
      res.redirect("/");
    }
  });
  
});

http.createServer(app).listen(app.get('port'), function(){

  console.log("Lexbox live on port " + app.get('port'));
});
