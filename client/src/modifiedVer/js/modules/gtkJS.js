/**
 * @author Rajukonga
 */
define("gtkJS", ["jquery", "underscore", "backbone", "akpauth","akputils" ], 
		function($, _, Backbone, auth,utils) {
	 
	var gtkOpener=function(){
		
	}

	
	gtkOpener.prototype.open=function(url,canvas){
		
		
		
		
		$(".gtkViewer").show();
		
		//var iframe = document.getElementById('pdf-vwr-frame').contentWindow;
			//iframe.postMessage({data:url,pdfjsLoadAction: "complete" },"http://www.antkorp.in/"); //send the message and target URI
		
	}
	
	return new docOpener;
	 
	
});