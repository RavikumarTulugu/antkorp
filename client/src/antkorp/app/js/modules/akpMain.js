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
 * @fileOverview Application level communicator
 * @name akpMain
 */



define(
		"akpMain",
		[ "jquery", "underscore", "backbone", "akputils",
				"text!../templates.html" ],
		function($, _, Backbone, utils, templates) {
			
			
			
			/**
			 * A module representing authentication calls.
			 * @module commulator
			 * @requires jQuery
			 * @requires Underscore
			 * @requires Backbone
			 * @requires classes/utils
			 * 
			 *
			 */

			/*
			 * catch Visibility Change
			 */
			var ViewManager = Backbone.View
					.extend({
						initialize : function(options) {
							this.transporter = options.transporter;
							_.bindAll(this, "render", "handleBeforeUnload",
									"handleWindowMessages");
							$("body").append(templates);
							this.hasChanged = false;// FIXME : when moving to
							// deploy

							$(window).bind({
								"unload" : this.handleUnload,
								"beforeunload" : this.handleBeforeUnload,
								"message" : this.handleWindowMessages,
							});

							var tooltipPosition = {
								my : "center bottom-20",
								at : "center top",
								using : this.tooltipUsing,
							};

							$(document).tooltip({
								position : tooltipPosition
							}).bind({
								'contextmenu' : this.handleRightClick,
								'click' : this.handleClick,
							});

						},
						render : function() {

						},
						handleWindowMessages : function(e) {
							var msg = e.originalEvent.data;
							if (msg.mesgtype == "hide_pdf_viewer") {
								$("#pdf-vwr").hide();
							} else if (msg.mesgtype == "gtk_viewer") {
								var unique = akp_ws.createUUID();
								var obj = {
									mesgtype : "request",
									request : "broadway_input",
									cookie : unique,
									data : window.btoa(msg.originalMsg),
									uid : this.transporter.handlers.akpauth.loginuserid,
									service : "tunneld",
								}

								// console.log(obj.data);
								this.transporter.send(obj);
							}
						},
						handleRightClick : function() {
							// return false;
						},
						handleClick : function() {

							$(".akp").hide();

						},
						handleUnload : function() {
							/*
							 * if (this.transporter.handlers.akpauth.logout) {
							 * this.transporter.handlers.akpauth.logoutuser(); }
							 */
							akp_ws.close();
						},
						handleBeforeUnload : function() {

							if (this.hasChanged)
								return "Your session is closing. Do you want to proceed?";

						},
						tooltipUsing : function(position, feedback) {
							$(this).css(position);
							$("<div>").addClass("arrow").addClass(
									feedback.vertical).addClass(
									feedback.horizontal).appendTo(this);
						},
					});
			
			
			
			
			

			/*
			 * websocket Connection handling and message passing
			 */

			var appMasterView, app;
			var clientidrecvd = true;
			var clientid;

			/**
			 * @constructor
			 * @name akp
			 * @param {object} options config for commulator
			 * 
			 */
			
			
			var akp = function(options) {

				this.appTitle = "Neptunium Demo";
				this.titleTimer = "";
				this.isVisible = true;// bool for visible detection
				this.checkHidden();// chack browser tab visibility
				this.app = "";// main app for navigation
				this.settings = {
					gid : "",
					uid : "",
					user : "",
					groups : "",
					users : [],
				};

				this.GroupSelector = true;
				this.originURL = window.location.origin;
				this.handlers = options;
				this.kons = new this.handlers.kons;
				this.calendar = options.calendar;
				this.vault = options.vault;
				this.auth = options.akpauth;

				this.handlers.akpauth.groups.bind("groupChange",
						this.groupChange, this);

			}
			
			
			akp.prototype.groupChange = function(group) {
				if (this.handlers.calendar) {
					this.handlers.calendar.changeGroup(group);
				}
				if (this.handlers.kons) {
					// var Kons = new this.handlers.kons();
					this.kons.changeGroup(group);
				}

				if (this.handlers.vault) {
					this.handlers.vault.changeGroup(group);
				}
			}

			akp.prototype.init = function(options) {
				
					this.transportObj = options.transportObj|| "";
					this.sendCallback = options.sendCallback || "";
					this.closeCallback = options.closeCallback || "";
				

			}
			
			akp.prototype.initModules = function(user) {
				// openApp();, group
				if (this.GroupSelector)
					appMasterView.showGroupSelector({
					// joined : group
					});

				if (this.handlers.vault) {
					this.handlers.vault.start({
						homedir : user.homedir,
						bookmarks : user.bookmarks,
					});
				}
			}
			
			akp.prototype.setupModules = function(user) {
				/*
				 * this will call after all users are loaded into view
				 */

				window.requestAnimationFrame(appMasterView.showApp);

				if (this.handlers.kons) {
					// var Kons = new this.handlers.kons();
					this.kons.start();
				}
				if (this.handlers.calendar) {
					this.handlers.calendar.start();
				}
				if (this.handlers.akpauth) {
					this.handlers.akpauth.handleTabSwitch();
				}

				/*
				 * if (this.handlers.vault) {
				 * this.handlers.vault.start({homedir:user.homedir,
				 * bookmarks:user.bookmarks,}); }
				 */
			}

			akp.prototype.send = function(obj, strict) {
				if (strict != true) {
					try {
						var msg= obj.data;
						
						if (msg.mesgtype == "request"
								|| msg.mesgtype == "response"
								|| msg.mesgtype == "ack"
								|| msg.mesgtype == "cancel") {
							var gid = this.getGID();

							if (gid)
								obj.data.gid = gid;
						}
					} catch (e) {
						console.error(e.message);
						// console.log(obj);
					}
				}
				
				this.sendCallback.call(this.transportObj, obj);
				// console.log(obj);
			}
			akp.prototype.close = function() {
				this.closeCallback.call();
			}

			akp.prototype.onHidden = function(callback, obj) {
				this.viewManager.bind("hidden", callback, obj);
			}, akp.prototype.onVisible = function(callback, obj) {
				this.viewManager.bind("visible", callback, obj);
			}
			akp.prototype.handleViewChange = function(state) {
				this.viewManager.trigger(state);

			}
			akp.prototype.visChange = function() {
				if (this.isHidden()) {
					this.isVisible = false;
					this.handleViewChange("hidden");
					// this.notifyOnHidden("you are invisible");
				} else {
					this.isVisible = true;
					this.handleViewChange("visible");
					this.resetTitle();

				}
			}
			akp.prototype.checkHidden = function() {
				var visProp = this.getHiddenProp(), _self = this;
				this.viewManager = new ViewManager({
					transporter : this
				});
				if (visProp) {
					var evtname = visProp.replace(/[H|h]idden/, '')
							+ 'visibilitychange';
					document.addEventListener(evtname, function() {
						_self.visChange();
					}, true);
				}
			}

			akp.prototype.isHidden = function() {
				var prop = this.getHiddenProp();
				if (!prop)
					return false;

				return document[prop];
			}

			akp.prototype.getHiddenProp = function() {
				var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

				// if 'hidden' is natively supported just return it
				if ('hidden' in document)
					return 'hidden';

				// otherwise loop over all the known prefixes until we find one
				for ( var i = 0; i < prefixes.length; i++) {
					if ((prefixes[i] + 'Hidden') in document)
						return prefixes[i] + 'Hidden';
				}

				// otherwise it's not supported
				return null;
			}

			/*
			 * Change Title of the document
			 */
			akp.prototype.notifyOnHidden = function(title) {
				if (!this.isVisible)
					this.changeTitle(title);
			}
			akp.prototype.changeTitle = function(title) {
				var self = this;
				appMasterView.notifyAudio();
				this.resetTitle();
				this.titleTimer = setInterval(function() {
					self.swapTitle(title);
				}, 500);
				// document.title=title;
			}
			akp.prototype.resetTitle = function() {
				clearInterval(this.titleTimer);
				this.swapTitle(this.appTitle);
			}
			akp.prototype.swapTitle = function(title) {
				if (document.title == this.appTitle) {
					document.title = title;
				} else
					document.title = this.appTitle;
			}

			akp.prototype.createUUID = function() {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
						function(c) {
							var r = Math.random() * 16 | 0, v = c == 'x' ? r
									: (r & 0x3 | 0x8);
							return v.toString(16);
						});
			}
			akp.prototype.get = function(file) {
				return Getter.getEntry(file);
			}
			akp.prototype.getMap = function(resp) {
				Getter.map(resp);
			}
			akp.prototype.getGID = function() {
				if (this.handlers.akpauth.cgd)
					return this.handlers.akpauth.cgd;
				else
					return false;
			}
			akp.prototype.setVaultDir = function(dir) {
				this.vaultdir = dir;
				this.handlers.vault.gohome(dir);
				// kons({mesgtype:"request",request:"getRelay"});
			}

			akp.prototype.postData = function(data) {
				this.handlers.vault.picUpdate(data);
			}
			akp.prototype.picUpdate = function(resp) {
				this.handlers.akpauth.handleMessage(resp);
			}

			akp.prototype.getActivedir = function() {
				return this.vaultdir;
			}
			akp.prototype.setVGroupDir = function(dir) {
				this.vaultGdir = dir;
				this.handlers.vault.setGHome(dir);
			}
			akp.prototype.LoadBookmarks = function(bookmarks) {
				this.handlers.vault.addBookmarks(bookmarks)
			}
			akp.prototype.setDstoreDir = function(dir) {
				this.dstoreDir = dir;
				try {
					if (dstore)
						dstore.setHome(dir);
				} catch (e) {

				}
			}
			akp.prototype.getIM = function(uid) {

				var msg = {
					mesgtype : "event",
					eventtype : "new_chat",
					userid : uid
				}
				this.handlers.rtc.send(msg)
			}
			akp.prototype.getMedia = function(uid, options) {
				var msg = {
					mesgtype : "event",
					eventtype : "new_media",
					userid : uid
				}
				if (options)
					msg.audio = options.audio;

				this.handlers.media.send(msg)
			}
			akp.prototype.sendPeer = function(msg) {
				return this.handlers.media.send(msg);
			}
			akp.prototype.konsDialog = function(settings) {
				var obj = {};
				obj.request = "konsDialog";
				obj.mesgtype = "request";
				obj.settings = settings;

				return this.handlers.kons(obj);
			}

			akp.prototype.getProfile = function(opts) {

				this.handlers.akpauth.profile.show(opts);

				/*
				 * this.appView.navView .changeView("dashboard",
				 * "userprofile_view");
				 */
				this.appView.showView("user");
			}
			akp.prototype.fileSelector = function(callback) {

				this.handlers.vault.showSelector(callback);
			}
			akp.prototype.FSDialog = function(els) {
				return this.handlers.vault.FSDialog(els)
			}
			akp.prototype.FilesViewer = function(els) {
				return this.handlers.vault.FVDialog(els)
			}

			akp.prototype.openFileBrowser = function(options) {
				this.handlers.vault.FileBrowser(options);
			}
			akp.prototype.send2Service = function(svcname, msg, sender) {
				if (svcname == "kons") {
					new this.handlers.kons(msg);
				} else if (svcname == "rtc") {
					// var msg=this.parseRtcReq(msg,sender);

					this.handlers.rtc.send(msg);
				}
			}

			akp.prototype.parseRtcReq = function(msg, sender) {
				if (msg.mesg_type == "request" && msg.request == "send_imsg") {
					delete msg.mesg_type;
					delete msg.request;
					msg.mesgtype = "event";
					msg.eventtype = "new_imsg";
					msg.imsg.sender = sender;
					return msg;
				}

			}
			akp.prototype.alert = function(msg, type) {
				noty({
					layout : 'bottomRight',
					theme : 'default',
					type : type || "alert",
					text : msg,
					timeout : 5000,
				});
			}

			// akp.prototype.vault=vault;
			// akp.prototype.calendar=planner;
			// akp.prototype.kons= new kons;
			akp.prototype.inProgress = function(code) {
				this.progressList(this.progressCodes[code]);
			}

			akp.prototype.handleMessage = function(e) {

				var recvd = e;

				if (!recvd)
					return;
				
				
				
				if (recvd.service) {

					var serv = $.trim(recvd.service);

					switch (serv) {
					case 'fmgr':
						this.handlers.vault.handleMessage(recvd);

						break;
						
					case 'tunneld' :
						//console.log(recvd);
						this.handlers.vault.handleMessage(recvd);

						break;
					/*case 'dstore':
						try {
							if (dstore)
								dstore.add(recvd);
						} catch (e) {

						}
						break;
						*/
					case 'kons':
						new this.handlers.kons(recvd);
						break;
					case "calendar":
						this.handlers.calendar.send(recvd);
						break;
					case 'rtc':
						this.handlers.rtc.send(recvd);
						break;
					case 'auth':
						this.handlers.akpauth.handleMessage(recvd);
						break;
					/*case "notes":
						if (notes)
							notes.handleMessage(recvd);
						break;
						*/
					case 'ngw':
						this.handleServiceStatus(recvd);
						break;

					default:
						logger("Service not recognised:");
						logger(recvd);
					}
				}

			}

			akp.prototype.handleServiceStatus = function(resp) {

				var status = {
					"service_up" : "up!",
					"service_down" : "down!"
				}

				var type = {
					"service_up" : "success",
					"service_down" : "error",
				}

				var names = {
					"fmgr" : "Vault",
					"dstore" : "Dstore",
					"kons" : "Konversations",
					"rtc" : "Communication",
					"auth" : "Authentication",
					"calendar" : "Planner"
				}

				var svcname = names[resp.service];

				if (!svcname)
					return;

				var stts = status[resp.eventtype]; // svcstatus
				// ? "up"
				// : "down";
				var stype = type[resp.eventtype]; // svcstatus
				// ?
				// "success" :
				// "error";
				/*
				 * noty({ layout : 'bottomRight', theme : 'default', type :
				 * stype, text : svcname + " service is " + stts, timeout : 5000
				 * });
				 */

				this.alert(svcname + " service " + stts, stype);

				// this.services[resp.service_name] = svcstatus;

			}

			akp.prototype.handleStatusUpdates = function(resp) {
				switch (resp.status) {
				case "notSupported":
					this.handlers.appController.noSupport();
					//console.log("no Websocket Support");
					break;
				case "opened":
					var self = this;
					//console.log("Connection established to the server");
					appMasterView = new self.handlers.views;

					akp.prototype.appView = appMasterView;
					this.handlers.akpauth.subscribe("loggedOut",
							akp_ws.appView.showLogin);
					this.handlers.appController.loaded();
					this.handlers.onready.call(this, this.appView);

					break;
				case "error":
					this.handlers.appController.notReachable();
					//console.log("Server throws Error.");
					break;
				case "closed":
					this.handlers.appController.notReachable();
					//console.log("Connection closed.");
					break;
				case "clientRegistered":

					/*
					 * if (!akpauth.loginstatus) {
					 * akpauth.loginuser(fbusername); openApp(); //appLoad(100,
					 * "logging in user..."); }
					 */
					
					akp_ws.config = resp.data; 

					break;
				case "svcupdate":
					try {
						akp_ws.handleServiceStatus(resp)
					} catch (e) {
						//console.log(e.message);
					}
					break;
				case "unreg_err":
					//console.log("service not registerd: " + resp.service);
					break;
				case "svc_err":
					noty({
						layout : 'bottomRight',
						theme : 'default',
						type : 'error',
						text : 'we are sorry, one of our services is down at this moment.',
						timeout : 5000
					});
					break;
				case "notResponding":
					this.handlers.appController.loaded();
					this.handlers.appController.notResponding();

					//console.log("server not responding");
					break;
				default:
					//console							.log("recieved an unknown message from socket handler");
				}
			}

			return akp;

		});