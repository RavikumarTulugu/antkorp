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
define(
		"akpprofiles",
		[ "jquery", "underscore", "backbone", "akputils", "jqueryui",
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
							/*$('.prfl_comp')
									.html(
											'<input type="text" id="org" name="org" value="'
													+ sampleUser.organization
													+ '" placeholder="Company Name" required>');
							*/
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
							//var org = $('input#org').val();
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
								//"organization" : org,
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