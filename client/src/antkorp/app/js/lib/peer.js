/****************************************************************
 * Copyright (c) Neptunium Pvt Ltd., 2014.
 * Author: Neptunium Pvt Ltd..
 *
 * This unpublished material is proprietary to Neptunium Pvt Ltd..
 * All rights reserved. The methods and techniques described herein 
 * are considered trade secrets and/or confidential. Reproduction or 
 * distribution, in whole or in part, is forbidden except by express 
 * written permission of Neptunium.
 ****************************************************************/


window.Peer = function(settings) {
	this.homeId = settings.homeId;
	this.id = settings.id;
	var _self = this;
	this.settings = settings;
	this.onAddStream = settings.onAddStream;
	this.onRemoveStream = settings.onRemoveStream;
	this.onPeerMessage = function(e) {
		_self.onMessageRecieved(e)
	};
	
	this.STUNURL = settings.STUNURL || "";
	this.peerConnCreated = false;
	this.peerConn = null;
	this.iceStarted = false;
	this.iceComplete = false;
	this.callInProgress = false;
	this.answerPending = true;
	this.connections = {};
	this.Sdp = null;
	this.isConnected = false;
	this.localStream = null;
	this.autoOffer = settings.autoOffer ? settings.autoOffer : false;
	this.recievedChannel = null;

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
	this.audioonly = false;

	this.createPeerConnection();
}
Peer.prototype.closePeerConnection = function() {

	this.peerConn.close();
	this.peerConn = null;
	this.peerConnCreated = false;
	this.iceStarted = false;
	this.iceComplete = false;
	this.callInProgress = false;
	this.answerPending = true;
	this.Sdp = null;
	// console.log("peer connection closed by peer");
	return;
}

Peer.prototype.createPeerConnection = function() {
	if (this.peerConnCreated)
		return;
	var pc_config = {
		"iceServers" : [ {
			"url" : this.STUNURL,
		} ]
	};
	var self = this;
	this.peerConn = new RTCPeerConnection(pc_config, {
		optional : [ {
			RtpDataChannels : true
		} ]
	});

	try {
		this.channel = this.peerConn.createDataChannel(this.id, {
			reliable : false
		});
		this.setChannelEvents(this.channel);
		// if(!this.autoOffer)
		// this.sendCall();
	} catch (e) {
		//console.log("failed to create data channel " + e.message);
	}

	this.peerConn.onconnecting = this.onSessionConnecting;
	this.peerConn.onconnection = this.onSessionConnection;
	this.peerConn.onopen = this.onSessionOpened;
	this.peerConn.onaddstream = function(e) {
		self.onAddStream(e, self.id);
	}// this.onRemoteStreamAdded;
	// this.peerConn.onremovestream =
	// this.onRemoveStream;//this.onRemoteStreamRemoved;
	this.peerConn.onerror = this.onPeerConnError;
	this.peerConn.onstatechange = this.onStateChange;
	this.peerConn.onclosedconnection = this.onSessionClose;
	this.peerConn.onnegotiationneeded = this.onNegotiation;
	this.peerConn.ondatachannel = function(e) {
		self.handleChannels(e, self)
	};

	this.peerConn.onicecandidate = function(event) {

		self.onIceCandidate(event, self);
	}

	this.peerConnCreated = true;
	return;
}

Peer.prototype.send = function(msg, scsCallback, errCallback) {
	var _self = this;
	
	

	try {

		this.channel.send(JSON.stringify(msg));
		//console.log("msg send to peer");
		return true;
	} catch (e) {

		// console.log("unable to send to peer reason: "+e.message);
		// errCallback.call();
		try {
			_self.recievedChannel.send(JSON.stringify(msg));
			//console.log("msg send to peer via recieved channel");
			return true;
		} catch (e) {
			//console.log("trying to send through recieved channel failed");
			return false;
			
		}
	}
	return false;
}


