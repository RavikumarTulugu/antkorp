/**
 * @author Raju Konga
 */



$(function() {

	var dispatcher = new SharedWorker("worker.js");
	dispatcher.port.onmessage = function(e) {
		
		$("#canvasDiv").wPaint("draw",e.data)
		
	}
	dispatcher.port.start();
	// post a message to the shared web worker
	
	$("#canvasDiv").css({height:500,width:500,border:"1px solid green"}).wPaint({
		drawDown             : broadcast,             // function to call when start a draw
	    drawMove             : broadcast,             // function to call during a draw
	    drawUp               : broadcast,        
	})
	
	
	function broadcast(e,mode,event,args){
		
		 args.drawUp="";
		 args.drawMove="";
		 args.drawDown="";
		
		
		var msg={
				e:{pageX:e.pageX,pageY:e.pageY},
				mode:mode,
			event:event,
			args:args
		}
		
		
		dispatcher.port.postMessage({
			type : "broadcast",
			msg : msg
		});
	}
	
	

	
	
	
	
	
});
