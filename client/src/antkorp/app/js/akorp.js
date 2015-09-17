/**
 * antkorp - Enterprise collaboration and communication Tool
 * Version 0.0  (2012-04-15)
 * http://www.antkorp.in
 *
 *****************************************************************
 * Copyright (c) Neptunium Pvt Ltd., 2014.
 * Author: Neptunium Pvt Ltd..
 *
 * This unpublished material is proprietary to Neptunium Pvt Ltd..
 * All rights reserved. The methods and techniques described herein 
 * are considered trade secrets and/or confidential. Reproduction or 
 * distribution, in whole or in part, is forbidden except by express 
 * written permission of Neptunium.
 ****************************************************************
 * 
 */

/**
 * @fileOverview Application main module
 * @name akorp
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
		bootstrap:['jquery'],
		//webodf:['bootstrap'],
		jqueryui:['jquery','bootstrap'],
		webodf:['jqueryui','bootstrap'],

	},
	priority: ["jquery"],
	paths : {
	    plugins : "../lib",
	    modernizr : '../../assets/modernizr/modernizr',
        jquery : "../../assets/jquery/jquery.min",
        underscore : "../../assets/underscore/underscore-min",
        backbone : "../../assets/backbone/backbone-min",
        jqueryui : "../../assets/jquery-ui/ui/minified/jquery-ui.min",
        bootstrap : "../lib/bootstrap.min",
        webodf : '../../assets/webodf/webodf',
        text : "../../assets/requirejs-text/text",
        jcrop:'../../assets/jcrop/js',
        fullcalendar:'../../assets/fullcalendar/fullcalendar.min',
        'jquery.tagsinput':'../../assets/jquery.tagsinput/jquery.tagsinput',
        'jquery-tmpl':'../../assets/jquery-tmpl/jquery.tmpl.min',
        "jquery.validate" : "../../assets/jquery.validation/jquery.validate",

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
				"text!../templates.html", "wsGet", "jqueryui",
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
					"calendar","tunneld" ]);

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
				//console.log(resp);
				if (!resp.message) {

					// auth.adduser(username, uname);
					// User not registerd to database
					//console.log("user record missing.");

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
				//console.log(resp);
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
