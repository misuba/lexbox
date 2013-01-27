
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore');

var app = express();

// read in the config
var LConf = JSON.parse(fs.readFileSync("./config.json"));

// express on its own is pretty bare-bones
// so the next superficially forbidding section is all about making it do basic webby things
// the cookie parser secret should be changed for every install in config.json
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  
  app.set("view engine", "jade");
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

/*
// this will be what to use once I find a good async lib
var finishout = function(req, res, err, tmpl, goods) {
  if (req.xhr) res.send(err ? {err: err} : ._extend({ok: 'ok'}, goods);
  else {
    res.render(tmpl, _.extend(goods, {err: err, _: _}));
  }
}
*/

var texts_ctrl = require('./controllers/texts_ctrl').control({LBox: LBox, LText: LText}),
    boxes_ctrl = require('./controllers/boxes_ctrl').control({LBox: LBox, LText: LText}),
    utils = require('./utils');

app.get('/', boxes_ctrl.index);

/* sadly the server-side version of this has to do a bunch of pulling apart the request
to find out what's _really_ being asked of us. the ajaxy actions will be much more ReSTful. */
app.post("/boxes", function(req, res) {
  var dels = _.filter(_.keys(req.body), function(key){ return key.indexOf("del_")===0; });
  
  if (dels.length) {
    texts_ctrl.remove(req, res, dels);
  }
  else if (req.body.dobox) {
    boxes_ctrl.fetch(req, res, boxes_ctrl.create);
  }
  else if (req.body.unbox) {
    boxes_ctrl.fetch(req, res, boxes_ctrl.unbox);
  }
  else res.send(500);
});

app.get("/history", function(req,res) {
  LEvent.getHistory(function(histerr, evts) {
    res.send(histerr ? {err: histerr} : {ok: "ok", history: evts});
  });
})

app.get('/texts/new', function(req, res) {
  res.render('text', {err: null, newtext: true, text: { title: '', body: '', tags: [], box: null }, _: _});
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

/* and if it isn't any of the above, it's a text */
app.get('/:slug', function(req, res) {
  texts_ctrl.fetch(req, res, texts_ctrl.show);
});

app.post('/:slug', function(req, res) {
  texts_ctrl.fetch(req, res, texts_ctrl.edit);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Lexbox live on port " + app.get('port'));
});
