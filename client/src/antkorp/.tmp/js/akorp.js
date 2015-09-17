/*!
 * antkorp - Enterprise collaboration and communication Tool
 * Version 0.0  (2012-04-15)
 * http://www.antkorp.in
 *
 * Copyright@2012, www.antkorp.in
 * 
 */

requirejs.config({
	baseUrl : 'js/modules',
	waitSeconds : 200,
	shim : {

		underscore : {
			exports : "_"
		},
		backbone : {
			deps : [ 'underscore', 'jquery' ],
			exports : 'Backbone'
		},

	},
	paths : {
	    plugins : "../lib",   
        jquery : "../../assets/jquery/jquery.min",
        underscore : "../../assets/underscore/underscore-min",
        backbone : "../../assets/backbone/backbone-min",
        text : "../../assets/requirejs-text/text",
        
        bootstrap : "../lib/bootstrap.min",
        jcrop:'../../assets/jcrop/js',
        jqueryui : "../../assets/jquery-ui/ui/minified/jquery-ui.min",
        fullcalendar:'../../assets/fullcalendar/fullcalendar.min',
        'jquery.tagsinput':'../../assets/jquery.tagsinput/jquery.tagsinput',
        'jquery-tmpl':'../../assets/jquery-tmpl/jquery.tmpl.min',     

	},

});

require([ "require", "jquery", "underscore", "backbone", "akputils",
		"featureCheck" ], function(require, $, _, Backbone, utils, Controller) {

	$(function() {
		
		/*
		 * showing views on load complete.
		 */
		
		$("body").addClass("visible");

		var appController = new Controller, SCREEN_NAME;

		if (!appController.check()) // Features checking
			return;
		appController.loader();
		appController.logger();

		require([ "jquery", "underscore", "backbone", "socketModule",
				"akpMain", "akpauth", "akpkons", "akpvault", "akprtc",
				"akpmedia", "akpplanner", "akpTour", "appViews",
				"text!../templates.html", "wsGet", "plugins/jquery-ui",
				"plugins/noty_full", "bootstrap" ], function($, _, Backbone,
				socketModule, akp, akpauth, kons, vault, rtc, media, planner,
				tour, views, templates) {

			// var appViews = new views;

			var appViews, URLQuery;

			var serviceCallbacks = {
				vault : vault,
				kons : kons,
				rtc : rtc,
				media : media,
				calendar : planner,
				akpauth : akpauth,
				appController : appController,
				views : views,
				onready : appInitialize,
			}

			window.akp_ws = new akp(serviceCallbacks);
			var socket = new socketModule;
			socket.init(akp_ws.handleStatusUpdates, akp_ws.handleMessage,
					akp_ws);
			socket.register([ "fmgr", "dstore", "auth", "rtc", "kons",
					"calendar" ]);

			akp_ws.init({
				sendCallback : socket.send,
				closeCallback : socket.close,
				transportObj : socket
			});

			function appInitialize(views) {
				appViews = views;
				/*
				 * checking view loading
				 */
				URLQuery = appController.checkURL(); // search string query

				// var auth=require("akpauth");

				if (URLQuery) {
					validateQuery(URLQuery);
					akpauth.URLQuery = URLQuery;

				} else {
					// check cookies
					SCREEN_NAME = "prompt";
					appViews.showView(SCREEN_NAME);

				}
			}

			function validateQuery(URLQuery) {
				// console.log(URLQuery);
				if (URLQuery.c == "fu") {
					// first User and admin
					var uname = URLQuery.email.substring(0, URLQuery.email
							.lastIndexOf('@'));
					var username = uname + URLQuery.sid

					getDetailsByEmail(URLQuery)
				} else if (URLQuery.c == "iu") {

					// Invited user
				} else {
					SCREEN_NAME = "prompt";
					appViews.showView(SCREEN_NAME);
				}
			}

			function getDetailsByEmail(URLQuery) {
				$.ajax({
					url : "php/applogin.php",
					type : "post",
					data : {
						userProfile : JSON.stringify({
							id : URLQuery.sid,
							email : URLQuery.email,
							mesgtype : "checkEmail",
						})
					},
					success : handleDBResponse,

					error : function(jqXHR, textStatus, errorThrown) {

						console.log("The following error occured: "
								+ textStatus);
						console.log(errorThrown);
					},
					complete : function() {
						// console.log("user authentication
						// successful.")
					}
				});
			}

			function handleDBResponse(response, textStatus, jqXHR) {
				var resp;

				resp = JSON.parse(response);

				// you should get here clear responses to navigate
				console.log(resp);
				if (!resp.message) {

					// auth.adduser(username, uname);
					// User not registerd to database
					console.log("user record missing.");

				} else {
					checkAndUpdateUserEntries(resp);

					// if (!auth.loginstate) {

					// auth.loginuser(username);

					// }
				}
			}

			function checkAndUpdateUserEntries(_user) {
				akpauth.baseUser = _user.message;
				var user = _user.message;
				if (!user['confirmed']) {
					UpdateUserConfirmed(URLQuery);
					//appViews.wizardView.bind("orgCreated",UpdateUserOrganized,this);
					//appViews.wizardView.bind("adminRegistered",UpdateUserRegistered,this);
					SCREEN_NAME = "3stepwizard";
				} else if(!user['organization']){
					//appViews.wizardView.bind("orgCreated",UpdateUserOrganized,this);
					//appViews.wizardView.bind("adminRegistered",UpdateUserRegistered,this);
					SCREEN_NAME = "3stepwizard";
				}else if (!user['registered']) {
					//appViews.wizardView.bind("adminRegistered",UpdateUserRegistered,this);
					SCREEN_NAME = "3stepwizard";
				} else {
					SCREEN_NAME = "login";
				}

				appViews.showView(SCREEN_NAME);
			}

			function UpdateUserConfirmed(URLQuery) {
				$.ajax({
					url : "php/applogin.php",
					type : "post",
					data : {
						userProfile : JSON.stringify({
							id : URLQuery.sid,
							email : URLQuery.email,
							mesgtype : "UpdateConfirm"
						})
					},
					success : handleUpdateResponses,

					error : function(jqXHR, textStatus, errorThrown) {

						console.log("The following error occured: "
								+ textStatus, errorThrown);
					},
					complete : function() {
						// console.log("user authentication
						// successful.")
					}
				});
			}
			function UpdateUserOrganized() {
				$.ajax({
					url : "php/applogin.php",
					type : "post",
					data : {
						userProfile : JSON.stringify({
							id : URLQuery.sid,
							email : URLQuery.email,
							mesgtype : "UpdateRegistered"
						}),
					},
					success : handleUpdateResponses,

					error : function(jqXHR, textStatus, errorThrown) {

						console.log("The following error occured: "
								+ textStatus, errorThrown);
					},
					complete : function() {
						// console.log("user authentication
						// successful.")
					}
				});
			}

			function UpdateUserRegistered(URLQuery) {
				$.ajax({
					url : "php/applogin.php",
					type : "post",
					data : {
						userProfile : JSON.stringify({
							id : URLQuery.sid,
							email : URLQuery.email,
							mesgtype : "UpdateRegistered"
						}),
					},
					success : handleUpdateResponses,

					error : function(jqXHR, textStatus, errorThrown) {

						console.log("The following error occured: "
								+ textStatus, errorThrown);
					},
					complete : function() {
						// console.log("user authentication
						// successful.")
					}
				});
			}

			function handleUpdateResponses(response) {
				var resp = JSON.parse(response);
				console.log(resp);
			}

			/*
			 * Search analysis
			 */

			var routeMap = Backbone.Model.extend({

				defaults : {},
				initialize : function() {
					// window.addEventListener('popstate',this.routeParse);
					//this.routeParse();
				},
				record : function(data) {

				},
				routeParse : function(event) {
					var location = window.location;
					var hash = this.getTab(window.location.hash);
					var data = this.str2Data(window.location.search);
					// var data=event.state;
					if (data) {
						if (hash == "kons" && data.konvid) { // query for
							// kons object
							// load
							data["mesgtype"] = "request";
							data["request"] = "queryLoad";
							kons(data);
						} else { // load default recent stream if no kons
							// query present
							var konsdata = {};
							konsdata["mesgtype"] = "request";
							konsdata["request"] = "getRelay";
							kons(konsdata);
						}
					} else {
						// if no search query present

						var konsdata = {};
						konsdata["mesgtype"] = "request";
						konsdata["request"] = "getRelay";
						kons(konsdata);
					}

				},
				getTab : function(hash) {
					return hash.substr(1, hash.length);
				},
				str2Data : function(str) {
					if (!str)
						return;

					var queries = str.substr(1, str.length).split("&");
					var data = {};
					for ( var i = 0; i < queries.length; i++) {
						var attr = queries[i];
						var property = attr.split("=")[0];
						var value = attr.split("=")[1];
						data[property] = value;
					}
					return data;

				}
			});

			akpauth.subscribe("loadComplete", function() {
				var controller = new routeMap();

			});

			// integrator.addProviders(["facebook"])

		}); // End of App logic
	});// End of DOM Loading
});// End of Main

/**
 * @author Rajuk
 */

