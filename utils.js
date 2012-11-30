var querystring = require('querystring'),
    _ = require('underscore');

module.exports = {
  errout: function(req, res, err, tmpl, goods) {
    if (req.xhr) res.send({err: err});
    else {
      res.render(tmpl, _.extend(goods, {err: err, _: _}));
    }
  },
  endHappily: function(req, res, dest) {
    if (req.xhr) res.send("ok");
    else res.redirect(dest);
  },
  endComplaining: function(req, res, dest, err) {
    if (req.xhr) res.send({err: err});
    else res.redirect(dest + "?err=" + encodeURIComponent(querystring.stringify(err)));
  }
};