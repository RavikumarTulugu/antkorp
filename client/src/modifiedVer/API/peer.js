window.Peer = function(settings) {
	this.homeId=settings.homeId;
	this.id = settings.id;
	
	
	this.onAddStream=settings.onAddStream;
	this.onRemoveSream=settings.onRemoveStream;
	this.peerConnCreated = false;
	this.peerConn = null;
	this.iceStarted = false;
	this.iceComplete = false;
	this.callInProgress = false;
	this.answerPending = true;
	this.connections={};
	this.Sdp = null;
	
	this.remotePeerClose = false;
	this.mediaConstraints = {
		'has_audio' : true,
		'has_video' : true
	};
	this.sdpConstraints = {
		'mandatory' : {
			'OfferToReceiveAudio' : true,
			'OfferToReceiveVideo' : true
		}
	};
}
Peer.prototype.closePeerConnection = function() {

	this.peerConn.close();
	this.peerConn = null;
	this.peerConnCreated = false;
	this.iceStarted = false;
	this.iceComplete = false;
	this.callInProgress=false;
	this.answerPending = true;
	this.Sdp = null;
	console.log("peer connection closed by peer");
	return;
}

Peer.prototype.createPeerConnection = function() {
	if (this.peerConnCreated)
		return;
	var pc_config = {
		"iceServers" : [ {
			"url" : "stun:stun.l.google.com:19302"
		} ]
	};
	var self=this;
	this.peerConn = new RTCPeerConnection(pc_config,{optional: [{RtpDataChannels: true}]});
	this.peerConn.onconnecting = this.onSessionConnecting;
	this.peerConn.onconnection=this.onSessionConnection;
	this.peerConn.onopen = this.onSessionOpened;
	this.peerConn.onaddstream = this.onAddStream;//this.onRemoteStreamAdded;
	this.peerConn.onremovestream = this.onRemoveStream;//this.onRemoteStreamRemoved;
	this.peerConn.onerror = this.onPeerConnError;
	this.peerConn.onstatechange = this.onStateChange;
	this.peerConn.onclosedconnection = this.onSessionClose;
	this.peerConn.ondatachannel=this.handleChannels;
	
	
	this.peerConn.onicecandidate = 
		function(event){
		
		self.onIceCandidate(event,self);
	}
	this.peerConnCreated = true;
	return;
}

Peer.prototype.handleChannels=function(event){
	 var channel=event.channel;
	 
	channel.onopen=function(){
		console.log("channel opened.");
		
	}
	this.channel.onerror=function(e){
		console.log("channel error:"+e.message);
	}
	channel.onclose=function(){
		console.log("channel closed");
		
	}
	channel.onmessage=function(evt){
		console.log("channel got data:"+evt.data);
	}
}


Peer.prototype.onIceCandidate = function(event,obj) {
	if (event.candidate) {
		var jsonText = {
			"service" : "rtc",
			"mesgtype" : "event",
			"eventtype" : "candidate_event",
			"candobj" : {
				"sndr" : obj.homeId,//auth.loginuserid, // myname,
				"rcpt" : obj.id,//hisname,
				"label" : event.candidate.sdpMLineIndex,
				"cand" : event.candidate.candidate
			}
		};
		akp_ws.send(jsonText);
		// console.log("Candidate sent to the peer via server");
	} else {
		console.log("End of candidates.");
	}
}
Peer.prototype.onSessionConnection=function(message){
	console.log("Session connected.");
	console.log(this);
	return;
}
Peer.prototype.onSessionConnecting = function(message) {
	console.log("Session connecting ...");
	return;
}

Peer.prototype.onSessionOpened = function(message) {
	console.log("Session opened");
	return;
}
Peer.prototype.onSessionClose=function(event){
	console.log("Session closed");
	return;
}
Peer.prototype.onRemoteStreamAdded = function(event) {
	console.log("Remote stream added");
	return;
}
Peer.prototype.onRemoteStreamRemoved = function(event) {
	console.log("Remote stream removed");

	return;
}

Peer.prototype.onPeerConnError = function(emesg) {
	console.log("Error on peer connection " + emesg);
	return;
}

Peer.prototype.onStateChange = function(event) {
	console.log("Connection state changed");
	return;
}

Peer.prototype.sendCall=function(){
	var self=this;
	this.peerConn.createOffer(function(description){self._setLocalAndSendMessageForCall(description)}, null, this.sdpConstraints);
}
Peer.prototype.answerCall=function(){
	var self=this;
	this.peerConn.createAnswer(function(description){self._setLocalAndSendMessageForPickup(description)}, null, this.sdpConstraints);
}
Peer.prototype.dropCall=function(){
	var unique = akp_ws.createUUID();

	var rejectObj = {
		service : "rtc",
		mesgtype : "response",
		sndr : this.homeId,
		rcpt : this.id,
		response : "drop",
		cookie : unique
	}

	akp_ws.send(rejectObj);
	// maptable[rejectObj.cookie] = "dropcall";
}
Peer.prototype.setRemoteDescription=function(jsepdata){
	var rsdesc = new RTCSessionDescription(jsepdata);
	this.peerConn.setRemoteDescription(rsdesc);
	
}
Peer.prototype.addIceCandidate=function(label,cand){
	var candidate = new RTCIceCandidate({
		sdpMLineIndex : label,
		candidate : cand
	});
	this.peerConn.addIceCandidate(candidate)
}
Peer.prototype._setLocalAndSendMessageForPickup=function(sessionDescription){
	this.peerConn.setLocalDescription(sessionDescription);
	var pickup = {
		"service" : "rtc",
		"mesgtype" : "response",
		"response" : "pickup",
		answer : {
			"sndr" : this.homeId,//auth.loginuserid,
			"rcpt" : this.id,//hisname,
			"jsepdata" : sessionDescription
		}
	};
	akp_ws.send(pickup);
	// console.log(JSON.stringify(pickup));
	return;
}
Peer.prototype._setLocalAndSendMessageForCall=function(sessionDescription) {
	console.log("local session description");
	this.peerConn.setLocalDescription(sessionDescription);
	var call = {

		"service" : "rtc",
		"mesgtype" : "request",
		"request" : "call",
		offer : {
			"sndr" : this.homeId,//auth.loginuserid,
			"rcpt" : this.id,//hisname,
			"jsepdata" : sessionDescription
		}
	};
	akp_ws.send(call);
	// console.log(JSON.stringify(call));
	return;
}

Peer.prototype.createDataChannel=function(onopen,onclose){
	 this.channel = this.peerConn.createDataChannel("DataChannel",{reliable: false});
	 var self=this;
	 this.channel.onopen = function(){
		 console.log("channel created");
		 //onopen.call(self);
	 };
	  this.channel.onclose = function(){
		  console.log("channel closed");
		  //onclose.call(self);
	  };
	  this.channel.onmessage=function(evt){
		  console.log("created channel got message:"+evt.data);
	  }
	  this.channel.send("HOORAY!");
}

/*
 * How to use
 *

var peerManager={};
peerManger[userid]=new Peer({id:userid});

//create peer connection
peerManager[userid].createPeerConnection();

//close Peer Connction
peerManager[userid].closePeerConnnection();

*/
