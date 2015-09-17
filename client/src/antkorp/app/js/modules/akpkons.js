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
 * @fileOverview handling Conversations
 * @name akpkons
 */

define("akpkons",
		["jquery", "underscore", "backbone", "akpauth", "akputils",
				"akpcontacts", "jquery.tagsinput",
				"fullcalendar", "plugins/jquery-tmpl" ],
		function($, _, Backbone, auth, utils, contacts) {
			loader(40, "kons Loaded");
			
			
			
			window.App = window.App || {};
			App.Views = App.Views || {};

			var alt_image_small = "css/images/user32.png";
			var categories = {};
			var streamers = {};

			function KonsMessage(msg_obj) {

				var svr_cmds = msg_obj;
				if (!svr_cmds)
					return this;

				switch (svr_cmds.mesgtype) {
				case "event":
					/*
					 * Check it is belongs to other service or kons if category
					 * not refered to other service check for internal
					 * categories
					 */
					if (categories[svr_cmds.konv.category]) {
						categories[svr_cmds.konv.category].call(undefined,
								svr_cmds.eventtype, svr_cmds.konv);
					} else {

						this.handleEvents(svr_cmds);
					}
					break;
				case "response":
					if (mapper.get(svr_cmds.cookie)) {
						// console.log("got thumbnail");
						mapper.get(svr_cmds.cookie).call(undefined,
								svr_cmds.result,svr_cmds.cookie);

					} else if (streamers[svr_cmds.cookie]) {
						streamers[svr_cmds.cookie].call(undefined,
								svr_cmds.result);
					} else if (akons.map(svr_cmds.cookie)
							&& _.contains(posts.categories,
									svr_cmds.result.category)) {
						posts.byFilter = false;

						posts.add(svr_cmds.konv || svr_cmds.result);
					} else if (svr_cmds.response == "relay_notification") {
						Notifications.add(svr_cmds.result);
					} else if (svr_cmds.response == "notification_count") {
						// console.log("notification count rvcvd :"+
						// svr_cmds.count);
						Notifications.trigger("countChange", svr_cmds.count);
						// console.log(svr_cmds);
					} else if (svr_cmds.response == "notification_check_all") {
						Notifications.trigger("countChange", svr_cmds.pending);
					} else if (svr_cmds.response == "notifications_check") {
						Notifications.trigger("countChange", svr_cmds.count);
					} else if (svr_cmds.result) {
						if (!_.contains(posts.categories,
								svr_cmds.result.category)
								&& !svr_cmds.result.parent)
							return;

						posts.byFilter = true;
						posts.add(svr_cmds.result);
					}

					break;
				case "request":
					if (svr_cmds.request == "getRelay") {
						akons.init();
					} else if (svr_cmds.request == "queryLoad") {
						akons.init(svr_cmds);
					} else if (svr_cmds.request == "konsDialog") {
						return new konsEntry(svr_cmds.settings);
					} else if (svr_cmds.request == "konsStream") {
						return new konsStream(svr_cmds.settings);
					}
					break;
				case "notification":
					//console.log(svr_cmds);
					/*
					 * Check notification category if not kons route
					 */

					if (svr_cmds.notification.category == "kons") {
						if(svr_cmds.notification.owner_gid != auth.cgd )
							return;
						
						
						svr_cmds.notification.addTop = true;
						Notifications.add(svr_cmds.notification);
						Notifications.trigger("countChange", "inc");
					} else {
						auth.routeNotification(svr_cmds.notification);
					}

					break;

				case "error":
					if (mapper.get(svr_cmds.cookie)) {
						// console.log("got thumbnail");
						mapper.get(svr_cmds.cookie).call(undefined,
								svr_cmds.error,svr_cmds.cookie,svr_cmds.mesgtype);

					} else {
					
					//console.log("recieved Error Message Kons");
					//console.log(svr_cmds);
					noty({
						text : svr_cmds.error,
						type : "error",
						layout : 'bottomRight',
						theme : 'default',
						timeout : 5000,
					});
					}

					break;
				default:
					//console.log("oops! undefined mesgtype recieved kons");
					console.log(svr_cmds);

				}
			}

			KonsMessage.prototype.start = function() {
				auth.getNotifications("kons");
				auth.getNotificationCount("kons");
				akons.init();

			}
			KonsMessage.prototype.konsDialog = function(opts){
				return new konsEntry(opts);
			},
			KonsMessage.prototype.getKonsStream = function(options) {
				return new konsStream(options);
			}
			KonsMessage.prototype.getCategoryUpdates = function(category,callback) {
				categories[category] = callback;
			}
			KonsMessage.prototype.clear = function() {
				posts.clear();
			}
			KonsMessage.prototype.changeGroup = function() {
				this.clear();
				this.start();
			}
			KonsMessage.prototype.handleEvents = function(event) {
				
				
				if (event.eventtype == "new_konv") {
					if(parseInt(event.konv.owner_gid) != auth.cgd)
						return;
					
					if (_.contains(posts.categories, event.konv.category)) {
						posts.byFilter = false;
						posts.add(event.konv);
						
						//updates.add(event.konv);
					} else {
						
						posts.byFilter = false;
						posts.add(event.konv);
						
						// console.log("category not recognised");
						//updates.add(event.konv);
					}
				} else if (event.eventtype == "update_konv") {

					var post = posts.get(event.konv.id);
					if (post)
						post.set(event.konv);

				} else if (event.eventtype == "delete_konv") {

					posts.scrap(event.konv);

				}
			}

			/*
			 * Notifications
			 */

			var notification = Backbone.Model.extend({
				notifier : "",
				description : "",
				active : false,
			})

			var notifications = Backbone.Collection.extend({
				model : notification
			})

			var notificationsView = Backbone.View
					.extend({
						el : ".mt-menu.kons-tab",
						events : {
							"click .notify-no" : "openNotifications",
							"click .notification" : "hideNotifications",
							"scroll .notifications-list" : "getMore",
							"click .check-all" : "checkoutAll"
						},
						settings : {
							lastTop : 0,
							timestamp : 0,
							marker : null,
						},
						initialize : function(opts) {
							_.bindAll(this, "hideNotifications", "getMore");
							this.posts = opts.posts;
							this.collection.bind("add", this.addNotification,
									this);
							this.collection.bind("countChange",
									this.changeCount, this);

							this.posts.bind("clear", this.clear, this);
							$(document).bind("click", this.hideNotifications);
							$(".notifications-list").bind("scroll",
									this.getMore);
							// auth.getNotifications("kons");
						},
						render : function() {
							return this;
						},
						checkoutAll : function() {

							auth.checkAllNotification("kons");
							// this.model.set({"active":false});
							var stsel = this.$(".notifications-list").children(
									".notification").attr("data-active", false)
									.find(".ntfy-status");
							stsel.removeClass("icon-radio-checked").addClass(
									"icon-checkmark-circle");
							this.changeCount(0);
						},
						getNotificationCount : function() {
							auth.getNotificationCount("kons");
						},
						getMore : function() {
							var top = this.$(".notifications-list").scrollTop();
							var scrollheight = this.$(".notifications-list")[0].scrollHeight;// this.$el.height();
							var offsetheight = this.$(".notifications-list")[0].offsetHeight
							var contentheight = scrollheight - offsetheight;
							var docHeight = $(document).height();
							if (top > this.settings.lastTop) {

								// if(top+ height > docHeight-50 ) {
								if (contentheight < top + 50) {
									var id = this.$(".notification:last-child")
											.attr("data-notifyid");
									var model = this.collection.get(id);
									var marker = model.toJSON().timestamp;

									if (marker != this.settings.marker) {

										this.relayReq(marker);
										this.settings["marker"] = marker;
									}
								}
							}
							this.settings.lastTop = top;
							return;
						},
						relayReq : function(marker) {
							auth.getNotifications("kons", marker);

						},
						hideNotifications : function() {
							this.$(".notifications-pane").hide();
						},
						openNotifications : function(e) {
							e.stopPropagation();
							e.preventDefault();
							$(".notifications-pane").hide();
							//if (this.collection.length)
								this.$(".notifications-pane").show();
						},
						changeCount : function(count) {
							var prevcnt = parseInt(this.$(".notify-no").html());

							if (count == "inc") {
								count = prevcnt + 1;
							} else if (count == "dec") {
								count = prevcnt - 1;
							}

							if (parseInt(count) >= 0) {
								this.$(".notify-no").html(count);
								this.notificationCount = count;
							}
						},
						addNotification : function(model) {
							// $(".notifications-list").bind("scroll",this.getMore);
							// this.$(".notify-no").html(this.collection.length);
							var ntfy = new notificationView({
								model : model,
								posts : this.posts,
								collection : this.collection,
							});
							
							this.$(".instantEmptyNotification").remove();
							
							if (model.toJSON().addTop) {
								this.$(".notifications-list").prepend(
										ntfy.render().el);
							} else
								this.$(".notifications-list").append(
										ntfy.render().el);
						},
						clear : function() {
							this.collection.reset();
							this.$(".notifications-list").empty();
							this.showInstantMsg();
						},
						showInstantMsg:function(){
							var instant = $("<div/>").addClass("instantEmptyNotification notification").append("You have no notifications!");
							this.$('.notifications-list').append(instant);
						},
					})

			var notificationView = Backbone.View
					.extend({
						events : {
							"click" : "getKons",
						},
						initialize : function(opts) {
							_.bindAll(this, "getKons");
							this.posts = opts.posts
							var notification = this.model.toJSON();
							// console.log(notification);
							var user = auth
									.getuserinfo(notification.notifiers[0]);
							var info = {
								img : user.image_small || alt_image_small,
								name : user.first_name,
								description : notification.description,
								timestamp : this
										.formatTime(notification.timestamp * 1000),
							}
							if (notification.notifiers.length > 1) {
								var keyuser = "";
								for ( var i = 0; i < notification.notifiers.length; i++) {

									if (notification.notifiers[i] == auth.loginuserid)
										continue;

									keyuser += auth
											.getuserinfo(notification.notifiers[i]).first_name
											+ ", ";
									if (i == 3) {
										keyuser += " and "
												+ (notification.notifiers.length - 3)
												+ " others";
										break;
									}
								}
								info.name = keyuser;

							}

							if (notification.preview)
								info.preview = utils
										.htmlUnescape(notification.preview);

							// console.log(notification);
							this.el = $("#notification-template")
									.tmpl([ info ]);

							var statusClass = notification.active == true ? "icon-radio-checked"
									: "icon-checkmark-circle";
							var status = $("<span>").addClass("ntfy-status")
									.addClass(statusClass);
							this.el.append(status).attr("data-active",
									notification.active).bind("click",
									this.getKons).attr("data-notifyid",
									notification.id);

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
								return "yesterday";
							} else {
								return $.fullCalendar.formatDate(date,
										"dd/MM/yyyy");
							}

						},
						render : function() {
							return this;
						},
						sendChecked : function() {
							var obj = this.model.toJSON();
							var ntfyid = obj.id;
							auth.checkNotification("kons", ntfyid);

							this.model.set({
								"active" : false
							});
							var stsel = this.el.attr("data-active", false)
									.find(".ntfy-status");
							stsel.removeClass("icon-radio-checked").addClass(
									"icon-checkmark-circle");
							this.collection.trigger("countChange", "dec");

						},
						getKons : function() {
							var obj = this.model.toJSON();
							var konv = obj.kons;
							if (obj.active == true) {
								this.sendChecked();
							}

							var levels = obj["hierarchy"];
							if (!(levels.length - 1)) {
								this.posts.showPost(konv);
							} else {
								//console.log(obj.id);
								this.posts.showTreePost(levels, konv);
							}
						}
					})

			/*
			 * ===================================================================
			 * Comments
			 * ====================================================================
			 */
			var comment = Backbone.Model
					.extend({
						defaults : {
							rep : false,
							hasChildren : false,
							expand : true,
						},
						action : function(request) {
							var uid = this.get("owner_uid");
							var commentId = this.get("id");
							if (((request == "like") || (request == "dislike"))
									&& (uid == auth.loginuserid)) {
								this.errMsg(commentId, "like/dislike");
								return;
							}
							var unique = akp_ws.createUUID();
							var commentaction_obj = {
								service : "kons",
								mesgtype : "request",
								request : request,
								uid : auth.loginuserid,
								cookie : unique,
								id : commentId
							}
							akp_ws.send({data:commentaction_obj});

						},
						errMsg : function(commentId, action) {

							var par = $("#sharedPosts").find(
									'li[data-postid="' + commentId + '"]');
							var msg = $("<div/>")
									.addClass("konvmsg")
									.append(
											"<p>You can't "
													+ action
													+ " on this post.<br/> Click me to close.</P>")
									.bind('click', function() {
										$(this).remove();
									});
							setTimeout(function() {
								msg.remove();
							}, 5000)
							par.append(msg);

						},
						postComment : function(post) {
							var time = new Date().getTime();
							var unique = akp_ws.createUUID();
							var shar_obj = {
								service : "kons",
								mesgtype : "request",
								request : "new",
								
								uid : auth.loginuserid,
								gid : auth.cgd,
								cookie : unique,
								
								parent : this.get("id"),
								root : this.get("root") || this.get("id"),
								
								
								edit_timestamp : time,
								create_timestamp : time,
								
								content : post,
								category : "",
								taglist : [],
								
							}
							// akp_ws.send(shar_obj);

							return shar_obj;
						}
					});

			var Posts = Backbone.Collection.extend({
				model : comment,
				byFilter : false,
				categories : [],
				lastReqId:'',
				scrap : function(konv) {
					this.trigger("delete", konv);

				},
				showPost : function(konvid) {
					var model = this.where({
						id : konvid
					})[0];
					if (model) {
						// var obj=model.toJSON();

						this.trigger("focus", konvid);

					} else {
						this.trigger("getPost", konvid);
					}
				},
				showTreePost : function(levels, konvid) {
					var clear = false;
					for ( var i = levels.length; i > 0; --i) {
						clear = false;
						if (i == levels.length)
							clear = true;

						this.trigger("getPost", levels[i - 1], clear);
					}

					// this.trigger("getPost",konvid);
					this.trigger("focus", konvid);
				},
				search:function(searchKey,callback){
					var unique=akp_ws.createUUID();
					var request={
							mesgtype:"request",
							service:"kons",
							request:"search",
							key:searchKey,
							gid:auth.cgd,
							uid:auth.loginuserid,
							cookie:unique,	
					}
					akp_ws.send({data:request});
					mapper.set(unique,callback);
					this.lastReqId = unique;
					
					this.trigger("searching");
					
				},
				setInfo:function(type,msg){
					this.trigger("info",msg,type);
				},
				load : function(msg){
					if(msg.cookie == this.lastReqId){
						this.add(msg.result|| msg.konv);
					}
				},
				clear : function() {
					this.reset();
					this.trigger("clear");
				}
			});

			var Updates = Backbone.View
					.extend({
						el : ".konv-updlist",
						initialize : function(options) {
							_.bindAll(this, "render", "_renderPost")
							this.posts = options.posts;
							this.posts.bind("clear", this.clear, this);
						},
						render : function() {

						},
						add : function(konv) {
							if (konv.owner_uid == auth.loginuserid) {
								this.update(konv);
								return;
							}

							if (konv.parent) {
								var model = this.posts.get(konv.parent);
								if (model) {
									var update = this.getInfo(konv);

									$("<li/>").addClass("konv-update").append(
											update).bind("click", konv,
											this._renderPost).prependTo(
											".konv-updlist");
								}
							} else {
								var update = this.getInfo(konv);

								$("<li/>").addClass("konv-update").append(
										update).bind("click", konv,
										this._renderPost).prependTo(
										".konv-updlist");
							}

						},
						getInfo : function(konv) {
							var content = $("<div/>").append(
									utils.htmlUnescape(konv.content)).text();
							// var content=konv.content;
							konv["sampleContent"] = content.substr(0, 100)
									+ "...";

							konv["first_name"] = auth
									.getuserinfo(konv.owner_uid).first_name;
							konv["image_small"] = auth
									.getuserinfo(konv.owner_uid).image_small
									|| alt_image_small;
							konv["type"] = konv.parent ? "Comment"
									: "Discussion";
							var temp = $("#konv-update-template")
									.tmpl([ konv ])
							return temp;

						},

						_renderPost : function(e) {
							var konv = e.data;
							if ($(e.currentTarget).attr("data-checked"))
								return;

							this.update(konv);
							$(e.currentTarget).attr("data-checked", 1).remove();
						},
						update : function(konv) {
							this.posts.byFilter = false;
							this.posts.add(konv);
						},
						clear : function() {
							this.$el.empty();
						}
					});
			
			

			var Akon = Backbone.View
					.extend({
						tagName : "li",
						settings : {},
						defaults : {
							conditionalLoading : false,
							basic : false,
							richText : true,
							onKonvRecieved : "", // function to hold kons on
							// requested
							strictCategory : false,
							expanded : false,
						},
						events : {
							"click .comment" : "readmore",
							"click .commauthr" : "showAuthr",
							"click .commcategory" : "filterByCategory",
							"click .rep" : "reply",
							"click .commup" : "like",
							"click .commdown" : "dislike",
							"click .commlock " : "lock",
							"click .communlock" : "unlock",
							"click .commcollapse " : "collapse",
							"click .commedit" : "edit",
							"click .commdelete" : "warnRemoveKons",
							"click .commComments" : "getChildren",
							"click .commAttaches" : "loadAttachments",
							"click .hideActivity" : "closeActivity",
							"click .likecount" : "loadLikers",
							"click .dislikecount" : "loadDislikers",
							"click .commtag" : "filterByTag",
							"click .commaccess" : "showFollowers",
							'click .commShare' : "forwardKons",
						},

						initialize : function(opts) {

							_.bindAll(this, 'render', 'refresh', "loadDefault",
									"postEdit", "showUser", "showAuthr",'forwardKons');
							this.settings = $.extend({}, this.defaults, opts);

							this.model.bind('change', this.refresh);
							this.model.bind("reload", this.reload);
							this.obj = this.model.toJSON();
							$(this.el).attr("data-postid", this.obj.id)
						},

						render : function() {
							this.obj = this.model.toJSON();
							var obj = this.obj;
							var user = auth.getuserinfo(obj.owner_uid)

							obj["img"] = user.image_medium || alt_image_small;
							obj["author"] = user.first_name;
							obj["time"] = this.formatTime(obj.create_timestamp);
							obj["content"] = utils.htmlUnescape(obj.content);

							$(this.el).children(".comment").remove();
							var element = $("#post-template").tmpl([ obj ])
									.prependTo(this.el);
							this.readmore();
							this.checkCollapser();
							this.FilterImages();
							return this;
						},
						forwardKons:function(){
							var shareDialog = new App.Views.konsShareDialog({
								model:this.model,
								collection:this.collection,
								});
							shareDialog.render();
						},
						FilterImages : function() {

						},
						checkCollapser : function() {
							var comments = this.$el.children("ul");
							if (comments.length) {
								var some = comments.css('display') == 'none';
								if (!some) {
									this.showAsExpanded();
								} else {
									this.showAsCollapsed();
								}
							}
						},
						showAsExpanded : function() {
							this.comment(".commcollapse").removeClass(
									"icon-minus2 icon-plus2").addClass(
									"icon-minus2");
						},
						showAsCollapsed : function() {
							this.comment(".commcollapse").removeClass(
									"icon-minus2 icon-plus2").addClass(
									"icon-plus2");
						},
						refresh : function(model) {

							if (model.get("rep"))
								return;

							var diff = model.changedAttributes();
							for ( var att in diff) {
								switch (att) {
								case 'likecount':
								case 'dislikecount':
								case 'content':
								case 'locked':
								case 'child_count':
								case 'attachments':
								case 'taglist':
								case 'category':
								case 'followers':
								case 'limited':
									this.render();
									this.model.set({
										"rep" : false
									});
									break;
								case 'hasChildren':
									if (this.model.get(att))
										this.settings.expanded = true;
									else
										this.settings.expanded = false;
									break;
								}
							}

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
								return "yesterday";
							} else {
								return $.fullCalendar.formatDate(date,
										"dd/MM/yyyy");
							}

						},

						formatTags : function(tags) {

						},
						filterByTag : function(e) {
							var tag = $(e.currentTarget).text();
							this.collection.trigger("newFilter", "tag", tag);

						},
						filterByCategory : function() {
							this.collection.trigger("newFilter", "category",
									this.obj.category);
						},
						getChildren : function(e) {
							if ($(e.currentTarget).attr("data-loaded") == "true") {
								this.showComments();
								return;
							}

							$(e.currentTarget).attr("data-loaded", "true");

							if (!this.obj.child_count)
								return;

							var id = this.obj.id;
							var unique = akp_ws.createUUID();
							var obj = {
								service : "kons",
								mesgtype : "request",
								request : "relay",
								query : "children",
								uid : auth.loginuserid,
								cookie : unique,
								id : id,
							}
							akp_ws.send({data:obj});

							if (this.settings.conditionalLoading) {
								mapper
										.set(unique,
												this.settings.onKonvRecieved);
							}

						},
						closeActivity : function() {
							this.$el.children(".comment").find(".commActivity")
									.slideUp("slow");
						},
						comment : function(elem) {
							return this.$el.children(".comment").find(elem);
						},
						showAuthr : function() {
							this.showUser();
						},
						showUser : function(uid) {
							
								akp_ws.getProfile({
									id : uid || this.obj.owner_uid ,
									mode : "read"
								});
							

						},
						showFollowers : function() {
							if (!this.obj.followers)
								return;

							if (!this.obj["followers"].length)
								return;

							this
									.comment(
											".commAttachments,.commDislikers,.commLikers")
									.hide();
							this.comment(".commAccessers,.commActivity").show();
							if (this.comment(".commAccessers").attr(
									"data-loaded") == "true") {

								return;
							}

							this.comment(".commAccessers").attr("data-loaded",
									true);

							for ( var indx in this.obj.followers) {
								var flwr = this.obj.followers[indx];
								$("<li/>").addClass("flwr").append(
										this.getUser(flwr)).appendTo(
										this.comment(".commAccessers ul"));
							}
						},
						loadLikers : function() {
							if (!this.obj.likecount)
								return;

							this
									.comment(
											".commAttachments,.commDislikers,.commAccessers")
									.hide();
							this.comment(".commLikers,.commActivity").show();

							if (this.comment(".commLikers").attr("data-loaded") == "true") {

								return;
							}
							this.comment(".commLikers").attr("data-loaded",
									true);

							for ( var like in this.obj.likers) {
								var liker = this.obj.likers[like];
								$("<li/>").addClass("liker").append(
										this.getUser(liker)).appendTo(
										this.$el.children(".comment").find(
												".commLikers ul"));
							}

						},
						loadDislikers : function() {
							if (!this.obj.dislikecount)
								return;

							this
									.comment(
											".commAttachments,.commLikers,.commAccessers")
									.hide();
							this.comment(".commDislikers,.commActivity").show();

							if (this.comment(".commDislikers").attr(
									"data-loaded") == "true") {

								return;
							}
							this.comment(".commDislikers").attr("data-loaded",
									true);

							for ( var dislike in this.obj.dislikers) {
								var disliker = this.obj.dislikers[dislike];
								$("<li/>").addClass("disliker").append(
										this.getUser(disliker)).appendTo(
										this.$el.children(".comment").find(
												".commDislikers ul"));
							}
						},
						getUser : function(uid) {
							var user = auth.getuserinfo(uid);
							var _self = this;
							var dom = $("#activeUser-template").tmpl([ user ]);
							dom.find(".commusername").bind("click", function() {
								_self.showUser(uid);
							})
							if (user.uid == auth.loginuserid)
								dom.find(".commusername").append(" (you)");

							return dom;
						},
						loadAttachments : function() {
							var files = this.model.toJSON().attachments;
							if (!files.length)
								return;

							this
									.comment(
											".commLikers,.commDislikers,.commAccessers")
									.hide();
							this.comment(".commAttachments,.commActivity")
									.show();

							if (this.comment(".commAttachments").attr(
									"data-loaded") == "true") {

								return;
							}
							this.comment(".commAttachments").attr(
									"data-loaded", true);

							for ( var file in files) {
								var f = files[file];
								// var f=model.toJSON();
								$("<li/>")
										.bind("click", {
											path : f.path
										}, this.openFileBrowser)
										.addClass("cattach")
										.append(this.getFile(f))
										.appendTo(
												this.$el
														.children(".comment")
														.find(
																".commAttachments ul"));
								// console.log(fname);
							}
						},
						openFileBrowser : function(e) {
							var path = e.data.path;
							akp_ws.openFileBrowser({
								file : path
							});

						},
						getFile : function(file) {
							var data = {};
							$.extend(data, file);
							var mimeclass = utils.mime2class(data.type);
							var sizeBytes = utils.convBytes(data.size, 2);
							data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"
									: mimeclass;
							data["size"] = sizeBytes;
							data["hasRemove"] = false;
							return $("#attachment-template").tmpl([ data ]);
						},
						reload : function(model) {

						},
						reply : function() {
							if (this.model.get("locked"))
								return;

							if (!this.model.get("rep")) {
								var replyview = new ReplyView({
									model : this.model,
									richText : this.settings.richText,
									onShare : this.postEdit,
								});
								this.readmore();
								$(this.el).children(".comment").append(
										replyview.render().el);

							}

						},
						loadDefault : function() {
							$(this.el).children(".comment").remove();
							this.render();
						},
						edit : function() {
							this.readmore();
							this.comment(".commedit").hide();
							this.comment(".commAttaches").hide();
							this.comment(".tagsSection").hide();
							this.comment(".commaccess").hide();
							this.comment(".commActivity").hide();
							var elem = this.comment(".original-comment");

							var editConfig = {
								el : elem,
								model : this.model,
								type : "edit",
								onShare : this.postEdit,
								onCancel : this.loadDefault,
								basic : this.settings.basic,
								richText : this.settings.richText,
								enableCategories:this.settings.enableCategories,
							}

							var editform = new konsEntry(editConfig);

						},
						postEdit : function(data) {
							if (this.settings.strictCategory)
								data.category = this.settings.strictCategory;

							akp_ws.send({data:data});
							//console.log("sending kons:")
							//console.log(data);
							this.loadDefault();
						},
						warnRemoveKons:function(){
							var root = this;
							$("<div/>").append("<p>These discussion will be permanently deleted and cannot be recovered. Are you sure, you want to delete?</p>").dialog(
                                    {title:"Discussion delete",
                                        resizable : false,
                                        height : 160,
                                        modal : true,
                                        open:this.onOpen,
                                        buttons : [{
                                            text:"Delete",
                                            "class":"btn btn-danger",
                                            click : function() {
                                                root.removeKons();
                                                $(this).dialog("close").remove();
                                            }},{
                                            text:"Cancel",
                                            "class":"btn btn-primary",
                                            click : function() {
                                                $(this).dialog("close").remove();
                                            }
                                        }]
                                    });
							
						},
						onOpen:function(e, ui) {
                        	$(e.target).closest(".ui-dialog").find(".ui-dialog-titlebar-close").hide();
                        },
						removeKons : function() {
							this.model.action("delete");
						},
						like : function() {
							if (!this.model.get("ilike")
									&& !this.model.get("idontlike")) {
								this.model.action("like");
							} else if (this.model.get("ilike")) {
								this.model.action("revert_like");
							} else if (this.model.get("idontlike")) {
								this.model.errMsg(this.model.get("id"),
										" like ");
							}
						},
						dislike : function() {
							if (!this.model.get("idontlike")
									&& !this.model.get("ilike")) {
								this.model.action("dislike");
							} else if (this.model.get("idontlike")) {
								this.model.action("revert_dislike");
							} else if (this.model.get("ilike")) {
								this.model.errMsg(this.model.get("id"),
										" dislike ");
							}
						},
						lock : function() {

							this.model.action("lock")
						},
						unlock : function() {
							this.model.action("unlock");
						},
						showComments : function() {
							$(this.el).children("ul").slideDown("slow");
							this.showAsExpanded();
							this.settings.expanded = true;
						},
						hideComments : function() {
							this.$el.children("ul").slideUp("slow");
							this.showAsCollapsed();
							this.settings.expanded = false;
						},
						collapse : function() {
							if (this.model.get("hasChildren")) {
								// var expand = this.model.get("expand");
								var expand = this.settings.expanded;
								if (expand) {
									this.hideComments();

								} else {
									this.showComments();
								}
								
							}
							
						},
						readmore : function(e) {
							if (e)
								e.stopPropagation();

							this.$(".comment").css('max-height', '1000px');
						}
					});

			var ReplyView = Backbone.View.extend({

				className : "commEntry",
				defaults : {
					richText : true,
					onShare : "",// callback on post comment
				},
				events : {
					"click .commpost" : "sendComment",
					"click .commpostno" : "remove",
					"focus .commInput" : "focus",
					"click .commInput" : "clear",
					"click .intLink" : "applyStyle",
					"change .colorLink" : "setColor"
				},
				initialize : function(opts) {

					this.settings = $.extend({}, this.defaults, opts);
					this.template = $("#reply-template").tmpl();
					this.model.set({
						"rep" : true
					});
				},
				applyStyle : function(e, sValue) {
					var sCmd = $(e.currentTarget).attr("data-cmd");
					this.formatDoc(sCmd);
					// oDoc.focus();
				},
				setColor : function(e) {
					var color = $(e.currentTarget).val();
					this.formatDoc("forecolor", color)
				},
				formatDoc : function(sCmd, sValue) {
					document.execCommand(sCmd, false, sValue);
					this.$('.commInput').focus();
				},
				focus : function(e) {
					this.$(".commInput").css("border-color", "#04bfbf");
				},

				render : function() {
					$(this.el).append(this.template);
					return this;
				},
				validate : function() {
					if ($(this.el).children(".commInput").text())
						return true;
				},
				sendComment : function() {
					if (this.validate()) {
						var comment = $(this.el).children(".commInput").html();
						var obj = this.model.postComment(comment);
						if (typeof this.settings.onShare === 'function') {
							this.settings.onShare.call(undefined, obj);
						}
						this.remove();
					}
				},
				clear : function() {
					this.$('.dfltcmttxt').remove();
				},
				remove : function() {
					$(this.el).remove();
					this.model.set({
						"rep" : false
					});
				}
			});
			/*
			 * Layout manager
			 */
			var layoutManager = Backbone.View
					.extend({
						defaults : {
							itemClass : "",
							columnCount : 0,
							container : "",
						},
						settings : {},
						initialize : function(options) {
							var availableWidth = $("#sharedPosts").width();
							this.columnCount = 2;
							/*
							 * if(availableWidth>1200){ this.columnCount=3;
							 * }else if(availableWidth>1000){
							 * this.columnCount=2; }else if(availableWidth>700){
							 * this.columnCount=1; }
							 */

							this.settings = $
									.extend({}, this.defaults, options);

							this.render();
						},
						render : function() {
							for ( var i = 0; i < this.columnCount; i++) {
								var colNumber = i + 1;
								var column = $("<div/>").addClass(
										"column column" + colNumber).css({
									"float" : "left",
									"width" : "50%"
								});
								this.settings.container.append(column);
							}

						},
						addItem : function(item) {
							var column = this.getColumn2InsertbyItemcount();
							column.append(item);
							item.find(".comment").css({
								width : "400px"
							});
						},
						getColumn2InsertbyColHeight : function() {
							var column;
							var column1 = this.settings.container
									.find("column1");
							var column2 = this.settings.container
									.find("column12")
							if (column1.height() > column2.height())
								return column2;
							else
								return column1;

						},
						getColumn2InsertbyItemcount : function() {
							var existingItemsCount = this.settings.container
									.find(this.settings.itemClass).length;
							var columnNumber = (existingItemsCount % this.columnCount) + 1;
							var colSelector = ".column" + columnNumber;

							return this.settings.container.find(colSelector);

						},
						rearrange : function() {

						}
					});

			/*
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Stream
			 * outside _______________________________________________________
			 */

			var konsStream = Backbone.View.extend({
				defaults : {
					basic : false,
					richText : true,
				},
				settings : {},
				initialize : function(opts) {
					_.bindAll(this, "render", "updates", "hideControls",
							"attachKonv", "addKonv", "deleteKons");
					this.settings = $.extend({}, this.defaults, opts);

					this.collection = new Posts;
					this.collection.bind("add", this.addKonv, this);
					this.collection.bind("delete", this.removeKonv, this);
					$(document).bind("click", this.hideControls);
				},
				render : function() {

					return this;

				},
				removeKonv : function(konv) {
					var par = this.$('li[data-postid="' + konv.id + '"]');
					if (par)
						par.remove();
					if (!konv.root) {
						this.$(".post[data-konvid=" + konv.id + "]").remove();
						this.trigger("rootRemoved");
					}

				},
				attachKonv : function(obj) {

					this.collection.add(obj);
				},
				addKonv : function(konv) {
					var obj = konv.toJSON();
					var self = this;
					var post = new Akon({
						model : konv,
						collection : this.collection,
						conditionalLoading : true,
						basic : true,
						richText : false,
						onKonvRecieved : function(obj) {
							self.collection.add(obj);
						},
						strictCategory : this.settings.strictCategory,
					});
					if (obj.parent == 0) {
						this.addParent(post, obj);
					} else {
						this.addChildren(post, obj);
					}
				},
				addParent : function(post, obj) {
					var self = this;
					var commUl = $('<ul class="comment-list"></ul>').append(
							post.render().el);

					var muteClass = obj.muted ? "icon-volume-mute"
							: "icon-volume-medium";
					var favClass = obj.favourite ? "icon-star2" : "icon-star";

					var mute_btn = $("<div/>").append("Mute").click(
							function(e) {
								self.handleMute(e, obj);
							}).addClass(" " + muteClass + " akorpddmenuitem ")
							.attr({
								"data-muted" : obj.muted
							});
					var fav_btn = $("<div/>").append("Favourite").click(
							function(e) {
								self.handleFavorite(e, obj);
							}).addClass(" " + favClass + " akorpddmenuitem")
							.attr({
								"data-fav" : obj.favorite
							});
					var linkPost = $("<div/>").append("Link Post").click(
							function(e) {
								self.showLink(e, obj);
							}).addClass("icon-link akorpddmenuitem");
					var settingsControls = $("<div/>").addClass(
							"akorpddmenulist controlslist").append(mute_btn)
							.append(fav_btn).append(linkPost);

					var settingsBtn = $("<span/>").addClass("icon-angle-down ")
							.css({
								"color" : "#555",
								"font-weight" : "bold"
							}).click(this.showControls);

					var settingsZone = $("<div/>").addClass("post-notify-btn")
							.append(settingsBtn).append(settingsControls);

					var content = $('<div class="post"></div>').attr({
						"data-konvid" : obj.id,
						"data-edit_timestamp" : obj.edit_timestamp
					}).append(settingsZone).append(commUl).hide();

					if (this.collection.byFilter)
						this.$el.append(content);
					// this.layout.addItem(content);
					else
						this.$el.prepend(content);

					content.slideDown("slow");

				},
				addChildren : function(post, obj) {
					var par = this.$('li[data-postid="' + obj.parent + '"]');
					if (par) {
						var item = this.collection.get(obj.parent);
						if (!item)
							return;

						item.set({
							"hasChildren" : true
						});
						var list = par.children('ul.commSubList').length ? par
								.children('ul.commSubList') : $('<ul/>')
								.addClass("commSubList").appendTo(par);

						var commElem = $(post.render().el).hide();
						list.append(commElem);
						commElem.slideDown("slow");

					} else {
						//console.log("konversation parent id not found");
					}
				},

				handleMute : function(e, obj) {
					var isMuted = $(e.currentTarget).attr("data-muted");

					if (isMuted == "false") {
						this.changeNotify(obj, "unfollow");
						$(e.currentTarget).removeClass("icon-volume-medium")
								.addClass("icon-volume-mute").attr({
									"title" : "Mute",
									"data-muted" : "true"
								});

					} else {
						this.changeNotify(obj, "follow");
						$(e.currentTarget).removeClass("icon-volume-mute")
								.addClass("icon-volume-medium").attr({
									"title" : "Notify",
									"data-muted" : "false"
								});
					}
				},
				changeNotify : function(post, request) {
					var unique = akp_ws.createUUID();
					var mute_obj = {
						service : "kons",
						mesgtype : "request",
						request : request,
						uid : auth.loginuserid,
						cookie : unique,
						id : post.id
					}
					akp_ws.send({data:mute_obj});

				},
				handleFavorite : function(e, obj) {
					var isMuted = $(e.currentTarget).attr("data-fav");

					if (isMuted == "false") {
						this.changeNotify(obj, "unmark_favourite");
						$(e.currentTarget).removeClass("icon-star2").addClass(
								"icon-star").attr({
							"title" : "Favourite",
							"data-fav" : "true"
						});

					} else {
						this.changeNotify(obj, "mark_favourite");
						$(e.currentTarget).removeClass("icon-star").addClass(
								"icon-star2").attr({
							"title" : "Favourite",
							"data-fav" : "false"
						});
					}
				},
				showControls : function(e) {
					e.preventDefault();
					e.stopPropagation();
					$(e.currentTarget).parent().find(".controlslist").show();
				},
				hideControls : function() {
					this.$(".controlslist").hide();
				},
				showLink : function(e, obj) {

					var loc = window.location;
					var link = new String(loc.origin + loc.pathname
							+ "?konvid=" + obj.id + "&action=vevent_kons"
							+ loc.hash);

					$('<div/>').addClass('dialogClass').append(
							"<p><input type='text' class='link' value='" + link
									+ "' /></p>").dialog(
							{
								resizable : false,
								title : 'Post Link',
								height : 170,
								modal : true,
								buttons : {
									"OK" : function() {

										$(this).dialog("close").remove();

									}
								},
								open : function() {

									$(this).closest(".ui-dialog").find(
											".ui-button:nth-child(1)") // the
									// first
									// button
									.addClass("btn blue");

								}
							});
				},
				getKonv : function(konvid, reset) {
					// console.log("requested Kons ID:"+id);
					var unique = akp_ws.createUUID();
					var req_obj = {
						id : konvid,
						mesgtype : "request",
						request : "get",
						service : "kons",
						cookie : unique,
						uid : auth.loginuserid
					};
					akp_ws.send({data:req_obj});
					streamers[unique] = this.attachKonv;

					if (!reset)
						this.clear();
				},
				loadKonvTree : function() {

				},
				updates : function(type, konv) {

					//console.log(type);
					if (type == "new_konv") {
						if (!konv.parent)
							this.clear();

						this.collection.add(konv);
					} else if (type == "update_konv") {
						var model = this.collection.get(konv.id);
						if (model) {
							model.set(konv);
						}
					} else if (type == "delete_konv") {
						this.collection.scrap(konv);
						return;
					}

					this.settings.onUpdates.call();
				},
				deleteKons : function(id) {
					this.collection.get(id).action("delete");
				},
				clear : function() {
					this.$el.empty();
					this.collection.reset();
				}
			});

			/*
			 * Feed Strem container
			 */

			var Akons = Backbone.View.extend({
						el : "#sharedPosts",
						events : {
							// "scroll":"getMore",
							"click .post" : "expandPost",
							"click .goTop" : "scrollTop",
						},
						settings : {
							"lastTop" : 0,
							byFilter : false
						},
						initialize : function() {
							_.bindAll(this, "getMore", "hideControls");
							posts.bind("add", this.newpost, this);
							// $("body").append(templates);
							this.collection.bind("delete", this.removeNode,									this);
							this.collection.bind("newFilter", this.sendRelay,									this);
							this.collection.bind("getPost", this.exclusive,									this);
							this.collection.bind("focus", this.focusPost, this);
							this.collection.bind("traverseTree",this.loadHierarchy, this);
							this.collection.bind("clear", this.clear, this);
							this.collection.bind("searching",this.handleSearch,this);
							this.collection.bind("load",this.loadPosts,this);
							this.collection.bind("info",this.showInfo,this);

							// this.layout=new
							// layoutManager({itemClass:".post",container:this.$el,});
							// this.sendRelay();
							
							var _self = this;
							// auth.subscribe("loadComplete",function(data){_self.sendRelay("recent");});

							$(".kons-container").bind("scroll", this.getMore);
							// $(document).bind("click",this.hideControls);

						},
						_mapReq : {},
						map : function(prop, value) {
							if (!value) {
								if (this._mapReq[prop])
									return true;
								else
									return false;
							} else {

								this._mapReq[prop] = value;
							}
						},
						init : function(data) {
							if (!data) {
								var _self = this;
								// auth.subscribe("loadComplete",function(data){_self.sendRelay("recent");});
								this.sendRelay("recent");
							} else
								this.parseQuery(data);
						},

						focusPost : function(konvId) {
							var el = this.$('li[data-postid="' + konvId + '"]');

							if (!el.length)
								return false;

							var post = el.children(".comment");

							$('.kons-container').animate({
								scrollTop : post.offset().top
							}, 1000);

							$(post).effect("highlight", 4000);

							return true;
						},
						loadHierarchy : function(id, tree) {
							//console.log(tree);
						},
						parseQuery : function(data) {
							if (data.konvid) {
								this.exclusive(data.konvid)
							}
						},
						handleSearch:function(){
							//clear old results
							this.clear();
							//show loading
							this.showInstantMsg();
						},
						loadPosts:function(){
							
						},
						showInfo:function(msg,type){
							this.clearInstantMsg();
							this.setInfoMsg(msg);
						},
						exclusive : function(id, reset) {

							if(!id || id==null){
								//console.log("requested kons id is empty or null.");
								return false;
							}
							//console.log("requested Kons ID:" + id);
							var unique = akp_ws.createUUID();
							var req_obj = {
								id : id,
								mesgtype : "request",
								request : "get",
								service : "kons",
								cookie : unique,
								uid : auth.loginuserid
							};
							akp_ws.send({data:req_obj});
							this.map(unique, "exclusive");

							if (!reset)
								this.clear();
						},
						getMore : function() {
							var top = $(".kons-container").scrollTop();
							var height = $(".kons-container").height();// this.$el.height();
							var docHeight = $(document).height();
							if (top > this.settings.lastTop) {

								if (!this.$el.hasClass("faraway") && top > 300) {
									this.$el.addClass("faraway");
								}

								if (top + height > docHeight - 100) {
									var id = this.$(".post:last-child").attr(
											"data-konvid");
									var model = this.collection.get(id);
									if (!model)
										return;

									var marker = model.toJSON().edit_timestamp;

									if (marker != this.settings.marker) {

										this.relayReq(this.settings.query,
												this.settings.subquery, marker);
										this.settings["marker"] = marker;
									}
								}
							} else {
								if (this.$el.hasClass("faraway") && top < 300) {
									this.$el.removeClass("faraway");
								}
							}
							
							this.settings.lastTop = top;
							return;
						},
						

						sendRelay : function(query, subquery) {
							this.relayReq(query, subquery);
							this.clear();
							this.showInstantMsg();
						},
						relayReq : function(query, subquery, marker) {
							var unique = akp_ws.createUUID();
							var obj = {
								service : "kons",
								cookie : unique,
								mesgtype : "request",
								request : "relay",
								query : query,
								uid : auth.loginuserid,
								gid : auth.cgd,
							}

							this.settings["query"] = query;

							if (query == "tag" && subquery) {
								obj["tag"] = subquery;
								this.settings["subquery"] = subquery;

							} else if (query == "category" && subquery) {
								obj["category"] = subquery;
								this.settings["subquery"] = subquery;
							}

							if (marker) {
								obj["marker"] = marker;
								// this.settings["marker"]=marker;
							} else {
								this.settings.marker = undefined;

							}

							akp_ws.send({data:obj});
						},
						showLoading:function(){
							
							
							this.setInfoMsg("<span class='preloader icon-spinner2'> </span> Loading...");
							
						},
						showInstantMsg : function() {
							this.hasInstantMsg = true;
							this.showLoading();
							
							var self = this;
							this.instantMsgTimer = setTimeout(function() {
								self.clearStatusMsgs();
								
								self.setInfoMsg("start sharing, be the first to make discussion ...",'alert');
								
								//content.show("fade");
							}, 2000)

						},
						setInfoMsg:function(msg,type){
							var typeClass='';
							if(type == "alert")
								typeClass='konsInstantMsg';
							else if(type == "error"){
								typeClass = 'konsErrorMsg';
								
							}
							else{
								typeClass = 'konsLoadingMsg';
							}
							var content = $('<div/>').addClass("post konsStatusMsg " + typeClass)	.append(msg);
							this.$el.append(content);
						},
						clearInstantMsg : function() {
							if (!this.hasInstantMsg)
								return;

							this.hasInstantMsg = false;
							clearTimeout(this.instantMsgTimer);
							this.$(".post.konsStatusMsg").remove();

						},

						removeNode : function(konv) {
							var par = this.$('li[data-postid="' + konv.id
									+ '"]');
							if (par)
								par.remove();
							if (!konv.root) {
								this.$(".post[data-konvid=" + konv.id + "]")
										.remove();
							}
						},
						newpost : function(konv) {

							var obj = konv.toJSON();
							var post = new Akon({
								model : konv,
								collection : this.collection,
								enableCategories:true,
							});

							if (obj.parent == 0) {
								this.clearInstantMsg();
								this.attachAsParent(post, konv);

							} else {
								this.attachAsChild(post, konv);
							}
						},
						handleMute : function(e, obj) {
							var isMuted = $(e.currentTarget).attr("data-muted");

							if (isMuted == "false") {
								this.changeNotify(obj, "unfollow");
								$(e.currentTarget).removeClass(
										"icon-volume-medium").addClass(
										"icon-volume-mute").attr({
									"title" : "Mute",
									"data-muted" : "true"
								});

							} else {
								this.changeNotify(obj, "follow");
								$(e.currentTarget).removeClass(
										"icon-volume-mute").addClass(
										"icon-volume-medium").attr({
									"title" : "Notify",
									"data-muted" : "false"
								});
							}
						},
						changeNotify : function(post, request) {
							var unique = akp_ws.createUUID();
							var mute_obj = {
								service : "kons",
								mesgtype : "request",
								request : request,
								uid : auth.loginuserid,
								cookie : unique,
								id : post.id
							};
							akp_ws.send({data:mute_obj});

						},
						handleFavorite : function(e, obj) {
							var isMuted = $(e.currentTarget).attr("data-fav");

							if (isMuted == "false") {
								this.changeNotify(obj, "unmark_favourite");
								$(e.currentTarget).removeClass("icon-star2")
										.addClass("icon-star").attr({
											"title" : "Favourite",
											"data-fav" : "true"
										});

							} else {
								this.changeNotify(obj, "mark_favourite");
								$(e.currentTarget).removeClass("icon-star")
										.addClass("icon-star2").attr({
											"title" : "Favourite",
											"data-fav" : "false"
										});
							}
						},
						showControls : function(e) {
							e.preventDefault();
							e.stopPropagation();
							$(e.currentTarget).parent().find(".controlslist")
									.show();
						},
						hideControls : function() {
							this.$(".controlslist").hide();
						},
						showLink : function(e, obj) {

							var loc = window.location;
							var link = new String(loc.origin + loc.pathname
									+ "?konvid=" + obj.id + loc.hash);

							$('<div/>').addClass('dialogClass').append(
									"<p><input type='text' class='link' value='"
											+ link + "' /></p>").dialog(
									{
										resizable : false,
										title : 'Post Link',
										height : 170,
										modal : true,
										buttons : {
											"OK" : function() {

												$(this).dialog("close")
														.remove();

											}
										},
										open : function() {

											$(this).closest(".ui-dialog").find(
													".ui-button:nth-child(1)") // the
											// first
											// button
											.addClass("btn blue");

										}
									});
						},
						expandPost : function(e) {
							$(e.currentTarget).addClass("expand");
						},
						scrollTop : function() {
							// $(window).scrollTop(0);
							$('.kons-container').animate({
								scrollTop : 0
							}, 1000);
						},
						attachAsParent : function(post, konv) {
							this.clearStatusMsgs();
							var self = this;
							var obj = konv.toJSON();
							var commUl = $('<ul class="comment-list"></ul>').append(post.render().el).hide();

							var menu = new PostMenu({
								model : konv
							});
							var settingsZone = menu.render().$el;

							var content = $('<div class="post"></div>').click(this.expandPost).attr({
								"data-konvid" : obj.id,
								"data-edit_timestamp" : obj.edit_timestamp
							}).append(settingsZone).append(commUl);

							if (this.collection.byFilter)
								$(this.el).append(content);
							// this.layout.addItem(content);
							else
								$(this.el).prepend(content);

							commUl.slideDown("slow");
						},
						attachAsChild : function(post, konv) {
							var obj = konv.toJSON();
							var par = this.$('li[data-postid="' + obj.parent
									+ '"]');
							if (par) {
								var item = posts.get(obj.parent);
								if (!item)
									return;

								item.set({
									"hasChildren" : true
								});
								var list = par.children('ul.commSubList').length ? par
										.children('ul.commSubList')
										: $('<ul/>').addClass("commSubList")
												.appendTo(par);

								var commElem = $(post.render().el).hide();
								list.append(commElem);
								commElem.slideDown("slow");

							} else {
								//console.log("konversation parent id not found");
							}
						},
						clear : function() {
							this.$(".post").remove();
							/*
							 * var posts=this.collection;
							 * 
							 * while(posts.length>0){ posts.remove(posts.at(0)); }
							 */
							this.collection.reset();
						},
						clearStatusMsgs:function(){
							this.$(".post.konsInstantMsg").remove();
							this.$(".post.konsLoadingMsg").remove();
						}
					});

			var PostMenu = Backbone.View.extend({
				className : "post-notify-btn",
				events : {
					"click .postmute" : "handleMute",
					"click .postfav" : "handleFavorite",
					"click .postlink" : "showLink",
					"click .showPostCntrls" : "showControls",
				},
				initialize : function() {
					var obj = this.obj = this.model.toJSON();
					_.bindAll(this, "hideControls");
					var muteClass = obj.muted ? "icon-volume-mute"
							: "icon-volume-medium";
					var favClass = obj.favourite ? "icon-star2" : "icon-star";

					var mute_btn = $("<li/>").append("Mute").addClass(
							" " + muteClass + " akorpddmenuitem postmute")
							.attr({
								"data-muted" : obj.muted
							});
					var fav_btn = $("<li/>").append("Favourite").addClass(
							" " + favClass + " akorpddmenuitem postfav").attr({
						"data-fav" : obj.favorite
					});
					var linkPost = $("<li/>").append("Link Post").addClass(
							"icon-link akorpddmenuitem postlink");
					var settingsControls = $("<ul/>").addClass(
							"akorpddmenulist controlslist dropdown-menu")
							.append(mute_btn).append(fav_btn);//.append(linkPost);

					var settingsBtn = $("<span/>").addClass(
							"icon-angle-down showPostCntrls pull-right");

					this.$el.append(settingsBtn).append(settingsControls);
					$(document).bind("click", this.hideControls);

				},
				render : function() {

					return this;
				},
				handleMute : function(e) {
					var obj = this.obj;

					var isMuted = $(e.currentTarget).attr("data-muted");

					if (isMuted == "false") {
						this.changeNotify(obj, "unfollow");
						$(e.currentTarget).removeClass("icon-volume-medium")
								.addClass("icon-volume-mute").attr({
									"title" : "Mute",
									"data-muted" : "true"
								}).html('Mute');

					} else {
						this.changeNotify(obj, "follow");
						$(e.currentTarget).removeClass("icon-volume-mute")
								.addClass("icon-volume-medium").attr({
									"title" : "Notify",
									"data-muted" : "false"
								}).html('Unmute');
					}
				},
				changeNotify : function(post, request) {
					var unique = akp_ws.createUUID();
					var mute_obj = {
						service : "kons",
						mesgtype : "request",
						request : request,
						uid : auth.loginuserid,
						cookie : unique,
						id : post.id
					};
					akp_ws.send({data:mute_obj});

				},

				handleFavorite : function(e) {
					var obj = this.obj;
					var isFav = $(e.currentTarget).attr("data-fav");

					if (isFav == "false") {
						this.changeNotify(obj, "unmark_favourite");
						$(e.currentTarget).removeClass("icon-star2").addClass(
								"icon-star").attr({
							"title" : "Favourite",
							"data-fav" : "true"
						});

					} else {
						this.changeNotify(obj, "mark_favourite");
						$(e.currentTarget).removeClass("icon-star").addClass(
								"icon-star2").attr({
							"title" : "Favourite",
							"data-fav" : "false"
						});
					}
				},
				showControls : function(e) {
					e.preventDefault();
					e.stopPropagation();
					$(e.currentTarget).parent().find(".controlslist").show();
				},
				hideControls : function() {
					this.$(".controlslist").hide();
				},
				showLink : function(e) {
					var obj = this.obj;
					var loc = window.location;
					var link = new String(loc.origin + loc.pathname
							+ "?konvid=" + obj.id + loc.hash);

					$('<div/>').addClass('dialogClass').append(
							"<p><input type='text' class='link' value='" + link
									+ "' /></p>").dialog(
							{
								resizable : false,
								title : 'Post Link',
								height : 170,
								modal : true,
								buttons : {
									"OK" : function() {

										$(this).dialog("close").remove();

									}
								},
								open : function() {

									$(this).closest(".ui-dialog").find(
											".ui-button:nth-child(1)") // the
									// first
									// button
									.addClass("btn btn-primary");

								}
							});
				},
			})

			var filtersView = Backbone.View
					.extend({
						el : $("#kons_sidebar"),
						defaults : {
							activeFilter : "recent",
							categoryFilter : {
								"discussion" : true,
								"share" : true,
								"question" : true
							},

						},
						open : false,
						settings : {},
						events : {
							"click .filtertype" : "_filterByType",
							'keypress .konv_category_add_input' : 'handleCategoryAdd',
							'click .konv_category_remove' : 'handleCategoryRemove',

						},
						initialize : function(options) {
							_.bindAll(this, "render", "loadCategories");
							this.settings = $
									.extend({}, options, this.defaults);
							this.collection.bind("newFilter",
									this.chooseFilter, this);
							this.collection.bind("clear", this.resetView, this);
							auth.subscribe("groupInit", this.loadCategories);
						},
						render : function() {

						},
						resetView : function() {
							this.showActive(this.defaults.activeFilter);
						},

						showMenu : function() {
							if (this.open)
								return;

							this.open = true;
							this.$(".kons_filters_list").addClass("kfl-open");
						},
						hideMenu : function(event) {
							if (this.open) {
								event.stopPropagation();
								this.$(".kons_filters_list").removeClass(
										"kfl-open");
								this.open = false;
							}
						},
						chooseFilter : function(query, subquery) {
							if (query == "tag")
								this.makeInActive();
							else if (this.settings.categoryFilter[subquery])
								this.showActive(subquery);

						},
						_filterByType : function(e) {
							var query = $(e.currentTarget).attr("data-filter");
							this.relayRequest(query)
						},
						relayRequest : function(query) {

							if (this.settings.activeFilter == query)
								return;

							if (this.settings.categoryFilter[query])
								this.collection.trigger("newFilter",
										"category", query);
							else
								this.collection.trigger("newFilter", query);

							this.showActive(query);
						},
						showActive : function(filter) {
							this.settings.activeFilter = filter;
							this.$(".filtertype[data-filter = " + filter + "]")
									.siblings().removeClass("active").end()
									.addClass("active");
						},
						makeInActive : function() {
							this.$(".filtertype").removeClass("active");
							this.settings.activeFilter = "";
						},
						setPosition:function(len){
							
							var elem = this.$(".kons_filters_list");
							this.$el.css({'display' : 'block','visibility': 'hidden' });
							//var h = elem.clone().css({'position':'absolute','display':'block','visibility':'visible'}).height();
							this.$el.css({'visibility': 'visible' });

							 this.$(".konv-updates").css("top",270+len*32);
						},
						loadCategories : function(group) {
							this.$(".filtertype.konv_category,.konv_category_add").remove();

							this.collection.categories = group.categories;
							this.group = group;
							this.isAdmin = this._isAdmin(group);
							//this.$("")
							var count = group.categories.length;

							for ( var i = 0; i < count; i++) {
								var category = this.addCategory(group.categories[i],this.isAdmin);
								this.$(".kons_filters_list ul")	.append(category);
							}
							
							if(this.isAdmin){
								var addBox = $("<li/>").append("<input class='konv_category_add_input' type='text' placeholder='Add category' />").addClass("konv_category_add");
								this.$(".kons_filters_list ul")	.append(addBox);
								count++;
							}
							
							
							this.setPosition(count);
						},
						
						addCategory:function(categoryItem,isAdmin){
							var category = $("<li/>").addClass("filtertype konv_category").attr(
									"data-filter",categoryItem )
									.append(categoryItem);
							
							if(isAdmin){
								category.append('<span class="icon-close pull-right konv_category_remove"></span>');
							}
							return category;
							
						},
						_isAdmin:function(group){
							if(group)
								return group.admin == auth.loginuserid;
							return false;
						},
						handleCategoryAdd:function(e){
							if(e.keyCode == 13){
								var category = this.addCategory(e.currentTarget.value,true);
								auth.addCategory(e.currentTarget.value,this.handleResponse);
								category.insertBefore(this.$(".konv_category_add"));
								e.currentTarget.value = "";
							}
						},
						handleCategoryRemove:function(e){
							e.stopPropagation();
							var cat =$(e.currentTarget).closest(".konv_category");
							var identity = cat.attr("data-filter");
							
							cat.remove();
							auth.deleteCategory(identity,this.handleResponse);
						},
						handleResponse:function(resp){
							if(resp.status == 'success'){
								
							}else if(resp.error){
								$.noty({
									text : resp.error,
									timeout:3000,
									type : 'error',
									layout:'bottomRight'
								})
							}
						}

					});
			
			
			
			App.Views.konsShareDialog = Backbone.View.extend({
				initialize:function(){
					
					_.bindAll(this,'close','post');
					
					this.$el.appendTo('body');
					
					var groups = auth.getUserGroups();
					
					
					
					var shareConfig = {
							el : this.$el,
							model : this.model,
							type : "new",
							onShare : this.post,
							onCancel : this.close,
							basic : true,
							richText : false,
							disabled:true,
							groups: this.excludeCurrentGroup(groups),
							enableCategories:true,
						}

						var shareform = new konsEntry(shareConfig);
					
					
				},
				excludeCurrentGroup:function(groups){
					var currentGroup=auth.cgd,index=null;
					
					for(var i=0;i<groups.length;i++){
						if(groups[i].get("gid") == currentGroup){
							index = i;
							break;
						}
					}
					if(index!== null)
					groups.splice(index,1);
					
					return groups;
				},
				render:function(){
					
					
					
					this.$el.dialog({
						title:"Share",
						width:500,
						modal:true,
						close:this.close,
					});
					
					
					
					return this;
				},
				post:function(data){
					/*if (this.settings.strictCategory)
						data.category = this.settings.strictCategory;
*/
					akp_ws.send({data:data},true);
					//console.log(data);
					
					this.close();
				},
				close:function(){
					this.$el.dialog('close').remove();
				},
				
			});
			
			
			App.Views.konsSearchView=Backbone.View.extend({
				el:"#kons-search",
				resultsCount:0,
				events:{
					'keypress #kons-search-input' : 'filterSearch',
					'click .kons-search-btn': 'searchPosts',
					'submit #kons-search-form': 'searchSubmit',
					
				},
				initialize:function(){
					_.bindAll(this,"handleResults");
				},
				render : function(){
					return this;
				},
				searchSubmit:function(e){
					e.preventDefault();
				},
				searchPosts:function(){
					var value=this.$("#kons-search-input").val();
					//on press enter send search req
					if(value.length<4){
						this.updateStatus("Please enter minimum 4 charecters.");
						return false;
					}
					this.collection.search(value,this.handleResults);
					this.resultsCount=0;
				},
				filterSearch:function(e){
					if(e.keyCode==13){
						this.$(".kons-search-btn").click();
						
					}
				},
				handleResults:function(result,id,type){
					if(type != 'error'){
					this.resultsCount++
					
					
					var msg={};
					msg.result=result;
					msg.cookie = id;
					this.collection.load(msg);
				}
					else{
						this.collection.setInfo(type,result)
					}
					this.updateStatus("Found <strong>"+ this.resultsCount + "</strong> result(s).");
				},
				updateStatus:function(msg){
					this.$(".kons-search-status").html(msg);
				},
				
			});

			var konsEntry = Backbone.View
					.extend({

						className : "konsEntry",
						events : {
							// main actions
							"click .commpost" : "share",
							"click .commpostno" : "cancel",

							// input actions
							"focus .commInput" : "focus",
							"click .commInput" : "clear",
							"mouseup .commInput" : "checkCommands",
							"paste .commInput" : "checkURL",
							"keyup .commInput" : "checkContent",

							// link checking actions
							"click .linkURLbtn" : "showLinkInput",
							"paste .postURL" : "checkURL",
							"click .addURL" : "loadURL",

							"click .addTag" : "showTaginput", // tag input
							"click .attach" : "showFileSelector",// file
							// selector

							// checking categories

							"click .postCategories" : "showCategories",
							"click .postcategory" : "selectCategory",
							
							
							//checking Groups 
							"click .postGroups" : "showGroupList",
							'click .postGroup' : "selectPostGroup", 
						

							// richtext tools
							"click .intLink" : "applyStyle",
							"change .colorLink" : "setColor",

							// user selector
							"click .commflw" : "showModeOptions",
							"click .opt" : "selectMode",
							"click .ubrowser" : "userBrowser",

						// image selector

						},
						defaults : {
							attachments : [],
							onShare : "",
							onCancel : "",
							type : "new",
							maxTags : 5,
							maxAttachments : 5,
							mode : 'public',
							tagInput : true,
							fileBrowser : true,
							linkInput : true,
							membersInput : true,
							basic : false,
							richText : true,
							defaultCategory : "discussion",
							allowImages : true,
							autoFocus:false, //this will set opened state
							enableCategories:false,
							disabled:false,
							groups:[],
						},
						settings : {},
						initialize : function(options) {
							
							_.bindAll(this, "render", "selectedFile",
									"removeAttachment", "selectMode",
									"hideModeOptions", "setUsers",
									"loadLinkPreview", "removeLink","loadURL", 'selectPostGroup');

							this.settings = $
									.extend({}, this.defaults, options);
							
							this.settings.attachments = [];
							this.settings.entryId = akp_ws.createUUID();
							this.render();
							
							
							this.$el.attr("data-expanded", "false");
							this.$(".tagData").hide();
							this.$(".linkData").hide();
							this.$(".postCategories").hide();
							this.$(".postcategorieslist").hide();
							this.$(".tagInput").val("");
							this.$(".postUsers,.postGroups").hide();
							this.$(".postLinkPreview").hide();
							this.$(".tagInput").tagsInput({
								'height' : 'auto',
								'width' : 'auto'
							});
							
							this.userInput = contacts.selector({
								el : this.$(".userData")
							}).render();
							
							
							$(document).click(this.hideModeOptions);
							
							if(this.settings.autoFocus)
								this.clear();
							
							if(this.settings.enableCategories)
								this.showCategory();
							
							var postGroups=this.settings.groups;
							if(postGroups.length){
								this.showGroupSelector();
							}

							if(this.model){
								this.loadValues();
							}
						},
						render : function() {
							this.template = $("#kons-entry-template").tmpl([ this.settings ]);
							$(this.el).html(this.template).addClass(
									this.className);
							return this;
						},
						showGroupSelector:function(){
							this.$(".postCategories").hide();
							this.$(".postcategorieslist").hide();
							this.$(".postGroupsList").hide();
							this.$(".postGroups").show();
							this.loadGroupsList();
						},
						loadGroupsList:function(){
							this.$(".postGroupsList").empty();
							var groups= this.settings.groups;
							for (var i=0;i<groups.length;i++ ){
								var group=groups[i].toJSON();
								$("<div/>").addClass('postGroup').attr({"data-gid":group.gid,'data-gindex':i}).append(group.gname).appendTo(this.$(".postGroupsList"));
							}
						},
						showGroupList:function(){
							this.$(".postGroupsList").show();
						},
						selectPostGroup:function(e){
							this.$(".postGroupsList").hide();
							var value = $(e.currentTarget).text();
							var gid = $(e.currentTarget).attr("data-gid");
							var index = $(e.currentTarget).attr("data-gindex");
							this.$(".selectedGRP").children(".GRPname").html(value).attr("data-gid", gid);
							
							this.showCategory();
							var groups = this.settings.groups;
							
							this.loadCategories(groups[index].toJSON().categories);
						},
						getSelectedGroup:function(){
							var gid = this.$(".selectedGRP").children(".GRPname").attr("data-gid");
							return gid ? parseInt(gid) : false;
							
						},
						loadCategories:function(categories){
							this.$(".postcategorieslist").empty();
							
							for (var i=0;i<categories.length;i++ ){
								var category = categories[i];
								$("<div/>").addClass('postcategory').attr({"data-name":category}).append(category).appendTo(this.$(".postcategorieslist"));
							}
						},
						checkContent : function(e) {

							// should be implemented in kons entry

							var textlength = $(e.currentTarget).text().length;
							if (textlength <= 0)
								this.disableShare();
							else
								this.activateShare();

						},
						activateShare : function() {
							this.$(".commpost").removeAttr("disabled");
						},
						disableShare : function() {
							this.$(".commpost").attr("disabled", "disabled");
						},

						loadValues : function() {
							var data = this.model.toJSON();
							this.clear();

							if (data["taglist"].length && !this.settings.basic) {
								this.showTaginput();
								this.loadTags(data.taglist);
							}

							if (data["attachments"].length
									&& !this.settings.basic) {

								this.showFileList();
								this.loadFiles(data.attachments);
							}

							if (!data.parent && !this.settings.basic) {
								this.settings.isRoot = true;
								this.showCategory();
								this.setCategory(data.category);
							} else {
								this.hideInactive();
							}

							if (data.followers && !this.settings.basic) {
								this.switchMode("private");
								this.userInput.addUsers(data.followers);
							}

							this.loadContent(data.content)

						},
						showLinkInput : function(e) {
							$(e.currentTarget).hide();
							this.$(".linkData").show();
						},
						hideLinkInput : function() {
							this.$(".linkData").hide();
						},
						checkURL : function(e) {
							var data = e.originalEvent.clipboardData
									.getData('Text');

							var status = this.parseURL(data);

						},
						loadURL : function() {
							var data = this.$(".postURL").val();

							var status = this.parseURL(data);

						},
						validateURL : function() {
							this.$(".addURL").children("span").removeClass(
									"icon-checkmark")
									.addClass("icon-spinner2").end()
									.removeClass(" greenbtn").unbind();
							this.$(".postURL").attr("disabled", true);
						},
						resetLinkInput : function() {
							this.$(".addURL").children("span").removeClass(
									"icon-spinner2")
									.addClass("icon-checkmark").end().addClass(
											"btn greenbtn btn-icon ").bind(
											"click", this.loadURL);
							this.$(".postURL").attr("disabled", false);
						},
						parseURL : function(data) {
							var isurl = utils.isURL(data);
							if (!isurl)
								return false;

							this.validateURL();
							
							this.settings.state = "edit";

							var vidId = utils.youtubeURL(data);

							if (vidId) {
								this.loadVideoPreview(vidId);
								this.hideLinkInput();
								return true;
							} else {
								this.getURLPreview(data);
							}

						},
						getURLPreview : function(url) {
							var unique = akp_ws.createUUID();
							var obj = {
								service : "kons",
								url : url,
								mesgtype : "request",
								request : "create_thumbnail",
								cookie : unique,
								uid : auth.loginuserid,
								gid:auth.cgd,
							}
							akp_ws.send({data:obj});
							mapper.set(unique, this.loadLinkPreview);
						},
						onPaste : function(e) {
							var data = e.originalEvent.clipboardData
									.getData('Text');
							var url = utils.isURL(data);
							if (!url)
								return;

							var vidId = utils.youtubeURL(data);

							if (!vidId)
								return;
							// alert("valid youtube URL");
							this.loadVideoPreview(vidId);

						},
						loadLinkPreview : function(data) {
							if (this.settings.state != "edit")
								return;

							var isLoaded = this.$(".postLinkPreview").attr(
									"data-Loaded")
							if (isLoaded == "true")
								return;
							if (!data.title)
								return;

							this.$(".postLinkPreview")
									.attr("data-Loaded", true);

							var img = "", title = "", desc = "", url = "", content = "", cross = "";
							if (data.image)
								img = $("<img/>").attr("src", data.image)
										.addClass("thumbnail");

							title = $(
									"<span><a href='" + data.url
											+ "' target='_blank'>" + data.title
											+ "</a></span>").addClass("title");
							url = $("<span/>").append(data.url)
									.addClass("link");
							desc = $("<p/>").append(data.description);

							cross = $("<span />").addClass(
									"icon-cross linkRemove").bind("click",
									this.removeLink);

							var content = $("<div/>").append(title).append(url)
									.append(desc);

							var temp = $("<div/>").append(img).append(content)
									.append(cross).addClass("webthumbnail");
							this.$(".postLinkPreview").append(temp).show();
							this.settings.hasPreview = true;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
							this.hideLinkInput();

						},
						loadVideoPreview : function(id) {
							if (this.settings.state != "edit")
								return;

							var isLoaded = this.$(".postLinkPreview").attr(
									"data-Loaded")
							if (isLoaded == "true")
								return;
							this.$(".postLinkPreview")
									.attr("data-Loaded", true);
							var temp = $(
									'<iframe width="560" height="315" src="http://www.youtube.com/embed/'
											+ id
											+ '?wmode=transparent&rel=0" frameborder="0" allowfullscreen></iframe>')
									.css({
										"width" : "100%"
									});
							var cross = $("<span />").addClass(
									"icon-cross linkRemove").bind("click",
									this.removeLink);
							var container = $("<div/>")
									.addClass("vidthumbnail").append(temp)
									.append(cross);

							this.$(".postLinkPreview").append(container).show();
							this.settings.hasPreview = true;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
							this.hideLinkInput();
						},
						loadPreviewAttachment : function(preview) {
							this.$(".postLinkPreview")
									.attr("data-Loaded", true);

							this.$(".postLinkPreview").append(preview).show();

							this.settings.hasPreview = true;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
							this.hideLinkInput();
						},
						removeLink : function() {
							this.$(".postLinkPreview").empty().attr(
									"data-Loaded", false).hide();
							this.settings.hasPreview = false;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
						},
						showModeOptions : function(e) {
							e.preventDefault();
							e.stopPropagation();
							this.$(".flwOpt").show();
						},
						hideModeOptions : function() {
							this.$(".flwOpt").hide();
						},
						selectMode : function(e) {
							this.hideModeOptions();

							var mode = $(e.currentTarget).attr("data-mode");
							if (mode == this.settings.mode)
								return;

							this.switchMode(mode);

						},
						switchMode : function(mode) {

							this.setMode(mode)
							if (mode == "private")
								this.showUserSelector()
							else
								this.hideUserSelector();
						},
						setMode : function(mode) {
							this.settings.mode = mode;
							var classname = (mode == "public") ? "icon-earth"
									: "icon-users2";
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users2").addClass(
									classname);
						},
						showUserSelector : function() {
							this.$(".postUsers").show();
							this.userInput.getFocus();
						},

						hideUserSelector : function() {
							this.$(".postUsers").hide();
							this.userInput.reset();
						},
						userBrowser : function() {

							var browser = contacts.browser({
								onFinish : this.setUsers
							});
							var existUsers = this.userInput.getSelected();
							browser.selectUsers(existUsers);
						},
						setUsers : function(users) {
							this.userInput.reset().addUsers(users);

						},
						hideInactive : function() {
							this.$(".commfollowers").hide();
							this.$(".attach").hide();
							this.$(".addTag").hide();
							this.$(".addPic").hide();
							
						},
						
						loadContent : function(content) {
							var contHtml = utils.htmlUnescape(content);
							var mainEl = $("<div/>").append(contHtml);
							var prevEL = mainEl.filter(function() {
								return $(this).hasClass("vidthumbnail")
										|| $(this).hasClass("webthumbnail");
							});

							if (prevEL.length) {
								this.model.set({
									"hasPreview" : true
								});
								this.loadPreviewAttachment(prevEL);
							}

							var filterdCont = mainEl
									.not(".vidthumbnail,.webthumbnail");
							this.$(".commInput").empty().html(filterdCont);
						},
						applyStyle : function(e, sValue) {
							var sCmd = $(e.currentTarget).attr("data-cmd");
							this.formatDoc(sCmd);
							this.toggleCommand(sCmd)
							// oDoc.focus();
						},
						checkCommands : function() {

							this.toggleCommand("bold");
							this.toggleCommand("italic");
							this.toggleCommand("underline");

						},
						toggleCommand : function(sCmd) {
							if (document.queryCommandState(sCmd)) {
								this.$(".intLink[data-cmd=" + sCmd + "]")
										.addClass("active")
							} else {
								this.$(".intLink[data-cmd=" + sCmd + "]")
										.removeClass("active")
							}
						},
						setColor : function(e) {
							var color = $(e.currentTarget).val();
							this.formatDoc("forecolor", color)
						},
						formatDoc : function(sCmd, sValue) {
							document.execCommand(sCmd, false, sValue);
							this.$('.commInput').focus();
						},
						focus : function(e) {
							this.$(".commInput").css("border-color", "#04bfbf");
						},
						showTaginput : function(e) {
							$(".addTag").hide();
							this.$(".tagData").show();
						},
						loadTags : function(tags) {
							if (tags instanceof Array) {
								var tagstr = "";
								for ( var i = 0; i < tags.length; i++) {
									tagstr += tags[i] + ",";
								}
							}
							this.$(".tagInput").importTags(tagstr);

						},
						showFileSelector : function() {
							var selector = akp_ws
									.fileSelector(this.selectedFile);
							// var file = selector.result();
						},
						showCategory : function() {
							this.$(".postCategories").show();
						},
						showCategories : function() {
							this.$(".postCategories").focus();
							this.$(".postcategorieslist").show();
						},
						selectedFile : function(files) {

							if (!files.length)
								return;

							var filesdata = this.models2data(files);
							this.loadFiles(filesdata);
							

						},
						showFileList : function() {
							this.$(".postAttachments").show();
						},
						loadFiles : function(files) {
							// this.settings["attachments"].push.apply(this.settings.attachments,files);
							for (file in files) {

								var f = files[file];
								this.settings["attachments"].push(f);
								var attach = this.getFile(f);
								attach.find(".rmAttach").bind("click", {
									file : f
								}, this.removeAttachment);
								$("<li/>")
										.addClass("semAttach")
										.append(attach)
										.appendTo(this.$(".postAttachments ul"));

							}
						},
						removeAttachment : function(e) {
							var file = e.data.file;
							var count = this.settings["attachments"].length;
							var attachments = this.settings["attachments"];
							for ( var i = 0; i < count; i++) {
								var attch = attachments[i];
								if (attch.path == file.path) {
									$(e.currentTarget).parents("li.semAttach")
											.remove();
									this.settings["attachments"].splice(i, 1);
									break;
								}
							}

						},
						getFile : function(file) {
							var data = {};
							$.extend(data, file);
							var mimeclass = utils.mime2class(data.type);
							var sizeBytes = utils.convBytes(data.size, 2);
							data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"
									: mimeclass;
							data["size"] = sizeBytes;
							data["hasRemove"] = true;
							return $("#attachment-template").tmpl([ data ]);
						},

						selectCategory : function(e) {
							this.$(".postcategorieslist").hide();
							var value = $(e.currentTarget).text();
							var name = $(e.currentTarget).attr("data-name");
							this.$(".selectedCTG").children(".CTGname").html(
									value).attr("data-name", name);
						},
						setCategory : function(name) {
							this.$(".selectedCTG").children(".CTGname").html(
									name).attr("data-name", name);
						},

						getTags : function() {
							var tagsString = this.$(".tagInput").val();
							if (tagsString)
								return tagsString.split(",");
							else
								return [];
						},
						models2data : function(models) {
							var list = [];
							for ( var i = 0; i < models.length; i++) {
								var file = models[i];
								var model = file.toJSON();
								list.push({
									isdir : model.isdir,
									path : model.path,
									type : model.type,
									size : model.size,
									fname : model.fname
								});
							}
							return list;
						},
						formatContent : function(content) {
							return utils.htmlEscape(content.find("a[href]")
									.attr("target", "_blank").end().html());
						},

						share : function() {

							if (!this.$('.commInput').text().length)
								return;
							
							var groups =this.settings.groups;
							if(groups.length)
								if(!this.getSelectedGroup())
									return;

							var commInput = this.formatContent(this
									.$('.commInput'));// .html();

							if (this.settings.hasPreview)
								commInput += this.$(".postLinkPreview").html();

							var tags = this.getTags();
							var date = new Date();
							var category = this.$(".selectedCTG").children(".CTGname").attr("data-name");
							var attachments = this.settings.attachments;

							if (this.model) {
								var obj = this.model.toJSON();
								this.sendreq(commInput, obj.id, obj.parent,
										obj.root, this.settings.type,
										obj.create_timestamp, date.getTime(),
										tags, category, attachments);
							} else {
								this.sendreq(commInput, 0, 0, 0, "new", date
										.getTime(), date.getTime(), tags,
										category, attachments);
							}

							this.settings.attachments = [];
							this.blur();
						},

						sendreq : function(post, id, parent, root, type,
								create_time, edit_time, tags, kind, files) {
							var unique = akp_ws.createUUID();
							var shar_obj = {
								service : "kons",
								mesgtype : "request",
								request : type,
								uid : auth.loginuserid,
								cookie : unique,
								parent : parent,
								content : post,
								create_timestamp : create_time,
								//gid : auth.cgd,
								edit_timestamp : edit_time,
								root : root,
								// category : kind,
								taglist : tags,
								attachments : files,
							// images:[],

							}
							
							/*if (this.settings.isRoot) {
								shar_obj["category"] = kind;
							}*/
							
							if(this.settings.enableCategories)
								{
								shar_obj["category"]=kind;
								}
							
							
							var groups =this.settings.groups;
							if(groups.length){
								shar_obj['gid'] = this.getSelectedGroup();
							}else{
								shar_obj['gid'] = auth.cgd;
							}
							
							

							if (this.settings.type == "edit")
								shar_obj["id"] = id;
							
							

							if (this.settings.mode == "private") {
								shar_obj["followers"] = this.userInput
										.getSelected();
								shar_obj["followers"].push(auth.loginuserid);
							}

							if (typeof this.settings.onShare === 'function')
								this.settings["onShare"].apply(this,[ shar_obj ]);
							
								// akp_ws.send(shar_obj);
								// maptable[unique] = type;

						},
						blur : function() {
							this.$('.postcancel').fadeOut();
							this.$(".postcategorieslist").hide();
							this.$(".postUsers").hide();
							this.$(".postLinkPreview").hide();
							this.$(".tagData").hide();
							this.$(".linkData").hide();
							
							if(!this.settings.autoFocus){
								this.$('.post-action').hide('slow', "swing");
							}
							
							if(!this.settings.enableCategories){
								this.$(".postCategories").hide();
							}
							
							this.reset();
							// this.$("#postAttachments").hide();

						},
						reset : function() {
							
							if(!this.settings.autoFocus){
								this.$el.attr("data-expanded", "false").removeClass("editing");
							}
							
							var dfltmsg = $("<span/>").addClass("dfltcmttxt")
									.append("What's up...");

							this.$('.commInput').empty().append(dfltmsg).blur();
							// .parent().parent().css('min-height', '40px');
							this.$(".postAttachments").hide().children('ul')
									.empty();
							var defaultCategory = this.$(".postcategorieslist").children(".postcategory:first").text();

							this.$(".selectedCTG").children(".CTGname").html(
									defaultCategory);
							this.$(".addTag").show();
							this.$(".tagInput").importTags('');
							this.setMode("public");
							this.userInput.reset();
							this.settings.attachment = [];
							// this.settings.mode="public";

							this.$(".postLinkPreview").empty().attr(
									"data-Loaded", false);
							this.$(".postURL").val("");
							this.$(".linkURLbtn").show();
							this.resetLinkInput();
							this.$(".selectedCTG").children(".CTGname").html(
									defaultCategory);

							this.settings.hasPreview = false;
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users2").addClass(
									"icon-earth");
							this.settings.state = "mute";

							this.disableShare();

						},
						cancel : function() {
							this.blur();
							if (typeof this.settings.onCancel === 'function')
								this.settings["onCancel"].apply(this)
						},
						clear : function() {
							this.$('.dfltcmttxt').remove();
							this.$el.addClass("editing");
						},
						remove : function() {
							$(this.el).remove();
							/*
							 * this.model.set({ "rep" : false });
							 */
						}
					});

			var map = function() {
				this.Queries = {}

			}
			map.prototype.set = function(id, str) {
				this.Queries[id] = str;
			}
			map.prototype.get = function(id) {
				return this.Queries[id];
			}

			var mapper = new map;

			var MasterView = Backbone.View
					.extend({
						el : $("#userDefaultNewPost"),
						defaults : {

						},
						settings : {
							"attachments" : [],
							mode : "public",
							hasPreview : false,
							state : "mute",
							images : [],
							hasImage : false,
						},
						events : {

							// input actions

							"click #defltPostCnt" : "ready",
							"contextmenu #defltPostCnt" : "ready",
							"paste #defltPostCnt" : "checkURL",
							"keyup  #defltPostCnt" : "checkContent",

							"click #addTag" : "showTaginput",

							"click .linkURLbtn" : "showLinkInput",
							"paste .postURL" : "checkURL",
							"click .addURL" : "loadURL",

							"click #attachFiles" : "showFileSelector",

							// category selection
							"click #postCategories" : "showCategories",
							"click .postcategory" : "selectCategory",

							// binding richtext controls
							"click .intLink" : "applyStyle",
							"change .colorLink" : "setColor",
							"mouseup  #defltPostCnt" : "checkCommands",

							// followers controls
							"click .commflw" : "showModeOptions",
							"click .opt" : "selectMode",
							"click .ubrowser" : "userBrowser",

							// main actions
							"click #shareSubmit" : "share",
							"click #postcancel" : "blur",

							// image actions
							"click .pickPic" : "callFileInput",
							"change .fpicselector" : "showPics",

						},
						initialize : function() {

							_.bindAll(this, "selectedFile", "selectMode",
									"hideModeOptions", "removeAttachment",
									"setUsers", "callFileInput",
									"loadLinkPreview", "removeLink");

							this.collection.bind("clear", this.blur, this);

							this.$el.attr("data-expanded", "false");
							this.$("#tagData").hide();
							this.$(".linkData").hide();
							this.$("#postCategories").hide();
							this.$("#postcategorieslist").hide();
							this.$(".postUsers").hide();
							this.$(".postLinkPreview").hide();
							this.$("#tagInput").val("");

							this.$("#tagInput").tagsInput({
								'height' : 'auto',
								'width' : 'auto'
							});

							this.userInput = contacts.selector({
								el : this.$(".userData")
							}).render();

							$(document).click(this.hideModeOptions);
						},
						clearView : function() {

						},
						checkContent : function(e) {

							// should be implemented in kons entry

							var textlength = $(e.currentTarget).text().length;
							if (textlength <= 0)
								this.disableShare();
							else
								this.activateShare();

						},
						activateShare : function() {
							this.$("#shareSubmit").removeAttr("disabled");
						},
						disableShare : function() {
							this.$("#shareSubmit").attr("disabled", "disabled");
						},
						callFileInput : function() {
							this.$(".fpicselector").click();
						},
						showLinkInput : function(e) {
							$(e.currentTarget).hide();
							this.$(".linkData").show();
						},
						hideLinkInput : function() {
							this.$(".linkData").hide();
						},
						checkURL : function(e) {
							var data = e.originalEvent.clipboardData
									.getData('Text');

							var status = this.parseURL(data);

						},
						loadURL : function() {
							var data = this.$(".postURL").val();
							var status = this.parseURL(data);

						},
						validateURL : function() {
							this.$(".addURL").removeClass(
									" greenbtn  icon-checkmark").addClass(
									"icon-spinner2").unbind();
							this.$(".postURL").attr("disabled", true);
						},
						resetLinkInput : function() {
							this.$(".addURL").addClass(
									"btn greenbtn btn-icon icon-checkmark")
									.removeClass("icon-spinner2").bind(
											"click", this.loadURL);
							this.$(".postURL").attr("disabled", false);
						},
						parseURL : function(data) {

							var isurl = utils.isURL(data);
							if (!isurl)
								return false;

							this.validateURL();

							var vidId = utils.youtubeURL(data);

							if (vidId) {
								this.loadVideoPreview(vidId);
								this.hideLinkInput();
								return true;
							} else {
								this.getURLPreview(data);
							}

						},
						getURLPreview : function(url) {
							var unique = akp_ws.createUUID();
							var obj = {
								service : "kons",
								url : url,
								mesgtype : "request",
								request : "create_thumbnail",
								cookie : unique,
								uid : auth.loginuserid
							}
							akp_ws.send({data:obj});
							mapper.set(unique, this.loadLinkPreview);
						},
						onPaste : function(e) {
							var data = e.originalEvent.clipboardData
									.getData('Text');
							var url = utils.isURL(data);
							if (!url)
								return;

							var vidId = utils.youtubeURL(data);

							if (!vidId)
								return;
							// alert("valid youtube URL");
							this.loadVideoPreview(vidId);

						},
						loadLinkPreview : function(data) {
							if (this.settings.state != "edit")
								return;

							var isLoaded = this.$(".postLinkPreview").attr(
									"data-Loaded")
							if (isLoaded == "true")
								return;
							if (!data.title)
								return;

							this.$(".postLinkPreview")
									.attr("data-Loaded", true);
							var img = "", title = "", desc = "", url = "", content = "", cross = "";
							if (data.image)
								img = $("<img/>").attr("src", data.image)
										.addClass("thumbnail");

							title = $(
									"<span><a href='" + data.url
											+ "' target='_blank'>" + data.title
											+ "</a></span>").addClass("title");
							url = $("<span/>").append(data.url)
									.addClass("link");
							desc = $("<p/>").append(data.description);

							cross = $("<span />").addClass(
									"icon-cross linkRemove").bind("click",
									this.removeLink);

							var content = $("<div/>").append(title).append(url)
									.append(desc);

							var temp = $("<div/>").append(img).append(content)
									.append(cross).addClass("webthumbnail");
							this.$(".postLinkPreview").append(temp).show();
							this.settings.hasPreview = true;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
							this.hideLinkInput();

						},
						loadVideoPreview : function(id) {
							if (this.settings.state != "edit")
								return;

							var isLoaded = this.$(".postLinkPreview").attr("data-Loaded");
							
							
							
							if (isLoaded == "true")
								return;
							this.$(".postLinkPreview").attr("data-Loaded", true);
							
							
							var temp = $('<iframe width="560" height="315" src="http://www.youtube.com/embed/'
											+ id
											+ '?wmode=transparent&rel=0" frameborder="0" allowfullscreen></iframe>')
									.css({
										"width" : "100%"
									});
							
							
							var cross = $("<span />").addClass("icon-cross linkRemove").bind("click",									this.removeLink);
							var container = $("<div />").addClass(
									"vidthumbnail").append(temp).append(cross);
							this.$(".postLinkPreview").append(container).show();

							this.settings.hasPreview = true;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
							this.hideLinkInput();
						},
						removeLink : function() {
							this.$(".postLinkPreview").empty().attr(
									"data-Loaded", false).hide();
							this.settings.hasPreview = false;
							this.$(".linkURLbtn").hide();
							this.resetLinkInput();
						},
						getYouTubeInfo : function(id) {
							$
									.ajax({
										url : "http://gdata.youtube.com/feeds/api/videos/"
												+ id + "?v=2&alt=json",
										dataType : "jsonp",
										success : function(data) {
											parseresults(data);
										}
									});
						},

						parseresults : function(data) {
							var title = data.entry.title.$t;
							var description = data.entry.media$group.media$description.$t;
							var viewcount = data.entry.yt$statistics.viewCount;
							var author = data.entry.author[0].name.$t;
							$('#title').html(title);
							$('#description').html(
									'<b>Description</b>: ' + description);
							$('#extrainfo')
									.html(
											'<b>Author</b>: ' + author
													+ '<br/><b>Views</b>: '
													+ viewcount);
							getComments(data.entry.gd$comments.gd$feedLink.href
									+ '&max-results=50&alt=json', 1);
						},

						showPics : function(e) {
							if (this.settings.hasImage)
								return;

							var imgFile = e.currentTarget.files[0]
							// this.loadImg(imgFile);
							this.preResizeImg(imgFile);
							this.settings.hasImage = true;
						},
						loadImg : function(imgFile) {
							/*
							 * check for image type If Not return
							 * 
							 */
							var _self = this;
							if (!imgFile.type.match(/image.*/))
								return;

							var img = document.createElement("img");
							img.file = imgFile;
							img.height = 300;
							img.width = 500;
							/*
							 * create the image element read the uploaded file
							 * then display
							 */
							var reader = new FileReader();
							reader.onload = function(e) {
								img.onload = function() {
									_self.displayImage(img);
								};
								img.src = e.target.result;

							};
							reader.readAsDataURL(imgFile);
						},
						preResizeImg : function(file) {
							// from an input element
							// var filesToUpload = input.files;
							// var file = filesToUpload[0];
							var canvas = document
									.getElementById("postImgCanvas");
							var img = document.createElement("img");
							var reader = new FileReader();
							reader.onload = function(e) {
								img.src = e.target.result
							}
							reader.readAsDataURL(file);
							img.onload = function() {
								var ctx = canvas.getContext("2d");
								ctx.drawImage(img, 0, 0);

								var MAX_WIDTH = 500;
								var MAX_HEIGHT = 400;
								var width = img.width;
								var height = img.height;

								if (width > height) {
									if (width > MAX_WIDTH) {
										height *= MAX_WIDTH / width;
										width = MAX_WIDTH;
									}
								} else {
									if (height > MAX_HEIGHT) {
										width *= MAX_HEIGHT / height;
										height = MAX_HEIGHT;
									}
								}
								canvas.width = width;
								canvas.height = height;
								var ctx = canvas.getContext("2d");
								ctx.drawImage(img, 0, 0, width, height);
							}
							// var dataurl = canvas.toDataURL("image/png");
						},
						getImageData : function() {
							var canvas = document
									.getElementById("postImgCanvas");
							var img = $("<img/>").attr("src",
									canvas.toDataURL("image/png"));

							return $("<div/>").append(img).html();
						},
						displayImage : function(img) {
							this.$("#defltPostCnt").append(img)
						},
						showModeOptions : function(e) {
							e.preventDefault();
							e.stopPropagation();
							this.$(".flwOpt").show();
						},
						hideModeOptions : function() {
							this.$(".flwOpt").hide();
						},
						selectMode : function(e) {
							this.$(".flwOpt").hide();

							var mode = $(e.currentTarget).attr("data-mode");
							if (mode == this.settings.mode)
								return;

							this.settings.mode = mode;
							this.switchMode(mode);

						},
						switchMode : function(mode) {
							var classname = (mode == "public") ? "icon-earth"
									: "icon-users2";
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users2").addClass(
									classname);

							if (mode == "private")
								this.showUserSelector()
							else
								this.hideUserSelector();
						},
						showUserSelector : function() {
							this.$(".postUsers").show();
						},
						hideUserSelector : function() {
							this.$(".postUsers").hide();
							this.userInput.reset();
						},
						userBrowser : function() {
							var browser = contacts.browser({
								onFinish : this.setUsers
							});
							var existUsers = this.userInput.getSelected();
							browser.selectUsers(existUsers);
						},
						setUsers : function(users) {
							this.userInput.reset().addUsers(users);

						},
						applyStyle : function(e, sValue) {
							var sCmd = $(e.currentTarget).attr("data-cmd");
							this.formatDoc(sCmd);
							this.toggleCommand(sCmd)
							// oDoc.focus();
						},
						checkCommands : function() {

							this.toggleCommand("bold");
							this.toggleCommand("italic");
							this.toggleCommand("underline");

						},
						toggleCommand : function(sCmd) {
							if (document.queryCommandState(sCmd)) {
								this.$(".intLink[data-cmd=" + sCmd + "]")
										.addClass("active")
							} else {
								this.$(".intLink[data-cmd=" + sCmd + "]")
										.removeClass("active")
							}
						},
						setColor : function(e) {
							var color = $(e.currentTarget).val();
							this.formatDoc("forecolor", color)
						},
						formatDoc : function(sCmd, sValue) {
							document.execCommand(sCmd, false, sValue);
							this.$('#defltPostCnt').focus();
						},
						ready : function() {

							if (this.$el.attr("data-expanded") != "false")
								return;
							this.$el.addClass("maxView");
							this.$('.post-action').show('slow', 'swing');
							this.$('#dpt-text').remove();
							this.$('#defltPostCnt').empty().parent().parent()
									.css('min-height', '60px');
							this.$('#postcancel').fadeIn();
							this.$("#postCategories").fadeIn();
							this.$el.attr("data-expanded", "true");
							this.settings.state = "edit";

						},
						showTaginput : function(e) {
							$(e.currentTarget).hide();
							this.$("#tagData").show();
						},
						showFileSelector : function() {
							var selector = akp_ws
									.fileSelector(this.selectedFile);
							// var file = selector.result();
						},
						showCategories : function() {
							this.$("#postCategories").focus();
							this.$("#postcategorieslist").show();
						},
						selectedFile : function(files) {

							if (!files.length)
								return;

							this.settings["attachments"].push.apply(
									this.settings.attachments, this
											.models2data(files));
							this.$("#postAttachments").show();
							for (file in files) {
								var model = files[file];
								var f = model.toJSON();
								var attach = this.getFile(f);
								attach.find(".rmAttach").bind("click", {
									file : f
								}, this.removeAttachment);
								$("<li/>").addClass("pstAttach").append(attach)
										.appendTo("#postAttachments ul");
								// console.log(fname);
							}

						},
						removeAttachment : function(e) {
							var file = e.data.file;
							var count = this.settings["attachments"].length;
							var attachments = this.settings["attachments"];
							for ( var i = 0; i < count; i++) {
								var attch = attachments[i];
								if (attch.path == file.path) {
									$(e.currentTarget).parents("li.pstAttach")
											.remove();
									this.settings["attachments"].splice(i, 1);
									break;
								}
							}

						},
						getFile : function(data) {
							var mimeclass = utils.mime2class(data.type);
							var sizeBytes = utils.convBytes(data.size, 2);
							data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"
									: mimeclass;
							data["size"] = sizeBytes;
							data["hasRemove"] = true;
							return $("#attachment-template").tmpl([ data ]);
						},

						selectCategory : function(e) {
							this.$("#postcategorieslist").hide();
							var value = $(e.currentTarget).text();
							var name = $(e.currentTarget).attr("data-name");
							this.$(".selectedCTG").children(".CTGname").html(
									value).attr("data-name", name);
						},

						getTags : function() {
							var tagsString = this.$("#tagInput").val();
							if (tagsString)
								return tagsString.split(",");
							else
								return [];
						},

						share : function() {
							// this.$('.post-action').hide('fast', 'swing');
							// this.$('#postcancel').fadeOut();

							var commInput = this.formatContent(this
									.$('#defltPostCnt'));// .html();

							if (this.settings.hasPreview)// attaching link
								// preview
								commInput += this.$(".postLinkPreview").html();

							if (this.settings.hasImage)// attaching image
								// preview
								commInput += this.getImageData();

							var tags = this.getTags();
							var date = new Date();
							var category = this.$(".selectedCTG").children(
									".CTGname").attr("data-name");
							var attachments = this.settings.attachments;

							if (this.$('#defltPostCnt').text().length) {
								this
										.sendreq(commInput, 0, "post", date
												.getTime(), tags, category,
												attachments);
							}
							this.settings.attachments = [];
							this.blur();
							/*
							 * this.$('#defltPostCnt').empty().append( "<p id='dpt-text'>What's
							 * up...</p>").blur()
							 * .parent().parent().css('min-height', '40px');
							 */
						},
						models2data : function(models) {
							var list = [];
							for ( var i = 0; i < models.length; i++) {
								var file = models[i];
								var model = file.toJSON();
								list.push({
									isdir : model.isdir,
									path : model.path,
									type : model.type,
									size : model.size,
									fname : model.fname
								});
							}
							return list;
						},
						formatContent : function(content) {
							return utils.htmlEscape(content.find("a[href]")
									.attr("target", "_blank").end().html());
						},
						sendreq : function(post, id, type, time, tags, kind,
								files) {
							var unique = akp_ws.createUUID();
							var shar_obj = {
								service : "kons",
								mesgtype : "request",
								request : "new",
								uid : auth.loginuserid,
								cookie : unique,
								parent : id,
								content : post,
								create_timestamp : time,
								gid : auth.cgd,
								edit_timestamp : time,
								root : id,
								category : kind,
								taglist : tags,
								attachments : files

							}
							if (this.settings.mode == "private") {
								shar_obj['followers'] = this.userInput
										.getSelected();
								shar_obj["followers"].push(auth.loginuserid);
							}
							if (!this.isValid(post)) {
								alert("Invalid Text. Please Enter Plain text only.");
								return;
							}

							akp_ws.send({data:shar_obj});
							// maptable[unique] = type;

						},
						isValid : function(text) {
							try {
								var valid = JSON.parse(JSON.stringify({
									"content" : text
								}));
								return true;
							} catch (e) {
								return false;
							}

						},
						blur : function() {
							this.$el.removeClass("maxView");

							this.$('#postcancel').fadeOut();
							this.$('.post-action').hide('slow', "swing");

							this.$("#tagData").hide();
							this.$(".linkData").hide();
							this.$("#postCategories").hide();
							this.$("#postcategorieslist").hide();
							this.$(".postUsers").hide();
							this.$(".postLinkPreview").hide();
							this.reset();

							// this.$("#postAttachments").hide();

						},
						reset : function() {
							this.$el.attr("data-expanded", "false");
							this.$('#defltPostCnt').empty().append(
									"<p id='dpt-text'>What's up...</p>").blur()
									.parent().parent()
									.css('min-height', '40px');
							this.$("#postAttachments").hide().children('ul')
									.empty();
							var defaultCategory = this.$("#postcategorieslist")
									.children(".postcategory:first").text();

							this.$(".postLinkPreview").empty().attr(
									"data-Loaded", false);
							this.$("#postImgCanvas").attr({
								"height" : 0,
								"width" : 0
							});

							this.$(".postURL").val("");
							this.$(".linkURLbtn").show();
							this.resetLinkInput();
							this.$(".selectedCTG").children(".CTGname").html(
									defaultCategory);
							this.$("#addTag").show();
							this.$("#tagInput").importTags('');
							this.userInput.reset();
							this.settings.attachments = [];
							this.settings.mode = "public";
							this.settings.hasPreview = false;
							this.settings.hasImage = false;
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users2").addClass(
									"icon-earth");
							this.settings.state = "mute";
							this.disableShare();
						}
					});
			var posts = new Posts();
			var masterview = new MasterView({
				collection : posts,
			});
			
			new App.Views.konsSearchView({
				collection:posts,
				masterView:masterview,
			});
			
			
			var akons = new Akons({
				collection : posts
			});
			var filters = new filtersView({
				collection : posts
			});
			var updates = new Updates({
				posts : posts
			});

			var Notifications = new notifications;

			var NotificationsView = new notificationsView({
				collection : Notifications,
				posts : posts
			})

			return KonsMessage;

		})
