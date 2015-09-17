var connections = 0, ws, viewers = {};
var nextName = 0;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();

function getNextName() {

	return nextName++;
}

onconnect = function(e) {
	var port = e.ports[0];
	connections++;
	port._name = getNextName();
	port._data = {
		port : port,
		x : 0,
		y : 0,
	};
	viewers[port._name] = port._data;
	port.onmessage = getMessage;
	
}
function getMessage(e) {
	if (e.data === "start") {

		for (var viewer in viewers)
		viewers[viewer].port.postMessage("started connection: " + connections);

	} else if (e.data.type == "send") {
		viewers[e.target._name].port.postMessage("message : " + e.data.msg);
	} else if (e.data.type == "broadcast") {
		
		
		  
		  var obj={
				  e: e.data.msg.e,
				  event: e.data.msg.event,
				  args:e.data.msg.args
		  }
		for (var viewer in viewers)
		viewers[viewer].port.postMessage(obj);
	}

}