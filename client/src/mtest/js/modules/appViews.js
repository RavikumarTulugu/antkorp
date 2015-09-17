/**
 * @author Rajukonga
 */

define(
		"appViews",
		[ "jquery", "underscore", "backbone", "akputils", "akpauth",
				"akpGroups", "feedback", "plugins/jquery.steps.min", "plugins/jquery.knob" ],
		function($, _, Backbone, utils, auth, groups,feedback) {

			function getCookie(c_name) {
				var c_value = document.cookie;
				var c_start = c_value.indexOf(" " + c_name + "=");
				if (c_start == -1) {
					c_start = c_value.indexOf(c_name + "=");
				}
				if (c_start == -1) {
					c_value = null;
				} else {
					c_start = c_value.indexOf("=", c_start) + 1;
					var c_end = c_value.indexOf(";", c_start);
					if (c_end == -1) {
						c_end = c_value.length;
					}
					c_value = unescape(c_value.substring(c_start, c_end));
				}
				return c_value;
			}

			function setCookie(c_name, value, exdays) {
				var exdate = new Date();
				exdate.setDate(exdate.getDate() + exdays);
				var c_value = escape(value)
						+ ((exdays == null) ? "" : "; expires="
								+ exdate.toUTCString());
				document.cookie = c_name + "=" + c_value;
			}

			function checkCookie() {
				/*
				 * var username = getCookie("username"); if (username != null &&
				 * username != "") { alert("Welcome again " + username); } else {
				 * username = prompt( "Please enter your name:", ""); if
				 * (username != null && username != "") { setCookie("username",
				 * username, 365); } }
				 */
				return getCookie("username");
			}

			function openApp(e) {
				// e.preventDefault();
				$("#logOverlay,#logboard").hide();
				$(".akorp-ui").show();
			}

			function makeCenterDiv(id) {

				var w = $(id).width();
				var h = $(id).height();

				var nw = -w / 2;
				var nh = -h / 2;

				$(id).css({
					"top" : "50%",
					"left" : "50%",
					"margin-left" : nw + "px",
					"margin-top" : nh + "px"
				});
			}

			/*
			 * Sign upscreen
			 */

			var PlanView = Backbone.View.extend({
				el : "#pricinglist",
				events : {
					"click a" : "showView"
				},
				initialize : function() {

				},
				showView : function(e) {
					$($(e.currentTarget).attr("href")).show();
					// this.$el.hide();
				}
			});
			var plans = new PlanView;

			/*
			 * Controllers
			 */
			var appBaseModel = Backbone.Model.extend({

				initialView : "kons",
				mainView : "",
				subView : "userprofile_view",
				onViewChange : {},

				initialize : function() {

				},
				showView : function(view_name) {
					this.trigger("viewChange", view_name)
				}
			});

			var appViewModel = Backbone.Model.extend({
				initialize : function() {

				},
				showView : function(view) {
					this.trigger("viewChange", view);
				}
			})

			/*
			 * Logout view
			 */

			var UserControls = Backbone.View.extend({
				el : ".userModule",
				events : {
					"click #userinfo" : "showUserView",
					"click #sobtn" : "handleLogout",
					"click .switchToGroups" : "showGroups",
					"click .showAdminSection" : "showAdminView",
					"click .showGroupsSection" : "showGroupsView",
					"click .groupItem" : "switchGroup",
					"click .shareKons_btn" : "showShareDialog",
					"click .globalShare" : "handleShareDialog",
				},
				initialize : function(opts) {
					_.bindAll(this, "hideShare","shareKons");

					this.authHandler = opts.authHandler;
					this.authHandler.organization.bind("initialized",this.handleOrg,this);
					
					
					groups.bind("add", this.handleAddGroup, this);
					groups.bind("groupOut", this.handleGroupOut, this);
					groups.bind("groupIn", this.handleGroupIn, this);
					groups.bind("groupChange", this.handleGroupChange, this);
					this.model.bind("viewChange", this.handleViewChange, this);
					this.konsDialog = akp_ws.kons.konsDialog({
						el : this.$(".globalKonsEntry"),
						// type : "standard",
						onShare : this.shareKons,
						onCancel : this.hideShare,//this.clearKonsEntry,
						autoFocus : true,
						enableCategories:true,
					});
					$(document).bind("click", this.hideShare);
				},
				handleOrg:function(){
					if(this.authHandler.organization.isAdmin()){
						this.$(".adminCog").show();
					}else{
						this.$(".adminCog").hide();
					}
				},
				showShareDialog : function(e) {
					e.preventDefault();
					e.stopPropagation();
					this.$(".globalShare").show();
				},
				hideShare : function() {
					this.$(".globalShare").hide();
				},
				handleShareDialog : function(e) {
					e.stopPropagation();
					e.preventDefault();
				},
				shareKons : function(kons_obj) {
					akp_ws.send(kons_obj);
					this.hideShare();
				},
				clearKonsEntry : function() {
				},
				handleGroupChange : function(groupData) {
					this.$(".groupItem[data-gid=" + groupData.gid + "]")
							.addClass("active").siblings()
							.removeClass("active");
					
				},
				handleAddGroup : function(model) {
					if (model.isMember()) {
						var modelData = model.toJSON();
						var modelItem = $("<li/>").attr("data-gid",
								modelData.gid).append(modelData.gname)
								.addClass("groupItem");
						this.$(".groups-list").append(modelItem);
					}
				},
				switchGroup : function(e) {
					var gid = parseInt($(e.target).attr("data-gid"));
					groups.selectGroup(gid);
				},
				handleViewChange : function(view) {
					if(view=="login")
						this.hide();
					else
						this.show();
				},
				handleGroupIn : function(group) {
					this.$(".group-status").show();
					this.$(".showGroupsSection").hide();
					this.$(".groupTitle").html(group.gname);
					this.$(".shareKons").show();
				},
				handleGroupOut : function() {
					this.$(".group-status").hide();
					this.$(".showGroupsSection").show();
					this.$(".shareKons").hide();
				},
				handleLogout : function(e) {

					if (this.authHandler.logout) {
						this.authHandler.logoutuser(this.onLogoutSuccess);
					}

				},
				onLogoutSuccess : function() {
					//setCookie("username", "", 0);
					window.location = akp_ws.originURL;
					this.model.showView("login");
				},
				showGroups : function() {
					// this.trigger("groupsView");
					// this.model.showView("groups");
					groups.pullout();
				},
				showGroupsView : function() {
					this.model.showView("groups");
				},
				showAdminView : function() {
					// this.trigger("adminView");
					this.model.showView("admin");
				},
				showUserView : function() {
					//this.model.showView("user");
					akp_ws.getProfile();
				},
				hide:function(){
					this.$el.hide();
					$("#feedback_btn").hide();
				},
				show:function(){
					this.$el.show();
					$("#feedback_btn").show();
				}

			});

			/*
			 * Login screen
			 */
			var LoginView = Backbone.View
					.extend({
						el : ".login-screen",
						events : {
							"submit .loginform" : "sendLoginReq",
							"click a" : "showView",
						},
						store : false,
						initialize : function() {
							this.model.bind("viewChange",
									this.handleViewChange, this);

							_.bindAll(this, "handleLoginResp");
						},
						handleViewChange : function(view) {
							if (view == "login") {
								this.show();
							} else {
								this.hide();
							}
						},
						checkCookieStatus : function() {
							// Check username in cookies
							this.showLogin();
							
							var result = checkCookie();
							if (result == null || result == ""){
								// username not exist showing login form
								//this.showLogin();
							}
							else {
								// got Username sending login
								console
										.log("user Cookie available. trying to login.");
								//this.sendLogin(result);

							}
						},
						render : function() {

						},
						showLogin : function() {
							$("#logOverlay,#logboard").hide();
							this.show();
						},
						showView : function(e) {
							$($(e.currentTarget).attr("href")).show();
							// this.$el.hide();
						},
						sendLogin : function(username, pswd, store) {
							if (!auth.loginuser(username, pswd,
									this.handleLoginResp))
								return false;

							// this.hide();
							this.deactive();

							this.store = store;

						},
						sendLoginReq : function(e) {
							e.preventDefault();
							var obj = this.serialize();
							// console.log(obj);
							if (!obj.username)
								return;

							this.sendLogin(obj.username, obj.password,
									obj.remember);
						},
						handleLoginResp : function(resp) {
							if (resp.status == "success" || resp.user) {
								this.hide();
								this.activate();
								this.clear();
								/*if (this.store)// save on remember me
									setCookie("username", resp.user.uname, 7);
									*/
							} else if (resp.error) {
								this.showInfo(resp.error, "error");
								this.activate();
							}
						},
						serialize : function() {
							return {
								username : this.$("#inputUsername").val(),
								password : this.$("#inputPassword").val(),
								// org : this.$("#inputCompanyName").val(),
								remember : this.$("#inputRememberMe").attr(
										"checked") == "checked",
							}
						},
						showLoading : function() {

						},
						showInfo : function(msg, type) {

							var el = $("<div/>").append(msg).addClass(
									"alert alert-" + type);
							this.$(".form-info").empty().append(el).show();

						},
						deactive : function() {
							this.$("#inputUsername").attr("disabled",
									"disabled");
							this.$("#inputPassword").attr("disabled",
									"disabled");
							this.$(".applogin").attr("disabled", "disabled");
							this.$("#inputRememberMe").attr("disabled",
									"disabled");
						},
						activate : function() {
							this.$("#inputUsername").removeAttr("disabled");
							this.$("#inputPassword").removeAttr("disabled");
							this.$(".applogin").removeAttr("disabled");
							this.$("#inputRememberMe").removeAttr("disabled");
						},
						clear : function() {
							this.$("#inputUsername").val("");
							this.$("#inputPassword").val("");
						},
						show : function() {
							this.$el.show();
						},
						hide : function() {
							this.$el.hide();
							this.$(".form-info").hide();
						}
					});

			var appGroupsView = Backbone.View.extend({
				el : ".groupSelectorDialog",
				events : {
				// "click .ggroupcard" : "openGroup",
				// "click .newGroupStartBtn":"createGroup",
				},
				settings : {
					"joined" : ".gjoined",
					"others" : ".gallgroups",
				},
				initialize : function() {
					this.createView = new appGroupCreateView;
					this.collection.bind("add", this.addGroup, this);
					this.collection.bind("revise", this.checkgroup, this);
					this.model.bind("viewChange", this.handleViewChange, this);
				},
				render : function() {

				},
				handleViewChange : function(view) {
					if (view == "groups") {
						this.show();
					} else {
						this.hide();
					}
				},
				show : function() {
					this.$el.show();
				},
				hide : function() {
					this.$el.hide();
				},
				renderList : function(opts) {
					if (opts.joined) {
						this.stretchList("joined", opts.joined);
					}
				},
				stretchList : function(id, list) {
					this.initSection(id);
					this.$(this.settings[id])
							.append(this.renderGroupCard(list));
				},
				initSection : function(id) {
					this.$(this.settings[id]).empty();
				},
				renderGroupCard : function(id, el) {
					this.$(this.settings[id]).find(".gcommonitem").remove();
					this.$(this.settings[id]).append(el);
				},
				checkgroup : function(model) {
					//var test = model.isMember(auth.loginuserid);
					var card = this.$el.find(".ggroupcard[data-gid='"
							+ model.get("gid") + "']");

					/*if (test) {
						this.renderGroupCard("joined", card);
						card.find(".joinReq").remove();
						// model
					} else {
						this.renderGroupCard("others", card);
					}*/
					card.remove();
					this.addGroup(model);

				},
				addGroup : function(model) {
					var group = new GroupView({
						model : model,
						collection : this.collection,
					});
					var test = model.isMember(auth.loginuserid);
					if (test)
						this.renderGroupCard("joined", group.render().$el);
					else
						this.renderGroupCard("others", group.render().$el);
				},
				openGroup : function(e) {
					var id = $(e.currentTarget).data("gid");
					// auth.getgroup(id)
				},
				createGroup : function() {
					// var createGroup=new appCreateView;
				}
			});

			var GroupView = Backbone.View
					.extend({
						events : {
							"click" : "selectGroup",
							"click .joinReq" : "sendJoinReq",
						},
						className : "akp-card-item ggroupcard",
						initialize : function() {
							_.bindAll(this, "handleResponse");
							this.model.bind("remove", this.removeGroup, this);
							this.model.bind("updateCount", this.changeCount,
									this);
						},
						render : function() {
							var modeldata = this.model.toJSON();
							modeldata.type = this.model.getType();
							modeldata.image_large = modeldata.image_large || "css/images/groupIcons/a.jpg";

							var template = $("#groupCard-template").tmpl(
									[ modeldata ]);

							this.$el.attr("data-gid", modeldata.gid).append(
									template);

							if (!this.model.isMember(auth.loginuserid)) {
								this.$el.addClass("card-vertical");
								if (this.model.isRequested(auth.loginuserid)) {
									this.appendRequested();
								} else
									this.appendJoin();
							} else {

							}

							return this;
						},
						changeCount : function(count) {
							this.$(".count").html(count + " Members");
						},
						sendJoinReq : function(e) {
							$(e.target).attr("disabled", "disabled").html(
									"Join sent")
							auth.groupJoin(this.model.get("gid"),
									this.handleResponse);
						},
						handleResponse : function(resp) {
							var group = this.model.toJSON();
							if (!group.join_by_approval) {
								console.log(resp);
								group.members.push(auth.loginuserid);
								this.model.set({
									member_count : group.member_count++,
									members : group.members,
								});

								this.collection.reviseGroup(this.model);
							}

						},
						appendJoin : function() {
							var joinbtn = $("<button/>")
									.append("<span class='icon-plus-2'></span>")
									.append("Join")
									.addClass(
											"btn btn-primary btn-block joinReq");
							var action = $("<div/>").append(joinbtn).addClass(
									"card-action");
							this.$el.append(action);
						},
						appendRequested : function() {
							var joinsent = $("<span/>").append(
									"Awaiting Approval").addClass(
									"alert alert-info");
							var action = $("<div/>").append(joinsent).addClass(
									"card-action");
							this.$el.append(action);
						},
						selectGroup : function() {
							if (this.model.isMember(auth.loginuserid))
								this.model.setSelected();
						},
						removeGroup : function() {
							this.$el.remove();
						}
					});

			var appGroupCreateView = Backbone.View
					.extend({
						el : "#createGroupModal",
						events : {
							"submit .createPublicGroupForm" : "sendCreateGroupReq",
							"submit .createPrivateGroupForm" : "sendCreateGroupReq",
							"shown a[data-toggle='tab']" : "setGroupType",
						},
						initialize : function() {
							_.bindAll(this, "sendCreateGroupReq",
									"handleResult");

						},
						approval : {
							"public" : false,
							"private" : true,
						},
						groupType : "public",
						render : function() {
							return this;
						},
						setGroupType : function(e) {
							this.groupType = $(e.target).data("grouptype");
						},
						sendCreateGroupReq : function(e) {
							e.preventDefault();

							var name = $(e.target).find(".groupName").val();
							auth.addGroup(name, this.approval[this.groupType],
									this.handleResult);
							this.disableDialog();

						},
						handleResult : function(resp) {
							console.log(resp);
							this.closeDialog();
						},
						disableDialog : function() {
							this.$el.find('a').removeAttr("data-toggle");
							this.$el.find("input").attr("disabled", "disabled");
							this.$el.find("select")
									.attr("disabled", "disabled");
							this.$el.find("button[type='submit']").attr(
									"disabled", "disabled").html("Loading..");
							this.$el.find("button.close").removeAttr(
									"data-dismiss");

						},
						enableDialog : function() {
							this.$el.find('a').attr("data-toggle", "tab");
							this.$el.find("input").removeAttr("disabled");
							this.$el.find("select").removeAttr("disabled");
							this.$el.find("button[type='submit']").removeAttr(
									"disabled").html("Done");
							this.$el.find("button.close").attr("data-dismiss",
									"modal");
						},
						closeDialog : function() {
							this.$el.modal('hide');
							this.enableDialog();
							this.reset();
						},
						reset : function() {
							this.$el.find("input").val('');
						}
					});

			var orgInviteView = Backbone.View
					.extend({
						el : "#inviteOrgDialog",
						events : {
							"submit #inviteOrgForm" : "orgInvite",

						},
						initialize : function() {

						},
						render : function() {

						},
						orgInvite : function(e) {
							e.stopPropagation();
							var obj = {};
							obj.email = this.$(".email-input").val();
						},
						disableDialog : function() {

							this.$el.find("input").attr("disabled", "disabled");

							this.$el.find("button[type='submit']").attr(
									"disabled", "disabled").html("Loading..");
							this.$el.find("button.close").removeAttr(
									"data-dismiss");

						},
						enableDialog : function() {

							this.$el.find("input").removeAttr("disabled");

							this.$el.find("button[type='submit']").removeAttr(
									"disabled").html("Done");
							this.$el.find("button.close").attr("data-dismiss",
									"modal");
						},
					});

			var adminView = Backbone.View
					.extend({
						el : "#adminSection",
						events : {
							"submit .addUser_form" : "addUser",
							"submit .rmvUser_form" : "removeUser",
							"submit .addGroup_form" : "addGroup",
							"submit .rmvGroup_form" : "removeGroup",
						},
						initialize : function() {
							_.bindAll(this, "addUser", "removeUser",
									"addGroup", "removeGroup",
									"addUserResponse");
							this.model.bind("viewChange",
									this.handleViewChange, this);
							this.$(".knob").knob();
							this.$(".knob.storage").knob({
								'draw' : function() {
									$(this.i).val(this.cv + '%')
								},
							})
						},
						render : function() {
							return this;
						},
						addUser : function(e) {
							if (!e.target.checkValidity()) {
								this.showError(e.target);
								return false;
							}

							this.preventDefault(e);
							var obj = {};
							var uname = $(e.target).find("#addUser_uname")
									.val();
							var fname = $(e.target).find("#addUser_fname")
									.val();
							var pswd = $(e.target).find("#addUser_pswd").val();
							auth.adduser(uname, fname, pswd,
									this.addUserResponse);
							this.disableInputs(e.target);
						},
						removeUser : function(e) {
							if (!e.target.checkValidity()) {
								this.showError(e.target);
								return false;
							}

							this.preventDefault(e);
						},
						addGroup : function(e) {

							if (!e.target.checkValidity()) {
								this.showError(e.target);
								return false;
							}

							this.preventDefault(e)
						},
						removeGroup : function(e) {

							if (!e.target.checkValidity()) {
								this.showError(e.target);
								return false;
							}
							this.preventDefault(e);

						},
						preventDefault : function(e) {
							e.preventDefault();
						},
						addUserResponse : function(resp) {
							console.log(resp);
							var form = this.$(".addUser_form");
							if (resp.status == "success") {
								var msg = $("<div/>").addClass(
										"alert alert-info").append(
										"User Created Successfully.");
								form.find(".form-info").empty().append(msg);
							} else {
								var msg = $("<div/>")
										.addClass("alert alert-error")
										.append(
												"Problem! creating user. Please try again.");
								form.find(".form-info").empty().append(msg);
							}
							this.enableInputs(form);
						},
						disableInputs : function(form) {
							this.$(form).find("input").attr("disabled",
									"disabled");
							this.$(form).find("button").attr("disabled",
									"disabled");
						},
						enableInputs : function(form) {
							this.$(form).find("input").removeAttr("disabled")
									.val("");
							this.$(form).find("button").removeAttr("disabled");
						},
						showError : function(form) {
							var msg = $("<div/>")
									.addClass("alert alert-error")
									.append(
											"Please fill all the fields correctly!");
							form.find(".form-info").empty().append(msg);
						},
						handleViewChange : function(view) {
							if (view == "admin") {
								this.show();
							} else {
								this.hide();
							}
						},
						show : function() {
							this.$el.show();
							this.animateStats();
						},
						hide : function() {
							this.$el.hide();
						},
						animateStats : function() {
							this
									.$('.knob')
									.each(
											function() {

												var $this = $(this);
												var myVal = $this.attr("rel");
												// alert(myVal);
												$this.knob({
													'draw' : function() {
														$(this.i).val(
																this.cv + '%')
													},
												});

												$({
													value : 0
												})
														.animate(
																{

																	value : myVal
																},
																{
																	duration : 2000,
																	easing : 'swing',
																	step : function() {
																		$this
																				.val(
																						Math
																								.ceil(this.value))
																				.trigger(
																						'change');

																	}
																})

											});
						}

					});

			/*
			 * working with tabs and app views
			 * 
			 */

			var navView = Backbone.View
					.extend({
						el : $("#menu"),
						events : {
							"click li" : "display",
							"click a" : "preventDefault",
						},
						defaults : {
							initialView : "kons",
							mainView : "",
							subView : "userprofile_view",
							onViewChange : {}
						},
						views : {
							"container" : "vault",
							"kons" : "kons",
							"planner" : "calendar",
							"dashboard" : "dashboard",
						},
						settings : {},
						initialize : function(opts) {
							_.bindAll(this, "render", "popstateChange",
									"changeState");
							this.dbController = opts.dashboard;
							this.tour = opts.tour;
							this.baseModel = opts.baseModel;

							this.settings = $.extend({}, this.defaults, opts);

							this.model.set(opts);
							this.model.set(this.defaults);

							this.baseModel.bind("viewChange",
									this.handleViewChange, this);
							$(window).bind("popstate", this.popstateChange);

							if (window.location.hash) {
								var tab = this
										.fragmentHash(window.location.hash);
								if (this.views[tab]) {
									this.changeView(tab);
									return this;
								}
							}
							// this.changeView(this.defaults.initialView);
							var baseView = this.model.get("initialView");
							this.changeView(baseView);

							// this.changeView("dashboard");

						},
						handleViewChange : function(view) {
							if (view == "app") {
								view = this.model.get("mainView");
							}

							if (this.views[view]) {
								this.changeState(view);
							} else if (view == "groups") {
								this.deactiveApp();
								this.hide();
							}

							else {
								this.deactiveApp();
							}
						},
						deactiveApp : function() {
							this.$("li").removeClass("active");
							$(".content").children(".appModule").hide();
						},
						popstateChange : function(event) {

							var data = event.state;
							if (data && data.tab) {
								if (!data.sub)
									this.changeState(data.tab);
								else
									this.changeState(data.tab, data.sub);
							}
						},
						fragmentHash : function(hash) {
							return hash.substr(hash.indexOf("#") + 1,
									hash.length);
						},
						getData : function(prop) {
							return this.defaults[prop];
						},
						setData : function(data) {
							$.extend(true, this.defaults, data);
						},
						preventDefault : function(e) {
							e.preventDefault();
						},
						display : function(e) {
							var tabId = $(e.currentTarget).data("tabid");
							this.changeView(tabId);

						},

						changeView : function(tab, sub) {

							// if (this.getData("mainView") == tab) {
							if (this.model.get("mainView") == tab) {
								/*
								 * if (tab == "dashboard" && sub != undefined) {
								 * this.dbController.changeView(sub); }
								 */
								return;
							}

							this.changeState(tab, sub);

							if (sub)
								return;

							if (tab == "dashboard") {
								// var subView = this.getData("subView");
								var subView = this.model.get("subView");

								if (subView)
									sub = subView;
							}

							/*
							 * history.pushState({ tab : tab, sub : sub },
							 * "Neptunium: " + tab, "#" + tab);
							 */
						},
						changeState : function(tab, sub) {
							this.model.set({
								mainView : tab,
							});

							this.$("li").removeClass("active");
							this.$("li[data-tabId=" + tab + "]").addClass(
									"active");

							$(".content").children().hide().end().children(
									'#' + tab).show();

							this.trigger("viewChange", {
								title : tab
							});

							if ((this.settings.onViewChange[tab])
									&& (typeof this.settings.onViewChange[tab] === 'function'))
								this.settings.onViewChange[tab].apply();

							// this.tour.render(tab);

							/*
							 * if ((tab == "dashboard") && (sub != undefined)) {
							 * this.dbController.changeView(sub); }
							 */

						},
						hide : function() {
							this.$el.hide();
						},
						show : function() {
							this.$el.show();
						}

					});

			var UserMe = Backbone.View.extend({
				el : ".userView",
				events : {
					"click .db-opt" : "selectView",
					"submit #changePasswordForm":"changePswd",
				},
				initialize : function(opts) {
					_.bindAll(this,"handleResp");
					this.baseModel = opts.baseModel;
					this.baseModel.bind("viewChange", this.handleViewChange,
							this);
					this.model.set({
						subView : "userprofile_view"
					});
					this.render();
				},
				render : function() {
					this._changeView(this.model.get("subView"));
					return this;
				},
				
				changePswd:function(e){
					e.preventDefault();
					
					this.disableFields();
					var uid=auth.loginuserid;
					var oldPswd=this.$("#old_password").val();
					var newPswd=this.$("#new_password").val();
					var cPswd=this.$("#new_cpassword").val();
					if(newPswd!=cPswd){
						this.enableFields();
						//this.reset();
						this.showInfo("Confirm Password should match with new password!","error");
						this.$("#new_cpassword").focus();
						return false;
					}
					
					auth.changePswd(uid,cPswd,oldPswd,this.handleResp);
					
				},
				handleResp:function(resp){
					if(resp.status=="success"){
						this.showInfo("Password changed successfully.","info");
					}else if(resp.error){
						this.showInfo(resp.error,"error");
					}
					this.reset();
					this.enableFields();
				},
				disableFields:function(){
					$(".changePswd").attr("disabled","disabled");
					var oldPswd=this.$("#old_password").attr("disabled","disabled");
					var newPswd=this.$("#new_password").attr("disabled","disabled");
					var cPswd=this.$("#new_cpassword").attr("disabled","disabled");
				},
				enableFields:function(){
					this.$(".changePswd").removeAttr("disabled");
					var oldPswd=this.$("#old_password").removeAttr("disabled");
					var newPswd=this.$("#new_password").removeAttr("disabled");
					var cPswd=this.$("#new_cpassword").removeAttr("disabled");
				},
				reset:function(){
					var oldPswd=this.$("#old_password").val("");
					var newPswd=this.$("#new_password").val("");
					var cPswd=this.$("#new_cpassword").val("");
				},
				selectView : function(e) {
					var viewid = $(e.currentTarget).data("routeid");
					this.changeState(viewid);
				},
				showInfo:function(msg,type){
					var msgdiv=$("<div/>").addClass("alert alert-"+type).append(msg);
					
					this.$(".changePasswordFormError").empty().append(msgdiv).show();
				},
				handleViewChange : function(view) {
					if (view == "user") {
						this.show();
					} else
						this.hide();
				},
				changeState : function(viewid) {
					this.changeView(viewid)

					/*
					 * history.pushState({ tab : "dashboard", sub : viewid },
					 * "Neptunium: " + "dashboard", "?sub=" + viewid + "#" +
					 * "dashboard");
					 */

				},
				changeView : function(viewname) {
					var currentView = this.model.get("subView");
					if (currentView == viewname)
						return;

					this.model.set({
						subView : viewname
					});

					this._changeView(viewname);
				},
				_changeView : function(viewname) {
					this.$("li.db-opt").removeClass("db_active");
					this.$("li.db-opt[data-routeid=" + viewname + "]")
							.addClass("db_active");

					$(".db_views").children(".db_view").hide().end().children(
							"#" + viewname).show();
				},
				show : function() {
					this.$el.show();
				},
				hide : function() {
					this.$el.hide();
				}

			});

			var WizardView = Backbone.View
					.extend({
						el : "#cmpnyEntryWizard",
						events : {
							"click #addmember" : "addNewMemberToView",
							"click .postmemberentry" : "postNewMemberDetails",
							"click .removememberentry" : "removeMemberFromView",
							"submit .newMemberEntryForm" : "preventDefaultFormSubmit",
							"submit #orgCreateForm" : "createOrg",
							"submit #userCreateForm" : "addUser",

						},

						initialize : function() {
							_.bindAll(this, "stepChanging", "stepChanged",
									"finishing", "finished", "forward",
									"orgCreated", "adminAdded");
							this.stepCount = 0;
							this.orgCreateRequested = false;
							this.userCreateRequested = false;
							this.model.bind("viewChange",
									this.handleViewChange, this);
							// this.render();
						},
						handleViewChange : function(view) {
							if (view == "wizard") {
								this.show();
							} else {
								this.hide();
							}
						},
						render : function() {
							return this;
						},
						handleInviteResp : function(resp) {
							console.log(resp);
						},
						addNewMemberToView : function() {
							var entryForm = $("#newMemberDetailsEntryForm")
									.tmpl([]);

							this.$el.append(entryForm);

						},
						postNewMemberDetails : function(e) {
							var form = $(e.currentTarget).parent(
									".newinvitemember");
							var inviteeName = form.children(".inviteeName")
									.val();
							var inviteeEmail = form.children(".inviteeEmail")
									.val();

							this.inviteMember(inviteeName, inviteeEmail,
									this.handleInviteResp);

						},

						removeMemberFromView : function() {
							var form = $(e.currentTarget).parent(
									".newinvitemember").remove();
						},
						preventDefaultFormSubmit : function(e) {
							e.preventDefault();

						},
						inviteMember : function(name, email, callback) {
							var info = {

							};

							auth.inviteMember(info, callback);
						},
						makeWizard : function() {
							this.$el.steps({
								headerTag : "h3",
								bodyTag : "section",
								enableAllSteps : false,
								forceMoveForward : true,
								// events
								onStepChanging : this.stepChanging,
								onStepChanged : this.stepChanged,
								onFinishing : this.finishing,
								onFinished : this.finished,
							});
							this.validatePassWords();
						},
						createOrg : function(e) {
							if (!e.target.checkValidity()) {
								this.showError();
								return false;
							}
							e.preventDefault();
							var orgName = this.$("#cmpnyName").val();

							// this.dfltGroupName= this.$("#dfltGrpName").val();

							auth.createOrg(orgName, this.orgCreated);
							this.disableInputs(e.target);

							return false;
						},
						orgCreated : function(resp) {
							this.trigger("orgCreated", resp.org);
							this.forward();
						},
						addUser : function(e) {
							if (!e.target.checkValidity()) {
								this.showError2();
								return false;
							}
							e.preventDefault();
							var uname = auth.baseUser.username;
							var first_name = this.$("#user_name").val();
							var user_paswd = this.$("#user_password").val();
							var user_cpaswd = this.$("#user_cpassword").val();
							auth.adduser(uname, first_name, user_paswd,
									this.adminAdded);
							this.disableInputs(e.target);

						},
						adminAdded : function() {
							this.trigger("adminRegistered");
							this.forward();
						},
						disableInputs : function(form) {
							$(form).find(":input").attr("disabled", "disabled");
						},
						showError : function() {
							this.$(".orgCreateFormError").show();
						},
						showError2 : function() {
							this.$(".userCreateFormError").show();
						},
						createDfltGroup : function() {
							auth.createGroup(this.dfltGroupName, this.forward);
						},
						forward : function() {
							this.stepCount++;
							this.$el.steps("next");
						},
						back : function() {
							this.$el.steps("previous");
						},
						stepChanging : function(e, currPos, newPos) {
							if (currPos == 0 && this.stepCount == 0) {
								if (!this.orgCreateRequested) {
									this.$("#orgCreateForm").submit();
									this.orgCreateRequested = true;
								}

							} else if (currPos == 0 && this.stepCount == 1) {
								return true;
							} else if (currPos == 1 && this.stepCount == 1) {
								if (!this.userCreateRequested) {
									this.$("#userCreateForm").submit();
									this.userCreateRequested = true;
								}
							} else if (currPos == 1 && this.stepCount == 2) {
								return true;
							} else if (currPos == 2 && stepCount == 2) {

							}

							return false;
						},
						stepChanged : function(e, currPos, newPos) {

							return true;
						},
						finishing : function(e, currPos) {

							return true;
						},
						finished : function(e, currPos) {
							this.trigger("finished");
							return true;
						},

						show : function() {
							$(".wizardContainer").show();
							this.$el.show();

						},
						hide : function() {
							this.$el.hide();
							$(".wizardContainer").hide();
						},
						validatePassWords : function() {
							var password = document
									.querySelector(' input[name=usr_password]');
							var passwordConfirm = document
									.querySelector(' input[name=usr_password_confirm]');
							if (password && passwordConfirm) {
								[].forEach
										.call(
												[ password, passwordConfirm ],
												function(el) {
													el
															.addEventListener(
																	'input',
																	function() {
																		if (el.validity.patternMismatch === false) {
																			if (password.value === passwordConfirm.value) {
																				try {
																					password
																							.setCustomValidity('');
																					passwordConfirm
																							.setCustomValidity('');

																				} catch (e) {
																				}
																			} else {
																				password
																						.setCustomValidity("The two passwords do not match");
																			}
																		}
																		if ((password
																				.checkValidity() && passwordConfirm
																				.checkValidity()) === false) {
																			password
																					.setCustomValidity("The two passwords do not match, and they don't comply with the password rules.");
																			passwordConfirm
																					.setCustomValidity("The two passwords do not match, and they don't comply with the password rules.");
																		} else {
																			password
																					.setCustomValidity('');
																			passwordConfirm
																					.setCustomValidity('');

																		}
																	}, false)
												});
							}
						}
					})

			/*
			 * screen manipulation
			 */

			var appFlow = Backbone.View
					.extend({
						initialize : function(opts) {

							_.bindAll(this, "showApp");

							var appModel = new appBaseModel;
							this.model = new appViewModel;
							
							this.feedbackView=new feedback;

							
							this.userControls = new UserControls({
								authHandler : auth,
								model : this.model,
							});

							this.groupsView = new appGroupsView({
								el : ".groupSelectorDialog",
								model : this.model,
								collection : groups,
							});

							this.wizardView = new WizardView({
								model : this.model,
							});

							this.loginview = new LoginView({
								model : this.model,
							});

							this.adminView = new adminView({
								model : this.model,
							});

							this.tour = "";

							this.dashboardView = new UserMe({
								model : appModel,
								baseModel : this.model,
							});

							this.navView = new navView({
								dashboard : this.dashboardView,
								tour : this.tour,
								model : appModel,
								baseModel : this.model,
							});

							this.currentView = "";

							this.navView.bind("viewChange",
									this.catchViewChange, this);
							this.wizardView.bind("finished", this.onfinish,
									this);
							this.userControls.bind("groupsView",
									this.showGroupsView, this);
							this.userControls.bind("adminView",
									this.showAdminView, this);
							groups.bind("groupChange", this.showApp, this);
							groups.bind("groupOut", this.showGroupsView, this);
							this.model.bind("viewChange",
									this.handleViewChange, this);

						},
						handleViewChange : function(view) {
							if (view == "app") {
								this.navView.show();
								$(".akorp-ui").show();
								$(".appContainer").show();

							} else if (view == "user" || view == "groups"
									|| view == "admin") {

								$(".akorp-ui").show();
								$(".appContainer").show();
							} else {
								$(".appContainer").hide();
								this.navView.hide();
							}
						},
						onfinish : function() {
							this.loginview.sendLogin(auth.baseUser.username,
									true);
							this.wizardView.hide();
						},
						catchViewChange : function(view) {
							this.trigger("viewChange", view);
							this.currentView = view;
							akp_ws.calendar.onVisible();
						},
						showLoginView : function() {
							this.loginview.checkCookieStatus();
							// this.loginview.show();
						},
						showApp : function() {
							// this.groupsView.hide();
							// this.navView.show();
							// $(".akorp-ui").show();
							// $(".appContainer").show();
							$("footer").hide();
							this.catchViewChange(this.currentView);
							this.model.showView("app");
						},
						showGroupsView : function() {
							// $(".appContainer").hide();
							// this.navView.hide();
							// this.groupsView.show();
							this.model.showView("groups");
							// this.groupsView.renderList(opts);
						},
						showGroupSelector : function(opts) {
							$("#logOverlay,#logboard,#usersignup,#pricinglist")
									.hide();
							$(".topbar,.akp-app").show();
							$("footer").hide();
							this.loginview.hide();
							// this.navView.hide();
							// this.groupsView.show();
							this.model.showView("groups");
							// this.groupsView.renderList(opts)
						},
						notifyAudio : function() {
							var audio = $(".appAudio");
							audio[0].play();
						},
						hideAll : function() {
							$("#logOverlay,#logboard,#usersignup,#pricinglist")
									.hide();
							$(".topbar,.akp-app").show();
							$("footer").hide();
							this.loginview.hide();
							this.navView.hide();
							this.groupsView.hide();
							this.wizardView.hide();
						},
						showView : function(viewname) {
							this.hideAll();
							if (viewname == "3stepwizard") {
								this.wizardView.show();
								this.wizardView.makeWizard();
							} else if (viewname == "login") {
								this.loginview.checkCookieStatus();

							} else if (viewname == "prompt") {
								this.showLoginView();
							} else if (viewname == "user") {
								this.model.showView("user");
							}
						}
					});

			return appFlow;

		});
