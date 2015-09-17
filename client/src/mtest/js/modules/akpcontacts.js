/**
 * @author Raju Konga
 */
define(
		"akpcontacts",
		[ "jquery", "akpauth", "akpGroups", "plugins/jquery-ui" ],
		function($, auth, groups) {
			// loader(10,"contacts Loaded");
			var contact = Backbone.Model.extend({
				idAttribute : "uid",
				initialize : function() {
					this.bind("change", this.handleChanges, this);
				},
				handleChanges : function(model) {
					var diff = model.changedAttributes();
					var user = model.toJSON();
					for ( var att in diff) {
						switch (att) {
						case 'status':
							this.trigger("statusChange", user);
							break;
						case "status_line":
							this.trigger("statusMsgChange", user);
							break;
						// default:

						}
					}
				},
				isAlive : function() {
					return this.get("status") != "offline";
				},
				updateStatus:function(user){
					this.set({
						status : user.status,
						status_line : user.status_line,
					});
					//this.trigger("statusChange",user);
				}
			});
			var contacts = Backbone.Collection.extend({
				model : contact,
				initialize : function() {
					_.bindAll(this, "hidemenu");
					this.bind("hideTools", this.setTime, this);
					this.bind("timeout", this.clearTimer, this);
					//this.bind("statusChange", this.changeUserStatus, this);
					this.bind("search", this.search, this);
					this.bind("showAll", this.showAll, this);
					this.timer = null;
				},
				setTime : function() {
					this.timer = setTimeout(this.hidemenu, 500);
				},
				clearTimer : function() {
					clearTimeout(this.timer);
				},
				hidemenu : function() {
					this.trigger("timeout");
				},
				getUserByUid : function(uid) {
					var model = this.where({
						uid : uid
					})[0];
					if (model)
						return model.toJSON();
					else
						return false;
				},
				getModelByUid : function(uid) {
					var model = this.where({
						uid : uid
					})[0];
					if (model)
						return model;
					else
						return false;
				},
				getGroupList : function() {
					return this.pluck("id");
				},
				changeStatus:function(user){
					//this.trigger("statusChange",user);
					this.changeUserStatus(user);
				},
				changeUserStatus : function(user) {
					var model = this.get(user.uid);

					if (model) {
						model.updateStatus(user);
					}
				},
				comparator : function(model) {
					return model.get('status');
				},
				matches : function(term) {
					if (term === "")
						return [];

					return this.filter(function(model) {
						return model.get('first_name').toLowerCase().indexOf(
								term) !== -1
					});
				},
				search : function(term) {
					this.hideAll();
					var models = this.matches(term.toLowerCase());

					for (model in models) {
						models[model].trigger("change:show");
					}
					/*
					 * models.each(function(model) {
					 * model.trigger("change:show") })
					 */

				},
				hideAll : function() {
					// var models = this.models;

					this.each(function(model) {
						model.trigger("change:hide");
					})
				},
				showAll : function() {
					// var models = this.models;

					this.each(function(model) {
						model.trigger("change:show");
					})
				},
				selector : function(options) {
					var selector = new userSelector({
						el : options.el,
						users : this,
					});
					return selector;
				},
				browser : function(options) {
					return browser = new userBrowser($.extend({
						users : this
					}, options));
				}
			});

			var contactsView = Backbone.View.extend({
				el : $("#contactList"),
				events : {
					"keyup #cnsearch" : "searchContacts",
				},
				initialize : function() {

					this.collection.bind("add", this.addContact, this);

				},
				render : function() {
				},
				addContact : function(model) {
					model.set({
						id : model.get("uid")
					});
					var contactview = new contactView({
						model : model
					})
					this.$(".clist").append(contactview.render().el);
					this.collection.sort();
				},
				searchContacts : function(e) {
					var term = $(e.currentTarget).val();
					if (term)
						this.collection.trigger("search", term);
					else
						this.collection.trigger("showAll");
				}
			});

			var contactView = Backbone.View.extend({
				className : "contact user",
				events : {
					"mouseover" : "showMenu",
					"mouseout" : "hideMenu",
					"drop" : "sendPeerData",
					"dragover" : "handleDragOver"
				},
				initialize : function() {

					//this.model.bind("change", this.updateContact, this);
					this.model.bind("change:hide", this.hide, this);
					this.model.bind("change:show", this.show, this);
					this.model.bind("statusChange",this.updateStatus,this);

				},
				sendPeerData : function(ev) {

					ev.stopPropagation();
					ev.preventDefault();

					if (ev.dataTransfer) {
						var length = ev.dataTransfer.items.length
								|| ev.target.files.length;

						for ( var i = 0, f; i < length; i++) {
							var entry = ev.dataTransfer.items[i]
									.webkitGetAsEntry();

							// this.traverseFileTree(entry);

							akp_ws.sendPeer({
								file : entry,
								mesgtype : "peerEvent",
								eventtype : "fileXfer",
								to : this.model.get("uid"),
							})
						}
					}

				},
				updateContact : function(model) {
//deprecated
					var msg = "";
					var diff = model.changedAttributes();
					var user = model.toJSON();
					for ( var att in diff) {
						switch (att) {
						case 'status':
							msg = model.get("first_name") + " is "
									+ user.status;
							this.render();
							break;
						case "status_line":
							msg = model.get("first_name")
									+ " is updated status message,"
									+ user.status_line;
							break;
						default:
							msg = false;
						}
					}
					
				},
				updateStatus:function(user){
					var msg = this.model.get("first_name") + " is "+ user.status;
					this.render();
					this.notify(msg);
				},
				notify:function(msg){
					if (!msg)
						return;

					noty({
						layout : 'bottomRight',
						theme : 'default',
						type : 'alert',
						text : msg,
						timeout : 10000,
					});
				},
				handleDragOver : function(e) {
					e.stopPropagation();
					e.preventDefault();
					e.dataTransfer.dropEffect = 'copy';
				},
				hide : function() {
					this.$el.hide();
				},
				show : function() {
					this.$el.show();
				},
				render : function() {

					var user = this.model.toJSON();
					var modelObj = {
						userid : user.uid,
						img : user.image_small || "css/images/user32.png",
						name : user.first_name
					};

					var template = $("#user-template").tmpl([ modelObj ]);
					var status = $('<span />').addClass('ustatus').appendTo(
							template);
					
					this.$el.attr("data-uid", user.uid).html(template);
					this.setStatus(template, user.status);
					this.enhanceDraggable(this.$el);

					return this;
				},
				setStatus : function(el, status) {
					this.$("span.ustatus").addClass(status);
				},
				enhanceDraggable : function(el) {
					var opts = {
						containment : 'document',
						appendTo : "body",
						helper : 'clone',
						revert : 'Invalid',
						zindex : 1000000
					};
					el.draggable(opts).bind("drag", this.onDrag);
				},
				onDrag : function(event, ui) {
					ui.helper.css("background-color", "#12e6ab");
				},
				showMenu : function(e) {
					var offset = $(e.currentTarget).offset();

					// clearTimeout(hidetoolstimer);
					collection.trigger("timeout");

					menu.render({
						posTop : offset.top,
						posLeft : offset.left,
						model : this.model
					});
				},
				hideMenu : function() {
					// hidetoolstimer = setTimeout(displaytools, 500);
					collection.trigger("hideTools")
				},

			});
			
			/*
			 * User Selector
			 */
			var selectors = Backbone.Collection.extend({
				model : contact,
			});
			
			
			var userSelector = Backbone.View
					.extend({
						defaults : {
							onAddUser : "",
							onRemoveUser : "",
							blockUsers : [],
							maxUsers : 6,
							maxSuggestions : 5

						},
						settings : {},
						className : "userSelector",
						events : {
							"click" : "getFocus",
							"keyup .userInput" : "getSuggestions",
						},
						initialize : function(options) {
							_.bindAll(this, "render", "_resetState",
									"_selectUser", "loadSuggestions");
							this.settings = $
									.extend({}, this.defaults, options);
							this.collection = new selectors;
							this.collection.bind("add", this.addUser, this);
							this.collection.bind("remove", this._removeUser,
									this);
							this.users = options.users;
							// this.render();

						},
						render : function() {
							this.$el
									.append(
											'<div class="usersSelected"><ul></ul></div><input type="text" class="userInput" placeholder="add follower" /><div class="userSuggestions"><ul class="sugglist"></ul</div>')
									.addClass(this.className);
							this._resetState();
							return this;
						},
						addUser : function(model) {
							var user = model.toJSON();
							var _self = this;
							var usertag = $("<li/>").attr({
								"data-uid" : user.id
							}).append(user.first_name + " " + user.last_name)
									.addClass("userEntry").appendTo(
											this.$(".usersSelected ul"));
							$(" <span class='icon-cross removeUserTag'></span>")
									.bind("click", {
										user : user.id
									}, function(e) {
										_self.removeUser(user.id);
									}).appendTo(usertag);
						},
						getFocus : function() {
							this.$(".userInput").focus();
						},
						getSuggestions : function(e) {
							var key = $(e.currentTarget).val();
							if (key.length > 0) {
								var suggestions = this.users.matches(key);
								this.loadSuggestions(suggestions);
							} else if (!key.length) {
								if (e.keyCode == 8) {
									var user = this.collection.pop();
									// this._removeUserTag(user.id);
								}
							}

						},
						loadSuggestions : function(users) {
							this.$(".userSuggestions").show();
							this.$(".sugglist").empty();
							var count = this.settings.maxSuggestions ? this.settings.maxSuggestions
									: users.length;
							for ( var i = 0; i < count; i++) {
								var user = users[i];
								if (!user)
									continue;

								var data = user.toJSON();
								$("<li/>").addClass("usrsugst").append(
										data.first_name).bind("click", {
									obj : data
								}, this._selectUser).appendTo(
										this.$(".sugglist"));
							}

						},
						_removeUser : function(model) {
							var user = model.toJSON();
							this._removeUserTag(user.id);
						},
						_removeUserTag : function(id) {
							this.$(".usersSelected ul").children(
									"li[data-uid=" + id + "]").remove();
						},
						_selectUser : function(e) {
							this._resetState();
							var user = e.data.obj;
							user["id"] = user.uid;
							this.collection.add(user);

						},
						_resetState : function() {
							this.$(".sugglist").empty();
							this.$(".userSuggestions").hide();
							this.$(".userInput").val("").focus();

						},
						addUsers : function(users) {
							for ( var i = 0; i < users.length; i++) {

								var user = this.users.getUserByUid(users[i]);
								if (!user)
									continue;

								user["id"] = user.uid;
								this.collection.add(user);
							}
						},
						removeUser : function(id) {
							var model = this.collection.get(id);
							this.collection.remove(model);

						},
						getSelected : function() {
							return this.collection.pluck("id");
						},
						reset : function() {
							this.$(".usersSelected ul").empty();
							this._resetState();
							this.collection.reset();
							return this;
						}
					})

			/*
			 * User Browser
			 */

			var userBrowser = Backbone.View.extend({
				defaults : {
					onFinish : '',// return selected users
					onSelect : "",// return user select
					blockedUsers : [],
				},
				settings : {},
				events : {
					"click .close" : "close",
					"click .finish" : "finish",
				},
				initialize : function(options) {
					_.bindAll(this, "_selectUser");
					this.settings = $.extend({}, this.defaults, options);
					this.overlay = $("<div/>").addClass("overlay").appendTo(
							"body");
					var browser = $("#ubrowser-template").tmpl();
					this.template = this.$el.addClass("modal ").append(browser)
							.appendTo("body");
					this.users = options.users;
					this.collection = new selectors;
					// this.collection.bind("add",this._activeUser,this);
					// this.collection.bind("remove",this._deactiveUser,this);
					this.render();
					this.addUsers();

				},
				render : function() {
					// $("body").css({"overflow":"hidden"});
					this.$el.css({
						"height" : window.innerHeight - 100,
						"width" : "50%"
					})// window.innerWidth-100

				},
				addUsers : function() {

					var natives = this.users.models;
					for ( var i = 0; i < natives.length; i++) {
						var native = natives[i];
						var user = native.toJSON();
						this._renderUser(user);
					}

				},

				_renderUser : function(user) {
					var templ = $("#activeUser-template").tmpl([ user ]);
					var utmp = $("<li/>").append(templ).addClass(
							"ubrowser-user").attr({
						"data-select" : 0,
						"data-user" : user.uid
					}).bind("click", this._selectUser);
					this.template.find("ul").append(utmp);
				},
				_selectUser : function(e) {
					var user = $(e.currentTarget).data("user");
					if (parseInt($(e.currentTarget).attr("data-select"))) {
						// remove from selected collection
						this.collection.remove(user);
						$(e.currentTarget).removeClass("active").attr(
								"data-select", 0);
					} else {
						// add to selected collection
						this._activeUser(user);
						// $(e.currentTarget).addClass("active").attr("data-select",1);
					}
				},
				_activeUser : function(user) {
					var subj = this.users.getUserByUid(user);
					subj["id"] = user;
					this.collection.add(subj);
					this.$(".browserBody").find(
							"li.ubrowser-user[data-user=" + user + "]")
							.addClass("active").attr("data-select", 1);
				},
				_standardUser : function(user) {
					this._activeUser(user);
					this.$(".browserBody").find(
							"li.ubrowser-user[data-user=" + user + "]").unbind(
							"click");
				},
				selectUsers : function(users) {
					for ( var i = 0; i < users.length; i++) {
						var user = users[i];
						this._activeUser(user);
					}

				},
				blockUsers : function(users) {
					this.settings.blockedUsers = users;
					for ( var i = 0; i < users.length; i++) {
						var user = users[i];
						this._standardUser(user);
					}
				},
				getSelected : function() {
					var selectedUsers = this.collection.pluck("id");
					var blockedusers = this.settings.blockedUsers;
					if (blockedusers.length) {

						for ( var i = 0; i < blockedusers.length; i++) {
							selectedUsers = _.filter(selectedUsers, function(
									num) {
								return num != blockedusers[i]
							});
						}

					}
					return selectedUsers;
				},
				getMatches : function() {

				},
				finish : function() {
					var users = this.getSelected();
					this.settings["onFinish"].call(this, users);
					this.close();
				},
				close : function() {
					this.$el.remove();
					this.overlay.remove();
					// $("body").css({"overflow":"auto"});
				}
			})

			/*
			 * .attr({ 'data-uid' : user.uid, "data-status" : user.status,
			 * "data-sid" : sid, "data-contname" : user.first_name + " " +
			 * user.last_name, }).append(uimg).appendTo(".clist").draggable({
			 * containment : 'document', appendTo : "body", helper : 'clone',
			 * revert : 'Invalid', zindex : 1000000 }).bind("drag",
			 * function(event, ui) { ui.helper.css("background-color",
			 * "orange"); })
			 */

			var menuView = Backbone.View
					.extend({
						className : "usertools",
						events : {
							"mouseover" : "showTools",
							"mouseout" : "hideTools",
							"click .uprfl" : "showProfile",
							"click .uchat" : "startChat",
							"click .uvidcal" : "startVideoCall",
							"click .umail" : "sendMail",
							"click .uaudio" : "startAudio",
						},
						initialize : function() {
							this.$el.appendTo("body");
							this.collection.bind("timeout", this.hide, this);

						},
						render : function(opts) {
							// this.$el.empty()
							var data = opts.model.toJSON();
							this.model = opts.model;
							// this.collection=opts.collection;

							var template = $("#usertools-template").tmpl([ {
								name : data.first_name,
								status_line : data.status_line,
							} ]);

							this.$el.html(template).css({
								top : opts.posTop + 45,
								left : opts.posLeft
							}).show();

						},
						showTools : function() {
							// clearTimeout(hidetoolstimer);
							this.collection.trigger("timeout")

							this.$el.show();
						},
						hideTools : function() {
							// hidetoolstimer = setTimeout(displaytools, 500);

							this.collection.trigger("hideTools")
						},
						hide : function() {
							this.$el.hide();
						},
						showProfile : function() {
							var uid = this.model.get("uid");
							akp_ws.getProfile({
								id : uid,
								mode : "read"
							});
						},
						startChat : function() {
							var uid = this.model.get("uid");
							akp_ws.getIM(uid)
						},
						startAudio : function() {
							if (!navigator.onLine) {
								noty({
									type : "error",
									text : "Sorry! You are now offline, You cannot make Audio Call.",
									layout : "bottomRight",
									time : 5000,

								});
								return;
							}
							var uid = this.model.get("uid");
							akp_ws.getMedia(uid, {
								audio : true
							});
						},
						startVideoCall : function() {
							if (!navigator.onLine) {
								noty({
									type : "error",
									text : "Sorry! You are now offline, You cannot make Video Call.",
									layout : "bottomRight",
									time : 5000,

								});
								return;
							}

							var uid = this.model.get("uid");
							akp_ws.getMedia(uid)
						},
						sendMail : function() {
							noty({
								layout : 'bottomRight',
								theme : 'default',
								type : 'error',
								text : 'oops! We are still working on it! <br/> Stay tuned...',
								timeout : 10000
							})
						},
					});

			var GroupApprovalsView = Backbone.View.extend({
				el : ".groupPendingApprovalsList",

				initialize : function(opts) {
					this.groups = opts.groups;
					this.groups.bind("groupChange", this.changeGroup, this);
				},
				render : function() {
					return this;
				},
				changeGroup : function(group) {
					this.clear();

					this.group = this.groups.getModelByGid(group.gid);
					var isAdmin = this.group.isAdmin(akp_ws.auth.loginuserid);
					var hasPendingList = group.pending_approval_list?group.pending_approval_list.length:false;

					if (isAdmin && hasPendingList) {
						this.show(hasPendingList);

						var user, pendinglist = group.pending_approval_list;
						for (user in pendinglist) {
							var model = this.collection
									.getModelByUid(pendinglist[user])
							if (model)
								this.renderApproval(model)
						}
					}

					else
						this.hide();

				},

				renderApproval : function(model) {

					var approval = new ApprovalView({
						model : model,
						collection : this.collection,
						group : this.group,
					});
					this.$(".groupPendingApprovals").append(
							approval.render().$el);
				},
				clear : function() {
					this.$(".groupPendingApprovals").empty();
				},
				show : function(count) {
					this.$(".pendingCount").html(count);
					this.$el.show();
				},
				hide : function() {
					this.$(".pendingCount").html("");
					this.$el.hide();
				}
			});

			var ApprovalView = Backbone.View
					.extend({
						className : "member",
						events : {
							"click .approve" : "approveRequest",
							"click .ignore" : "declineRequest",
						},
						initialize : function(opts) {
							_.bindAll(this,"approveResp");
							this.group = opts.group;
						},
						render : function() {
							var user = this.model.toJSON();
							var pic = user.image_large
									|| "css/images/user96.jpg";
							var template = "<p><img src='"
									+ pic
									+ "' height=96 width=96 vertical-align=top class=member-pic />"
									+ "</p><div class=member-info><span class=member-name>"
									+ user.first_name
									+ "</span><br><span>"
									+ user.jobtitle
									+ "</span>"
									+ "<div class='member-actions'>"
									+ "<button class='btn btn-success approve' data-uid='"
									+ user.uid
									+ "'>Accept</button>"
									+ "<button class='btn btn-default ignore' data-uid='"
									+ user.uid + "'>Ignore</button>"
									+ "</div></div>";
							this.$el.append(template);

							return this;
						},
						declineRequest : function(e) {
							$(e.currentTarget).attr("disabled", "disabled")
									.html("Processing..").closest(".approve")
									.attr("disabled", "disabled");
							var uid = $(e.currentTarget).data("uid");
							this.collection.trigger("declineUser", uid,
									this.declineResp);
						},
						declineResp : function(resp) {
							consloe.log(resp)
						},
						approveRequest : function(e) {
							$(e.currentTarget).attr("disabled", "disabled")
									.html("Processing..").closest(".ignore")
									.attr("disabled", "disabled");
							var uid = $(e.currentTarget).data("uid");
							this.collection.trigger("approveUser", uid,
									this.approveResp);
						},
						approveResp : function(resp) {
							console.log(resp);
							if (resp.status == "success") {
								// this.$(".approve").html("Accepted");
								this.reset();
								this.group.users.add(this.model);
							}
						},
						reset : function() {
							var pendingList = this.group
									.get("pending_approval_list");
							var members=this.group
							.get("members");
							pendingList = _.without(pendingList, this.model
									.get("uid"));
							members.push(this.model
									.get("uid"));
							
							var mbrcnt=this.group.get("member_count");
							var n_mbr_cnt= mbrcnt++;
							
							this.group.set({
								"pending_approval_list" : pendingList,
								"members": members,
								"member_count":n_mbr_cnt,
							});

							this.$el.remove();
						}

					});

			var GroupView = Backbone.View.extend({
				el : $("#userGroupView"),
				events : {
					"click .groupLeave" : "leaveGroup",
					"click .groupDelete" : "deleteGroup",
					"click .groupPic-change": "picUpdate",
				},

				initialize : function(opts) {
					
					_.bindAll(this,"updateInfo","picUpdate");
					this.groups = opts.groups;
					this.approvals = new GroupApprovalsView({
						collection : this.collection,
						groups : this.groups
					});
					// this.collection.bind("add", this.addMember, this);
					this.groups.bind("groupChange", this.changeGroup, this);
				},
				render : function() {
					return this;
				},
				picUpdate:function(){
					akp_ws.auth.picUpdater.render({
						target:this.group.get("homedir")+"/profile.png",
						transporter:akp_ws,
						onSuccess:this.updateInfo,
					});
				},
				updateInfo:function(img){
					this.$(".groupImg").attr("src", img);
					akp_ws.auth.updateGroup(this.group.toJSON());
				},
				leaveGroup : function(e) {
					if (!this.group.isAdmin() && this.group.isMember()) {
						this.groups.leaveGroup(this.group.get("gid"),
								this.handleLeaveGroup);
						$(e.currentTarget).attr("disabled", "disabled");
					}
				},
				handleLeaveGroup : function(resp) {
					// this.groups.pullout();
					akp_ws.alert("you left the group!", "info");
				},
				deleteGroup : function(e) {
					if (this.group.isAdmin()) {
						this.groups.deleteGroup(this.group.get("gid"),
								this.handleDeleteGroup);
						$(e.currentTarget).attr("disabled", "disabled");
					}
				},
				handleDeleteGroup : function(resp) {
					// this.groups.pullout();
					akp_ws.alert("Group Deleted Successfully!", "success");
				},
				changeGroup : function(group) {
					this.clear();
					
					this.group = this.groups.getModelByGid(group.gid);
					//this.group.users.bind("add", this.addMember, this);

					
					var src = group.image_large || "css/images/groupIcons/a.jpg";
					this.$(".groupImg").attr("src", src);
					this.$(".groupTitle").html(group.gname);

					if (groups.getModelByGid(group.gid).isAdmin()) {
						this.$(".groupLeave").hide();
						this.$(".groupDelete").show().removeAttr("disabled");
						this.$(".groupHeader").addClass("admin");
					} else {
						this.$(".groupDelete").hide();
						this.$(".groupLeave").show().removeAttr("disabled");
					}
					//this.renderModels(this.group);
					this.renderMembers(group);
				},
				renderMembers : function(group) {
					
					console.log(group);
					var groupMembers = group.members;
					for ( var member in groupMembers) {
						var memberId = groupMembers[member];
						var memberModel = this.collection
								.getModelByUid(memberId);
						if (memberModel) {
							 this.addMember(memberModel);
							//this.group.users.add(memberModel);
						}
					}
				},
				renderModels:function(group){
					var self=this;
					group.users.each(function(model){
						self.addMember(model);
					});
				},
				addMember : function(model) {

					var member = new groupMember({
						model : model
					});
					this.$(".groupTeam").find(".member-empty").remove();
					this.$(".groupTeam").append(member.render().el);
				},
				showEmptyMsg:function(){
					$("<div/>").addClass("member-empty alert alert-info").append("No one joined yet!").appendTo(this.$(".groupTeam"));
				},
				clear : function() {
					this.$(".groupHeader").removeClass("admin");
					this.$(".groupTeam").find(".member").remove();
					this.$(".groupTeam").find(".member-empty").remove();
					this.showEmptyMsg();
				}
			});

			var groupMember = Backbone.View
					.extend({
						className : "member",
						events : {
							"click .m-profile" : "getProfile",
							"click .m-chat" : "getChat",
							"click .m-media" : "getMedia",
							"click .m-mail" : "getMail",

						},
						initialize : function() {

						},
						render : function() {
							var user = this.model.toJSON();
							var pic = user.image_large ? user.image_large
									: "css/images/user96.jpg";
							var template = "<p><img src='"
									+ pic
									+ "' height=96 width=96 vertical-align=top class=member-pic />"
									+ "</p><div class=member-info><span class=member-name>"
									+ user.first_name
									+ "</span><br><span>"
									+ user.jobtitle
									+ "</span>"
									+ "<div class=member-tools>"
									+ "<span class='m-chat icon-bubble'></span>"
									+ "</div></div>"

							// <span class='m-mail icon-mail'></span>
							// <span class='m-media icon-facetime-video'></span>
							// <span class='m-profile icon-profile'></span>

							this.$el.append(template);

							return this;
						},
						getProfile : function() {
							var uid = this.model.get("uid");
							akp_ws.getProfile({
								id : uid,
								mode : "read"
							});

						},
						getChat : function() {
							var uid = this.model.get("uid");
							akp_ws.getIM(uid)
						},
						getMedia : function() {
							var uid = this.model.get("uid");
							akp_ws.getMedia(uid)
						},
						getMail : function() {
							noty({
								layout : 'bottomRight',
								theme : 'default',
								type : 'error',
								text : 'oops! We are still working on it! <br/> Stay tuned...',
								timeout : 10000
							})
						},
						clear : function() {

						}

					});

			var Invite2Group = Backbone.View
					.extend({
						el : "#invitePeople2Group",
						events : {
							"click .inviteaddpplbtn" : "addMorePpl",
							"hidden" : "clearinputs",
							"click .addppl" : "addppl"
						},
						initialize : function() {

						},
						render : function() {

						},
						addppl : function(e) {
							var address = $(e.currentTarget).siblings("input")
									.val();
							var elem = $("<p/>").append(address).append(
									'<span class="close"></span>').prependTo(
									".invite2grouplist");
							$(e.currentTarget).parent().remove();
						},
						clearinputs : function() {
							var addppl = $("<p/>")
									.addClass("input-append")
									.append(
											'	<input type="email" required="required" placeholder="name@company.com" /> <button class="btn addppl">Add</button>');
							this.$(".invite2grouplist").empty().append(addppl);
						},
						addMorePpl : function() {
							var addppl = $("<p/>")
									.addClass("input-append")
									.append(
											'	<input type="email" required="required" placeholder="name@company.com" /> <button class="btn addppl">Add</button>');
							this.$(".invite2grouplist").append(addppl);
						}
					})

			var ppl2grp = new Invite2Group;

			var collection = new contacts;
			var contactsview = new contactsView({
				collection : collection
			})
			var group = new GroupView({
				collection : collection,
				groups : groups,
			});
			var menu = new menuView({
				collection : collection
			});

			return collection;

		})