Peer.prototype.onMessageRecieved = function(e) {
	var data = JSON.parse(e.data);
	this.settings.onPeerMessage.call(this, data, this.id);
}
Peer.prototype.addMedia = function(stream) {
	//console.log("add stream called");
	try {
		this.peerConn.addStream(stream);
	} catch (e) {
		//console.log("failed to add stream : " + e.message);
	}
	this.localStream = stream;
	// this.sendCall();

}
Peer.prototype.removeMedia = function() {
	//console.log("Remove stream called");
	try {
		this.peerConn.removeStream(this.localStream);
	} catch (e) {
		//console.log("failed to stop stream :" + e.message);
	}
	if (this.localStream)
		this.localStream.stop();
}
Peer.prototype.onNegotiation = function(e) {
	// console.log("negotiation needed");
}

Peer.prototype.handleChannels = function(event, obj) {
	var channel = event.channel;
	obj.connections[channel.label] = channel;
	obj.recievedChannel = channel;

	channel.onopen = function() {
		// console.log("channel opened.");

	}
	channel.onclose = function() {
		// console.log("channel closed");

	}
	channel.onmessage = obj.onPeerMessage;
}

Peer.prototype.onIceCandidate = function(event, obj) {
	if (event.candidate) {
		var jsonText = {
			"service" : "rtc",
			mesgtype : "event",
			"eventtype" : "candidate_event",
			"candobj" : {
				"sndr" : obj.homeId,// auth.loginuserid, // myname,
				"rcpt" : obj.id,// hisname,
				"label" : event.candidate.sdpMLineIndex,
				"cand" : event.candidate.candidate
			}
		};
		akp_ws.send({data:jsonText});
		// console.log("Candidate sent to the peer via server");
	} else {
		// console.log("End of candidates.");
		// obj.createDataChannel();
	}
}
Peer.prototype.onSessionConnection = function(message) {
	// console.log("Session connected.");
	//console.log(this);
	return;
}
Peer.prototype.onSessionConnecting = function(message) {
	// console.log("Session connecting ...");
	return;
}

Peer.prototype.onSessionOpened = function(message) {
	// console.log("Session opened");
	return;
}
Peer.prototype.onSessionClose = function(event) {
	// console.log("Session closed");
	return;
}
Peer.prototype.onRemoteStreamAdded = function(event) {
	// console.log("Remote stream added");
	return;
}
Peer.prototype.onRemoteStreamRemoved = function(event) {
	// console.log("Remote stream removed");

	return;
}

Peer.prototype.onPeerConnError = function(emesg) {
	//console.log("Error on peer connection " + emesg);
	return;
}

Peer.prototype.onStateChange = function(event) {
	// console.log("Connection state changed");
	return;
}

Peer.prototype.sendCall = function() {
	var self = this;

	if (this.audioonly) {
		this.sdpConstraints = {
			'mandatory' : {
				'OfferToReceiveAudio' : true,
				'OfferToReceiveVideo' : false
			}
		};
	} else {
		this.sdpConstraints = {
			'mandatory' : {
				'OfferToReceiveAudio' : true,
				'OfferToReceiveVideo' : true
			}
		};
	}

	this.peerConn.createOffer(function(description) {
		self._setLocalAndSendOffer(description)
	}, null, this.sdpConstraints);

}
Peer.prototype.answerCall = function() {
	var self = this;
	if (this.audioonly) {
		this.sdpConstraints = {
			'mandatory' : {
				'OfferToReceiveAudio' : true,
				'OfferToReceiveVideo' : false
			}
		};
	} else {
		this.sdpConstraints = {
			'mandatory' : {
				'OfferToReceiveAudio' : true,
				'OfferToReceiveVideo' : true
			}
		};
	}
	this.peerConn.createAnswer(function(description) {
		self._setLocalAndSendAnswer(description)
	}, null, this.sdpConstraints);
	// this.isConnected=true;
}

