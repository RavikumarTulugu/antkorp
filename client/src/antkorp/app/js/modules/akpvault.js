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
 * @fileOverview Handling File manager.
 * @name vault
 */


define(
        "akpvault",
        [ "require", "jquery", "underscore", "backbone", "akpauth", "akputils",
                "pdfOpener", "appViews",'uploader', //'webodf',
                'jqueryui', "plugins/FileSaver", "plugins/jquery.percentageloader-01a", "plugins/jquery-tmpl",
                "plugins/noty_full", "jquery.tagsinput" ],
        function(require, $, _, Backbone, auth, utils, pdfjs, views, uploadsCollection) {

        	/**
			 * A module representing authentication calls.
			 * @module vault
			 * @requires jQuery
			 * @requires Underscore
			 * @requires Backbone
			 * @requires Jquery-ui
			 * @requires jquery-tmpl
			 * 
			 * @requires modules/auth
			 * @requires modules/views
			 * @requires classes/utils
			 */
        	
            loader(10, "vault Loaded");
            var baseModel = Backbone.Model.extend({
                defaults : {
                    service : "fmgr",
                }
            });

            var baseCollection = Backbone.Collection.extend({
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
                            // 1GB in bytes
                            this.maxUploadLimit = 1024*1024*1024 ; 
                             _.bindAll(this, "dwmessage", "downloadPost", "handleViewChange", "download_msg");
                            
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
                           // console.log('ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message);
                        },
                        download_msg : function(msg) {
                            var strdata = msg.data, respdata;

                            if (msg.error) {
                                //console.log(msg.error);
                            	noty({
                        			text:msg.error,
                        			layout:"bottomRight",
                        			theme:'default',
                        			type:'error',
                        		});
                            	
                            	
                                return false;
                            } else {
                                try {
                                    respdata = window.atob(msg.data);
                                } catch (e) {
                                    //console.log("unable decode base64 data, NOT BASE64 DATA");
                                	
                                	noty({
                            			text:"Error occured! download failed",
                            			layout:"bottomRight",
                            			theme:'default',
                            			type:'error',
                            		});
                                	
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
                            
                            this.handleEvents(req);
                            
                            if (method)
                                method.apply(this, [ req ]);
                            else
                                this.handleMsg(req);
                        },
                        handleEvents:function(resp){
                        	if(resp.mesgtype == "event"){
                        	switch(resp.eventtype){ 
                        	case "file_deleted":		
                        	case "directory_deleted" :
                        	break;
                        	case "file_created" :                        			
                        	case "file_modified" :
                        	case "directory_created" :
                        		this.forwardEvents(resp);
                        			
                        		}
                        	}
                        },
                        forwardEvents:function(resp){
                        	this.trigger("fileEvent",resp);
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
                            akp_ws.send({data:obj,success:successCallback,error:errorCallback});
                            //this.mapReq[obj.cookie] = successCallback;
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
                        	this.initialized = false;
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
                    isdir : false,
                    type : 'unkown',
                    path : '',
                    parent:'',
                    home:'',
                }
            });

            var Files = Backbone.Collection.extend({
                        model : FileModel,

                        initialize : function() {
                            this.context = {};
                            this._meta = {
                                "filesCopied" : false,
                                "copiedList" : [],
                                "filesCount" : 0,
                            };
                            _.bindAll(this, "loadFiles", "update", "handleResponse","handleFileOperationResponse")
                            this.bind("change", this.update, this);
                            this.bind("goHome", this.setHome, this);
                            this.bind("goPath", this.goPath, this);
                            this.bind("refresh", this.refresh, this);
                            this.bind("cut", this.cutaction, this);
                            this.bind("copy", this.copyaction, this);
                            this.bind("paste", this.pastefiles, this);
                            this.bind("delete", this.handleDeleteReq, this);
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
                        share:function(fname,users,groups,callback){
                        	var unique = akp_ws.createUUID();
                        	var req={
                        			uid:auth.loginuserid,
                        			fname:fname,
                        			service:'fmgr',
                        			mesgtype:'request',
                        			request:'share',
                        			cookie:unique,
                        			uid_list:users,
                        			gid_list:groups,
                        			
                        	}
                        	
                        	collection.send(req, callback);
                        },
                        getActivity:function(fname,marker,callback){
                        	
                        	var unique = akp_ws.createUUID();
                        	var req={
                        			uid:auth.loginuserid,
                        			id:fname,
                        			service:'auth',
                        			mesgtype:'request',
                        			request:'relay_activity',
                        			cookie:unique,
                        			
                        			
                        	}
                        	if(arguments.length==2){
                        		auth.send(req, marker);
                        	}else if(arguments.length == 3){
                        		req.marker=marker;
                        		auth.send(req,callback);
                        	}
                        },
                        refresh : function() {
                            this.unselect();
                            this.closeOpened();
                        },
                        uploadFile:function(file,dname){
                            this.trigger("uploadFile",file,dname);
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
                                service : "tunneld",
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
                            collection.send(paste_obj,  this.handleFileOperationResponse);

                            if (action == "move")// in case of cut operation
                                // clear the clipboard
                                // object
                                this.emptyClipboard();

                        },
                        handleDeleteReq:function(){
                        	this.trigger("confirmDelete");
                        },
                        confirmDelete:function(){
                        	this.removeSelected();
                        },
                        removeSelected : function() {

                            // File Delete Operation
                            var list = this.getSelected();// list of Selected
                            // files in workzone
                            var args = [];
                           
                            $.each(list, function(index, item) {
                                args.push(item.get('fname'));
                                
                            });
                            
                            this.removeFiles(args,this.handleResponse);
                            this.remove(list);
                        },
                        removeFiles:function(args,callback){
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
                            collection.send(dlt_obj,callback,callback );
                        },
                        rename:function(name){
                        	
                        	
                        	var guid = akp_ws.createUUID();
                        	
                        	 var req_obj = {
                                    mesgtype : "request",
                                    service : "fmgr",
                                    request : 'move',
                                    cookie : guid,
                                    source : this.meta("cwd"),
                                    destination : this.meta("cwd")+'/' + name,
                                    srcargs : [this.getSelected()[0].get("fname")]
                                }
                                // sending action request to server
                                collection.send(req_obj,  this.handleFileOperationResponse);
                                
                                
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
                            var clientExp = new RegExp(collection.cleintHome,'gi');
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
                        getTypeFromPath:function(path){
                        	var replacedPath = path,type;

                            var clientExp = new RegExp(collection.cleintHome,
                                    'gi');
                            var clientMatches = path.match(clientExp);
                            var groupMatches = path.match(new RegExp(
                                    collection.groupHome, 'gi'));

                            if (clientMatches != null) {
                                if (clientMatches.length)
                                    type = "user";
                            } else if (groupMatches != null) {
                                if (groupMatches.length)
                                    type = "group";
                            }
                            return type||false;
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
                            //this.trigger("refresh");
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
                                uid: auth.loginuserid,
                            }
                            
                            var type = this.getTypeFromPath(cwd);
                            if(type == "user")
                            	dir_json.gid = 0;
                            else if(type == "group")
                            	dir_json.gid = auth.cgd;
                            
                            // sending getdir requests
                            collection.send(dir_json, this.loadFiles);
                            //re initialize count
                            this.meta("filesCount", 0);
                         // trigger event for changing path
                            this.trigger("showPath", cwd);
                            

                            /*
                             * Checking is it Home Directory trigger event with
                             * result
                             */
                            this.trigger("inHome", this.meta("cwd") == this.meta("home"));
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
                                //console.log(e.message);
                            }

                            this.reset();
                           // this.returnAsEmptyFolder();
                        },
                        returnAsEmptyFolder : function() {

                            this.isEmptyCheck = true;
                            var self = this;

                            // Maintain status
                            var countStr = $(
                                    '<span class="loadpercentage icon-spinner3"></span> ')
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
                        	if(this.validateArgs(srcargs)){
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
                        	}
                        	else{
                        		//console.error("Invalid file name.")
                        	}
                        	
                        },
                        createFolder : function(srcargs, callback) {
                        	var targetDir,respCallback;
                        	
                        	if(arguments.length == 3){
                    			targetDir = callback;
                    			respCallback = arguements[2];
                    		}else if(arguments.length == 2){
                    			targetDir = this.meta("cwd");
                    			respCallback = callback;
                    		}
                        	
                        	if(this.validateArgs(srcargs)){

                        		
                        		
	                            var guid = akp_ws.createUUID();
	                            //var dname = this.meta("cwd");
	                            var add_obj = {
	                                mesgtype : "request",
	                                service : "fmgr",
	                                request : 'create_dir',
	                                cookie : guid,
	                                source : targetDir,// directory to create
	                                srcargs : srcargs,
	                                // arguements that have names
	                            }
	                            collection.send(add_obj, respCallback, respCallback);
	                            // sending create directory req
                        	}
                        	else{
                        		//console.error("Invalid folder name.");
                        		
                        		respCallback.call(this,{error:"Invalid name provided."});
                        		
                        	}
                        },
                        validateArgs:function(args){
                        	for(var i=0; i< args.length; i++){
                        		/**
                        		 * Checking args shouold be alpha numeric and _
                        		 */
                        		
                        		var pett= /^[a-zA-Z0-9-_]+$/ ;

                        		var res = pett.test(args[i]);
                        		if(!res)
                        			return res;
                        	}
                        	return true;
                        },
                        getFilesCount:function(){
                        	return this.meta("filesCount");
                        },
                        setFilesCount:function(value){
                        	this.meta("filesCount", value);
                        	
                        },
                        loadFiles : function(obj) {

                            var length = obj.direlements.length;
                            
                            var filesInDir = this.getFilesCount();
                            
                            this.setFilesCount(filesInDir+length);
                            
                            if (!this.getFilesCount()){
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
                       
                        addFile:function(item){
                        	
                        	var filePath = item.fname;
                        	var fileName = filePath.substr(filePath.lastIndexOf('/')+1,filePath.length) ;
                        	var fileDir = filePath.substr(0,filePath.lastIndexOf('/')) ;
                        	var cwd = this.meta("cwd");
                        	
                        	
                        	if(cwd!=fileDir)
                        		return;
                        	
                        	
                        	item.fname = fileName;	
                        	 item["path"] = cwd + "/" + fileName;
		                     item["parent"] = cwd;
		                     item["home"] = this.meta("home");
		                     item["formatedSize"] = utils.convBytes(item.size, 2);
		                     this.add(item);
		                     this.showCount();
                        },
                        showCount : function() {
                        	
                        	var filesCount = this.where({
                                isdir : "false"
                            }).length ;
                        	
                        	var dirCount = this.where({
                                isdir : "true"
                            }).length;
                        	
                        	
                            var countStr =  dirCount + " Folder(s), " + filesCount+ " File(s)"
                            this.trigger("itemsCount", countStr);
                            
                            
                            this.meta("filesCount",filesCount);
                            this.meta('dirCount',dirCount);
                        },
                        closeOpened : function() {
                            this.filter(function(file) {
                                if (file.get("isOpened") == true) {
                                    file.set({
                                        "isOpened" : false,
                                        "isByView" : false
                                    })
                                }

                            });
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
                        isExists:function(name,dir){
                        	
                        	var targetDir = dir || this.meta("cwd")+"/";
                        	var file = this.get(targetDir+name);
                        	
                        	return file;
                        	
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
                            //console.log('path:' + this.model.fpath)

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
                	var extFiles = _.each(models, function(obj) {
                        obj.hasRemove = true;
                    });
                	
                    this.onAdd.call();
                    this.collection.add(models);
                },
                addFile2Container : function(model) {
                    var sctdFile = new FSDFileView({
                        model : model
                    });
                    this.$container.append(sctdFile.render().el);
                   // $(this.$container).css("display","block");
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
                            data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"   : mimeclass;
                            data["size"] = sizeBytes;
                            //data["hasRemove"] = data["hasRemove"] ? data["hasRemove"] : true;
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
                    this.$el.dialog({
                        //closeButtonAction : 'close',
                        height : 400,
                        width : 600,
                        modal : true,
                        title:"Selector",
                        closeOnEscape:false,
                        resizable:false,
                        close : function(e, u) {
                            $(this).remove();
                        },
                    // close: this.returnEmpty
                    });

                    // this.$el.jqxWindow("close",this.returnEmpty);
                },
                selectFile : function(e) {
                	e.preventDefault();
                	e.stopPropagation();
                	
                    var list = this.collection.getSelected();
                    if (list.length < 10 && list.length > 0) {
                        this.finished = true;
                        this.result.call(this, list);
                        $("#" + this.el.id).dialog('close');
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
                            this.$el.append(this.template).dialog({
                                //closeButtonAction : 'close',
                                height : 400,
                                width : 600,
                                title:"Vault",
                                close : function(e, u) {
                                    $(this).remove();
                                },
                               
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
                //idAttribute:cookie,
                status:"",
                changeStatus:function(status){
                    this.set({status:status});
                }
            });

            /*
             * ******************************************** Uploads
             * ********************************************
             */

           /* var uploadsCollection = Backbone.Collection.extend({
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
*/
            /*
             * uploads window with JQx window
             */
            var uploadWindow = Backbone.View.extend({
                el : $("#uploadwindow"),
                events : {
                	
                },
                initialize : function(opts) {

                    this.controller = opts.controller;
                    this.controller.bind("hidden", this.hide, this);

                    //this.collection.bind('add', this.addUpload, this);
                    this.collection.bind("fileCompleted", this.removeUpload,this);
                    this.collection.bind("uploadsCompleted", this.hide, this);

                   

                    this.$el.dialog({
                        autoOpen : false,
                        //showCloseButton : false,
                        //showCollapseButton : true,
                        width : 310,
                        height : 310,
                        resizable : false,
                        title:"Uploads",
                        open:function(){
                        	//var $content = $(this);
                            //var $dialog=$content.closest(".ui-dialog");
                        	
                        	//$dialog.find(".ui-dialog-titlebar-close").addClass("hideClose");
                        }
                    });

                },
                render : function() {
                	
                },
                hide : function() {
                    this.$el.dialog('close');
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
                        model : model,
                        window:this,
                    });
                    this.$('#upload_status').append(file.render().el);
                    
                    //this.$('#fmgrUploadsBtn').show();
                },
                removeUpload : function(id) {

                    var model = this.collection.get(id);
                    if (model) {
                        model.trigger('remove');
                        this.collection.remove(model);
                    }
                },
                closeOnFinish:function(){
                	if ($('#upload_status .upload_file').length == 0) {
                		
                       this.$el.dialog('close');
                        $("#fmgrUploadsBtn").hide();
                    }
                },
                cancelAll:function(){
                	
                },
            })

            /*
             * upload file Item
             */
            
            var uploadFileView = Backbone.View.extend({
                        className : 'upload_file',
                        events : {
                            'click .uc' : "stopUpload"
                        },
                        initialize : function(opts) {
                        	
                        	this.window = opts.window;
                        	
                            this.model.bind("remove", this.cancelUpload, this);
                            this.model.bind("update", this.changeProgress, this);
                            this.model.bind("error",this.handleError,this);
                            
                            var name = this.model.get("name");
                            var type = this.model.get("type");
                            var size = utils.convBytes(this.model.get("size"),
                                    2);
                            // <div class='akorp-mime "+ utils.mime2class(type)
                            // +" '></div>
                            this.$el.append("<div> <span> " + name
                                            + ' </span> <div class="up_pbar"><span class="up_progress" ></span></div></div>   '
                                            + ' <div class="status"> <span class="percMeter"> 0.00 % </span> | <span class="sizeOver"> 0B </span> / <span> '
                                            + size
                                            + ' </span>  </div>'
                                            + ' <span class="cancel uc icon-remove3"></span>');
                        },
                        render : function() {
                            return this;
                        },
                        handleError:function(err){
                        	if(err == "NotEnoughSpace"){
                        		this.noSpaceDialog();
                        	}
                        	if(err == "RequestTimeout"){
                        		this.handleTimeout();
                        	}
                        },
                        handleTimeout:function(){
                        	this.model.changeStatus("error");
                        	this.$(".status").empty().end().append("Error uploading file, cancel and try again!");
                        },
                        noSpaceDialog:function(){
                        	 var self=this;
                        	 this.$(".status").empty().end().append("Error uploading file, cancel and try again!");
                        	 
                        	 $("<div/>").append( "There is not enough space to upload file <strong>" + self.model.get("name") + "</strong>").dialog({
                                 height:150,
                                 title:"Error",
                                 modal:true,
                                 resizable:false,
                                 buttons:[{text:"Cancel",
                                     "class":"btn btn-danger",
                                     click:function(){
                                         //this will cancel current upload
                                         self.model.cancel();
                                     $(this).dialog("close").remove();
                                 }}]
                             });
                             
                             
                             
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

                            this.model.cancel();
                        },
                        cancelUpload : function() {
                        	this.window.closeOnFinish();
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
                            this.collection.bind("fileCompleted",this.removeDownload, this);
                            this.collection.bind("downloadsCompleted",this.hide, this);

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

                            this.$el.dialog({
                                autoOpen : false,
                                //showCloseButton : false,
                                //showCollapseButton : true,
                                height : 300,
                                width : 310,
                                resizable:false,
                                closeOnEscape:false,
                                title:"Downloads",
                                open:function(){
                                	/*
                                	var $content = $(this);
                                    var $dialog=$content.closest(".ui-dialog");
                                	
                                	$dialog.find(".ui-dialog-titlebar-close").addClass("hideClose");
                                	*/
                                }
                            });

                        },
                        render : function() {

                        },
                        hide : function() {
                            this.$el.dialog('close');
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
                                            + '<span class="cancel dc icon-remove3"></span>'
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
                            .addClass("icon-star2").data("ismarked", true);
                },
                uncheck : function() {
                    this.$(".fmgr-add-bookmark").removeClass("icon-star2")
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

                            this.model                                    .bind("remove", this.removeBookmark, this);
                            this.homeDir = this.getPathHome(this.model                .get("path"));
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
                                    "icon-cross2 akp-close-icon bm-remove");
                            this.$el.append(path).addClass("bookmark").append(
                                    remove);

                            return this;
                        },
						maskPath : function(path) {
							var clientExp = new RegExp(collection.cleintHome,
									'gi');
							var clientMatches = path.match(clientExp);
							var groupMatches = path.match(new RegExp(
									collection.groupHome, 'gi'));

							if (clientMatches != null) {
								if (clientMatches.length)
									path = path.replace(collection.cleintHome,
											"Home");
							} else if (groupMatches != null) {

								if (groupMatches.length)
									path = path.replace(collection.groupHome,
											"Group");
							}
							return path;
						},
						getPathHome : function(path) {
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

            var MasterView = Backbone.View.extend({
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
                                    "handleBtnUpload","loadTreeReq");

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
                            this.collection.bind("setGroup",                                    this.handleGroupChange, this);
                            this.collection.bind("switchHome", this.switchHome,                                    this);
                            this.collection.bind("downloadErr",                                    this.downloadErr, this);
                            this.collection.bind("downloadPush",                                    this.showDownloadsBtn, this);
                            this.collection.bind("error", this.handleError,                                    this);
                            this.collection.bind("initialized", this.oninit,                                    this);
                            this.collection.bind("notification",                                    this.addNotification, this);
                            this.collection.bind("clear", this.clear, this);
                            this.collection.bind("fileEvent",this.handleFileEvents,this);
                            // this.collection.bind("downloads_update",
                            // this.updateLoadEngine, this);

                            this.files = options.files;
                            this.files.bind("newfolder", this.createFolder, this);
                            this.files.bind("goHome",this.loadTreeReq,this);
                            this.files.bind("refresh",this.loadTreeReq,this);
                            this.files.bind("alertRemove", this.alertRemove,this);
                            this.files.bind("download", this.handleFileWrite,this);
                            this.files.bind("showPath", this.checkBookmark,this);
                            this.files.bind("showPath", this.showPath, this);
                            this.files.bind("showPath", this.rememberCWD, this);
                            this.files.bind("itemsCount", this.displayCount,this);
                            this.files.bind("isEmptyFolder",this.toggleEmptyFolderMsg, this);
                            this.files.bind("inHome", this.handleInHome, this);
                            this.files.bind("block", this.blockUI, this);
                            this.files.bind("unblock", this.unblockUI, this);
                            this.files.bind("gtkViewer", this.handleGtkViewer,this);
                            this.files.bind("uploadFile",this.uploadFile,this);

                            this.$el.bind("contextmenu", this.disablerightclick);

                         /*   // this.worker = new
                            // SharedWorker('multiple_upload_worker.js');
                            // //parallel Uploads
                            this.worker = new SharedWorker('Upload_worker.js'); // serial
                            // Upload
                            this.worker.port.start();
                            this.worker.port.onerror = this.werror;
                            this.worker.port.onmessage = this.uwmessage;

                            this.uploadManager = {};
                          */
                            jQuery.event.props.push('dataTransfer');

                            this.uploads = new uploadsCollection({
                            	controller:this.collection,
                            });
                            this.uploadsView = new uploadWindow({
                                collection : this.uploads,
                                controller : this.collection,
                            })

                            this.uploads.bind("removeUpload", this.uploadPost,this);
                            this.uploads.bind("uploadsCompleted",this.handleUploadsCompleted, this);
                           // this.uploads.bind("error",this.handleUploadsErr,this);
                            
                            
                            
                            this.collection.downloads.bind("downloadsCompleted",this.handleDownloadsCompleted, this);

                            /*
                             * Gtk Viwer
                             */
                            /*
                             * 
                            TODO: when enable broadway remove comments to view the broadway dialog.
                            
                            
                             Broadway excluded so dialog throws 
                            this.gtkViewer = $(".gtkViewer").dialog({
                                width : "60%",
                                autoOpen : false,
                                modal : true,
                                minHeight : "800px",
                                open : this.onOpen,
                            });
                            this.gtkViewerFrame = document.getElementById('gtk-vwr-frame').contentWindow;
                            
                            
                            */

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
                        
                        handleFileEvents:function(file){
                        	this.files.addFile(file);
                        },
                        loadTreeReq:function(){
                        	this.files.getTree();
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
                            
                            this.notifications.init();
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
                                padding : 0,
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
                        removeClose:function(){
                        	var $dialog = $(this);
                            $dialog.closest(".ui-dialog").find(".ui-dialog-titlebar .ui-dialog-titlebar-close").remove();
                        },
                        handleGtkViewer : function(msg) {
                        	
                            if (!msg.data)
                                return;

                            if (!this.gtkViewer.dialog("isOpen")) {
                                this.gtkViewer.dialog("open")
                            }

                            // var decodedMsg=window.atob(msg.data);

                            this.gtkViewerFrame.postMessage(msg.data, window.location.origin);

                        },
                        blockUI : function() {
                            var loadbar = $("<div/>")
                                    .append(
                                            '<span class="loadpercentage icon-spinner3" style="color:#FFF" ></span>')
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
                            //console.log(req.toJSON());

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
                            if ($('#uploadwindow').dialog('isOpen')) {
                                $('#uploadwindow').dialog('close')
                            } else {
                                $('#uploadwindow').dialog('open')
                            }
                        },
                        showDownloads : function() {
                            if ($('#downloads').dialog('isOpen')) {
                                $('#downloads').dialog('close')
                            } else {
                                $('#downloads').dialog('open')
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
                            else{
                            	this.worker.port.postMessage(msg);
                            }
                        },
                        uwmessage : function(e) {
                            var dat = e.data.obj;

                            if (!e.data.obj) {
                                // console.log(e.data);
                            } else if (dat.mesgtype == 'request' || dat.mesgtype == 'cancel') {
                                var pcnt = e.data.prct;
                                
                               

                                this.uploadsView.updateProgress(dat.cookie,
                                        parseFloat(pcnt * 100).toFixed(2),
                                        e.data.lastByte);

                                dat.uid = auth.loginuserid;
                                this.collection.send(dat, this.uploadPost);

                            } else if (dat.mesgtype == 'complete') {

                                this.uploads.trigger("fileCompleted",dat.cookie);

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
                                                $(this).dialog("close").remove();
                                            }
                                        }
                                    });
                        },

                        handleFileSelect : function(ev) {

                            ev.stopPropagation();
                            ev.preventDefault();
                            this.handleDragLeave();
                            var length, src, isdir, septr, path_ext = [], q = 0,entry=null;
                            var dname = this.files.meta("cwd");
                            if (ev.dataTransfer) {

                                // handling drag and drop files
                                length = ev.dataTransfer.items.length;

                                for ( var i = 0, f; i < length; i++) {
                                     entry = ev.dataTransfer.items[i].webkitGetAsEntry();
                                    if(entry===null){
                                    	//checking for windows chrome latest version
                                    	entry = ev.dataTransfer.files[i];
                                    	this._uploadWithCheck(entry, dname + "/");
                                    }else{
                                    	//for linux chrome folder uploads
                                    	
                                    	if(this.files.isExists(entry.name))
                                     	{
                                        	this._folderExistsDialogForRecursive(entry);
                                        	
                                     	}else{
                                    	
                                     		this.traverseFileTree(entry);
                                     	}
                                    }
                                }
                            } else if (ev.target) {
                                // handling input selected files;
                                length = ev.target.files.length;
                                for ( var i = 0, f; i < length; i++) {
                                    entry = ev.target.files[i];
                                    
                                   
                                    this._uploadWithCheck(entry, dname + "/");
                                    //this.uploads.uploadFile(entry, dname + "/");
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
                                	//this.files.isExists(file.name,dname+path);
                                	
                                	root._uploadWithCheck(file, dname + path);
                                    //root.uploads.uploadFile(file, dname + path);
                                });
                            } else if (item.isDirectory) {

                            	
                             		this.handleFolderUpload(item, path, dname);
                             	

                            }

                        },
                       
                        _uploadWithCheck:function(file, target){
                        	 if(this.files.isExists(file.name,target))
                         	{
                        		 //alert("exists");
                        		 this._fileExistsDialog(file,target);
                        		 
                         	}
                         else
                        	 this._upload(file, target);
                        },
                        _upload:function(file,target){
                        	
                        	var model=this.uploads.uploadFile(file, target);
                        	
                        	if(model){
                        		this.uploadsView.addUpload(model);
                        		this.$('#fmgrUploadsBtn').show();
                        		return model;
                        	}
                        	else{
                        		return false;
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
                        _fileExistsDialog:function(file,target){
                        	
                        	var self=this;
                        	
                        	var text = $("<div/>").append("<strong>"+file.name+"</strong> file already exists.<br/> Do you want to replace?");
                        	
                        	
                        	
                        	$(text).dialog({
                        		title:"File Exists",
                        		modal:true,
                        		open:this.removeClose,
                        		buttons:[{
                        			text:"Replace",
                        			"class":"btn btn-primary",
                        			click:function(){
                        				self._upload(file, target);
                        				$(this).dialog("close").remove();
                        			},
                        		},{                        			
                        			text:"Cancel",
                        			"class":"btn btn-danger",
                        			click:function(){
                        				$(this).dialog('close').remove();
                        			}}]
                        	});
                        	
                        },
                        _folderExistsDialog: function(foldername){
                        	var self=this;
                        	
                        	var text = $("<div/>").append("<strong>"+foldername+"</strong> folder already exists. <br/> Do you want to replace?");
                        	
                        	
                        	$(text).dialog({
                        		title:"Folder Exists",
                        		modal:true,
                        		open:this.removeClose,
                        		buttons:[{
                        			text:"Replace",
                        			"class":"btn btn-primary",
                        			click:function(){
                        				self.files.removeFiles([foldername],function(resp){
                        					if(resp.mesgtype != "error")
                        						self.files.createFolder(foldername, self.handleNewFolderResponse);
                        					else
                        						alert("error occured");
                        				});
                        				
                        				$(this).dialog("close").remove();
                        			},
                        		},{                        			
                        			text:"Cancel",
                        			"class":"btn btn-danger",
                        			click:function(){
                        				$(this).dialog('close').remove();
                        			}}]
                        	});
                        },
                        _folderExistsDialogForRecursive:function(item){
                        	var self=this;
                        	
                        	var text = $("<div/>").append("<strong>"+item.name+"</strong> folder already exists. <br/> Do you want to replace?");
                        	
                        	
                        	$(text).dialog({
                        		title:"Folder Exists",
                        		modal:true,
                        		open:this.removeClose,
                        		buttons:[{
                        			text:"Replace",
                        			"class":"btn btn-primary",
                        			click:function(){
                        				self.files.removeFiles([item.name],function(resp){
                        					if(resp.mesgtype != "error")
                        						self.traverseFileTree(item);
                        					else
                        						alert("Eroor occured");
                        				});
                        				
                        				//self.files.createFolder(foldername, targetDir, self.handleNewFolderResponse);
                        				//self.handleFolderUpload(item, path, dname);
                        				
                        				$(this).dialog("close").remove();
                        			},
                        		},{                        			
                        			text:"Cancel",
                        			"class":"btn btn-danger",
                        			click:function(){
                        				$(this).dialog('close').remove();
                        			}}]
                        	});
                        },
                        uploadFile : function(file, target) {
                        	this._upload(file, target);
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
                                srcargs : [],
                            }

                            var spath = item.fullPath;
                            var sep = spath.lastIndexOf('/');
                            var source_ext = spath.substring(0, sep);
                            var targetDir = dname + source_ext;
                            
                            
                            
                            
                         		add_obj.srcargs.push(item.name);
                         		add_obj.source = dname + source_ext;

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
                            //console.log(resp);
                            this.files.trigger("refresh");
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
                                            "<p><span style='float:left; margin:0 7px 20px 0;'> </span> Folder Name:<input type='text' id='flname' placeholder='Folder name' /></p>")
                                    .dialog({
                                                resizable : false,
                                                minHeight : 170,
                                                title: "Create Folder",
                                                modal : true,
                                                buttons : [
                                                        {
                                                            text : "Create",
                                                            click : function() {
                                                            	
                                                            	var foldername =  $('input#flname').val();
                                                                if (!foldername) return;
                                                                    
                                                                    if(root.files.isExists(foldername))
                                                                 	{
                                                                    	root._folderExistsDialog(foldername);
                                                                    	
                                                                 	}else{
                                                                 		root.files.createFolder([foldername],root.handleNewFolderResponse);
                                                                 	}
                                                                    $(this).dialog("close").remove();
                                                                
                                                            },
                                                            "class" : "btn btn-success",
                                                        },
                                                        {
                                                            "text" : "Cancel",
                                                            click : function() {
                                                                $(this).dialog("close").remove();
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
                    //this.collection.bind("add", this.list, this);
                   // this.collection.bind("goParent", this.getParent, this);
                    //this.collection.bind("goHome", this.getHome, this);
                    //this.collection.bind("refresh", this.refresh, this);
                    //this.$el.bind('select', this.selectItem);
                    // this.collection.bind("change", this.update, this)
                },
                render : function() {

                },
                update : function(model) {
                    //console.log(model);
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
            });
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
            var FilesZone = Backbone.View                    .extend({
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
                            _.bindAll(this, "render", "update", "cmenu","removeWarn");
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
                            this.collection.bind("itemsCount",                                    this.displayCount, this);
                            this.collection.bind("question",                                    this.handleQuestionMsg, this);
                            this.collection.bind("clear", this.clear, this);
                            this.collection.bind("confirmDelete",this.removeWarn,this);

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
                        removeWarn : function() {
                            var root = this.collection;
                            $("<div/>")
                                    .attr('id', 'dlt_dialog')
                                    .append('<p>These items will be permanently deleted and cannot be recovered. Are you sure?</p>')
                                    .dialog(
                                            {title:"Delete Operation",
                                                resizable : false,
                                                height : 160,
                                                modal : true,
                                                open:this.onOpen,
                                                buttons : [{
                                                	
                                                    text:"Delete",
                                                    "class":"btn btn-danger",
                                                    click : function() {
                                                        root.confirmDelete();
                                                        $(this).dialog("close").remove();
                                                    }},{
                                                    text:"Cancel",
                                                    "class":"btn btn-primary",
                                                    click : function() {
                                                        $(this).dialog("close").remove();
                                                    }
                                                }]
                                            });
                        },
                        onOpen:function(e, ui) {
                        	$(e.target).closest(".ui-dialog").find(".ui-dialog-titlebar-close").hide();
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
                                                open : this.onOpen ,
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
                                                                selfCol.sendQuestionResponse(
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
             *  file View
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
                            this.model.bind("remove",this.remove,this);
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
                            } 
                            
                            /*else if (type == "video/mp4"
                                    || type == "video/webm") {
                                // this.handleVideoFileOpen(entry);
                                // HTML5 Mediasource API is still under
                                // implementation
                                // so these feature is quit for now
                            } */else if (type == "application/javascript"
                                    || type == "application/json"
                                    || type.split("/")[0] == "text"
                                    || type == "application/x-sh") {
                                this.handleTextFilesOpen(entry);
                                // this.handleOpenDocumentFilesOpen(entry);

                            }
                            else{
                            	
                            	this.showUnableToOPenFileDialog();
                            }
                            
                            /*else if (type == "application/vnd.oasis.opendocument.presentation"
                                    || type == "application/vnd.oasis.opendocument.text"
                                    || type == "application/vnd.oasis.opendocument.graphics") {
                            	
                            	//using webodf
                            	
                            	
                            	this.handleODFOpen(entry);
                            	
                                //this.handleOpenDocumentFilesOpen(entry);
                                // console.log("")
                            }*/
                            
                            /*
                            
                            else if (type == "application/vnd.oasis.opendocument.presentation"
                                    || type == "application/vnd.oasis.opendocument.text"
                                    || type == "application/vnd.oasis.opendocument.graphics") {
                            	
                            	
                            	
                                this.handleOpenDocumentFilesOpen(entry);
                                // console.log("")
                            }
                            
                            */
                        },
                        showUnableToOPenFileDialog:function(){
                        	 $("<div/>").append("<strong class='text-danger'>Sorry! We are unable to open the file.</strong>").dialog({
                                 modal : true,
                                 title: "File open not supported.",
                                 resizable:false,
                                 draggable: false,
                                // height : "200",
                                 //width : "300",
                                 buttons : [{
                                     text:"Close",
                                     "class" : "btn btn-primary",
                                     click : function() {
                                         $(this).dialog("close").remove();
                                     }
                                 }],
                                 close:function(){
                                	 $(this).remove();
                                 }
                                 
                             });
                        },
                        handleODFOpen:function(entry){
                        	//using WebODF
                        	
                        	var self=this;
                        	
                        	
                        	var currentPath,
                            overridePath,
                            overridePathPrefix = "https://"+window.location.host+"/app/",//"odf:",
                            data,
                            globalreadfunction,
                            globalfilesizefunction,
                            odfcanvas,
                            zoom = 1,
                            dom,
                            canvasListeners = [],
                            view;
                        	
                        	initCanvas()
                        	
                        	
                        	//$("#odf-viewer").show();
                        	//this.collection.openODFFile(entry.path,this.handleODFResult);
                        	this.collection.trigger("block");
                            var reader = new FileReader();
                            reader.onload = function(e) {
                               /* var result = e.target.result;
                                var uInt8Arr = new Uint8Array(result);
                                */
                            	
                            	data=e.target.result;
                                self.collection.trigger("unblock");
                            	
                            	$("#odf-viewer").show();
                            	//var odfelem = document.getElementById("odf-container"); 
                            	//var odfcanvas = new odf.OdfCanvas(odfelem);
                            	//var docurl='somedude.odt';
                            	//var docurl=url;
                            	//odfcanvas.load(docurl);
                            	odfcanvas.load(overridePath);
                               

                            }

                            var obj = akp_ws.get({
                                fname : entry.path,
                                service : "fmgr",
                                request : "read",
                                mesgtype : "request",
                                size : 1024
                            });
                            obj.oncomplete = function(path, file) {
                            	
                            	if (path === currentPath) {
                                    return;
                                }
                               /* currentPath = path;
                                overridePath = overridePathPrefix + path;
                                
                                */
                            	currentPath = file.name;
                                overridePath = overridePathPrefix + file.name;
                            	
                                data = null;
                            	
                                reader.readAsArrayBuffer(file);
                            	/*self.collection.trigger("unblock");
                            	
                            	$("#odf-viewer").show();
                            	var odfelem = document.getElementById("odf-container"); 
                            	//$("#odf-container");
                            	var odfcanvas = new odf.OdfCanvas(odfelem);
                            	//var docurl='somedude.odt';
                            	var docurl=url;
                            	odfcanvas.load(docurl);
                            	*/
                            }
                            
                            
                            
                            function initCanvas() {
                                var cmp;
                                if (globalreadfunction === undefined) {
                                    // overload the global read function with one that only reads
                                    // the data from this canvas
                                    globalreadfunction = runtime.read;
                                    globalfilesizefunction = runtime.getFileSize;
                                    runtime.read = function (path, offset, length, callback) {
                                        if (path !== overridePath) {
                                            globalreadfunction.apply(runtime,
                                                [path, offset, length, callback]);
                                        } else {
                                            callback(null, data.slice(offset, offset + length));
                                        }
                                    };
                                    runtime.getFileSize = function (path, callback) {
                                        if (path !== overridePath) {
                                            globalfilesizefunction.apply(runtime, [path, callback]);
                                        } else {
                                            callback(data.length);
                                        }
                                    };
                                    dom = document.getElementById("odf-container");
                                    odfcanvas = new odf.OdfCanvas(dom);
                                    odfcanvas.addListener("statereadychange", signalCanvasChange);
                                }
                            }
                            
                            function signalCanvasChange(){
                            	var i;
                                for (i = 0; i < canvasListeners.length; i += 1) {
                                    canvasListeners[i](odfcanvas);
                                }
                            }
                            
                        	
                        	
                        	
                        },
                        
                        handleOpenDocumentFilesOpen : function(entry) {
                        	
                        	//using GTK
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
                                            '<span class=" loadpercentage icon-spinner3"></span>')
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
                                    result : result,
                                    controller:self.collection,
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
                                            '<span class=" loadpercentage icon-spinner3"></span>')
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
                                    $(this).css("height", height * ratio); 
                                    // Scale height based on ratio
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

                        },
                        
                    });

            var TextViewer = Backbone.View.extend({
                events : {
                    "click .tv-zoom-plus" : "zoomIn",
                    "click .tv-zoom-minus" : "zoomOut",
                    'click .text-edit':"enableEdit",
                    "click .text-save": "saveFile",
                    "click .text-cancel": "discardChanges",

                },
                defaults : {
                    zoomValue : 13,
                    maxZoomVal : 20,
                    minZoomVal : 9,
                },
                settings : {},
                
                initialize : function(opts) {
                    _.bindAll(this,"onInitFs");
                    this.settings = $.extend({}, this.defaults, opts)
                    this.$el = $("#text-viewer-template").tmpl([ {
                        fname : opts.entry.fname,
                        text : opts.result,
                        
                    }]);
                    
                    this.$(".edit-saveOptions").hide();
                },
                render : function() {
                    return this;
                },
                reload:function(){
                    this.$(".tv-body pre").html(this.settings.result);
                },
                discardChanges:function(){
                    this.$(".tv-body").attr("contentEditable","false");
                    this.enableZoom();
                    this.hideActions();
                    this.reload();
                },
                saveFile:function(){
                    this.$(".tv-body").attr("contentEditable","false");
                    this.enableZoom();
                    this.hideActions();
                    this.getFile();
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
                },
                getContents:function(){
                    var content=this.$('.tv-body pre').text();
                
                    return content;
                },
                getFile: function(entry){
                    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
                    window.requestFileSystem(window.TEMPORARY, this.settings.entry.size, this.onInitFs, this.errorHandler);
                },
                onInitFs:function(fs) {
                    var self=this;
                    /*
                    fs.root.getFile(self.settings.entry.fname,{create:false},function(fileEntry){
                        fileEntry.remove(function(){
                            console.log("file removed successfully");
                        },self.errorHandler);
                    },self.errorHandler);
                    */
                    fs.root.getFile(self.settings.entry.fname, {create: true}, function(fileEntry) {

                        fileEntry.createWriter(function(fileWriter) {

                            fileWriter.onwriteend = function(e) {
                              //console.log('Write completed.');
                              fileEntry.file(function(file) {
                                  
                               self.settings.controller.uploadFile(file,self.settings.entry.parent+"/");   
                                  
                              },self.errorHandler);
                              
                            };

                            fileWriter.onerror = function(e) {
                              console.log('Write failed: ' + e.toString());
                            };

                            // Create a new Blob and write it to log.txt.
                            var blob = new Blob([self.getContents()], {type: self.settings.entry.type});

                            fileWriter.write(blob);

                    }, self.errorHandler);

                  },self.errorHandler);
                },

                errorHandler:function (e) {
                    var msg = '';

                    switch (e.code) {
                      case FileError.QUOTA_EXCEEDED_ERR:
                        msg = 'QUOTA_EXCEEDED_ERR';
                        break;
                      case FileError.NOT_FOUND_ERR:
                        msg = 'NOT_FOUND_ERR';
                        break;
                      case FileError.SECURITY_ERR:
                        msg = 'SECURITY_ERR';
                        break;
                      case FileError.INVALID_MODIFICATION_ERR:
                        msg = 'INVALID_MODIFICATION_ERR';
                        break;
                      case FileError.INVALID_STATE_ERR:
                        msg = 'INVALID_STATE_ERR';
                        break;
                      default:
                        msg = 'Unknown Error';
                        break;
                    };

                    //console.log('Error: ' + msg);
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

            /*var treeView = new TreeZone({
                collection : filesCollection
            });*/
            
            
            var searchbox = new searchView({
                collection : filesCollection
            });

            /*
             * context menu for all zones in container
             */
            var cmenuView = Backbone.View
                    .extend({
                        el : $("#cmenu"),
                        fileList : [ "copy", "cut", "download", "dlt", "info",'share','rename' ],
                        folderList : [ "paste", "open", "copy", "cut", "dlt","rename",
                                "newwnd", "info",'share' ],
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
                            'click #share' : 'share',
                            "click #info" : "info",
                            "click #rename":"rename",
                            "contextmenu" : "disableContextMenu"

                        },
                        initialize : function(opts) {
                            _.bindAll(this, "hidemenu","onOpen");
                            $(document).bind("click", this.hidemenu);
                            this.baseCollection = opts.baseCollection;
                            this.baseCollection.bind("clear", this.hidemenu,this);
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
                            this.fileList = [ "copy", "cut", "download", "dlt","info",'share','rename' ];
                            this.folderList = [ "paste", "open", "copy", "cut","dlt", "newwnd", "info",'share','rename' ];
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
                                //console.log("sorry unable to open multiple files");
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
                        rename:function(){	
                        
                            var root = this.collection;
                            $("<div/>").append('<div><p class="err_msg"></p><p>Enter new name:<input class="rename_input" placeholder="New name here" type="text" /></p>')
                                    .dialog(
                                            {title:"Rename Operation",
                                                resizable : false,
                                                height : 160,
                                                modal : true,
                                                open:this.onOpen,
                                                buttons : [{
                                                	
                                                    text:"Done",
                                                    "class":"btn btn-success",
                                                    click : function() {
                                                    	
                                                    	var name = $(this).find(".rename_input").val();
                                                    	if(!name.length){
                                                    		$(this).find(".err_msg").html("Please enter valid name!");
                                                    		
                                                    		return;
                                                    	}
                                                    	root.rename(name);
                                                        $(this).dialog("close").remove();
                                                    }},{
                                                    text:"Cancel",
                                                    "class":"btn btn-primary",
                                                    click : function() {
                                                        $(this).dialog("close").remove();
                                                    }
                                                }]
                                            });
                        },
                        onOpen:function(e, ui) {
                        	var oldname = this.collection.getSelected()[0].get("fname");
                        	
                        	$(e.target).find(".rename_input").val(oldname).focus();
                        },
                        download : function() {
                            // console.log("Download called");
                            this.collection.trigger("download");
                        },
                        distroy : function() {
                            this.collection.trigger("delete");
                        },
                        getInfo:function(callback){
                        	 var unique = akp_ws.createUUID();
                             var obj = {
                                 mesgtype : "request",
                                 request : "getinfo",
                                 dname : this.model.get("path"),
                                 service : "fmgr",
                                 cookie : unique,
                                 uid : auth.loginuserid,
                             }

                             collection.send(obj, callback)
                        },
                        
                        share:function(){
                        	var self=this;
                        	
                        	this.getInfo( function(resp) {
                                //console.log(resp)
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
                                    collection : self.collection,
                                    show:'share'
                                });
                            });
                        },
                        info : function() {
                            var self = this;

                          this.getInfo( function(resp) {
                                //console.log(resp)
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
                                    collection : self.collection,
                                    show:'desc',
                                });
                            })
                        },
                        hidemenu : function() {
                            $(this.el).hide();
                        }
                    });
            
            
            var shareDialog =Backbone.View.extend({
            	
            	events:{
            		'click .fileShareEdit': "edit",
            		'click .fileShareSave': 'save',
            	},
            	initialize:function(opts){
            		_.bindAll(this,"handleSaveResp");
            		
            		this.info=opts.info;
            		this.userInput = null;
            		this.groupInput = null;
            		this.usersReq = this.info.uid_list;
            		this.groupsReq = this.info.gid_list;
            	},
            	render:function(){
            		
            		var shareTemplate=$('#fileShare-template').tmpl([info]);
            		this.$el.html(shareTemplate);
            		
            		this.loadSharedGroups(this.info.groupssharedwith);
            		this.loadSharedUser(this.info.userssharedwith);
            		
            		return this;
            	},
            	edit:function(){
            		this.$(".fileShareEdit").hide();
            		this.$(".fileShareSave").show();
            		
            		this.$(".userListView").hide();
            		this.$(".groupsListView").hide();
            		
            		this.$(".userData").show();
            		this.$(".groupsData").show();
            		
            		if(this.userInput == null){
            			this.userInput = auth.contacts.selector({
            				el : this.$(".userData")
            			}).render();
            		}
            		
            		if(this.groupInput == null){
            			this.groupInput = auth.groups.selector({
            				el:this.$(".groupsData"),
            			
            			}).render();
            		}
            		
            		this.userInput.reset();
            		this.userInput.addUsers(this.info.userssharedwith);
            		
            		this.groupInput.reset();
            		this.groupInput.addGroups(this.info.groupssharedwith);
            		
            		
            	},
            	save:function(){
            		this.$(".fileShareSave").attr('disabled','disabled');
            		
            		this.usersReq = this.userInput.getSelected();
            		this.groupsReq = this.groupInput.getSelected();
            		
            		this.collection.share(this.info.fqpn,this.usersReq,this.groupsReq,this.handleSaveResp);
            		
            	},
            	handleSaveResp:function(resp){
            		if(resp.status && resp.status == 'success'){
            			
            			
            			this.info.uid_list= this.usersReq;
            			this.info.gid_list = this.groupsReq;
            			
            			
            		}else if(resp.error){
            			
            			this.usersReq = this.info.uid_list;
                		this.groupsReq = this.info.gid_list;
            			
            			//console.log(resp.error);
                		
                		noty({
                			text:resp.error,
                			layout:"bottomRight",
                			theme:'default',
                			type:'error',
                		});
            		}
            		
            		this.view();
            		this.loadSharedGroups(this.groupsReq);
        			this.loadSharedUser(this.usersReq);
            	},
            	view:function(){
            		this.$(".fileShareEdit").show();
            		this.$(".fileShareSave").hide().removeAttr('disabled');
            		
            		this.$(".userListView").show();
            		this.$(".groupsListView").show();
            		
            		this.$(".userData").hide();
            		this.$(".groupsData").hide();
            		
            	},
            	loadSharedUser:function(users){
            		this.$(".userListView").empty();
            		
            		if(users.length){
            			
            			for(var i=0;i<users.length;i++){
            				var user = auth.contacts.get(users[i]);
            				var userView = new App.Views.groupMember({model:user,
            					viewType : "inline"});
            				
            				this.$(".userListView").append(userView.render().$el);
            				
            			}
            		}
            		
            	},
            	loadSharedGroups:function(groups){
            		this.$(".groupsListView").empty();
            		
            		if(groups.length){
            			for(var i=0;i<groups.length;i++){
            				var group = auth.groups.get(groups[i]);
            				var groupView = new App.Views.GroupView({model:group,collection:auth.groups,readOnly:true,viewType:"inline"});
            				
            				this.$(".groupsListView").append(groupView.render().$el)
            			}
            		}
            	}
            	
            });
            
            var activityDialog = Backbone.View.extend({
            	events:{},
            	initialize:function(opts){
            		_.bindAll(this,"loadActivity");
            		this.info = opts.info;
            		this.collection.getActivity(this.info.fqpn,this.loadActivity);
            	},
            	render:function(){
            		
            		this.$el.append('<ul class="activity-list user-act-list"></ul>');
            		return this;
            		
            	},
            	loadActivity:function(resp){
            		//console.log(resp);
            		if(resp.result){
	            		var result = resp.result
	            		
	            		var info = this.getInfo(result);
	            		var el = $('#user-act-template').tmpl([ info ]);
	            		this.$(".activity-list").append(el);
            		}
            		else if(resp.error){
            			//console.log("Getting error on activity request.")
            			
            			noty({
                			text:resp.error,
                			layout:"bottomRight",
                			theme:'default',
                			type:'error',
                		});
            		}
            	},
            	getInfo : function(result) {
					
					var user = auth.getuserinfo(result.uid);
					var activity =result.activity;
					
					var info = {
						img : user.image_small,
						name : 	user.first_name,
						description : activity.substr(0,activity.indexOf('@')),
						diff: activity.substr(activity.indexOf('@')+1,activity.length),
						timestamp : this.formatTime(result.timestamp * 1000),
					}

					return info;

				},
				formatTime : function(timestamp) {
					var date = new Date(timestamp);
					var now = new Date();

					var yearCheck = date.getFullYear() == now.getFullYear() ;
					var monthCheck = date.getMonth() == now.getMonth();

					if ((date.getDate() == now.getDate()) && monthCheck	&& yearCheck) {
						return $.fullCalendar.formatDate(date, 'HH:mm');
					} else {
						return $.fullCalendar.formatDate(date,'HH:mm dd/MM/yyyy');
					}
				},
            });
            

            var infoDialog = Backbone.View                    .extend({
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
                            _.bindAll(this, "render", "close", "shareKons",'closeDialog',"handleTabShown");
                            this.baseCollection = opts.baseCollection;
                            
                            this.shareInfo=null;
                            this.activityInfo = null;
                            
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

                            var vaultKonsEntry = $("<div/>").addClass("vaultKonsEntry");
                            var vaultKonsStream = $("<div/>").addClass("vaultKonsStream");

                            var infopart = $("<div/>").addClass("fileinfoside");
                            
                            var inside = $('<ul class="nav nav-tabs" id="file-info-tab">  <li class="active"><a data-target="#file-disc" data-toggle="tab" >Discussion</a></li><li><a data-target="#file-share" data-toggle="tab">Share</a></li>  <li><a data-target="#file-activity" data-toggle="tab">Activity</a></li>  </ul> <div class="tab-content">  <div class="tab-pane active file-info-tab" id="file-disc"></div>  <div class="tab-pane file-info-tab" id="file-share"></div>  <div class="tab-pane file-info-tab" id="file-activity"></div>  </div>');
                            
                            
                            var tabView = $("<div/>").addClass("file-info-tabs").append(inside);
                            
                            
                            var konspart = $("<div/>").addClass("file-info-kons").append(vaultKonsEntry).append(vaultKonsStream);
                            
                            

                            var container = $("<div/>").append(infopart).append(tabView)//.append(konspart)
                            .css({
                                        height : "100%",
                                        
                                    });
                            
                            $(container).find("#file-disc").append(konspart);

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
                                close : this.closeDialog,
                                open : this.onOpen,
                            });
                            
                            //this.$('#file-info-tab a:last').tab('show');
                            
                            this.baseCollection.bind("initialized",
                                    this.getKonsDialog, this);
                            this.baseCollection.bind("initialized",
                                    this.loadKonsStream, this);
                            this.baseCollection.bind("clear", this.closeDialog,
                                    this);
                            
                            
                            this.$('a[data-toggle="tab"]').on('shown',this.handleTabShown);

                        },
                        closeDialog : function() {
                        	if(this.shareInfo){
                        		this.shareInfo.remove();
                        		
                        		
                        		this.$("#file-disc").after('<div class="tab-pane file-info-tab" id="file-share"></div>');
                        		this.$("#file-share").after('<div class="tab-pane file-info-tab" id="file-activity"></div>');
                        	}
                        	
                        	
                        	this.showTab('disc');
                        	this.clearActivity();
                        },
                        downloadFile : function() {
                            this.collection.trigger("download");
                        },
                        deleteFile : function() {
                            this.collection.trigger("delete");
                            this.$el.dialog("close");
                        },
                        setShare:function(){
                        	var elem = this.$("#file-share");
                        	elem.empty();
                        	
                        	this.shareInfo = (new shareDialog({
                        		el:'#file-share',
                        		model:this.model,
                        		info: this.fileInfo,
                        		collection:this.collection,
                        	})).render();
                        	
                        	
                        	
                        },
                        handleActivity:function(){
                        	
                        	if(!this.activityInfo){
                        	this.activityInfo = (new activityDialog({
                        		el:'#file-activity',
                        		model:this.model,
                        		info: this.fileInfo,
                        		collection:this.collection,
                        	})).render();
                        	}
                        	
                        	
                        },
                        clearActivity:function(){
                        	
                        	if(this.activityInfo){
                        	var elem = this.$("#file-activity");
                        	elem.empty();
                        	
                        	this.activityInfo.remove();
                        	
                        	this.activityInfo = null;
                        	}
                        },
                        saveInfo : function() {
                            this.collection.trigger("saveFileInfo",                                   this.fileInfo);
                        },
                        sendLock : function() {
                            var lockReq = this.fileInfo.locked ? "unlock"                                    : "lock";

                            this.fileInfo.locked = this.fileInfo.locked ? 0 : 1;

                            this.fileInfo.lockedBy = lockReq == "unlock" ? 0                                    : auth.loginuserid;

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
                                    this.$(".file-info-lock").children("span")                                            .removeClass().addClass("icon-unlocked");
                                else
                                    this.$(".file-info-lock").attr("disabled",                                            "disabled");

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
                                            //console.log(tags);

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
                            akp_ws.send({data:konsObj});
                            //console.log("sending kons object");
                            //console.log(konsObj);
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
                            this.setShare();
                            
                          
                            
                            
                            
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
                            
                            
                            if(opts.show){
                            	this.showTab(opts.show);
                            }
                            	
                            

                            this.$el.dialog("open");
                            return this;
                        },
                        showTab:function(tabname){
                        	if(tabname=='share'){
                        		viewid="file-share";
                        	}
                        	else if(tabname=='disc'){
                        		viewid='file-disc';
                        	}
                        	this.$('#file-info-tab a[href="#'+viewid+'"]').tab('show');
                        },
                        handleTabShown:function(e){
                        		var activeTab = e.target; // activated tab
                        	  var prevTab = e.relatedTarget; // previous tab
                        	  
                        	  if($(activeTab).data("target") == "#file-activity"){
                        		  this.handleActivity();
                        	  }
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
