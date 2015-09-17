$(function() {
	var peerConnCreated = false;
	var peerConn = null;
	var cameraOn = false;
	var myuid = "";
	var hisuid = "";
	var iceStarted = false;
	var iceComplete = false;
	var callPending = false;
	var answerPending = false;
	var hisSdp = null;
	function iceCallback(canditate, moreToFollow) {
		if (canditate) {
			var jsonText = {
				"mesgtype" : "canditate",
				"sndr" : myuid,
				"rcpt" : hisuid,
				"label" : canditate.label,
				"cand" : canditate.toSdp()
			};
			socket.send(JSON.stringify(jsonText));
			console.log(JSON.stringify(jsonText));
			if (!moreToFollow) {
				iceComplete = true;
				console.log("ice complete");
			}
		}
		return;
	}

	function onSessionConnecting(message) {
		console.log("Session connecting ...");
		return;
	}

	function onRemoteStreamRemoved(event) {
		console.log("Remote stream removed");
		remotevid.src = "";
		return;
	}

	function onSessionOpened(message) {
		console.log("Session opened");
		return;
	}

	function onRemoteStreamAdded(event) {
		console.log("Remote stream added");
		remotevid.src = window.webkitURL.createObjectURL(event.stream);
		$('#rtcvideo').jqxWindow('show');
		$('#rtcvideo').jqxWindow({
			'title' : hisuid
		})
		remotevid.style.opacity = 1;
		return;
	}

	function onPeerConnError(emesg) {
		console.log("Error on peer connection " + emesg);
		return;
	}

	function onStateChange(event) {
		console.log("Connection state changed");
		return;
	}

	function createPeerConnection() {
		if (peerConnCreated)
			return;
		peerConn = new webkitPeerConnection00("STUN stun.l.google.com:19302", iceCallback);
		peerConn.onconnecting = onSessionConnecting;
		peerConn.onopen = onSessionOpened;
		peerConn.onaddstream = onRemoteStreamAdded;
		peerConn.onremovestream = onRemoteStreamRemoved;
		peerConn.onerror = onPeerConnError;
		peerConn.onstatechange = onStateChange;
		peerConnCreated = true;
		return;
	}

	function turnOnCameraAndMic() {
		navigator.webkitGetUserMedia({
			video : true,
			audio : true
		}, successCallback, errorCallback);
		function successCallback(stream) {
			peerConn.addStream(stream);
			sourcevid.style.opacity = 1;
			sourcevid.src = window.webkitURL.createObjectURL(stream);
			cameraOn = true;
			if (callPending) {
				doCall();
				callPending = false;
			}
			if (answerPending) {
				doAnswer();
				answerPending = false;
			}
		}

		function errorCallback(error) {
			console.error('An error occurred: [CODE ' + error.code + ']');
		}

		return;
	}

	function doCall() {
		if (cameraOn) {
			var localOffer = peerConn.createOffer({
				has_audio : true,
				has_video : true
			});
			peerConn.setLocalDescription(peerConn.SDP_OFFER, localOffer);
			if (!iceStarted) {
				peerConn.startIce();
				iceStarted = true;
			}
			var call = {
				"mesgtype" : "call",
				"sndr" : myuid,
				"rcpt" : hisuid,
				"jsepdata" : localOffer.toSdp()
			};
			socket.send(JSON.stringify(call));
			console.log(JSON.stringify(call));
		} else
			callPending = true;
		return;
	}

	function doAnswer() {
		if (cameraOn) {
			peerConn.setRemoteDescription(peerConn.SDP_OFFER, hisSdp);
			var remoteOffer = peerConn.remoteDescription;
			var localAnswer = peerConn.createAnswer(remoteOffer.toSdp(), {
				has_audio : true,
				has_video : true
			});
			peerConn.setLocalDescription(peerConn.SDP_ANSWER, localAnswer);
			if (!iceStarted) {
				peerConn.startIce();
				iceStarted = true;
			}
			var jsonText = {
				"mesgtype" : "pickup",
				"sndr" : myuid,
				"rcpt" : hisuid,
				"jsepdata" : localAnswer.toSdp()
			};
			socket.send(JSON.stringify(jsonText));
			console.log(JSON.stringify(jsonText));
		} else
			answerPending = true;
		return;
	}

	function dialUser(user) {
		if (!peerConnCreated)
			createPeerConnection();
		if (!cameraOn)
			turnOnCameraAndMic();
		hisuid = user;
		doCall();
		return;
	}

	//handle the message from the sip server
	//There is a new connection from our peer so turn on the camera
	//and relay the stream to peer.
	function handleRtcMessage(request) {
		var sessionRequest = eval('(' + request + ')');
		switch(sessionRequest.mesgtype) {
			case 'call':
				console.log("recvng call");
				alert("Incoming call ...");
				if (!peerConnCreated)
					createPeerConnection();
				if (!cameraOn)
					turnOnCameraAndMic();
				hisSdp = new SessionDescription(sessionRequest.jsepdata);
				hisuid = sessionRequest.sndr;
				doAnswer();
				break;

			case 'pickup':
				console.log("recvd pickup");
				peerConn.setRemoteDescription(peerConn.SDP_ANSWER, new SessionDescription(sessionRequest.jsepdata));
				hisuid = sessionRequest.sndr;
				break;

			case 'canditate':
				console.log("recvd canditate");
				var canditate = new IceCandidate(sessionRequest.label, sessionRequest.cand);
				peerConn.processIceMessage(canditate);
				break;
		}
		return;
	}

	//open the websocket  to the antkorp webserver
	var sourcevid = null;
	var remotevid = null;
}); 
