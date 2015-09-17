/**
 * @author Rajuk
 */
define("akpnotes", [ "jquery", "underscore", "backbone", "akpauth"], function($, _, Backbone, auth) {

	loader(10,"notes Loaded");
	var note=Backbone.Model.extend({
		id:null,
		title:"",
		description:"",
	});
	
	var notes=Backbone.Collection.extend({
		model:note,
		start:function(){
			var obj={
					mesgtype:"request",
					request:"getnotes",
					loginid:auth.loginuserid,
					cookie:akp_ws.createUUID()
			}
			this.sendReq(obj)
		},
		sendReq:function(args){
			args.service="notes";
			
			akp_ws.send(args);
		},
		handleMessage:function(msg){
			if(msg.mesgtype=="event"){
				switch(msg.eventtype){
				case "notes":
					this.addNotes(msg)
					break;
				case "addNote":
					this.addNotes(msg)
					break;
				case "removeNote":
					this.deleteNote(msg);
					break;
				case "updateNote":
					this.updateNote(msg);
					break;
					default:
						console.log("unrecognised note message");
				}
			}
		},
		addNotes:function(msg){
			
		},
		deleteNote:function(msg){
			
		},
		updateNote:function(msg){
			
		}
		
	})
	
	
	
	var noteslist = Backbone.View.extend({
		el : $(".usernotes-list"),
		events : {
"click #note_add":"getNew"
		},
		initialize : function() {
this.collection.bind("add",this.addnote,this);
		},
		render : function() {

		},
		addnote:function(model){
			var note=new noteview({model:model});
			this.$("ul").append(note.render().el);
		},
		getNew:function(){
			var editView= new noteeditView({newnote:true});
			editView.render();
		}
	});
	
	
	var noteview=Backbone.View.extend({
		tagName:"li",
		className:"usernote",
		events:{
			"click":"showFull"
		},
		initialize:function(){
			
		},
		render:function(){
			var note=this.model.toJSON();
			this.$el.append("<h1>"+note.title+"</h1>");
			
			return this;
		},
		showFull:function(){
			var fullview=new noteexpand({model:this.model});
			fullview.render();
		}
	});
	
	var noteexpand=Backbone.View.extend({
		el:$(".usernotes-view"),
		events:{
			"click #note-edit":"edit",
			"click #note-delete":"remove"
		},
		render:function(){
			var note=this.model.toJSON();
			
			
			
			var template="<div class=notes_content><h3 class='note_title' >"+note.title+"</h3><p class='note_desc'>"+ note.desc+"</p></div><div class='notes_btn_bar'><button class='btn btn-icon icon-pencil' id='note-edit'></button>" +
			"<button class='btn btn-icon icon-remove' id='note-delete' ></button></div>";
			
			
			
			this.$el.html(template);
			},
			edit:function(){
				var editView=new noteeditView({newnote:false,model:this.model});
				editView.render();
				
			},
			remove:function(){
				
			}
	});
	
	var noteeditView=Backbone.View.extend({
		el:$(".usernotes-view"),
		events:{
			"click #note_save":"savenote",
			"click #note-cancel":"cancel"
		},
		initialize:function(opts){
			this.newnote=opts.newnote;
		},
		render:function(){
			if(!this.newnote){
				this.renderdata();
			}
			else{
				this.rendernull();
			}
			
			},
			renderdata:function(){
				var note=this.model.toJSON();
				var template="<div class=notes_content><p class='note_edit_title' contenteditable >"+note.title+"</p><p class='note_edit_desc' contenteditable> "+note.desc+"</p></div><div class='notes_btn_bar'><button class='btn btn-icon icon-checkmark-circle' id='note_save'></button>" +
				"<button class='btn btn-icon icon-cancel-circle' id='note-cancel' ></button></div>";
				this.$el.html(template);
			},
			rendernull:function(){
				
				var template="<div class=notes_content><p class='note_edit_title' contenteditable ></p><p class='note_edit_desc' contenteditable></p></div><div class='notes_btn_bar'><button class='btn btn-icon icon-checkmark-circle' id='note_save'></button>" +
						"<button class='btn btn-icon icon-cancel-circle' id='note-cancel' ></button></div>";
				this.$el.html(template);
			},
			cancel:function(){
				
			},
			savenote:function(){
				var req={
				title:this.$(".note_edit_title").text(),
				desc:this.$(".note_edit_desc").text(),
				}
				if(this.newnote){
					this.saveNew(req);
				}
				else{
					this.saveChange(req);
				}
				
			},
			saveNew:function(req){
			
						req.cookie=akp_ws.createUUID();
						req.mesgtype="request";
						req.request="add";
						req.id=akp_ws.createUUID();
						
						console.log(req);
						collection.add(req)
				
				
				
				
			},
			saveChange:function(req){
				req.cookie=akp_ws.createUUID();
				req.mesgtype="request";
				req.request="change";
				req.id=this.model.get("id");
				
				console.log(req);
				collection.add(req);
				
			}
	})
	
	
	var collection=new notes;
	
	var list=new noteslist({collection:collection});
	
	return collection;
	

});