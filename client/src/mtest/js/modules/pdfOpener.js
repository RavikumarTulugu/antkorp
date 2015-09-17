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