define(
		"akputils",
		[ "jquery" ],
		function($) {

			var timeZonesList = {
				"-5:30" : "[GMT+05:30] India Standard Time - Kolkata"
			}

			var utils = function() {
				this._data = {};
				this.get = function(prop) {
					if (prop)
						return this._data[prop];
				};
				this.set = function(prop, val) {
					this._data[prop] = val;
				}
			}
			utils.prototype.inBox = function(el, points, container) {

				var cw = $(container).width();
				var ch = $(container).height();
				var cp = $(container).position();

				var ew = $(el).width();
				var eh = $(el).height();

				var at = points.top, al = points.left;

				if (ch + cp.top < eh + points.top) {
					at = points.top - eh;
				}

				if (cw + cp.left < ew + points.left) {
					al = points.left - ew;
				}

				$(el).css({
					top : at,
					left : al
				})
			}
			utils.prototype.linkify = function(text) {
				var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
				return text.replace(urlRegex, function(url) {
					return '<a href="' + url + '" target="_blank">' + url + '</a>';
				})
			}
			
			
			utils.prototype.isURL = function(str) {
				var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain
				// name
				'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
				'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
				
				if (!pattern.test(str)) {
					return false;
				} else {
					return true;
				}
			}
			utils.prototype.youtubeURL = function(url) {
				var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
				return (url.match(p)) ? RegExp.$1 : false;
			}
			utils.prototype.makeCenter = function(id) {
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

			utils.prototype.mime2class = function(a) {
				var b = "akorp-mime-";
				var newmime = b + a.replace(/(\.|\+|\/)/g, "-");
				return a = a.split("/"), b
						+ a[0]
						+ (a[0] != "image" && a[1] ? " " + b
								+ a[1].replace(/(\.|\+)/g, "-") + " " + b
								+ a[0] + "-" + a[1].replace(/(\.|\+\-)/g, "")
								: "");

			}
			utils.prototype.convBytes = function(bytes, precision) {
				var kilobyte = 1024;
				var megabyte = kilobyte * 1024;
				var gigabyte = megabyte * 1024;
				var terabyte = gigabyte * 1024;

				if ((bytes >= 0) && (bytes < kilobyte)) {
					return bytes + ' B';

				} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
					return (bytes / kilobyte).toFixed(precision) + ' KB';

				} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
					return (bytes / megabyte).toFixed(precision) + ' MB';

				} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
					return (bytes / gigabyte).toFixed(precision) + ' GB';

				} else if (bytes >= terabyte) {
					return (bytes / terabyte).toFixed(precision) + ' TB';

				} else {
					return bytes + ' B';
				}
			}
			utils.prototype.min2hours = function(mins) {
				var hrs = Math.round(mins / 60);
				var rem = Math.abs(mins % 60);

				var str = new String();
				str = hrs + ":" + rem
				return timeZonesList[str];
			}
			utils.prototype.htmlEscape = function(str) {
				return String(str).replace(/&/g, '&amp;').replace(/"/g,
						'&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
						.replace(/>/g, '&gt;');
			}

			utils.prototype.htmlUnescape = function(value) {
				return String(value).replace(/&quot;/g, '"').replace(/&#39;/g,
						"'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
						.replace(/&amp;/g, '&');
			}
			utils.prototype.array2string = function(array) {
				var str = "";

				var length = array.length;
				if (!length)
					return str;

				for ( var i = 0; i < length; i++) {
					str += array[i] + ",";
				}

				return str;
			}
			utils.prototype.str2Data = function(str) {
				if (!str)
					return;

				var queries = str.substr(1, str.length).split("&");
				var data = {};
				for ( var i = 0; i < queries.length; i++) {
					var attr = queries[i];
					var property = attr.split("=")[0];
					var value = attr.split("=")[1];
					data[property] = value;
				}
				return data;

			}
			utils.prototype.SHA1 = function(msg) {

				function rotl(n, s) {
					return n << s | n >>> 32 - s;
				}
				;
				function tohex(i) {
					for ( var h = "", s = 28;; s -= 4) {
						h += (i >>> s & 0xf).toString(16);
						if (!s)
							return h;
					}
				}
				;
				var H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0, M = 0x0ffffffff;
				var i, t, W = new Array(80), ml = msg.length, wa = new Array();
				msg += fcc(0x80);
				while (msg.length % 4)
					msg += fcc(0);
				for (i = 0; i < msg.length; i += 4)
					wa.push(msg.cca(i) << 24 | msg.cca(i + 1) << 16
							| msg.cca(i + 2) << 8 | msg.cca(i + 3));
				while (wa.length % 16 != 14)
					wa.push(0);
				wa.push(ml >>> 29), wa.push((ml << 3) & M);
				for ( var bo = 0; bo < wa.length; bo += 16) {
					for (i = 0; i < 16; i++)
						W[i] = wa[bo + i];
					for (i = 16; i <= 79; i++)
						W[i] = rotl(
								W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
					var A = H0, B = H1, C = H2, D = H3, E = H4;
					for (i = 0; i <= 19; i++)
								t = (rotl(A, 5) + (B & C | ~B & D) + E + W[i] + 0x5A827999)
										& M, E = D, D = C, C = rotl(B, 30),
								B = A, A = t;
					for (i = 20; i <= 39; i++)
						t = (rotl(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1)
								& M, E = D, D = C, C = rotl(B, 30), B = A,
								A = t;
					for (i = 40; i <= 59; i++)
								t = (rotl(A, 5) + (B & C | B & D | C & D) + E
										+ W[i] + 0x8F1BBCDC)
										& M, E = D, D = C, C = rotl(B, 30),
								B = A, A = t;
					for (i = 60; i <= 79; i++)
						t = (rotl(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6)
								& M, E = D, D = C, C = rotl(B, 30), B = A,
								A = t;
					H0 = H0 + A & M;
					H1 = H1 + B & M;
					H2 = H2 + C & M;
					H3 = H3 + D & M;
					H4 = H4 + E & M;
				}
				return tohex(H0) + tohex(H1) + tohex(H2) + tohex(H3)
						+ tohex(H4);

			}

			return new utils;

		});

define(
		"featureCheck",
		[ "jquery", "underscore", "backbone", "akputils" ],
		function($, _, Backbone, utils) {

			var Controller = Backbone.View
					.extend({
						initialize : function() {
							$('<div/>').addClass("overlay").attr("id","logOverlay").appendTo('body');
							$(".akorp-ui").hide();
							this.mask = $("#logOverlay");
							window.MediaSource = window.MediaSource|| window.WebKitMediaSource;
							this.appload = $('#loadbar');
							this.loading=false;
						},
						baseCss : {
							"font-size" : "24px",
							"color" : "red",
							"margin" : "20px",
							"line-height" : "30px",
						},
						check : function() {
							/*
							 * Check1: checking browser
							 */
							var isChrome = /chrom(e|ium)/
									.test(navigator.userAgent.toLowerCase());
							if (!isChrome) {
								this.venderError();
								return false;

							}

							/*
							 * Check2: Checking for websocket support.
							 */

							else if (!"WebSocket" in window) {
								this.noSupport();
								return false;
							}

							return true;
						},
						statusMsgs : {
							"wait" : "<p>Please wait, we are getting your identity..</p>",
							"unreachable" : "<p>Sorry! antkorp is unreachable at the moment,<br> please try after some time.</p>",
							"noSupport" : "<span class='icon-html5' style='display:inline-block; font-size:50px; '><p>Oops! your browser doesn't compatible with the application, <br>please upgrade your browser to try our demo.</p>",
							"venderError" : "<span class='icon-chrome' style='display:inline-block; font-size:50px; '></span><p>Sorry! We only support Google Chrome.<br> Get Chrome and try our Demo.</p>",
							"noResponse" : "<p>Sorry! antkorp is not Responding at the moment,<br> please try after some time.</p>",
						},
						show : function(text) {
							$(".errDailog").remove();
							var msg = $("<div/>").attr("id", "browserFailMsg")
									.addClass("modal errDailog").appendTo(
											"body").append(text);
							this.mask.show();
							this.adjust("#" + msg.attr("id"));
						},
						unautherized : function() {

						},
						verifying : function() {

							var msg = $(this.statusMsgs["wait"]).css({
								"font-size" : "24px",
								"color" : "blue",
								"margin" : "20px",
								"line-height" : "30px",
							});
							;
							this.show(msg)

						},
						
						notReachable : function() {
							if(this.loading) this.loaded();
							var msg = $(this.statusMsgs["unreachable"]).css(
									this.baseCss);

							this.show(msg);

						},
						noSupport : function() {
							if(this.loading) this.loaded();
							
							var msg = $(this.statusMsgs["noSupport"]).addClass("akorp-error-msg");
							this.show(msg);

						},
						notResponding : function() {
							var msg = $(this.statusMsgs["noResponse"]).css(
									this.baseCss);
							this.show(msg);
						},
						venderError : function() {
							if(this.loading) this.loaded();
							
							var msg = $(this.statusMsgs["venderError"])
									.addClass("akorp-error-msg");
							this.show(msg);

						},
						success : function() {

						},
						adjust : function(id) {
							$(id).css("max-width", "80%");

							var w = $(id).width();
							var h = $(id).height();

							var nw = -w / 2;
							var nh = -h / 2;

							$(id).css({
								"top" : "20%",
								"left" : "50%",
								"margin-left" : nw + "px",
							// "margin-top" : nh + "px"
							});
						},
						showLoader : function() {
							this.appload.show();

							utils.makeCenter("#loadbar");
							this.loading=true;
						},
						loader : function() {

							window.loadComplete = 0;
							var _self = this;
							if(!this.loading)this.showLoader();
							
							window.loader = function(percentage, apploadstatus) {
								loadComplete += percentage;

								/*
								 * appload.children(".apploadbar").children(".loadpercentage")
								 * .css({ //"width" : loadComplete + "%" })
								 */

								_self.appload.children(".apploadstatus").html(apploadstatus);
								
								//this.logger(loadComplete + " " + apploadstatus);
								if (loadComplete == 100) {

									//_self.appload.hide();
									_self.changeLoadStatus("Connecting to the server...")

								}

							}
						},
						changeLoadStatus:function(status){
							this.appload.children(".apploadstatus").html(status)
						},
						loaded:function(){
							this.appload.hide();
							this.loading=false;
						},
						logger : function() {

							window.logger = function(msg) {
								this.canLog = false;
								if (canLog) {
									console.log(msg);
								}
							}

						},
						checkURL : function() {
							return utils.str2Data(window.location.search);
						}

					});
			return Controller;
		});
define(
		"akpMain",
		[ "jquery", "underscore", "backbone", "akputils",
				"text!../templates.html" ],
		function($, _, Backbone, utils, templates) {

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
									service : "fmgr",
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
				if (options.transportObj) {
					this.transportObj = options.transportObj;
				}
				if (options.sendCallback) {
					this.sendCallback = options.sendCallback;
				}
				if (options.closeCallback) {
					this.closeCallback = options.closeCallback;
				}

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
						if (obj.mesgtype == "request"
								|| obj.mesgtype == "response"
								|| obj.mesgtype == "ack"
								|| obj.mesgtype == "cancel") {
							var gid = this.getGID();

							if (gid)
								obj.gid = gid;
						}
					} catch (e) {
						console.log(e.message);
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
						// vault.add(recvd);
						this.handlers.vault.handleMessage(recvd);

						break;
					case 'dstore':
						try {
							if (dstore)
								dstore.add(recvd);
						} catch (e) {

						}
						break;
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
					case "notes":
						if (notes)
							notes.handleMessage(recvd);
						break;
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
					"service_up" : "up",
					"service_down" : "down"
				}

				var type = {
					"service_up" : "success",
					"service_down" : "error"
				}

				var names = {
					"fmgr" : "Vault",
					"dstore" : "Dstore",
					"kons" : "Konversations",
					"rtc" : "Communication",
					"auth" : "Authentication",
					"calendar" : "Planner"
				}

				var svcname = names[resp.service_name];

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

				this.alert(svcname + " service is " + stts, stype);

				// this.services[resp.service_name] = svcstatus;

			}

			akp.prototype.handleStatusUpdates = function(resp) {
				switch (resp.status) {
				case "notSupported":
					this.handlers.appController.noSupport();
					console.log("no Websocket Support");
					break;
				case "opened":
					var self = this;
					console.log("Connection established to the server");
					appMasterView = new self.handlers.views;

					akp.prototype.appView = appMasterView;
					this.handlers.akpauth.subscribe("loggedOut",
							akp_ws.appView.showLogin);
					this.handlers.appController.loaded();
					this.handlers.onready.call(this, this.appView);

					break;
				case "error":
					this.handlers.appController.notReachable();
					console.log("Server throws Error.");
					break;
				case "closed":
					this.handlers.appController.notReachable();
					console.log("Connection closed.");
					break;
				case "clientRegistered":

					/*
					 * if (!akpauth.loginstatus) {
					 * akpauth.loginuser(fbusername); openApp(); //appLoad(100,
					 * "logging in user..."); }
					 */

					break;
				case "svcupdate":
					try {
						akp_ws.handleServiceStatus(resp)
					} catch (e) {
						console.log(e.message);
					}
					break;
				case "unreg_err":
					console.log("service not registerd: " + resp.service);
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

					console.log("server not responding");
					break;
				default:
					console
							.log("recieved an unknown message from socket handler");
				}
			}

			return akp;

		});
define(
		"akpauth",
		[ "jquery", "underscore", "backbone", "akpcontacts", "akpGroups",
				"picUpdater", "akpprofiles", "akputils", "plugins/jquery-ui",
				"plugins/jquery-tmpl" ],
		function($, _, Backbone, contacts, groups, picChangeView, ProfileView,
				utils) {
			// console.log("akpauth.js loaded");

			loader(20, "Authentication initializing");
			var alt_image_small = "css/images/user32.png";
			/*
			 * Handle subscriptions
			 */

			var organization = Backbone.Model.extend({
				initialize : function(opts) {
					this.auth = opts.auth;
				},
				isAdmin : function() {
					return this.get("admin") == this.auth.loginuserid;
				},
				setInfo : function(info) {
					this.set(info);
					this.trigger("initialized", this.toJSON());
				}

			});

			var authHandlers = Backbone.View.extend({
				initialize : function() {

				},
				render : function() {

				}
			});

			var auth = function() {

				this.baseUser = {};
				this.org = null;
				this.organization = new organization({
					auth : this
				});

				this.groups = groups;
				this.contacts = contacts;

				this.URLQuery = {};

				this.maptable = {}; // is to map requests sent to server
				this.mapCallbacks = {};

				/*
				 * handle notification requests on responses
				 */
				this.notifTable = {};
				this.mapnotifier = {};

				/*
				 * handle serivices user invitations and requests etc..
				 */
				this.reqTable = {};
				this.maprequests = {};
				this.notificationStreams = {};

				this.awayTimer; // timer to set user away from viewing

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
					"authenticated" : [],
					"loadComplete" : [],
					"loggedout" : [],
				}

				/*
				 * subscription settings
				 */
				this.bbsub = new authHandlers;

				this.groups.bind("groupChange", this.setGroup, this);
				this.groups.bind("leaveGroup", this.groupLeave, this);
				this.groups.bind("deleteGroup", this.removeGroup, this);

				this.contacts.bind("approveUser", this.groupApprove, this);
				this.contacts.bind("declineUser", this.groupDecline, this);

				this.render();

			}
			auth.prototype.render = function() {
				var main = this;
				var data = {
					obj : main
				};

				$(".stts_msg").bind('click', data, main.showStatusOptions);

				$("#status_opts li:not(.status_custom)").bind("click", data,
						main.activeUserStatusChange);
				$("#status_opts li.status_custom").bind("click", data,
						main.statusMsgChange);

			}

			/*
			 * ===========================================================
			 * status line update
			 * ==========================================================
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
								$(this).parent().dialog("close").remove();
							}
						}).attr("value", self.activeuser.status_line);

				$("<div/>").append(input).dialog({
					title : "Status message",
					modal : true,
					open : this.dialogOpen,
					buttons : [ {
						text : "Ok",
						"class" : "btn btn-primary",
						"click" : function() {
							var msg = $(this).children("input").val();
							if (!msg)
								return;

							self.statusMsgUpdate(msg);
							$(this).dialog("close").remove();
						}
					}, {
						text : "Cancel",
						"class" : "btn btn-danger",
						"click" : function() {
							$(this).dialog("close").remove();
						}
					} ]
				});
			}

			auth.prototype.dialogOpen = function() {
				var $dialog = $(this);

				// $dialog.closest(".ui-dialog").find(".ui-dialog-titlebar").remove();

				$dialog.closest(".ui-dialog").removeClass("ui-corner-all");
				// get the last overlay in the dom
				$dialogOverlay = $(".ui-widget-overlay").last();
				// remove any event handler bound to it.
				$dialogOverlay.unbind();
				$dialogOverlay.click(function() {
					// close the dialog whenever the overlay is clicked.
					// if($dialog.attr("data-loaded") == "true")
					$dialog.dialog("close");
				});
			}
			auth.prototype.updateStatusMsg = function(msg) {
				$(".status_opt.status_custom")
						.html(msg)
						.append(
								'<span class="edit-icon icon-pencil akp-close-icon"></span>');
				this.activeuser.status_line = msg;
			}
			auth.prototype.statusMsgUpdate = function(msg) {
				var unique = akp_ws.createUUID();
				var obj = {
					mesgtype : "request",
					request : "set_status_line",
					service : "auth",
					cookie : unique,
					status_line : msg,
					uid : this.loginuserid,
				}
				akp_ws.send(obj);
				this.updateStatusMsg(msg);

			}

			/*
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

					_self.changeUserStatus("away");

				}, 3 * 1000 * 60)
			}

			auth.prototype.handleUserAlive = function() {
				clearTimeout(this.awayTimer);
				this.changeUserStatus("available")
			}

			auth.prototype.changeUserStatus = function(status) {
				var self = this;
				if (status == self.activeuser.status)
					return;

				self.sendUserStatus(self, status);
				$(".stts_msg").attr("data-stts", status);
			}
			auth.prototype.activeUserStatusChange = function(e) {
				var self = e.data.obj;
				var stts = $(this).data("opt");
				$(".stts_msg").attr("data-stts", stts);
				self.sendUserStatus(self, stts);

			}

			auth.prototype.showStatusOptions = function(e) {
				e.stopPropagation();
				var stts = $(this).attr("data-stts");
				$("#status_opts li").removeClass("current_status active");
				$("#status_opts li[data-opt='" + stts + "']").addClass(
						"current_status active");

				$("#status_opts").slideDown();
				// .show().css("display","block");
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
			/*
			 * User status Requests handling
			 */

			auth.prototype.sendUserStatus = function(main, stts) {
				var self = main;
				var obj = {
					service : "auth",
					"mesgtype" : "event",
					eventtype : "status_update",
					user : self.loginuserid,
					status : stts
				}
				akp_ws.send(obj);

				self.activeuser.status = stts;
			}

			/*
			 * User handling
			 */

			auth.prototype.adduser = function(uname, fname, pswd, callback) {
				// send the request to add user.
				// after success of the add user u need to send get request.

				var unique = akp_ws.createUUID();
				var adduser_obj = {
					mesgtype : "request",
					service : "auth",
					request : "adduser",
					cookie : unique,
					oid : this.org.name,
					uname : uname || this.baseUser.username,
					first_name : fname,
					password : pswd,
				}
				akp_ws.send(adduser_obj);
				this.maptable[unique] = "adduser";
				this.mapCallbacks[adduser_obj.cookie] = callback;
				// timeOutList[unique] = setTimeout(timeOut, 30 * 1000, unique);

			}
			auth.prototype.deleteUser = function(userid, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "removeuser",
					cookie : unique,
					oid : this.org.name,
					uid : userid
				}
				akp_ws.send(req_obj);
				this.maptable[unique] = "adduser";
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.loginuser = function(username, pswd, callback) {
				if (this.loginstatus) {
					console
							.log("user already logged in, you are trying to issue login request another time.")
					return false;
				}

				var guid = akp_ws.createUUID();
				var loginuser_obj = {
					mesgtype : "request",
					request : "login",
					service : "auth",
					uname : username,
					password : pswd,
					cookie : guid,

				}
				console.log("login request sent. waiting for Response....");
				akp_ws.send(loginuser_obj);

				this.maptable[loginuser_obj.cookie] = 'activeuser';
				this.mapCallbacks[loginuser_obj.cookie] = callback;

				return true; // request sent successfully.
			}

			auth.prototype.logoutuser = function(callback) {
				var guid = akp_ws.createUUID();
				var req_obj = {

					mesgtype : "request",
					request : "logout",
					service : "auth",
					uid : this.loginuserid,
					cookie : guid,
				}
				if (!this.loginstatus)
					return;

				akp_ws.send(req_obj, true);
				this.maptable[req_obj.cookie] = 'logout';
				this.mapCallbacks[req_obj.cookie] = callback;
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

					mesgtype : "request",
					service : "auth",
					request : "setuser",
					cookie : unique,
					uid : this.loginuserid,
					user : userObj,

				}

				akp_ws.send(setUser_obj, true);
				this.maptable[unique] = "setuser";
				this.mapCallbacks[unique] = callback;
				// timeOutList[unique] = setTimeout(timeOut, 30 * 1000, unique);

			}

			auth.prototype.getuser = function(userId, callback) {
				var unique = akp_ws.createUUID();
				var getuser_obj = {

					mesgtype : "request",
					service : "auth",
					request : "getuser",
					cookie : unique,
					uid : userId,
				}
				akp_ws.send(getuser_obj, true);

				this.maptable[unique] = "getuser";
				this.mapCallbacks[getuser_obj.cookie] = callback;

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

					mesgtype : "request",
					service : "auth",
					request : "change_password",
					cookie : unique,
					uid : uid || this.loginuserid,
					new_password : newPswd,
					old_password : oldPswd,

				}

				akp_ws.send(req_obj, true);
				this.maptable[unique] = "changePswd";
				this.mapCallbacks[unique] = callback;
			}

			/*
			 * ==========================================================================
			 * Group handling
			 * =========================================================================
			 */
			auth.prototype.getgroup = function(grpid, callback) {

				var unique = akp_ws.createUUID();
				var getgrp_obj = {
					mesgtype : "request",
					service : "auth",
					request : "getgroup",
					cookie : unique,
					uid : this.loginuserid,
					gid : grpid,
				};

				akp_ws.send(getgrp_obj, true);
				this.maptable[getgrp_obj.cookie] = 'getgroup';
				this.mapCallbacks[getgrp_obj.cookie] = callback;
				// console.log("Group request sent, waiting for response...")

			}
			auth.prototype.addGroup = function(name, approval, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "addgroup",
					cookie : unique,
					gname : name,
					oid : this.org.name,
					uid : this.loginuserid,
					join_by_approval : approval,
				};

				akp_ws.send(req_obj);
				this.maptable[req_obj.cookie] = 'addGroup';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.removeGroup = function(id, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "delgroup",
					cookie : unique,
					uid : this.loginuserid,
					gid : id,
				};

				akp_ws.send(req_obj);
				this.maptable[req_obj.cookie] = 'removeGroup';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.updateGroup = function(group, callback) {
				var unique = akp_ws.createUUID();
				var getgrp_obj = {
					mesgtype : "request",
					service : "auth",
					request : "setgroup",
					cookie : unique,
					gid : group.gid,
					group : group,
					uid : this.loginuserid,
				};

				akp_ws.send(getgrp_obj);
				this.maptable[getgrp_obj.cookie] = 'updateGroup';
				this.mapCallbacks[getgrp_obj.cookie] = callback;
			}

			auth.prototype.groupJoin = function(groupId, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "add_member",
					cookie : unique,
					gid : groupId,
					oid : this.org.name,
					uid : this.loginuserid,

				};

				akp_ws.send(req_obj, true);
				this.maptable[req_obj.cookie] = 'groupJoin';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.groupLeave = function(groupId, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "rem_member",
					cookie : unique,
					gid : groupId,
					oid : this.org.name,
					uid : this.loginuserid,
				};

				akp_ws.send(req_obj, true);
				this.maptable[req_obj.cookie] = 'groupLeave';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.groupApprove = function(userid, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "approve_user",
					cookie : unique,
					gid : this.cgd,
					oid : this.org.name,
					uid : this.loginuserid,
					user : userid,
				};

				akp_ws.send(req_obj, true);
				this.maptable[req_obj.cookie] = 'groupApprove';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.groupDecline = function(userid, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "disapprove_user",
					cookie : unique,
					gid : this.cgd,
					oid : this.org.name,
					uid : this.loginuserid,
					user : userid,
					reason : "",
				};

				akp_ws.send(req_obj, true);
				this.maptable[req_obj.cookie] = 'groupDecline';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			/*
			 * ===================================================================================
			 * organisation Handing
			 * ===================================================================================
			 */
			auth.prototype.createOrg = function(name, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "create_org",
					cookie : unique,
					org : name,
					email : this.URLQuery.email,
				};

				akp_ws.send(req_obj);
				console.log(req_obj);
				this.maptable[req_obj.cookie] = 'createOrg';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.removeOrg = function(id, callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "removeorg",
					cookie : unique,
					uid : this.loginuserid,
				};

				akp_ws.send(req_obj);
				this.maptable[req_obj.cookie] = 'removeOrg';
				this.mapCallbacks[req_obj.cookie] = callback;
			}
			auth.prototype.getOrg = function(callback) {
				var unique = akp_ws.createUUID();
				var req_obj = {
					mesgtype : "request",
					service : "auth",
					request : "get_org",
					cookie : unique,
					uid : this.loginuserid,
					oid : this.activeuser.organization,
				};

				akp_ws.send(req_obj);
				this.maptable[req_obj.cookie] = 'getOrg';
				this.mapCallbacks[req_obj.cookie] = callback;
			}

			auth.prototype.orgInvite = function(obj, success, error) {
				$.ajax({
					url : "php/appInvite.php",
					type : "post",
					data : {
						userProfile : JSON.stringify(obj),
					},
					success : success,

					error : error
					/*
					 * function(jqXHR, textStatus, errorThrown) {
					 * 
					 * console.log("The following error occured: " + textStatus,
					 * errorThrown); }
					 */,

				});
			}

			/*
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
					service : "auth",
					mesgtype : "request",
					request : "relay_pending_requests",
					category : orgy,
					cookie : unique,
					uid : this.loginuserid,
					gid : this.cgd,
				}

				if (typeof marker == "string")
					obj.marker = marker;

				akp_ws.send(obj);

				this.maptable[obj.cookie] = 'getrequests';
				this.reqTable[obj.cookie] = orgy;

				if (typeof marker == "object") {
					this.maprequests[obj.cookie] = marker;
				} else if (handler) {
					this.maprequests[obj.cookie] = handler;
				}
			}
			/*
			 * responses to request message
			 */
			auth.prototype.handleGetRequests = function(resp) {
				// console.log(resp);
				resp.service = this.notifTable[resp.cookie];
				resp.response = "relay_request";

				if (this.maprequests[resp.cookie])
					this.maprequests[resp.cookie]
							.attachRequest(resp.result.invite);

				akp_ws.handleMessage(resp);

			}

			/*
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
					mesgtype : "request",
					service : "auth",
					request : "relay_notification",
					cookie : unique,
					category : orgy,
					uid : this.loginuserid,
					gid : this.cgd,

				}
				if (typeof marker == "string" || typeof marker == "number")
					obj.marker = marker;

				akp_ws.send(obj);

				// console.log(obj);
				this.maptable[obj.cookie] = 'getnotifications';
				this.notifTable[obj.cookie] = orgy;

				if (typeof marker == "object") {
					this.mapnotifier[obj.cookie] = marker;
				} else if (handler) {
					this.mapnotifier[obj.cookie] = handler;
				}
			}

			// Request to get pending active notifications Count
			auth.prototype.getNotificationCount = function(orgy, handler) {
				var unique = akp_ws.createUUID();
				var obj = {
					mesgtype : "request",
					service : "auth",
					request : "get_notification_count",
					cookie : unique,
					category : orgy,
					uid : this.loginuserid,
					gid : this.cgd,
				}

				// console.log("notification count request sent to server with
				// category : "+ orgy);
				akp_ws.send(obj);
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
					service : "auth",
					mesgtype : "request",
					request : "mark_all_read",
					cookie : unique,
					uid : this.loginuserid,
					gid : this.cgd,
					category : orgy,

				}

				akp_ws.send(obj);
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
					mesgtype : "request",
					request : "check_notification",
					service : "auth",
					id : id,
					uid : this.loginuserid,
					gid : this.cgd,
					category : orgy
				}
				akp_ws.send(obj);
				this.maptable[obj.cookie] = 'checknotification';
				this.notifTable[obj.cookie] = orgy;

				if (handler) {
					this.mapnotifier[obj.cookie] = handler;
				}
			}

			// handle responses to the notification requests
			auth.prototype.handleNotifications = function(resp) {
				console.log(resp.result);
				resp.service = this.notifTable[resp.cookie];
				resp.response = "relay_notification";

				if (this.mapnotifier[resp.cookie])
					this.mapnotifier[resp.cookie]
							.attachNotification(resp.result);

				akp_ws.handleMessage(resp);

			}

			auth.prototype.handleNotifyCount = function(resp) {
				resp.service = this.notifTable[resp.cookie];
				resp.response = "notification_count";

				if (this.mapnotifier[resp.cookie])
					this.mapnotifier[resp.cookie].changeCount(resp.count);

				akp_ws.handleMessage(resp);
			}
			auth.prototype.handleNotifyCheckAll = function(resp) {
				resp.service = this.notifTable[resp.cookie];
				resp.response = "notification_check_all";

				if (this.mapnotifier[resp.cookie])
					this.mapnotifier[resp.cookie].checkoutAll(resp);

				akp_ws.handleMessage(resp);
			}
			auth.prototype.handleNotifyCheck = function(resp) {
				resp.service = this.notifTable[resp.cookie];
				resp.response = "notification_check";
				akp_ws.handleMessage(resp);

			}
			auth.prototype.routeNotification = function(notification) {
				try {
					this.notificationStreams[notification.category]
							.attachNotification(notification);
				} catch (e) {
					console.log(e.message);
				}
			}

			/*
			 * ====================================================== End of
			 * Notifications
			 * =====================================================
			 */

			/*
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ FMGR
			 * Bookmarks
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 */

			auth.prototype.addBookmark = function(bookmark) {
				var unique = akp_ws.createUUID();
				var obj = {
					uid : this.loginuserid,
					bookmark : bookmark,
					service : "auth",
					mesgtype : "request",
					request : "add_bookmark",
					cookie : unique
				}
				akp_ws.send(obj);
			}

			auth.prototype.removeBookmark = function(bookmark) {
				var unique = akp_ws.createUUID();
				var obj = {
					uid : this.loginuserid,
					bookmark : bookmark,
					service : "auth",
					mesgtype : "request",
					request : "delete_bookmark",
					cookie : unique
				}
				akp_ws.send(obj);
			}

			/*
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ End of
			 * Bookmarks Handlers
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 */

			auth.prototype.showProfile = function(user) {

				this.profile.show(user)

			}

			auth.prototype.viewChange = function(User) {
				var cuser = User;
				for ( var key in cuser) {
					if (cuser[key] == "undefined") {
						cuser[key] = "";
					}
					if (!cuser[key]) {
						cuser[key] = ""
					}
				}

			}
			auth.prototype.handleLogoutResponse = function(resp) {
				console.log(resp)
				if (resp.status == "success") {
					// this.trigger("loggedOut", resp);
					this.mapCallbacks[resp.cookie].call(this, resp);
				}
			}

			auth.prototype.updateUser = function(response, textStatus, jqXHR) {
				var resp = JSON.parse(response);
				console.log(resp.message.id);
			}
			auth.prototype.fberror = function(jqXHR, textStatus, errorThrown) {

				console.log(errorThrown);
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
			/*******************************************************************
			 * USER INITIALIZATION
			 * ********************************************************************
			 */

			auth.prototype.handleLoginResponse = function(svr_cmds) {
				if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
					this.mapCallbacks[svr_cmds.cookie].call(this, svr_cmds);

				if (svr_cmds.user) {
					console.log("user Logged in");
					this.loginstatus = true;

					if (this.logout)
						return;
					this.logout = true;
					
					this.handleTabSwitch();
					
					title = "notifications";
					this.usersList[svr_cmds.user.uid] = svr_cmds.user;
					this.activeuser = svr_cmds.user;
					this.loginuserid = this.activeuser.uid;
					// this.cgd=this.activeuser.gid;

					if (this.userFirstEntry) {
						// this.setuser(fbinfo);
						this.prflview = false;
						this.userFirstEntry = false;
					}

					if ((!this.org) || (this.org == null)) {
						this.getOrg(this.handleGroupsList);
					}

					this.handleGroupsList(svr_cmds.user);

					akp_ws.initModules(this.activeuser);
					// akp_ws.setVaultDir(svr_cmds.user.homedir);
					// akp_ws.LoadBookmarks(svr_cmds.user.bookmarks);

					$(".userModule").show();

					this.updateUserInfoViews(this.activeuser);
					this.profile.show({
						id : svr_cmds.user.uid,
						mode : "write"
					});
				} else if (svr_cmds.error) {
					console.log(svr_cmds.error);
				}

				// this.getgroup(this.activeuser.gid);
			}

			auth.prototype.updateUserInfoViews = function(user) {
				/*
				 * update the active user info in UI.
				 */

				var obj = {
					'username' : user.uname,
					'uid' : user.uid
				};

				$('#uname').html(user.first_name || "no name").data(obj);
				$(".active-name")
						.append(user.first_name + " " + user.last_name);

				$(".status_opt.status_custom")
						.html(user.status_line || "Custom..")
						.append(
								'<span class=" icon-pencil akp-close-icon edit-icon"></span>');

				$(".active-img img").attr("src",
						user.image_large || "css/images/user128.png");
				$('#activeuserimg').attr("src",
						user.image_small || "css/images/user32.png");
				$("#user-std-pic").attr("src",
						user.image_large || "css/images/user128.png");
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
				this.bbsub.trigger("groupInit", group);

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
						console.log("error get user :" + userid);
					}
				}
			}

			auth.prototype.handleAddUser = function(resp) {
				// console.log(resp);
				this.mapCallbacks[resp.cookie].call(this, resp);
				if (resp.status == "success") {

					// this.userFirstEntry = true;
					console.log(" User added successfully")
				} else {
					console.log(" user adding failed");
				}
			}

			auth.prototype.handleEvents = function(svr_cmds) {
				if (svr_cmds.eventtype == "new_user") {

					this.usersList[svr_cmds.user.uid] = svr_cmds.user;
					this.contacts.add(svr_cmds.user);

				} else if (svr_cmds.eventtype == "status_update") {

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
			auth.prototype.handleGroupJoin = function(resp) {
				if (typeof this.mapCallbacks[resp.cookie] === 'function')
					this.mapCallbacks[resp.cookie].call(this, resp);
			}
			auth.prototype.handleGroupApprove = function(resp) {
				if (typeof this.mapCallbacks[resp.cookie] === 'function')
					this.mapCallbacks[resp.cookie].call(this, resp);
			}

			auth.prototype.handleNewOrg = function(resp) {
				console.log(resp);
				if (!resp.error) {
					this.org = resp.org;
					this.organization.setInfo(resp.org);
					if (typeof this.mapCallbacks[resp.cookie] === 'function')
						this.mapCallbacks[resp.cookie].call(this, resp)
				} else {
					console.log("failed to create new org");
				}
			}

			auth.prototype.handleOrgInfo = function(resp) {
				console.log(resp);
				if (typeof this.mapCallbacks[resp.cookie] === 'function')
					this.mapCallbacks[resp.cookie].call(this, resp.org);

				if (!resp.error) {
					var userlist = resp.org.user_list;
					this.org = resp.org;
					this.organization.setInfo(resp.org);
					this.membersCount = userlist.length;
					this.getMembers(userlist);

				} else {
					console.log("failed to get Organization Information.");
				}
			}

			auth.prototype.handleGroupsList = function(obj) {
				var group_ids = obj.group_list || obj.groups;
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
				if (svr_cmds.mesgtype == "event") {
					this.handleEvents(svr_cmds);
				}

				else {

					switch (this.maptable[svr_cmds.cookie]) {
					case "activeuser":
						this.handleLoginResponse(svr_cmds);

						break;
					case 'getuser':

						if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
							this.mapCallbacks[svr_cmds.cookie].call(this,
									svr_cmds);

						if (svr_cmds.mesgtype == "response") {
							this.usersList[svr_cmds.user.uid] = svr_cmds.user;

							/*
							 * var usersLength = _.size(this.usersList); if
							 * (usersLength == this.membersCount &&
							 * this.isLoadFinish) { this.isLoadFinish = false; //
							 * akp_ws.setupModules(this.activeuser); //
							 * this.trigger("loadComplete", this.usersList); }
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

						if (svr_cmds.status == "success") {
							this.getuser(this.loginuserid,
									this.mapCallbacks[svr_cmds.cookie]);
						} else {
							console.log("Failed to update user information");
							if (typeof this.mapCallbacks[svr_cmds.cookie] === 'function')
								this.mapCallbacks[svr_cmds.cookie].call(this,
										svr_cmds);
						}
						break;

					case 'adduser':

						this.handleAddUser(svr_cmds);
						break;
					case "logout":
						this.handleLogoutResponse(svr_cmds);
						break;
					case "changePswd":
						this.handleCallback(svr_cmds);
						break;

					/*
					 * Group Request Responses
					 */

					case "getgroup":
						this.handleGroupObject(svr_cmds);
						break;
					case "addGroup":
						this.handleCreateGroup(svr_cmds);
						break;
					case "groupJoin":
						this.handleGroupJoin(svr_cmds);
						break;
					case "updateGroup":
					case "groupLeave":
					case "groupApprove":
					case "groupDecline":
					case "removeGroup":
						this.handleGroupApprove(svr_cmds);
						break;

					/*
					 * Org Request Responses
					 */
					case "createOrg":
						this.handleNewOrg(svr_cmds);
						break;
					case "getOrg":
						this.handleOrgInfo(svr_cmds);
						break;

					case "picUpload":
						changePic.post(svr_cmds);
						break;

					/*
					 * request responses
					 */

					case "getrequests":
						this.handleGetRequests(svr_cmds);
						break;

					/*
					 * notification requests
					 */
					case "getnotifications":
						this.handleNotifications(svr_cmds);
						break;
					case "getnotificationscount":
						this.handleNotifyCount(svr_cmds);
						break;
					case "checkallnotifications":
						this.handleNotifyCheckAll(svr_cmds);
						break;
					case "checknotification":
						this.handleNotifyCheck(svr_cmds);
						break;

					default:
						console.log("Request Timed out:");
						console.log(svr_cmds);
					}
				}
			}
			var akp_auth = new auth;

			/*
			 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 * Notifications Dialog
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 */

			var notification = Backbone.Model
					.extend({
						notifier : "",
						description : "",
						active : false,
						initialize:function(){
							this.bind("change",this.handleUpdates,this);
						},
						handleUpdates:function(model){
							var diff = model.changedAttributes();
							
							for ( var att in diff) {
								switch (att) {
								case 'active':
									//this.trigger("statusChange", user);
									break;
								
								default:
									this.trigger("updated");

								}
							}
						},
						check : function() {
							if (this.get("active")) {
								var ntfyid = this.get("id");
								akp_auth.checkNotification(this.get("service"),
										ntfyid, this);

								this.set({
									"active" : false
								});

								this.trigger("checked");
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
						maskDescription : function(baseStr) {
							if (!baseStr)
								return baseStr;

							var seperator = baseStr.lastIndexOf("@");
							if (seperator <= 0)
								return baseStr;

							var constStr = baseStr.substr(0, seperator);
							var datestr = baseStr.substr(seperator + 2,
									baseStr.length);
							var startdate = new Date(datestr);
							var time = akp_ws.calendar.date2String(startdate,
									"hh:mmtt dd/MM/yy");
							var mask = constStr + " @ " + time;

							return mask;
						},
						renderNotifiers : function(notification, name) {
							var keyuser = "";
							if (notification.notifiers.length > 1) {

								for ( var i = 0; i < notification.notifiers.length; i++) {

									if (notification.notifiers[i] == akp_auth.loginuserid)
										continue;

									keyuser += akp_auth
											.getuserinfo(notification.notifiers[i]).first_name
											+ ", ";
									if (i == 3) {
										keyuser += " and "
												+ (notification.notifiers.length - 3)
												+ " others";
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
								description : this.service == "calendar" ? this
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

			var notifications = Backbone.Collection.extend({
				model : notification,
				mapNotificationCategory : {
					"file" : "container",
					"kons" : "kons",
					"calendar" : "planner"
				},
				changeCount : function(val) {
					this.trigger("countChange", val);
				},
				checkAll:function(){
					akp_auth.checkAllNotification(this.settings.service, this);
				}
			});

			var notificationsView = Backbone.View
					.extend({
						// el:".mt-menu.kons-tab",
						events : {
							"click .notify-no" : "openNotifications",
							"click .notification" : "hideNotifications",
							"scroll .notifications-list" : "getMore",
							"click .check-all" : "checkoutAll"
						},
						defaults : {
							service : "kons",
							onNotificationClick : "",// required
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
							_.bindAll(this, "hideNotifications", "getMore");

							this.settings = $.extend({}, this.defaults, opts);

							this.collection = new notifications;
							// this.posts=opts.posts;
							this.collection.bind("add", this.addNotification,
									this);
							this.collection.bind("countChange",
									this.changeCount, this);

							$(document).bind("click", this.hideNotifications);

							// auth.getNotifications("kons");
						},
						render : function() {
							return this;
						},
						checkoutAll : function() {

							akp_auth.checkAllNotification(
									this.settings.service, this);
							// this.model.set({"active":false});
							var stsel = this.$(".notifications-list").children(
									".notification").attr("data-active", false)
									.find(".ntfy-status");
							stsel.removeClass("icon-radio-checked").addClass(
									"icon-radio-unchecked");
							this.changeCount(0);
						},
						getNotificationCount : function() {
							akp_auth
									.getNotificationCount(this.settings.service);
						},
						init : function() {
							var template = $("#notification-view-template")
									.tmpl([ {
										count : 0,
										className : this.settings.className
									} ]);
							this.$el.append(template);
							this.$(".notifications-list").bind("scroll",
									this.getMore);

							akp_auth.getNotifications(this.settings.service,
									this);
							akp_auth.getNotificationCount(
									this.settings.service, this);
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
							akp_auth.getNotifications(this.settings.service,
									marker, this);

						},
						hideNotifications : function(e) {
							e.stopPropagation();
							this.$(".notifications-pane").hide();
						},
						openNotifications : function(e) {
							e.stopPropagation();
							e.preventDefault();
							$(".notifications-pane").hide();
							if (this.collection.length)
								this.$(".notifications-pane").show();
						},

						changeCount : function(count) {
							var prevcnt = parseInt(this.$(".notify-no").html());

							if (count == "inc") {
								count = prevcnt + 1;
							} else if (count == "dec") {
								count = prevcnt - 1;
							}

							if (parseInt(count) >= 0)
								this.$(".notify-no").html(count);
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
							// $(".notifications-list").bind("scroll",this.getMore);
							// this.$(".notify-no").html(this.collection.length);
							var notification = model.toJSON();
							if (notification.notifiers.length == 1) {
								if (notification.notifiers[0] == akp_auth.loginuserid) {
									console.log(model.toJSON());
									console
											.log("notifier is login user so that notification dropped.")
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

							if (model.toJSON().addTop)
								// this is to add the
								// notification at top
								// of the list
								// For runtime notifications
								this.$(".notifications-list").prepend(
										ntfy.render().$el);
							else
								// For standard relay notifications
								this.$(".notifications-list").append(
										ntfy.render().$el);
						},
						clear : function() {
							this.collection.reset();
							this.$(".notifications-list").empty();
							this.settings = $.extend({}, this.settings, {
								lastTop : 0,
								timestamp : 0,
								marker : null,
							});
						},
					})

			var notificationView = Backbone.View
					.extend({
						events : {
							"click" : "checkNotification",
						},
						initialize : function(opts) {
							_.bindAll(this, "checkNotification");
							this.service = opts.service;
							this.callback = opts.click;
							this.model.set({
								service : this.service
							});
							this.model.bind("updated", this.showupdates, this);
							this.model.bind("checked", this.sendChecked, this);
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
							this.$el = $("#notification-template").tmpl(
									[ info ]);

							var statusClass = notification.active == true ? "icon-radio-checked"
									: "icon-checkmark-circle";
							var status = $("<span>").addClass("ntfy-status")
									.addClass(statusClass);
							this.$el.append(status).attr("data-active",
									notification.active).bind("click",
									this.checkNotification).attr(
									"data-notifyid", notification.id);

							return this;
						},
						sendChecked : function() {

							var stsel = this.$el.attr("data-active", false)
									.find(".ntfy-status");
							stsel.removeClass("icon-radio-checked").addClass(
									"icon-checkmark-circle");

							this.collection.changeCount("dec");
							// this.collection.trigger("countChange", "dec");

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
					"click .evt-title" : "showInvitation"
				},
				settings : {},
				defaults : {
					hasRequests : false,
				},
				initialize : function(opts) {
					_.bindAll(this, "addRequest");
					this.collection = new invitations;
					this.settings = $.extend({}, this.defaults, opts);
					this.collection.bind("add", this.addRequest, this);
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
					var item = $("<li/>").append(temp);
					this.$('ul').append(item).find(".empty-invite")
							.parent("li").remove();
				},
				hideElement : function() {
					this.$el.hide();
				},
				showElement : function() {
					this.$el.show();
				},
				attachRequest : function(req) {
					console.log(req);
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
			 * $(".main_title").click( function() {
			 * $(".content").children().hide().end().children(
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

define(
		"akpkons",
		[ "jquery", "underscore", "backbone", "akpauth", "akputils",
				"akpcontacts", "plugins/jquery.tagsinput.min",
				"fullcalendar", "plugins/jquery-tmpl" ],
		function($, _, Backbone, auth, utils, contacts) {
			loader(40, "kons Loaded");

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
								svr_cmds.result);

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
					console.log(svr_cmds);
					/*
					 * Check notification category if not kons route
					 */

					if (svr_cmds.notification.category == "kons") {
						svr_cmds.notification.addTop = true;
						Notifications.add(svr_cmds.notification);
						Notifications.trigger("countChange", "inc");
					} else {
						auth.routeNotification(svr_cmds.notification);
					}

					break;

				case "error":
					
					console.log("recieved Error Message Kons");
					console.log(svr_cmds);
					noty({
						text : svr_cmds.error,
						type : "error",
						layout : 'bottomRight',
						theme : 'default',
						timeout : 5000,
					});

					break;
				default:
					console.log("oops! undefined mesgtype recieved kons");
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
					if (_.contains(posts.categories, event.konv.category)) {
						updates.add(event.konv);
					} else {
						// console.log("category not recognised");
						updates.add(event.konv);
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
							if (this.collection.length)
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
							})
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
						}
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
								console.log(obj.id);
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
							akp_ws.send(commentaction_obj);

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
							"click .commdelete" : "remove",
							"click .commComments" : "getChildren",
							"click .commAttaches" : "loadAttachments",
							"click .hideActivity" : "closeActivity",
							"click .likecount" : "loadLikers",
							"click .dislikecount" : "loadDislikers",
							"click .commtag" : "filterByTag",
							"click .commaccess" : "showFollowers"
						},

						initialize : function(opts) {

							_.bindAll(this, 'render', 'refresh', "loadDefault",
									"postEdit", "showUser", "showAuthr");
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
									"icon-minus-2 icon-plus-2").addClass(
									"icon-minus-2");
						},
						showAsCollapsed : function() {
							this.comment(".commcollapse").removeClass(
									"icon-minus-2 icon-plus-2").addClass(
									"icon-plus-2");
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
							akp_ws.send(obj);

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
							}

							var editform = new konsEntry(editConfig);

						},
						postEdit : function(data) {
							if (this.settings.strictCategory)
								data.category = this.settings.strictCategory;

							akp_ws.send(data);
							console.log("sending kons:")
							console.log(data);
							this.loadDefault();
						},
						remove : function() {
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
					var favClass = obj.favourite ? "icon-star-2" : "icon-star";

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
						console.log("konversation parent id not found");
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
					akp_ws.send(mute_obj)

				},
				handleFavorite : function(e, obj) {
					var isMuted = $(e.currentTarget).attr("data-fav");

					if (isMuted == "false") {
						this.changeNotify(obj, "unmark_favourite");
						$(e.currentTarget).removeClass("icon-star-2").addClass(
								"icon-star").attr({
							"title" : "Favourite",
							"data-fav" : "true"
						});

					} else {
						this.changeNotify(obj, "mark_favourite");
						$(e.currentTarget).removeClass("icon-star").addClass(
								"icon-star-2").attr({
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
					akp_ws.send(req_obj);
					streamers[unique] = this.attachKonv;

					if (!reset)
						this.clear();
				},
				loadKonvTree : function() {

				},
				updates : function(type, konv) {

					console.log(type);
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

			var Akons = Backbone.View
					.extend({
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
							this.collection.bind("delete", this.removeNode,
									this);
							this.collection.bind("newFilter", this.sendRelay,
									this);
							this.collection.bind("getPost", this.exclusive,
									this);
							this.collection.bind("focus", this.focusPost, this);
							this.collection.bind("traverseTree",
									this.loadHierarchy, this);
							this.collection.bind("clear", this.clear, this);

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
							console.log(tree);
						},
						parseQuery : function(data) {
							if (data.konvid) {
								this.exclusive(data.konvid)
							}
						},
						exclusive : function(id, reset) {

							if(!id || id==null){
								console.log("requested kons id is empty or null.");
								return false;
							}
							console.log("requested Kons ID:" + id);
							var unique = akp_ws.createUUID();
							var req_obj = {
								id : id,
								mesgtype : "request",
								request : "get",
								service : "kons",
								cookie : unique,
								uid : auth.loginuserid
							};
							akp_ws.send(req_obj);
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

							akp_ws.send(obj);
						},
						showLoading:function(){
							var content = $('<div/>')
							.addClass("post konsLoadingMsg")
							.append("<span class='preloader icon-spinner-2'> </span> Loading...");
							this.$el.append(content);
							
						},
						showInstantMsg : function() {
							this.hasInstantMsg = true;
							this.showLoading();
							var content = $('<div />')
									.addClass("post konsInstantMsg")
									.append("start sharing, be the first to make discussion ...").hide();
							var self = this;
							this.instantMsgTimer = setTimeout(function() {
								self.clearStatusMsgs();
								self.$el.append(content);
								content.show("fade");
							}, 2000)

						},
						clearInstantMsg : function() {
							if (!this.hasInstantMsg)
								return;

							this.hasInstantMsg = false;
							clearTimeout(this.instantMsgTimer);
							this.$(".post.konsInstantMsg").remove();

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
								collection : this.collection
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
							}
							akp_ws.send(mute_obj)

						},
						handleFavorite : function(e, obj) {
							var isMuted = $(e.currentTarget).attr("data-fav");

							if (isMuted == "false") {
								this.changeNotify(obj, "unmark_favourite");
								$(e.currentTarget).removeClass("icon-star-2")
										.addClass("icon-star").attr({
											"title" : "Favourite",
											"data-fav" : "true"
										});

							} else {
								this.changeNotify(obj, "mark_favourite");
								$(e.currentTarget).removeClass("icon-star")
										.addClass("icon-star-2").attr({
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
							var commUl = $('<ul class="comment-list"></ul>')
									.append(post.render().el);

							/*
							 * var muteClass= obj.muted ? "icon-volume-mute" :
							 * "icon-volume-medium"; var favClass=obj.favourite ?
							 * "icon-star-2" : "icon-star"; var mute_btn=$("<li/>").append("Mute").click(function(e){self.handleMute(e,obj);}).addClass(" "+
							 * muteClass +" akorpddmenuitem
							 * ").attr({"data-muted":obj.muted}); var
							 * fav_btn=$("<li/>").append("Favourite").click(function(e){self.handleFavorite(e,obj);}).addClass(" "+
							 * favClass +"
							 * akorpddmenuitem").attr({"data-fav":obj.favorite});
							 * var linkPost=$("<li/>").append("Link
							 * Post").click(function(e){self.showLink(e,obj);}).addClass("icon-link
							 * akorpddmenuitem"); var settingsControls=$("<ul/>").addClass("akorpddmenulist
							 * controlslist
							 * dropdown-menu").append(mute_btn).append(fav_btn).append(linkPost);
							 * 
							 * var settingsBtn=$("<span/>").addClass("icon-angle-down
							 * ").css({"color":"#555","font-weight":"bold"}).click(this.showControls);
							 * 
							 * var settingsZone=$("<div/>").addClass("post-notify-btn").append(settingsBtn).append(settingsControls);
							 */
							

							var menu = new PostMenu({
								model : konv
							});
							var settingsZone = menu.render().$el;

							var content = $('<div class="post"></div>').click(
									this.expandPost).attr({
								"data-konvid" : obj.id,
								"data-edit_timestamp" : obj.edit_timestamp
							}).append(settingsZone).append(commUl).hide();

							if (this.collection.byFilter)
								$(this.el).append(content);
							// this.layout.addItem(content);
							else
								$(this.el).prepend(content);

							content.slideDown("slow");
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
								console.log("konversation parent id not found");
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
					var favClass = obj.favourite ? "icon-star-2" : "icon-star";

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
							.append(mute_btn).append(fav_btn).append(linkPost);

					var settingsBtn = $("<span/>").addClass(
							"icon-angle-down showPostCntrls").css({
						"color" : "#555",
						"font-weight" : "bold"
					});

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
					akp_ws.send(mute_obj)

				},

				handleFavorite : function(e) {
					var obj = this.obj;
					var isMuted = $(e.currentTarget).attr("data-fav");

					if (isMuted == "false") {
						this.changeNotify(obj, "unmark_favourite");
						$(e.currentTarget).removeClass("icon-star-2").addClass(
								"icon-star").attr({
							"title" : "Favourite",
							"data-fav" : "true"
						});

					} else {
						this.changeNotify(obj, "mark_favourite");
						$(e.currentTarget).removeClass("icon-star").addClass(
								"icon-star-2").attr({
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
						loadCategories : function(group) {
							this.$(".filtertype.konv_category").remove();

							this.collection.categories = group.categories;

							for ( var i = 0; i < group.categories.length; i++) {
								var category = $("<li/>").addClass(
										"filtertype konv_category").attr(
										"data-filter", group.categories[i])
										.append(group.categories[i]);
								this.$(".kons_filters_list ul")
										.append(category);
							}
							var h = this.$(".kons_filters_list").height();

							// this.$(".konv-updates").css({"top":h});
						}

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
						},
						settings : {},
						initialize : function(options) {
							
							_.bindAll(this, "render", "selectedFile",
									"removeAttachment", "selectMode",
									"hideModeOptions", "setUsers",
									"loadLinkPreview", "removeLink","loadURL");

							this.settings = $
									.extend({}, this.defaults, options);
							
							this.settings.attachments = [];
							this.render();
							
							
							this.$el.attr("data-expanded", "false");
							this.$(".tagData").hide();
							this.$(".linkData").hide();
							this.$(".postCategories").hide();
							this.$(".postcategorieslist").hide();
							this.$(".tagInput").val("");
							this.$(".postUsers").hide();
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

							if (this.model) {
								this.loadValues();
							}
						},
						render : function() {
							this.template = $("#kons-entry-template").tmpl(
									[ this.settings ]);
							$(this.el).html(this.template).addClass(
									this.className);
							return this;
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
									.addClass("icon-spinner-2").end()
									.removeClass(" greenbtn").unbind();
							this.$(".postURL").attr("disabled", true);
						},
						resetLinkInput : function() {
							this.$(".addURL").children("span").removeClass(
									"icon-spinner-2")
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
							akp_ws.send(obj);
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
									: "icon-users-2";
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users-2").addClass(
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
								gid : auth.cgd,
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

							if (this.settings.type == "edit")
								shar_obj["id"] = id;

							if (this.settings.mode == "private") {
								shar_obj["followers"] = this.userInput
										.getSelected();
								shar_obj["followers"].push(auth.loginuserid);
							}

							if (typeof this.settings.onShare === 'function')
								this.settings["onShare"].apply(this,
										[ shar_obj ])
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
									"icon-earth icon-users-2").addClass(
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
									"icon-spinner-2").unbind();
							this.$(".postURL").attr("disabled", true);
						},
						resetLinkInput : function() {
							this.$(".addURL").addClass(
									"btn greenbtn btn-icon icon-checkmark")
									.removeClass("icon-spinner-2").bind(
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
							akp_ws.send(obj);
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
									: "icon-users-2";
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users-2").addClass(
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

							akp_ws.send(shar_obj);
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
									"icon-earth icon-users-2").addClass(
									"icon-earth");
							this.settings.state = "mute";
							this.disableShare();
						}
					});
			var posts = new Posts();
			var masterview = new MasterView({
				collection : posts,
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

define(
        "akpvault",
        [ "require", "jquery", "underscore", "backbone", "akpauth", "akputils",
                "pdfOpener", "appViews", "plugins/gettheme", "plugins/jqxcore",
                "plugins/jqxwindow","plugins/jqxtree", "plugins/FileSaver",
                "plugins/jquery.percentageloader-01a", "plugins/jquery-tmpl",
                "plugins/noty_full", "plugins/jquery.tagsinput.min" ],
        function(require, $, _, Backbone, auth, utils, pdfjs, views) {
            //
            loader(10, "vault Loaded");
            var baseModel = Backbone.Model.extend({
                defaults : {
                    service : "fmgr",
                }
            });

            var baseCollection = Backbone.Collection
                    .extend({
                        model : baseModel,
                        home : null,
                        mapReq : {},
                        initialized : false,
                        settings : {
                            clientCWD : "",
                            groupCWD : "",
                            viewState : "home", // home or group
                        },
                        initialize : function() {
                            this.isVisible = false;
                            this.maxUploadLimit = '524288000'; // 500 MB in
                            // bytes

                            _.bindAll(this, "dwmessage", "downloadPost",
                                    "handleViewChange", "download_msg");
                            // this.bind("setHome", this.gohome, this);
                            this.bind("add", this.routeReq, this);
                            this.bind("newwnd", this.getNewWindow, this);
                            this.bind("download", this.handleFileWrite, this);
                            this.bind("changeFolder", this.changeHome, this);

                            this.Dworker = new SharedWorker(
                                    'Download_worker.js');
                            this.Dworker.onerror = this.werror;
                            this.Dworker.port.start();
                            this.Dworker.port.onerror = this.werror;
                            this.Dworker.port.onmessage = this.dwmessage;
                            this.Dworker.port.postMessage({
                                obj : {
                                    mesgtype : "clearFS",
                                }
                            });

                            this.downloads = new downloadsCollection;
                            this.downloadsView = new downloadWindow({
                                collection : this.downloads,
                                controller : this,
                            })

                            this.downloads.bind("removeDownload",
                                    this.downloadPost, this);

                        },
                        handleViewChange : function(viewObj) {
                            if ((viewObj.title == 'container')
                                    && (!this.isVisible)) {
                                this.isVisible = true;
                                this.trigger("shown");
                            } else if (this.isVisible) {
                                this.isVisible = false;
                                this.trigger("hidden");
                            }
                        },
                        start : function(config) {
                            akp_ws.appView.navView.bind("viewChange",
                                    this.handleViewChange, this);
                            this.gohome(config.homedir);
                            this.addBookmarks(config.bookmarks);

                        },
                        meta : function(prop, value) {

                            if (value === undefined) {
                                return this._meta[prop];
                            } else {
                                this._meta[prop] = value;
                            }
                        },
                        clipboardData : null,
                        dwmessage : function(e) {
                            var down_data = e.data;
                            if (!down_data.file) {
                                // console.log(down_data);
                            } else if (down_data.file.mesgtype == 'ack'
                                    || down_data.file.mesgtype == 'request'
                                    || down_data.file.mesgtype == 'cancel') {
                                down_data.file.uid = auth.loginuserid;
                                this.send(down_data.file, this.download_msg);
                                // this.dpr.setProgress(down_data.percent)
                                // update progress of current Download
                                this.downloadsView
                                        .updateProgress(down_data.percent,
                                                down_data.progressed);
                            } else if (down_data.file.mesgtype == 'save') {
                                // this.dpr.setProgress(down_data.percent)
                                // save msg to comlete download

                                this.trigger("downloads_update",
                                        down_data.percent)
                                var dfname = down_data.file.dfname
                                        .substring(down_data.file.dfname
                                                .lastIndexOf('/') + 1,
                                                down_data.file.dfname.length);
                                saveAs(down_data.file.fl, dfname);
                                this.downloads.trigger("fileCompleted");

                            }

                        },
                        werror : function(e) {
                            consloe.log('ERROR: Line ', e.lineno, ' in ',
                                    e.filename, ': ', e.message);
                        },
                        download_msg : function(msg) {
                            var strdata = msg.data, respdata;

                            if (msg.error) {
                                console.log(msg.error);
                                return false;
                            } else {
                                try {
                                    respdata = window.atob(msg.data);
                                } catch (e) {
                                    console
                                            .log("unable decode base64 data, NOT BASE64 DATA");
                                    return false;
                                }

                                msg.data = respdata;
                                this.downloadPost({
                                    obj : msg
                                })

                            }

                        },
                        downloadPost : function(msg) {
                            this.Dworker.port.postMessage(msg);

                        },
                        handleFileWrite : function(downloads_list) {

                            var list = downloads_list;
                            // this.files.getSelected();
                            var root = this;
                            // $("#fmgrDloadsBtn").show();
                            this.trigger("downloadPush");
                            $.each(list, function(i, v) {
                                // console.log(v);
                                var obj = v.toJSON();
                                var fname = obj.path;
                                var size = obj.size;
                                var dfname = fname.substring(fname
                                        .lastIndexOf('/') + 1, fname.length);
                                if (obj.isdir != "true") {

                                    var guid = akp_ws.createUUID();

                                    var write_obj = {
                                        mesgtype : "request",
                                        service : "fmgr",
                                        request : "read",
                                        cookie : guid,
                                        fname : fname,
                                        size : 1024,
                                        uid : auth.loginuserid,
                                    };

                                    // send request to download
                                    root.downloadPost({
                                        obj : write_obj,
                                        siz : size
                                    });

                                    // add to downloads Dialog
                                    root.downloads.add({
                                        name : dfname,
                                        size : size,
                                    });

                                } else {
                                    root.trigger("downloadErr", dfname);
                                }
                            });

                        },
                        showSelector : function(callback) {

                            var selectorWindow = new selectorView({
                                onSelected : callback,
                                CWD : this.groupHome,
                                home : this.groupHome
                            });

                            return selectorWindow;

                        },
                        FSDialog : function(opts) {
                            // New File selector Dialog Request
                            return new FileSlectorDialog(opts)
                        },
                        FVDialog : function(opts) {
                            // New Files Viewer Dialog Request
                            return new FileViewerDialog(opts);
                        },
                        gohome : function(dir) {
                            this.cwd = dir;
                            this.cleintHome = dir;
                            this.settings.clientCWD = dir;
                            this.trigger("setHome", dir);
                        },
                        setGHome : function(dir) {
                            this.groupHome = dir;
                            this.settings.groupCWD = dir;
                            this.trigger("setGroup", dir);

                        },
                        addBookmarks : function(bookmarks) {
                            this.bookmarks = bookmarks;
                            // this.trigger("bookmarks",bookmarks)
                        },
                        changeHome : function(home) {

                            if ((home == "phome" && this.home == this.cleintHome)
                                    || (home == "ghome" && this.home == this.groupHome)) {

                                return;

                            } else if (home == "phome") {

                                this.home = this.cleintHome;
                                this.trigger("switchHome",
                                        this.settings.clientCWD, this.home);
                                this.settings.viewState = "home";

                            } else if (home == "ghome") {

                                this.home = this.groupHome;
                                this.trigger("switchHome",
                                        this.settings.groupCWD, this.home);
                                this.settings.viewState = "group";

                            }

                            /*
                             * if (this.home == this.groupHome) this.home =
                             * this.cleintHome; else this.home = this.groupHome;
                             * 
                             * this.trigger("setHome", this.home);
                             */
                        },
                        getViewState : function() {
                            return this.settings.viewState;
                        },
                        handleMessage : function(req) {
                            akp_ws.getMap(req);
                            var method = this.mapReq[req.cookie];
                            if (method)
                                method.apply(this, [ req ]);
                            else
                                this.handleMsg(req);
                        },
                        routeReq : function(model) {
                            var req = model.toJSON();
                            this.handleMessage(req)
                        },
                        picUpdate : function(data) {
                            this.send(data, this.picResp);
                        },
                        picResp : function(resp) {
                            akp_ws.picUpdate(resp);
                        },
                        handleMsg : function(req) {
                            if (req.mesgtype == "error")
                                this.trigger("error", req);
                            else if (req.mesgtype == "notification")
                                this.trigger("notification", req.notification);
                        },
                        send : function(obj, successCallback, errorCallback) {
                            akp_ws.send(obj);
                            this.mapReq[obj.cookie] = successCallback;
                        },
                        getNewWindow : function(path, home) {
                            // New window Handling
                            var newWindow = new WindowView({

                                dir : path,
                                home : home || this.home,
                            });
                        },
                        getUserHome : function() {
                            return this.cleintHome;
                        },
                        FileBrowser : function(options) {
                            // New File browser
                            if (!options.home)
                                options["home"] = this.groupHome;
                            // File browser have only permitted to access Group
                            // directory
                            var window = new WindowView(options);
                        },
                        clear : function() {

                        },
                        changeGroup : function(group) {
                            this.trigger("clear");
                            if (!this.initialized) {
                                this.trigger("initialized");
                                this.trigger("bookmarks", this.bookmarks);
                                this.initialized = true;
                            }
                            this.setGHome(group.homedir);
                        }
                    });

            var FileModel = Backbone.Model.extend({
                idAttribute : "path",
                defaults : {
                    isSelected : false,
                    isOpened : false,
                    isByView : false,
                }
            });

            var Files = Backbone.Collection
                    .extend({
                        model : FileModel,

                        initialize : function() {
                            this.context = {};
                            this._meta = {
                                "filesCopied" : false,
                                "copiedList" : [],
                            };
                            _.bindAll(this, "loadFiles", "update",
                                    "handleResponse",
                                    "handleFileOperationResponse")
                            this.bind("change", this.update, this);
                            this.bind("goHome", this.setHome, this);
                            this.bind("goPath", this.goPath, this);
                            this.bind("refresh", this.refresh, this);
                            this.bind("cut", this.cutaction, this);
                            this.bind("copy", this.copyaction, this);
                            this.bind("paste", this.pastefiles, this);
                            this.bind("delete", this.remove, this);
                            this.bind("search", this.makeSearch, this);
                            this.bind("add", this.addFiles, this);
                            // this.bind("goParent",this.getParent,this);

                        },

                        meta : function(prop, value) {
                            // Storing state values
                            if (value === undefined) {
                                return this._meta[prop]
                            } else {
                                this._meta[prop] = value;
                            }
                        },
                        refresh : function() {
                            this.unselect();
                            this.closeOpened();
                        },
                        openGtkFile : function(dname, callback) {
                            // OPen call for Documents Open with gtk viewer
                            var unique = akp_ws.createUUID();
                            var obj = {
                                uid : auth.loginuserid,
                                dname : dname,// document full path
                                cookie : unique,
                                mesgtype : "request",
                                request : "open",
                                service : "fmgr",
                            }
                            collection.send(obj, callback);
                        },
                        cutaction : function() {
                            // File Operation cut
                            var data = {
                                "filesCopied" : true,
                                "action" : "move",
                                "actionSource" : this.meta("cwd"),
                                "copiedList" : this.getSelected()
                            }
                            // saving file list to clipboard object
                            collection.clipboardData = data;

                        },
                        copyaction : function() {
                            // File Operation Copy
                            var data = {
                                "filesCopied" : true,
                                "action" : "copy",
                                "actionSource" : this.meta("cwd"),
                                "copiedList" : this.getSelected()
                            }

                            collection.clipboardData = data;

                        },
                        pastefiles : function(destination) {
                            // File Operation paste
                            if (!collection.clipboardData)
                                // return if no data available in clipboard
                                // object
                                return;

                            var data = collection.clipboardData;
                            var action = data["action"], source = data["actionSource"], selectedModels = data["copiedList"], srcargs = [], guid = akp_ws
                                    .createUUID();

                            for ( var i = 0; i < selectedModels.length; i++)
                                srcargs.push(selectedModels[i].get("fname"));

                            if (!destination)
                                destination = this.meta("cwd");

                            var paste_obj = {
                                mesgtype : "request",
                                service : "fmgr",
                                request : action,
                                cookie : guid,
                                source : source,
                                destination : destination,
                                srcargs : srcargs
                            }
                            // sending action request to server
                            collection.send(paste_obj,
                                    this.handleFileOperationResponse);

                            if (action == "move")// in case of cut operation
                                // clear the clipboard
                                // object
                                this.emptyClipboard();

                        },
                        remove : function() {
                            // File Delete Operation
                            var list = this.getSelected();// list of Selected
                            // files in workzone
                            var args = [];

                            $.each(list, function(index, item) {
                                args.push(item.get('fname'));
                            });

                            var guid = akp_ws.createUUID();
                            var dlt_obj = {

                                mesgtype : "request",
                                service : "fmgr",
                                request : "remove",
                                cookie : guid,
                                source : this.meta("cwd"),
                                srcargs : args
                            }
                            // send remove request
                            collection.send(dlt_obj, this.handleResponse);
                        },
                        replaceRootInPath : function(path) {
                            var replacedPath = path;

                            var clientExp = new RegExp(collection.cleintHome,
                                    'gi');
                            var clientMatches = path.match(clientExp);
                            var groupMatches = path.match(new RegExp(
                                    collection.groupHome, 'gi'));

                            if (clientMatches != null) {
                                if (clientMatches.length)
                                    replacedPath = replacedPath.replace(
                                            collection.cleintHome, "Home");

                            } else if (groupMatches != null) {

                                if (groupMatches.length)
                                    replacedPath = replacedPath.replace(
                                            collection.groupHome, "Group");
                            }
                            return replacedPath;
                        },
                        getHomeFromPath : function(path) {
                            var clientExp = new RegExp(collection.cleintHome,
                                    'gi');
                            var clientMatches = path.match(clientExp);
                            var groupMatches = path.match(new RegExp(
                                    collection.groupHome, 'gi'));
                            if (clientMatches != null) {
                                if (clientMatches.length)
                                    return collection.cleintHome;
                            } else if (groupMatches != null) {
                                if (groupMatches.length)
                                    return collection.groupHome;
                            }
                            return false;
                        },
                        getFileNameFromPath : function(Path) {

                        },
                        cancelSearch : function() {
                            if (!this.meta("search_id"))
                                return;
                            // sending Cancel request for previous search Id
                            var obj = {
                                service : "fmgr",
                                cookie : this.meta("search_id"), // previous
                                // search ID
                                mesgtype : "request",
                                request : "cancel"
                            }
                            this.meta("search_id", false);
                            collection.send(obj);
                        },
                        makeSearch : function(str) {
                            // New search request
                            this.cancelSearch();
                            if (str.length < 3) {// string should have min 3
                                // charecters
                                this.trigger("noSearch");
                                return;
                            }

                            var unique = akp_ws.createUUID();
                            var obj = {

                                service : "fmgr",
                                mesgtype : "request",
                                request : "search",
                                cookie : unique,
                                dname : this.meta("cwd"),
                                key : str,

                            }
                            this.meta("search_id", obj.cookie); // store search
                            // id for next
                            // use
                            collection.send(obj, this.handleSearchResults);
                        },
                        handleSearchResults : function(resp) {
                            // handle search results
                            filesCollection.trigger("addResult", resp)
                        },
                        emptyClipboard : function() {
                            // this.meta("filesCopied", false);
                            // this.meta("copiedList", []);
                            collection.clipboardData = null;
                        },

                        handleFileOperationResponse : function(resp) {
                            if (resp.status)// if status exist operation has no
                                // arguments
                                this.trigger("refresh")
                            else
                                this.handleOperationMsg(resp);// Raise a
                            // question
                            // dialog
                        },
                        handleOperationMsg : function(resp) {
                            var root = collection;
                            var self = this;
                            this.trigger("question", resp);
                        },
                        handleResponse : function(resp) {
                            this.trigger("refresh");
                        },

                        update : function(model) {

                            var diff = model.changedAttributes();
                            for ( var att in diff) {
                                switch (att) {
                                case 'isOpened':
                                    var value = model.get(att);
                                    if (value) {
                                        // this.closeOpened();
                                        this.meta("cwd", model.get("path"));
                                        this.getTree();
                                        // change on this att cause directory
                                        // change
                                    }
                                    break;
                                }
                            }
                        },
                        sendQuestionResponse : function(resp, answer) {
                            var q_obj = {

                                mesgtype : "answer",
                                service : "fmgr",
                                cookie : resp.cookie,
                                answer : answer

                            };
                            collection.send(q_obj,
                                    this.handleFileOperationResponse);
                        },
                        setHome : function() {
                            this.unselect();
                            this.closeOpened();
                            this.meta("cwd", this.meta("home"));
                        },
                        goPath : function() {
                            this.unselect();
                            this.closeOpened();
                            this.getTree();
                        },
                        getParent : function() {
                            this.meta("cwd", this.context.parent);
                            this.getTree();
                        },
                        getTree : function() {
                            // var path=model.get("path");
                            var guid = akp_ws.createUUID();
                            var cwd = this.meta("cwd");

                            var dir_json = {
                                mesgtype : "request",
                                service : "fmgr",
                                request : "getdir",
                                cookie : guid,
                                dname : cwd,
                            }
                            // sending getdir requests
                            collection.send(dir_json, this.loadFiles);

                            this.trigger("showPath", cwd);// trigger event for
                            // changing path

                            /*
                             * Checking is it Home Directory trigger event with
                             * result
                             */
                            this.trigger("inHome", this.meta("cwd") == this
                                    .meta("home"));
                            /*
                             * if(this.meta("cwd")==this.meta("home")){ //
                             * checking is it home directory
                             * this.trigger("inHome",true); } else{
                             * this.trigger("inHome",false); }
                             */

                            try {
                                /*
                                 * Maintaining Context get Model has path of
                                 * current directory if not exist set context to
                                 * home
                                 */
                                var model = this.where({
                                    path : cwd
                                })[0];
                                if (model)
                                    this.context = model.toJSON();
                                else
                                    this.context = {
                                        parent : this.meta("home"),
                                        path : this.meta("home"),
                                        home : this.meta("home"),
                                        isdir : "true",
                                    }
                            } catch (e) {
                                console.log(e.message);
                            }

                            this.reset();
                           // this.returnAsEmptyFolder();
                        },
                        returnAsEmptyFolder : function() {

                            this.isEmptyCheck = true;
                            var self = this;

                            // Maintain status
                            var countStr = $(
                                    '<span class="loadpercentage icon-spinner-3"></span> ')
                                    .css({
                                        "font-size" : "16px",
                                        width : "16px",
                                        color : "inherit",
                                        "line-height" : "15px"
                                    });

                            var int = $("<div/>").append(countStr).append(
                                    " Loading...").html()
                            this.trigger("itemsCount", int);// set status to
                            // loading

                            /*
                             * assuming that Response will come with in one
                             * second if Not throw it as Empty Folder
                             */

                            this.isEmptyCheckTimer = setTimeout(function() {
                                self.showCount();
                                self.trigger("isEmptyFolder", true);
                                // trigger event as CWD as Empty Directory
                            }, 1);

                        },
                        addFiles : function(model) {

                            if (!this.isEmptyCheck) {

                                return;
                            }
                            isEmptyCheck = false;
                            clearTimeout(this.isEmptyCheckTimer);

                            this.trigger("isEmptyFolder", false);

                        },
                        createFile : function(srcargs, callback) {

                            var guid = akp_ws.createUUID();
                            var dname = this.meta("cwd");
                            var add_obj = {

                                mesgtype : "request",
                                service : "fmgr",
                                request : 'create_file', // mov||copy||remove||create_file||create_dir
                                cookie : guid,
                                source : dname,
                                srcargs : srcargs,
                            }
                            collection.send(add_obj, callback);
                            // "sending create file request
                        },
                        createFolder : function(srcargs, callback) {

                            var guid = akp_ws.createUUID();
                            var dname = this.meta("cwd");
                            var add_obj = {
                                mesgtype : "request",
                                service : "fmgr",
                                request : 'create_dir',
                                cookie : guid,
                                source : dname,// directory to create
                                srcargs : srcargs,// arguements that have
                            // names
                            }
                            collection.send(add_obj, callback);
                            // sending create directory req
                        },
                        loadFiles : function(obj) {

                            var length = obj.direlements.length;
                            if (!length){
                                this.returnAsEmptyFolder();
                                return; // exit if directory contains no
                            // elements..
                            }

                            for ( var i = 0; i < length; i++) {
                                var item = obj.direlements[i];
                                item["path"] = this.meta("cwd") + "/"
                                        + item.fname;
                                item["parent"] = this.meta("cwd");
                                item["home"] = this.meta("home");
                                item["formatedSize"] = utils.convBytes(
                                        item.size, 2);
                                this.add(item);
                            }

                            this.showCount(length);
                        },
                        showCount : function() {
                            var countStr = this.where({
                                isdir : "true"
                            }).length + " Folder(s), " + this.where({
                                isdir : "false"
                            }).length + " File(s)"
                            this.trigger("itemsCount", countStr);
                        },
                        closeOpened : function() {
                            this.filter(function(file) {
                                if (file.get("isOpened") == true) {
                                    file.set({
                                        "isOpened" : false,
                                        "isByView" : false
                                    })
                                }

                            })
                        },
                        getRoots : function(path) {

                            var paths = path.split("/"), dirs = [], flag = false;
                            var pathname, activedir = this.meta("home"), roots = [], tmp = "";
                            for ( var i = 0; i < paths.length; i++) {
                                if (paths[i]) {
                                    tmp += "/" + paths[i];

                                    if (tmp == activedir) {
                                        flag = true;
                                    }
                                    if (flag) {
                                        pathname = tmp == activedir ? this
                                                .replaceRootInPath(tmp)
                                                : paths[i];

                                        var obj = {
                                            name : pathname,
                                            path : tmp
                                        };

                                        dirs.push(obj);

                                    }

                                }

                            }
                            return dirs;
                        },
                        getSelected : function() {
                            var list = [];
                            list = this.where({
                                "isSelected" : true
                            });

                            return list; // return list of models that are
                            // selected
                        },
                        unselect : function() {
                            this.filter(function(file) {
                                if (file.get("isSelected") == true) {
                                    file.set({
                                        "isSelected" : false
                                    })
                                }

                            });

                            // unselect all the models
                        },
                        clear : function() {
                            this.trigger("clear");
                        },
                    });

            /*******************************************************************
             * File search
             * ***************************************************************************
             */

            var searchView = Backbone.View
                    .extend({
                        el : $(".searchResults"),
                        initialize : function() {

                            _.bindAll(this, "render", "removeOldResults",
                                    "insertResult");
                            this.collection.bind("search",
                                    this.removeOldResults, this);
                            this.collection.bind("addResult",
                                    this.insertResult, this);
                            this.collection.bind("noSearch", this.hide, this);
                            this.collection.bind("clear", this.clear, this);
                        },
                        render : function() {
                            return this;
                        },
                        show : function() {
                            if (!this.$el.is(":visible"))
                                this.$el.show();
                        },
                        hide : function() {
                            this.$el.hide();
                        },
                        insertResult : function(result) {
                            this.show();
                            var item = new searchItemView({
                                model : result,
                                collection : this.collection,
                            })
                            this.$el.append(item.render().el)

                        },
                        removeOldResults : function(str) {
                            this.show();
                            this.$el.empty().append("Searching..");
                        },
                        clear : function() {
                            this.$el.empty();
                            this.hide();
                        },
                    });

            /*
             * File Search result rendering
             */
            var searchItemView = Backbone.View
                    .extend({
                        className : "resultItem",
                        events : {
                            "click" : "openNewWnd"
                        },
                        initialize : function() {
                            var resp = this.model;
                            var path = resp.isdir == "true" ? resp.fpath + "/"
                                    + resp.fname : resp.fpath;
                            var src = resp.isdir == "true" ? 'css/images/folder.png'
                                    : 'css/images/mimes/undefined.png';
                            this.$el
                                    .append(
                                            "<img src='"
                                                    + src
                                                    + "' height=48 width=48 alt='file' />")
                                    .append(
                                            "<span>"
                                                    + this.collection
                                                            .replaceRootInPath(resp.fname)
                                                    + "</span>");
                        },
                        render : function() {
                            return this;
                        },
                        openNewWnd : function() {
                            console.log('path:' + this.model.fpath)

                            collection.trigger("newwnd", this.model.fpath)

                        },
                    });
            /*
             * File Viewer Dialog
             */
            var FileViewerDialog = Backbone.View.extend({
                events : {},
                initialize : function(opts) {
                    this.files = opts.files;
                    this.collection = new FSCollection;
                    this.collection.bind("add", this.addFile2Container, this);
                    this.addFiles(this.files);
                },
                render : function() {
                    return this;
                },
                addFiles : function(files) {
                    var extFiles = _.each(files, function(obj) {
                        obj.hasRemove = false;
                    });
                    this.collection.add(files);
                },
                addFile2Container : function(model) {
                    var sctdFile = new FSDFileView({
                        model : model
                    });
                    this.$el.append(sctdFile.render().el);
                }
            });

            /*
             * File Browser Dialog
             */

            var FileSlectorDialog = Backbone.View.extend({
                events : {
                    "click" : "openSelector",

                },
                initialize : function(options) {
                    _.bindAll(this, "selectedFile");
                    if (options.onAdd)
                        this.onAdd = options.onAdd;

                    this.$container = options.container;
                    this.collection = new FSCollection;
                    this.collection.bind("add", this.addFile2Container, this);
                },
                openSelector : function() {
                    var selector = collection.showSelector(this.selectedFile);
                },
                selectedFile : function(models) {
                    this.onAdd.call();
                    this.collection.add(models);
                },
                addFile2Container : function(model) {
                    var sctdFile = new FSDFileView({
                        model : model
                    });
                    this.$container.append(sctdFile.render().el);

                },
                addFiles : function() {

                },
                getFileList : function() {
                    /*
                     * this.collection.pluck([ "isdir", "path", "type", "size",
                     * "fname" ]);
                     */
                    return this.collection.map(function(model) {
                        return _.pick(model.toJSON(), [ "isdir", "path",
                                "type", "size", "fname" ]);
                    });

                },
                render : function() {

                },
                reset : function() {
                    this.collection.reset();
                },
            });

            var FSDFileView = Backbone.View
                    .extend({
                        events : {
                            "click .rmAttach" : "removeEl",
                        },
                        initialize : function() {
                            this.model.bind("remove", this.remove, this);
                        },
                        render : function() {
                            var file = this.model2Obj();
                            var temp = this.getFile(file);
                            this.$el.append(temp);

                            return this;
                        },
                        getFile : function(file) {
                            var data = {};
                            $.extend(data, file);
                            var mimeclass = utils.mime2class(data.type);
                            var sizeBytes = utils.convBytes(data.size, 2);
                            data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"
                                    : mimeclass;
                            data["size"] = sizeBytes;
                            data["hasRemove"] = data["hasRemove"] ? data["hasRemove"]
                                    : true;
                            return $("#attachment-template").tmpl([ data ]);
                        },
                        model2Obj : function() {
                            var model = this.model.toJSON();
                            return {
                                isdir : model.isdir,
                                path : model.path,
                                type : model.type,
                                size : model.size,
                                fname : model.fname
                            };
                        },
                        removeEl : function() {
                            this.$el.remove();
                        }

                    });

            /*******************************************************************
             * File Selector for variuos purposes
             * ***************************************************************************************
             */

            var selectorView = Backbone.View.extend({
                id : "vaultFileSelector",

                events : {
                    "click .pathdir" : "gopath",
                    "click .prv" : "scrollPath",
                    "click .nxt" : "scrollPath",
                    "click .wnd_parent" : "goParent",
                    "click .fileselectbtn" : "selectFile"
                },
                initialize : function(options) {

                    this.result = options.onSelected;
                    this.finished = false;
                    _.bindAll(this, "render", "refresh", "selectFile",
                            "returnEmpty");
                    this.template = $("#fileSelector-template").tmpl();
                    this.render();
                    this.roots = [];

                    this.collection = new Files;
                    this.collection.meta("cwd", options.CWD);
                    this.collection.meta("home", options.home);
                    this.collection.bind("showPath", this.showPath, this);
                    this.collection.bind("refresh", this.refreshView, this);

                    this.collection.getTree();

                    this.subView = new FilesZone({
                        collection : this.collection,
                        el : this.$("ul.wnd-file-list"),
                        menu : true,
                    });
                    // this.collection.bind("add", this.showFiles, this);

                },
                render : function() {
                    this.$el.append(this.template);
                    this.$el.jqxWindow({
                        closeButtonAction : 'close',
                        height : 400,
                        width : 600,
                        isModal : true,
                    // close: this.returnEmpty
                    });

                    // this.$el.jqxWindow("close",this.returnEmpty);
                },
                selectFile : function() {

                    var list = this.collection.getSelected();
                    if (list.length < 10 && list.length > 0) {
                        this.finished = true;
                        this.result.call(this, list);
                        $("#" + this.el.id).jqxWindow('close');
                        this.$el.remove();
                    }

                },
                returnEmpty : function() {
                    if (!this.finished)
                        this.result.call(this, []);
                },

                showFiles : function(file) {

                    var fileview = new File({
                        model : file
                    })

                    this.$(".wndView ul").append(fileview.render().el);
                },
                refresh : function(msg) {
                    this.collection.trigger("refresh");
                },
                refreshView : function() {
                    this.collection.getTree();
                },
                goParent : function() {
                    if (this.collection.meta("cwd") == this.collection
                            .meta("home"))
                        return;

                    this.collection.trigger("goParent");

                    var path = this.collection.meta("cwd");
                    var parent = path.substring(0, path.lastIndexOf('/'));
                    this.collection.meta("cwd", parent);
                    this.collection.getTree();
                },

                handleFolderResponse : function() {
                    this.refresh();
                },
                handleDownloads : function() {
                    var list = this.collection.getSelected();
                    collection.trigger("download", list);
                },
                scrollPath : function(e) {
                    var dirtn;
                    btn = $(e.target).hasClass('nxt') ? dirtn = '+'
                            : dirtn = '-';
                    $(e.target).closest('.wndpath').find('.pathdirs').stop()
                            .animate({
                                scrollLeft : dirtn + '=200'
                            }, 1000);
                },
                showPath : function() {

                    var location = this.$(".wndpath ul.pathdirs");

                    var cwd = this.collection.meta("cwd");
                    var roots = this.collection.getRoots(cwd);
                    location.empty();
                    for ( var i = 0; i < roots.length; i++)
                        location.append($("<li/>").append(roots[i]["name"])
                                .attr('data-pathid', roots[i]["path"])
                                .addClass("pathdir"));

                },

                gopath : function(e) {

                    var id = $(e.target).attr("data-pathid");
                    // var dir = this.roots[id];
                    this.collection.meta("cwd", id);
                    this.subView.render();

                    this.collection.getTree();
                }
            });

            /*******************************************************************
             * Open browser in a window
             * *************************************************************************
             */

            var WindowView = Backbone.View
                    .extend({
                        // id : this.id,

                        events : {
                            "click .pathdir" : "gopath",
                            "click .prv" : "scrollPath",
                            "click .nxt" : "scrollPath",
                            "click .wnd_refresh" : "refresh",
                            "click .wnd_parent" : "goParent",
                            "click .wnd_newfolder" : "createFolder"
                        },
                        initialize : function(options) {
                            _.bindAll(this, "render", "refresh");
                            this.template = $("#window-template").tmpl();
                            this.render();
                            this.roots = [];

                            this.collection = new Files;
                            this.setDefaults(options);
                            this.collection.meta("home", options.home);
                            this.collection.bind("showPath", this.showPath,
                                    this);
                            this.collection.bind("refresh", this.refreshView,
                                    this);
                            this.collection.bind("newfolder",
                                    this.createFolder, this);
                            this.collection.bind("download",
                                    this.handleDownloads, this);

                            this.collection.getTree();

                            this.subView = new FilesZone({
                                collection : this.collection,
                                el : this.$("ul.wnd-file-list"),
                                menu : false,
                                selectFile : options.file,
                            });
                            // this.collection.bind("add", this.showFiles,
                            // this);

                        },
                        setDefaults : function(options) {
                            if (options.dir) {
                                this.collection.meta("cwd", options.dir);
                            } else if (options.file) {
                                var dir = options["file"].substr(0,
                                        options["file"].lastIndexOf("/"));
                                this.collection.meta("cwd", dir);
                            }
                        },
                        render : function() {
                            this.$el.append(this.template).jqxWindow({
                                closeButtonAction : 'close',
                                height : 400,
                                width : 600,
                            });
                        },
                        showFiles : function(file) {

                            var fileview = new File({
                                model : file
                            })

                            this.$(".wndView ul").append(fileview.render().el);
                        },
                        refresh : function(msg) {
                            this.collection.trigger("refresh");
                        },
                        refreshView : function() {
                            this.collection.getTree();
                        },
                        goParent : function() {
                            if (this.collection.meta("cwd") == this.collection
                                    .meta("home"))
                                return;

                            this.collection.trigger("goParent");

                            var path = this.collection.meta("cwd");
                            var parent = path.substring(0, path
                                    .lastIndexOf('/'));
                            this.collection.meta("cwd", parent);
                            this.collection.getTree();
                        },
                        createFolder : function() {
                            var root = this;

                            $('<div/>')
                                    .addClass('dialogClass')
                                    .append(
                                            "<p><span style='float:left; margin:0 7px 20px 0;'> </span>Enter The Folder Name:<input type='text' id='flname'></p>")
                                    .dialog(
                                            {
                                                resizable : false,
                                                title : 'Prompt',
                                                height : 170,
                                                modal : true,
                                                buttons : [
                                                        {

                                                            text : "Create",
                                                            "class" : "btn btn-primary",
                                                            click : function() {
                                                                if ($(
                                                                        'input#flname')
                                                                        .val() != '') {
                                                                    var foldername = [ $(
                                                                            'input#flname')
                                                                            .val() ];
                                                                    root.collection
                                                                            .createFolder(
                                                                                    foldername,
                                                                                    root.refresh);
                                                                    $(this)
                                                                            .dialog(
                                                                                    "close")
                                                                            .remove();
                                                                }
                                                            },

                                                        },
                                                        {
                                                            text : "Cancel",
                                                            "class" : "btn btn-danger",
                                                            click : function() {
                                                                $(this)
                                                                        .dialog(
                                                                                "close")
                                                                        .remove();
                                                            },

                                                        } ],
                                            });

                        },
                        handleFolderResponse : function() {
                            this.refresh();
                        },
                        handleDownloads : function() {
                            var list = this.collection.getSelected();
                            collection.trigger("download", list);
                        },
                        scrollPath : function(e) {
                            var dirtn;
                            btn = $(e.target).hasClass('nxt') ? dirtn = '+'
                                    : dirtn = '-';
                            $(e.target).closest('.wndpath').find('.pathdirs')
                                    .stop().animate({
                                        scrollLeft : dirtn + '=200'
                                    }, 1000);
                        },
                        showPath : function() {

                            var location = this.$(".wndpath ul.pathdirs");

                            var cwd = this.collection.meta("cwd");
                            var roots = this.collection.getRoots(cwd);
                            location.empty();
                            for ( var i = 0; i < roots.length; i++)
                                location.append($("<li/>").append(
                                        roots[i]["name"]).attr('data-pathid',
                                        roots[i]["path"]).addClass("pathdir"));

                        },
                        gopath : function(e) {

                            var id = $(e.target).attr("data-pathid");
                            // var dir = this.roots[id];
                            this.collection.meta("cwd", id);
                            this.subView.render();

                            this.collection.getTree();
                        }
                    });

            /*******************************************************************
             * File Transfer windows and collections
             * ***********************************************
             * 
             */

            var fileTransfer = Backbone.Model.extend({
                name : null,
                status:"",
                changeStatus:function(status){
                    this.set({status:status});
                }
            });

            /*
             * ******************************************** Uploads
             * ********************************************
             */

            var uploadsCollection = Backbone.Collection.extend({
                model : fileTransfer,
                initialize : function() {
                    this.bind('remove', this.check, this);
                    this.bind("change", this.handleChange, this);
                    // this.bind("uploadsCompleted",this.)
                },
                handleChange:function(model){
                    var diff = model.changedAttributes();
                    for ( var att in diff) {
                        switch (att) {
                        case 'cencel':
                           this.cancel(model);
                            break;
                        case 'status':
                            break;
                        }
                    }
                },
                cancel : function(model) {
                    
                    if(!model){
                        var activeModel = this.getActiveUpload();
                        if(!activeModel)
                            return false;     
                        model = activeModel;
                        
                        
                    }

                    var msg = {
                        'mesgtype' : 'cancel',
                        'fname' : model.get("name"),
                        'dname' : model.get("dname"),
                        "cookie" : model.get("id")
                    }
                    this.trigger("removeUpload", msg)
                    this.remove(model);

                },
                getActiveUpload:function(){
                  return this.where({status:"uploading"})[0];  
                },
                cancelAll:function(){
                    
                },
                check : function() {
                    if (this.isEmpty())
                        this.trigger("uploadsCompleted");
                }
            });

            /*
             * uploads window with JQx window
             */
            var uploadWindow = Backbone.View.extend({
                el : $("#uploadwindow"),
                events : {},
                initialize : function(opts) {

                    this.controller = opts.controller;
                    this.controller.bind("hidden", this.hide, this);

                    this.collection.bind('add', this.addUpload, this);
                    this.collection.bind("fileCompleted", this.removeUpload,
                            this);
                    this.collection.bind("uploadsCompleted", this.hide, this);

                    /*
                     * this.upr = $("#uprogress").percentageLoader({ width :
                     * 100, height : 100, progress : 0, position : { x : 200, y :
                     * 400 }, animationType : 'slide' });
                     */

                    this.$el.jqxWindow({
                        autoOpen : false,
                        showCloseButton : false,
                        showCollapseButton : true,
                        width : 310,
                        height : 310,
                        resizable : false
                    });

                },
                render : function() {
                },
                hide : function() {
                    this.$el.jqxWindow('hide');
                    // $("#fmgrUploadsBtn").hide();
                },
                updateProgress : function(id, perc, size) {
                    // this.upr.setProgress(perc);
                    var file = this.collection.get(id);
                    if (file)
                        file.trigger("update", {
                            perc : perc,
                            size : size
                        });
                },
                addUpload : function(model) {
                    var file = new uploadFileView({
                        model : model
                    });
                    this.$('#upload_status').append(file.render().el);
                },
                removeUpload : function(id) {

                    var model = this.collection.get(id);
                    if (model) {
                        model.trigger('remove');
                        this.collection.remove(model);
                    }
                }
            })

            /*
             * upload file Item
             */
            var uploadFileView = Backbone.View
                    .extend({
                        className : 'upload_file',
                        events : {
                            'click .uc' : "stopUpload"
                        },
                        initialize : function() {
                            this.model.bind("remove", this.cancelUpload, this);
                            this.model.bind("update", this.changeProgress, this);
                            var name = this.model.get("name");
                            var type = this.model.get("type");
                            var size = utils.convBytes(this.model.get("size"),
                                    2);
                            // <div class='akorp-mime "+ utils.mime2class(type)
                            // +" '></div>
                            this.$el
                                    .append("<div> <span> "
                                            + name
                                            + ' </span> <div class="up_pbar"><span class="up_progress" ></span></div></div>   '
                                            + ' <div> <span class="percMeter"> 0.00 % </span> | <span class="sizeOver"> 0B </span> / <span> '
                                            + size
                                            + ' </span>  </div>'
                                            + ' <span class="cancel uc icon-remove-3"></span>');
                        },
                        render : function() {
                            return this;
                        },
                        changeProgress : function(data) {
                            this.model.changeStatus("uploading");
                            var perc = data.perc;
                            var size = data.size;
                            this.$(".sizeOver").html(utils.convBytes(size, 2));
                            this.$(".percMeter").html(perc + "%");
                            // perc*=100;
                            this.$(".up_progress").css({width : Math.round(perc) + "%"
                            }).attr("title", Math.round(perc) + "%");
                        },
                        stopUpload : function() {
                            // this.model.trigger('remove');

                            this.model.set({
                                cancel : true
                            });
                        },
                        cancelUpload : function() {
                            this.$el.remove();
                        }
                    });

            /*
             * *******************************************************************
             * Downloads
             * *******************************************************************
             */

            var downloadsCollection = Backbone.Collection.extend({
                model : fileTransfer,
                initialize : function() {
                    this.bind('remove', this.check, this);
                    this.bind("change", this.cancel, this);
                },
                cancel : function(model) {

                    var msg = {
                        obj : {
                            mesgtype : "cancel",
                            service : "fmgr",
                            request : "read",
                            fname : model.get("name"),
                        }
                    };

                    this.trigger("removeDownload", msg);
                    this.remove(model);

                },
                check : function() {
                    if (this.isEmpty())
                        this.trigger("downloadsCompleted");
                }
            });

            /*
             * Downloads window with jqx window
             */

            var downloadWindow = Backbone.View
                    .extend({
                        el : $("#downloads"),
                        events : {},
                        initialize : function(opts) {

                            this.controller = opts.controller;
                            this.controller.bind("hidden", this.hide, this);

                            this.collection.bind('add', this.addDownload, this);
                            this.collection.bind("fileCompleted",
                                    this.removeDownload, this);
                            this.collection.bind("downloadsCompleted",
                                    this.hide, this);

                            this.dpr = $("#progress").percentageLoader({
                                width : 100,
                                height : 100,
                                progress : 0,
                                position : {
                                    x : 200,
                                    y : 400
                                },
                                animationType : 'slide'
                            });

                            this.$el.jqxWindow({
                                autoOpen : false,
                                showCloseButton : false,
                                showCollapseButton : true,
                                height : 300,
                                width : 310
                            });

                        },
                        render : function() {

                        },
                        hide : function() {
                            this.$el.jqxWindow('hide');
                            // $("#fmgrDloadsBtn").hide();
                        },
                        updateProgress : function(perc, progress) {
                            this.dpr.setProgress(perc.toFixed(2));
                            var model = this.collection.first();
                            if (!model)
                                return;

                            model.trigger('progress', {
                                percentage : perc,
                                progress : progress
                            });
                        },
                        addDownload : function(model) {
                            var file = new downloadFileView({
                                model : model,
                            });
                            this.$('#dloads').append(file.render().el);
                        },
                        removeDownload : function() {

                            var model = this.collection.first();
                            if (!model)
                                return;

                            model.trigger('remove');
                            this.collection.remove(model);
                        }
                    });

            /*
             * showing single download in list
             */
            var downloadFileView = Backbone.View
                    .extend({
                        className : 'download_file',
                        events : {
                            'click .dc' : "stopDownload"
                        },
                        initialize : function() {
                            this.model
                                    .bind("remove", this.cancelDownload, this);
                            this.model.bind("progress", this.updateProgress,
                                    this);

                            var name = this.model.get("name");
                            var size = utils.convBytes(this.model.get("size"));
                            this.$el
                                    .append(name
                                            + '<span class="cancel dc icon-remove-3"></span>'
                                            + '<div class="progressInfo"><span class="progressPercentage">0%</span> | <span class="progressCompleted"> 0B </span>/<span class="progressLoad"> '
                                            + size + '  </span></div>');
                        },
                        render : function() {
                            return this;
                        },
                        updateProgress : function(perc) {
                            this
                                    .$(".progressPercentage")
                                    .html(
                                            ((Math
                                                    .round(perc.percentage * 10000) / 100)
                                                    .toFixed(2))
                                                    + "%");
                            this.$(".progressCompleted").html(
                                    utils.convBytes(perc.progress, 2));
                        },
                        stopDownload : function() {
                            this.model.set({
                                cancel : true
                            });
                            // this.model.trigger('remove');
                        },
                        cancelDownload : function() {
                            this.$el.remove();
                        }
                    });

            /*
             * Bookmark collection
             * ************************************************************************************************
             */
            var FSModel = Backbone.Model.extend({
                idAttribute : 'path',
            });
            var FSCollection = Backbone.Collection.extend({
                model : FSModel,
                initialize : function() {

                },
                isBookmarked : function(path) {
                    return this.get(path)
                }

            });
            var bookmarksListView = Backbone.View.extend({
                events : {
                    "click .fmgr-add-bookmark" : "saveBookmark",
                    "click .fmgr-bookmark-list" : "showBookmarksList",
                    "click .fmgr-bookmark" : "hideBookmarkList",
                },
                initialize : function(opts) {
                    _.bindAll(this, "hideBookmarkList");

                    this.files = opts.files;
                    this.root = opts.root;
                    this.animation = "stoppped";
                    this.root.bind("bookmarks", this.addBookmarks, this);
                    $(document).bind("click", this.hideBookmarkList);
                    this.collection.bind("add", this.renderBookmark, this);
                    // this.getBookmarks();
                },
                check : function() {
                    this.$(".fmgr-add-bookmark").removeClass("icon-star")
                            .addClass("icon-star-2").data("ismarked", true);
                },
                uncheck : function() {
                    this.$(".fmgr-add-bookmark").removeClass("icon-star-2")
                            .addClass("icon-star").data("ismarked", false);
                },
                getBookmarks : function() {
                    var getBM_obj = {

                    }
                    // this.root.send(getBM_obj,this.addBookmarks);
                    // this.startAnimation();
                },
                renderBookmark : function(model) {
                    var bm = new bookmarkView({
                        model : model
                    });

                    $(bm.render().el).appendTo(this.$(".fmgr-bm-listPanel"));

                },
                startAnimation : function() {
                    // start animation
                    this.animation = "running";
                    var t = document.querySelector('#akorp-anim-template');
                    this.animTemp = $(t.content.cloneNode(true)).appendTo(
                            this.$(".fmgr-bm-listPanel"));
                },
                stopAnimation : function() {
                    if (this.animation == "running") {
                        this.animation = "stopped";
                        this.$(".fmgr-bm-listPanel").data("loaded", true);
                        this.animTemp.remove();
                    }
                },
                addBookmarks : function(bms) {
                    // this.stopAnimation();
                    for ( var bm in bms) {
                        var attrs = {};
                        attrs.path = bms[bm];
                        this.collection.add(attrs);
                    }
                    // this.collection.add(bms);
                },
                removeBookmarks : function(bms) {
                    for ( var bm in bms) {
                        var attrs = {};
                        attrs.path = bms[bm];
                        this.collection.remove(attrs.path);
                    }
                },
                add2Bookmarks : function() {
                    var currentDir = this.files.meta("cwd");
                    $(".fmgr-bm-newpanel").find(".bm-name").val(currentDir)
                            .end().find(".bm-path").val(currentDir);

                    $(".fmgr-bm-newpanel").dialog(
                            {
                                resizable : false,
                                height : 200,
                                modal : true,
                                title : "Add Folder Bookmark",
                                buttons : {
                                    "Save" : function() {

                                        // root.collection.send(add_obj,
                                        // root.handleNewFolderResponse);
                                        $(this).dialog("close")

                                    },
                                    Cancel : function() {
                                        $(this).dialog("close");
                                    }
                                },
                                open : function() {
                                    $(this).closest(".ui-dialog").find(
                                            ".ui-button:nth-child(2)")
                                            .addClass("btn redbtn");
                                    $(this).closest(".ui-dialog").find(
                                            ".ui-button:nth-child(1)")
                                            .addClass("btn blue");

                                }
                            });
                    $(".fmgr-bm-newpanel").find(".bm-name")[0].select();
                },
                saveBookmark : function() {
                    var currentDir = this.files.meta("cwd");
                    if (this.$(".fmgr-add-bookmark").data("ismarked")) {
                        this.removeBookmarks([ currentDir ]);
                        this.uncheck(currentDir);
                        // auth.removeBookmark(currentDir);
                    } else {
                        this.addBookmarks([ currentDir ]);
                        auth.addBookmark(currentDir);
                        this.check(currentDir);
                    }

                    // this.root.send(bm_obj,this.bookmarkAddResponse);
                },
                showBookmarksList : function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var isLoaded = this.$(".fmgr-bm-listPanel").data("loaded");
                    if (!isLoaded) {
                        this.getBookmarks();
                        this.showBM_list();
                    } else {
                        this.showBM_list();
                    }
                },
                showBM_list : function() {
                    if (this.collection.length)
                        this.$(".fmgr-bm-listPanel").show()
                },
                hideBookmarkList : function(e) {
                    // e.preventDefault();
                    this.$(".fmgr-bm-listPanel").hide();
                },
                bookmarkAddResponse : function() {

                }
            });

            var bookmarkView = Backbone.View
                    .extend({
                        events : {
                            "click" : "openWindow",
                            "click .bm-remove" : "removeBookmark",
                        },
                        className : "resultItem",
                        initialize : function() {

                            this.model
                                    .bind("remove", this.removeBookmark, this);
                            this.homeDir = this.getPathHome(this.model
                                    .get("path"));
                        },
                        render : function() {
                            var modelObj = this.model.toJSON();
                            var fIcon = $("<div/>").addClass(
                                    "akorp-mime-directory bm-mime-icon");
                            var path = $("<span/>").append(
                                    this.maskPath(modelObj.path));
                            var name = $("<span/>").append(
                                    this.getName(modelObj.path));
                            var bmInfo = $("<div/>").addClass("bm-info")
                                    .append();
                            var remove = $("<span/>").addClass(
                                    "icon-cross-2 akp-close-icon bm-remove");
                            this.$el.append(path).addClass("bookmark").append(
                                    remove);

                            return this;
                        },
                        maskPath : function(path) {
                            var clientExp = new RegExp(collection.cleintHome,
                                    'gi');
                            var cleintMatches = path.match(clientExp);
                            var groupMatches = path.match(new RegExp(
                                    collection.groupHome, 'gi'));
                            if (cleintMatches.length) {
                                path = path.replace(collection.cleintHome,
                                        "Home");
                            } else if (groupMatches.length) {
                                path = path.replace(collection.groupHome,
                                        "Group");
                            }
                            return path;
                        },
                        getPathHome : function(path) {
                            var clientExp = new RegExp(collection.cleintHome,
                                    'gi');
                            var cleintMatches = path.match(clientExp);
                            var groupMatches = path.match(new RegExp(
                                    collection.groupHome, 'gi'));
                            if (cleintMatches.length) {
                                return collection.cleintHome;
                            } else if (groupMatches.length) {
                                return collection.groupHome;
                            }
                            return false;
                        },
                        getName : function(path) {
                            if (path == collection.cleintHome
                                    || path == collection.groupHome)
                                return "Home";

                            return path.substr(path.lastIndexOf("/") + 1,
                                    path.length);
                        },
                        openWindow : function() {
                            collection.trigger("newwnd",
                                    this.model.toJSON().path, this.homeDir);
                        },
                        removeBookmark : function(e) {
                            if (e.stopPropagation)
                                e.stopPropagation();

                            this.$el.remove();
                            auth.removeBookmark(this.model.toJSON().path);
                        }
                    });

            /*******************************************************************
             * Master with container that has menu tree and browser MASTER
             * **********************************************************************************************************************
             */

            var MasterView = Backbone.View
                    .extend({
                        el : $("#container"),
                        events : {
                            'dragover #dropzone' : "handleDragOver",
                            'drop #dropzone' : "handleFileSelect",
                            "dragenter #dropzone" : "handleDragEnter",
                            "dragleave #dropzone" : "handleDragLeave",
                            // 'click #add_fl' : "createFile",
                            'click #add_fldr' : "createFolder",
                            'click #gettree' : "flipTree",
                            'click #ghome' : "toggleGroupFolder",
                            "click #phome" : "toggleGroupFolder",
                            'click #refresh' : "refreshView",
                            'click #home_folder' : "gotoHome",
                            'click #parent' : 'gotoParent',

                            "click .pathdir" : "gotoPath",
                            'click #fmgrUploadsBtn' : "showUploads",
                            "click #fmgrDloadsBtn" : "showDownloads",
                            "keyup #fmgrSearchBox" : "searchFiles",
                            "contextmenu" : "disablerightclick",
                            // "click .fmgr-trash" : "showTrash",
                            "click #upload_btn" : "handleBtnUpload",
                            "change #upload_input" : "handleFileSelect",

                        },
                        defults : {
                            treeView : false,
                            viewId : "container"
                        },
                        settings : {},
                        initialize : function(options) {
                            this.settings = $.extend({}, this.defults, options);
                            _.bindAll(this, "render", "routeReq", "gohome",
                                    "gotoPath", "tree", "uwmessage",
                                    "uploadPost", "handleNewFolderResponse",
                                    "disablerightclick", "respondNotification",
                                    "handleBtnUpload");

                            var ntfy_opts = {
                                el : $(".mt-menu.vault-tab"),
                                service : "file", // represents notification
                                // category thugluk
                                onNotificationClick : this.respondNotification,
                                className : "blue"
                            }

                            this.notifications = auth
                                    .notificationDialog(ntfy_opts);

                            this.collection.bind("setHome", this.gohome, this);
                            this.collection.bind("setGroup",
                                    this.handleGroupChange, this);
                            this.collection.bind("switchHome", this.switchHome,
                                    this);
                            this.collection.bind("downloadErr",
                                    this.downloadErr, this);
                            this.collection.bind("downloadPush",
                                    this.showDownloadsBtn, this);
                            this.collection.bind("error", this.handleError,
                                    this);
                            this.collection.bind("initialized", this.oninit,
                                    this);
                            this.collection.bind("notification",
                                    this.addNotification, this);
                            this.collection.bind("clear", this.clear, this);
                            // this.collection.bind("downloads_update",
                            // this.updateLoadEngine, this);

                            this.files = options.files;
                            this.files.bind("newfolder", this.createFolder,
                                    this);
                            this.files.bind("alertRemove", this.alertRemove,
                                    this);
                            this.files.bind("download", this.handleFileWrite,
                                    this);
                            this.files.bind("showPath", this.checkBookmark,
                                    this);
                            this.files.bind("showPath", this.showPath, this);
                            this.files.bind("showPath", this.rememberCWD, this);

                            this.files.bind("itemsCount", this.displayCount,
                                    this);
                            this.files.bind("isEmptyFolder",
                                    this.toggleEmptyFolderMsg, this);
                            this.files.bind("inHome", this.handleInHome, this);
                            this.files.bind("block", this.blockUI, this);
                            this.files.bind("unblock", this.unblockUI, this);
                            this.files.bind("gtkViewer", this.handleGtkViewer,
                                    this);

                            this.$el
                                    .bind("contextmenu", this.disablerightclick);

                            // this.worker = new
                            // SharedWorker('multiple_upload_worker.js');
                            // //parallel Uploads
                            this.worker = new SharedWorker('Upload_worker.js'); // serial
                            // Upload
                            this.worker.port.start();
                            this.worker.port.onerror = this.werror;
                            this.worker.port.onmessage = this.uwmessage;

                            this.uploadManager = {};

                            jQuery.event.props.push('dataTransfer');

                            this.uploads = new uploadsCollection;
                            this.uploadsView = new uploadWindow({
                                collection : this.uploads,
                                controller : this.collection,
                            })

                            this.uploads.bind("removeUpload", this.uploadPost,
                                    this);
                            this.uploads.bind("uploadsCompleted",
                                    this.handleUploadsCompleted, this);
                            this.collection.downloads.bind(
                                    "downloadsCompleted",
                                    this.handleDownloadsCompleted, this);

                            /*
                             * Gtk Viwer
                             */
                            this.gtkViewer = $(".gtkViewer").dialog({
                                width : "100%",
                                autoOpen : false,
                                modal : true,
                                minHeight : "800px",
                                open : this.onOpen,
                            });
                            this.gtkViewerFrame = document
                                    .getElementById('gtk-vwr-frame').contentWindow;

                            /*
                             * bookmarks manager
                             */

                            this.bookmarks = new FSCollection;
                            this.bookmarksList = new bookmarksListView({
                                el : this.$(".fmgr-bookmarkbar"),
                                collection : this.bookmarks,
                                files : this.files,
                                root : this.collection
                            });

                            /*
                             * Tree View
                             */
                            $("#nodes").hide();
                            // $("#nodes").jqxTree();
                            // $("#nodes").jqxTree('selectItem', $("#home")[0]);

                            // this.setRow();

                        },
                        handleDownloadsCompleted : function() {
                            $("#fmgrDloadsBtn").hide();
                        },
                        handleUploadsCompleted : function() {
                            $("#fmgrUploadsBtn").hide();
                            this.refreshView();
                        },
                        handleBtnUpload : function() {
                            var input = this.$("#upload_input");
                            input.click();
                        },
                        rememberCWD : function() {
                            var cwd = this.files.meta("cwd");
                            if (this.files.meta("home") == this.collection.cleintHome) {

                                this.collection.settings.clientCWD = cwd;
                            } else {
                                this.collection.settings.groupCWD = cwd;
                            }

                        },
                        showPath : function() {
                            var location = this.$(".vaultPath ul.pathdirs");

                            var cwd = this.files.meta("cwd");
                            var roots = this.files.getRoots(cwd);
                            location.empty();
                            for ( var i = 0; i < roots.length; i++)
                                location.append(
                                        $("<li/>").append(roots[i]["name"])
                                                .attr('data-pathid',
                                                        roots[i]["path"])
                                                .addClass("pathdir")).append(
                                        "<li>/ </li>");

                        },
                        handleGroupChange : function(dir) {
                            if (this.collection.getViewState() == "group") {
                                this.switchHome(dir, dir)
                            }
                        },
                        clear : function() {
                            this.notifications.clear();
                            if (this.collection.getViewState() == "group")
                                this.files.clear();
                        },
                        oninit : function() {
                            this.notifications.init();
                        },
                        respondNotification : function(obj) {
                            akp_ws.appView.navView
                                    .changeView(this.settings.viewId)
                            this.collection.FileBrowser({
                                file : obj.file,
                                home : this.files.getHomeFromPath(obj.file)
                            });
                        },
                        addNotification : function(notification) {
                            notification.addTop = true;
                            this.notifications.attachNotification(notification,
                                    "inc");
                        },
                        onOpen : function() {
                            var $dialog = $(this);
                            $dialog.closest(".ui-dialog").find(
                                    ".ui-dialog-titlebar").remove();

                            /*
                             * $dialog.dialog('widget').animate({ width:
                             * "+=300", left: "-=150" });
                             */

                            $dialog.css({
                                padding : "0"
                            }).closest(".ui-dialog").css({
                                padding : "0",
                                "border-radius" : "0px"
                            });
                            // get the last overlay in the dom
                            $dialogOverlay = $(".ui-widget-overlay").last();
                            // remove any event handler bound to it.
                            $dialogOverlay.unbind();
                            $dialogOverlay.click(function() {
                                // close the dialog whenever the overlay is
                                // clicked.
                                $dialog.dialog("close");
                            });
                        },
                        handleGtkViewer : function(msg) {
                            if (!msg.data)
                                return;

                            if (!this.gtkViewer.dialog("isOpen")) {
                                this.gtkViewer.dialog("open")
                            }

                            // var decodedMsg=window.atob(msg.data);

                            this.gtkViewerFrame.postMessage(msg.data,
                                    "http://www.antkorp.in/");

                        },
                        blockUI : function() {
                            var loadbar = $("<div/>")
                                    .append(
                                            '<span class="loadpercentage icon-spinner-3" style="color:#FFF" ></span>')
                                    .addClass("blocker blocker-anim").append(
                                            "Loading..").appendTo(this.$el)
                            var overlay = $("<div/>").appendTo(this.$el)
                                    .addClass("blocker blocker-overlay");
                        },
                        unblockUI : function() {
                            this.$(".blocker").remove();
                        },
                        handleInHome : function(isHome) {
                            if (isHome) {
                                this.$("#home_folder").attr("disabled", "");
                                this.$("#parent").attr("disabled", "");
                            } else {
                                this.$("#home_folder").removeAttr("disabled");
                                this.$("#parent").removeAttr("disabled");
                            }
                        },
                        toggleEmptyFolderMsg : function(isEmpty) {
                            if (isEmpty) {
                                var content = $("<div/>").addClass(
                                        "fmgrInstantMsg")
                                        .append("Empty Folder").hide();
                                this.$("#dropzone").prepend(content);
                                content.show("slide", {
                                    direction : "left"
                                });
                            } else {
                                this.$(".fmgrInstantMsg").remove();
                            }
                        },
                        displayCount : function(countStr) {
                            this.$(".countbar").html(countStr);
                        },
                        checkBookmark : function(dir) {
                            var result = this.bookmarks.isBookmarked(dir);
                            if (result) {
                                this.bookmarksList.check();
                            } else {
                                this.bookmarksList.uncheck();
                            }
                        },

                        disablerightclick : function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        },
                        setRow : function() {
                            var ch = this.$("#dropzone").width();
                            var iPR = Math.floor(ch / 102);
                            var str = iPR + "n + " + iPR;

                            this.$("#file-list li:nth-child(" + str + ")").css(
                                    {
                                        "clear" : "both"
                                    });
                        },
                        render : function() {

                        },
                        showTrash : function() {

                        },
                        routeReq : function(req) {
                            console.log(req.toJSON());

                        },
                        handleError : function(resp) {
                            noty({
                                layout : 'bottomRight',
                                theme : 'default',
                                type : 'error',
                                text : resp.estring,
                                timeout : 5000,
                                animation : {
                                    easing : "easeOutElastic",
                                }
                            })
                        },
                        searchFiles : function(e) {
                            e.stopPropagation();
                            var str = $(e.currentTarget).val();
                            this.files.trigger("search", str);
                            if (e.which == 13) {
                                $(e.currentTarget).select();
                            }
                        },
                        switchHome : function(cwd, home) {
                            this.$("#home").attr('data-path', cwd);
                            this.files.meta("home", home);
                            this.files.meta("cwd", cwd);
                            this.files.trigger("goPath");
                            this.collection.home = home;
                        },
                        gohome : function(dir) {

                            this.$("#home").attr('data-path', dir);
                            this.files.meta("home", dir);
                            this.files.meta("cwd", dir);
                            this.files.trigger("goHome");
                            this.collection.home = dir;
                        },
                        showUploads : function() {
                            if ($('#uploadwindow').jqxWindow('isOpen')) {
                                $('#uploadwindow').jqxWindow('hide')
                            } else {
                                $('#uploadwindow').jqxWindow('show')
                            }
                        },
                        showDownloads : function() {
                            if ($('#downloads').jqxWindow('isOpen')) {
                                $('#downloads').jqxWindow('hide')
                            } else {
                                $('#downloads').jqxWindow('show')
                            }
                        },
                        showDownloadsBtn : function() {
                            $("#fmgrDloadsBtn").show();
                        },
                        handleDragOver : function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';

                        },
                        handleDragEnter : function() {
                            this.$(".fmgr-drop-highlight").addClass("active");
                        },
                        handleDragLeave : function() {
                            this.$(".fmgr-drop-highlight")
                                    .removeClass("active");
                        },
                        tree : function(obj) {
                            var length = obj.direlements.length;
                            for ( var i = 0; i < length; i++) {
                                this.files.add(obj.direlements[i]);
                            }
                        },
                        updateLoadEngine : function(perc) {
                            this.downloadsView.updateProgress(perc);
                        },
                        werror : function(e) {
                            consloe.log('ERROR: Line ', e.lineno, ' in ',
                                    e.filename, ': ', e.message);
                        },

                        uploadPost : function(msg) {
                            if(msg.mesgtype=='error'){
                                this.handleDenyMsg(msg);
                            }
                            else
                            this.worker.port.postMessage(msg);
                        },
                        handleDenyMsg:function(){
                            var self=this;
                          $("<div/>").append("There is not enough space to upload file(s)").dialog({
                              height:150,
                              title:"Error",
                              modal:true,
                              resizable:false,
                              buttons:[{text:"Skip",
                                  "class":"btn btn-danger",
                                  click:function(){
                                      //this will cancel current upload
                                      self.uploads.cancel();
                                  $(this).dialog("close").remove();
                              }},/*{text:"Cancel",
                                  "class":"btn btn-primary",
                                  click:function(){
                                      $(this).dialog("close").remove();
                                  },
                              }*/]
                          });  
                        },
                        uwmessage : function(e) {
                            var dat = e.data.obj;

                            if (!e.data.obj) {
                                // console.log(e.data);
                            } else if (dat.mesgtype == 'request'
                                    || dat.mesgtype == 'cancel') {
                                var pcnt = e.data.prct;
                                /*
                                 * this.uploadsView.updateProgress(Math.round(pcnt) /
                                 * 100); this.collection.send(dat,
                                 * this.uploadPost);
                                 */

                                /*
                                 * var root=this;
                                 * this.uploadsView.updateProgress(dat.cookie,Math.round(pcnt) /
                                 * 100);
                                 * this.collection.send(dat,function(msg){root.uploadManager[dat.cookie].postMessage(msg)});
                                 * if(!dat.size){
                                 * this.uploadManager[dat.cookie].terminate(); }
                                 */

                                this.uploadsView.updateProgress(dat.cookie,
                                        parseFloat(pcnt * 100).toFixed(2),
                                        e.data.lastByte);

                                dat.uid = auth.loginuserid;
                                this.collection.send(dat, this.uploadPost);

                            } else if (dat.mesgtype == 'complete') {

                                this.uploads.trigger("fileCompleted",
                                        dat.cookie);

                                // $('#upload_status').find('div:eq(0)').remove();
                                /*
                                 * if ($('#upload_status div').length == 0) {
                                 * $('#uploadwindow').jqxWindow('hide');
                                 * $("#fmgrUploadsBtn").hide(); }
                                 */

                            }

                        },
                        handleFileWrite : function() {
                            var list = this.files.getSelected();
                            this.collection.trigger("download", list);
                        },
                        downloadErr : function(dfname) {
                            var data = "<strong>Directory is not supported!</strong><br><b>"
                                    + dfname + "</b> cannot be download.";

                            $("<div/>").attr('id', 'dlt_dialog')
                                    .append('<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>'
                                                    + data + '</p>').dialog({
                                        resizable : false,
                                        height : 140,
                                        position : [ 'right', "bottom" ],
                                        // modal : true,
                                        buttons : {
                                            OK : function() {
                                                $(this).dialog("close");
                                            }
                                        }
                                    });
                        },

                        handleFileSelect : function(ev) {

                            ev.stopPropagation();
                            ev.preventDefault();
                            this.handleDragLeave();
                            var length;
                            var src, isdir, septr, path_ext = [], q = 0;
                            var dname = this.files.meta("cwd");
                            if (ev.dataTransfer) {

                                // handling drag and drop files
                                length = ev.dataTransfer.items.length;

                                for ( var i = 0, f; i < length; i++) {
                                    var entry = ev.dataTransfer.items[i]
                                            .webkitGetAsEntry();

                                    this.traverseFileTree(entry)
                                }
                            } else if (ev.target) {
                                // handling input selected files;
                                length = ev.target.files.length;
                                for ( var i = 0, f; i < length; i++) {
                                    var entry = ev.target.files[i];

                                    this.uploadFile(entry, dname + "/");
                                }
                            }

                        },
                        traverseFileTree : function(item, path) {
                            var root = this;
                            var dname = root.files.meta("cwd");
                            path = path || "/";
                            if (!item.name.indexOf('.'))
                                return false; // reject hidden files

                            if (item.isFile) {
                                item.file(function(file) {
                                    root.uploadFile(file, dname + path);
                                });
                            } else if (item.isDirectory) {

                                this.handleFolderUpload(item, path, dname);

                            }

                        },
                        checkLimits:function(file){
                            if(file.size > this.collection.maxUploadLimit){
                                this.handleMaxSizeExceeds(file);
                                return false;
                            }
                            
                            return true;
                        },
                        handleMaxSizeExceeds:function(file){
                            var self=this;
                            $("<div/>").append( "<strong>"+ file.name +"</strong> of <strong>"+ utils.convBytes(file.size) +"</strong> is exceeds max upload limit.<br/>* you can upload max 500MB file only.").dialog({
                               title:"Error", 
                               resizable:true,
                               modal:true,
                               height:200,
                               buttons:[{
                                   text:"Skip",
                                   "class":"btn btn-primary",
                                   click:function(){
                                      // self.uploads.cancel();
                                    $(this).dialog("close").remove();
                               }}]
                            });
                        },
                        uploadFile : function(file, target) {
                            var root = this;

                            // file name start with . wont accept
                            if (!file.name.indexOf('.'))
                                return false;
                            
                            if(!this.checkLimits(file))
                                return false;

                            var cookie = akp_ws.createUUID();
                            var postmsg = {
                                'mesgtype' : 'file_list',
                                'files' : file,
                                'dname' : target + file.name,
                                "cookie" : cookie,
                                "uid" : auth.loginuserid
                            }
                            root.uploadPost(postmsg);

                            root.uploads.add({
                                id : cookie,
                                name : file.name,
                                dname : postmsg.dname,
                                type : file.type,
                                size : file.size
                            });

                            this.$('#fmgrUploadsBtn').show();
                        },
                        handleFileUpload : function() {

                        },
                        handleFolderUpload : function(item, path, dname) {
                            var root = this;
                            var guid = akp_ws.createUUID();
                            var add_obj = {
                                mesgtype : "request",
                                service : "fmgr",
                                request : 'create_dir',
                                cookie : guid,
                                source : dname,
                            }

                            var spath = item.fullPath;
                            var sep = spath.lastIndexOf('/');
                            var source_ext = spath.substring(0, sep);
                            add_obj.source = dname + source_ext;
                            add_obj.srcargs = [ spath.substring(sep + 1,
                                    spath.length) ];

                            root.collection.send(add_obj, function(resp) {
                                // Got Response
                                root.handleRecursiveEntries(root, item, path);
                            });

                        },
                        handleRecursiveEntries : function(root, item, path) {

                            var dirReader = item.createReader();
                            dirReader.readEntries(function(entries) {
                                for ( var i = 0; i < entries.length; i++) {
                                    root.traverseFileTree(entries[i], path
                                            + item.name + "/");
                                }
                            });
                        },
                        handleNewFolderResponse : function(resp) {
                            console.log(resp);
                            this.files.trigger("refresh");
                        },
                        alertRemove : function() {
                            var root = this;
                            $("<div/>")
                                    .attr('id', 'dlt_dialog')
                                    .append(
                                            '<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>These items will be permanently deleted and cannot be recovered. Are you sure?</p>')
                                    .dialog(
                                            {
                                                resizable : false,
                                                height : 140,
                                                modal : true,
                                                buttons : {
                                                    "Delete all items" : function() {

                                                        root.trigger("remove");
                                                        $(this).dialog("close")
                                                                .remove();
                                                    },
                                                    Cancel : function() {
                                                        $(this).dialog("close")
                                                                .remove();
                                                    }
                                                }
                                            });
                        },
                        createFile : function() {
                            var root = this;

                            $('<div/>')
                                    .addClass('dialogClass')
                                    .append(
                                            '<p><span style="float:left; margin:0 7px 20px 0;"> </span>Enter The File Name:<input type="text" id="flname"></p>')
                                    .dialog(
                                            {
                                                resizable : false,
                                                title : 'Prompt',
                                                height : 170,
                                                modal : true,
                                                buttons : [
                                                        {
                                                            text : "Create",
                                                            click : function() {
                                                                if ($(
                                                                        'input#flname')
                                                                        .val() != '') {
                                                                    var filename = [ $(
                                                                            'input#flname')
                                                                            .val() ];
                                                                    root.files
                                                                            .createFile(
                                                                                    filename,
                                                                                    root.handleNewFileResponse);
                                                                    $(this)
                                                                            .dialog(
                                                                                    "close")
                                                                            .remove();
                                                                }
                                                            },
                                                            "class" : "btn-btn-success",
                                                        },
                                                        {
                                                            "text" : "Cancel",
                                                            click : function() {
                                                                $(this)
                                                                        .dialog(
                                                                                "close")
                                                                        .remove();
                                                            },
                                                            "class" : "btn btn-danger",
                                                        } ]
                                            });

                        },
                        createFolder : function() {
                            var root = this;

                            $('<div/>')
                                    .addClass('dialogClass')
                                    .append(
                                            "<p><span style='float:left; margin:0 7px 20px 0;'> </span> Folder Name:<input type='text' id='flname'></p>")
                                    .dialog(
                                            {
                                                resizable : false,
                                                height : 170,
                                                modal : true,
                                                buttons : [
                                                        {
                                                            text : "Create",
                                                            click : function() {
                                                                if ($(
                                                                        'input#flname')
                                                                        .val() != '') {
                                                                    var foldername = [ $(
                                                                            'input#flname')
                                                                            .val() ];

                                                                    root.files
                                                                            .createFolder(
                                                                                    foldername,
                                                                                    root.handleNewFolderResponse);
                                                                    $(this)
                                                                            .dialog(
                                                                                    "close")
                                                                            .remove();
                                                                }
                                                            },
                                                            "class" : "btn btn-success",
                                                        },
                                                        {
                                                            "text" : "Cancel",
                                                            click : function() {
                                                                $(this)
                                                                        .dialog(
                                                                                "close")
                                                                        .remove();
                                                            },
                                                            "class" : "btn btn-danger",
                                                        } ],
                                                open : function() {
                                                    $(this)
                                                            .closest(
                                                                    ".ui-dialog")
                                                            .find(
                                                                    ".ui-button:nth-child(2)")
                                                            .addClass(
                                                                    "btn redbtn");
                                                    $(this)
                                                            .closest(
                                                                    ".ui-dialog")
                                                            .find(
                                                                    ".ui-button:nth-child(1)") // the
                                                            // first
                                                            // button
                                                            .addClass(
                                                                    "btn blue");

                                                }
                                            });

                        },
                        toggleGroupFolder : function(e) {

                            $("#phome,#ghome").removeClass("btn-active active");
                            $(e.currentTarget).addClass("btn-active active");
                            var folder = $(e.currentTarget).attr("id");

                            this.collection.trigger("changeFolder", folder);

                        },
                        refreshView : function() {
                            this.files.trigger("refresh");
                        },
                        gotoPath : function(e) {
                            var id = $(e.target).attr("data-pathid");
                            // var dir = this.roots[id];
                            this.files.meta("cwd", id);

                            this.files.trigger("goPath");
                        },
                        gotoHome : function() {

                            this.files.trigger("goHome");
                            // var dir=this.files.meta("home")

                            // this.meta("cwd",dir);
                            // this.files.getTree();

                        },
                        gotoParent : function() {
                        
                            if (this.files.meta("cwd") == this.files
                                    .meta("home"))
                                return;

                            if (this.files.context.parent) {
                                this.files.meta("cwd",
                                        this.files.context.parent);
                                this.files.getTree();
                            }

                            this.files.trigger("goParent");
                        },
                        flipTree : function() {
                            this.$('#nodes').fadeToggle();
                        },
                    });

            /*
             * Tree View for standard file Browser
             */

            var TreeZone = Backbone.View.extend({
                el : $("#nodes"),
                initialize : function() {
                    this.isparentSource = false;
                    _.bindAll(this, "render", "update", "selectItem");
                    this.collection.bind("add", this.list, this);
                    this.collection.bind("goParent", this.getParent, this);
                    this.collection.bind("goHome", this.getHome, this);
                    this.collection.bind("refresh", this.refresh, this);
                    this.$el.bind('select', this.selectItem);
                    // this.collection.bind("change", this.update, this)
                },
                render : function() {

                },
                update : function(model) {
                    console.log(model);
                },
                refresh : function() {
                    var selectedItem = $('#nodes').jqxTree('selectedItem');
                    if (selectedItem != null)
                        this.removeTreeItems(selectedItem.element);
                    else
                        this.removeTreeItems($("#home")[0]);

                    this.collection.getTree();
                },
                getHome : function() {

                    this.removeTreeItems($("#home")[0]);
                    // $("#nodes").jqxTree("selectItem", $("#home")[0]);
                    this.collection.getTree();

                },
                getParent : function() {
                    this.isparentSource = true;
                    var selectedItem = $('#nodes').jqxTree('selectedItem');
                    if (selectedItem)
                        $("#nodes").jqxTree("selectItem",
                                selectedItem.parentElement);
                    else
                        $("#nodes").jqxTree("selectItem", $("#home")[0]);

                },
                getHtml : function(elem) {

                    return $("<p/>").append($(elem).clone()).html();
                },
                selectItem : function(event) {
                    if (this.isparentSource) {
                        this.isparentSource = false;
                        return;
                    }
                    var args = event.args;
                    var item = $(this.el).jqxTree('getItem', args.element);

                    if (!item)
                        return;

                    var cid = $(item.element).find("span.dirnode").attr(
                            "data-cid");

                    var model = this.collection.get(cid);
                    if (!model) {
                        this.collection.trigger("goHome");

                    } else if (!model.get("isByView")) {
                        this.collection.closeOpened();
                        model.set({
                            isOpened : true
                        });
                    }
                },
                removeTreeItems : function(selectedItem) {

                    if (selectedItem != null) {
                        var children = $(selectedItem).find('li');
                        var count = children.length;
                        for ( var i = 0; i < count; i += 1) {
                            if (i < count - 1) {
                                $('#nodes').jqxTree('removeItem', children[i],
                                        false);
                            } else {
                                $('#nodes').jqxTree('removeItem', children[i],
                                        true);
                            }
                        }
                    }

                },
                getSelectedItem : function() {
                    var selectedItem = $('#nodes').jqxTree('selectedItem');
                    if (selectedItem != null) {
                        // console.log($(selectedItem.element).length);
                        return selectedItem.element;
                    } else {
                        var treeItems = $('#nodes').jqxTree('getItems');
                        if (treeItems)
                            var firstItem = treeItems[0];

                        return $("#home")[0];
                        // firstItem.element;
                    }
                },
                list : function(file) {

                    if (file.get("isdir") != "true")
                        return;

                    var node = new TreeNode({
                        model : file
                    });
                    var newItem = this.getHtml(node.render().el);

                    var element = this.getSelectedItem();

                    $('#nodes').jqxTree('addTo', {
                        html : newItem,
                        cid : file.cid
                    }, element);
                    $('#nodes').jqxTree('expandItem', element);

                    // $(this.el).append(node.render().el);
                }
            })
            var TreeNode = Backbone.View
                    .extend({
                        tagName : "span",
                        className : "ndelem dirnode",
                        events : {
                            "click" : "selectNode",
                        },
                        initialize : function() {

                            _
                                    .bindAll(this, "render", "getChange",
                                            "selectNode");
                            this.model.bind("change", this.getChange, this);

                            $(this.el).append(this.model.get("fname")).attr({
                                "data-cid" : this.model.cid
                            })// .bind("click",this.selectNode);

                        },
                        render : function() {
                            this.delegateEvents();
                            return this;
                        },
                        getChange : function(model) {
                            var diff = model.changedAttributes();
                            for ( var att in diff) {
                                switch (att) {
                                case 'isOpened':
                                    this.handleIsOpenedChange(model, att);
                                    break;
                                }
                            }
                        },
                        handleIsOpenedChange : function(model, att) {
                            if (model.get(att)) {

                                var elementByCid = $("#nodes").find(
                                        "span[data-cid=" + model.cid + "]")
                                        .parent()[0] ? $("#nodes").find(
                                        "span[data-cid=" + model.cid + "]")
                                        .parent()[0].parentElement : "";

                                if (!elementByCid)
                                    return;

                                $("#nodes").jqxTree('selectItem', elementByCid);
                                this.clearOld(elementByCid);
                            }
                        },
                        selectNode : function(e) {
                            e.stopPropagation();

                            this.model.set({
                                isOpened : true
                            });
                        },
                        clearOld : function(selectedItem) {
                            // $(this.el).parent().next("ul").remove();

                            if (selectedItem != null) {
                                var children = $(selectedItem).find('li');
                                var count = children.length;
                                for ( var i = 0; i < count; i += 1) {
                                    if (i < count - 1) {
                                        $('#nodes').jqxTree('removeItem',
                                                children[i], false);
                                    } else {
                                        $('#nodes').jqxTree('removeItem',
                                                children[i], true);
                                    }
                                }
                            }

                        }
                    });

            /*
             * browser View for all containers
             */
            var FilesZone = Backbone.View
                    .extend({

                        events : {
                        // "contextmenu" : "cmenu"
                        // "mousedown ":"unselectFiles",
                        },
                        defaults : {
                            fileOpen : true,
                            contextMenu : true,
                            _fileSelected : false,
                            selectFile : "",
                        },
                        settings : {},
                        initialize : function(opts) {
                            this.settings = $.extend({}, this.defaults, opts);
                            this.isSelector = opts.menu;
                            _.bindAll(this, "render", "update", "cmenu");
                            if (!opts.menu) {
                                // this.delegateEvents({"contextmenu":"cmenu"})
                                this.$el.bind({
                                    "contextmenu" : this.cmenu
                                });
                            }

                            this._makeSelectable();

                            this.collection.bind("add", this.list, this);
                            this.collection.bind("change", this.update, this);
                            this.collection.bind("goHome", this.render, this);
                            this.collection.bind("goParent", this.render, this);
                            this.collection.bind("goPath", this.render, this);
                            this.collection.bind("refresh", this.render, this);
                            this.collection.bind("itemsCount",
                                    this.displayCount, this);
                            this.collection.bind("question",
                                    this.handleQuestionMsg, this);
                            this.collection.bind("clear", this.clear, this);

                        },
                        _makeSelectable : function() {
                            var items = this.collection;
                            this.$el.selectable({
                                filter : 'li',
                                cancel : ".fsdiv,.fname, .akorp-mime",
                                selected : function(event, ui) {
                                    $(ui.selected).each(function() {// .toggleClass("selected")
                                        cid = $(this).data("cid");
                                        var model = items.get(cid);
                                        model.set({
                                            isSelected : true
                                        })
                                    });

                                },
                                unselected : function(event, ui) {
                                    $(ui.unselected).each(function() {// .removeClass("selected")
                                        cid = $(this).data("cid");
                                        var model = items.get(cid);
                                        model.set({
                                            isSelected : false
                                        })
                                    });
                                },
                            }).sortable();
                        },
                        unselectFiles : function() {
                            this.collection.unselect();
                        },
                        clear : function() {
                            this.$el.empty();
                        },
                        render : function() {
                            this.$el.empty();
                            return this;
                        },
                        displayCount : function(str) {
                            this.$(".countbar").html(str)
                        },
                        update : function(model) {
                            var diff = model.changedAttributes();
                            for ( var att in diff) {
                                switch (att) {
                                case 'isOpened':
                                    if (model.get(att)) {
                                        this.render();
                                    }
                                    break;
                                }
                            }

                        },
                        handleQuestionMsg : function(resp) {
                            var selfCol = this.collection;

                            var button = $('<label for="check"><input type="checkbox" id="check" />Apply this answer for all</label>');

                            // $('#check').button();

                            var msg = $("<p/>").css({
                                "word-wrap" : "break-word"
                            }).append(resp.estring).after("<br/>");

                            $('<div/>')
                                    .append(msg)
                                    .append(button)
                                    .dialog(
                                            {
                                                resizable : false,
                                                height : 'auto',
                                                modal : true,
                                                title : "File Operation",
                                                // position : ['right',
                                                // "bottom"],
                                                closeOnEscape : false,
                                                open : function(event, ui) {
                                                    $(
                                                            ".ui-dialog-titlebar-close",
                                                            ui.dialog || ui)
                                                            .hide();
                                                },
                                                buttons : [
                                                        {
                                                            "text" : "Yes",
                                                            "class" : "btn btn-primary",
                                                            click : function() {

                                                                var answer = $(
                                                                        '#check')
                                                                        .is(
                                                                                ':checked') ? 'yesall'
                                                                        : 'yes';
                                                                // root.send(q_obj,root.handleFileOperationResponse);
                                                                selfCol
                                                                        .sendQuestionResponse(
                                                                                resp,
                                                                                answer);
                                                                $(this)
                                                                        .dialog(
                                                                                "close");
                                                            },

                                                        },
                                                        {
                                                            text : 'No',
                                                            "class" : "btn btn-danger",
                                                            click : function() {
                                                                var answer = $(
                                                                        '#check')
                                                                        .is(
                                                                                ':checked') ? 'noall'
                                                                        : 'no';
                                                                // root.send(q_obj,root.handleFileOperationResponse);

                                                                selfCol
                                                                        .sendQuestionResponse(
                                                                                resp,
                                                                                answer);
                                                                $(this)
                                                                        .dialog(
                                                                                "close");

                                                            },

                                                        } ]
                                            });
                        },
                        list : function(file) {
                            var fileview = new File({
                                model : file,
                                collection : this.collection,
                                menu : this.isSelector
                            })

                            var fileObj = file.toJSON();
                            if (fileObj.isdir == "true") {
                                this.$el.prepend(fileview.render().el)
                            } else {
                                // console.log(this.$el.length);
                                this.$el.append(fileview.render().el);
                            }

                            // selecting file if argument passed to selectFile
                            if (this.settings.selectFile
                                    && !this.settings._fileSelected) {
                                // only once first the file selectable
                                if (fileObj.path == this.settings.selectFile) {
                                    fileview.select({});

                                    this.settings._fileSelected = true;
                                }
                            }
                        },
                        cmenu : function(e) {
                            e.preventDefault();

                            e.stopPropagation();
                            cmenu.render({
                                type : "workspace",
                                model : this.model,
                                collection : this.collection,
                                psX : e.pageX,
                                psY : e.pageY - 50
                            });
                            return false;
                        }
                    });

            /*
             * Singe file View
             */
            var File = Backbone.View
                    .extend({
                        tagName : "li",
                        ClassName : "file-div",
                        events : {
                            'click' : "select",
                            'dblclick' : 'open',
                        // "mousedown ":"unselectFiles",
                        // 'contextmenu' : "cmenu"
                        },
                        defaults : {
                            allowFileOpen : true,
                            contextMenu : true,
                            showInfo : true,
                        },
                        settings : {

                        },
                        initialize : function(opts) {

                            _.bindAll(this, "render", "getChange", "cmenu",
                                    "handleGtkOpen");
                            this.model.bind("change", this.getChange, this);
                            this.model.bind("open", this.open, this);
                            this.settings = $.extend({}, this.defaults, opts);
                            if (!opts.menu) {
                                // this.delegateEvents({"contextmenu":"cmenu"})
                                this.$el.bind("contextmenu", this.cmenu);
                                this.bindFeatures();
                            }

                            var data = this.model.toJSON();
                            $(this.el).attr("data-cid", this.model.cid);

                            var mimeclass = utils.mime2class(data.type);
                            data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"
                                    : mimeclass;
                            data["size"] = utils.convBytes(data.size);
                            this.template = $("#file-template").tmpl([ data ]);

                        },
                        render : function() {
                            $(this.el).addClass(this.ClassName).append(
                                    this.template);
                            return this;

                        },
                        bindFeatures : function() {
                            var root = this;
                            $(this.el).draggable(
                                    {
                                        revertDuration : 10,
                                        revert : true,
                                        start : function(e, ui) {
                                            // ui.helper.addClass("selected
                                            // ui-selected");
                                            if (!root.model.get("isSelected"))
                                                root.select(e);

                                        },
                                        stop : function(e, ui) {
                                            $(this).parent().children(
                                                    'li.selected').css({
                                                top : 0,
                                                left : 0
                                            });
                                        },
                                        drag : function(e, ui) {
                                            $(this).parent().children(
                                                    'li.selected').css({
                                                top : ui.position.top,
                                                left : ui.position.left
                                            });
                                        }
                                    }).droppable(
                                    {
                                        // 'disable' : dsbl,
                                        accept : '.file-div',
                                        greedy : true,
                                        drop : function() {
                                            if (root.model.get("isdir")) {

                                                root.collection.trigger("cut");
                                                root.collection.trigger(
                                                        "paste", root.model
                                                                .get("path"))

                                            }
                                        }
                                    })
                        },
                        select : function(e) {

                            if (e.ctrlKey) {
                                var st = this.model.get("isSelected");
                                this.model.set({
                                    isSelected : !st
                                });
                                // $(this.el).toggleClass('selected ');
                            } else {
                                this.collection.unselect();
                                this.model.set({
                                    isSelected : true
                                });

                                // $(this.el).addClass('selected ui-selected');
                            }
                        },
                        getChange : function(model) {
                            var diff = model.changedAttributes();
                            for ( var att in diff) {
                                switch (att) {
                                case 'isSelected':
                                    if (model.get(att))
                                        $(this.el).toggleClass(
                                                'selected ui-selected');
                                    else {
                                        $(this.el).removeClass(
                                                "selected ui-selected");
                                    }

                                    break;
                                }
                            }
                        },
                        open : function() {
                            this.collection.unselect();
                            if (this.model.get("isdir") == "true") {

                                if (!this.model.get("isOpened")) {
                                    this.collection.closeOpened();
                                    this.model.set({
                                        isByView : true
                                    })
                                    this.model.set({
                                        isOpened : true
                                    });
                                }
                            } else {
                                this.handleReadableFileOpen();
                            }
                        },
                        handleReadableFileOpen : function() {
                            var entry = this.model.toJSON();
                            // console.log(entry);
                            var type = $.trim(entry.type);
                            if (type.split("/")[0] == "image") {

                                this.showImagePreview(entry)

                            } else if (type == "application/pdf") {
                                // var pdfjs = require("pdfOpener");
                                // Opening PDF Documents using pdfjs
                                this.handlePDFFileOpen(entry);
                            } else if (type == "video/mp4"
                                    || type == "video/webm") {
                                // this.handleVideoFileOpen(entry);
                                // HTML5 Mediasource API is still under
                                // implementation
                                // so these feature is quit for now
                            } else if (type == "application/javascript"
                                    || type == "application/json"
                                    || type.split("/")[0] == "text"
                                    || type == "application/x-sh") {
                                this.handleTextFilesOpen(entry);
                                // this.handleOpenDocumentFilesOpen(entry);

                            } else if (type == "application/vnd.oasis.opendocument.presentation"
                                    || type == "application/vnd.oasis.opendocument.text"
                                    || type == "application/vnd.oasis.opendocument.graphics") {
                                this.handleOpenDocumentFilesOpen(entry);
                                // console.log("")
                            }
                        },
                        handleOpenDocumentFilesOpen : function(entry) {
                            this.collection.openGtkFile(entry.path,
                                    this.handleGtkOpen);
                        },
                        handleGtkOpen : function(msg) {
                            // console.log(msg);
                            this.collection.trigger("gtkViewer", msg);
                        },
                        handlePDFFileOpen : function(entry) {
                            var self = this;

                            /*
                             * Direct URL implementation Permisssion Error
                             */

                            // pdfjs.open("../../.."+entry.path);
                            /*
                             * Getting CORS error with file system file
                             */

                            /*
                             * this.collection.trigger("block");
                             * 
                             * var
                             * obj=akp_ws.get({fname:entry.path,service:"fmgr",request:"read",mesgtype:"request",size:1024});
                             * obj.oncomplete=function(url){ //var canvas=$("<canvas/>").attr({"id":"the-canvas",height:500,width:500}).appendTo("body");
                             * self.collection.trigger("unblock");
                             * pdfjs.open(url); };
                             */

                            /*
                             * Using File reader
                             */
                            this.collection.trigger("block");
                            var reader = new FileReader();
                            reader.onload = function(e) {
                                var result = e.target.result;
                                var uInt8Arr = new Uint8Array(result);
                                self.collection.trigger("unblock");
                                pdfjs.open(uInt8Arr);

                            }

                            var obj = akp_ws.get({
                                fname : entry.path,
                                service : "fmgr",
                                request : "read",
                                mesgtype : "request",
                                size : 1024
                            });
                            obj.oncomplete = function(url, file) {
                                reader.readAsArrayBuffer(file);
                            }

                        },
                        handleTextFilesOpen : function(entry) {
                            var self = this;

                            var loadbar = $("<div/>")
                                    .append(
                                            '<span class=" loadpercentage icon-spinner-3"></span>')
                                    .append("Loading..").addClass("loadspan");
                            var $dialog = $("<div/>").append(loadbar).attr(
                                    "data-loaded", "false").dialog({
                                modal : true,
                                height : "600",
                                width : "700",
                                open : self.dialogOpenWithoutTitle,
                                close : function(e, u) {
                                    $(this).remove();
                                },

                            });

                            var reader = new FileReader();
                            reader.onload = function(e) {
                                var result;
                                // if(entry.type == "text/html")
                                result = utils.htmlEscape(e.target.result);
                                // else
                                // result=e.target.result;
                                // var
                                // viewer=$("#text-viewer-template").tmpl([{fname:entry.fname,text:result}]);
                                var viewer = new TextViewer({
                                    entry : entry,
                                    result : result
                                });
                                $dialog.attr("data-loaded", "true").find(
                                        ".loadspan ").remove().end().append(
                                        viewer.render().$el);
                                // .append("<pre>'"+result+"'</pre>");

                            }

                            var obj = akp_ws.get({
                                fname : entry.path,
                                service : "fmgr",
                                request : "read",
                                mesgtype : "request",
                                size : 1024
                            });
                            obj.oncomplete = function(url, file) {
                                reader.readAsText(file);
                            }

                        },
                        handleVideoFileOpen : function(entry) {
                            var type = entry.type;
                            var self = this;
                            var video = document.createElement("video");
                            var mediaSource = new MediaSource();
                            video.controls = true;
                            video.src = window.URL.createObjectURL(mediaSource);

                            mediaSource
                                    .addEventListener(
                                            'webkitsourceopen',
                                            function(e) {
                                                var sourceBuffer = mediaSource
                                                        .addSourceBuffer(type
                                                                + '; codecs="vorbis,vp8"');
                                                var obj = akp_ws.get({
                                                    fname : entry.path,
                                                    service : "fmgr",
                                                    request : "read",
                                                    mesgtype : "request",
                                                    size : 1024
                                                });
                                                obj.onstarted = function(url) {
                                                    self.showVideo(video, url)
                                                };
                                                obj.onBlobRecieved = function(
                                                        chunk) {
                                                    chunk.type = type;
                                                    sourceBuffer
                                                            .append(new Uint8Array(
                                                                    chunk));
                                                }
                                                obj.oncomplete = function(url) {
                                                    video.play();
                                                    // self.showVideo(video,
                                                    // url)
                                                }
                                            }, false);

                        },
                        showImagePreview : function(entry) {
                            var self = this;
                            var obj = akp_ws.get({
                                fname : entry.path,
                                service : "fmgr",
                                request : "read",
                                mesgtype : "request",
                                size : 1024
                            });
                            var loadbar = $("<div/>")
                                    .append(
                                            '<span class=" loadpercentage icon-spinner-3"></span>')
                                    .append("Loading..").addClass("loadspan");
                            var $dialog = $("<div/>").append(loadbar).attr(
                                    "data-loaded", "false").dialog({
                                modal : true,
                                // height:200,
                                // width:300,
                                title : entry.fname,
                                open : this.dialogOpen,
                                close : function(e, u) {
                                    $(this).remove();
                                },
                            });
                            obj.oncomplete = function(url) {
                                var scaledimg;
                                var img = new Image();
                                var timer = setTimeout(
                                        function() {

                                            var errMsg = $("<div/>")
                                                    .css(
                                                            {
                                                                "text-align" : "center",
                                                                "line-height" : "25px",
                                                                "color" : "orange",
                                                                "font-size" : "20px"
                                                            })
                                                    .append(
                                                            "Oops! something wrong. The file you are trying to access is currepted.");
                                            $dialog.attr("data-loaded", "true")
                                                    .find(".loadspan ")
                                                    .remove().end().append(
                                                            errMsg);
                                        }, 5000);

                                img.onload = function() {
                                    clearTimeout(timer);
                                    // scaledimg=self.scaleImage(img);
                                    scaledimg = self.calculateAspectRatioFit(
                                            img.width, img.height, 500, 500);

                                    $(img).css({
                                        "height" : scaledimg.height,
                                        "width" : scaledimg.width
                                    });

                                    var imageFrame = $("<div/>").addClass(
                                            "akp-center").append(img).css({
                                        "padding" : "10px "
                                    });

                                    // var
                                    // title=$("<span/>").append(entry.fname).css({"padding":"0px
                                    // 10px"});
                                    $dialog.attr("data-loaded", "true").find(
                                            ".loadspan ").remove().end()
                                            .append(imageFrame);// .append(title);

                                    // applying new height
                                    $dialog.dialog({
                                        // "width":scaledimg[0].width+40,
                                        // "height":scaledimg[0].height+60,
                                        width : scaledimg.width + 40,
                                        height : scaledimg.height + 60,
                                    });
                                };
                                img.src = url;

                                // some images not rendering they may be
                                // currupted
                            }

                        },
                        imgLoadErr : function() {

                        },
                        calculateAspectRatioFit : function(srcWidth, srcHeight,
                                maxWidth, maxHeight) {

                            var ratio = [ maxWidth / srcWidth,
                                    maxHeight / srcHeight ];
                            ratio = Math.min(ratio[0], ratio[1]);

                            return {
                                width : srcWidth * ratio,
                                height : srcHeight * ratio
                            };
                        },

                        scaleImage : function(el) {
                            return $(el).each(function() {
                                // var maxWidth = $(this).parent().width(); //
                                // Max width for the image
                                // var maxHeight = $(this).parent().height(); //
                                // Max height for the image

                                var maxWidth = 500; // Max width for the image
                                var maxHeight = 500; // Max height for the
                                // image
                                var ratio = 0; // Used for aspect ratio
                                var width = this.width; // Current image width
                                var height = this.height; // Current image
                                // height

                                // Check if the current width is larger than the
                                // max
                                if (width > maxWidth) {
                                    ratio = maxWidth / width; // get ratio for
                                    // scaling image
                                    $(this).css("width", maxWidth); // Set new
                                    // width
                                    $(this).css("height", height * ratio); // Scale
                                    // height
                                    // based
                                    // on
                                    // ratio
                                    height = height * ratio; // Reset height
                                    // to match
                                    // scaled image
                                    width = width * ratio; // Reset width to
                                    // match scaled
                                    // image
                                }

                                // Check if current height is larger than max
                                if (height > maxHeight) {
                                    ratio = maxHeight / height; // get ratio for
                                    // scaling image
                                    $(this).css("height", maxHeight); // Set
                                    // new
                                    // height
                                    $(this).css("width", width * ratio); // Scale
                                    // width
                                    // based
                                    // on
                                    // ratio
                                    width = width * ratio; // Reset width to
                                    // match scaled
                                    // image
                                }

                            });
                        },
                        dialogOpenWithoutTitle : function() {
                            var $dialog = $(this);
                            $dialog.closest(".ui-dialog").find(
                                    ".ui-dialog-titlebar").remove();

                            $dialog.css({
                                padding : "0"
                            }).closest(".ui-dialog").css({
                                padding : "0"
                            });
                            // get the last overlay in the dom
                            $dialogOverlay = $(".ui-widget-overlay").last();
                            // remove any event handler bound to it.
                            $dialogOverlay.unbind();
                            $dialogOverlay.click(function() {
                                // close the dialog whenever the overlay is
                                // clicked.
                                // if($dialog.attr("data-loaded") == "true")
                                $dialog.dialog("close");
                            });
                        },
                        dialogOpen : function() {
                            var $dialog = $(this);
                            // $dialog.closest(".ui-dialog").find(".ui-dialog-titlebar").remove();

                            $dialog.css({
                                padding : "0"
                            }).closest(".ui-dialog").css({
                                padding : "0"
                            });
                            // get the last overlay in the dom
                            $dialogOverlay = $(".ui-widget-overlay").last();
                            // remove any event handler bound to it.
                            $dialogOverlay.unbind();
                            $dialogOverlay.click(function() {
                                // close the dialog whenever the overlay is
                                // clicked.
                                // if($dialog.attr("data-loaded") == "true")
                                $dialog.dialog("close");
                            });
                        },
                        showVideo : function(video, url) {

                            $("<div/>").append(video).dialog({
                                modal : true,
                                height : "500",
                                width : "500",
                                buttons : {
                                    "close" : function() {
                                        $(this).dialog("close").remove();
                                    }
                                }
                            });

                        },
                        cmenu : function(e) {
                            e.preventDefault();

                            e.stopPropagation();

                            if (!this.model.get("isSelected"))
                                this.select(e);

                            var isdir = this.model.get("isdir");
                            var type = isdir == "true" ? "folder" : "file";
                            cmenu.render({
                                type : type,
                                model : this.model,
                                collection : this.collection,
                                psX : e.pageX,
                                psY : e.pageY - 40
                            });
                            return false;

                        }
                    });

            var TextViewer = Backbone.View.extend({
                events : {
                    "click .tv-zoom-plus" : "zoomIn",
                    "click .tv-zoom-minus" : "zoomOut",
                    'click .text-edit':"enableEdit",
                    "click .text-save": "saveFile",

                },
                defaults : {
                    zoomValue : 13,
                    maxZoomVal : 20,
                    minZoomVal : 9,
                },
                settings : {},
                initialize : function(opts) {
                    this.settings = $.extend({}, this.defaults, opts)
                    this.$el = $("#text-viewer-template").tmpl([ {
                        fname : opts.entry.fname,
                        text : opts.result
                    }]);
                    
                    this.$(".edit-saveOptions").hide();
                },
                render : function() {
                    return this;
                },
                discardChanges:function(){
                    this.$(".tv-body").attr("contentEditable","false");
                    this.enableZoom();
                    this.hideActions();
                },
                saveFile:function(){
                    this.$(".tv-body").attr("contentEditable","false");
                    this.enableZoom();
                    this.hideActions();
                },
                enableEdit:function(){
                    this.$(".tv-body").attr("contentEditable","plaintext-only");
                    this.changeZoom(this.defaults.zoomValue);
                    this.disableZoom();
                    this.showActions();
                },
                hideActions:function(){
                    this.$(".text-edit").show()
                    this.$(".edit-saveOptions").hide();
                },
                showActions:function(){
                    this.$(".text-edit").hide()
                    this.$(".edit-saveOptions").show();
                },
               disableZoom:function(){
                 this.$(".tv-zoom-plus").attr("disabled","disabled");
                 this.$(".tv-zoom-minus").attr("disabled","disabled");
               },
               enableZoom:function(){
                   this.$(".tv-zoom-plus").removeAttr("disabled");
                   this.$(".tv-zoom-minus").removeAttr("disabled");
               },
                zoomIn : function() {
                    this.settings.zoomValue++;
                    this.changeZoom(this.settings.zoomValue);
                },
                zoomOut : function() {
                    this.settings.zoomValue--;
                    this.changeZoom(this.settings.zoomValue);
                },
                changeZoom : function(val) {
                    this.$(".tv-body pre").css("font-size", val);
                    this.$(".tv-zoom-input").val(val);

                    if (val < this.settings.maxZoomVal
                            && val > this.settings.minZoomVal) {
                        this.$(".tv-zoom-minus").removeAttr("disabled");
                        this.$(".tv-zoom-plus").removeAttr("disabled");
                    } else if (val == this.settings.maxZoomVal) {
                        this.$(".tv-zoom-plus").attr("disabled", "disabled");
                    } else if (val == this.settings.minZoomVal) {
                        this.$(".tv-zoom-minus").attr("disabled", "disabled");
                    }
                }

            });

            var ImageViewer = Backbone.View.extend({
                events : {

                },
                defaults : {
                    zoomValue : 1,
                    maxZoomVal : 5,
                    minZoomVal : 1,
                    minHeight : 200,
                    minWidth : 200,
                    maxHeight : 500,
                    maxWidth : 500,
                },
                settings : {},
                initialize : function(opts) {
                    this.settings = $.extend({}, this.defaults, opts)
                    this.$el = $("#image-viewer-template").tmpl([ {
                        fname : opts.entry.fname,
                        text : opts.result
                    } ]);
                },
                render : function() {
                    return this;
                },
                scaleImage : function(el) {
                    return $(el).each(function() {
                        // var maxWidth = $(this).parent().width(); // Max width
                        // for the image
                        // var maxHeight = $(this).parent().height(); // Max
                        // height for the image

                        var maxWidth = 500; // Max width for the image
                        var maxHeight = 500; // Max height for the image
                        var ratio = 0; // Used for aspect ratio
                        var width = this.width; // Current image width
                        var height = this.height; // Current image height

                        // Check if the current width is larger than the max
                        if (width > maxWidth) {
                            ratio = maxWidth / width; // get ratio for scaling
                            // image
                            $(this).css("width", maxWidth); // Set new width
                            $(this).css("height", height * ratio); // Scale
                            // height
                            // based on
                            // ratio
                            height = height * ratio; // Reset height to match
                            // scaled image
                            width = width * ratio; // Reset width to match
                            // scaled image
                        } else if (width < maxWidth) {
                            // ratio=maxWidth-width;
                            // $(this).css("margin-left", ratio/2);
                        }

                        // Check if current height is larger than max
                        if (height > maxHeight) {
                            ratio = maxHeight / height; // get ratio for scaling
                            // image
                            $(this).css("height", maxHeight); // Set new
                            // height
                            $(this).css("width", width * ratio); // Scale
                            // width
                            // based on
                            // ratio
                            width = width * ratio; // Reset width to match
                            // scaled image
                        } else if (height < maxHeight) {
                            // ratio = maxHeight - height;
                            // $(this).css("margin-top", ratio/2);

                        }
                    });
                },
            });

            /*
             * Initializing all collections and Views
             */
            var collection = new baseCollection;
            var filesCollection = new Files;

            var view = new MasterView({
                collection : collection,
                files : filesCollection,
            });

            var subView = new FilesZone({
                el : $("#file-list"),
                collection : filesCollection,
                menu : false
            });

            var treeView = new TreeZone({
                collection : filesCollection
            });
            var searchbox = new searchView({
                collection : filesCollection
            });

            /*
             * context menu for all zones in container
             */
            var cmenuView = Backbone.View
                    .extend({
                        el : $("#cmenu"),
                        fileList : [ "copy", "cut", "download", "dlt", "info" ],
                        folderList : [ "paste", "open", "copy", "cut", "dlt",
                                "newwnd", "info" ],
                        workspace : [ "paste", "create_folder" ],
                        events : {
                            "click" : "hidemenu",
                            // 'click #create_file' : "createFile",
                            'click #create_folder' : "createFolder",
                            'click #open' : "open",
                            "click #newwnd" : "newView",
                            "click #cut" : "cut",
                            "click #copy" : "copy",
                            "click #paste" : "paste",
                            "click #download" : "download",
                            "click #dlt" : "distroy",
                            "click #info" : "info",
                            "contextmenu" : "disableContextMenu"

                        },
                        initialize : function(opts) {
                            _.bindAll(this, "hidemenu");
                            $(document).bind("click", this.hidemenu);
                            this.baseCollection = opts.baseCollection;
                            this.baseCollection.bind("clear", this.hidemenu,
                                    this);
                        },
                        render : function(opts) {
                            // console.log(opts);

                            this.viewtype = opts.type;
                            this.model = opts.model;
                            this.collection = opts.collection;

                            this.filterMenu();

                            /*
                             * $(this.el).css({ top : opts.psY + 'px', left :
                             * opts.psX + 'px' }).show();
                             */

                            utils.inBox(this.el, {
                                top : opts.psY,
                                left : opts.psX
                            }, "#container");
                            $(this.el).show();

                        },
                        disableContextMenu : function(e) {
                            e.preventDefault();
                            return false;
                        },
                        filterMenu : function() {
                            $(this.el).children().hide();
                            var menuItems = this.getlist();
                            var length = menuItems.length;
                            for ( var i = 0; i < length; i++) {
                                $(this.el).children("#" + menuItems[i]).show();
                            }

                            this.resetdefaults();

                        },
                        getlist : function() {
                            var list;
                            if (this.viewtype == "file") {
                                list = this.fileList;
                            } else if (this.viewtype == "folder") {
                                list = this.folderList;
                            } else {
                                list = this.workspace;
                            }

                            // if (!filesCollection.meta("filesCopied")) {
                            if (!collection.clipboardData) {
                                var index = $.inArray("paste", list);
                                if (index != -1) {
                                    list.splice(index, 1);
                                }
                            }

                            return list;

                        },
                        resetdefaults : function() {
                            this.fileList = [ "copy", "cut", "download", "dlt",
                                    "info" ];
                            this.folderList = [ "paste", "open", "copy", "cut",
                                    "dlt", "newwnd", "info" ];
                            this.workspace = [ "paste", "create_folder" ];
                        },
                        /*
                         * createFile : function() { console.log("create file
                         * called"); },
                         */
                        createFolder : function() {
                            // console.log("create folder called");
                            this.collection.trigger("newfolder");
                        },
                        open : function() {
                            // console.log("open called");
                            // if(!this.model.get("isdir"))
                            // return;

                            if (this.collection.getSelected().length > 1) {
                                console
                                        .log("sorry unable to open multiple files");
                            } else {
                                this.model.trigger("open")
                            }
                        },
                        newView : function() {
                            // console.log("new window called");

                            collection
                                    .trigger("newwnd", this.model.get("path"));
                        },
                        cut : function() {
                            // console.log("cut called");
                            this.collection.trigger("cut");

                        },
                        copy : function() {
                            // console.log("Copy called");
                            this.collection.trigger("copy");
                        },
                        paste : function() {
                            // console.log("Paste called");

                            var dest = null;
                            if (this.viewtype != "workspace")
                                dest = this.model.get("path")

                            this.collection.trigger("paste", dest);
                        },
                        download : function() {
                            // console.log("Download called");
                            this.collection.trigger("download");
                        },
                        distroy : function() {
                            this.collection.trigger("delete");
                        },
                        info : function() {
                            var self = this;

                            var unique = akp_ws.createUUID();
                            var obj = {
                                mesgtype : "request",
                                request : "getinfo",
                                dname : this.model.get("path"),
                                service : "fmgr",
                                cookie : unique,
                                uid : auth.loginuserid,
                            }

                            collection.send(obj, function(resp) {
                                console.log(resp)
                                if (resp.mesgtype == "error") {

                                    noty({
                                        text : resp.error,
                                        type : "error",
                                        layout : 'bottomRight',
                                        theme : 'default',
                                        timeout : 5000,
                                    });

                                    return;
                                }

                                infoView.render({
                                    model : self.model,
                                    info : resp.info,
                                    collection : self.collection
                                });
                            })
                        },
                        hidemenu : function() {
                            $(this.el).hide();
                        }
                    });

            var infoDialog = Backbone.View
                    .extend({
                        // className:"span10 offset1",
                        events : {
                            "click .file-info-desc" : "editDesc",
                            "click .file-info-tags" : "showTagsInput",
                            "click .desc-edit" : "editDesc",
                            "click .tag-edit" : "showTagsInput",
                            "click .desc-save" : "sendDescChange",
                            "click .tag-save" : "sendTagChange",
                            "click .file-info-follow" : "sendFollow",
                            "click .file-info-lock" : "sendLock",
                            "click .file-info-download" : "downloadFile",
                            "click .file-info-delete" : "deleteFile",

                        },
                        initialize : function(opts) {
                            _.bindAll(this, "render", "close", "shareKons");
                            this.baseCollection = opts.baseCollection;
                            this.infoObj = {
                                isPrivate : 0,
                                fqtn : "",
                                oid : "",
                                state : "",
                                locked : 0,
                                kons : 0,
                                description : "",
                                markedPrivateBy : "",
                                lockedBy : 0,
                                ownerUid : auth.loginuserid,
                                ownerGid : auth.cgd,
                                followers : [],
                                taglist : [],
                            }

                            var vaultKonsEntry = $("<div/>").addClass(
                                    "vaultKonsEntry");
                            var vaultKonsStream = $("<div/>").addClass(
                                    "vaultKonsStream");

                            var infopart = $("<div/>").addClass("fileinfoside");
                            var konspart = $("<div/>").addClass(
                                    "file-info-kons").append(vaultKonsEntry)
                                    .append(vaultKonsStream);

                            var container = $("<div/>").append(infopart)
                                    .append(konspart).css({
                                        height : "100%"
                                    });

                            this.$el.append(container).dialog({
                                autoOpen : false,
                                resizable : false,
                                draggable : false,
                                modal : true,
                                closeButtonAction : 'close',
                                // width : "80%",
                                minWidth : "1000",
                                maxWidth : "80%",

                                minHeight : "600",
                                height : "600",
                                maxHeight : "800",
                                close : this.close,
                                open : this.onOpen,
                            });

                            this.baseCollection.bind("initialized",
                                    this.getKonsDialog, this);
                            this.baseCollection.bind("initialized",
                                    this.loadKonsStream, this);
                            this.baseCollection.bind("clear", this.closeDialog,
                                    this);

                        },
                        closeDialog : function() {

                        },
                        downloadFile : function() {
                            this.collection.trigger("download");
                        },
                        deleteFile : function() {
                            this.collection.trigger("delete");
                            this.$el.dialog("close");
                        },

                        saveInfo : function() {
                            this.collection.trigger("saveFileInfo",
                                    this.fileInfo);
                        },
                        sendLock : function() {
                            var lockReq = this.fileInfo.locked ? "unlock"
                                    : "lock";

                            this.fileInfo.locked = this.fileInfo.locked ? 0 : 1;

                            this.fileInfo.lockedBy = lockReq == "unlock" ? 0
                                    : auth.loginuserid;

                            var unique = akp_ws.createUUID();
                            var obj = {
                                cookie : unique,
                                service : "fmgr",
                                mesgtype : "request",
                                request : lockReq,
                                info : this.fileInfo,
                                uid : auth.loginuserid,
                                dname : this.model.get("path"),
                            }
                            this.baseCollection.send(obj, this.handleResponses);
                            this.setLock();
                        },
                        setLock : function() {

                            if (this.fileInfo.locked) {
                                if (this.fileInfo.lockedBy == auth.loginuserid)
                                    this.$(".file-info-lock").children("span")
                                            .removeClass().addClass(
                                                    "icon-unlocked");
                                else
                                    this.$(".file-info-lock").attr("disabled",
                                            "disabled");

                            } else {
                                this.$(".file-info-lock").children("span")
                                        .removeClass().addClass("icon-lock");
                            }
                        },
                        sendFollow : function() {
                            if (!this.isFollowing) {
                                this.fileInfo.followers.push(auth.loginuserid)
                            } else {
                                this.fileInfo.followers = _.without(
                                        this.fileInfo.followers,
                                        auth.loginuserid);
                            }
                            var request = this.isFollowing ? "unfollow"
                                    : "follow";
                            var unique = akp_ws.createUUID();
                            var obj = {
                                cookie : unique,
                                service : "fmgr",
                                mesgtype : "request",
                                request : request,
                                info : this.fileInfo,
                                uid : auth.loginuserid,
                                dname : this.model.get("path"),
                            }
                            this.baseCollection.send(obj, this.handleResponses);
                            this.setFollow();

                        },
                        setFollow : function() {
                            if (_.indexOf(this.fileInfo.followers,
                                    auth.loginuserid) == -1) {
                                this.$(".file-info-follow").html("Follow");
                                this.isFollowing = false;
                            } else {
                                this.$(".file-info-follow").html("Unfollow");
                                this.isFollowing = true;
                            }
                            this.renderMembers({
                                members : this.fileInfo.followers,
                                el : this.$(".file-info-followers-list")
                            })

                        },
                        sendTagChange : function() {
                            this.$(".tag-edit").show();
                            this.$(".tag-save").hide();
                            this.fileInfo.taglist = this.$(".file-info-tags")
                                    .val().split(",");
                            var unique = akp_ws.createUUID();
                            var obj = {
                                cookie : unique,
                                service : "fmgr",
                                mesgtype : "request",
                                request : "tagchange",
                                info : this.fileInfo,
                                uid : auth.loginuserid,
                                dname : this.model.get("path"),
                            }
                            this.baseCollection.send(obj, this.handleResponses);
                            this.renderTags();
                        },
                        renderTags : function() {
                            this.$(".file-info-tags").show().next(".tagsinput")
                                    .remove();
                            var tags = this.fileInfo.taglist;
                            var length = tags.length;
                            if (!length)
                                return;

                            this.$(".file-info-tags").removeClass(".blur-msg")
                                    .empty();
                            for ( var i = 0; i < length; i++) {
                                $("<span/>").addClass("tag").appendTo(
                                        this.$(".file-info-tags")).append(
                                        "#" + tags[i]);
                            }
                        },
                        handleResponses : function(resp) {

                        },
                        sendDescChange : function() {
                            this.$(".file-info-desc").attr({
                                "contenteditable" : "false",
                                "isEditing" : "false"
                            }).removeClass("akp-edit-content");
                            this.$(".desc-edit").show();
                            this.$(".desc-save").hide();
                            this.fileInfo.description = this.$(
                                    ".file-info-desc").text();
                            var unique = akp_ws.createUUID();
                            var obj = {
                                cookie : unique,
                                service : "fmgr",
                                mesgtype : "request",
                                request : "setdesc",
                                info : this.fileInfo,
                                uid : auth.loginuserid,
                                dname : this.model.get("path"),
                            }
                            this.baseCollection.send(obj, this.handleResponses);

                            this.setDesc();
                        },
                        setDesc : function() {
                            if (this.fileInfo.description)
                                this.$(".file-info-desc").html(
                                        this.fileInfo.description);
                            else {
                                this
                                        .$(".file-info-desc")
                                        .html(
                                                "Write Something to know whats in the file...");
                            }
                        },
                        editDesc : function(e) {
                            this.$(".file-info-desc").attr({
                                "contenteditable" : "true",
                                "isEditing" : "true"
                            }).empty().focus().addClass("akp-edit-content");

                            if (this.fileInfo.description)
                                this.$(".file-info-desc").html(
                                        this.fileInfo.description);

                            this.$(".desc-edit").hide();
                            this.$(".desc-save").show();

                        },
                        showTagsInput : function(e) {
                            this.$(".file-info-tags").attr("isEditing", "true")
                                    .tagsInput({
                                        'height' : 'auto',
                                        'width' : 'auto',
                                        'onAddTag' : function(tags) {
                                            console.log(tags);

                                        },

                                    });
                            var self = this;
                            var tagstr = utils
                                    .array2string(self.fileInfo.taglist);
                            this.$(".file-info-tags").importTags(tagstr)
                            this.$(".tag-edit").hide();
                            this.$(".tag-save").show();

                        },
                        renderMembers : function(opts) {

                            // console.log(opts.members);
                            var members = opts.members;
                            opts.el.empty();

                            for ( var i = 0; i < members.length; i++) {
                                var user = auth.getuserinfo(members[i]);
                                var obj = {
                                    userid : user.uid,
                                    img : user.image_small
                                            || "css/images/user32.png",
                                }
                                var temp = $("#user-template").tmpl([ obj ]);
                                temp.attr("title", user.first_name);
                                opts.el.append(temp);
                            }

                        },

                        hideKonsEntry : function() {
                            this.$(".vaultKonsEntry").hide();
                            this.$(".vaultKonsStream").show();
                        },
                        showKonsEntry : function() {
                            this.$(".vaultKonsEntry").show();
                            this.$(".vaultKonsStream").hide();
                        },

                        getKonsDialog : function() {
                            this.konsEntry = akp_ws.konsDialog({
                                el : this.$(".vaultKonsEntry"),
                                type : "standard",
                                onShare : this.shareKons,
                                onCancel : this.clearKonsEntry,
                                "basic" : "true",
                                richText : false,
                            });
                        },

                        loadKonsStream : function() {
                            this.konsStream = akp_ws.kons.getKonsStream({
                                el : this.$(".vaultKonsStream"),
                                basic : true,
                                richText : false,
                                strictCategory : "file",
                                onUpdates : this.hideKonsEntry,
                            });
                            this.konsStream.bind("rootRemoved",
                                    this.showKonsEntry, this);
                            akp_ws.kons.getCategoryUpdates("file",
                                    this.konsStream.updates);
                        },
                        getKonsStream : function(id) {
                            this.konsStream.getKonv(id);
                        },

                        shareKons : function(konsObj) {
                            konsObj.category = "file";
                            konsObj.attached_object = this.model.get("path");
                            akp_ws.send(konsObj);
                            console.log("sending kons object");
                            console.log(konsObj);
                        },
                        clearKonsEntry : function() {

                        },

                        onOpen : function() {
                            var $dialog = $(this);
                            $dialog.closest(".ui-dialog").find(
                                    ".ui-dialog-titlebar").remove();

                            /*
                             * $dialog.dialog('widget').animate({ width:
                             * "+=300", left: "-=150" });
                             */

                            $dialog.css({
                                padding : "0"
                            }).closest(".ui-dialog").css({
                                padding : "0",
                                "border-radius" : "0px"
                            });
                            // get the last overlay in the dom
                            $dialogOverlay = $(".ui-widget-overlay").last();
                            // remove any event handler bound to it.
                            $dialogOverlay.unbind();
                            $dialogOverlay.click(function() {
                                // close the dialog whenever the overlay is
                                // clicked.
                                $dialog.dialog("close");
                            });
                            $('.ui-dialog :button').blur();
                        },
                        render : function(opts) {
                            if (opts.model) {
                                this.model = opts.model;
                                this.fileInfo = opts.info;
                                this.collection = opts.collection;
                            }
                            /*
                             * var fname = this.model.get("fname"); var s =
                             * this.model.get('size'); var t =
                             * this.model.get('type'); var isdir =
                             * this.model.get("isdir");
                             * 
                             * var finfo = isdir == "true" ? '<span>Type :
                             * <b>Directory</b></span>' : '<span>Type : <b>' +
                             * t + '</b></span><br><span>Size : <b>' +
                             * utils.convBytes(s, 2) + '</b></span>';
                             * 
                             * var data = '<div><img
                             * src="css/images/file-info.png" height=32 width=32 />
                             * </div><div><span>Name : <b>' + fname + '</b></span><br>' +
                             * finfo +"</div>";
                             */

                            var modelObj = this.model.toJSON();
                            modelObj["size"] = utils
                                    .convBytes(modelObj.size, 2);
                            modelObj["mime"] = modelObj.isdir == 'true' ? "akorp-mime-directory"
                                    : utils.mime2class(modelObj.type);
                            modelObj["type"] = modelObj.isdir == "true" ? "Directory"
                                    : modelObj.type;
                            modelObj.parent = modelObj["parent"].toString()
                                    .replace(modelObj["home"], "Home");
                            var formattedTimestamps = {
                                last_modified : $.fullCalendar
                                        .formatDate(
                                                new Date(
                                                        this.fileInfo.lastmodified * 1000),
                                                "dd MMM yy"),
                                last_accessed : $.fullCalendar
                                        .formatDate(
                                                new Date(
                                                        this.fileInfo.lastaccessed * 1000),
                                                "dd MMM yy"),
                            };

                            var dataObj = $.extend({}, modelObj, this.infoObj,
                                    this.fileInfo, formattedTimestamps);
                            var data = $("#fileInfo-template")
                                    .tmpl([ dataObj ]);

                            this.$(".fileinfoside").html(data);

                            this.renderTags();
                            this.setFollow();
                            this.setLock();
                            this.setDesc();
                            this.renderMembers({
                                members : this.fileInfo.followers,
                                el : this.$(".file-info-followers-list")
                            });

                            if (parseInt(this.fileInfo.kons)) {
                                this.hideKonsEntry();
                                this.getKonsStream(this.fileInfo.kons);
                            } else {
                                this.showKonsEntry();
                            }

                            this.$el.dialog("open");
                            return this;
                        },
                        close : function() {
                            // this.$el.remove();
                            this.$el.dialog("close");
                        }
                    })

            var cmenu = new cmenuView({
                baseCollection : collection
            });

            var infoView = new infoDialog({
                baseCollection : collection
            });

            /*
             * handling msgs for Vault service fmgr
             */

            function handleFmgrMessage(msg_obj) {
                var svr_cmds = msg_obj;
                if (svr_cmds.mesgtype == "error") {
                    handleErrorMsg(svr_cmds);
                } else {
                    switch (maptable[svr_cmds.cookie]) {
                    case 'window':
                        handleWindowMsg(svr_cmds);
                        break;
                    case 'fmgrUpload':
                        worker.port.postMessage(svr_cmds);
                        break;
                    case 'picUpload':
                        profilePicUploadWorker.port.postMessage(svr_cmds);
                        break;
                    case 'download':
                        handleFileDownload(svr_cmds);
                        break;
                    case 'tree':
                        form_tree(svr_cmds.direlements, expander);
                        break;
                    case 'search':
                        handleFmgrSearchResults(svr_cmds);
                        break;
                    case 'question':
                        handleQuestionResponse(svr_cmds);
                        break;
                    }

                }

            }

            // return handleFmgrMessage;

            return collection;

        });

/**
 * @author Raju K
 */
define(
		"akprtc",
		[ "jquery", "underscore", "backbone", "akpauth", "akpmedia",
				"akpcontacts", "akputils", "plugins/gettheme", "plugins/jqxcore","plugins/jqxwindow",
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
							console.log("msg failed");
							var model=this.collection.getModel(resp.orginalMsg.msg.imsg);
							if(model)
							model.changeStatus({status:"Failed to send messages."});
						},
						handleSendSuccess:function(resp){
							console.log("sendSuccess");
							console.log(resp);
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
										akp_ws.send(serv_msg);
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
								akp_ws.send(msg);
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
							console.log(ids)

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

							akp_ws.send(obj);
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
							if (!akp_ws.isVisible)
								akp_ws.changeTitle("New chat Message");

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
								console
										.log(ev.results[ev.results.length - 1][0].transcript);
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
						console.log("conference request accepted by invitee.");
						console.log(msg);
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

/**
 * @author Raju Konga
 */
define(
		"akpmedia",
		[ "jquery", "underscore", "backbone", "akpauth", "akpcontacts",
		"plugins/peer", "plugins/gettheme", "plugins/jqxcore","plugins/jqxwindow",
				"plugins/jquery-tmpl", "plugins/noty_full" ],
		function($, _, Backbone, auth, users // , templates
		) {
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
						console.log("peer connection removed for user :"
								+ user.uid);
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
					onPeerMessage : handlePeerMessage
				};
				if (user.autoOffer == false) {
					settings.autoOffer = true;
					;
				}

				var peer = new Peer(settings);
				peerManager[user.uid] = peer;
				console.log("peer connection created for user :" + user.uid);
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
				} 
				 else if (data.eventtype == "media") {
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
						var status=this.send2Peer(group[recpnt], msg);
						this.handleEvents(group[recpnt], status, msg)
					}

				} else {
					// send msg to peer

					var status=this.send2Peer(msg.to, msg);
					this.handleEvents(group[recpnt], status, msg)
				}
			}
			PeerMessanger.prototype.handleEvents=function(uid,status,msg){
				var self=this;
				setTimeout(function(){
				if(status){
					if(typeof self.onsuccess === 'function'){
						self.onsuccess.call(this,{uid:uid, status:status, originalMsg:msg});
					}
				}else{
					if(typeof self.onerror === 'function'){
						self.onerror.call(this,{uid:uid, status:status, originalMsg:msg});
					}
				}
				},500);
			}

			PeerMessanger.prototype.send2Peer=function(user, msg) {
				var peer = peerManager[user];
				
				if (peer) {
					return peer.send(msg);

				}
				
				return false;
			}

			PeerMessanger.prototype.peerErrorHandler=function() {
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
						this.setCallStatus("#rtcvideo",this.model.get("first_name") + " disconnected.");
					} else if (isAudioCall) {

					}
				},
				setCallStatus:function(el,msg){
					$(el).find(".callStatus").show("slideUp").html(msg);
				},
				reset:function(){
					isFree = true;
					mediaStatus = "free";
					callPending = false;
					answerPending = true;
					sessionUser = "";
					remotePeerClose = false;
				}
			})

			/*
			 * **************************************************************************************************************************************
			 * VIDEO CALL USING WEBRTC.
			 * ***************************************************************************************************************************************
			 */
			// For Video call
			sourcevid = document.getElementById("sourcevid");
			remotevid = document.getElementById("remotevid");

			$('#rtcvideo').jqxWindow({
				height : 300,
				width : 320,
				minHeight : 100,
				maxHeight : 600,
				maxWidth : 500,
				theme : 'darkblue',
				autoOpen : false,
				showCollapseButton : true,
				resizable : true
			});

			$('#rtcvideo').bind('close', function(e) {
				if (!remotePeerClose)
					terminateCall();
			});

			// For Audio Call
			sourceVoice = document.getElementById("sourceVoice");
			remoteVoice = document.getElementById("remoteVoice");

			$('#rtcaudio').jqxWindow({
				height : 300,
				width : 320,
				minHeight : 100,
				maxHeight : 600,
				maxWidth : 500,
				theme : 'darkblue',
				autoOpen : false,
				showCollapseButton : true,
				resizable : true
			});

			$('#rtcaudio').bind('close', function(e) {
				if (!remotePeerClose)
					terminateCall();
			});

			$('#rtcaudio').find(".actionSection").hide();
			$('#rtcvideo').find(".actionSection").hide();

			// handle on incoming call

			function onIncomingVideoCall(msg_obj) {
				hisname = msg_obj.caller;

				var user = auth.getuserinfo(hisname);
				var type = msg_obj.audioonly;

				var html;
				mediaStatus = "engaged";
				if (type) {
					isAudioCall = true;
					html = $(
							"<div>You have been invited to Voice chat  by </div>")
							.append(user.first_name);
				} else {
					isVideoCall = true;
					html = $(
							"<div>You have been invited to Video chat by </div>")
							.append(user.first_name);
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
				var notymsg = $(html).dialog({
					// layout:"bottomRight",
					// text : html,
					// closeWith:['button'],
					title : "Call",
					modal : true,
					closeOnEscape : false,
					resizable : false,
					draggable : false,
					buttons : [ {
						"class" : 'btn btn-primary',
						text : 'Accept',
						click : function($noty) {
							// $noty.close();
							acceptCall(msg_obj, type);
							$(this).dialog("close");
						}

					}, {
						"class" : 'btn btn-danger',
						text : 'Decline',
						click : function($noty) {
							// $noty.close();
							dropCall(msg_obj.caller, type);
							$(this).dialog("close");

							// rejectCall(hisname);
						}
					} ]
				});
				startWaiting(msg_obj.caller);
			}

			function startWaiting(caller) {
				callWaitingTimer = setTimeout(function() {
					dropCall(caller);
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

				console.log("Accepted the video chat request.")
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
				console.log("Remote stream removed");
				remotevid.src = "";
				remotePeerClose = true;
				closePeerconnectionbyRemote();
				return;
			}

			function onRemoteStreamAdded(event, caller) {
				mediaStatus = "inCall";
				console.log("Remote stream added");
				var stream = event.stream;
				var hasVideo = stream.getVideoTracks().length;
				// console.log("Video Tracks count in stream : "+ hasVideo);
				if (!hasVideo) {
					console.log("this is audio call");
					remoteVoice.src = window.webkitURL.createObjectURL(stream);
					animateAudioStream(stream);
					$('#rtcaudio').jqxWindow('show');
					$('#rtcaudio').jqxWindow({
						position : getPosition()
					});
					$('#rtcaudio').find(".actionSection").show("slideUp");
					$('#rtcaudio').find(".rtcvidnotifier").hide("slideDown");
					$('#rtcaudio').find(".remoteauduser").attr(
							"src",
							auth.getuserinfo(caller).image_large
									|| alt_image_large)

				} else {
					console.log("this is video call");
					remotevid.src = window.webkitURL.createObjectURL(stream);
					$('#rtcvideo').addClass("inProgress").jqxWindow('show');
					$('#rtcvideo').jqxWindow({
						position : getPosition()
					});
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
						.hide().end().find(".rtcvidnotifier").show().end().find("callStatus").hide();

			}

			function terminateCallbyRemote() {

				remotePeerClose = true;
				
				
				if (isVideoCall)
					$('#rtcvideo').jqxWindow('hide');
				else if (isAudioCall)
					$('#rtcaudio').jqxWindow('hide');

				console.log("peer connection closed by peer. bye recieved");

				endStreams(sessionUser);
				reset();
				return;

			}

			function terminateCall() {
				if (mediaStatus == "inCall") {
					var unique = akp_ws.createUUID();
					var obj = {
						service : "rtc",
						mesgtype : "request",
						request : "bye",
						cookie : unique,
						sndr : auth.loginuserid,
						rcpt : sessionUser
					}
					akp_ws.send(obj);
					console.log("peer connection closed. bye send");

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

				navigator.webkitGetUserMedia(streamConstraints,
						successCallback, errorCallback);
				function successCallback(stream) {

					peer.addMedia(stream);
					if (audioonly) {

						sourceVoice.src = window.webkitURL
								.createObjectURL(stream);
						$('#rtcaudio').find(".actionSection").show("slideUp");
						$('#rtcaudio').find(".rtcvidnotifier")
								.hide("slideDown");
					} else {
						sourcevid.style.opacity = 1;
						sourcevid.src = window.webkitURL
								.createObjectURL(stream);
						$('#rtcvideo').find(".actionSection").show("slideUp");
						$('#rtcvideo').find(".rtcvidnotifier")
								.hide("slideDown");
					}
					cameraOn = true;

					if (action == "offer") {

						peer.sendCall();
						console.log("offer send");
					} else if (action == "answer") {

						peer.answerCall();
						console.log("answer send");
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

				$(el).jqxWindow('show');
				$(el).jqxWindow({
					position : getPosition()
				});

				if (user) {
					var img = user.image_large || alt_image_large;
					$(el).find(".rtcvidstillimg").attr("src", img);

				}

				if (status) {
					$(el).find(".status").html(status)
				} else {
					$(el).find(".status").html("calling..")
				}

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
						mediaStatus = "engaged";
						sessionUser = id;
						if (calltype == "audio")
							isAudioCall = true;
						else
							isVideoCall = true;
						
						setCallStatus("", user);

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

				/*
				 * noty({ layout : 'bottomRight', theme : 'default', type :
				 * "error", text : auth.getuserinfo(msg.sndr).first_name + "
				 * declined your call. ", timeout:3000, })
				 */

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
						console.log("recvd candidate");
						if (!answerPending) {

							var peer = peerManager[msg.candobj.sndr];
							if (peer)
								peer.addIceCandidate(msg.candobj.label,
										msg.candobj.cand);

						} else {
							console
									.log("Cand dropped, reason: recvd before invite accept");
						}
					}
					break;
				case 'request':
					console.log("recvng call");
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
							console.log("camera stream opened and answered");
						} else {
							peer.answerCall();
						}
					}
					break;

				case 'response':
					console.log("recvd pickup");
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

/**
 * @author Raju K
 */
define(
		"akpplanner",
		[ "jquery", "underscore", "backbone", "akpauth", "akpcontacts",
				"akputils",	"plugins/jquery-ui", "plugins/gettheme", "plugins/jqxcore","plugins/jqxwindow",
				"plugins/jquery-tmpl", "plugins/fullcalendar.min" ],
		function($, _, Backbone, auth, contacts, utils) {
			loader(10, "planner Loaded");

			var baseModel = Backbone.Model.extend({
				defaults : {
					service : "calendar",
				}
			});
			var eventModel = Backbone.Model.extend({
				defaults : {
					title : "",
					description : "",
					start : null,
					type : "",
				}
			});
			var eventsStore = Backbone.Collection.extend({
				model : eventModel,

			});

			var EventsDB = new eventsStore;

			/*
			 * Controller
			 */

			var baseCollection = Backbone.Collection
					.extend({
						model : baseModel,
						today : new Date(),
						initialize : function() {
							_.bindAll(this, "onVisible");
							this._map = {};
							this._objCln = {};
						},
						onVisible : function() {
							this.trigger("visible");
						},
						date2String : function(date, str) {
							// console.log(date);
							return $.fullCalendar.formatDate(date, str);
						},
						start : function() {
							this.trigger("init");

						},
						send : function(recvd) {
							// console.log(recvd);
							if (recvd.mesgtype == "response") {
								if (this._map[recvd.cookie] == "delete") {
									this.trigger("eventremove",
											this._objCln[recvd.cookie].id);
								} else if (this._map[recvd.cookie] == "grant_request") {
									// this.trigger("requestGrant",this._objCln[recvd.cookie].id);
									this._objCln[recvd.cookie].hide();
								} else if (this._map[recvd.cookie] == "decline_request") {
									// this.trigger("requestDecline",this._objCln[recvd.cookie].id);
									this._objCln[recvd.cookie].hide();

								} else if (this._map[recvd.cookie] == "upcoming") {
									// console.log("new upcoming event");
									// console.log(recvd.result);
									this._objCln[recvd.cookie]
											.attachEvent(recvd.result);

								} else if (this._map[recvd.cookie] == "getVevent") {
									// console.log("new upcoming event");
									// console.log(recvd.result);
									this._objCln[recvd.cookie].onResponse.call(
											this, new eventModel(recvd.result));

								}
							} else if (recvd.mesgtype == "event") {
								if (recvd.eventtype == "new_vevent") {
									this.add(recvd.vevent);
									EventsDB.add(recvd.vevent);
								} else if (recvd.eventtype == "edit_vevent") {
									this.add(recvd.vevent);
									EventsDB.add(recvd.vevent);
								} else if (recvd.eventtype == "delete_vevent") {
									console.log("delete event broadcast");
									this
											.trigger("eventremove",
													recvd.vevent.id);
								} else if (recvd.eventtype == "vevent_invite") {
									console.log("New calendar invitation:")
									// console.log(recvd.invite);
									this.trigger("addRequest", recvd.invite);
								} else if (recvd.eventtype == "vevent_reminder") {
									console.log(recvd);
									this.trigger("alert", recvd.vevent);
								}
							} else if (recvd.mesgtype == "notification") {
								this
										.trigger("notification",
												recvd.notification);
							}

							if (recvd.result)
								this.add(recvd.result);
							EventsDB.add(recvd.result);
						},
						map : function(id, obj, type) {
							this._map[id] = type;
							this._objCln[id] = obj;
						},
						clear : function() {

						},
						getEvents : function(start, end) {
							var unique = akp_ws.createUUID();
							var obj = {
								tstart : new Date(start).toISOString(),
								tend : new Date(end).toISOString(),
								mesgtype : "request",
								request : "get_vevents",
								cookie : unique,
								uid : auth.loginuserid,
								gid : auth.cgd,
								personal : false,
								service : "calendar",
							}
							akp_ws.send(obj);

						},
						changeGroup : function(group) {
							this.trigger("clear");
							EventsDB.reset();
							this.reset();
							this.start();
						}

					});

			var controller = Backbone.Model.extend({
				update : function(msg) {

				}
			});

			var inviteView = Backbone.View.extend({
				events : {
					"click .evt-go" : "accept",
					"click .evt-no" : "deny",
					"click .evt-title" : "showFull"
				},
				initialize : function(opts) {
					this.request = opts.invite;
					this.answer = opts.invitations;

					var event = this.modObj(opts.invite.vevent);
					var obj = {
						title : event.title,

						id : event.id,
						description : event.summary,
						venue : event.location,
					}

					if (event.allday) {
						obj.day = $.fullCalendar.formatDate(new Date(
								event.start), "dd");// new
													// Date(event.start).getDate(),
						obj.month = $.fullCalendar.formatDate(new Date(
								event.start), "MMM");
					} else {
						obj.day = $.fullCalendar.formatDate(new Date(
								event.start), "hh:mm");// new
														// Date(event.start).getDate(),
						obj.month = $.fullCalendar.formatDate(new Date(
								event.start), "TT");
						obj.date = $.fullCalendar.formatDate(new Date(
								event.start), "dd-MMM-yyyy")
					}
					this.obj = obj;
					this.setElement($("#calEvent-invite-template").tmpl(
							this.obj));

				},
				modObj : function(event) {
					var modelObj = event;
					modelObj.start = new Date(modelObj.tstart).toUTCString();
					modelObj.end = new Date(modelObj.tend).toUTCString();
					modelObj.className = modelObj.category;

					return modelObj;
				},
				render : function() {
					return this;
				},
				hide : function() {
					$(this.el).hide("fade");
				},
				accept : function() {
					var unique = akp_ws.createUUID();
					var obj = {
						request : "grant_request",
						mesgtype : "request",
						uid : auth.loginuserid,
						id : this.request.id,
						cookie : unique,
						service : "calendar"
					}
					// this.answer.respond();
					// grant_request

					akp_ws.send(obj);
					this.collection.map(unique, this, "grant_request");
					this.$(".evt-invite-respond").html(
							"<span class=evt-invite-ask >updating..</span>");
				},
				deny : function() {

					var unique = akp_ws.createUUID();
					var obj = {
						request : "decline_request",
						mesgtype : "request",
						uid : auth.loginuserid,
						id : this.request.id,
						cookie : unique,
						service : "calendar"
					}
					// this.answer.respond();
					// decline_request
					akp_ws.send(obj);
					this.collection.map(unique, this, "decline_request");
					this.$(".evt-invite-respond").html(
							"<span class=evt-invite-ask >updating..</span>");
				},
				showFull : function() {
				},

			});

			var MasterView = Backbone.View
					.extend({
						el : $(".cal_view"),
						settings : {
							isLoaded : false,
						},
						initialize : function() {
							_.bindAll(this, "render", 'handleCalEventSelect',
									"handleViewChange", "respondNotification",
									"generateInvite", 'changeEvent',
									'showEvent');
							var ntfy_opts = {
								el : $(".mt-menu.calendar-tab"),
								service : "calendar",
								onNotificationClick : this.respondNotification,
								className : "yellow"
							}

							this.notifications = auth
									.notificationDialog(ntfy_opts);

							var invt_opts = {
								service : "calendar",
								el : $(".calmenu.invites"),
								onInvite : this.generateInvite,
								onInviteRespond : this.respondInvitation
							};

							this.invitations = auth
									.invitationsDialog(invt_opts);

							this.nlist = new nextEvents({
								baseCollection : this.collection
							});
							this.tlist = new todaylist({
								collection : this.collection
							});

							auth.subscribe("groupInit", this.render);
							// akp_ws.appView.bind("viewChange",this.render,this);

							this.collection.bind("init", this.oninit, this);
							this.collection.bind("visible", this.render, this);
							this.collection.bind("add", this.addEvent, this);
							this.collection.bind("eventremove",
									this.removeEvent, this);
							this.collection.bind("refresh", this.refresh, this);
							this.collection.bind("notification",
									this.addNotification, this);
							this.collection.bind("showEvent",
									this.showEventById, this);
							this.collection.bind("addRequest",
									this.addInvitation, this);
							this.collection
									.bind("alert", this.alertEvent, this);
							this.collection.bind("clear", this.clearCalendar,
									this);

							var self = this;
							// setTimeout(function() {self.show();}, 2000);

							this.show();
							// this.render();
						},
						clearCalendar : function() {
							this.showView();
							$('.cal_view').fullCalendar('removeEvents');
							this.notifications.clear();
							this.invitations.clear();
							this.nlist.clear();
							this.tlist.clear();
						},
						oninit : function() {
							// this.render();
							this.notifications.init();
							this.invitations.init();
							this.nlist.render();
							$('.cal_view').fullCalendar('today');

							// var view=$('.cal_view').fullCalendar('getView');
							// this.collection.getEvents()
						},
						showView : function() {
							$(".event_mgr").hide("slide", {
								direction : "right"
							});
							$(".cal_view").show("slide", {
								direction : "left"
							});
						},
						alertEvent : function(event) {

							akp_ws.notifyOnHidden("Calendar Event Alert");

							var _self = this;

							var slider = $("<div/>")
									.append(
											"Snooze For <select class='akp-input' ><option value='5'>5 Minutes</option><option value='10'>10 Minutes</option><option value='15'>15 Minutes</option></select>")
									.addClass("snooze");

							slider
									.children("select")
									.bind(
											"change",
											function(sel) {
												var el = sel.currentTarget;
												var value = el.options[el.selectedIndex].value;
												$(
														'.snooze-dialog .ui-button-text:contains(SNOOZE)')
														.text(
																'SNOOZE('
																		+ value
																		+ ')');
											})

							$("<div/>")
									.addClass("snooze-dialog")
									.append(
											event.summary
													+ "<br/>"
													+ event.location
													+ "<br/>"
													+ "is going to start now ... <br/>")
									.append(slider)
									.dialog(
											{
												title : event.title,
												modal : true,
												height : "200",
												width : "350",
												closeOnEscape : false,
												resizable : false,
												draggable : false,
												dialogClass : "snooze-dialog",
												buttons : [
														{
															text : "Ok",
															click : function() {
																$(this)
																		.dialog(
																				"close")
																		.remove();
															},
															"class" : "btn btn-primary"
														},
														{
															"class" : "btn btn-success",
															text : "SNOOZE(5)",
															click : function() {
																// _self.snoozeAlert(slider.slider("value"),event.id);
																var snoozeval = slider
																		.children(
																				"select")
																		.val();
																_self
																		.snoozeAlert(
																				snoozeval,
																				event.id);
																$(this)
																		.dialog(
																				"close")
																		.remove();
															}
														} ],
												close : function() {
												},

											});
							// $('.snooze-dialog
							// .ui-button-text:contains(CANCEL)').text('CLOSE');
						},
						snoozeAlert : function(val, id) {
							console.log("sending snooze request");
							var unique = akp_ws.createUUID();

							var obj = {
								cookie : unique,
								service : "calendar",
								mesgtype : "request",
								request : "snooze",
								id : id,
								uid : auth.loginuserid,
								snooze : val,
							}
							akp_ws.send(obj);

						},
						generateInvite : function(invite) {
							console.log(invite);
							var invite = new inviteView({
								invite : invite,
								collection : this.collection,
								invitations : this.invitations
							});

							return invite.render().el;

						},
						addInvitation : function(invite) {
							this.invitations.attachRequest(invite);
						},

						respondInvitation : function() {

						},

						respondNotification : function(obj) {
							// console.log(obj);
							/*
							 * var model=this.collection.get(obj.vevent);
							 * this.showEvent(this.getEventObj(model));
							 */
							this.showEventById(obj.vevent);
						},
						addNotification : function(notification) {
							this.notifications.attachNotification(notification,
									"inc");
						},
						getEventObj : function(model) {
							if (!model)
								return;

							var modelObj = model.toJSON();
							modelObj.start = new Date(modelObj.tstart);
							modelObj.end = new Date(modelObj.tend);
							modelObj.className = modelObj.category;

							if (modelObj.allday == true
									|| modelObj.allday == false)
								modelObj.allDay = modelObj.allday;

							return modelObj;
						},
						addEvent : function(model) {
							var self = this;
							model.bind("change", function() {
								self.changeEvent(model);
							}, this);
							var modelObj = this.getEventObj(model);

							// console.log(modelObj);

							$('.cal_view').fullCalendar('renderEvent',
									modelObj, true);
						},
						changeEvent : function(model) {
							var modelObj = this.getEventObj(model);

							// console.log(modelObj);

							$('.cal_view').fullCalendar('renderEvent',
									modelObj, true);
						},
						removeEvent : function(id) {
							$('.cal_view').fullCalendar('removeEvents', id);
							// this.collection.trigger("refresh");
							EventsDB.get(id).set({
								"deleted" : true
							});
						},
						refresh : function() {
							this.handleViewChange($('.cal_view').fullCalendar(
									'getView'));
						},
						render : function() {

							$('.cal_view').fullCalendar('render');

							return this;

						},

						show : function() {
							var h = $("#fcal").height();
							var date = new Date();
							var d = date.getDate();
							var m = date.getMonth();
							var y = date.getFullYear();

							this.calendar = $('.cal_view')
									.fullCalendar(
											{
												editable : true,
												theme : false,
												header : {
													center : "title",
													right : "prev,month,agendaWeek,agendaDay,next",
													left : "today,{team:"
															+ this.handleCalShift
															+ "}"
												},
												defaultView : 'month',
												weekMode : "liquid",
												selectable : true,
												selectHelper : true,
												viewDisplay : this.handleViewChange,
												windowResize : this.render,
												eventClick : this.showEvent,
												disableDragging : true,
												disableResizing : true,
												select : this.handleCalEventSelect,
												eventRender : this.handleEventRender,
												height : h,
												// events : events,
												ignoreTimezone : false

											});
							$(".cal_view").fullCalendar("today");
							// this.render();

							// var tlist = new
							// todaylist({collection:this.collection});

							// var invlist= new
							// EventInvitations({eventCollection:this.collection});
							// this.addCustomButtons();

						},

						addCustomButtons : function() {
							var custom_buttons = ''
									+ '<span  class="fc-button fc-state-default fc-corner-left fc-state-active" unselectable="on">Group</span>'
									+ '<span  class="fc-button fc-state-default  " unselectable="on" >Personal</span>'
									+
									// '<span class="fc-button fc-state-default
									// fc-corner-right" unselectable="on"
									// >All</span>'+
									'';
							$('.fc-header-left').append(custom_buttons);
						},
						handleCalShift : function() {

						},
						handleEventRender : function(ev, el, view) {
							/*
							 * var debug; debug=true; var
							 * title=el.find(".fc-event-title").after("<br/>");
							 * el.find(".fc-event-time").addClass("icon-clock").before(title);
							 */

						},
						handleViewChange : function(view) {
							// console.log(view.title);

							this.clearAll();
							$('.cal_view').fullCalendar('renderEvents');
							this.collection.getEvents(view.visStart,
									view.visEnd);

						},
						clearAll : function() {
							$('.cal_view').fullCalendar('removeEvents');
							this.collection.reset();
						},
						handleCalWindowResize : function() {

						},
						showEventById : function(id) {
							// var model=this.collection.get(id);
							var model = EventsDB.get(id);
							if (model) {
								showEview.render(model);
							} else {
								this.getEvent(id).onResponse = function(model) {
									EventsDB.add(model);
									showEview.render(model);
								};
							}

							// this.showEvent(this.getEventObj(model));
						},
						getEvent : function(id) {
							var unique = akp_ws.createUUID();
							var obj = {
								cookie : unique,
								mesgtype : "request",
								request : "get_vevent",
								id : id,
								uid : auth.loginuserid,
								gid : auth.cgd,
								personal : false,
								service : "calendar",
							}
							akp_ws.send(obj);
							this.collection.map(obj.cookie, obj, "getVevent");
							return obj
						},
						showEvent : function(calEvent, jsEvent, view) {
							// alert('Event: ' + calEvent.title);
							// alert('Coordinates: ' + jsEvent.pageX + ',' +
							// jsEvent.pageY);
							// alert('View: ' + view.name);

							// change the border color just for fun
							// $(this).css('border-color', 'red');

							/*
							 * var event = new eventModel(calEvent);
							 * showEview.render(event);
							 */

							this.showEventById(calEvent.id);

						},
						handleCalEventSelect : function(start, end, allDay,
								jsEvent, view) {
							$('.cal_view').fullCalendar('unselect');
							var dt = new Date();
							dt.setDate(dt.getDate() - 1);
							var dtm = new Date();
							dtm.setMinutes(dtm.getMinutes()); // TODO : put
																// decrement
																// want to
																// create event
																// in past time
							if (dt > start && allDay) {
								return false;
							} else if (start < dtm && !allDay) {
								return false

							} else {
								var event = new eventModel({
									start : start,
									end : end,
									allDay : allDay
								});

								newEView.render(event, jsEvent).show();
								// this.$el.hide("slide",{direction:"left"});
								// $(".event_mgr").show("slide",{direction:"right"});
							}

						}

					});

			var timezone = Backbone.View.extend({
				initialize : function() {
					this.template = $("#timezone-template").tmpl();
					this.$el.append(this.template);
					var timezone = new Date().getTimezoneOffset();
					var GMTinHours = utils.min2hours(timezone);
					var defaultTzone = this.$(
							".akp-tzone-list-val:contains(" + GMTinHours + ")")
							.html();
					this.$(".akp-tzone-ivalue").val(defaultTzone);
				},
				render : function() {
					return this;
				},
				getTimeZone : function() {
					return this.$(".akp-tzone-ivalue").val();
				}
			});

			var showEventView = Backbone.View
					.extend({
						className : "showCalEvent",
						events : {
							"click .evtDelete" : "eventRemove",
							"click .evtEdit" : "goEdit",
							"click .closeIcon" : "hidePanel",
							"click .evtdrop" : "renderModel",
							"click .evtsave" : "saveEvent",
						},
						initialize : function() {
							_.bindAll(this, "render", "renderModel",
									"shareEventKons", "saveEvent");
							var card = $("<div />").addClass("calEventCard");
							var entry = $("<div />").addClass("calKonsEntry");
							var list = $("<div />").addClass("calEventKons");
							this.$el.appendTo(".event_mgr").append(card)
									.append(entry).append(list).hide();
							this.collection.bind("init", this.getKonsDialog,
									this);
							this.collection.bind("init", this.getKonsStream,
									this);
							this.collection.bind("clear", this.hidePanel, this);
							// this.model.bind("change",this.renderModel,this);

							this.$el.dialog({
								modal : true,
								resizable : false,
								draggable : false,
								open : this.dialogOpenWithoutTitle,
								autoOpen : false,
								minWidth : 600,
								position : [ 'center', 50 ],
								/*hide : {
									effect : 'blind',
									duration : 250
								},
								show : {
									effect : 'blind',
									duration : 1000
								},*/
							});

						},
						dialogOpenWithoutTitle : function() {
							var $dialog = $(this);
							$dialog.closest(".ui-dialog").find(
									".ui-dialog-titlebar").remove();

							$dialog.css({
								padding : "0"
							}).closest(".ui-dialog").css({
								padding : "0"
							});
							// get the last overlay in the dom
							$dialogOverlay = $(".ui-widget-overlay").last();
							// remove any event handler bound to it.
							$dialogOverlay.unbind();
							$dialogOverlay.click(function() {
								// close the dialog whenever the overlay is
								// clicked.
								// if($dialog.attr("data-loaded") == "true")
								$dialog.dialog("close");
							});
						},
						getKonsDialog : function() {
							this.konsEntry = akp_ws.konsDialog({
								el : this.$(".calKonsEntry"),
								type : "standard",
								onShare : this.shareEventKons,
								onCancel : this.clearKonsEntry,
								"basic" : "true",
								richText : false,
							});
						},
						hideKonsEntry : function() {
							this.$(".calKonsEntry").hide();
							this.$(".calEventKons").show();
						},
						showKonsEntry : function() {
							this.$(".calKonsEntry").show();
							this.$(".calEventKons").hide();
						},
						getKonsStream : function() {
							this.konsStream = akp_ws.kons.getKonsStream({
								el : this.$(".calEventKons"),
								basic : true,
								richText : false,
								strictCategory : "calendar",
								onUpdates : this.hideKonsEntry,
							});
							akp_ws.kons.getCategoryUpdates("calendar",
									this.konsStream.updates);
						},
						getEventKons : function(id) {
							this.konsStream.getKonv(id);
						},
						render : function(evt) {
							if (evt)
								this.model = evt;

							this.renderModel();

						},
						renderModel : function() {
							if (!this.model) {
								noty({
									text : "Sorry! event data not available.",
									type : "error",
									timeout : 5000,
									layout : "bottomRight",

								});
								return;
							}

							this.model.bind("change", this.renderModel, this);
							this.mobj = this.model.toJSON();

							this.mobj.start = new Date(this.mobj.tstart);
							this.mobj.end = new Date(this.mobj.tend);
							this.mobj.className = this.mobj.category;

							if (this.mobj.allday == true
									|| this.mobj.allday == false)
								this.mobj.allDay = this.mobj.allday;

							this.mobj.startdate = $.fullCalendar.formatDate(
									this.mobj.start, "yyyy-MM-dd");
							this.mobj.enddate = $.fullCalendar.formatDate(
									this.mobj.end, "yyyy-MM-dd");
							this.mobj.starttime = $.fullCalendar.formatDate(
									this.mobj.start, "hh:mm TT");
							this.mobj.endtime = $.fullCalendar.formatDate(
									this.mobj.end, "hh:mm TT")
							this.mobj.viewtype = this.getViewType(this.mobj);
							this.mobj.isOwner = this
									.isOwner(this.mobj.owner_uid);
							this.mobj.venue = this.mobj.location;
							this.mobj.allDay = this.mobj.allday;

							this.renderEvent(this.mobj);

							if (this.mobj.kons) {
								this.hideKonsEntry();
								this.getEventKons(this.mobj.kons);
							} else {
								this.showKonsEntry();
							}
						},
						renderEvent : function(obj) {
							this.showPanel();
							obj.expired = obj.start < new Date() ? true : false;

							if (obj.attachments)
								obj.hasAttachments = obj.attachments.length ? true
										: false;
							else
								obj.hasAttachments = false;
							var created = auth.getuserinfo(obj.owner_uid);

							obj.userid = created.uid;
							obj.img = created.image_medium
									|| "css/images/user48.png";
							obj.owner_name = created.first_name;

							var template = $("#showEvent-template").tmpl(
									[ obj ]);
							this.$(".calEventCard")
									.removeClass("onfly editing").show().html(
											template);

							if (obj.expired) {
								this.disableEdit();
							}

							if (obj.hasAttachments) {
								this.renderAttachments(obj.attachments);
							}

							if (!obj.limited) {
								this.$(".sevt-invite-stage").append("Group");
							} else {
								this.renderMembers({
									el : this.$(".sevt-invite-stage"),
									members : obj.invited
								});
							}

							if (!obj.accepted.length) {
								this.$(".sevt-accept-stage").append(
										"No one responded!");
							} else {
								this.renderMembers({
									el : this.$(".sevt-accept-stage"),
									members : obj.accepted
								});
							}

							this.$el.show();
						},
						saveEvent : function() {

							if (!this.modelObj.title)
								return;

							var unique = akp_ws.createUUID();
							var obj = {
								service : "calendar",
								mesgtype : "request",
								request : "edit_vevent",
								cookie : unique,
								personal : false,
								uid : auth.loginuserid,
							}

							var request = $.extend({}, this.modelObj, obj);

							console.log(request);

							akp_ws.send(request);

							this.renderModel();

						},
						disableEdit : function() {
							this.$(".evtcontrol").hide();
						},
						renderAttachments : function(collection) {

							this.attachments = akp_ws.FilesViewer({
								el : this.$(".sevt-attach-stage"),
								files : collection
							});
						},
						renderMembers : function(opts) {

							// console.log(opts.members);
							var members = opts.members;

							for ( var i = 0; i < members.length; i++) {
								var user = auth.getuserinfo(members[i]);
								var obj = {
									userid : user.uid,
									img : user.image_small
											|| "css/images/user32.png",
								}
								var temp = $("#user-template").tmpl([ obj ]);
								temp.attr("title", user.first_name);
								opts.el.append(temp);
							}

						},
						isOwner : function(uid) {
							return uid == auth.loginuserid ? true : false;
						},
						getViewType : function(ev) {
							var type;
							if (ev.allDay) {
								if (new Date(ev.startdate)
										- new Date(ev.enddate))
									type = "period";
								else
									type = "day"
							} else {
								type = "hours"
							}
							return type;
						},
						showPanel : function() {
							// Approach deprecated on request

							/*
							 * $(".cal_view").hide("slide",{direction:"left"});
							 * $(".event_mgr").show("slide",{direction:"right"});
							 */

							// Show Dialog using JQuery UI Dialog
							this.$el.dialog("open");

						},
						eventRemove : function() {
							var vevent = this.model.toJSON();
							if (vevent.original_event) {
								this.handleRecurEventRemove(vevent);
								return;
							} else if (vevent.recurring != "none") {

							}
							this.deleteReq(vevent, false);

							// $('.cal_view').fullCalendar("removeEvents",obj.id);

						},
						deleteReq : function(event, recurring) {
							var unique = akp_ws.createUUID();
							var obj = {
								mesgtype : "request",
								request : "delete_vevent",
								id : event.id,
								cookie : unique,
								service : "calendar",
								uid : auth.loginuserid,
							}
							if (recurring != undefined)
								obj.recurring = recurring;

							akp_ws.send(obj);
							this.collection.map(unique, obj, "delete");

							if (event.kons)
								this.konsStream.deleteKons(event.kons);

							this.hidePanel();
						},
						warnForNonRecurEventRemove : function() {

						},
						handleRecurEventRemove : function(event) {
							var _self = this;

							// <br/>* yes to delete all instances<br />* no to
							// to delete this instance <br/>

							$("<div/>")
									.addClass("snooze-dialog")
									.append(
											"<span>" + event.location
													+ "</span><br/>"
													+ "is repeating event ...")
									.dialog(
											{
												title : event.title,
												modal : true,
												height : "200",
												width : "350",

												buttons : [
														{
															text : "Delete All occurences",
															click : function() {
																_self
																		.deleteReq(
																				event,
																				true);
																$(this)
																		.dialog(
																				"close")
																		.remove();
															},
															"class" : "btn greenbtn"
														},
														{
															"class" : "btn blue",
															text : "Delete just this occurence",
															click : function() {
																_self
																		.deleteReq(
																				event,
																				false);
																$(this)
																		.dialog(
																				"close")
																		.remove();
															}
														},
														{
															text : "Cancel",
															"class" : "btn redbtn",
															click : function() {
																$(this)
																		.dialog(
																				"close")
																		.remove();
															}
														} ],
												close : function() {
												},
												resizable : false,
												draggable : false,
												closeOnEscape : false,
												dialogClass : "snooze-dialog",
											});
						},
						hidePanel : function() {
							if (this.model)
								this.model.unbind("change", this.renderModel);
							/*
							 * Deprecated apprach
							 * $(".event_mgr").hide("slide",{direction:"right"});
							 * $(".cal_view").show("slide",{direction:"left"});
							 * this.$el.hide();
							 */

							this.$el.dialog("close");
						},
						/*
						 * Read View
						 */
						shift2ReadView : function() {
							this.$(".calEventCard")
									.removeClass("onfly editing");
						},

						/*
						 * Edit and remove
						 */

						goEdit : function() {
							this.shift2EditView();
							// this.$el.hide("slide",{direction:"up"});
							// newEView.render(this.model).show("slide",{direction:"down"});

						},
						shift2EditView : function() {
							var el = this.$(".calEventCard");
							var modelObj = this.model.toJSON();
							this.modelObj = modelObj;
							el.addClass("editing");
							var self = this;

							el.find(".evtfield-desc").attr("contentEditable",
									true).keyup(
									function(e) {
										self.modelObj.summary = $(
												e.currentTarget).text();
									});

							el
									.find(".title")
									.attr("contentEditable", true)
									.keyup(
											function(e) {
												self.modelObj.title = $(
														e.currentTarget).text();
											});

							var loctext = $(
									'<input type="text" value="'
											+ modelObj.location
											+ '" class="" placeholder="Location" />')
									.keyup(
											function(e) {
												self.modelObj.location = $(
														e.currentTarget).val();
											});

							el.find(".sevtloc").children(".evtfield").remove()
									.end().append(loctext);
							el.find(".sevttype").children(".evtfield-type")
									.remove().end().append(
											this.getEvtType(modelObj.category));
							el
									.find(".sevtreminder")
									.children(".evtfield-reminder")
									.remove()
									.end()
									.append(
											this
													.getEvtRepeat(modelObj.recurring))
						},
						getEvtType : function(selected) {
							var types = [ "Meeting", "BirthDay" ];
							var self = this;
							var selector = $("<select/>").addClass("");
							for ( var i in types) {
								selector.append("<option   value='" + types[i]
										+ "'>" + types[i] + "</option>");
							}

							selector.children(
									"option[value='" + selected + "']").attr(
									"selected", "selected");

							selector
									.bind(
											"change",
											function(sel) {
												self.modelObj.category = sel.currentTarget.options[sel.currentTarget.selectedIndex].value;
											});

							return selector;

						},
						getEvtRepeat : function(reminder) {
							var self = this;
							var types = [ "Never", "Every Day", "Every Week",
									"Every Month" ];
							var values = [ "none", "daily", "weekly", "monthly" ];
							var selector = $("<select/>").addClass("");

							for ( var i in types) {
								selector.append("<option value='" + values[i]
										+ "' >" + types[i] + "</option>");
							}
							selector.children(
									"option[value='" + reminder + "']").attr(
									"selected", "selected");

							selector
									.bind(
											"change",
											function(sel) {
												self.modelObj.recurring = sel.currentTarget.options[sel.currentTarget.selectedIndex].value;
											});

							return selector;
						},
						/*
						 * Event konversations
						 */

						shareEventKons : function(konsObj) {
							konsObj.category = "calendar";
							konsObj.attached_object = this.model.get("id");
							akp_ws.send(konsObj);
						},
						clearKonsEntry : function() {

						}

					});

			var createEventView = Backbone.View
					.extend({

						className : "newCalEvent",
						initialize : function() {
							_.bindAll(this, "renderMax", "hideAccessOpts",
									"setUsers", "saveEvent");
							this.$el.appendTo(".event_mgr").hide();
							this.collection.bind("clear", this.hide, this);
							$(document).click(this.hideAccessOpts);

						},
						events : {
							"click .savebtn" : "saveEvent",
							"click .cancelbtn" : "hide",
							"click .evtbig" : "renderMax",
							"click .accessChangeBtn" : "showAccessOpts",
							"click .opt" : "selectMode",
							"click .accessUserbrowser" : "userBrowser"
						},
						render : function(model, pos) {
							this.model = model;
							this.mobj = this.model.toJSON();

							this.mobj.startdate = $.fullCalendar.formatDate(
									this.mobj.start, "yyyy-MM-dd");
							this.mobj.enddate = $.fullCalendar.formatDate(
									this.mobj.end, "yyyy-MM-dd");
							this.mobj.starttime = $.fullCalendar.formatDate(
									this.mobj.start, "hh:mm TT");
							this.mobj.endtime = $.fullCalendar.formatDate(
									this.mobj.end, "hh:mm TT")
							this.mobj.viewtype = this.getViewType(this.mobj);

							return this.renderMax(this.mobj, pos)

						},
						renderMin : function(obj, pos) {
							this.$el.addClass("onfly").appendTo(".cal_view");
							var template = $("#newEventMin-template").tmpl(
									[ obj ]);
							return this.$el.show().html(template).css({
								top : pos.pageY,
								left : pos.pageX
							});
						},
						renderMax : function(obj) {

							this.showMax();
							var obj = obj.viewtype ? obj : this.mobj;

							this.$el.appendTo(".event_mgr");
							var template = $("#newEvent-template")
									.tmpl([ obj ]);
							this.$el.removeClass("onfly").html(template);

							this.userInput = contacts.selector({
								el : this.$(".accessUsersList")
							}).render();
							this.$(".accessUsers").hide();
							this.timezone = new timezone({
								el : this.$(".evt-timezone")
							});

							this.attachments = akp_ws.FSDialog({
								el : this.$(".evt-attach-btn"),
								container : this.$(".evt-attach-container"),
								onAdd : this.showAttachments,
							})

							this.selectType(obj.className);
							this.selectReminder(obj.reminder);
							this.showInvitees(obj.invitees);

							this.$(".evtname").focus();

							return this.$el;

						},
						selectType : function(type) {
							if (!type)
								return;
							if (!type.length)
								return;

							this.$('.evttype option:contains(' + type[0] + ')')
									.attr("selected", "selected").siblings()
									.removeAttr("selected");
						},
						selectReminder : function(reminder) {
							if (!reminder)
								return;
							this.$(
									'.evtreminder option:contains("' + reminder
											+ '")')
									.attr("selected", "selected").siblings()
									.removeAttr("selected");
						},
						showInvitees : function(invitees) {
							if (!invitees)
								return;
							if (!invitees.length)
								return;
						},
						showAttachments : function() {
							this.$(".evt-attachements").show();
						},
						showMax : function() {
							$(".cal_view").hide("slide", {
								direction : "left"
							});
							$(".event_mgr").show("slide", {
								direction : "right"
							});
						},
						hide : function() {
							this.$el.hide();
							$(".event_mgr").hide("slide", {
								direction : "right"
							});
							$(".cal_view").show("slide", {
								direction : "left"
							});
						},
						saveEvent : function() {
							var event = this.validate();
							if (event) {
								this.hide();
								// $('.cal_view').fullCalendar('renderEvent',
								// event);

							} else
								return false;

							var unique = akp_ws.createUUID();
							var endUTC = event.end ? new Date(event.end)
									.toISOString() : new Date(event.start)
									.toISOString();
							var obj = {
								cookie : unique,
								service : "calendar",
								mesgtype : "request",
								request : "add_vevent",
								personal : false,
								uid : auth.loginuserid,
								gid : auth.cgd,
								category : this.$('.evttype').val(),

								// attachments :listcopy(msg.attachments),
								recurring : this.$('.evtreminder').val(),
								tstart : new Date(event.start).toISOString(),
								tend : endUTC,
								title : this.$(".eventname").val(),
								summary : this.$(".eventnote").text(),
								location : this.$(".eventloc").val(),
								invited : this.userInput.getSelected(),
								timezone : this.timezone.getTimeZone(),
								allday : event.allDay,
								attachments : this.attachments.getFileList(),
							};

							if (!obj.invited.length) {
								obj.invited = contacts.getGroupList();
								obj.limited = false;
							} else {
								obj.limited = true;
							}
							console.log(obj);

							akp_ws.send(obj);
							this.collection.trigger("refresh");
						},
						validate : function() {
							var title = this.$(".eventname").val();
							var event = this.model.toJSON();
							if (!title) {
								this.$(".evtErrMsg").html(
										"* Enter event name to save");
								return false;
							} else {
								event.title = title;
							}

							event.className = $("#evttype").val();// type
							event.venue = $(".eventloc").val();// location
							event.description = $(".eventnote").text();
							event.reminder = $(".evtreminder").val();
							event.invitees = this.userInput.getSelected();
							return event;

						},
						getViewType : function(ev) {
							var type;
							if (ev.allDay) {
								if (new Date(ev.startdate)
										- new Date(ev.enddate))
									type = "period";
								else
									type = "day"
							} else {
								type = "hours"
							}
							return type;
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
						showAccessOpts : function(e) {
							e.stopPropagation();
							e.preventDefault();
							this.$(".accessChangeOpts").show();
						},
						selectMode : function(e) {
							this.hideAccessOpts();

							var mode = $(e.currentTarget).attr("data-mode");
							var prev = this.$(".accessChangeOpts").data("mode");
							if (mode == prev)
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
							// this.settings.mode=mode;
							var classname = (mode == "public") ? "icon-earth"
									: "icon-users-2";
							this.$(".follow-mode").removeClass(
									"icon-earth icon-users-2").addClass(
									classname);
							this.$(".accessChangeOpts").data("mode", mode);
						},
						hideAccessOpts : function(e) {

							this.$(".accessChangeOpts").hide();
						},
						showUserSelector : function() {
							this.$(".accessUsers").show();
							this.userInput.getFocus();
						},

						hideUserSelector : function() {
							this.$(".accessUsers").hide();
							this.userInput.reset();
						},
					});

			var daysCollection = Backbone.Collection.extend({
				model : eventModel,
				initialize : function() {
					// console.log("days collection initialized");
				}
			});

			var todaylist = Backbone.View
					.extend({
						el : $(".todayevents"),
						events : {
							"click .evt-title" : "showEvent"
						},
						initialize : function() {

							_.bindAll(this, "render");

							this.loaded = false;
							this.collection.bind("add", this.render2dayEvent,
									this);
							// $(".daylist").hide();

							/*
							 * this.events =
							 * $('.cal_view').fullCalendar('clientEvents',
							 * function(event) {
							 * 
							 * });
							 * 
							 * this.render();
							 */
						},
						is2dayEvent : function(event) {
							var date = new Date();
							var date1 = new Date(date.getFullYear(), date
									.getMonth(), date.getDate());
							var date2 = new Date(date.getFullYear(), date
									.getMonth(), date.getDate() + 1);
							var start = new Date(event.start);
							return start >= date1 && start < date2;
						},
						render : function() {

							for (event in events) {

								// $(".calmenulist ul").append(item.clone());
							}

						},
						modObj : function(model) {
							var modelObj = model.toJSON();
							modelObj.start = new Date(modelObj.tstart)
									.toUTCString();
							modelObj.end = new Date(modelObj.tend)
									.toUTCString();
							modelObj.className = modelObj.category;
							return modelObj;
						},
						render2dayEvent : function(model) {
							var event = this.modObj(model);

							if (!this.is2dayEvent(event))
								return;

							if (this.isExisting(event.id))
								return;
							// $(".daylist").show();

							var obj = {
								title : event.title,
								day : $.fullCalendar.formatDate(new Date(
										event.start), "hh:mm "),// new
																// Date(event.start).getDate(),
								month : $.fullCalendar.formatDate(new Date(
										event.start), "TT"),
								id : event.id,
								description : event.summary,
								venue : event.location,
							}

							var item = $("<li/>").append(
									$("#calEvent-template").tmpl(obj));

							if (!this.loaded) {
								this.loaded = true;
								this.$('ul').empty();
							}

							this.$(".empty-evt").remove();
							this.$('ul').append(item);
						},
						isExisting : function(id) {
							return this.$("li>div[data-evtid=" + id + "]").length;
						},
						showEvent : function(e) {
							var evtid = $(e.currentTarget).closest(
									"div.calevent").data("evtid");
							this.collection.trigger("showEvent", evtid);
						},
						showEmptyMsg : function() {
							$(
									'<li class="empty-evt"><div class="calevent empty-invite" >No Events</div></li>')
									.appendTo(this.$("ul"));
						},
						clear : function() {
							this.$('ul').empty();
							this.showEmptyMsg();
						}
					})

			var nextEvents = Backbone.View
					.extend({
						el : $(".calmenu.upcoming"),
						events : {
							"click .evt-title" : "showEvent",
							"scroll .calmenulist" : "getMore"
						},
						settings : {
							marker : 0,
							lastTimestamp : 0,
							lastTop : 0,
						},
						initialize : function(opts) {

							_.bindAll(this, "render", "attachEvent",
									"showEvent", "getMore");
							this.baseCollection = opts.baseCollection;
							this.collection = new daysCollection;
							this.collection.bind("add",
									this.renderNextdayEvent, this);
							this.$(".calmenulist").bind("scroll", this.getMore);
							this.loaded = false;

							// $(".calmenu.upcoming").hide();

						},
						render : function() {
							this.getRequestForUpcomingEvents();
							return this;
						},
						renderEvent : function() {
							console.log("testing upcoming events");
						},
						getRequestForUpcomingEvents : function(marker) {
							var unique = akp_ws.createUUID();

							var obj = {
								service : "calendar",
								mesgtype : "request",
								request : "get_upcoming",
								uid : auth.loginuserid,
								cookie : unique,
								personal : false,
							}

							if (marker) {
								obj.marker = marker;
								// console.log("request for upcoming with
								// marker");
							}
							akp_ws.send(obj);

							this.baseCollection.map(unique, this, "upcoming");
						},
						getMore : function() {
							var top = this.$(".calmenulist").scrollTop();
							var scrollheight = this.$(".calmenulist")[0].scrollHeight;// this.$el.height();
							var offsetheight = this.$(".calmenulist")[0].offsetHeight
							var contentheight = scrollheight - offsetheight;
							// var docHeight=$(document).height();
							if (top > this.settings.lastTop) {

								// if(top+ height > docHeight-50 ) {
								if (contentheight < top + 50) {
									var id = this.$("li:last-child").children(
											".calevent").attr("data-evtid");
									var model = this.collection.get(id);
									// console.log(model.toJSON());
									var marker = model.toJSON().tstart;

									if (marker != this.settings.marker) {

										this
												.getRequestForUpcomingEvents(marker);
										this.settings["marker"] = marker;
									}
								}
							}
							this.settings.lastTop = top;
							return;
						},
						attachEvent : function(obj) {

							this.collection.add(obj);
							EventsDB.add(obj);
						},
						modObj : function(model) {
							var modelObj = model.toJSON();
							modelObj.start = new Date(modelObj.tstart)
									.toUTCString();
							modelObj.end = new Date(modelObj.tend)
									.toUTCString();
							modelObj.className = modelObj.category;
							return modelObj;
						},
						isNextdayEvent : function(event) {

							var start = new Date(event.start);
							return start >= this.date1; // && start <
														// this.date2;
						},
						renderNextdayEvent : function(model) {
							var event = this.modObj(model);

							/*
							 * if(!this.isNextdayEvent(event)) return;
							 */
							if (this.isExisting(event.id))
								return;

							// $(".calmenu.upcoming").show();

							var obj = {
								title : event.title,
								id : event.id,
								description : event.summary,
								venue : event.location,
							}

							if (event.allday) {
								obj.day = $.fullCalendar.formatDate(new Date(
										event.start), "dd");// new
															// Date(event.start).getDate(),
								obj.month = $.fullCalendar.formatDate(new Date(
										event.start), "MMM");
								obj.date = "Full Day";
							} else {
								obj.day = $.fullCalendar.formatDate(new Date(
										event.start), "dd");// new
															// Date(event.start).getDate(),
								obj.month = $.fullCalendar.formatDate(new Date(
										event.start), "MMM");
								obj.date = $.fullCalendar.formatDate(new Date(
										event.start), "hh:mmTT ")
							}

							var item = $("<li/>").append(
									$("#calEvent-template").tmpl(obj));

							if (!this.loaded) {
								this.$("ul").empty();
								this.loaded = true;
							}

							this.$(".empty-evt").remove();
							this.$("ul").append(item);
						},
						showEvent : function(e) {
							var evtid = $(e.currentTarget).closest(
									"div.calevent").data("evtid");
							this.baseCollection.trigger("showEvent", evtid);
						},
						isExisting : function(id) {
							return this.$("li>div[data-evtid=" + id + "]").length;
						},
						showEmptyMsg : function() {
							$(
									'<li class="empty-evt"><div class="calevent empty-invite" >No Events</div></li>')
									.appendTo(this.$("ul"));
						},
						clear : function() {
							this.collection.reset();
							this.$("ul").empty();
							this.showEmptyMsg();
						}
					});

			var collection = new baseCollection;

			var calView = new MasterView({
				collection : collection
			});

			var newEView = new createEventView({
				collection : collection
			});
			var showEview = new showEventView({
				collection : collection,
			});

			return collection;

		});

/**
 * @author Rajukonga
 */
define(
		"akpTour",
		[ "jquery", "underscore", "backbone", "akputils" ],
		function($, _, Backbone, utils) {
			
			
			var descView = Backbone.View.extend({
				el : $(".tourcard"),
				events : {
					"click span.tourclsbtn" : "close"
				},
				initialize : function() {

					this.firstVisit = {
						"container" : true,
						//"dstore" : true,
						"kons" : true,
						"planner" : true,
						//"pinit" : true,
						"men" : true,
						"pdt" : true
					};

					this.positions = {
						"container" : {
							"top" : "20%",
							"left" : "30%"
						},
						
						"kons" : {
							"top" : "20%",
							"left" : "40%"
						},
						"planner" : {
							"top" : "50%",
							"left" : "20%"
						},
						/*"pinit" : {
							"top" : "40%",
							"left" : "60%"
						},"dstore" : {
							"top" : "50%",
							"left" : "60%"
						},*/

					}

					this.cards = {
						"container" : ".card1",
						
						"kons" : ".card2",
						"planner" : ".card5",
						/*"pinit" : ".card6",
						"dstore" : ".card4",
*/
					}

				},
				render : function(tabId) {

					$(".card").hide();
					$(".tourcard").hide();
					if (this.firstVisit[tabId]) {
						$(".tourcard").css(
								this.positions[tabId]).show();
						$(this.cards[tabId]).show('fade');
					}

				},
				close : function() {

					var id = $(".card:visible").data("cardid");
					this.firstVisit[id] = false;

					$(".card").hide();
					$(".tourcard").hide();

				}

			});
			return descView;
			
		
		});
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
						    var fsusage= Math.round(auth.org.fsusage);
						    
						    $(".konb.storage").attr("rel",fsusage);
						    
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
/**
 * @author Rajukonga
 */
define("picUpdater", [ "jquery", "underscore", "backbone", "akputils",
		"plugins/jquery-ui", "jcrop/jquery.Jcrop.min", "plugins/Blob",
		"plugins/canvas-toBlob", "plugins/jquery-tmpl" ], function($, _,
		Backbone, utils) {

	var picUpdater = Backbone.View.extend({
		el : "#profilePicAlter",
		events : {

			'click #imageSubmit' : "updateTarget",
			"click #picChangeClose" : "close",
			"dragover #surface" : "handleDragOver",
			"drop #surface" : "handleUpload",
			"dragenter #surface" : "handleDragEnter",
			"dragleave #surface" : "handleDragLeave",
			"click .picSelectBtn":"handleSelectBtn",
			"change .picSelectInput":"handleUpload",

		},
		initialize : function(opts) {
			this.controller = opts.controller;

			_.bindAll(this, "getSelection", "close", "messageHandler",
					"cropImage", "postBlob","handleUpload");

			var cropWidget = document.getElementById('cropWidget');
			this.surface = document.getElementById('surface');
			this.canv1 = document.getElementById('canv1');
			this.canv2 = document.getElementById('canv2');
			var imageSubmit = document.getElementById('imageSubmit');

			this.ctx1 = canv1.getContext('2d');
			this.ctx2 = canv2.getContext('2d');

			var origin = document.getElementById('profilePicAlter');

			this.Worker = new SharedWorker("profilePic_upload.js");
			this.Worker.port.start();
			this.Worker.port.onerror = this._error;
			this.Worker.port.onmessage = this.messageHandler;

			/*
			 * this.lightbox = $("<div/>").addClass("overlay")
			 * .appendTo("body").hide();
			 */

		},
		handleSelectBtn:function(){
			this.$(".picSelectInput").click();
		},
		handleDragOver : function(e) {
			e.preventDefault();
			e.stopPropagation();
			e.dataTransfer.dropEffect = 'copy';
		},
		handleUpload : function(e) {
			e.preventDefault();
			e.stopPropagation();
			this.$('#surface').removeClass("drop-effect");
			if(e.dataTransfer)
				this.loadImg(e.dataTransfer.files[0]);
			else if(e.target)
				this.loadImg(e.target.files[0]);
		},
		handleDragEnter : function() {
			this.$('#surface').addClass("drop-effect");
		},
		handleDragLeave : function() {
			this.$('#surface').removeClass("drop-effect");
		},
		_error : function(e) {
			consloe.log('ERROR: Line ', e.lineno, ' in ', e.filename, ': ',
					e.message);
		},
		messageHandler : function(e) {
			var dat = e.data.obj;
			if (!e.data.obj) {
				// console.log(e.data);
			} else if (dat.mesgtype == 'request' || dat.mesgtype == 'cancel') {
				dat.uid = this.controller.loginuserid;
				dat.gid = this.controller.cgd || 0;

				this.transporter.postData(dat);
				this.controller.maptable[dat.cookie] = 'picUpload';

			} else if (dat.mesgtype == 'complete') {

				// setuserbymodified();
				// akp_auth.setuserbymodified();
				this.trigger("completed");
				this.close();
				if( typeof this.onSuccess === 'function')
				this.onSuccess.call(this,this.getSelection());
				/*
				 * Here we have to send the get request to the server. we have
				 * to display animation for uploading image.
				 */
			}

		},
		updateTarget : function() {
			this.disableDialog();
			this.$("#imageSubmit").attr("disabled", "disabled").html(
					"uploading..");
			this.upload();
		},
		loadImg : function(imgFile) {
			var self = this;
			/*
			 * check for image type If Not return
			 * 
			 */
			if (!imgFile.type.match(/image.*/))
				return;

			var img = document.createElement("img");
			img.id = "pic";
			img.file = imgFile;
			/*
			 * create the image element read the uploaded file then display
			 */
			var reader = new FileReader();
			reader.onload = function(e) {
				img.onload = function() {
					self.displayImage(img);
				};
				img.src = e.target.result;

			};
			reader.readAsDataURL(imgFile);
		},
		cropImage : function(c) {
			var w = c.x2 - c.x;
			var h = c.y2 - c.y;

			this.ctx2.drawImage(this.canv1, c.x, c.y, w, h, 0, 0, 200, 230);

		},
		uploadSelection : function(e) {
			//var obj = e.data.obj;

			var imgData = document.getElementById('canv2').toDataURL(
					"image/png");
			//obj.picChanged = true;

			// $(".userPic").attr('src', imgData);
			// $("#profilePicAlter").hide();
			// $("#userprofile_view").show();

			return false;
		},
		postBlob : function(blob) {

			var msgObj = {
				'mesgtype' : 'file_list',
				'files' : blob,
				'dname' : this.target,
			// akp_ws.vault.getUserHome() + "/profile.png"
			};

			this.Worker.port.postMessage(msgObj);

		},
		upload : function() {
			this.canv2.toBlob(this.postBlob, "image/png");
		},
		post : function(msg) {
			this.Worker.port.postMessage(msg);
		},
		picChangeCancel : function(e) {

			this.trigger("canceled")
			// e.data.obj.picChanged = false;
			// $("#profilePicAlter").hide();
			// $("#userprofile_view").show();

			// ctx1.clearRect(0, 0, canv1.width, canv1.height);
			// ctx2.clearRect(0, 0, canv2.width, canv2.height);
			// $('#pic').remove();
			// surface.removeChild(surface.childNodes[0]);
			// $('#surface').append("<p>Drop Photo Here</p>");
			// resize(surface, 400, 400);
		},
		displayImage : function(img) {
			var w = img.width < 400 ? img.width : 400;
			var h = img.height < 400 ? img.height : 400;

			this.resize(img, w, h);
			this.resize(canv1, w, h);
			this.resize(surface, w, h);
			this.resize(cropWidget, w, h);

			/*while (this.surface.childNodes[0])
				this.surface.removeChild(surface.childNodes[0]);
*/
			this.$("#surface").empty();
			
			this.surface.appendChild(img);
			this.ctx1.drawImage(img, 0, 0, w, h);
			$("#" + img.id).Jcrop({
				aspectRatio : 1,
				onSelect : this.cropImage,
				setSelect : [ 200, 200, 50, 50 ],
				bgOpacity : .3,
				bgColor : 'white'

			});
		},

		resize : function(comp, width, height) {
			comp.width = width;
			comp.height = height;
			comp.style.width = width + 'px';
			comp.style.height = height + 'px';
		},

		profilePicHandler : function() {

			// $('#userprofile_view').hide();
			// $('#profilePicAlter').show();
			this.clear();

		},
		render : function(opts) {
			this.transporter = opts.transporter;
			this.target = opts.target;
			this.onSuccess=opts.onSuccess;
			
			// this.lightbox.show();
			this.$el.modal("show");
			this.clear();
			return this;

		},
		show : function() {
			this.$el.show();
		},
		hide : function() {
			this.$el.hide();
		},
		getSelection : function() {

			var imgData = document.getElementById('canv2').toDataURL(
					"image/png");
			// akp_auth.picChanged = true;
			// 
			this.trigger("updated", imgData);

			// this.close();

			return imgData;

		},
		clear : function() {
			this.ctx1.clearRect(0, 0, this.canv1.width, this.canv1.height);
			this.ctx2.clearRect(0, 0, this.canv2.width, this.canv2.height);
			//$('#pic').remove();

			this.appendSelectors();
			this.resize(surface, 400, 400);
		},
		appendSelectors:function(){
			var input=$("<input type='file' class='picSelectInput' />").css({"visibility":"hidden","width":"0px"});
			var btn=$("<button class='picSelectBtn btn btn-primary'> Select from your computer</button>");
			var msg=$("<p>Drop Here or <br/><br/></p>").append(input).append(btn);
			this.$('#surface').empty().append(msg);
		},
		close : function() {
			// this.lightbox.hide();

			this.$el.modal("hide");
			this.$("#imageSubmit").removeAttr("disabled").html("Done");
			this.enableDialog();

			// this.clear();
		},
		disableDialog : function() {
			
			this.$el.find("button.close").removeAttr("data-dismiss");

		},
		enableDialog : function() {
			
			this.$el.find("button.close").attr("data-dismiss","modal");
		},
	});

	return picUpdater;
});

/**
 * @author Rajukonga
 */
define(
		"akpprofiles",
		[ "jquery", "underscore", "backbone", "akputils", "plugins/jquery-ui",
				"jcrop/jquery.Jcrop.min", "plugins/Blob",
				"plugins/canvas-toBlob", "plugins/jquery-tmpl" ],
		function($, _, Backbone, utils) {

			/*
			 * ===============================================================================================
			 * Profile View Manager
			 * ==============================================================================================
			 */

			var ProfileView = Backbone.View
					.extend({
						el : $("#userprofile_view"),
						events : {
							"click #profileEdit" : "editView",
							"click #profileSave" : "save",
							"click #changePic" : "getPic",
							"click #profileEditCancel" : "cancelEdit",

						// not in view
						// "click #userinfo":"activeProfile",

						},
						initialize : function(opts) {

							_.bindAll(this, "render", "activeProfile",
									"getClientProfile","showUpdate");

							this.controller = opts.controller;
							// $('#userinfo').bind('click',
							// this.getClientProfile);

						},

						render : function() {

							var template = $("#profile-template").tmpl(
									this.user);
							this.$el.html(template);

							this.$('#profileSave').hide();
							this.$("#profileEditCancel").hide();

						},
						show : function(opts) {

							if (typeof opts === 'undefined' || opts.id == this.controller.loginuserid
									|| opts.uid == this.controller.loginuserid) {
								this.activeProfile();
								return;
							}

							this.model = this.collection.getModelByUid(opts.uid
									|| opts.id);
							this.user = this.model.toJSON();
							this.user.mode = opts.mode;
							this.render();

						},
						getClientProfile : function() {
							/*
							 * akp_ws.appView.navView.changeView("dashboard",
							 * "userprofile_view");
							 */
							this.activeProfile();
						},
						activeProfile : function(user) {
							// akp_ws.appView.navView.changeView("dashboard","userprofile_view");

							this.user = user || this.controller.activeuser;
							this.user.mode = "write";
							this.render();
						},
						editView : function(e) {
							e.preventDefault();

							/*
							 * this.controller.profileChange({ data : { obj :
							 * this.controller } });
							 */

							// $('#userprofile_view').hide();
							// $('#userprofile').show();
							/*
							 * Changing text to controls
							 */
							var obj = this.controller;
							var sampleUser = obj.usersList[obj.loginuserid];
							// console.log(sampleUser);

							// console.log(sampleUser.work);

							// $('.prfl_uname').html('<input type="text"
							// id="user_name"
							// value="' + sampleUser.uname + '" required>');
							$('.prfl_fname')
									.html(
											'<input type="text" id="first_name" name="first_name" value="'
													+ sampleUser.first_name
													+ '" placeholder="First Name" required>');
							$('.prfl_mname').html(
									'<input type="text" id="middle_name" name="middle_name" value="'
											+ sampleUser.middle_name
											+ '" placeholder="Middle Name" >');
							$('.prfl_lname')
									.html(
											'<input type="text" id="last_name" name="last_name" value="'
													+ sampleUser.last_name
													+ '" placeholder="Last Name" required>');
							$('.prfl_sex')
									.html(
											'<select id="sex" ><option>Male</option><option>Female</option></select>');
							$('.prfl_dob')
									.html(
											'<input type="date" id="dob" name="dob" value="'
													+ sampleUser.dob
													+ '" placeholder="Date of Birth" required>');
							$('.prfl_mobile')
									.html(
											'<input type="text" id="mobile" name="mobile_no" value="'
													+ sampleUser.mob
													+ '" placeholder="Mobile" required>');
							$('.prfl_haddr').html(
									'<textarea rows="5" cols="25" id="haddr" value="">'
											+ sampleUser.homeaddress
											+ '</textarea>');
							$('.prfl_designation')
									.html(
											'<input type="text" id="jobtitle" name="jobtitle" value="'
													+ sampleUser.jobtitle
													+ '" placeholder="Designation" required>');
							$('.prfl_dept')
									.html(
											'<input type="text" id="dept" name="dept" value="'
													+ sampleUser.dept
													+ '" placeholder="Department Name" required>');
							$('.prfl_comp')
									.html(
											'<input type="text" id="org" name="org" value="'
													+ sampleUser.organization
													+ '" placeholder="Company Name" required>');

							$('#sex').val(sampleUser.sex);
							$('#changePic').css('display', 'block');

							/*
							 * Displaying neccessary buttons only
							 */
							$('#profileEdit').hide();
							$('#profileClose').hide();
							$('#profileSave').show();
							$('#profileEditCancel').show();

						},
						save : function(e) {
							e.preventDefault();

							var dept = $('input#dept').val();
							var dob = $('input#dob').val();
							var fname = $('input#first_name').val();
							var haddr = $('#haddr').val();
							var jobtl = $('input#jobtitle').val();
							var lname = $('input#last_name').val();
							var mname = $('input#middle_name').val();
							var mob = $('input#mobile').val();
							var org = $('input#org').val();
							var usex = $('#sex').val();
							var waddr = $('#waddr').val();

							var userObj = {
								"first_name" : fname,
								"middle_name" : mname,
								"last_name" : lname,
								"dob" : dob,
								"email" : this.user.email,
								"mob" : mob,
								"sex" : usex,
								"homeaddress" : haddr,
								"jobtitle" : jobtl,
								"dept" : dept,
								"organization" : org,
							}

							this.controller.setuser(userObj, this.showUpdate);
							$('#profileSave').attr("disabled","disabled");
							$('#profileEditCancel').attr("disabled","disabled");

						},
						showUpdate : function(resp) {
							if (resp.user) {
								this.activeProfile(resp.user);
							}
							else if(resp.error){
								
							}
							this.$('#profileSave').removeAttr("disabled");
							this.$('#profileEditCancel').removeAttr("disabled");
						},

						cancelEdit : function(e) {
							e.preventDefault();
							this.render();
						},
						getPic : function(e) {
							e.preventDefault();

							/*
							 * Passing Target to save picture and trasnport
							 * object to send messages
							 */

							this.controller.picUpdater.render({
								// controller:akp_auth,
								transporter : akp_ws,
								target : akp_ws.vault.getUserHome()
										+ "/profile.png",
								onSuccess : this.updatePic,
							});
						},
						updatePic : function(img) {
							$(".userPic").attr('src', img);
							
							this.controller.setuser(this.controller.activeuser);
							
							/*this.controller.setuser(this.controller.contacts
									.getUserByUid(this.controller.loginuserid));
									*/
						},
						

					});
			
			
			return ProfileView;

		});
define("pdfOpener", ["jquery", "underscore", "backbone", "akpauth","akputils","plugins/pdf" ], 
		function($, _, Backbone, auth,utils) {
	 PDFJS.workerSrc = './js/lib/pdfjs/worker_loader.js';
	 //"js/lib/pdfjs/annotation.js",
	 
	var docOpener=function(){
		
	}

	
	docOpener.prototype.open=function(url,canvas){
		
		
		
		
		$(".viewer-screen").show();
		
		var iframe = document.getElementById('pdf-vwr-frame').contentWindow;

		//periodical message sender
		//setInterval(function(){
			
			//console.log('blog.local:  sending message:  ' + message);
			iframe.postMessage({data:url,pdfjsLoadAction: "complete" },akp_ws.originURL); //send the message and target URI
		//},6000);
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
	 //
	 // Fetch the PDF document from the URL using promices
	 //
	/* PDFJS.getDocument(url).then(function(pdf) {
	   // Using promise to fetch the page
	   pdf.getPage(1).then(function(page) {
	     var scale = 1.5;
	     var viewport = page.getViewport(scale);

	     //
	     // Prepare canvas using PDF page dimensions
	     //
	     var canvas = document.getElementById('the-canvas');
	     var context = canvas.getContext('2d');
	     canvas.height = viewport.height;
	     canvas.width = viewport.width;

	     //
	     // Render PDF page into canvas context
	     //
	     var renderContext = {
	       canvasContext: context,
	       viewport: viewport
	     };
	     page.render(renderContext);
	   });
	 });*/
		
		
		
	}
	
	return new docOpener;
	 
	
});
/**
 * @author Rajukonga
 */
define("feedback",
		[ "jquery", "underscore", "backbone", "akputils", "akpauth" ],
		function($, _, Backbone, utils, auth) {

			var FeedbackView = Backbone.View.extend({
				el : "#feedback_dialog",
				events : {
					"submit #feedback_form" : "preventAction",

				},
				initialize : function() {
					_.bindAll(this, "handleSuccess");
				},
				render : function() {

				},
				preventAction : function(e) {
					e.preventDefault();
					var obj = {
						uid : auth.loginuserid,
						oid:auth.org.id,
						stmt : this.$(".fdbk_stmt").val(),
						email : this.$(".fdbk_email").val(),
						name : auth.activeuser.first_name,
					}

					$.ajax({
						url : "https://www.antkorp.in/php/feedback.php",
						type : "post",
						data : {
							userFeedback : obj, //JSON.stringify(obj),
						},
						success : this.handleSuccess,

						error : function(jqXHR, textStatus, errorThrown) {

							console.log("The following error occured: "
									+ textStatus);
							console.log(errorThrown);
						},

					});
				},
				handleSuccess : function(response) {
					var resp=response;

					//resp = JSON.parse(response);
					if (resp) {
						this.$(".fdbk_stmt").val("");
						this.$(".fdbk_email").val("");
						this.$el.modal("hide");
					}
				}
			});

			return FeedbackView;
		});
define(
		"socketModule",
		[],
		function() {

			/*
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 * Socket
			 * =======================================================================
			 */

			var socketModule = function() {

				this.clientid = null;// For initializing
				this.clientidRecvd = false;
				this.svcstatus = {};
				this.regServices = {};
				this.respondTimer;
				this.port = 8080;//443;
				this.host = window.location.host;
				this.protocal = "wss://";
				this.serverAddress = this.protocal + this.host + ":"
						+ this.port; // "ws://www.antkorp.in:443";
				this.serviceRequests = "/services=ngw,auth,fmgr,kons,rtc,calendar";

			}
			socketModule.prototype.init = function(statuschange// status msgs
			, message // message handler to deliver service msgs
			, handler // the object is to call
			) {
				var self = this;
				this.statusupdate = statuschange;// required
				this.sendMessage = message;// required
				this.handleObj = handler;// required

				if ("WebSocket" in window) {
					this.ws = new WebSocket(this.serverAddress
							+ this.serviceRequests);

					console.log("connection issued");
					self.handleNotResponding();
					this.ws.binaryType = 'arraybuffer';
					this.ws.onopen = function(e) {

						//5 seconds  waiting for socket ready
						setTimeout(function() {
							self.conOpen(e);
						},  100);

					};
					this.ws.onerror = function(e) {
						self.conError(e)
					};
					this.ws.onclose = function(e) {
						self.conClose(e)
					};
					this.ws.onmessage = function(e) {
						self.handleMessage(e)
					};
				} else {
					this.statusupdate.call(this, {
						status : "notSupported",
					});
				}

			}

			// Testing XHR requests

			/*
			 * function reqListener () { console.log(this.responseText); };
			 * 
			 * var oReq = new XMLHttpRequest(); oReq.onload = reqListener;
			 * oReq.open("get", "http://www.antkorp.in:443/akorp.css", true);
			 * oReq.send();
			 * 
			 */
			socketModule.prototype.handleNotResponding = function() {
				/*
				 * 30 seconds to wait for response.
				 */
				var self = this;
				this.respondTimer = setTimeout(function() {
					self.statusupdate.call(self.handleObj, {
						status : "notResponding",
					});
				}, 30 * 1000)
			}
			socketModule.prototype._gotResponse = function() {
				clearTimeout(this.respondTimer);
			}
			socketModule.prototype.close = function(e) {
				this.ws.close();

			}

			socketModule.prototype.conOpen = function(e) {
				this.statusupdate.call(this.handleObj, {
					status : "opened",
					data : e
				});
				this.svcstatus["ngw"] = true;
				this._gotResponse();
			}

			socketModule.prototype.conError = function(e) {
				this.statusupdate.call(this.handleObj, {
					status : "error",
					data : e
				});
				this._gotResponse();

			}
			socketModule.prototype.conClose = function(e) {
				this.statusupdate.call(this.handleObj, {
					status : "closed",
					data : e
				});
				this._gotResponse();
			}
			socketModule.prototype.send = function(msg) {
				if (!this.regServices[msg.service])
					this.statusupdate.call(this, {
						status : "unreg_err",
						service : msg.service
					})
				else if (!this.svcstatus[msg.service])
					this.statusupdate.call(this, {
						status : "svc_err",
						service : msg.service
					})
				else
					this.sendBuffer(msg);
			}

			socketModule.prototype.sendBuffer = function(obj) {
				// converting JSON string to arraybuffer
				if (typeof obj !== 'object') {
					console.log("Input is not an object.");
					return false;
				}

				var service = obj.service;

				delete obj.service;

				var jsonstring = JSON.stringify(obj);
				var sendBuffer = new ArrayBuffer(jsonstring.length + 4 + 32);
				var dv = new DataView(sendBuffer);
				// var service = svcName;
				if (service.length < 32) {
					for ( var i = 0; i < (32 - service.length); i++) {
						service += ' ';
					}
				}
				for ( var i = 0; i < service.length; i++) {
					dv.setUint8(i, service.charCodeAt(i));
				}
				dv.setInt32(32, jsonstring.length);
				for ( var i = 0; i < jsonstring.length; i++) {
					dv.setUint8(i + 36, jsonstring.charCodeAt(i));
				}
				// buffer contains "service,jsonstr"
				try {
					//if (this.ws.readystate == 1)// opened
						this.ws.send(sendBuffer);
					//else
						//console.log("cannot send msgs through connection.");

				} catch (e) {
					console.log("cannot send msgs through connection.");
					//console.log(e.message)
				}
				return;

			}
			socketModule.prototype.toJSON = function(buffer) {

				// converting Buffer to JSON
				// logger("msg recvd from server");
				var recvBuffer = buffer;
				var dv = new DataView(recvBuffer);
				var service = "";
				for ( var i = 0; i < 32; i++) {
					service += String.fromCharCode(dv.getUint8(i));
				}
				var svcmsgLen = dv.getInt32(32, false);
				var jsonstr = "";
				for ( var i = 36; i < buffer.byteLength; i++) {
					jsonstr += String.fromCharCode(dv.getUint8(i));
				}
				// console.log(jsonstr);
				var obj;
				try {
					obj = JSON.parse(jsonstr);
					obj.service = service.toString().replace(
							/[\x00-\x1F\x80-\xFF]/g, "");
				} catch (e) {
					try {
						obj = eval('(' + jsonstr + ')');
						obj.service = service.toString().replace(
								/[\x00-\x1F\x80-\xFF]/g, "");
					} catch (e) {
						console
								.log("NOT_JSON_DATA_Err: recieved data failed to parse");
						return false;
					}
					// console.log(jsonstr + " " + service);
					// return false;
				}

				// logger(obj);

				return obj;

			}
			socketModule.prototype.handleMessage = function(e) {

				var msg = this.toJSON(e.data);
				if (!msg)
					return;

				if (!this.clientidRecvd) {
					this.clientid = msg.clientid;
					this.clientidRecvd = true;
					this.statusupdate.call(this.handleObj, {
						status : "clientRegistered",
					});

				} else if (msg.service == "ngw") {
					this.handleSvcStatus.call(this, msg);
				} else if (this.regServices[msg.service])
				// need to handle one more condition for
				// registered services.
				{
					this.sendMessage.apply(this.handleObj, [ msg ]);
				} else {
					console.log("Recieved message from unknown service");
				}
			}

			socketModule.prototype.handleSvcStatus = function(msg) {
				this.statusupdate.call(this.handleObj, {
					status : "svcupdate",
					service : msg.service_name,
					eventtype : msg.eventtype
				});

				if (msg.status == "service_up")
					this.svcstatus[msg.service_name] = true;
				else if (msg.status == "service_down")
					this.svcstatus[msg.service_name] = false;

			}
			socketModule.prototype.register = function(services) {
				for (svc in services) {
					this.svcstatus[services[svc]] = true;
					this.regServices[services[svc]] = true;
				}
			}

			return socketModule;

		});