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
 * @fileOverview Groups module
 * @name akpGroups
 */


define("akpGroups", [ "jquery", "akpauth", "akpUsers", "jqueryui" ],
		function($, auth, Users) {
	
	
	window.App = window.App || {};
	App.Views = App.Views || {};
	App.ui = App.ui || {}; 
	

			var Group = Backbone.Model.extend({
				idAttribute : "gid",
				users : new Users,
				initialize : function() {
					this.bind("change", this.handleChanges, this);
				},
				handleChanges : function(model) {
					var diff = model.changedAttributes();
					var group = model.toJSON();
					for ( var att in diff) {
						switch (att) {
						case 'member_count':
							this.trigger("updateCount", group.member_count);
							break;

						}
					}
				},
				getUsers : function() {
					return this.users;
				},
				getUsersCount : function() {
					return this.users.length;
				},
				setSelected : function() {
					this.collection.setSelected(this);
				},
				isAdmin : function(userid) {
					var user = userid || akp_ws.auth.loginuserid;
					return this.get("admin") == user;
				},
				isMember : function(userid) {
					var user = userid || akp_ws.auth.loginuserid;
					if (this.get("admin") == user)
						return true;
					else
						return _.contains(this.get("members"), user);
				},
				isRequested : function(userid) {
					var user = userid || akp_ws.auth.loginuserid;
					return _.contains(this.get("pending_approval_list"), user);
				},
				isPublic : function() {
					return !this.get("join_by_approval");
				},
				isPrivate : function() {
					return this.get("join_by_approval");
				},
				getType : function() {
					return this.get("join_by_approval") ? "Private" : "Public";
				},
				hasPendingApprovals : function() {
					return this.get("pending_approval_list").length;
				},
				remove : function() {
					this.trigger("remove");
				}
			});

			var Groups = Backbone.Collection.extend({
				model : Group,
				initialize : function() {
					this.selected = null;
				},
				getGroupsByUid :function(uid){
					return this.filter(function(group){
						return group.isMember(uid);
					});
					
				},
				getModelByGid : function(gid) {
					/*var model = this.where({
						gid : gid
					})[0];*/
					
					var model = this.get(gid);
					
					if (model)
						return model;
					else
						return false;
				},
				groupsCount : function() {
					return this.length;
				},
				setSelected : function(group) {
					this.selected = group;
					this.trigger("groupIn", group.toJSON());
					this.trigger("groupChange", group.toJSON());
				},
				selectedGroup : function() {
					return this.selected != null ? this.selected : false;
				},
				selectGroup:function(gid){
					var group = this.getModelByGid(gid);
					if(group)
						if(group.isMember()){
							this.setSelected(group);
							return group;
						}
					
					return false;
				},
				reviseGroup : function(group) {
					this.trigger("revise", group);
				},
				pullout : function() {
					this.trigger("groupOut");
				},
				leaveGroup : function(gid, callback) {
					var self = this;
					this.trigger("leaveGroup", gid, function(resp) {
						self._leaveGroup(gid, resp, callback);
					});
				},
				matches : function(term) {
					if (term === "")
						return [];

					return this.filter(function(model) {
						return model.get('gname').toLowerCase().indexOf(term) !== -1
					});
				},
				deleteGroup : function(gid, callback) {
					var self = this;
					this.trigger("deleteGroup", gid, function(resp) {
						self._deleteGroup(gid, resp, callback);
					});
				},
				_leaveGroup : function(gid, resp, callback) {
					this.trigger("groupOut");

					var group = this.getModelByGid(gid);
					var members = group.get("members");
					var memberscount = group.get("member_count");
					members = _.without(members, akp_ws.auth.loginuserid);

					group.set({
						member_count : memberscount--,
						members : members,
					});

					this.trigger("revise", group);
					this.trigger("groupLeft");
					callback.call(this, resp);
				},
				_deleteGroup : function(gid, resp, callback) {
					this.trigger("groupOut");
					var group = this.getModelByGid(gid);
					group.remove();
					this.remove(group);
					this.trigger("groupDeleted");
					callback.call(this, resp);
				},selector:function(opts){
					
					return new App.Views.groupSelector({
						el:opts.el,
						groups:this,
					});
				}

			});
			var groups = new Groups;
			
			
			
			var selectors = Backbone.Collection.extend({
				model : Group,
			});
			
			

		App.Views.groupSelector = Backbone.View					.extend({
						defaults : {
							onAddGroup : "",
							onRemoveGroup : "",
							blockGroup : [],
							maxGroups : 6,
							

						},
						settings : {},
						className : "Selector groupSelector",
						events : {
							"click" : "getFocus",
							"keyup .groupsInput" : "getSuggestions",
						},
						initialize : function(options) {
							_.bindAll(this, "render", "_resetState","_selectGroup", "loadSuggestions");
							this.settings = $.extend({}, this.defaults, options);
							this.collection = new selectors;
							this.collection.bind("add", this.addGroup, this);
							this.collection.bind("remove", this._removeGroup,									this);
							this.groups = options.groups;
							// this.render();

						},
						render : function() {
							this.$el									.append(											'<div class="groupsSelected Selected"><ul></ul></div><input type="text" class="groupsInput Input" placeholder="add" /><div class="groupSuggestions Suggestions"><ul class="sugglist"></ul</div>')									.addClass(this.className);
							this._resetState();
							return this;
						},
						addGroup : function(model) {
							var group = model.toJSON();
							var _self = this;
							var tag = $("<li/>").attr({
								"data-gid" : group.gid
							}).append(group.gname)
									.addClass("userEntry Entry").appendTo(
											this.$(".groupsSelected ul"));
							$(" <span class='icon-cross removeUserTag removeTag'></span>")
									.bind("click", {
										group : group.gid
									}, function(e) {
										_self.removeGroup(group.gid);
									}).appendTo(tag);

							this.trigger("addGroup", group);
						},
						getFocus : function() {
							this.$(".groupsInput").focus();
						},
						getSuggestions : function(e) {
							var key = $(e.currentTarget).val();
							if (key.length > 0) {
								var suggestions = this.groups.matches(key);
								this.loadSuggestions(suggestions);
							} else if (!key.length) {
								if (e.keyCode == 8) {
									var group = this.collection.pop();
									// this._removeUserTag(user.id);
								}
							}

						},
						loadSuggestions : function(groups) {
							this.$(".groupSuggestions").show();
							this.$(".sugglist").empty();
							var count = this.settings.maxSuggestions || groups.length;
							for ( var i = 0; i < count; i++) {
								var group = groups[i];
								
								if (!group)
									continue;

								var data = group.toJSON();
								$("<li/>").addClass("usrsugst").append(data.gname).bind("click", {
									obj : data
								}, this._selectGroup).appendTo(this.$(".sugglist"));
								
							}

						},
						_removeGroup : function(model) {
							var group = model.toJSON();
							this._removeTag(group.gid);
							this.trigger("removeGroup", group);
						},
						_removeTag : function(id) {
							this.$(".groupsSelected ul").children(
									"li[data-gid=" + id + "]").remove();
						},
						_selectGroup : function(e) {
							
							this._resetState();
							var group = e.data.obj;
							group["id"] = group.gid;
							this.collection.add(group);

						},
						_resetState : function() {
							this.$(".sugglist").empty();
							this.$(".groupSuggestions").hide();
							this.$(".groupInput").val("").focus();

						},
						addGroups : function(groups) {
							for ( var i = 0; i < groups.length; i++) {

								var group = this.groups.get(groups[i]);
								if (!group)
									continue;

								group["id"] = group.gid;
								this.collection.add(group);
							}
						},
						removeGroup : function(id) {
							var model = this.collection.get(id);
							this.collection.remove(model);

						},
						getSelected : function() {
							return this.collection.pluck("gid");
						},
						reset : function() {
							this.$(".groupsSelected ul").empty();
							this._resetState();
							this.collection.reset();
							return this;
						}

					});
		
		
		
			
			
			
			
			

			return groups;
		});