var mongoose = require('mongoose');

mongoose.connection.on('error', function() {});

var db = mongoose.connect("mongodb://localhost/lexbox-test"),
    LBox = db.model('LBox', require('../models/boxes').schema),
    expect = require('chai').expect;

describe("boxes' basic text functions", function() {

  it("should create with properly formed slug and auto-fake-summary", function(done) {
    var mytext = new LBox({name: "hello testy's test!",
      body: "It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello "});
    mytext.save(function(err, text) {
      expect(text.name).to.equal("hello testy's test!");
      expect(text.slug).to.equal("hello-testys-test");
      expect(text.displaySummary).to.equal("It's like a wave hello It's like a wave hello It's");

      done();
    });
  });

  it("should get found again, dammit", function(done) {
    var mytext = new LBox({name: "hello testy's other test!", body: "It's like a wave hell"});
    mytext.save(function(err, thetext) {
      LBox.findOne({_id: thetext.id}, function(err, secondtext) {
        expect(secondtext).not.to.be.null;
        expect(secondtext.id).to.equal(thetext.id);

        done();
      });
    });
  });

  it("should add a tag successfully", function() {
    var mytext = new LBox({name: "hello what", body: "hmm"});
    mytext.addTag("irrelevant");
    expect(mytext.tags.length).to.equal(1);
    expect(mytext.tags[0].name).to.equal("irrelevant");
  });

  it("should tell us it has the tag", function() {
    var mytext = new LBox({name: "hello what", body: "hmm", tags: ["doing"]});
    expect(mytext.hasTag("doing")).to.be.true;
  });

  it("should lose the tag when asked", function() {
    var mytext = new LBox({name: "redline", body: "hmm", tags: ["doing"]});
    mytext.removeTag("doing");
    expect(mytext.hasTag("doing")).to.be.false;
  });

  it("should also accept bare strings", function() {
    var mytext = new LBox({name: "hello sailor", body: "hmfm", tags: "doing"});
    expect(mytext.hasTag("doing")).to.be.true;
  });

  it("should give the first 50 chars of the body as displaySummary until we have a real summary", function(){
    var mytext = new LBox({name: "hello displaySummary",
      body: "It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello It's like a wave hello "});
    expect(mytext.displaySummary).to.equal("It's like a wave hello It's like a wave hello It's");
    mytext.summary = "Jack Krak the Motherfucker";
    expect(mytext.displaySummary).to.equal("Jack Krak the Motherfucker");
  });

  it("should add new children", function(done){
    var mytext = new LBox({name: "hello sailor", body: "hmfm"});
    mytext.addChild({name: "myass"}, function(err, thechild) {
      expect(mytext.children.length).to.equal(1);
      expect(thechild instanceof LBox).to.equal(true);

      done();
    });
  });

  it("should find parents", function(done){
    var mytext = new LBox({name: "hello sailor", body: "hmfm"});
    mytext.save(function(err, text) {
      text.addChild({name: "myass"}, function(err, childtext) {
        childtext.getParent(function(err, parent){
          expect(parent.id).to.equal(mytext.id);
          done();
        });
      });
    });
  });

  after(function(done){
    //clear out db
    LBox.remove(function(){
      mongoose.connection.close(function(err) {
        if (!err) console.log("actually closed connection?");
        else console.error(err);
        done();
      });
    });
  });

});
