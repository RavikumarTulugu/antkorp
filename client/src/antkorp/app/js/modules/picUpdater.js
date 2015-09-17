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



define("picUpdater", [ "jquery", "underscore", "backbone", "akputils",
		"jqueryui", "jcrop/jquery.Jcrop.min", "plugins/Blob",
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
			this.Worker =null;
			this.WorkerChannel=null;
			
			if(Modernizr.webworkers){
				
				this.Worker = new SharedWorker("profilePic_upload.js");
				this.WorkerChannel=this.Worker.port;
			
				this.WorkerChannel.start();
				this.WorkerChannel.onerror = this._error;
				this.WorkerChannel.onmessage = this.messageHandler;
			}
			else{
				alert("Oops! some functionality may not work in your browser. /n You are using outdated browser, Please Updade your browser.");
			}

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

			this.$("#imageSubmit").removeAttr("disabled");
			
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

			this.WorkerChannel.postMessage(msgObj);

		},
		upload : function() {
			this.canv2.toBlob(this.postBlob, "image/png");
		},
		post : function(msg) {
			this.WorkerChannel.postMessage(msg);
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
			this.$("#imageSubmit").attr("disabled", "disabled");
			
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
			this.$("#imageSubmit").html("Done");
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
