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
 * @fileOverview Handling application authentication.
 * @name auth
 */
'use strict';
define('akpauth',[ 'jquery', 'underscore', 'backbone', 'akpcontacts', 'akpGroups',
				'picUpdater', 'akpprofiles', 'akputils', 'jqueryui','plugins/jquery-tmpl' ],
		function($, _, Backbone, contacts, groups, picChangeView, ProfileView,
				utils) {
			// //console.log('akpauth.js loaded');
	
	
			
			/**
			 * A module representing authentication calls.
			 * @module akpauth
			 *  @requires jQuery
			 * @requires Underscore
			 * @requires Backbone
			 * @requires Jquery-ui
			 * @requires jquery-tmpl
			 * 
			 * @requires modules/contacts
			 * @requires modules/groups
			 * @requires modules/profiles
			 * @requires tools/picUpdater
			 * @requires classes/utils
			 * 
			
			 * @exports models/org
			 * @example // Load module require(['models/org'],
			 *          function(organization) { var org = new organization(); });
			 */
	loader(20, 'Authentication initializing');
	var alt_image_small = 'css/images/user32.png';
	
			/**
			 * @constructor
			 * @name organization
			 * @augments module:Backbone.Model
			 */
			

			var organization = Backbone.Model.extend({
				 /** 
                @lends module:models/org~OrgModel.prototype
                 */
				
				initialize : function(opts) {
					this.auth = opts.auth;
				},
				isAdmin : function() {
					return this.get('admin') == this.auth.loginuserid;
				},
				setInfo : function(info) {
					this.set(info);
					this.trigger('initialized', this.toJSON());
				}

			});

			var authHandlers = Backbone.View.extend({
				initialize : function() {

				},
				render : function() {

				}
			});
			
			
			
			
			
			/**
			 * @constructor
			 * @name auth
			 * @scope Private
			 */

			var auth = function() {

				this.baseUser = {};
				this.org = null;
				this.organization = new organization({
					auth : this
				});

				this.groups = groups;
				this.contacts = contacts;

				this.URLQuery = {};

				/** 
				 * is to map requests sent to server 
				 */
				
				this.maptable = {}; 
				this.mapCallbacks = {};

				/**
				 * handle notification requests on responses
				 */
				this.notifTable = {};
				this.mapnotifier = {};

				/**
				 * handle serivices user invitations and requests etc..
				 */
				this.reqTable = {};
				this.maprequests = {};
				this.notificationStreams = {};
				
				/** 
				 * timer to set user away from viewing 
				 * */

				this.awayTimer; 

				this.usersList = {};// maintain list of users in the group
				// userObjects
				this.membersCount = 0;// count no of users presnt in group

				this.userFirstEntry = false; // catch is user visited first
				// time
				this.fbusername; // username got by parsing facebook results
				this.logout = false; // user logout status
				this.loginstatus = false; // user login status

				this.activeuser; // active user userObjects
				this.loginuserid;// active user uid
				this.activegroup;// current selected group
				this.cgd;// active user group ID

				this.isLoadFinish = true; // catch up the application user
				// load finish

				this.prflview = false; // control user visiting profile or
				// updating infomration
				this.picChanged = false; // when user changes profile picture

				this.events = {
					'authenticated' : [],
					'loadComplete' : [],
					'loggedout' : [],
					'unauthorized':[],
				}

				/**
				 * subscription settings
				 */
				this.bbsub = new authHandlers;

				this.groups.bind('groupChange', this.setGroup, this);
				this.groups.bind('leaveGroup', this.groupLeave, this);
				this.groups.bind('deleteGroup', this.removeGroup, this);

				this.contacts.bind('approveUser', this.groupApprove, this);
				this.contacts.bind('declineUser', this.groupDecline, this);

				this.render();

			}
			
			/** 
			 * helps to render UI elements
			 * @method  
			 */
			auth.prototype.render = function() {
				var main = this;
				var data = {
					obj : main
				};

				$('.stts_msg').bind('click', data, main.showStatusOptions);

				$('#status_opts li:not(.status_custom)').bind('click', data,
						main.activeUserStatusChange);
				$('#status_opts li.status_custom').bind('click', data,
						main.statusMsgChange);

			}
			
			

			/**
			 * ===========================================================
			 * status line update: show dialog with status message and message editable.
			 * ==========================================================
			 * @method
			 */

			auth.prototype.statusMsgChange = function(e) {
				var self = e.data.obj;
				e.stopPropagation();
				var input = $(
						'<input type="text" placeholder="your message.." class="status_message" name="status_line" required style="margin-top:20px; margin-left:10px; border-radius:0px;" />')
						.keyup(function(e) {
							if (e.which == 13) {
								var msg = $(this).val();
								if (!msg)
									return;

								self.statusMsgUpdate(msg.status_line)
								$(this).parent().dialog('close').remove();
							}
						}).attr('value', self.activeuser.status_line);

				$('<div/>').append(input).dialog({
					title : 'Status message',
					modal : true,
					open : this.dialogOpen,
					buttons : [ {
						text : 'Ok',
						'class' : 'btn btn-primary',
						'click' : function() {
							var msg = $(this).children('input').val();
							if (!msg)
								return;

							self.statusMsgUpdate(msg);
							$(this).dialog('close').remove();
						}
					}, {
						text : 'Cancel',
						'class' : 'btn btn-danger',
						'click' : function() {
							$(this).dialog('close').remove();
						}
					} ]
				});
			}

			auth.prototype.dialogOpen = function() {
				var $dialog = $(this);

				// $dialog.closest(".ui-dialog").find(".ui-dialog-titlebar").remove();

				$dialog.closest('.ui-dialog').removeClass('ui-corner-all');
				// get the last overlay in the dom
				$dialogOverlay = $('.ui-widget-overlay').last();
				// remove any event handler bound to it.
				$dialogOverlay.unbind();
				$dialogOverlay.click(function() {
					// close the dialog whenever the overlay is clicked.
					// if($dialog.attr('data-loaded') == 'true')
					$dialog.dialog('close');
				});
			}
			auth.prototype.updateStatusMsg = function(msg) {
				$('.status_opt.status_custom')
						.html(msg)
						.append(
								'<span class="edit-icon icon-pencil akp-close-icon"></span>');
				this.activeuser.status_line = msg;
			}
			auth.prototype.statusMsgUpdate = function(msg) {
				var unique = akp_ws.createUUID();
				var obj = {
					mesgtype : 'request',
					request : 'set_status_line',
					service : 'auth',
					cookie : unique,
					status_line : msg,
					uid : this.loginuserid,
				}
				akp_ws.send({data:obj});
				this.updateStatusMsg(msg);

			}

			/**
			 * ========================================================== status
			 * update =========================================================
			 */

			auth.prototype.handleTabSwitch = function() {
				akp_ws.onHidden(this.handleUserAway, this);
				akp_ws.onVisible(this.handleUserAlive, this);
			}
			auth.prototype.handleUserAway = function() {
				var _self = this;
				this.awayTimer = setTimeout(function() {

					_self.changeUserStatus('away');

				}, 3 * 1000 * 60)
			}

			auth.prototype.handleUserAlive = function() {
				clearTimeout(this.awayTimer);
				this.changeUserStatus('available')
			}

			auth.prototype.changeUserStatus = function(status) {
				var self = this;
				if (status == self.activeuser.status)
					return;

				self.sendUserStatus(self, status);
				$('.stts_msg').attr('data-stts', status);
			}
			auth.prototype.activeUserStatusChange = function(e) {
				var self = e.data.obj;
				var stts = $(this).data('opt');
				$('.stts_msg').attr('data-stts', stts);
				self.sendUserStatus(self, stts);

			}

			auth.prototype.showStatusOptions = function(e) {
				e.stopPropagation();
				var stts = $(this).attr('data-stts');
				$('#status_opts li').removeClass('current_status active');
				$("#status_opts li[data-opt='" + stts + "']").addClass(
						'current_status active');

				$('#status_opts').slideDown();
				// .show().css('display','block');
			}

			/*
			 * End of away handling
			 */

			auth.prototype.showActiveUserProfile = function(e) {
				var obj = e.data.obj;
				obj.viewChange(obj.usersList[obj.loginuserid])
			}

			auth.prototype.getuserinfo = function(uid) {
				if (this.usersList[uid])
					return this.usersList[uid];
				else
					return this.activeuser;
			}
			auth.prototype.getUserId = function(uname){
				return this.contacts.filterByUname(uname)
			}
		auth.prototype.getUserGroups = function(uid){
			var user = this.getuserinfo(uid);
			
			return this.groups.getGroupsByUid(user.uid);
			
		}
			/**
			 * User status Requests handling
			 */

			auth.prototype.sendUserStatus = function(main, stts) {
				var self = main;
				var obj = {
					service : 'auth',
					'mesgtype' : 'event',
					eventtype : 'status_update',
					user : self.loginuserid,
					status : stts
				}
				akp_ws.send({data:obj});

				self.activeuser.status = stts;
			}

			/**
			 * User handling
			 */

			auth.prototype.adduser = function(uname, fname, pswd, callback) {
				// send the request to add user.
				// after success of the add user u need to send get request.

				var unique = akp_ws.createUUID();
				var adduser_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'adduser',
					cookie : unique,
					oid : this.org.name,
					uname : uname || this.baseUser.username,
					first_name : fname,
					password : pswd,
				}
				akp_ws.send({data:adduser_obj,success:callback,error:callback});
				this.maptable[unique] = 'adduser';
				//this.mapCallbacks[adduser_obj.cookie] = callback;
				// timeOutList[unique] = setTimeout(timeOut, 30 * 1000, unique);

			}
			auth.prototype.resetUserPswd = function(uname, pswd, callback) {
				// send the request to add user.
				// after success of the add user u need to send get request.
				var user = this.getUserId(uname);
				
				if(!user){
					callback.call(this,"username not found!");
					
					return false;
				}

				var unique = akp_ws.createUUID();
				var adduser_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'reset_password',
					cookie : unique,
					org : this.org.name,
					user : user.uid ,
					uid : this.loginuserid,
					new_password : pswd,
				}
				akp_ws.send({data:adduser_obj,success:callback,error:callback});
				this.maptable[unique] = 'resetUserPswd';
				//this.mapCallbacks[adduser_obj.cookie] = callback;
				// timeOutList[unique] = setTimeout(timeOut, 30 * 1000, unique);

			}
			auth.prototype.deleteUser = function(userid, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'removeuser',
					cookie : unique,
					oid : this.org.name,
					uid : userid
				}
				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[unique] = 'deleteuser';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.loginuser = function() {
				var args = arguments;

				if (this.loginstatus) {
					//console	.log('user already logged in, you are trying to issue login request another time.')
					return false;
				}
				var username = '', pswd = '', rem = false, token = '', callback = '';

				if (args.length == 4) {
					// username, pswd, rem, callback
					username = args[0];
					pswd = args[1];
					rem = args[2];
					callback = args[3];
				} else if (args.length == 2) {
					token = args[0];
					callback = args[1];
					rem = true;
				} else if (!args.length) {
					// if no arguments then return
					return false;
				}

				var guid = akp_ws.createUUID();
				var loginuser_obj = {
					mesgtype : 'request',
					request : 'login',
					service : 'auth',
					uname : username,
					password : pswd,
					cookie : guid,
					rememberme : rem,// boolean
					auth_token : token,
				}
				//console.log('login request sent. waiting for Response....');
				akp_ws.send({data:loginuser_obj,success:callback,error:callback});

				this.maptable[loginuser_obj.cookie] = 'activeuser';
				//this.mapCallbacks[loginuser_obj.cookie] = callback;

				return true; // request sent successfully.
			}

			auth.prototype.logoutuser = function(callback) {
				var guid = akp_ws.createUUID();
				var req_obj = {

					mesgtype : 'request',
					request : 'logout',
					service : 'auth',
					uid : this.loginuserid,
					cookie : guid,
				}
				if (!this.loginstatus)
					return;

				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'logout';
				//this.mapCallbacks[req_obj.cookie] = callback;
				this.logout = false;
			}

			auth.prototype.setuser = function(userObj, callback) {
				// send request to set the user info of userID.
				// getting values from fields

				for ( var key in userObj) {
					if (!userObj[key]) {
						userObj[key] = '';
					}
				}

				var unique = akp_ws.createUUID();
				var setUser_obj = {

					mesgtype : 'request',
					service : 'auth',
					request : 'setuser',
					cookie : unique,
					uid : this.loginuserid,
					user : userObj,

				}

				akp_ws.send({data:setUser_obj,success:callback,error:callback}, true);
				this.maptable[unique] = 'setuser';
				//this.mapCallbacks[unique] = callback;
				// timeOutList[unique] = setTimeout(timeOut, 30 * 1000, unique);

			}

			auth.prototype.getuser = function(userId, callback) {
				var unique = akp_ws.createUUID();
				
				var getuser_obj = {

					mesgtype : 'request',
					service : 'auth',
					request : 'getuser',
					cookie : unique,
					uid : userId,
				}
				
				akp_ws.send({data:getuser_obj,success:callback,error:callback}, true);

				this.maptable[unique] = 'getuser';
				//this.mapCallbacks[getuser_obj.cookie] = callback;

				return binder.bind({
					id : unique,
					user : userId
				});
				
				
				// timeOutList[unique] = setTimeout(timeOut, 30 * 1000, unique);
			}

			auth.prototype.changePswd = function(uid, newPswd, oldPswd,
					callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {

					mesgtype : 'request',
					service : 'auth',
					request : 'change_password',
					cookie : unique,
					uid : uid || this.loginuserid,
					new_password : newPswd,
					old_password : oldPswd,

				}

				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				
				this.maptable[unique] = 'changePswd';
				//this.mapCallbacks[unique] = callback;
			}

			/**
			 * ==========================================================================
			 * Group handling
			 * =========================================================================
			 */
			auth.prototype.getgroup = function(grpid, callback) {

				var unique = akp_ws.createUUID();
				var getgrp_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'getgroup',
					cookie : unique,
					uid : this.loginuserid,
					gid : grpid,
				};

				akp_ws.send({data:getgrp_obj,success:callback,error:callback}, true);
				
				this.maptable[getgrp_obj.cookie] = 'getgroup';
				//this.mapCallbacks[getgrp_obj.cookie] = callback;
				// console.log('Group request sent, waiting for response...')

			}
			auth.prototype.addGroup = function(name, approval, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'addgroup',
					cookie : unique,
					gname : name,
					oid : this.org.name,
					uid : this.loginuserid,
					join_by_approval : approval,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[req_obj.cookie] = 'addGroup';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.removeGroup = function(id, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'delgroup',
					cookie : unique,
					uid : this.loginuserid,
					gid : id,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[req_obj.cookie] = 'removeGroup';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.updateGroup = function(group, callback) {
				var unique = akp_ws.createUUID();
				var getgrp_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'setgroup',
					cookie : unique,
					gid : group.gid,
					group : group,
					uid : this.loginuserid,
				};

				akp_ws.send({data:getgrp_obj,success:callback,error:callback});
				
				this.maptable[getgrp_obj.cookie] = 'updateGroup';
				//this.mapCallbacks[getgrp_obj.cookie] = callback;
			}

			auth.prototype.groupJoin = function(groupId, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'add_member',
					cookie : unique,
					gid : groupId,
					oid : this.org.name,
					uid : this.loginuserid,

				};

				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'groupJoin';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.groupLeave = function(groupId, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'rem_member',
					cookie : unique,
					gid : groupId,
					oid : this.org.name,
					uid : this.loginuserid,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'groupLeave';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.groupApprove = function(userid, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'approve_user',
					cookie : unique,
					gid : this.cgd,
					oid : this.org.name,
					uid : this.loginuserid,
					user : userid,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'groupApprove';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.groupDecline = function(userid, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'disapprove_user',
					cookie : unique,
					gid : this.cgd,
					oid : this.org.name,
					uid : this.loginuserid,
					user : userid,
					reason : '',
				};

				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'groupDecline';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}
			auth.prototype.addCategory=function(category,callback){
				
				var unique = akp_ws.createUUID();
				var req_obj = {
				gid : this.cgd,
				oid : this.org.name,
				uid:this.loginuserid,
				cookie : unique,
				service:'auth',
				mesgtype : 'request',
				request : 'add_category',
				category:category,
				}
				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'addCategory';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}
			auth.prototype.deleteCategory=function(category,callback){
				

				var unique = akp_ws.createUUID();
				var req_obj = {
					gid : this.cgd,
					oid : this.org.name,
					uid : this.loginuserid,
					cookie : unique,
					service : 'auth',
					mesgtype : 'request',
					request : 'delete_category',
					category : category,
				}
				akp_ws.send({data:req_obj,success:callback,error:callback}, true);
				this.maptable[req_obj.cookie] = 'deleteCategory';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			/**
			 * ===================================================================================
			 * organisation Handing
			 * ===================================================================================
			 */
			auth.prototype.createOrg = function(name, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'create_org',
					cookie : unique,
					org : name,
					email : this.URLQuery.email,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[req_obj.cookie] = 'createOrg';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.removeOrg = function(id, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'removeorg',
					cookie : unique,
					uid : this.loginuserid,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[req_obj.cookie] = 'removeOrg';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}
			auth.prototype.getOrg = function(callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'get_org',
					cookie : unique,
					uid : this.loginuserid,
					oid : this.activeuser.organization,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[req_obj.cookie] = 'getOrg';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.orgInvite = function(obj, success, error) {
				$.ajax({
					url : 'php/appInvite.php',
					type : 'post',
					data : {
						userProfile : JSON.stringify(obj),
					},
					success : success,

					error : error
					/*
					 * function(jqXHR, textStatus, errorThrown) {
					 * 
					 * console.log('The following error occured: ' + textStatus,
					 * errorThrown); }
					 */,

				});
			}
			/**
			 * Stat Requests
			 */
			auth.prototype.getFSStatus = function(callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'fsusage',
					cookie : unique,
					uid : this.loginuserid,
					oid : this.org.name,
				};

				akp_ws.send({data:req_obj,success:callback,error:callback});
				this.maptable[req_obj.cookie] = 'fsusage';
				//this.mapCallbacks[req_obj.cookie] = callback;
			}

			/**
			 * ====================================================================
			 * Requests Handle
			 * ===================================================================
			 */
			auth.prototype.invitationsDialog = function(opts) {
				return new EventInvitations(opts);

			}

			auth.prototype.getRequests = function(orgy, marker, handler) {
				var unique = akp_ws.createUUID();

				var obj = {
					service : 'auth',
					mesgtype : 'request',
					request : 'relay_pending_requests',
					category : orgy,
					cookie : unique,
					uid : this.loginuserid,
					gid : this.cgd,
				}

				if (typeof marker == 'string')
					obj.marker = marker;

				akp_ws.send({data:obj});

				this.maptable[obj.cookie] = 'getrequests';
				this.reqTable[obj.cookie] = orgy;

				if (typeof marker == 'object') {
					this.maprequests[obj.cookie] = marker;
				} else if (handler) {
					this.maprequests[obj.cookie] = handler;
				}
			}
			/**
			 * responses to request message
			 */
			auth.prototype.handleGetRequests = function(resp) {
				// console.log(resp);
				resp.service = this.notifTable[resp.cookie];
				resp.response = 'relay_request';

				if (this.maprequests[resp.cookie])
					this.maprequests[resp.cookie]
							.attachRequest(resp.result.invite);

				akp_ws.handleMessage(resp);

			}

			/**
			 * ===============================================================
			 * NOTIFICATIONS
			 * ==============================================================
			 */

			auth.prototype.notificationDialog = function(opts) {
				var dialog = new notificationsView(opts);
				this.notificationStreams[opts.service] = dialog;
				return dialog;
			}

			// Request to get notifications
			auth.prototype.getNotifications = function(orgy, marker, handler) {
				var unique = akp_ws.createUUID();
				var obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'relay_notification',
					cookie : unique,
					category : orgy,
					uid : this.loginuserid,
					gid : this.cgd,

				}
				if (typeof marker == 'string' || typeof marker == 'number')
					obj.marker = marker;

				akp_ws.send({data:obj});

				// console.log(obj);
				this.maptable[obj.cookie] = 'getnotifications';
				this.notifTable[obj.cookie] = orgy;

				if (typeof marker == 'object') {
					this.mapnotifier[obj.cookie] = marker;
				} else if (handler) {
					this.mapnotifier[obj.cookie] = handler;
				}
			}

			// Request to get pending active notifications Count
			auth.prototype.getNotificationCount = function(orgy, handler) {
				var unique = akp_ws.createUUID();
				var obj = {
					mesgtype : 'request',
					service : 'auth',
					request : 'get_notification_count',
					cookie : unique,
					category : orgy,
					uid : this.loginuserid,
					gid : this.cgd,
				}

				// console.log('notification count request sent to server with
				// category : '+ orgy);
				akp_ws.send({data:obj});
				this.maptable[obj.cookie] = 'getnotificationscount';
				this.notifTable[obj.cookie] = orgy;

				if (handler) {
					this.mapnotifier[obj.cookie] = handler;
				}
			}

			// Check all pending notifications
			auth.prototype.checkAllNotification = function(orgy, handler) {
				var unique = akp_ws.createUUID();
				var obj = {
					service : 'auth',
					mesgtype : 'request',
					request : 'mark_all_read',
					cookie : unique,
					uid : this.loginuserid,
					gid : this.cgd,
					category : orgy,

				}

				akp_ws.send({data:obj});
				this.maptable[obj.cookie] = 'checkallnotifications';
				this.notifTable[obj.cookie] = orgy;

				if (handler) {
					this.mapnotifier[obj.cookie] = handler;
				}

			}

			// check a notifiaction with id
			auth.prototype.checkNotification = function(orgy, id, handler) {
				var unique = akp_ws.createUUID();
				var obj = {
					mesgtype : 'request',
					request : 'check_notification',
					service : 'auth',
					id : id,
					uid : this.loginuserid,
					gid : this.cgd,
					category : orgy
				}
				akp_ws.send({data:obj});
				this.maptable[obj.cookie] = 'checknotification';
				this.notifTable[obj.cookie] = orgy;

				if (handler) {
					this.mapnotifier[obj.cookie] = handler;
				}
			}

			// handle responses to the notification requests
			auth.prototype.handleNotifications = function(resp) {
				//console.log(resp.result);
				resp.service = this.notifTable[resp.cookie];
				resp.response = 'relay_notification';

				if (this.mapnotifier[resp.cookie])
					this.mapnotifier[resp.cookie]
							.attachNotification(resp.result);

				akp_ws.handleMessage(resp);

			}

			auth.prototype.handleNotifyCount = function(resp) {
				resp.service = this.notifTable[resp.cookie];
				resp.response = 'notification_count';

				if (this.mapnotifier[resp.cookie])
					this.mapnotifier[resp.cookie].changeCount(resp.count);

				akp_ws.handleMessage(resp);
			}
			auth.prototype.handleNotifyCheckAll = function(resp) {
				resp.service = this.notifTable[resp.cookie];
				resp.response = 'notification_check_all';

				if (this.mapnotifier[resp.cookie])
					this.mapnotifier[resp.cookie].checkoutAll(resp);

				akp_ws.handleMessage(resp);
			}
			auth.prototype.handleNotifyCheck = function(resp) {
				resp.service = this.notifTable[resp.cookie];
				resp.response = 'notification_check';
				akp_ws.handleMessage(resp);

			}
			auth.prototype.routeNotification = function(notification) {
				try {
					this.notificationStreams[notification.category]
							.attachNotification(notification);
				} catch (e) {
					//console.log(e.message);
				}
			}

			/**
			 * ====================================================== 
			 * End of Notifications
			 * =====================================================
			 */

			/**
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
			 * FMGR  Bookmarks
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 */

			auth.prototype.addBookmark = function(bookmark) {
				var unique = akp_ws.createUUID();
				var obj = {
					uid : this.loginuserid,
					bookmark : bookmark,
					service : 'auth',
					mesgtype : 'request',
					request : 'add_bookmark',
					cookie : unique
				}
				akp_ws.send({data:obj});
			}

			auth.prototype.removeBookmark = function(bookmark) {
				var unique = akp_ws.createUUID();
				var obj = {
					uid : this.loginuserid,
					bookmark : bookmark,
					service : 'auth',
					mesgtype : 'request',
					request : 'delete_bookmark',
					cookie : unique
				}
				akp_ws.send({data:obj});
			}

			/**
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
			 * End of Bookmarks Handlers
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 */

			auth.prototype.showProfile = function(user) {

				this.profile.show(user)

			}

			auth.prototype.viewChange = function(User) {
				var cuser = User;
				for ( var key in cuser) {
					if (cuser[key] == 'undefined') {
						cuser[key] = '';
					}
					if (!cuser[key]) {
						cuser[key] = ''
					}
				}

			}
			auth.prototype.handleLogoutResponse = function(resp) {
				//console.log(resp)
				if (resp.status == 'success') {
					// this.trigger('loggedOut', resp);
					this.mapCallbacks[resp.cookie].call(this, resp);
				}else if(resp.error){
					noty({
            			text:resp.error,
            			layout:"bottomRight",
            			theme:'default',
            			type:'error',
            		});
				}
			}

			auth.prototype.updateUser = function(response, textStatus, jqXHR) {
				var resp = JSON.parse(response);
				//console.log(resp.message.id);
			}
			auth.prototype.fberror = function(jqXHR, textStatus, errorThrown) {

				//console.log(errorThrown);
			}
			auth.prototype.subscribe = function(event, callback) {
				if (!this.events[event])
					this.events[event] = [];

				this.events[event].push(callback);
				this.bbsub.bind(event, callback, this);

			}
			auth.prototype.trigger = function(event, data) {
				var callbacks = this.events[event];
				if (!callbacks)
					return;

				var length = callbacks.length;
				for ( var i = 0; i < length; i++) {
					callbacks[i].apply(this, [ data ])
				}
			}
			/**
			 * *****************************************************************
			 * USER INITIALIZATION
			 * ********************************************************************
			 */

			auth.prototype.handleLoginResponse = function(svr_cmds) {
				if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
					this.mapCallbacks[svr_cmds.cookie].call(this, svr_cmds);

				if (svr_cmds.user) {
					//console.log('user Logged in');
					this.loginstatus = true;

					if (this.logout)
						return;
					this.logout = true;

					this.handleTabSwitch();

					//title = 'notifications';
					this.usersList[svr_cmds.user.uid] = svr_cmds.user;
					this.activeuser = svr_cmds.user;
					this.loginuserid = this.activeuser.uid;
					// this.cgd=this.activeuser.gid;

					if (this.userFirstEntry) {
						// this.setuser(fbinfo);
						this.prflview = false;
						this.userFirstEntry = false;
					}
					
					var self= this;
					
					if ((!this.org) || (this.org == null)) {
						this.getOrg(function(resp){
							self.handleGroupsList(resp);
						});
					}

					this.handleGroupsList(svr_cmds.user);

					akp_ws.initModules(this.activeuser);
					// akp_ws.setVaultDir(svr_cmds.user.homedir);
					// akp_ws.LoadBookmarks(svr_cmds.user.bookmarks);

					$('.userModule').show();

					this.updateUserInfoViews(this.activeuser);
					this.profile.show({
						id : svr_cmds.user.uid,
						mode : 'write'
					});
				} else if (svr_cmds.error) {
					
					this.bbsub.trigger('unauthorized');
					//console.error(svr_cmds.error);
					
					
				}

				// this.getgroup(this.activeuser.gid);
			}

			auth.prototype.updateUserInfoViews = function(user) {
				/**
				 * update the active user info in UI.
				 */

				var obj = {
					'username' : user.uname,
					'uid' : user.uid
				};

				$('#uname').html(user.first_name || 'no name').data(obj);
				$('.active-name')
						.append(user.first_name + ' ' + user.last_name);

				$('.status_opt.status_custom')
						.html(user.status_line || 'Custom..')
						.append(
								'<span class=" icon-pencil akp-close-icon edit-icon"></span>');

				$('.active-img img').attr('src',
						user.image_large || 'css/images/user128.png');
				$('#activeuserimg').attr('src',
						user.image_small || 'css/images/user32.png');
				$('#user-std-pic').attr('src',
						user.image_large || 'css/images/user128.png');
			}
			
			auth.prototype.updateOrgInfoViews = function(org){
				$(".main_title").html(org.name);
			}

			// handle group object

			auth.prototype.handleGroupObject = function(svr_cmds) {
				if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
					this.mapCallbacks[svr_cmds.cookie].call(this, svr_cmds);

				var groupModel = this.groups.add(svr_cmds.group);
				var group = svr_cmds.group;
				/*
				 * this.getMembers(group.members); if
				 * (group.pending_approval_list.length) {
				 * this.getMembers(group.pending_approval_list); }
				 */

			}
			auth.prototype.setGroup = function(group) {

				this.cgd = group.gid;
				this.activegroup = group;
				this.bbsub.trigger('groupInit', group);

			}

			auth.prototype.getMembers = function(members) {
				// var members = group.members;
				var membersCount = members.length;

				for ( var i = 0; i < membersCount; i++) {
					var uid = members[i];
					if (this.usersList[uid]) {
						continue; // continue on uid already exist in list
					}
					var getUserReq = this.getuser(uid);
					getUserReq.onError = function(userid) {
						//console.log('error get user :' + userid);
					}
				}
			}

			

			auth.prototype.handleEvents = function(svr_cmds) {
				if (svr_cmds.eventtype == 'new_user') {

					this.usersList[svr_cmds.user.uid] = svr_cmds.user;
					this.contacts.add(svr_cmds.user);

				} else if (svr_cmds.eventtype == 'status_update') {

					if (this.usersList[svr_cmds.user]) {
						this.usersList[svr_cmds.user].status = svr_cmds.status;
						this.usersList[svr_cmds.user].status_line = svr_cmds.status_line;
					}

					this.contacts.changeStatus({
						uid : svr_cmds.user,
						status : svr_cmds.status,
						status_line : svr_cmds.status_line,
					});
				}
			};

			auth.prototype.handleCreateGroup = function(resp) {
				if (typeof this.mapCallbacks[resp.cookie] === 'function')
					this.mapCallbacks[resp.cookie].call(this, resp);
				this.groups.add(resp.group);
			}
			
			

			auth.prototype.handleNewOrg = function(resp) {
				//console.log(resp);
				if (!resp.error) {
					this.org = resp.org;
					this.organization.setInfo(resp.org);
					if (typeof this.mapCallbacks[resp.cookie] === 'function')
						this.mapCallbacks[resp.cookie].call(this, resp)
				} else {
					//console.error('failed to create new org');
					
					noty({
            			text:resp.error,
            			layout:"bottomRight",
            			theme:'default',
            			type:'error',
            		});
				}
			}

			auth.prototype.handleOrgInfo = function(resp) {
				//console.log(resp);
				if (typeof this.mapCallbacks[resp.cookie] === 'function')
					this.mapCallbacks[resp.cookie].call(this, resp.org);

				if (!resp.error) {
					var userlist = resp.org.user_list;
					this.org = resp.org;
					this.organization.setInfo(resp.org);
					
					this.updateOrgInfoViews(this.org);
					this.membersCount = userlist.length;
					this.getMembers(userlist);

				} else {
					
					noty({
            			text:resp.error,
            			layout:"bottomRight",
            			theme:'default',
            			type:'error',
            		});
					
					//console.error('failed to get Organization Information.');
				}
			}

			auth.prototype.handleGroupsList = function(obj) {
				obj= obj.org || obj;
				
				var group_ids = obj.group_list || obj.groups;
				
				if(!group_ids){
					console.log("group Ids not found!");
					console.log(obj);
					return;
				}
				
				for ( var i = 0; i < group_ids.length; i++) {
					this.getgroup(group_ids[i]);
				}
			}

			auth.prototype.handleCallback = function(resp) {
				if (typeof this.mapCallbacks[resp.cookie] === 'function')
					this.mapCallbacks[resp.cookie].call(this, resp);
			}

			auth.prototype.handleMessage = function(msg_obj) {

				var svr_cmds = msg_obj;
				binder.parse(msg_obj);

				// reqsucces_handle(svr_cmds.cookie);
				if (svr_cmds.mesgtype == 'event') {
					this.handleEvents(svr_cmds);
				}

				else {

					switch (this.maptable[svr_cmds.cookie]) {
					case 'activeuser':
						this.handleLoginResponse(svr_cmds);

						break;
					case 'getuser':

						if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
							this.mapCallbacks[svr_cmds.cookie].call(this,									svr_cmds);

						if (svr_cmds.mesgtype == 'response') {
							this.usersList[svr_cmds.user.uid] = svr_cmds.user;

							/*
							 * var usersLength = _.size(this.usersList); if
							 * (usersLength == this.membersCount &&
							 * this.isLoadFinish) { this.isLoadFinish = false; //
							 * akp_ws.setupModules(this.activeuser); //
							 * this.trigger('loadComplete', this.usersList); }
							 */

							// this.showProfile(svr_cmds.user);
							if (svr_cmds.user.uid == this.loginuserid) {
								this.updateUserInfoViews(svr_cmds.user);
							}

							if (svr_cmds.user.uid != this.loginuserid) {
								this.contacts.add(svr_cmds.user);
							}
						} else {
							// console.log(svr_cmds);
						}
						break;

					case 'setuser':
						/**/

						if (svr_cmds.status == 'success') {
							this.getuser(this.loginuserid,
									this.mapCallbacks[svr_cmds.cookie]);
						} else {
							//console.error('Failed to update user information');
							if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
								this.mapCallbacks[svr_cmds.cookie].call(this,svr_cmds);
						}
						break;

					
					
					case 'logout':
						this.handleLogoutResponse(svr_cmds);
						break;
					
						
					
						

					/*
					 * Group Request Responses
					 */

					case 'getgroup':
						this.handleGroupObject(svr_cmds);
						break;
					case 'addGroup':
						this.handleCreateGroup(svr_cmds);
						break;
					case 'adduser':
					case 'changePswd':
					case 'resetUserPswd':
						
						
					case 'groupJoin':
					case 'updateGroup':
					case 'groupLeave':
					case 'groupApprove':
					case 'groupDecline':
					case 'removeGroup':
					case 'addCategory':
					case 'deleteCategory':
						/**
						 * stats
						 */
					case 'fsusage':
						this.handleCallback(svr_cmds)
						break;

					/*
					 * Org Request Responses
					 */
					case 'createOrg':
						this.handleNewOrg(svr_cmds);
						break;
					case 'getOrg':
						this.handleOrgInfo(svr_cmds);
						break;

					case 'picUpload':
						changePic.post(svr_cmds);
						break;
					
						

					/**
					 * request responses
					 */

					case 'getrequests':
						this.handleGetRequests(svr_cmds);
						break;

					/**
					 * notification requests
					 */
					case 'getnotifications':
						this.handleNotifications(svr_cmds);
						break;
					case 'getnotificationscount':
						this.handleNotifyCount(svr_cmds);
						break;
					case 'checkallnotifications':
						this.handleNotifyCheckAll(svr_cmds);
						break;
					case 'checknotification':
						this.handleNotifyCheck(svr_cmds);
						break;

					default:
				
						this.handleCallback(svr_cmds)
						console.log('Request Timed out:');
						console.log(svr_cmds);
					}
				}
			}
			
			
			auth.prototype.send = function(req,callback){
				
				
				akp_ws.send({data:req,success:callback,error:callback}, true);
				//this.mapCallbacks[req.cookie] = callback;
			}
			
			var akp_auth = new auth;

			/**
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 * Notifications Dialog
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 */

			
			/**
			 * @constructor
			 *
			 */
			var notification = Backbone.Model.extend(
					/** 
	                @lends module:models/notification~notificationModel.prototype
	            */
					{
						/**
						   * @class notification class to handle services notifications
						   *
						   * @augments Backbone.Model
						   * @constructs
						   * notification
						   */
				
						notifier : '',
						description : '',
						active : false,
						initialize : function() {
							this.bind('change', this.handleUpdates, this);
						},
						handleUpdates : function(model) {
							var diff = model.changedAttributes();

							for ( var att in diff) {
								switch (att) {
								case 'active':
									// this.trigger('statusChange', user);
									break;

								default:
									this.trigger('updated');

								}
							}
						},
						check : function() {
							if (this.get('active')) {
								var ntfyid = this.get('id');
								akp_auth.checkNotification(this.get('service'),
										ntfyid, this);

								this.set({
									'active' : false
								});

								this.trigger('checked');
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
								return $.fullCalendar.formatDate(date, 'HH:mm');
							} else if ((now.getDate() - date.getDate()) == 1
									&& monthCheck && yearCheck) {
								return 'yesterday';
							} else {
								return $.fullCalendar.formatDate(date,
										'dd/MM/yyyy');
							}

						},
						maskDescription : function(baseStr) {
							if (!baseStr)
								return baseStr;

							var seperator = baseStr.lastIndexOf('@');
							if (seperator <= 0)
								return baseStr;

							var constStr = baseStr.substr(0, seperator);
							var datestr = baseStr.substr(seperator + 2,
									baseStr.length);
							var startdate = new Date(datestr);
							var time = akp_ws.calendar.date2String(startdate,
									'hh:mmtt dd/MM/yy');
							var mask = constStr + ' @ ' + time;

							return mask;
						},
						renderNotifiers : function(notification, name) {
							var keyuser = '';
							if (notification.notifiers.length > 1) {

								for ( var i = 0; i < notification.notifiers.length; i++) {

									if (notification.notifiers[i] == akp_auth.loginuserid)
										continue;

									keyuser += akp_auth
											.getuserinfo(notification.notifiers[i]).first_name
											+ ', ';
									if (i == 3) {
										keyuser += ' and '
												+ (notification.notifiers.length - 3)
												+ ' others';
										break;
									}
								}

							} else {
								keyuser = name;
							}
							return keyuser;
						},
						getInfo : function() {
							var notification = this.toJSON();
							var user = akp_auth
									.getuserinfo(notification.notifiers[0]);
							var info = {
								img : user.image_small || alt_image_small,
								name : this.renderNotifiers(notification,
										user.first_name),
								description : this.service == 'calendar' ? this
										.maskDescription(notification.description)
										: notification.description,
								timestamp : this
										.formatTime(notification.timestamp * 1000),
							}

							if (notification.preview)
								info.preview = utils
										.htmlUnescape(notification.preview);
							return info;

						},

					})
					
					/**
					 * @constructor 
					 *
					 */

			var notifications = Backbone.Collection.extend({
				model : notification,
				mapNotificationCategory : {
					'file' : 'container',
					'kons' : 'kons',
					'calendar' : 'planner'
				},
				changeCount : function(val) {
					this.trigger('countChange', val);
				},
				checkAll : function() {
					akp_auth.checkAllNotification(this.settings.service, this);
				}
			});

			/**
			 * @constructor
			 * 
			 */
			
			var notificationsView = Backbone.View
					.extend({
						// el:'.mt-menu.kons-tab',
						events : {
							'click .notify-no' : 'openNotifications',
							'click .notification' : 'hideNotifications',
							'scroll .notifications-list' : 'getMore',
							'click .check-all' : 'checkoutAll'
						},
						defaults : {
							service : 'kons',
							onNotificationClick : '',// required
							lastTop : 0,
							timestamp : 0,
							marker : null,
						},
						settings : {
							lastTop : 0,
							timestamp : 0,
							marker : null,
						},
						initialize : function(opts) {
							_.bindAll(this, 'hideNotifications', 'getMore');

							this.settings = $.extend({}, this.defaults, opts);

							this.collection = new notifications;
							// this.posts=opts.posts;
							this.collection.bind('add', this.addNotification,
									this);
							this.collection.bind('countChange',
									this.changeCount, this);

							$(document).bind('click', this.hideNotifications);

							// auth.getNotifications('kons');
						},
						render : function() {
							return this;
						},
						checkoutAll : function() {

							akp_auth.checkAllNotification(
									this.settings.service, this);
							// this.model.set({'active':false});
							var stsel = this.$('.notifications-list').children(
									'.notification').attr('data-active', false)
									.find('.ntfy-status');
							stsel.removeClass('icon-radio-checked').addClass(
									'icon-radio-unchecked');
							this.changeCount(0);
						},
						getNotificationCount : function() {
							akp_auth
									.getNotificationCount(this.settings.service);
						},
						init : function() {
							var template = $('#notification-view-template')
									.tmpl([ {
										count : 0,
										className : this.settings.className
									} ]);
							this.$el.append(template);
							this.$('.notifications-list').bind('scroll',
									this.getMore);

							akp_auth.getNotifications(this.settings.service,
									this);
							akp_auth.getNotificationCount(
									this.settings.service, this);
						},
						getMore : function() {
							var top = this.$('.notifications-list').scrollTop();
							var scrollheight = this.$('.notifications-list')[0].scrollHeight;// this.$el.height();
							var offsetheight = this.$('.notifications-list')[0].offsetHeight
							var contentheight = scrollheight - offsetheight;
							var docHeight = $(document).height();
							if (top > this.settings.lastTop) {

								// if(top+ height > docHeight-50 ) {
								if (contentheight < top + 50) {
									var id = this.$('.notification:last-child')
											.attr('data-notifyid');
									var model = this.collection.get(id);
									var marker = model.toJSON().timestamp;

									if (marker != this.settings.marker) {

										this.relayReq(marker);
										this.settings['marker'] = marker;
									}
								}
							}
							this.settings.lastTop = top;
							return;
						},
						relayReq : function(marker) {
							akp_auth.getNotifications(this.settings.service,
									marker, this);

						},
						hideNotifications : function(e) {
							e.stopPropagation();
							this.$('.notifications-pane').hide();
						},
						openNotifications : function(e) {
							e.stopPropagation();
							e.preventDefault();
							$('.notifications-pane').hide();
							//if (this.collection.length)
								this.$('.notifications-pane').show();
						},

						changeCount : function(count) {
							var prevcnt = parseInt(this.$('.notify-no').html());

							if (count == 'inc') {
								count = prevcnt + 1;
							} else if (count == 'dec') {
								count = prevcnt - 1;
							}

							if (parseInt(count) >= 0)
								this.$('.notify-no').html(count);
						},
						attachNotification : function(notification, count) {

							// For existing notification updates
							var model = this.collection.get(notification.id);

							if (model) {
								model.set(notification);
							} else {
								// For New notifiaction
								this.collection.add(notification);
							}

							// update count
							if (count) {
								this.changeCount(count);
							}

						},
						addNotification : function(model) {
							// $('.notifications-list').bind('scroll',this.getMore);
							// this.$('.notify-no').html(this.collection.length);
							var notification = model.toJSON();
							if (notification.notifiers.length == 1) {
								if (notification.notifiers[0] == akp_auth.loginuserid) {
									//console.log(model.toJSON());
									//console											.log('notifier is login user so that notification dropped.')
									return;
								}
							}

							var ntfy = new notificationView({
								model : model,
								// posts:this.posts,
								collection : this.collection,
								service : this.settings.service,
								click : this.settings.onNotificationClick,
							});

							this.$(".instantEmptyNotification").remove();
							
							if (model.toJSON().addTop)
								// this is to add the
								// notification at top
								// of the list
								// For runtime notifications
								this.$('.notifications-list').prepend(
										ntfy.render().$el);
							else
								// For standard relay notifications
								this.$('.notifications-list').append(
										ntfy.render().$el);
						},
						clear : function() {
							this.collection.reset();
							this.$('.notifications-list').empty();
							this.$('.notifications-pane').remove();
							this.settings = $.extend({}, this.settings, {
								lastTop : 0,
								timestamp : 0,
								marker : null,
							});
							//this.showInstantMsg();
						},
						showInstantMsg:function(){
							var instant = $("<div/>").addClass("instantEmptyNotification notification").append("You have no notifications!");
							this.$('.notifications-list').append(instant);
						},
					});
			
			
			
					/**
					 * @constructor
					 * 
					 */

			var notificationView = Backbone.View
					.extend({
						events : {
							'click' : 'checkNotification',
						},
						initialize : function(opts) {
							_.bindAll(this, 'checkNotification');
							this.service = opts.service;
							this.callback = opts.click;
							this.model.set({
								service : this.service
							});
							this.model.bind('updated', this.showupdates, this);
							this.model.bind('checked', this.sendChecked, this);
							// this.posts=opts.posts

						},
						showupdates : function(model) {
							this.render();
						},

						render : function() {
							var notification = this.model.toJSON();
							// console.log(notification);
							var info = this.model.getInfo();

							// console.log(notification);
							this.$el = $('#notification-template').tmpl(
									[ info ]);

							var statusClass = notification.active == true ? 'icon-radio-checked'
									: 'icon-checkmark-circle';
							var status = $('<span>').addClass('ntfy-status')
									.addClass(statusClass);
							this.$el.append(status).attr('data-active',
									notification.active).bind('click',
									this.checkNotification).attr(
									'data-notifyid', notification.id);

							return this;
						},
						sendChecked : function() {

							var stsel = this.$el.attr('data-active', false)
									.find('.ntfy-status');
							stsel.removeClass('icon-radio-checked').addClass(
									'icon-checkmark-circle');

							this.collection.changeCount('dec');
							// this.collection.trigger('countChange', 'dec');

						},
						checkNotification : function() {
							var obj = this.model.toJSON();

							// switch to the notification category tab.
							akp_ws.appView.navView
									.changeView(this.collection.mapNotificationCategory[obj.category]);

							this.callback.call(undefined, obj);
							this.model.check();
							/*
							 * if (obj.active == true) { this.sendChecked(); }
							 */

						}
					});

			/*
			 * ========================================================================
			 * Requests View
			 * =======================================================================
			 */

			var invitation = Backbone.Model.extend({});
			var invitations = Backbone.Collection.extend({
				model : invitation
			});

			var EventInvitations = Backbone.View.extend({
				events : {
					'click .evt-title' : 'showInvitation'
				},
				settings : {},
				defaults : {
					hasRequests : false,
				},
				initialize : function(opts) {
					_.bindAll(this, 'addRequest');
					this.collection = new invitations;
					this.settings = $.extend({}, this.defaults, opts);
					this.collection.bind('add', this.addRequest, this);
					// this.hideElement();
				},
				getInvitations : function() {

				},
				init : function() {
					akp_auth.getRequests(this.settings.service, this);
				},
				render : function() {
				},
				addRequest : function(model) {
					var req = model.toJSON();
					var temp = this.settings.onInvite(req);
					var item = $('<li/>').append(temp);
					this.$('ul').append(item).find('.empty-invite')
							.parent('li').remove();
				},
				hideElement : function() {
					this.$el.hide();
				},
				showElement : function() {
					this.$el.show();
				},
				attachRequest : function(req) {
					//console.log(req);
					if (!this.hasRequests) {
						// this.showElement();
						this.hasRequests = true;
					}
					this.collection.add(req);
				},
				showInvitation : function() {

				},
				clear : function() {
					this.collection.reset();
					this.$('ul').empty();
				},
			});

			/*
			 * ===========================================================
			 * Welcome screen
			 * =========================================================
			 */

			/*
			 * $('.main_title').click( function() {
			 * $('.content').children().hide().end().children(
			 * '#welcomeSection').show(); });
			 */
			var Binder = function(opts) {

				var _self = this;
				this._mapQuery = {};

			}
			Binder.prototype.parse = function(resp) {
				if (this._mapQuery[resp.cookie]) {
					var obj = this._mapQuery[resp.cookie];
					obj.success(resp)
				}
			}
			Binder.prototype.bind = function(opts) {
				var obj = new assigner({
					user : opts.user
				});
				this._mapQuery[opts.id] = obj;
				return obj;
			}

			var assigner = function(opts) {
				this.onError = null;
				this.onSuccess = null;
				this.done = false;
				var _self = this;
				this.timer = setTimeout(function() {
					_self.done = true;
					if (_self.onError)
						_self.onError.call(_self, opts.user);
				}, 5000)
				return this;
			}
			assigner.prototype.success = function(resp) {
				clearTimeout(this.timer);
				if (this.done)
					return;

				if (this.onSuccess)
					this.onSuccess.call(this, resp);
			}

			var binder = new Binder();

			var changePic = new picChangeView({
				controller : akp_auth,
			});

			var profile = new ProfileView({
				controller : akp_auth,
				collection : akp_auth.contacts,
			});

			auth.prototype.profile = profile;
			auth.prototype.picUpdater = changePic;

			return akp_auth;
		});
