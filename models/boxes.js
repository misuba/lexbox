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

// now down to business
var BoxSchema = new Schema();
BoxSchema.add({
  name: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },

  slug: String,
  body: String,
  summary: String,
  tags: [{name: String}],

  alive: { type: Boolean, default: true },
  hideChildren: { type: Boolean, default: false },

  children: [{ type: Schema.Types.ObjectId, ref: 'LBox' }]
});


BoxSchema.path('tags').set(function(towhat) {
  var tagstraightener = /^\s+|\s+$/g;
  if (typeof towhat.push == 'function' && typeof towhat[0] == 'string') {
    return _(towhat).map(function(str) { return {name: str.replace(tagstraightener, '')}; });
  }
  if (typeof towhat == 'string') {
    return [{name: towhat.replace(tagstraightener, '')}];
  }
  return towhat;
});

BoxSchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

BoxSchema.virtual('displaySummary').get(function(){
  if (!this.summary) {
    return this.body;
  }
  return this.summary;
});

BoxSchema.methods.hasTag = function(name) {
  return _(this.tags).map(function(tg) { return tg.name; }).indexOf(name) != -1;
};
BoxSchema.methods.addTag = function(name) {
  if (!this.hasTag(name)) {
    this.tags.push({name: name.replace(/^\s+|\s+$/g, '')});
  }
};
BoxSchema.methods.removeTag = function(which) {
  if (this.hasTag(which)) {
    var names = _(this.tags).map(function(tg) { return tg.name; });
    delete this.tags[names.indexOf(which)];
  }
};

BoxSchema.methods.getParent = function(callback){
  this.constructor.findOne({children: this._id}, callback);
};
BoxSchema.methods.getChild = function(index, callback){
  console.log(this.children[index]);
  if (this.children[index] instanceof this.constructor) {
    return callback(null, this.children[index]);
  }

  this.constructor.findOne({_id: this.children[index]}, callback);
};
BoxSchema.methods.addChild = function(obj, callback) {
  var self = this;
  new this.constructor(obj).save(function(err, newmodel) {
    if (err) return callback(err);
    self.children.push(newmodel);
    self.save(function(selferr, self) {
      if (selferr) return callback(selferr);
      callback(err, newmodel);
    });
  });
};

BoxSchema.methods.moveTo = function(newparent, index, callback) {
  var mover = this;
  this.getParent(function(err, parent) {
    if (err) callback(err);
    else {
      parent.children.remove(mover._id);
      
      var dest = parent;
      if (newparent !== null) dest = newparent;
      dest.children.splice(index, 0, mover._id);

      if (dest._id == parent._id) {
        dest.save(callback);
      }
      else {
        parent.save(function(perr) {
          if (perr) callback(perr);
          else dest.save(callback);
        });
      }
    }
  });
};

BoxSchema.static('findLiving', function (callback) {
  return this.find({ alive: true }).populate("children").exec(callback);
});

exports.schema = BoxSchema;