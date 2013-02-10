var mongoose = require('mongoose');

mongoose.connection.on('error', function() {console.log("mongoose exploded");});

var db = mongoose.connect("mongodb://localhost/lexbox-test"),
    LBox = db.model('LBox', require('../models/boxes').schema),
    expect = require('chai').expect,
    boxCtrl = require("../controllers/boxes_ctrl").control({LBox: LBox});

describe("boxes' controller stuff", function() {
  
  it("provides an empty boxes var to the template when there are no boxes", function(done) {
    var res = {
      render: function(what, stuff) {
        expect(what).to.equal('index');
        expect(stuff.boxes.length).to.equal(0);
        done();
      }
    };

    boxCtrl.index({}, res);
  });

  it("provides a boxes var with one box when a box has been created", function(done){
    var citizen = new LBox({name: "Spartacus", body: "I am <strike>Napoleon</strike>Spartacus!"});
    citizen.save(function(){
      var res = {
        render: function(what, stuff) {
          expect(what).to.equal('index');
          expect(stuff.boxes.length).to.equal(1);
          done();
        }
      };

      boxCtrl.index({}, res);
    });
  });

  it("does not pull up a box that isn't alive", function(done){
    var deadizen = new LBox({name: "Deadman", body: "I am dead baby dead", alive: false});
    deadizen.save(function(){
      var res = {
        render: function(what, stuff) {
          expect(what).to.equal('index');
          expect(stuff.boxes.length).to.equal(1);
          done();
        }
      };

      boxCtrl.index({}, res);
    });
  });

  it("finds a box by its slug", function(done){
    var findable = new LBox({name: "find me"});
    findable.save(function(){
      var res = {
        render: function(what, stuff) {
          expect(what).to.equal('text');
          expect(stuff.text).not.to.be.null;
          expect(stuff.text.name).to.equal("find me");
          done();
        }
      };

      boxCtrl.show({params: {slug: "find-me"}}, res);
    });
  });

  /* it("edits a box successfully", function(done){
    
    var res = {
      render: function(what, stuff) {
        expect(what).to.equal('text');
        expect(stuff.text).not.to.be.null;
        expect(stuff.text.name).to.equal("find me");
        done();
      }
    };

    boxCtrl.show({params: {slug: "find-me"}}, res);
  }); */

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
