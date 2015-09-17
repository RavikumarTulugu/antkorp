/**
 * @author Raju Konga
 */
define(
		"akpmedia",
		[ "jquery", "underscore", "backbone", "akpauth",
				"text!../templates.html", "plugins/gettheme",
				"plugins/jqx-all", "plugins/jquery-tmpl", "plugins/noty_full" ],
		function($, _, Backbone, auth, templates) {
			loader(10,"media Loaded");
			var peerConnCreated = false;
			var peerConn = null;
			var cameraOn = false;
			var svcName = "";
			var myname = "";
			var hisname = "";
			var iceStarted = false;
			var iceComplete = false;
			var callPending = false;
			var answerPending = true;
			var hisSdp = null;
			var sourcevid = null;
			var remotevid = null;
			var remotePeerClose = false;
			var mediaConstraints = {
				'has_audio' : true,
				'has_video' : true
			};
			var sdpConstraints = {'mandatory': {
				'OfferToReceiveAudio':true, 
					'OfferToReceiveVideo':true }};

			/*
			 * **************************************************************************************************************************************
			 * VIDEO CALL USING WEBRTC.
			 * ***************************************************************************************************************************************
			 */

			sourcevid = document.getElementById("sourcevid");
			remotevid = document.getElementById("remotevid");

			$('#rtcvideo').jqxWindow({
				height : 300,
				width : 320,
				minHeight : 100,
				maxHeight : 600,
				maxWidth : 500,
				theme : 'darkblue',
				autoOpen : false,
				showCollapseButton : true,
				resizable : true
			});

			$('#rtcvideo').bind('close', function(e) {
				if (!remotePeerClose)
					closePeerconnection();
			});

			function onIncomingVideoCall(msg_obj) {
				hisname = msg_obj.offer.sndr;
				var user = auth.getuserinfo(hisname);

				var html = $(
						"<div>You have been invited to video chat by </div>")
						.append(user.first_name);
				var members = $("<div/>").addClass("chatmembers").css({
					"height" : "auto",
					"border-bottom" : "none"
				});

				var img = $('<img />').attr({
					'src' : user.image_small || "css/images/user32.png",
					height : 32,
					width : 32
				});

				$('<div />').addClass('uimg').attr('data-uid', hisname).append(
						img).appendTo(members);

				html.append(members).append("Would you like to join?");

				noty({
					layout:"bottomRight",
					text : html,
					buttons : [ {
						addClass : 'btn btn-primary',
						text : 'Yes',
						onClick : function($noty){$noty.close(); acceptCall(msg_obj);}
					}, {
						addClass : 'btn btn-danger',
						text : 'No',
						onClick : function($noty){$noty.close(); rejectCall(hisname);}
					} ]
				});

			}

			function rejectCall(hisname) {
				// console.log("Video Chat request
				// rejected.");
				//$noty.close();

				var unique = akp_ws.createUUID();

				var rejectObj = {
					service : "rtc",
					mesgtype : "response",
					sndr : auth.loginuserid,
					rcpt : hisname,
					response : "drop",
					cookie : unique
				}

				akp_ws.send(rejectObj);
				// maptable[rejectObj.cookie] = "dropcall";

			}

			function acceptCall(msg_obj) {

				// console.log("Accepted the video chat
				// request.")
				//$noty.close();
				if (!peerConnCreated)
					createPeerConnection();
				if (!cameraOn)
					turnOnCameraAndMic();
				// hisSdp = new
				// SessionDescription(msg_obj.offer.jsepdata);
				var rsdesc = new RTCSessionDescription(msg_obj.offer.jsepdata);
				peerConn.setRemoteDescription(rsdesc);
				doAnswer();
			}

			function onIceCandidate(event) {
				if (event.candidate) {
					var jsonText = {

						"service" : "rtc",
						"mesgtype" : "event",
						"eventtype" : "candidate_event",
						"candobj" : {
							"sndr" : auth.loginuserid, // myname,
							"rcpt" : hisname,
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

			function setLocalAndSendMessageForCall(sessionDescription) {
				console.log("local session description");
				peerConn.setLocalDescription(sessionDescription);
				var call = {

					"service" : "rtc",
					"mesgtype" : "request",
					"request" : "call",
					offer : {
						"sndr" : auth.loginuserid,
						"rcpt" : hisname,
						"jsepdata" : sessionDescription
					}
				};
				akp_ws.send(call);
				// console.log(JSON.stringify(call));
				return;
			}

			function setLocalAndSendMessageForPickup(sessionDescription) {
				peerConn.setLocalDescription(sessionDescription);
				var pickup = {
					"service" : "rtc",
					"mesgtype" : "response",
					"response" : "pickup",
					answer : {
						"sndr" : auth.loginuserid,
						"rcpt" : hisname,
						"jsepdata" : sessionDescription
					}
				};
				akp_ws.send(pickup);
				// console.log(JSON.stringify(pickup));
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
				
				var user=auth.getuserinfo(hisname);
				$('#rtcvideo').jqxWindow({
					'title' : user.first_name
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
				var pc_config = {
					"iceServers" : [ {
						"url" : "stun:stun.l.google.com:19302"
					} ]
				};
				peerConn = new RTCPeerConnection(pc_config);
				peerConn.onconnecting = onSessionConnecting;
				peerConn.onopen = onSessionOpened;
				peerConn.onaddstream = onRemoteStreamAdded;
				peerConn.onremovestream = onRemoteStreamRemoved;
				peerConn.onerror = onPeerConnError;
				peerConn.onstatechange = onStateChange;
				peerConn.onicecandidate = onIceCandidate;
				peerConnCreated = true;
				// console.log("Created RTCPeerConnnection with config \""
				// + JSON.stringify(pc_config) + "\".");
				return;
			}

			function closePeerconnectionbyRemote() {
				$('#rtcvideo').jqxWindow('hide');
				peerConn.close();
				peerConn = null;
				peerConnCreated = false;
				cameraOn = false;
				iceStarted = false;
				iceComplete = false;
				callPending = false;
				answerPending = true;
				hisSdp = null;
				remotevid.src = "";
				sourcevid.src = "";
				console.log("peer connection closed by peer");
				return;
				
			}

			function closePeerconnection() {
				var unique = akp_ws.createUUID();
				var obj = {
					service : "rtc",
					mesgtype : "request",
					request : "bye",
					cookie : unique,
					sndr : auth.loginuserid,
					rcpt : hisname
				}
				akp_ws.send(obj);
				//maptable[obj.cookie] = "callCancel";

				peerConn.close();
				peerConn = null;
				peerConnCreated = false;
				cameraOn = false;

				iceStarted = false;
				iceComplete = false;
				callPending = false;
				answerPending = true;
				hisSdp = null;

				remotevid.src = "";
				sourcevid.src = "";
				console.log("peer connection closed.");
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
					console.error('An error occurred: [CODE ' + error.code
							+ ']');
				}

				return;
			}

			function doCall() {
				if (cameraOn) {
					peerConn.createOffer(setLocalAndSendMessageForCall, null, sdpConstraints);
				} else
					callPending = true;
				answerPending = false;
				return;
			}

			function doAnswer() {
				if (cameraOn) {
					//peerConn.createAnswer(setLocalAndSendMessageForPickup, null, mediaConstraints);
					peerConn.createAnswer(setLocalAndSendMessageForPickup, null, sdpConstraints);
				} else
					answerPending = true;
				return;
			}

			function dialUser(id) {
				// added on modification.XXX
				var user = auth.getuserinfo(id);
				var msg;
				if (user.status != "offline") {
					msg = 'Video chat invitation sent to ' + user.first_name
							+ '! </br> waiting for response...';
					if (!peerConnCreated)
						createPeerConnection();
					if (!cameraOn)
						turnOnCameraAndMic();
					hisname = user.uid;
					doCall();
				} else {
					msg = user.first_name
							+ ' is unavailable!. You cannot make call now...';
				}

				noty({
					layout:"bottomRight",
					text : msg,
					timeout : 3000,
					type:"error"
				});

				return;
			}

			function handleRtcMessage(msg) {
				// console.log("message Recieved from Rtc service:");
				// console.log(msg_obj);
				var mesgtype = msg.mesgtype;
				switch (mesgtype) {
				case "event":
					if (msg.eventtype == "new_media") {

						dialUser(msg.userid);
					} else if (msg.eventtype == "bye") {
						remotePeerClose = true;
						closePeerconnectionbyRemote();

					} else if (msg.eventtype == "drop") {

						noty({
							layout : 'bottomRight',
							theme : 'default',
							type : "error",
							text : usersList[msg.sndr].first_name + " declined your call. ",
						})

					} else if (msg.eventtype == "candidate_event") {
						console.log("recvd candidate");
						if (!answerPending) {
							var candidate = new RTCIceCandidate({
								sdpMLineIndex : msg.candobj.label,
								candidate : msg.candobj.cand
							});
							peerConn.addIceCandidate(candidate);
						} else {
							console.log("Cand dropped, reason: recvd before invite accept");
						}
					}
					break;
				case 'request':
					 console.log("recvng call");
					if (msg.request == "call") {
						if (!peerConnCreated)
							createPeerConnection();
						onIncomingVideoCall(msg);
					}
					break;

				case 'response':
					 console.log("recvd pickup");
					if (msg.response == "pickup") {
						console.log(msg.answer.jsepdata);
						var rsdesc = new RTCSessionDescription(msg.answer.jsepdata);
						peerConn.setRemoteDescription(rsdesc);
						hisname = msg.answer.sndr;
					}
					break;

				}
			}

			function handleMsg() {
				this.send = handleRtcMessage;
				this.onmessage = null
			}

			var rtc = new handleMsg;

			return rtc;

		});
