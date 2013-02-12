
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
  app.use(express.errorHandler());
  app.use(require('node-sass').middleware({src: __dirname, dest: __dirname + '/public', debug: true}));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.locals._ = _;

// require models
var mongoose = require('mongoose'),
    db = mongoose.connect(LConf.MONGO_URL),
    LBox = db.model('LBox', require('./models/boxes').schema);

var boxes_ctrl = require('./controllers/boxes_ctrl').control({LBox: LBox}),
    utils = require('./utils');

app.get('/', boxes_ctrl.index);
app.post('/', boxes_ctrl.index);

app.get('/boxes/new', boxes_ctrl.newbox);
app.post('/boxes/', boxes_ctrl.create);

app.get('/:slug', boxes_ctrl.show);
app.put('/:slug', boxes_ctrl.update);
//app.delete('/:slug', boxes_ctrl.remove);

app.post('/boxes/manage', function(req, res) {
  var dels = _.filter(_.keys(req.body), function(key){
    return key.indexOf("del_")===0;
  });
  
  if (dels.length) {
    var del = dels[0].match(/del_(.+)/)[1];
    boxes_ctrl.remove(req, res, del);
  }
  else if (req.body.dotags == 'Do it') {
    boxes_ctrl.tag(req, res);
  }
});

app.get('/:slug/tags/:tagid/remove', boxes_ctrl.removetag);

/*
app.get("/history", function(req,res) {
  LEvent.getHistory(function(histerr, evts) {
    res.send(histerr ? {err: histerr} : {ok: "ok", history: evts});
  });
});
*/

http.createServer(app).listen(app.get('port'), function(){
  console.log("Lexbox live on port " + app.get('port'));
});
