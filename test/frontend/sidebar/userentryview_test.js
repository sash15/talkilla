/*global app, chai, sinon, AppPort */
"use strict";

var expect = chai.expect;

describe("UserEntryView", function() {
  var sandbox, sidebarApp;

  function createFakeSidebarApp() {
    // exposes a global sidebarApp for view consumption
    // XXX: FIX THAT
    window.sidebarApp = {
      user: new app.models.User(),
      appPort: new AppPort()
    };
    return window.sidebarApp;
  }

  beforeEach(function() {
    sandbox = sinon.sandbox.create();

    // mozSocial "mock"
    navigator.mozSocial = {
      getWorker: function() {
        return {
          port: {postMessage: sinon.spy()}
        };
      }
    };

    sandbox.stub(AppPort.prototype, "post");

    sidebarApp = createFakeSidebarApp();
    sidebarApp.openConversation = sandbox.spy();
  });

  afterEach(function() {
    sandbox.restore();
    window.sidebarApp = undefined;
  });

  describe("#call", function() {
    it("should ask the app to open a new conversation", function () {
      var view = new app.views.UserEntryView({
        model: new app.models.User(),
        active: false
      });

      var clickEvent = {
        preventDefault: function() {},
        currentTarget: {
          getAttribute: function() {return "william";}
        }
      };

      view.openConversation(clickEvent);

      sinon.assert.calledOnce(sidebarApp.openConversation);
      sinon.assert.calledWith(sidebarApp.openConversation, "william");
    });
  });

  describe("#render", function() {
    var user, view;

    beforeEach(function() {
      user = new app.models.User({username: "chuck", presence: "connected"});
      view = new app.views.UserEntryView({
        model: user,
        active: false,
        el: $("#fixtures")
      });
    });

    afterEach(function() {
      $("#fixtures").empty();
    });

    it("should populate template with expected username", function() {
      user.set({username: "chuck"});

      view.render();

      expect(view.$("a").attr("rel")).eql("chuck");
      expect(view.$("a").attr("title")).eql("chuck");
      expect(view.$(".username").text()).eql("chuck");
    });

    it("should populate template with expected full name", function() {
      user.set({username: "chuck", fullName: "Chuck Norris"});

      view.render();

      expect(view.$("a").attr("rel")).eql("chuck");
      expect(view.$("a").attr("title")).eql("chuck");
      expect(view.$(".username").text()).eql("Chuck Norris");
    });

    it("should populate template with the avatar", function() {
      user.set({username: "chuck", fullName: "Chuck Norris"});
      sandbox.stub(user, "avatar").returns("http://example.com?d=1");

      view.render();

      expect(view.$("img").attr("src")).eql("http://example.com?d=1&s=64");
    });

    it("should reflect the user is disconnected", function() {
      user.set("presence", "disconnected");

      expect(view.$(".status-disconnected")).to.have.length.of(1);
    });

    it("should reflect the user is connected", function() {
      user.set("presence", "disconnected").set("presence", "connected");

      expect(view.$(".status-connected")).to.have.length.of(1);
    });
  });

  describe("Events", function() {
    describe("User model", function() {
      var user, view;

      beforeEach(function() {
        sandbox.stub(app.views.UserEntryView.prototype, "render");
        user = new app.models.User({email: "a@a.com",
                                    presence: "disconnected"});
        view = new app.views.UserEntryView({model: user});
      });

      it("should render when the presence is changed", function() {
        user.set("presence", "connected");

        sinon.assert.calledOnce(view.render);
      });
    });
  });
});