Peer.prototype.setRemoteDescription = function(jsepdata) {
	var rsdesc = new RTCSessionDescription(jsepdata);
	this.peerConn.setRemoteDescription(rsdesc);

}
Peer.prototype.addIceCandidate = function(label, cand) {
	var candidate = new RTCIceCandidate({
		sdpMLineIndex : label,
		candidate : cand
	});

	try {
		this.peerConn.addIceCandidate(candidate)
	} catch (e) {
		//console.log(e.message);
	}
}
Peer.prototype._setLocalAndSendAnswer = function(sessionDescription) {
	this.peerConn.setLocalDescription(sessionDescription);
	var pickup = {
		"service" : "rtc",
		"mesgtype" : "response",
		"response" : "answer",
		answer : {
			"sndr" : this.homeId,// auth.loginuserid,
			"rcpt" : this.id,// hisname,
			"jsepdata" : sessionDescription
		}
	};
	akp_ws.send({data:pickup});

	// console.log(JSON.stringify(pickup));
	return;
}
Peer.prototype._setLocalAndSendOffer = function(sessionDescription) {
	// console.log("local session description");
	this.peerConn.setLocalDescription(sessionDescription);
	var call = {

		"service" : "rtc",
		"mesgtype" : "request",
		"request" : "offer",
		offer : {
			"sndr" : this.homeId,// auth.loginuserid,
			"rcpt" : this.id,// hisname,
			"jsepdata" : sessionDescription
		}
	};
	akp_ws.send({data:call});
	// console.log(JSON.stringify(call));
	return;
}
Peer.prototype.liftCall = function(constraints) {
	// this.peerConn.setLocalDescription(sessionDescription);
	var pickup = {
		"service" : "rtc",
		"mesgtype" : "response",
		"response" : "pickup",
		"pickup" : {
			"callee" : this.homeId,// auth.loginuserid,
			"caller" : this.id,// hisname,

		}
	};
	this.audioonly = false;
	if (constraints) {
		pickup["pickup"].audioonly = true;
		this.audioonly = true;
	}
	akp_ws.send({data:pickup});
	this.isConnected = true;
	// console.log(JSON.stringify(pickup));
	return;
}
Peer.prototype.makeCall = function(constraints) {
	// console.log("local session description");
	// this.peerConn.setLocalDescription(sessionDescription);
	var call = {

		"service" : "rtc",
		"mesgtype" : "request",
		"request" : "call",
		"call" : {
			"caller" : this.homeId,// auth.loginuserid,
			"callee" : this.id,// hisname,

		}
	};
	this.audioonly = false;
	if (constraints) {
		call["call"].audioonly = true;
		this.audioonly = true;
	}
	akp_ws.send({data:call});
	// console.log(JSON.stringify(call));
	return;
}
Peer.prototype.dropCall = function(constraints) {
	var unique = akp_ws.createUUID();

	var rejectObj = {
		service : "rtc",
		mesgtype : "response",
		sndr : this.homeId,
		rcpt : this.id,
		response : "drop",
		cookie : unique
	}

	this.audioonly = false;
	if (constraints) {
		rejectObj.audioonly = true;
	}

	akp_ws.send({data:rejectObj});
	// maptable[rejectObj.cookie] = "dropcall";
}
Peer.prototype.setChannelEvents = function(channel) {

	var self = this;
	channel.onopen = function() {
		//console.log("channel created");
		// self.channel.send("HOORAY! I just got it.");
		// onopen.call(self);
	};
	channel.onclose = function() {
		//console.log("channel closed");
		// onclose.call(self);
	};
	channel.onerror = function(e) {
		//console.log("channel error:" + e.message);
	}
	channel.onmessage = function(ev) {
		var data = ev.data;
		self.onPeerMessage({
			data : data
		});
	};
	/*
	 * function(evt){
	 *  // console.log("Home channel got message:"+evt.data); }
	 */
	// this.channel.send("HOORAY!");
}

/*
 * How to use
 * 
 * 
 * var peerManager={}; peerManger[userid]=new Peer({id:userid});
 * 
 * //create peer connection peerManager[userid].createPeerConnection();
 * 
 * //close Peer Connction peerManager[userid].closePeerConnnection();
 * 
 */
