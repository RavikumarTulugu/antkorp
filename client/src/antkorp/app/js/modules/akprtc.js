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
 * @fileOverview Instant Messaging using Web RTC Datachannel
 * @name akprtc
 */

/**
 * @author Raju K
 */
define(
		"akprtc",
		[ "jquery", "underscore", "backbone", "akpauth", "akpmedia",
				"akpcontacts", "akputils", //"plugins/gettheme", "plugins/jqxcore","plugins/jqxwindow",
				"plugins/jquery-tmpl" ],
		function($, _, Backbone, auth, media, users,utils) {
			loader(10, "rtc Loaded");

			var alt_image_small = "css/images/user32.png";
			var baseModel = Backbone.Model.extend({
				offRecord : false,
				defaults : {
					service : "rtc",
					isSelected : false,
				},
				initialize : function() {
					this.bind("select", this.select, this);
					this.bind("unselect", this.unselect, this);
					this.bind("addParticipants", this.addParticipants, this);
				},
				select : function() {
					collection.unselect();
					this.set({
						isSelected : true
					})
				},
				unselect : function() {
					this.set({
						isSelected : false
					})
				},
				addParticipants : function(newList) {
					var oldList = this.get("participants");

					var current = _.difference(newList, oldList);

					this.set({
						"participants" : newList
					});

					if (current.length)
						this.trigger("addParticipant", current);

				},
				changeStatus : function(msg) {
					this.trigger("changeStatus", msg.status,msg.statusType);
				}

			});

			var baseCollection = Backbone.Collection.extend({
				model : baseModel,
				maptable : {},
				initialize : function() {
					_.bindAll(this, "getModel")
					this.bind("newmsg", this.handleNewMsg, this);
					this.bind("newchat", this.handleChatReq, this);
					this.bind("remove", this.handleChatClose, this);
					this.bind("change", this.handleSelect, this);
					this.bind("confJoin", this.handleConf, this);

				},
				handleSelect : function(model) {
					var diff = model.changedAttributes();
					for ( var att in diff) {
						switch (att) {
						case 'distroy':
							if (model.get(att)) {
								this.remove(model.cid);
							}
							break;
						}
					}
				},
				unselect : function() {
					this.filter(function(model) {
						if (model.get("isSelected") == true) {
							model.trigger("unselect");
						}

					})
				},
				checklist : function(arrA, arrB) {

					if (arrA.length !== arrB.length)
						return false;
					var cA = arrA.slice().sort().join("");
					var cB = arrB.slice().sort().join("");
					return cA === cB;
				},
				handleConf : function(join) {
					var p = join.participants;
					p.push(join.invitee);
					var data = {
						uid : join.participants[0],
						sessionid : join.sessionid,
						participants : p
					}

					this.handleNewMsg(data);
				},

				handleChatReq : function(uid) {
					var msg = {
						participants : [ auth.loginuserid, uid ],
						sessionid : akp_ws.createUUID()
					}
					this.handleNewMsg(msg);
				},

				handleChatClose : function() {
					if (this.isEmpty())
						this.trigger("empty");
					else {
						var model = this.first();
						model.trigger("select");
					}
				},
				getSelectedModel : function() {
					var list = [];
					list = this.where({
						"isSelected" : true
					});

					return list[0];
				},
				getModel : function(msg) {
					var model;
					var self = this;
					// var smodel = self.get(msg.sessionid);

					var smodel = self.filter(function(model) {
						return model.get("sessionid") === msg.sessionid;
					});

					if (smodel.length) {
						model = smodel;
						var matchParticipants = self.checklist(model[0]
								.get("participants"), msg.participants);
						if (!matchParticipants) {
							model[0].trigger("addParticipants",
									msg.participants);
						}

					} else {
						model = self.filter(function(model) {
							return self.checklist(model.get("participants"),
									msg.participants);
						});
					}
					if (model.length)
						return model[0];
					else
						return false;
				},
				handleNewMsg : function(msg) {
					var model = this.getModel(msg)
					if (model)
						model.trigger("msgarrived", msg)
					else
						this.add(msg)

				},
				mapReq : function(cookie, sessionid) {
					this.maptable[cookie] = sessionid;
				},
				mapSession : function(cookie) {
					if (this.maptable[cookie])
						return this.maptable[cookie];
					return false
				},
				getModelBySessionId : function(sessionid) {
					var models = this.where({
						sessionid : sessionid
					});
					if (models[0])
						return models[0];
				},
				handleStatus : function(msg) {
					var model = this.getModel(msg);
					if (model)
						model.changeStatus(msg);
				}
			});

			var ChatWindow = Backbone.View
					.extend({
						el : $(".chatwnd"),
						events : {
							"click .chatact" : "toggleWindow",
							"keypress .chatip" : "sendMessage"
						},
						settings : {
							transporter : "webrtc", // values : server or webrtc
							statusUpdated : false,
						},
						initialize : function() {
							_.bindAll(this, "setOffRecord");

							this.collection.bind("add", this.newChatMsg, this);
							this.collection.bind("empty", this.hide, this);
							this.collection.bind("remove", this.decWidth, this);
							this.collection.bind("confInviteReq",
									this.handleConfInviteReq, this);
							this.collection.bind("confInvite",
									this.handleInvite, this);
							this.collection.bind("offRecord",
									this.setOffRecord, this);
							// this.collection.bind("confJoin",this.userConfJoinUpdate,this)
							this.isOpen = false;
							this.minimized = false;

						},
						render : function() {

						},
						setOffRecord : function(offRecordSession) {
							var model = this.collection
									.handleNewMsg(offRecordSession);

							/*
							 * if(model)
							 * model.trigger("setOffRecord",offRecordSession.status);
							 */
						},
						handleInvite : function(invite) {
							var reqsender = auth.usersList[invite.inviter].first_name;

							var html = $(
									"<div>You have been invited to the conference by </div>")
									.append(reqsender).append(
											" .<br/> Members: <br/>");
							var members = $("<div/>").addClass("chatmembers")
									.css({
										"height" : "auto",
										"border-bottom" : "none"
									});

							for ( var i = 0; i < invite.participants.length; i++) {

								var userid = invite.participants[i];

								var img = $('<img />')
										.attr(
												{
													'src' : auth.usersList[userid].image_small
															|| "css/images/user32.png",
													height : 32,
													width : 32
												});

								$('<div />').addClass('uimg').attr('data-uid',
										userid).append(img).appendTo(members);
							}

							html.append(members).append(
									"<br/>Would you like to join?");

							var self = this;

							noty({
								layout : 'bottomRight',
								theme : 'default',
								text : html,
								buttons : [
										{
											addClass : 'btn btn-primary',
											text : 'Yes',
											onClick : function($noty) {
												self.chatInviteResponse(invite,
														true, "");
												$noty.close();

											}
										},
										{
											addClass : 'btn btn-danger',
											text : 'No',
											onClick : function($noty) {
												self.chatInviteResponse(invite,
														false, "")
												$noty.close();

											}
										} ]
							});
						},

						chatInviteResponse : function(msg, response, reason) {

							var req_obj = {

								service : "rtc",
								mesgtype : "response",
								request : "text_con_invite_accept",
								accept : {
									sessionid : msg.sessionid,
									participants : msg.participants,
									inviter : msg.inviter,
									invitee : msg.invitee,
									accepted : response,
									reason : reason,
								}
							}

							// console.log("Chat invitaion response sent.");
							// akp_ws.send(req_obj);
							// console.log(req_obj);
							this.useTransporter(req_obj);

							if (!response)
								return;

							/*
							 * start chat with new members.
							 */

							var data = {
								uid : msg.participants[0],
								sessionid : msg.sessionid,
								participants : msg.participants
							}

							this.collection.handleNewMsg(data);

						},
						handleSendFail:function(resp){
							//console.log("msg failed");
							var model=this.collection.getModel(resp.orginalMsg.msg.imsg);
							if(model)
							model.changeStatus({status:"Failed to send messages."});
						},
						handleSendSuccess:function(resp){
							//console.log("sendSuccess");
							//console.log(resp);
						},
						sendMessage : function(e) {
							if (e.which == 13) {

								this.settings.statusUpdated = false;
								this.sendStatus(auth.activeuser.first_name+ " messaged.");

								var msg = $(e.target).text();
								var model = this.collection.getSelectedModel();

								var cookie = model.get("sessionid");
								var members = model.get("participants");
								var date = new Date();
								var time = date.getTime();

								var send_imsg = {
									content : utils.htmlEscape(utils.linkify(msg.replace(
											/[\x00-\x1F\x80-\xFF]/g, ""))),
									sessionid : cookie,
									participants : members,
									timestamp : time,
								}
								var send_obj = {
									uid : auth.loginuserid,
									service : "rtc",
									mesg_type : "request",
									request : "send_imsg",
									imsg : send_imsg
								}
								// console.log(send_obj);
								// akp_ws.send(send_obj);
								var sentObj=this.useTransporter(send_obj, model);
								sentObj.onerror=this.handleSendFail;
								sentObj.onsuccess=this.handleSendSuccess;
								$(e.target).empty();
								
								
								
								return sentObj;
							} else {
								if (this.settings.statusUpdated)
									return;

								this.sendStatus(auth.activeuser.first_name
										+ " is typing..","typing");
								this.settings.statusUpdated = true;

							}
						},
						sendStatus : function(msg,type) {
							var model = this.collection.getSelectedModel();
							var cookie = model.get("sessionid");
							var members = model.get("participants");

							var statusmsg = {
								status : msg.replace(/[\x00-\x1F\x80-\xFF]/g,
										""),
								sessionid : cookie,
								participants : members,
								statusType:type,
							}

							var send_obj = {
								uid : auth.loginuserid,
								service : "rtc",
								mesgtype : "request",
								request : "send_istatus",
								istatus : statusmsg,
							}
							this.useTransporter(send_obj, model);
						},
						useTransporter : function(msg, model) {
							if (this.settings.transporter == "webrtc") {
								if (msg.mesg_type == "request"
										&& msg.request == "send_imsg") {
									var serv_msg = msg;
									var members = this
											.checkAvailable(msg.imsg.participants);
									var msg = this.parseReq(msg);
									msg.offRecord = model.get("offRecord");
									var obj = {
										to : members,
										mesgtype : "peerEvent",
										eventtype : "IMmsg",
										msg : msg
									}

									// Render message on own peer
									handleRtcMessage(msg);

									if (!model.get("offRecord")) {
										serv_msg.request = "im_log";
										// log history
										akp_ws.send({data:serv_msg});
									}

									// console.log("RTC History log request
									// sent");
									// console.log(serv_msg);
									if (!members.length)
										return false;
									// send to the IM participants

									var msgObj = akp_ws.sendPeer(obj);
									return msgObj;

								} else if (msg.mesgtype == "request"
										&& msg.request == "send_istatus") {
									var serv_msg = msg;
									var members = this
											.checkAvailable(msg.istatus.participants);
									var msg = this.parseReq(msg);
									var obj = {
										to : members,
										mesgtype : "peerEvent",
										eventtype : "IMmsg",
										msg : msg
									}

									if (!members.length)
										return false;

									var msgObj = akp_ws.sendPeer(obj);
									

								} else if (msg.mesgtype == "request"
										&& msg.request == "text_con_invite") {
									var members = this
											.checkAvailable(msg.invite.participants);
									var msg = this.parseReq(msg);
									var obj = {
										to : msg.invite.invitee,
										mesgtype : "peerEvent",
										eventtype : "IMmsg",
										msg : msg
									}
									if (!members.length)
										return;

									var msgObj = akp_ws.sendPeer(obj);
								} else if (msg.mesgtype == "response"
										&& msg.request == "text_con_invite_accept") {
									var members = this
											.checkAvailable(msg.accept.participants);
									var msg = this.parseReq(msg);
									var obj = {
										to : msg.accept.inviter,
										mesgtype : "peerEvent",
										eventtype : "IMmsg",
										msg : msg
									}
									if (!members.length)
										return;

									var msgObj = akp_ws.sendPeer(obj);
									if (msg.accept.accepted) {
										var joinObj = {
											mesgtype : "event",
											eventtype : "user_join_text_con",
											join : {
												invitee : msg.accept.invitee,
												participants : msg.accept.participants,
												sessionid : msg.accept.sessionid
											}
										}
										var sendobj = {
											to : joinObj.join.participants,
											mesgtype : "peerEvent",
											eventtype : "IMmsg",
											msg : joinObj
										}
										var sendmsgObj = akp_ws
												.sendPeer(sendobj);

									}

								}
								// msgObj.onerror=this.showStatus;
								// msgObj.onsuccess=this.showStatus;
							} else if (this.settings.transporter == "server") {
								akp_ws.send({data:msg});
							}
						},
						parseReq : function(msg) {
							if (msg.mesg_type == "request"
									&& msg.request == "send_imsg") {
								delete msg.mesg_type;
								delete msg.request;
								msg.mesgtype = "event";
								msg.eventtype = "new_imsg";
								msg.imsg.sender = auth.loginuserid// sender;
								msg.checked = true;
								return msg;

							} else if (msg.mesgtype == "request"
									&& msg.request == "send_istatus") {
								delete msg.mesg_type;
								delete msg.request;
								msg.mesgtype = "event";
								msg.eventtype = "istatus";
								return msg;
							} else if (msg.mesgtype == "request"
									&& msg.request == "text_con_invite") {
								delete msg.request;
								msg.mesgtype = "event";
								msg.eventtype = "text_con_invite";
								return msg;
							} else if (msg.mesgtype == "response"
									&& msg.request == "text_con_invite_accept") {
								delete msg.request;
								msg.mesgtype = "event";
								msg.eventtype = "text_con_invite_accept";
								return msg;
							}

						},
						checkAvailable : function(participants) {
							var available = [];
							for ( var i = 0; i < participants.length; i++) {
								var user = auth.getuserinfo(participants[i]);
								if (user.status == "online"
										|| user.status == "available") {
									available.push(user.uid);
								}
							}
							return available;
						},
						handleConfInviteReq : function(sid, uid, group) {

							// this.collection.trigger("confInvite",sid,uid,group);
							var req_obj = {

								service : "rtc",
								mesgtype : "request",
								request : "text_con_invite",
								invite : {
									sessionid : sid,
									participants : group,
									inviter : auth.loginuserid,
									invitee : uid,
									desc : "",
								}
							}

							// console.log("Chat invitaion request send to :" +
							// usersList[uid].first_name);
							// akp_ws.send(req_obj);
							// console.log(req_obj);
							this.useTransporter(req_obj);

						},
						showStatus : function(status) {

						},
						newChatMsg : function(model) {
							if (!this.isOpen)
								this.open();

							var msg = model.toJSON();
							var author = new chatauthor({
								model : model,
								collection : this.collection
							});
							var content = new chatroom({
								model : model,
								collection : this.collection
							});
							this.$(".chatlist").append(author.render().el);
							this.$("#chatroom").append(content.render().el);
							model.trigger("select");

							this.incWnd();
						},
						incWnd : function() {
							var w = this.$el.width();
							this.$el.css('width', w + 50 + "px");
						},
						decWidth : function() {
							var w = this.$el.width();
							this.$el.css('width', w - 50 + "px");
						},
						open : function() {
							if (!this.isOpen) {
								$('.chatwnd').show();
								this.isOpen = true;
							}
							if (!this.minimized)
								this.restore();

						},
						hide : function() {
							this.$el.hide();
							this.isOpen = false;
						},
						toggleWindow : function(e) {
							$('.chatwnd').toggleClass('chatwndmin');

							if ($('.chatwnd').hasClass('chatwndmin'))
								this.minimize()
							else
								this.restore();

							$(e.target).toggleClass('chatactmax');
						},
						minimize : function() {

							$('.chatwnd').css('height', '30px');
							$('.chatwnd').children('.chatroom, .chatip').hide();
							this.minimized = true;
						},
						restore : function() {
							$('.chatwnd').css('height', "350px");
							$('.chatwnd').children('.chatroom, .chatip').show();
							this.minimized = false;
						},

					});

			var chatauthor = Backbone.View
					.extend({
						tagName : "li",
						className : "chatter",
						events : {

							"click" : "getFocus",
							"click .chatend" : "closeChat"
						},
						initialize : function() {
							this.model.bind("chatEnd", this.distroy, this);
							this.model.bind("remove", this.remove, this);
							this.model.bind("select", this.select, this);
							this.model.bind("unselect", this.unselect, this);

							var model = this.model.toJSON();
							var sender = this.getSender(model);
							var template = '<span class="chatname"> '
									+ sender.first_name
									+ '</span><span class=" chatend akorp-icon akorp-icon-close"></span>'
							this.$el.append(template);

						},
						select : function() {
							this.$el.addClass("chatteractive");
						},
						unselect : function() {
							this.$el.removeClass("chatteractive");
						},
						getFocus : function() {

							this.model.trigger("select")

						},
						getSender : function(msg) {
							var sender;

							if (msg.sender)
								sender = msg.sender
							else {
								var members = msg.participants;
								for ( var i = 0; i < members.length; i++) {
									if (members[i] != auth.loginuserid) {
										sender = members[i];
										break;
									}

								}
							}
							return auth.getuserinfo(sender);
						},
						closeChat : function(e) {
							e.stopPropagation();
							this.model.trigger("chatEnd");
						},
						distroy : function() {
							this.model.set({
								distroy : true
							});
						},
						remove : function() {
							this.$el.remove();

						},
						render : function() {
							return this;
						}
					});

			var chatroom = Backbone.View
					.extend({
						className : "chatboard",
						settings : {
							lastTop : "",
							marker : "",
							autoload : true,
							loadCount : 0,
						// offRecord:false,
						},
						events : {
							"click .chatinvite" : "inviteMembers",
							"click .chatOff" : "offRecord",
							"click .chatDel" : "deleteMessages",
						},
						initialize : function() {

							_.bindAll(this, "onDropped", "getMore",
									"sendInvitations", "offRecord");
							this.settings.lastTop = "";
							this.settings.marker = "";
							this.settings.autoload = true;
							this.settings.loadcount = 0;

							this.model.bind("remove", this.remove, this);
							this.model.bind("select", this.select, this);
							this.model.bind("unselect", this.unselect, this);
							this.model
									.bind("msgarrived", this.addMessage, this);
							this.model.bind("showHistory", this.renderHistory,
									this);
							this.model.bind("addParticipant",
									this.appendMembers, this);
							this.model.bind("setOffRecord", this.goOffRecord,
									this);
							this.model.bind("change", this.updateRoom, this);
							this.model.bind("changeStatus", this.updateStatus,
									this);

							this.template = $("#chat-template").tmpl();
							this.$el.droppable({
								accept : '.user',
								drop : this.onDropped
							});
							this.getHistory();
							this.$(".chatcontent").bind("scroll", this.getMore);

						},
						updateStatus : function(status,type) {
							
							
							var self=this;
							var timeout=5000;
							
							//clear msg after timeout
							clearTimeout(this.updateTimer);
							this.updateTimer=setTimeout(function(){ self.$(".chatStatus").empty(); },timeout);
							self.$(".chatStatus").empty()
							
							if(type=="typing"){
								var animater=$("<span/>").addClass("preloader mini icon-spinner");
								self.$(".chatStatus").append(animater);
							}
							//display msg status
							self.$(".chatStatus").append(status);

						},
						updateRoom : function(model) {
							var diff = model.changedAttributes();
							for ( var att in diff) {
								switch (att) {
								case 'offRecord':
									this.setOffRecordStatus(model.get(att));
									break;

								}
							}
						},
						setOffRecordStatus : function(status) {
							if (!status)
								this.$(".chatOff").html("Go off Record");
							else
								this.$(".chatOff").html("Revert to Record");
						},
						goOffRecord : function(offRecordStatus) {

							if (offRecordStatus == this.model.get("offRecord"))
								return;

							if (offRecordStatus) {
								// this.model.set({"offRecord":true});
								this
										.addInfoMessage("This conversation is going off the record!");
							} else {
								// this.model.set({"offRecord":false});
								this
										.addInfoMessage("This conversation is no longer off the record!");
							}

							this.model.set({
								"offRecord" : offRecordStatus
							});
							
							this.setOffRecordStatus(offRecordStatus);
							

						},
						sendOffRecord : function(status) {
							var msg = {
								service : "rtc",
								mesgtype : "event",
								eventtype : "offRecord",
								offRecord : {
									sessionid : this.model.get("sessionid"),
									participants : this.model
											.get("participants"),

									contentType : "infoMsg",
									contentObj : "offRecord",
									status : status,

								}
							}

							var obj = {
								to : this.model.get("participants"),
								mesgtype : "peerEvent",
								eventtype : "IMmsg",
								msg : msg
							}
							akp_ws.sendPeer(obj)
						},
						offRecord : function() {
							var offRecordStatus = this.model.get("offRecord");
							this.sendOffRecord(!offRecordStatus);
							this.goOffRecord(!offRecordStatus);
						},
						deleteMessages : function() {

						},
						inviteMembers : function() {
							var browser = users.browser({
								onFinish : this.sendInvitations
							});
							var existusers = this.model.toJSON().participants;
							browser.blockUsers(existusers);
						},
						sendInvitations : function(ids) {
							//console.log(ids)

							for ( var i = 0; i < ids.length; i++) {
								if (ids[i]) {
									this.invite(ids[i]);
								}
							}
						},
						getHistory : function(marker) {
							var unique = akp_ws.createUUID();
							var modelObj = this.model.toJSON();
							var obj = {
								mesgtype : "request",
								request : "replay_log",
								uid : auth.loginuserid,
								from : auth.loginuserid == modelObj.participants[1] ? modelObj.participants[0]
										: modelObj.participants[1],
								service : "rtc",
								cookie : unique
							}

							if (marker)
								obj.marker = marker;

							akp_ws.send({data:obj});
							this.collection.mapReq(unique,
									this.model.toJSON().sessionid);

						},
						getMore : function() {
							var top = this.$(".chatcontent").scrollTop();
							var scrollheight = this.$(".chatcontent")[0].scrollHeight;// this.$el.height();
							var offsetheight = this.$(".chatcontent")[0].offsetHeight
							var contentheight = scrollheight - offsetheight;
							var docHeight = $(document).height();
							if (top < this.settings.lastTop) {

								// scrolling upwards

								// if(top+ height > docHeight-50 ) {
								if (top < 50) {

									// scroll reached top of element
									var marker = this.$(".chatmsg:first-child")
											.attr("data-timestamp");

									if (marker != this.settings.marker) {

										this.getHistory(marker);

										this.settings["marker"] = marker;
									}
								}
							}
							this.settings.lastTop = top;
							return;
						},
						renderHistory : function(msg) {
							if (this.mergeHistoryMessage(msg)){
								//this.checkInitialLoad();
								return;
							}

							var template = this.renderMessage(msg);
							if (!template)
								return;

							this.$(".chatcontent").prepend(template);
							
							this.checkInitialLoad();
							
							
							
							
						},
						checkInitialLoad:function(){
							//Loading last 10 history messages
							if (this.settings.autoload) {
								this.toBottom(0);
								this.settings.loadcount++;
								if (this.settings.loadcount == 10){									
									this.settings.autoload = false;
								}

							}
							return this.settings.autoload;
						},
						select : function() {
							this.$el.show();
						},
						unselect : function() {
							this.$el.hide();
						},
						render : function() {
							var msg = this.model.toJSON();
							this.$el.append(this.template);
							this.$(".chatcontent").bind("scroll", this.getMore);

							this.appendMembers(this.model.get('participants'));

							if (msg.content)
								this.addMessage(msg);
							else if (msg.contentType == "infoMsg") {
								this.handleInfoMsgs(msg);
							}

							return this;
						},
						handleInfoMsgs : function(msg) {
							if (msg.contentObj == "offRecord") {
								this.goOffRecord(msg.status);
							}
						},
						addMessage : function(msg) {
							akp_ws.notifyOnHidden("You have new text message.");

							this.goOffRecord(msg.offRecord);
							
							

							if (this.mergeMessage(msg))
								return;

							var template;
							if (msg.contentType == "infoMsg") {

								this.handleInfoMsgs(msg);
							} else {
								template = this.renderMessage(msg);
							}

							if (!template)
								return;

							this.$(".chatcontent").append(template);

							// animating to bottom
							this.toBottom("slow");

							// this.$(".chatcontent").scrollTop() =
							// this.$(".chatcontent")[0].scrollHeight;
							// this.$(".chatcontent").height()
						},
						toBottom : function(speed) {
							var scrollheight = this.$(".chatcontent")[0].scrollHeight;// this.$el.height();
							var offsetheight = this.$(".chatcontent")[0].offsetHeight
							var contentheight = scrollheight - offsetheight;
							this.$(".chatcontent").animate({
								scrollTop : contentheight + 10
							}, speed);
						},
						mergeMessage : function(msg) {
							var el = this.$(".chatcontent").children(
									".chatmsg:last-child");
							if (parseInt(el.attr("data-sender")) == msg.sender) {
								
								el.children(".chatdata").append("<br/>" + msg.content);
								this.toBottom("slow");
								return true;
							}
							return false;
						},
						mergeHistoryMessage : function(msg) {
							var el = this.$(".chatcontent").children(
									".chatmsg:first-child");
							if (parseInt(el.attr("data-sender")) == msg.sender) {
								el.children(".chatdata ").children(".chattime")
										.after(msg.content + "<br/>");
								return true;
							}
							return false;
						},
						formatTime : function(timestamp) {
							var date = new Date(timestamp);
							var now = new Date();
							var timeDiff = Math.abs(now.getTime() - timestamp);
							var diffDays = Math.round(timeDiff
									/ (1000 * 3600 * 24));
							// if(diffDays<1){

							var yearCheck = (date.getFullYear() == now
									.getFullYear()) ? true : false;
							var monthCheck = (date.getMonth() == now.getMonth()) ? true
									: false;

							if ((date.getDate() == now.getDate()) && monthCheck
									&& yearCheck) {
								return $.fullCalendar.formatDate(date, "HH:mm");
							} else if ((now.getDate() - date.getDate()) == 1
									&& monthCheck && yearCheck) {
								return "yesterday "
										+ $.fullCalendar.formatDate(date,
												"HH:mm");
							} else {
								return $.fullCalendar.formatDate(date,
										"dd/MM/yyyy HH:mm");
							}

						},
						renderMessage : function(msg) {
							if (!msg.sender || !msg.content)
								return false;

							var user = auth.getuserinfo(msg.sender);

							if (!user)
								return false;

							var name = msg.sender == auth.loginuserid ? "me"
									: user.first_name;
							var data = utils.htmlUnescape(msg.content);

							// console.log(data+" is offline msg: "+
							// msg.checked);

							if (msg.checked == false) {
								var elm = $("<span/>").append(data).addClass(
										"unchecked");
								data = $("<div/>").append(elm).html();
							}

							var template = $("#chatmsg-template").tmpl([ {
								name : name,
								data : data,
								img : user.image_small || alt_image_small,
								uid : user.uid,
								time : this.formatTime(msg.timestamp)
							} ]);

							var dirclass = msg.sender == auth.loginuserid ? "me"
									: "he";
							template.attr({
								"data-timestamp" : msg.timestamp,
								"data-sender" : msg.sender
							}).addClass(dirclass);
							return template;
						},
						onDropped : function(e, ui) {

							e.stopPropagation();
							e.preventDefault();
							var $item = ui.draggable;
							var invitee = $item.data('uid');

							this.invite(invitee);
						},
						invite : function(invitee) {
							var invitee_info = auth.getuserinfo(invitee);
							if (invitee_info.status == "offline") {
								noty({
									layout : 'bottomRight',
									theme : 'default',
									text : "failed to send invitation, "
											+ invitee_info.first_name
											+ " offline",
									type : "warning",
									timeout : 3000,
								});
								return;
							}

							if (invitee == auth.loginuserid)
								return;

							var isExistingParticipant = this.$el.children(
									".chatparticipants").find(
									"div[data-uid=" + invitee + "]").length;
							if (isExistingParticipant)
								return;

							var participants = this.model.get("participants");
							var cookie = this.model.get("sessionid");// $(this).data("chatmembers");

							this.confInvite(cookie, invitee, participants);
							var info = auth.usersList[invitee].first_name
									+ " has been invited to chat.<br />";
							this.addInfoMessage(info);

						},
						addInfoMessage : function(msg) {
							var msgcard=$("<span/>").append(msg).addClass("chatInfoMsg");
							
							this.$(".chatcontent").append(msgcard);
							// animating to bottom
							this.toBottom("slow");
						},
						appendMembers : function(members) {

							if (!members.length)
								return;

							for ( var i = 0; i < members.length; i++) {
								if (auth.loginuserid == members[i])
									continue;

								var user = auth.getuserinfo(members[i]);

								var userModel = users.getModelByUid(members[i]);

								if (!userModel)
									continue;

								var userView = new Participant({
									model : userModel,
									room : this
								});

								this.$(".chatparticipants").append(
										userView.render().$el);

							}
						},
						confInvite : function(sid, uid, group) {

							this.collection.trigger("confInviteReq", sid, uid,
									group);

						},
						remove : function() {
							this.$el.remove();
						}

					});

			var Participant = Backbone.View.extend({
				initialize : function(opts) {
					this.room = opts.room;
					this.model.bind("statusChange", this.handleStatusChange,
							this);
				},
				render : function() {
					var user = this.model.toJSON();
					var modelObj = {
						userid : user.uid,
						img : user.image_small || "css/images/user32.png",
						name : user.first_name
					};

					var template = $("#user-template").tmpl([ modelObj ]);
					template.attr("title", user.first_name)
					var status = $('<span />').addClass('ustatus').appendTo(
							template);
					
					this.$el.attr("data-uid", user.uid).html(template);
					this.setStatus(user.status);
					
					if(user.status=="offline"){
						this.room.updateStatus(user["first_name"] + " is  unavailable to chat. ");
					}

					return this;
				},
				setStatus : function(status) {
					this.$("span.ustatus").addClass(status);
				},
				handleStatusChange : function(user) {
					//if (user.status == "offline")
						this.room.updateStatus(this.model.get("first_name") + " is " + user.status + ". ");

					//this.setStatus(user.status);
					this.render();
				}

			});

			var SpeechRec = Backbone.View
					.extend({
						initialize : function() {
							this.recognition = new webkitSpeechRecognition();
							this.recognition.continuous = true;
							this.recognition.interimResults = true;
							this.recognition.onresult = function(ev) {
								//console										.log(ev.results[ev.results.length - 1][0].transcript);
							};
							this.recognition.start()
						},
						render : function() {

						}
					});

			var collection = new baseCollection;

			var chat = new ChatWindow({
				collection : collection
			});

			/*
			 * var speechRec = new SpeechRec({ collection : collection });
			 */

			function handleRtcMessage(msg) {
				// console.log("message Recieved from Rtc service:");
				// console.log(msg_obj);
				var mesgtype = msg.mesgtype;
				switch (mesgtype) {
				case "event":
					if (msg.eventtype == "new_imsg") {
						collection.trigger("newmsg", msg.imsg)
						// handleNewChatMessage(msg_obj.imsg);
					} else if (msg.eventtype == "istatus") {
						collection.handleStatus(msg.istatus);
					} else if (msg.eventtype == "new_chat") {
						collection.trigger("newchat", msg.userid)
					} else if (msg.eventtype == "text_con_invite") {

						// console.log("new conference request.");
						// console.log(msg);

						collection.trigger("confInvite", msg.invite);

						// handleTextConfInvitation(msg.invite);

					} else if (msg.eventtype == "text_con_invite_accept") {
						//console.log("conference request accepted by invitee.");
						//console.log(msg);
						// handleTextConfInvitaionAccept()
					} else if (msg.eventtype == "user_join_text_con") {

						collection.trigger("confJoin", msg.join);
						// userConfJoinUpdate(msg_obj.join);

					} else if (msg.eventtype == "offRecord") {
						collection.trigger("offRecord", msg.offRecord);

					} else if (msg.eventtype == "bye"
							|| msg.eventtype == "drop"
							|| msg.eventtype == "candidate_event"
							|| msg.eventtype == "new_media") {
						media.send(msg)

						// closePeerconnectionbyRemote();

					} /*
						 * else if (msg.eventtype == "drop") {
						 * 
						 * noty({ layout : 'bottomRight', theme : 'default',
						 * type : "error", text :
						 * usersList[msg_obj.sndr].first_name + " declined your
						 * call. ", }) } else if (msg_obj.eventtype ==
						 * "candidate_event") { console.log("recvd candidate");
						 * if (!answerPending) { var candidate = new
						 * RTCIceCandidate({ sdpMLineIndex :
						 * msg_obj.candobj.label, candidate :
						 * msg_obj.candobj.cand });
						 * peerConn.addIceCandidate(candidate); } else { console
						 * .log("Cand dropped, reason: recvd before invite
						 * accept"); } }
						 */
					break;
				case 'request':
					// console.log("recvng call");
					/*
					 * if (msg_obj.request == "call") { if (!peerConnCreated)
					 * createPeerConnection(); onIncomingVideoCall(msg_obj); }
					 */

				case 'response':
					// console.log("recvd pickup");
					/*
					 * if (msg_obj.response == "pickup") { peerConn
					 * .setRemoteDescription(new RTCSessionDescription(
					 * msg_obj.answer.jsepdata)); hisname = msg_obj.answer.sndr; }
					 */
					if (msg.response == "pickup" || msg.response == "answer"
							|| msg.request == "call" || msg.request == "offer") {
						media.send(msg);
					} else if (collection.mapSession(msg.cookie)) {
						var sessionid = collection.mapSession(msg.cookie);
						var model = collection.getModelBySessionId(sessionid);
						if (model) {
							model.trigger("showHistory", msg.result);
						}
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
