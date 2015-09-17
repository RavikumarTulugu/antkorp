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

/**
 * @fileOverview audio and video calls using Web RTC
 * @name akpmedia
 */
define(
		"akpmedia",
		[ "jquery", "underscore", "backbone", "akpauth", "akpcontacts",
				"plugins/peer", "plugins/jquery-tmpl", "plugins/noty_full" ],
		function($, _, Backbone, auth, users) {
			loader(10, "media Loaded");

			var cameraOn = false;
			var svcName = "";
			var myname = "";
			var hisname = "";
			var callPending = false;
			var answerPending = false;// XXX: change to true on real
			var hisSdp = null;
			var sourcevid = null;
			var remotevid = null;
			var remotePeerClose = false;
			var isFree = true;
			var sessionUser = undefined;

			var respondTime = 60 * 1000;
			var callWaitingTimer = "";
			var isAudioCall = false;
			var isVideoCall = false;
			var inviteCard = "";
			var mediaStatus = "";
			/*
			 * alternative image
			 */
			var alt_image_large = "css/images/stock_people.png";
			var alt_image_small = "css/images/user32.png";
			/*
			 * PeerConnections Manager, to store set of all online users peer
			 * connections.
			 */
			var peerManager = {};

			/*
			 * creating a new peer connection for all the online users
			 */
			users.bind("add", addPeer);

			/*
			 * create peer connection on status change if the user is available
			 */

			users.bind("statusChange", checkPeer);

			/*
			 * Creating Peer object on user available
			 */
			function addPeer(model) {

				var user = model.toJSON();
				if (user.status != "offline") {
					var peer = setPeer(user);
					peer.sendCall();

				}

			}

			/*
			 * Checking peerconnection on user status change
			 */
			function checkPeer(user) {

				if (peerManager[user.uid]) {
					// close peer connection on user offline
					if (user.status == "offline") {
						// close peer connection
						var peer = peerManager[user.uid];
						if (peer)
							peer.closePeerConnection();

						peerManager[user.uid] = null;
						// console.log("peer connection removed for user :" +
						// user.uid);
					}

					return;
				} else {
					// create peer connection for user available

					/*
					 * No need to create new peer connection because user will
					 * send call to all peers availbale
					 */

					// var peer = setPeer(user);
				}

			}

			function setPeer(user) {
				if (peerManager[user.uid])
					return peerManager[user.uid];

				var settings = {
					homeId : auth.loginuserid,
					id : user.uid,
					onAddStream : onRemoteStreamAdded,
					onRemoveStream : onRemoteStreamRemoved,
					onPeerMessage : handlePeerMessage,
					STUNURL : akp_ws.config.stun_server, // "stun:stun.l.google.com:19302"
				};
				if (user.autoOffer == false) {
					settings.autoOffer = true;
					;
				}

				var peer = new Peer(settings);
				peerManager[user.uid] = peer;
				// console.log("peer connection created for user :" + user.uid);
				// peer.createPeerConnection();
				// setChannel(peer);
				return peer;
			}

			// received msgs from peerconnections

			function handlePeerMessage(data, sender) {

				// var data=JSON.parse(evt.data);
				// console.log("other channel got message:"+data);
				if (data.eventtype == "fileXfer") {
					SaveAs(data.file);
				} else if (data.eventtype == "media") {
					onIncomingVideoCall(data.msg);
				} else if (data.eventtype == "IMmsg") {
					akp_ws.send2Service("rtc", data.msg, sender);
				}

			}

			// PeerEvent handling
			function PeerMessanger(msg) {
				if (msg.to instanceof Array) {

					// if Array send msg to list of users in array

					var group = msg.to;
					for ( var recpnt in group) {
						var status = this.send2Peer(group[recpnt], msg);
						this.handleEvents(group[recpnt], status, msg)
					}

				} else {
					// send msg to peer

					var status = this.send2Peer(msg.to, msg);
					this.handleEvents(group[recpnt], status, msg)
				}
			}
			PeerMessanger.prototype.handleEvents = function(uid, status, msg) {
				var self = this;
				setTimeout(function() {
					if (status) {
						if (typeof self.onsuccess === 'function') {
							self.onsuccess.call(this, {
								uid : uid,
								status : status,
								originalMsg : msg
							});
						}
					} else {
						if (typeof self.onerror === 'function') {
							self.onerror.call(this, {
								uid : uid,
								status : status,
								originalMsg : msg
							});
						}
					}
				}, 500);
			}

			PeerMessanger.prototype.send2Peer = function(user, msg) {
				var peer = peerManager[user];

				if (peer) {
					return peer.send(msg);

				}

				return false;
			}

			PeerMessanger.prototype.peerErrorHandler = function() {
				var msg = "Sorry! unable to send Message. Please refresh.."
				noty({
					layout : "bottomRight",
					text : msg,
					timeout : 3000,
					type : "information"
				});
			}

			/*
			 * ***************************************************************
			 * View
			 * ***************************************************************
			 */

			var PanelView = Backbone.View.extend({
				initialize : function() {
					this.model.bind("statusChange", this.handleStatusChange,
							this);
				},
				render : function() {

				},
				handleStatusChange : function(user) {
					if (user.status == "offline") {
						this.userDisconnected();
					}
				},
				userDisconnected : function() {
					if (isVideoCall) {
						$('#rtcvideo').removeClass("inProgress");
						this.setCallStatus("#rtcvideo", this.model
								.get("first_name")
								+ " disconnected.");
					} else if (isAudioCall) {

					}
				},
				setCallStatus : function(el, msg) {
					$(el).find(".callStatus").show("slideUp").html(msg);
				},
				reset : function() {
					isFree = true;
					mediaStatus = "free";
					callPending = false;
					answerPending = true;
					sessionUser = "";
					remotePeerClose = false;
				}
			});

			/*
			 * **************************************************************************************************************************************
			 * VIDEO CALL USING WEBRTC.
			 * ***************************************************************************************************************************************
			 */
			
			/*
			 * on dial user handle "close", "end Call", "accept", "decline", "remote close" and "not Responding"
			 * 1. on close 
			 * 		I.  close the dialog
			 * 		II. send bye to client
			 * 		III.and reset
			 * 
			 * 2. on End call
			 * 		I.  show as disconnected and show close
			 * 		II. send bye to client
			 * 		III.and reset
			 * 3. on Accept
			 * 		I. Change it to show Video and add disconnect
			 * 			on disconnect : a.   
			 * 
			 */
			
			/*
			 * on incoming handle "accept", "reject" , "close"  and "no response"
			 */
			
			
			
			
			
			// For Video call
			sourcevid = document.getElementById("sourcevid");
			remotevid = document.getElementById("remotevid");

			$('#rtcvideo').dialog({
				// height : 300,
				width : 320,
				minHeight : 300,
				maxHeight : 600,
				maxWidth : 500,
				// theme : 'darkblue',
				autoOpen : false,
				closeOnEscape : false,
				// showCollapseButton : true,
				resizable : true,
				close : vidClose,
				title : "Video Call..",
			});

			/*
			 * $('#rtcvideo').bind('close', function(e) { if (!remotePeerClose)
			 * terminateCall(); });
			 */

			function vidClose(e) {
				if (!remotePeerClose)
					terminateCall();
			}

			// For Audio Call
			sourceVoice = document.getElementById("sourceVoice");
			remoteVoice = document.getElementById("remoteVoice");

			$('#rtcaudio').dialog({
				// height : 300,
				width : 320,
				minHeight : 300,
				maxHeight : 600,
				maxWidth : 500,
				// theme : 'darkblue',
				autoOpen : false,
				// showCollapseButton : true,
				closeOnEscape : false,
				resizable : true,
				close : audClose,
				title : "Voice Call..",
			});

			/*
			 * $('#rtcaudio').bind('close', function(e) { if (!remotePeerClose)
			 * terminateCall(); });
			 */

			function audClose(e) {
				if (!remotePeerClose)
					terminateCall();
			}

			$('#rtcaudio').find(".actionSection").hide();
			$('#rtcvideo').find(".actionSection").hide();

			// handle Disconnect events
			$('#rtcaudio').find(".disconnect").bind("click",
					handleAudioCallDisconnect);
			$('#rtcvideo').find(".disconnect").bind("click",
					handleVideoCallDisconnect);

			function handleAudioCallDisconnect() {
				setCallStatus("disconnect");
				audClose();
			}

			function handleVideoCallDisconnect() {
				setCallStatus("disconnect");
				vidClose();
			}

			
			// handle on incoming call

			function onIncomingVideoCall(msg_obj) {
				
				
				hisname = msg_obj.caller;

				var user = auth.getuserinfo(hisname);
				var type = msg_obj.audioonly;
				
				var html;
				mediaStatus = "incoming";
				if (type) {
					isAudioCall = true;
					html = $(
							"<div>You have been invited to Voice chat  by </div>")
							.append(user.first_name);
					akp_ws.notifyOnHidden("Voice call from "+ user.first_name +"!");
				} else {
					isVideoCall = true;
					html = $(
							"<div>You have been invited to Video chat by </div>")
							.append(user.first_name);
					akp_ws.notifyOnHidden("Video conference invitation from "+ user.first_name +"!");
				}
				
				
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

				showInvitation(html, msg_obj, type);

			}

			function showInvitation(html, msg_obj, type) {


				hisname = msg_obj.caller;

				var user = auth.getuserinfo(hisname);
				setCallStatus("incoming", auth.getuserinfo(msg_obj.caller));
				startWaiting(msg_obj.caller);
			}

			function startWaiting(caller) {
				callWaitingTimer = setTimeout(function() {
					dropCall(caller);
					closeDialog();
				}, respondTime);
			}

			function dropCall(caller, type) {
				mediaStatus = "free";
				var peer = peerManager[caller];
				if (peer)
					peer.dropCall(type);

				clearTimeout(callWaitingTimer);
			}

			function acceptCall(msg_obj, type) {

				// console.log("Accepted the video chat request.")
				clearTimeout(callWaitingTimer);
				setCallStatus("Please wait initializing ...", auth
						.getuserinfo(msg_obj.caller));
				// turnOnCameraAndMic(msg_obj.sndr,"offer");
				var peer = peerManager[msg_obj.caller];
				if (peer) {
					peer.liftCall(type);
					isAudioCall = type;
				}
				sessionUser = msg_obj.caller;

				var userModel = users.getModelByUid(msg_obj.caller);
				if (userModel)
					var panelView = new PanelView({
						model : userModel
					});

			}

			// handle streams add and remove

			function onRemoteStreamRemoved(event) {
				// console.log("Remote stream removed");
				remotevid.src = "";
				remotePeerClose = true;
				closePeerconnectionbyRemote();
				return;
			}

			function onRemoteStreamAdded(event, caller) {
				mediaStatus = "inCall";
				// console.log("Remote stream added");
				var stream = event.stream;
				var hasVideo = stream.getVideoTracks().length;
				// console.log("Video Tracks count in stream : "+ hasVideo);
				if (!hasVideo) {
					// console.log("this is audio call");
					remoteVoice.src = window.webkitURL.createObjectURL(stream);
					animateAudioStream(stream);
					/*
					 * $('#rtcaudio').jqxWindow('show');
					 * $('#rtcaudio').jqxWindow({ position : getPosition() });
					 */

					$('#rtcaudio').dialog('open');

					$('#rtcaudio').find(".actionSection").show("slideUp");
					$('#rtcaudio').find(".rtcvidnotifier").hide("slideDown");
					$('#rtcaudio').find(".remoteauduser").attr(
							"src",
							auth.getuserinfo(caller).image_large
									|| alt_image_large)

				} else {
					// console.log("this is video call");
					remotevid.src = window.webkitURL.createObjectURL(stream);
					/*
					 * $('#rtcvideo').addClass("inProgress").jqxWindow('show');
					 * $('#rtcvideo').jqxWindow({ position : getPosition() });
					 */
					$('#rtcvideo').addClass("inProgress").dialog('open');

					$('#rtcvideo').find(".actionSection").show("slideUp");
					$('#rtcvideo').find(".rtcvidnotifier").hide("slideDown");

					remotevid.style.opacity = 1;
				}
				return;
			}

			function getPosition() {
				var offset = $("body").offset();
				return {
					y : offset.top + 200,
					x : offset.left + 300
				}
			}

			// Ending call

			function reset() {

				isFree = true;
				mediaStatus = "free";
				callPending = false;
				answerPending = true;
				sessionUser = "";
				remotePeerClose = false;

				if (isVideoCall) {
					remotevid.src = "";
					sourcevid.src = "";
					isVideoCall = false;
				} else if (isAudioCall) {
					remoteVoice.src = "";
					sourceVoice.src = "";
					isAudioCall = false;

				}

				$('#rtcaudio').find(".actionSection").hide().end().find(
						".rtcvidnotifier").show();
				$('#rtcvideo').removeClass("inProgress").find(".actionSection")
						.hide().end().find(".rtcvidnotifier").show().end()
						.find("callStatus").hide();

			}
			function closeDialog() {
				if (isVideoCall)
					// $('#rtcvideo').jqxWindow('hide');
					$('#rtcvideo').dialog('close');
				else if (isAudioCall)
					// $('#rtcaudio').jqxWindow('hide');
					$('#rtcaudio').dialog('close');
			}

			function terminateCallbyRemote() {

				remotePeerClose = true;

				setCallStatus("remoteDisconnect");
				// closeDialog();

				// console.log("peer connection closed by peer. bye recieved");

				endStreams(sessionUser);
				reset();
				return;

			}


			function terminateCall() {
				if (mediaStatus == "inCall" || mediaStatus == "dialing") {
					var unique = akp_ws.createUUID();
					var obj = {
						service : "rtc",
						mesgtype : "request",
						request : "bye",
						cookie : unique,
						sndr : auth.loginuserid,
						rcpt : sessionUser
					}
					akp_ws.send({
						data : obj
					});
					// console.log("peer connection closed. bye send");

					endStreams(sessionUser);
					reset();
				}
				// remotePeerClose=true;

				return;

			}

			function endStreams(user) {
				var peer = peerManager[user];

				if (peer) {
					peer.isConnected = false;
					peer.removeMedia();
				}
			}

			// Initializing Camera and microphone

			function turnOnCameraAndMic(peerId, action, audioonly) {
				remotePeerClose = false;
				mediaStatus = "inCall";
				var peer = peerManager[peerId];

				var streamConstraints = {
					video : true,
					audio : true
				};

				if (audioonly) {
					streamConstraints.video = false;
				} else {
					streamConstraints.video = true;
				}

				navigator.webkitGetUserMedia(streamConstraints,	successCallback, errorCallback);
				function successCallback(stream) {

					peer.addMedia(stream);
					if (audioonly) {
						sourceVoice.src = window.webkitURL	.createObjectURL(stream);
						$('#rtcaudio').find(".actionSection").show("slideUp");
						$('#rtcaudio').find(".rtcvidnotifier").hide("slideDown");
						$('#rtcaudio').dialog('option', 'buttons', {});
					} else {
						sourcevid.style.opacity = 1;
						sourcevid.src = window.webkitURL.createObjectURL(stream);
						$('#rtcvideo').find(".actionSection").show("slideUp");
						$('#rtcvideo').find(".rtcvidnotifier").hide("slideDown");
						$('#rtcvideo').dialog('option', 'buttons', {});
					}
					
					cameraOn = true;

					if (action == "offer") {

						peer.sendCall();
						// console.log("offer send");
					} else if (action == "answer") {

						peer.answerCall();
						// console.log("answer send");
					}

				}

				function errorCallback(error) {
					console.error('An error occurred: [CODE ' + error.code
							+ ']');
				}

				return;
			}

			function doCall(peer) {
				if (cameraOn) {
					peer.sendCall();

				} else
					callPending = true;
				answerPending = false;
				return;
			}

			function doAnswer(peer) {
				if (cameraOn) {

					peer.answerCall();
				} else
					answerPending = true;
				return;
			}

			function setCallStatus(status, user) {
				var el = "";
				if (isVideoCall) {
					el = "#rtcvideo";
				} else if (isAudioCall) {
					el = "#rtcaudio";
				}

				/*
				 * $(el).jqxWindow('show'); $(el).jqxWindow({ position :
				 * getPosition() });
				 */

				$(el).dialog('open');

				if (user) {
					var img = user.image_large || alt_image_large;
					$(el).find(".rtcvidstillimg").attr("src", img);

				}

				if (status == 'incoming') {
					$(el).find(".status").html("Incoming Call...");
					showChoices(el, user, isAudioCall);
					
				} else if(status == 'disconnect'){
					$(el).find(".status").html("Call Disconnected.");
					//showCloseDialog(el, user, isAudioCall);
				}else if (status == 'remoteDisconnect') {
					$(el).find(".status").html("Call Disconnected.");
					showEndCall(el, user, isAudioCall);
				} else if (status == 'busy') {
					$(el).find(".status").html("Dailer seems busy, <br/> Please try again later!.");
					showEndCallWithTerminate(el, user, isAudioCall);
				} else if (status == "calling") {
					$(el).find(".status").html("Calling...");
					showEndCallWithTerminate(el, user, isAudioCall);
				} else if (status) {
					$(el).find(".status").html(status);
				} else {
					$(el).find(".status").html("Calling..");
				}

			}
			
			function showCloseDialog(el, user, type) {
				var buttons = [ {
					"class" : 'btn btn-danger btn-block',
					text : 'Close',
					click : function() {
						$(this).dialog('option', 'buttons', {});
						$(this).dialog("close");
					}
				} ];

				$(el).dialog('option', 'buttons', buttons);
			}
			

			function showEndCall(el, user, type) {
				var buttons = [ {
					"class" : 'btn btn-danger btn-block',
					text : 'End Call',
					click : function() {
						$(this).dialog('option', 'buttons', {});
						$(this).dialog("close");
					}
				} ];

				$(el).dialog('option', 'buttons', buttons);
			}
			function showEndCallWithTerminate(el, user, type){
				var buttons = [ {
					"class" : 'btn btn-danger btn-block',
					text : 'End Call',
					click : function() {
						terminateCall()
						$(this).dialog('option', 'buttons', {});
						$(this).dialog("close");
					}
				} ];

				$(el).dialog('option', 'buttons', buttons);
			}

			function showChoices(el, user, type) {

				var buttons = [ {
					"class" : 'btn btn-success',
					text : 'Accept',
					click : function() {

						acceptCall({
							caller : user.uid
						}, type);
						$(this).dialog('option', 'buttons', {});
						// $(this).dialog("close");
					}
				}, {
					"class" : 'btn btn-danger',
					text : 'Decline',
					click : function() {

						dropCall(user.uid, type);
						$(this).dialog('option', 'buttons', {});
						$(this).dialog("close");

					}
				} ];

				$(el).dialog('option', 'buttons', buttons);

			}

			function dialUser(id, calltype) {
				// added on modification.XXX
				var user = auth.getuserinfo(id);
				var obj = {
					layout : "bottomRight",
				}, msg, type, closable;
				if (user.status != "offline") {
					if (isFree) {

						isFree = false;
						mediaStatus = "dialing";
						sessionUser = id;
						if (calltype == "audio")
							isAudioCall = true;
						else
							isVideoCall = true;

						setCallStatus("calling", user);

						var peer = peerManager[id];
						if (calltype == "audio")
							peer.makeCall({
								"audio" : true
							});
						else
							peer.makeCall();

						/*
						 * rtc.send({ mesgtype:"peerEvent", to:id,
						 * eventtype:"media", msg:{ sndr:auth.loginuserid } })
						 */

					} else {
						obj.text = "Please close existing conference. to make new call.";
						obj.type = "warning";
						obj.timeout = "3000";
						inviteCard = noty(obj);
					}

				} else {
					obj.text = user.first_name
							+ ' is unavailable!. You cannot make call now...';
					obj.type = "information";
					obj.timeout = "3000";

					inviteCard = noty(obj);
				}

				return;
			}

			function handleCallDrop(msg) {

				setCallStatus("busy");
				mediaStatus = "busy";

			}

			function handleRtcMessage(msg) {
				// console.log("message Recieved from Rtc service:");
				// console.log(msg_obj);
				var mesgtype = msg.mesgtype;
				switch (mesgtype) {
				case "event":
					if (msg.eventtype == "new_media") {

						if (msg.audio)
							dialUser(msg.userid, "audio");
						else
							dialUser(msg.userid);

					} else if (msg.eventtype == "bye") {

						terminateCallbyRemote();

					} else if (msg.eventtype == "drop") {

						handleCallDrop(msg)

					} else if (msg.eventtype == "candidate_event") {
						// console.log("recvd candidate");
						if (!answerPending) {

							var peer = peerManager[msg.candobj.sndr];
							if (peer)
								peer.addIceCandidate(msg.candobj.label,
										msg.candobj.cand);

						} else {
							// console .log("Cand dropped, reason: recvd before
							// invite accept");
						}
					}
					break;
				case 'request':
					// console.log("recvng call");
					if (msg.request == "call") {
						onIncomingVideoCall(msg.call);

					} else if (msg.request == "offer") {
						var peer = peerManager[msg.offer.sndr];
						if (!peer) {
							peer = setPeer({
								uid : msg.offer.sndr
							});

						}
						peer.setRemoteDescription(msg.offer.jsepdata);
						if (peer.isConnected) {
							turnOnCameraAndMic(msg.offer.sndr, "answer",
									isAudioCall);
							sessionUser = msg.offer.sndr;
							// console.log("camera stream opened and answered");
						} else {
							peer.answerCall();
						}
					}
					break;

				case 'response':
					// console.log("recvd pickup");
					if (msg.response == "pickup") {
						setCallStatus("Please accept to proceed!")
						turnOnCameraAndMic(msg.pickup.callee, "offer",
								msg.pickup.audioonly);

					} else if (msg.response == "answer") {
						var peer = peerManager[msg.answer.sndr];
						if (peer)
							peer.setRemoteDescription(msg.answer.jsepdata)
					}
					break;

				case "peerEvent":

					return new PeerMessanger(msg);

					break;

				}
			}
			
			
			

			/*
			 * Audio Stream Animation
			 */

			var canvas = document.getElementById('rtcaudvlzr');
			var ctx = canvas.getContext('2d');
			canvas.width = 300;

			var context = new webkitAudioContext();
			var analyser = context.createAnalyser();

			const
			CANVAS_HEIGHT = canvas.height;
			const
			CANVAS_WIDTH = canvas.width;

			function animateAudioStream(stream) {

				var source = context.createMediaStreamSource(stream);
				source.connect(analyser);
				analyser.connect(context.destination);

				rafCallback();
			}

			function rafCallback(time) {
				window.webkitRequestAnimationFrame(rafCallback, canvas);

				var freqByteData = new Uint8Array(analyser.frequencyBinCount);
				analyser.getByteFrequencyData(freqByteData); // analyser.getByteTimeDomainData(freqByteData);

				var SPACER_WIDTH = 10;
				var BAR_WIDTH = 2;
				var OFFSET = 100;
				var CUTOFF = 23;
				var numBars = Math.round(CANVAS_WIDTH / SPACER_WIDTH);

				ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
				ctx.fillStyle = '#F6D565';
				ctx.lineCap = 'round';

				for ( var i = 0; i < numBars; ++i) {
					var magnitude = freqByteData[i + OFFSET];
					ctx.fillRect(i * SPACER_WIDTH, CANVAS_HEIGHT, BAR_WIDTH,
							-magnitude - 10);

				}
			}

			/*
			 * end animating stream
			 */

			// handling RTC media service msgs
			function handleMsg() {
				this.send = handleRtcMessage;
				this.onmessage = null
			}

			var rtc = new handleMsg;

			return rtc;

		});
