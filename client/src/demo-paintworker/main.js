/**
 * @author Raju Konga
 */



$(function() {

	var dispatcher = new SharedWorker("worker.js");
	dispatcher.port.onmessage = function(e) {
		
		redraw(e.data.cx,e.data.cy,e.data.cd);
		
	}
	dispatcher.port.start();
	// post a message to the shared web worker
	
	
	
	canvas=document.getElementById('canvas');
	 context = document.getElementById('canvas').getContext("2d");
	
	
	
	
	
	$('#canvas').mousedown(function(e){
		  var mouseX = e.pageX - this.offsetLeft;
		  var mouseY = e.pageY - this.offsetTop;
				
		  paint = true;
		  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
		  //redraw();
		});
	
	$('#canvas').mousemove(function(e){
		  if(paint){
		    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
		    //redraw();
		  }
		});
	
	
	$('#canvas').mouseup(function(e){
		  paint = false;
		});
	
	$('#canvas').mouseleave(function(e){
		  paint = false;
		});
	
	
	//var clickX = new Array();
	//var clickY = new Array();
	//var clickDrag = new Array();
	var paint;

	function addClick(x, y, dragging)
	{
		
		var msg={
				x:x,
				y:y,
				drag:dragging
		}
		
		
		dispatcher.port.postMessage({
			type : "broadcast",
			msg : msg
		});
	  //clickX.push(x);
	  //clickY.push(y);
	  //clickDrag.push(dragging);
	}
	
	
	function redraw(clickX,clickY,clickDrag){
		  canvas.width = canvas.width; // Clears the canvas
		  
		  context.strokeStyle = "#000";
		  context.lineJoin = "round";
		  context.lineWidth = 5;
					
		  for(var i=0; i < clickX.length; i++)
		  {		
		    context.beginPath();
		    if(clickDrag[i] && i){
		      context.moveTo(clickX[i-1], clickY[i-1]);
		     }else{
		       context.moveTo(clickX[i]-1, clickY[i]);
		     }
		     context.lineTo(clickX[i], clickY[i]);
		     context.closePath();
		     context.stroke();
		  }
		}
	
	
});
