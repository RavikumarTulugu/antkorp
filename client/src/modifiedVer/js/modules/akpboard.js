/**
 * @author Raju Konga
 */
define("akpboard", [ "jquery", "underscore", "backbone", "akpauth",
		"text!../templates.html", "plugins/wColorPicker", "plugins/wPaint",
		"plugins/jquery-tmpl" ], function($, _, Backbone, auth, templates) {
	loader(10,"board Loaded");
	var BoardView = Backbone.View.extend({
		el : $("#boardPanel"),
		defaults:{
			
		},
		initialize : function() {
_.bindAll(this,"onVisible");
			var self=this;
			
			setTimeout(function() {
				var p = self.$el;
				var ph = p.height();
				var pw = p.width();
				self.$el.css({
					height : ph,
					width : pw
				}).wPaint({
							drawDown:self.sendData,
							drawMove:self.sendData,
							drawUp:self.sendData,
							onChangeMode:self.handleChangeMode
						})
			}, 8000);
		},
		onVisible:function(){
			
			this.resize();
			
			this.$el.wPaint("render");
		},
		render : function() {

		},
		resize:function(){
			var parent=this.$el.parent();
			var width=parent.width();
			var height=parent.height();
			
			this.$el.css({width:width,height:height});
			
		},
		changeMode:function(mode){
			this.$el.wPaint("mode",mode);
		},
		
		handleChangeMode:function(mode){
			var msg={mesgtype:"peerEvent",
					eventtype:"changemode",
					mode:mode,
					to:1024}
			akp_ws.sendPeer(msg);
		},
		sendData:function(e,mode,event){
			var data={
					e:{pageX:e.pageX,pageY:e.pageY},
					ev:event,
					mode:mode,
					
			},
			msg={
					mesgtype:"peerEvent",
					eventtype:"draw",
					dat:data,
					to:1024//this.$elem.wPaint("members")
			}
			akp_ws.sendPeer(msg);
			
		},
		draw:function(data){
			this.$el.wPaint("drawData",data);
		}
	})

	return new BoardView;

});
