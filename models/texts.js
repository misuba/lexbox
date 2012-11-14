var _ = require('underscore'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// thank you, http://dense13.com/blog/2009/05/03/converting-string-to-slug-javascript/
// and taranttini on SO. hooray.
var slugify = function(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
  var to   = "aaaaaeeeeeiiiiooooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
};

var text_s = Schema({
  title: { type: String, required: true },
  slug: String,
  body: { type: String, required: true },
  summary: String,
  tags: [{name: String}],
  box: Schema.Types.ObjectId,
  alive: { type: Boolean, default: true }
});

text_s.path('tags').set(function(towhat) {
  if (typeof towhat.push == 'function' && typeof towhat[0] == 'string') {
    return _(towhat).map(function(str) { return {name: str}; });
  }
  if (typeof towhat == 'string') {
    return [{name: towhat.replace(/^\s+|\s+$/g, '')}];
  }
  return towhat;
});

text_s.pre('save', function (next) {
  this.summary = this.body.substr(0,50);
  this.slug = slugify(this.title);
  next();
});

text_s.methods.hasTag = function(name) {
  return _(this.tags).map(function(tg) { return tg.name; }).indexOf(name) != -1;
};
text_s.methods.addTag = function(name) {
  if (!this.hasTag(name)) {
    this.tags.push({name: name.replace(/^\s+|\s+$/g, '')});
  }
};
text_s.methods.removeTag = function(which) {
  if (this.hasTag(which)) {
    var names = _(this.tags).map(function(tg) { return tg.name; });
    delete this.tags[names.indexOf(which)];    
  }
};

exports.schema = text_s;
