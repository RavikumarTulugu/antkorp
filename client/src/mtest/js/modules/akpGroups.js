define("akpGroups", [ "jquery", "akpauth", "akpUsers", "plugins/jquery-ui" ],
		function($, auth, Users) {

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
				getModelByGid : function(gid) {
					var model = this.where({
						gid : gid
					})[0];
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
				}

			});
			var groups = new Groups;

			return groups;
		});