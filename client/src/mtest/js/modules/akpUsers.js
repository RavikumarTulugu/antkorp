
define("akpUsers", [ "jquery", "akpauth", "plugins/jquery-ui" ], function($,
		auth) {

	var User = Backbone.Model.extend({
		uid : null,
		name : null,
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
		}
	});
	
	var Users = Backbone.Collection.extend({
		model : User,
		initialize : function() {
			_.bindAll(this, "hidemenu");
			this.bind("hideTools", this.setTime, this);
			this.bind("timeout", this.clearTimer, this);
			this.bind("statusChange", this.changeUserStatus, this);
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
		getGroupList : function() {
			return this.pluck("id");
		},
		changeUserStatus : function(user) {
			var model = this.get(user.uid);
			if (model) {
				model.set({
					status : user.status,
					status_line : user.status_line,
				});

			}
		},
		comparator : function(model) {
			return model.get('status');
		},
		matches : function(term) {
			if (term === "")
				return [];

			return this
					.filter(function(model) {
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

		},
		hideAll : function() {

			this.each(function(model) {
				model.trigger("change:hide");
			})
		},
		showAll : function() {
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
	return Users;

});