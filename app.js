
/**
 * Module dependencies.
 */

var MONGO_URL = "mongodb://localhost/lexbox-local";

var express = require('express')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore');

var app = express();

// express on its own is pretty bare-bones
// so the next superficially forbidding section is all about making it do basic webby things
// the cookie parser secret should be changed for every install, though.
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', { layout: 'layout' });
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('calamity is all fireworks reset'));
  app.use(express.session());
  //app.use(app.router);
  app.use(require('node-sass').middleware({src: __dirname, dest: __dirname + '/public', debug: true}));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// require models
var mongoose = require('mongoose'),
    db = mongoose.connect(MONGO_URL),
    LText = db.model('LText', require('models/texts').schema);

var errout = function(req, res, err, tmpl, goods) {
  if (req.xhr) res.send({err: err});
  else {
    res.render(tmpl, Object.extend(goods, {err: err, _: _}));
  }
};

app.get('/', function(req, res) {
  LText.find(function(err, texts) {
    res.render('index', {err: err, texts: texts, _: _});
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
          if (req.xhr) res.send("ok");
          else res.redirect("/");
        }
      });
    }
  });
});

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
