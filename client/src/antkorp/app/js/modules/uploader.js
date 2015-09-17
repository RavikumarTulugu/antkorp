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


define('uploader',['jquery','underscore','backbone','akpauth'],function($,_,Backbone,auth){
	
	
	 /**
     * File Transfer windows and collections
     */

    var fileTransfer = Backbone.Model.extend({
        defaults:{
        	name : null,
        	//idAttribute:cookie,
        	status:"",
        	progress:0,
        },
        maxFileSize:5*100*1024*1024,
        validate:function(attrs,opts){
        	if(size>this.maxFileSize)
        		return "MaxFileSizeExceeds";
        	
        },
        initialize:function(){
        	
        },
        changeStatus:function(status){
            this.set({status:status});
            //this.trigger("stateChange");
        },
        getStatus:function(){
        	
        	return this.get("status");
        },
        updateProgress:function(progress,size){
        	
        	this.set({progress:progress});
        	//this.trigger("progress",progress);
        	this.trigger("update", {
                perc : progress,
                size : size
            });
        },
        completed:function(){
        	 this.set({status:'completed',progress:100});
        	 this.trigger("completed");
        },
        cancel:function(){
        	this.set({
                cancel : true,
                status:'cancelled', });
        }
    });

    /*
     * ******************************************** 
     * Uploads
     * ********************************************
     */

    var uploadsCollection = Backbone.Collection.extend({
        model : fileTransfer,
        initialize : function(opts) {
        	
        	_.bindAll(this,'uwmessage','uploadPost','uploadEror');
        	
        	this.controller=opts.controller;
            this.bind('remove', this.check, this);
            this.bind("change", this.handleChange, this);
            
            // serial Upload
            
            this.worker = new SharedWorker('Upload_worker.js'); 
            this.worker.port.start();
            this.worker.port.onerror = this.werror;
            this.worker.port.onmessage = this.uwmessage;
            
            // this.bind("uploadsCompleted",this.)
        },
        werror : function(e) {
            consloe.log('ERROR: Line ', e.lineno, ' in ',e.filename, ': ', e.message);
        },

        uploadPost : function(msg) {
            if(msg.mesgtype == 'error'){
                //this.handleDenyMsg(msg);
            	
            	//this.trigger("error","NotEnoughSpace",msg);
            	
            	
            	var model=this.get(msg.cookie);
                
                if(model)
                	model.trigger("error","NotEnoughSpace");
            }
            else
            	this.worker.port.postMessage(msg);
        },
        uploadEror:function(msg){
        	if(msg.mesgtype == 'error'){
        		var model = this.get(msg.cookie);
        		if(model)
        			model.trigger("error",msg.error);
        	}
        },
        uwmessage : function(e) {
            var dat = e.data.obj;

            if (!e.data.obj) {
                // console.log(e.data);
            } else if (dat.mesgtype == 'request' || dat.mesgtype == 'cancel') {
                var pcnt = e.data.prct;
                
               //FIXME: change view update to model update
               // this.uploadsView.updateProgress(dat.cookie, parseFloat(pcnt * 100).toFixed(2), e.data.lastByte);
                
                
               
                var model=this.get(dat.cookie);
                
                if(model)
                	model.updateProgress(parseFloat(pcnt * 100).toFixed(2), e.data.lastByte);

                dat.uid = auth.loginuserid;
                this.controller.send(dat, this.uploadPost,this.uploadEror);
                //console.log(dat);

            } else if (dat.mesgtype == 'complete') {

                this.trigger("fileCompleted", dat.cookie);
                
                var model=this.get(dat.cookie);
                
                if(model)
                	model.completed();

               
            }

        },
        checkLimits:function(file){
            if(file.size > this.controller.maxUploadLimit){
                //this.handleMaxSizeExceeds(file);
                return false;
            }
            
            return true;
        },
        uploadFile : function(file, target,opts) {
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

            return root.add({
                id : cookie,
                name : file.name,
                dname : postmsg.dname,
                type : file.type,
                size : file.size
            });

            
            //this.$('#fmgrUploadsBtn').show();
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
	
	return uploadsCollection;
});