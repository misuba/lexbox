describe("texts", function() {
  var mongoose = require('mongoose'),
      db = mongoose.connect("mongodb://localhost/lexbox-test"),
      LText = db.model('LText', require('../models/texts').schema),
      LBox = db.model('LBox', require('../models/boxes').schema);

  // something to clear the db collection

  it("should create with properly formed slug and summary", function() {
    var mytext = new LText({title: "hello testy's test!", 
      body: "It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello "});
    mytext.save(function(err, text) {
      expect(text.title).toEqual("hello testy's test!"); // little sanity check, i dunno
      expect(text.slug).toEqual("hello-testys-test");
      expect(text.summary).toEqual("It's like a wave hello It's like a wave hello It's");
    });
  });

  it("should get found again, dammit", function() {
    var mytext = new LText({title: "hello testy's other test!", body: "It's like a wave hell"});
    mytext.save(function(err, text) {
      LText.findOne({_id: text.id}, function(err, nutext) {
        expect(nutext).not.toBeNull();
        expect(nutext.id).toEqual(text.id);
      });
    });
  });

  it("should add a tag successfully", function() {
    var mytext = new LText({title: "hello what", body: "hmm"});
    mytext.addTag("irrelevant");
    expect(mytext.tags.length).toEqual(1);
    expect(mytext.tags[0].name).toEqual("irrelevant");
  });

  it("should tell us it has the tag", function() {
    var mytext = new LText({title: "hello what", body: "hmm", tags: ["doing"]});
    expect(mytext.hasTag("doing")).toBeTruthy();
  });

  it("should lose the tag when asked", function() {
    var mytext = new LText({title: "redline", body: "hmm", tags: ["doing"]});
    mytext.removeTag("doing");
    expect(mytext.hasTag("doing")).toBeFalsy();
  });

  it("should also accept bare strings", function() {
    var mytext = new LText({title: "hello sailor", body: "hmfm", tags: "doing"});
    expect(mytext.hasTag("doing")).toBeTruthy();
  });

  it("should succinctly tell us about its box's presence", function(){
    var mytext = new LText({title: "hello sailor", body: "hmfm"});
    expect(mytext.hasBox).toBeFalsy();
    LBox.create({name:"yeah"}, function(err,box) {
      mytext.box = box;
      expect(mytext.hasBox).toBeTruthy();
      mytext.box = null;
      expect(mytext.hasBox).toBeFalsy();
    });
  });

});