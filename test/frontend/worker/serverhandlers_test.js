/*global chai, sinon, browserPort:true, currentConversation:true,
  Server, Conversation, currentUsers:true, ports, updateCurrentUsers,
  _setupServer */

/* Needed due to the use of non-camelcase in the websocket topics */
/* jshint camelcase:false */
var expect = chai.expect;

describe("serverHandlers", function() {
  var sandbox, server;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    currentUsers = [];
    server = new Server();
    _setupServer(server);
  });

  afterEach(function() {
    currentConversation = undefined;
    sandbox.restore();
  });

  describe("`message:users` event", function() {

    it("should update the current list of users", function() {
      sandbox.stub(ports, "broadcastEvent");
      sandbox.stub(window, "updateCurrentUsers");

      server.trigger("message:users", "fake");

      sinon.assert.calledOnce(updateCurrentUsers);
      sinon.assert.calledWith(updateCurrentUsers, "fake");
    });

    it("should broadcast a `talkilla.users` event with the list of users",
      function() {
        sandbox.stub(ports, "broadcastEvent");
        sandbox.stub(window, "updateCurrentUsers", function(data) {
          currentUsers = data;
        });

        server.trigger("message:users", "fake");

        sinon.assert.calledOnce(ports.broadcastEvent);
        sinon.assert.calledWith(
          ports.broadcastEvent, "talkilla.users", "fake");
      });

  });

  describe("`message:userJoined` event", function() {

    it("should broadcast a `talkilla.users` event", function() {
      currentUsers = [];
      sandbox.stub(ports, "broadcastEvent");

      server.trigger("message:userJoined", "foo");

      sinon.assert.called(ports.broadcastEvent);
      sinon.assert.calledWith(ports.broadcastEvent, "talkilla.users", [
        {nick: "foo", presence: "connected"}
      ]);
    });

    it("should broadcast a `talkilla.user-joined` event", function() {
      currentUsers = [];
      sandbox.stub(ports, "broadcastEvent");

      server.trigger("message:userJoined", "foo");

      sinon.assert.called(ports.broadcastEvent);
      sinon.assert.calledWith(ports.broadcastEvent,
                              "talkilla.user-joined", "foo");
    });

  });

  describe("`message:userLeft` event", function() {

    it("should broadcast a `talkilla.users` event", function() {
      currentUsers = [{nick: "foo", presence: "connected"}];
      sandbox.stub(ports, "broadcastEvent");

      server.trigger("message:userLeft", "foo");

      sinon.assert.called(ports.broadcastEvent);
      sinon.assert.calledWith(ports.broadcastEvent, "talkilla.users", [
        {nick: "foo", presence: "disconnected"}
      ]);
    });

    it("should broadcast a `talkilla.user-left` event", function() {
      currentUsers = [];
      sandbox.stub(ports, "broadcastEvent");

      server.trigger("message:userLeft", "foo");

      sinon.assert.called(ports.broadcastEvent);
      sinon.assert.calledWith(ports.broadcastEvent,
                              "talkilla.user-left", "foo");
    });

  });

  describe("`message:incoming_call` event", function() {
    beforeEach(function() {
      browserPort = {postEvent: sandbox.spy()};
    });

    afterEach(function() {
      browserPort = undefined;
      currentConversation = undefined;
    });

    it("should create a new conversation object with the call data",
       function() {
      var data = {
        peer: "alice",
        offer: {type: "fake", sdp: "sdp" }
      };

      server.trigger("message:incoming_call", data);

      expect(currentConversation).to.be.an.instanceOf(Conversation);
      expect(currentConversation.data).to.deep.equal(data);
    });

    it("should try to re-use an existing conversation object",
      function() {
        currentConversation = new Conversation({peer: "florian"});

        sandbox.stub(currentConversation, "handleIncomingCall");

        var data = {
          peer: "alice",
          offer: {type: "fake", sdp: "sdp" }
        };
        server.trigger("message:incoming_call", data);

        sinon.assert.calledOnce(currentConversation.handleIncomingCall);
        sinon.assert.calledWith(currentConversation.handleIncomingCall,
                                data);
      });
  });

  describe("`message:call_accepted` event", function() {

    it("should call callAccepted on the conversation", function () {
      var data = {
        peer: "alice",
        answer: { type: "fake", sdp: "sdp" }
      };

      currentConversation = {
        callAccepted: sandbox.spy()
      };

      server.trigger("message:call_accepted", data);

      sinon.assert.calledOnce(currentConversation.callAccepted);
      sinon.assert.calledWithExactly(currentConversation.callAccepted,
        data);
    });

  });

  describe("`message:call_hangup` event", function() {
    var callData, callHangupStub;

    beforeEach(function() {
      currentConversation = {
        callHangup: function() {}
      };

      // We save this as a stub, because currentConversation gets
      // cleared in the call_hangup function.
      callHangupStub = sandbox.stub(currentConversation, "callHangup");

      callData = {
        peer: "bob"
      };
    });

    it("should call callHangup on the conversation", function() {
      server.trigger("message:call_hangup", callData);

      sinon.assert.calledOnce(callHangupStub);
      sinon.assert.calledWithExactly(callHangupStub, callData);
    });
  });
});
