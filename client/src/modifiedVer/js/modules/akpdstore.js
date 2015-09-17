/**
 * @author Raju K
 */

define(
		"akpdstore",
		[ "jquery", "underscore", "backbone", "akpauth",
				"text!../templates.html", "plugins/gettheme",
				"plugins/jqx-all", "plugins/FileSaver",
				"plugins/jquery.percentageloader-01a", "plugins/jquery-tmpl" ],
		function($, _, Backbone, auth, templates) {
			loader(10,"dstore Loaded");
			var baseModel = Backbone.Model.extend({
				defaults : {
					service : "dstore",
				}
			});

			var baseCollection = Backbone.Collection
					.extend({
						model : baseModel,
						home : null,
						mapReq : {},
						initialize : function() {
							this._meta = {
								files : [],
								filenames : [],
								checkinid : null,
								checkin_dname : null,

							};
							_.bindAll(this, "dwmessage", "downloadPost",
									"download_msg", "uwmessage", "uploadPost",
									"checkin_dialog", "checkin", "postFiles");
							// this.bind("setHome", this.gohome, this);
							this.bind("add", this.routeReq, this);
							this.bind("newwnd", this.getNewWindow, this);
							this.bind("download", this.handleFileWrite, this);
							this.bind("checkin_prepare", this.checkin_prepare,
									this);

							this.Dworker = new SharedWorker(
									'dstoredownloadworker.js');
							this.Dworker.port.start();
							this.Dworker.port.onerror = this.werror;
							this.Dworker.port.onmessage = this.dwmessage;

							this.worker = new SharedWorker(
									'dstoreuploadworker.js');
							this.worker.port.start();
							this.worker.port.onerror = this.werror;
							this.worker.port.onmessage = this.uwmessage;

						},

						meta : function(prop, value) {
							if (value === undefined) {
								return this._meta[prop]
							} else {
								this._meta[prop] = value;
							}
						},
						checkin_prepare : function(dname) {
							var unique = akp_ws.createUUID();

							var req_obj = {
								mesgtype : "request",
								request : "checkin_prepare",
								cookie : unique,
								service : "dstore",
								dname : dname,
								file_list : this.meta("filenames"),
								uid : auth.loginuserid
							}
							this.send(req_obj, this.checkin_dialog);
							this.meta("checkinid", req_obj.cookie);
							this.meta("checkin_dname", dname);
						},
						checkin_dialog : function(svr_cmds) {
							var root = this;

							if (svr_cmds.status == "success") {

								var dialogClose// =
								// $("<div/>").append(closebtn).addClass("btnpart");
								var commentbox = $("<div/>").attr(
										"contenteditable", "plaintext-only")
										.addClass("checkin_comment");
								var table = $("<table/>").attr("width", "100%");
								var length = svr_cmds.file_list.length;
								for ( var l = 0; l < length; l++) {
									$(
											"<tr><td>"
													+ svr_cmds.file_list[l]["fname"]
													+ "</td><td>"
													+ svr_cmds.file_list[l]["change"]
													+ "</td></tr>").appendTo(
											table);
								}

								var filesStatusTable = $("<div/>")
										.append(table).addClass(
												"checkin_status");
								var submitbtn = $("<button/>").append("Submit")
										.bind("click", root.checkin).addClass(
												"btn rt_btn");
								var cancelbtn = $("<button/>").append("Cancel")
										.bind("click", function() {
											$(this).parent().parent().remove();
											root.meta("files", []);
											root.meta("filenames", []);
										}).addClass("btn redbtn rt_btn");

								var btnpart = $("<div/>").append(submitbtn)
										.append(cancelbtn).addClass("btnpart");

								var dialog = $("<div/>").attr("id",
										"checkindialog").append(dialogClose)
										.append(commentbox).append(
												filesStatusTable).append(
												btnpart).addClass("modal")
										.appendTo("body");
								// makeCenterDiv("#checkindialog");
							}

						},
						checkin : function(e) {

							var commit_msg = $(e.target).parents().siblings(
									".checkin_comment").text();

							var req_obj = {
								mesgtype : "request",
								"request" : "checkin",
								service : "dstore",
								uid : auth.loginuserid,
								dname : this.meta("checkin_dname"),
								cookie : this.meta("checkinid"),
								file_list : this.meta("filenames"),
								commit_msg : commit_msg
							}

							this.send(req_obj, this.postFiles);
							// maptable[req_obj.cookie] = "checkin";
							$(e.target).parent().parent().remove();

						},
						postFiles : function() {
							var files = this.meta("files");
							var length = files.length;
							for ( var i = 0; i < length; i++) {

								this.uploadPost({
									'mesgtype' : 'file_list',
									'files' : files[i],
									'dname' : this.meta("checkin_dname")
											+ "/.commit/" + files[i].name,

								});
								$('#upload_status')
										.append(
												'<div class="upload_file">'
														+ files[i].name
														+ '<span class="cancel uc" data-fname="'
														+ files[i].name
														+ '">Cancel</span></div>');
							}
							$('#uploadwindow').jqxWindow('show');
							$('#uploadwindow').jqxWindow('bringToFront');

						},

						uploadPost : function(msg) {
							this.worker.port.postMessage(msg);
						},
						uwmessage : function(e) {
							var dat = e.data.obj;

							if (!e.data.obj) {
								console.log(e.data);
							} else if (dat.mesgtype == 'request'
									|| dat.mesgtype == 'cancel') {
								var pcnt = e.data.prct;
								// this.upr.setProgress(Math.round(pcnt) / 100);
								// this.collection.send(dat, this.uploadPost);
								console.log(pcnt);
								dat["commit_cookie"] = this.meta("checkinid");
								this.send(dat, this.uploadPost);

							} else if (dat.mesgtype == 'complete') {
								$('#upload_status').find('div:eq(0)').remove();
								if ($('#upload_status div').length == 0) {
									$('#uploadwindow').jqxWindow('hide');
									$("#fmgrUploadsBtn").hide();
								}

							}

						},

						dwmessage : function(e) {
							var down_data = e.data;
							if (!down_data.file) {
								// console.log(down_data);
							} else if (down_data.file.mesgtype == 'ack'
									|| down_data.file.mesgtype == 'request'
									|| down_data.file.mesgtype == 'cancel') {
								this.send(down_data.file, this.download_msg);
								// this.dpr.setProgress(down_data.percent)
								this.trigger("downloads_update",
										down_data.percent)
							} else if (down_data.file.mesgtype == 'save') {
								// this.dpr.setProgress(down_data.percent)

								this.trigger("downloads_update",
										down_data.percent)
								var dfname = down_data.file.dfname
										.substring(down_data.file.dfname
												.lastIndexOf('/') + 1,
												down_data.file.dfname.length);
								saveAs(down_data.file.fl, dfname);
								$('#dloads').find('div:eq(0)').remove();
								if ($('#dloads div').length == 0) {
									$('#downloads').jqxWindow('hide');
									$("#fmgrDloadsBtn").hide();
								}
							}

						},
						werror : function(e) {
							consloe.log('ERROR: Line ', e.lineno, ' in ',
									e.filename, ': ', e.message);
						},
						download_msg : function(msg) {
							var strdata = msg.data;
							msg.data = window.atob(strdata);
							this.downloadPost({
								obj : msg
							})
						},
						downloadPost : function(msg) {
							this.Dworker.port.postMessage(msg);

						},
						handleFileWrite : function(downloads_list) {

							var list = downloads_list;
							// this.files.getSelected();
							var root = this;

							$
									.each(
											list,
											function(i, v) {
												// console.log(v);
												var obj = v.toJSON();
												var fname = obj.path;
												var size = obj.size;
												var dfname = fname
														.substring(
																fname
																		.lastIndexOf('/') + 1,
																fname.length);
												if (obj.isdir != "true") {

													$("#fmgrDloadsBtn").show();

													var guid = akp_ws
															.createUUID();

													var write_obj = {
														mesgtype : "request",
														service : "dstore",
														request : "read",
														cookie : guid,
														fname : fname,
														size : 1024,
													};
													root.downloadPost({
														obj : write_obj,
														siz : size
													});
													$('#dloads')
															.append(
																	'<div class="download_file">'
																			+ dfname
																			+ '<span class="cancel dc" data-fname="'
																			+ fname
																			+ '" data-cookie>Cancel</span></div>');
												} else {
													root.trigger("downloadErr",
															dfname);
												}
											});

						},
						setHome : function(dir) {
							var cdir = "/akorp/docs/" + dir;
							this.cwd = cdir;
							this.home = cdir;
							this.trigger("setHome", cdir);
						},
						routeReq : function(model) {
							var req = model.toJSON();
							var method = this.mapReq[req.cookie];
							if (method)
								method.apply(model, [ req ]);
						},
						send : function(obj, successCallback, errorCallback) {
							akp_ws.send(obj);
							this.mapReq[obj.cookie] = successCallback;
						},
						getNewWindow : function(path) {

							var newWindow = new WindowView({

								dir : path,
								home : this.home
							});
						}
					});

			var FileModel = Backbone.Model.extend({
				defaults : {
					isSelected : false,
					isOpened : false,
					isByView : false,
				}
			});

			var Files = Backbone.Collection.extend({
				model : FileModel,
				initialize : function() {
					this._meta = {};
					_.bindAll(this, "loadFiles", "update", "handleResponse")
					this.bind("change", this.update, this);
					this.bind("goHome", this.setHome, this);
					this.bind("refresh", this.refresh, this);
					this.bind("delete", this.remove, this);
					this.bind("search", this.makeSearch, this);
					this.bind("checkout", this.checkout, this);
					this.bind("revert", this.revert_checkout, this);
					this.bind("follow", this.follow, this);
					this.bind("unfollow", this.unfollow, this);
					this.bind("lock", this.lock, this);
					this.bind("unlock", this.unlock, this);
					this.bind("mark_private", this.mark_private, this);
					this.bind("unmark_private", this.unmark_private, this);

				},

				meta : function(prop, value) {
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
				remove : function() {
					var list = this.getSelected();
					var args = [];
					$.each(list, function(index, item) {
						args.push(item.get('fname'));
					});

					var guid = akp_ws.createUUID();
					var dlt_obj = {

						mesgtype : "request",
						service : "dstore",
						request : "remove",
						cookie : guid,
						source : this.meta("cwd"),
						srcargs : args
					}
					collection.send(dlt_obj, this.handleResponse);
				},
				cancelSearch : function() {
					if (!this.meta("search_id"))
						return;

					var obj = {
						service : "dstore",
						cookie : this.meta("search_id"),
						mesgtype : "request",
						request : "cancel"
					}
					this.meta("search_id", false);
					collection.send(obj);
				},
				makeSearch : function(str) {

					this.cancelSearch();
					if (!str) {
						this.trigger("noSearch");
						return;
					}

					var unique = akp_ws.createUUID();
					var obj = {

						service : "dstore",
						mesgtype : "request",
						request : "search",
						cookie : unique,
						dname : this.meta("cwd"),
						key : str,

					}
					this.meta("search_id", obj.cookie);
					collection.send(obj, this.handleSearchResults);
				},
				handleSearchResults : function(resp) {
					filesCollection.trigger("addResult", resp)
				},
				handleResponse : function(resp) {
					this.trigger("refresh");
				},
				setHome : function() {
					this.unselect();
					this.closeOpened();
					this.meta("cwd", this.meta("home"));
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
							}
							break;
						}
					}
				},
				getTree : function() {
					// var path=model.get("path");
					var guid = akp_ws.createUUID();
					var dir_json = {
						mesgtype : "request",
						service : "dstore",
						request : "getdir",
						cookie : guid,
						dname : this.meta("cwd")
					}
					collection.send(dir_json, this.loadFiles);
					this.trigger("showPath")

				},
				checkout : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "checkout",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path")
					// this.meta("cwd"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				revert_checkin : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "revert",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : this.meta("cwd"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				revert_checkout : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "revert_checkout",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path")
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				lock : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "lock",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				unlock : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "unlock",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				follow : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "follow",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					
					
					console.log(obj);
				},
				unfollow : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "unfollow",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				mark_private : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "mark_private",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				unmark_private : function(model) {
					var guid = akp_ws.createUUID();
					var obj = {
						mesgtype : "request",
						service : "dstore",
						request : "unmark_private",
						cookie : guid,
						// uid : auth.loginuserid,
						doc : model.get("path"),
					// srcargs : args
					}
					//collection.send(obj, this.handleTargetResponse);
					console.log(obj);
				},
				handleTargetResponse : function(resp) {

					if (resp.status == "success")
						this.trigger("refresh");

				},
				loadFiles : function(obj) {
					var length = obj.direlements.length;
					for ( var i = 0; i < length; i++) {
						obj.direlements[i]["path"] = this.meta("cwd") + "/"
								+ obj.direlements[i].fname;
						this.add(obj.direlements[i]);
					}
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
				getSelected : function() {
					var list = [];
					list = this.where({
						"isSelected" : true
					});

					return list;
				},
				unselect : function() {
					this.filter(function(file) {
						if (file.get("isSelected") == true) {
							file.set({
								"isSelected" : false
							})
						}

					})
				}
			})

			var searchView = Backbone.View
					.extend({
						el : $(".searchResults"),
						initialize : function() {

							_.bindAll(this, "render", "removeOldResults",
									"insertResult");
							this.collection.bind("search",
									this.removeOldResutls, this);
							this.collection.bind("addResult",
									this.insertResult, this);
							this.collection.bind("noSearch", this.hide, this);
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
								model : result
							})
							this.$el.append(item.render().el)

						},
						removeOldResults : function() {
							this.show();
							this.$el.empty().append("Searching..");
						}
					});
			var searchItemView = Backbone.View.extend({
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
					this.$el.append(
							"<img src='" + src + "' height=32 width=32 />")
							.append("<span>" + resp.fname + "</span>");
				},
				render : function() {
					return this;
				},
				openNewWnd : function() {
					console.log('path:' + this.model.fpath)

					collection.trigger("newwnd", this.model.fpath)

				},
			})

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
							this.collection.meta("cwd", options.dir);
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
							});
							// this.collection.bind("add", this.showFiles,
							// this);

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
							var guid = akp_ws.createUUID();
							var dname = this.collection.meta("cwd");
							var add_obj = {
								mesgtype : "request",
								service : "dstore",
								request : 'create_dir',
								cookie : guid,
								source : dname,
							}
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
												buttons : {
													"Create" : function() {
														if ($('input#flname')
																.val() != '') {
															add_obj.srcargs = [ $(
																	'input#flname')
																	.val() ];
															collection
																	.send(
																			add_obj,
																			root.refresh);
															$(this).dialog(
																	"close")
																	.remove();
														}
													},
													Cancel : function() {
														$(this).dialog("close")
																.remove();
													}
												}
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
							var roots = this.getRoots(cwd);
							location.empty();
							for ( var i = 0; i < roots.length; i++)
								location.append($("<li/>").append(roots[i])
										.attr('data-pathid', i).addClass(
												"pathdir"));

						},
						getRoots : function(path) {

							var paths = path.split("/");
							var dirs = [];
							var flag = false;
							var pathname;
							var activedir = this.collection.meta("home");
							this.roots = [];
							var tmp = "";
							for ( var i = 0; i < paths.length; i++) {
								if (paths[i]) {
									tmp += "/" + paths[i];

									if (tmp == activedir) {
										flag = true;
									}
									if (flag) {
										pathname = tmp == activedir ? "Home"
												: paths[i];

										this.roots.push(tmp);
										dirs.push(pathname);

									}

								}

							}
							return dirs;

						},
						gopath : function(e) {

							var id = $(e.target).attr("data-pathid");
							var dir = this.roots[id];
							this.collection.meta("cwd", dir);
							this.subView.render();

							this.collection.getTree();
						}
					});

			var MasterView = Backbone.View
					.extend({
						el : $("#dstore"),
						events : {

							'dragover #dstore_dropzone' : "handleDragOver",
							'drop #dstore_dropzone' : "handleFileSelect",
						/*
						 * 'click #add_fldr' :"createFolder", 'click #gettree' :
						 * "flipTree", 'click #refresh' : "refreshView", 'click
						 * #home_folder' : "gotoHome", 'click #parent' :
						 * 'gotoParent', 'click #fmgrUploadsBtn' :
						 * "showUploads", "click #fmgrDloadsBtn" :
						 * "showDownloads", "keyup #fmgrSearchBox" :
						 * "searchFiles"
						 */

						},
						initialize : function(options) {
							_.bindAll(this, "render", "routeReq", "gohome",
									"tree");
							this.collection.bind("setHome", this.gohome, this);
							this.collection.bind("downloadErr",
									this.downloadErr, this);
							this.collection.bind("downloads_update",
									this.updateLoadEngine, this);
							this.files = options.files;
							this.files.bind("newfolder", this.createFolder,
									this);
							this.files.bind("alertRemove", this.alertRemove,
									this);
							this.files.bind("download", this.handleFileWrite,
									this);

							jQuery.event.props.push('dataTransfer');

							/*
							 * this.upr = $("#uprogress").percentageLoader({
							 * width : 100, height : 100, progress : 0, position : {
							 * x : 200, y : 400 }, animationType : 'slide' });
							 * this.dpr = $("#progress").percentageLoader({
							 * width : 100, height : 100, progress : 0, position : {
							 * x : 200, y : 400 }, animationType : 'slide' });
							 * 
							 * this.$('#uploadwindow').jqxWindow({ autoOpen :
							 * false, showCloseButton : false,
							 * showCollapseButton : true, width : 300, height :
							 * 310 });
							 * 
							 * this.$('#downloads').jqxWindow({ autoOpen :
							 * false, showCloseButton : false,
							 * showCollapseButton : true, height : 300, width :
							 * 310 });
							 * 
							 * $("#nodes").jqxTree(); $("#nodes").hide();
							 * $("#nodes").jqxTree('selectItem', $("#home")[0]);
							 */
						},
						render : function() {

						},
						routeReq : function(req) {
							console.log(req.toJSON());

						},
						searchFiles : function(e) {
							e.stopPropagation();
							var str = $(e.currentTarget).val();
							this.files.trigger("search", str);
							if (e.which == 13) {
								$(e.currentTarget).select();
							}
						},
						gohome : function(dir) {

							// this.$("#home").attr('data-path', dir);
							this.files.meta("home", dir);
							this.files.meta("cwd", dir);
							this.files.trigger("goHome");
							this.files.getTree();
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
						handleDragOver : function(e) {
							e.stopPropagation();
							e.preventDefault();
							e.dataTransfer.dropEffect = 'copy';
						},
						tree : function(obj) {
							var length = obj.direlements.length;
							for ( var i = 0; i < length; i++) {
								this.files.add(obj.direlements[i]);
							}
						},
						updateLoadEngine : function(perc) {
							
							console.log(perc);
							
							//this.dpr.setProgress(perc);
						},
						werror : function(e) {
							consloe.log('ERROR: Line ', e.lineno, ' in ',
									e.filename, ': ', e.message);
						},

						handleFileWrite : function() {
							var list = this.files.getSelected();
							this.collection.trigger("download", list);
						},
						downloadErr : function(dfname) {
							var data = "<strong>Directory is not supported!</strong><br><b>"
									+ dfname + "</b> cannot be download.";

							$("<div/>")
									.attr('id', 'dlt_dialog')
									.append(
											'<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>'
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

							var root = this;
							ev.stopPropagation();
							ev.preventDefault();

							if (!ev.dataTransfer)
								return;

							var length = ev.dataTransfer.items.length
									|| ev.target.files.length;
							var src, isdir, septr, path_ext = [], q = 0;
							for ( var i = 0, f; i < length; i++) {
								var item = ev.dataTransfer.items[i]
										.webkitGetAsEntry();

								if (item.name.indexOf('.') == 0)
									continue;

								if (item.isFile) {
									item.file(function(file) {

										root.collection.meta("files")
												.push(file);
										root.collection.meta("filenames").push(
												file.name);

										if (i == length)
											root.collection.trigger(
													"checkin_prepare",
													root.files.meta("cwd"));

									});

								} else if (item.isDirectory)
									console
											.log("NO DIRECTORY UPLOAD SUPPORT IN DSTORE");

								// this.traverseFileTree(entry)
							}

						},
						traverseFileTree : function(item, path) {
							var root = this;
							var dname = root.files.meta("cwd");
							path = path || "/";
							if (item.name.indexOf('.') != 0) {
								if (item.isFile) {
									item.file(function(file) {

										dstore_fileList.files.push(file);
										dstore_fileList.filenames
												.push(file.name);

										if (i == length) {
											dstore_checkin_prepare();
										}

									});
									/*
									 * var postmsg = { 'mesgtype' : 'file_list',
									 * 'files' : file, 'dname' : dname + path +
									 * file.name, } root.uploadPost(postmsg);
									 * $('#upload_status') .append( '<div
									 * class="upload_file">' + file.name + '<span
									 * class="cancel uc" data-fname="' +
									 * file.name + '">Cancel</span></div>');
									 * });
									 * 
									 * $('#fmgrUploadsBtn').show();
									 */

								} else if (item.isDirectory) {

									console
											.log("NO DIRECTORY UPLOAD SUPPORT IN DSTORE");
								}

							}
						},
						handleNewFileResponse : function(resp) {

							this.files.trigger("refresh");

						},
						handleNewFolderResponse : function(resp) {

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

						createFolder : function() {
							var root = this;
							var guid = akp_ws.createUUID();
							var dname = this.files.meta("cwd");
							var add_obj = {
								mesgtype : "request",
								service : "dstore",
								request : 'create_dir',
								cookie : guid,
								source : dname,
							}
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
												buttons : {
													"Create" : function() {
														if ($('input#flname')
																.val() != '') {
															add_obj.srcargs = [ $(
																	'input#flname')
																	.val() ];
															root.collection
																	.send(
																			add_obj,
																			root.handleNewFolderResponse);
															$(this).dialog(
																	"close")
																	.remove();
														}
													},
													Cancel : function() {
														$(this).dialog("close")
																.remove();
													}
												}
											});

						},
						refreshView : function() {
							this.files.trigger("refresh");
						},
						gotoHome : function() {

							this.files.trigger("goHome");
						},
						gotoParent : function() {

							if (this.files.meta("cwd") == this.files
									.meta("home"))
								return;

							this.files.trigger("goParent");
						},
						flipTree : function() {
							this.$('#nodes').fadeToggle();
						},
					});

			var FilesZone = Backbone.View.extend({

				events : {
					"contextmenu" : "cmenu"
				},
				initialize : function() {

					var items = this.collection;
					/*
					 * this.$el.selectable({ filter : 'li', cancel :
					 * ".fsdiv,.fname, .akorp-mime", selected : function(event,
					 * ui) { $(ui.selected).each(function() {//
					 * .toggleClass("selected") cid = $(this).data("cid"); var
					 * model = items.get(cid); model.set({ isSelected : true })
					 * });
					 *  }, unselected : function(event, ui) {
					 * $(ui.unselected).each(function() {//
					 * .removeClass("selected") cid = $(this).data("cid"); var
					 * model = items.get(cid); model.set({ isSelected : false })
					 * }); }, }).sortable();
					 */

					_.bindAll(this, "render", "update");
					this.collection.bind("add", this.list, this);
					this.collection.bind("change", this.update, this);
					this.collection.bind("goHome", this.render, this);
					this.collection.bind("goParent", this.render, this);
					this.collection.bind("refresh", this.render, this);

				},
				render : function() {
					this.$el.empty();

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

				list : function(file) {
					var fileview = new File({
						model : file,
						collection : this.collection
					})

					// console.log(this.$el.length);
					this.$el.append(fileview.render().el);

				},
				cmenu : function(e) {
					e.preventDefault();
					e.stopPropagation();
					cmenu.render({
						type : "workspace",
						model : this.model,
						collection : this.collection,
						psX : e.pageX,
						psY : e.pageY
					});
				}
			});
			var File = Backbone.View
					.extend({
						tagName : "li",
						ClassName : "file-div",
						events : {
							'click' : "select",
							'dblclick' : 'open',
							'contextmenu' : "cmenu"
						},
						initialize : function() {

							var data = this.model.toJSON();
							$(this.el).attr("data-cid", this.model.cid);
							// this.bindFeatures()
							// var mimeclass = this.mime2class(data.type);
							data["mime"] = data.isdir == 'true' ? "akorp-mime-directory"
									: "akorp-mime-document";
							this.template = $("#file-template").tmpl([ data ]);
							_.bindAll(this, "render", "getChange");
							this.model.bind("change", this.getChange, this);
							this.model.bind("open", this.open, this);

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
						mime2class : function(a) {
							var b = "akorp-mime-";
							var newmime = b + a.replace(/(\.|\+|\/)/g, "-");
							return a = a.split("/"), b
									+ a[0]
									+ (a[0] != "image" && a[1] ? " " + b
											+ a[1].replace(/(\.|\+)/g, "-")
											+ " " + b + a[0] + "-"
											+ a[1].replace(/(\.|\+\-)/g, "")
											: "");

						},
						select : function(e) {

							/*
							 * if (e.ctrlKey) { var st =
							 * this.model.get("isSelected"); this.model.set({
							 * isSelected : !st }); //
							 * $(this.el).toggleClass('selected '); } else {
							 * this.collection.unselect(); this.model.set({
							 * isSelected : true }); }
							 */

							// $(this.el).addClass('selected ui-selected');

							this.collection.unselect();
							this.model.set({
								isSelected : true
							});
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
							if (!this.model.get("isdir"))
								return;
							if (!this.model.get("isOpened")) {
								this.collection.closeOpened();
								this.model.set({
									isByView : true
								})
								this.model.set({
									isOpened : true
								});
							}
						},
						cmenu : function(e) {
							if (!this.model.get("isSelected"))
								this.select(e);

							e.preventDefault();
							e.stopPropagation();
							var isdir = this.model.get("isdir");
							var type = isdir == "true" ? "folder" : "file";
							cmenu.render({
								type : type,
								model : this.model,
								collection : this.collection,
								psX : e.pageX,
								psY : e.pageY
							});

						}
					});

			var cmenuView = Backbone.View
					.extend({
						el : $("#dstore_cmenu"),
						fileList : [ "dstr-download", "dstr-info", "dstr-dlt" ],
						folderList : [ "dstr-open", "dstr-copy", "dstr-newwnd",
								"dstr-dlt", "dstr-info" ],
						workspace : [ "dstr-create_folder" ],
						events : {
							"click" : "hidemenu",
							'click #dstr-create_folder' : "createFolder",
							'click #dstr-open' : "open",
							"click #dstr-newwnd" : "newView",
							"click #dstr-download" : "download",
							"click #dstr-dlt" : "distroy",
							"click #dstr-info" : "info",
							"click #dstr-checkout" : "checkout",
							"click #dstr-revert" : "revert",
							"click #dstr-mprivate" : "mark_private",
							"click #dstr-mpublic" : "unmark_private",
							"click #dstr-follow" : "follow",
							"click #dstr-unfollow" : "unfollow",
							"click #dstr-lock" : "lock",
							"click #dstr-unlock" : "unlock",

						},
						render : function(opts) {
							// console.log(opts)
							this.viewtype = opts.type;
							this.model = opts.model;
							this.collection = opts.collection;

							$(this.el).css({
								top : opts.psY + 'px',
								left : opts.psX + 'px'
							}).show();
							this.filterMenu();

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

							if (this.viewtype == 'file') {
								this.model.get("following") ? list
										.push("dstr-unfollow") : list
										.push("dstr-follow");
								this.model.get("private") ? list
										.push("dstr-mpublic") : list
										.push("dstr-mprivate");
								this.model.get("locked") ? list
										.push("dstr-unlock") : list
										.push("dstr-lock");
								this.model.get("checkedout") ? list
										.push("dstr-revert") : list
										.push("dstr-checkout");

							}
							return list;

						},
						resetdefaults : function() {
							this.fileList = [ "dstr-download", "dstr-dlt",
									"dstr-info" ];
							this.folderList = [ "dstr-open", "dstr-dlt",
									"dstr-newwnd", "dstr-info" ];
							this.workspace = [ "dstr-create_folder" ];
						},
						createFolder : function() {

							this.collection.trigger("newfolder");
						},
						open : function() {
							if (this.collection.getSelected().length > 1) {
								console
										.log("sorry unable to open multiple files");
							} else {
								this.model.trigger("open")
							}
						},
						newView : function() {
							collection
									.trigger("newwnd", this.model.get("path"));
						},

						checkout : function() {
							this.collection.trigger("checkout", this.model);
						},
						revert : function() {
							this.collection.trigger("revert", this.model);
						},
						lock : function() {
							this.collection.trigger("lock", this.model);
						},
						unlock : function() {
							this.collection.trigger("unlock", this.model);
						},
						follow : function() {
							this.collection.trigger("follow", this.model);
						},
						unfollow : function() {
							this.collection.trigger("unfollow", this.model);
						},
						mark_private : function() {
							this.collection.trigger("mark_private", this.model);
						},
						unmark_private : function() {
							this.collection.trigger("mark_public", this.model);
						},
						download : function() {
							this.collection.trigger("download");
						},
						distroy : function() {
							this.collection.trigger("delete");
						},

						convBytes : function(bytes, precision) {
							var kilobyte = 1024;
							var megabyte = kilobyte * 1024;
							var gigabyte = megabyte * 1024;
							var terabyte = gigabyte * 1024;

							if ((bytes >= 0) && (bytes < kilobyte)) {
								return bytes + ' B';

							} else if ((bytes >= kilobyte)
									&& (bytes < megabyte)) {
								return (bytes / kilobyte).toFixed(precision)
										+ ' KB';

							} else if ((bytes >= megabyte)
									&& (bytes < gigabyte)) {
								return (bytes / megabyte).toFixed(precision)
										+ ' MB';

							} else if ((bytes >= gigabyte)
									&& (bytes < terabyte)) {
								return (bytes / gigabyte).toFixed(precision)
										+ ' GB';

							} else if (bytes >= terabyte) {
								return (bytes / terabyte).toFixed(precision)
										+ ' TB';

							} else {
								return bytes + ' B';
							}
						},

						info : function() {

							var fname = this.model.get("fname");
							var s = this.model.get('size');
							var t = this.model.get('type');
							var isdir = this.model.get("isdir");

							var finfo = isdir == "true" ? 'Type : <b>Directory</b>'
									: 'Type :  <b>' + t + '</b><br>Size :  <b>'
											+ this.convBytes(s, 2) + '</b>';
							var data = '<img src="css/images/file-info.png" height=32 width=32 align=left />Name : <b>'
									+ fname + '</b><br>' + finfo;
							$('<div/>').append('<div/>').append('<div/>').attr(
									'id', 'infownd').jqxWindow({
								resizable : false,
								draggable : false,
								title : 'Info',
								content : data,
								isModal : true,
								closeButtonAction : 'close',
								width : 300,
								height : 100,
							});
						},
						hidemenu : function() {
							$(this.el).hide();
						}
					})

			var collection = new baseCollection;
			var filesCollection = new Files;

			var view = new MasterView({
				collection : collection,
				files : filesCollection,
			});

			var subView = new FilesZone({
				el : $("#dstore_file-list"),
				collection : filesCollection
			});

			var searchbox = new searchView({
				collection : filesCollection
			});

			var cmenu = new cmenuView;

			return collection;

		});
