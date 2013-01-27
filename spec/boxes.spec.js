var mongoose = require('mongoose'),
    db = mongoose.connect("mongodb://localhost/lexbox-test"),
    LBox = db.model('LBox', require('../models/boxes').schema);

describe("boxes' basic text functions", function() {

  it("should create with properly formed slug and auto-fake-summary", function() {
    var thetext;
    runs(function(){
      var mytext = new LBox({name: "hello testy's test!", 
        body: "It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello "});
      mytext.save(function(err, text) {
        thetext = text;
      });
    });
    
    waitsFor(function(){
      return thetext;
    });

    runs(function() {
      expect(thetext.name).toEqual("hello testy's test!"); // little sanity check, i dunno
      expect(thetext.slug).toEqual("hello-testys-test");
      expect(thetext.displaySummary).toEqual("It's like a wave hello It's like a wave hello It's");
    });
  });

  it("should get found again, dammit", function() {
    var thetext, secondtext;
    runs(function() {
      var mytext = new LBox({name: "hello testy's other test!", body: "It's like a wave hell"});
      mytext.save(function(err, text) { thetext = text; });
    });
    waitsFor(function() {return thetext;});
    runs(function() {
      LBox.findOne({_id: thetext.id}, function(err, nutext) {
        secondtext = nutext;
      });
    });
    waitsFor(function() { return secondtext; });
    runs(function() {
      expect(secondtext).not.toBeNull();
      expect(secondtext.id).toEqual(thetext.id);
    });
  });

  it("should add a tag successfully", function() {
    var mytext = new LBox({name: "hello what", body: "hmm"});
    mytext.addTag("irrelevant");
    expect(mytext.tags.length).toEqual(1);
    expect(mytext.tags[0].name).toEqual("irrelevant");
  });

  it("should tell us it has the tag", function() {
    var mytext = new LBox({name: "hello what", body: "hmm", tags: ["doing"]});
    expect(mytext.hasTag("doing")).toBeTruthy();
  });

  it("should lose the tag when asked", function() {
    var mytext = new LBox({name: "redline", body: "hmm", tags: ["doing"]});
    mytext.removeTag("doing");
    expect(mytext.hasTag("doing")).toBeFalsy();
  });

  it("should also accept bare strings", function() {
    var mytext = new LBox({name: "hello sailor", body: "hmfm", tags: "doing"});
    expect(mytext.hasTag("doing")).toBeTruthy();
  });

  it("should give the first 50 chars of the body as displaySummary until we have a real summary", function(){
    var mytext = new LBox({name: "hello displaySummary", 
      body: "It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello "});
    expect(mytext.displaySummary).toEqual("It's like a wave hello It's like a wave hello It's");
    mytext.summary = "Jack Krak the Motherfucker";
    expect(mytext.displaySummary).toEqual("Jack Krak the Motherfucker");
    //done();
  });

});


describe("box nesting crap", function(){
  it("should add new children", function(){
    var thetext, thechild;
    runs(function() {
      var mytext = new LBox({name: "hello sailor", body: "hmfm"});
      thetext = mytext;
      mytext.addChild({name: "myass"}, function(err, childtext) {
        thechild = childtext;
      });
    });
    waitsFor(function() { return thetext && thechild; });
    runs(function() {
      expect(thetext.children.length).toBe(1);
      expect(thechild instanceof LBox).toBeTruthy();
    });
  });

  it("should find parents", function(){
    var thetext, theparent;
    runs(function() {
      var mytext = new LBox({name: "hello sailor", body: "hmfm"});
      mytext.save(function(err, text) {
        thetext = text;
        text.addChild({name: "myass"}, function(err, childtext) {
          childtext.getParent(function(err, parent){
            console.log(err);
            theparent = parent;
          });
        });
      });
    });
    waitsFor(function() { return theparent; }, "getParent to complete", 1000);
    runs(function() {
      expect(theparent._id).toEqual(thetext._id);
      done();
    });
  });
});

function done (err) {
  if (err) console.error(err.stack);
  mongoose.connection.db.dropDatabase(function () {
    mongoose.connection.close();
  });
}