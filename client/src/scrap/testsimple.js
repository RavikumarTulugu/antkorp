$(function() {
	var ws;
	var auth_done = false; 
	var clientid = 0;
	var timerSet = false;

	ws = new WebSocket("ws://bldsvrub:9980");
	ws.binaryType = "arraybuffer";
	ws.onopen = function() {}
	ws.onmessage = function(e) { var o = recvSvcMessage(e); console.log(o); if (!timerSet) { setTimeout(send_data, 3); timerSet = true; }
	ws.onerror = function(e) { alert('ws Error Message:' + e.message); }
	ws.onclose = function() { alert('ws closed'); }

	//hand over a json object to send it to the server
	function sendSvcMessage(obj, svcName)
	{
		var jsonstring = JSON.stringify(obj);
		var sendBuffer = new ArrayBuffer(jsonstring.length + 4 + 12);
		var dv 		   = new DataView(sendBuffer);
		console.log("sendsvcmsg clientid: " + clientid);
		dv.setInt32(0, clientid);
		var service    = svcName;
		if (service.length < 12) { for (var i = 0; i < (12 - service.length); i++) { service += ' ';} }  //fill space for missing chars
		for (var i = 0; i < service.length; i++) { dv.setUint8(i+4, service.charCodeAt(i)); }
		for (var i = 0; i < jsonstring.length; i++) { dv.setUint8(i+16, jsonstring.charCodeAt(i)); }
		ws.send(sendBuffer);
		return;
	}

	function recvSvcMessage(e)
	{
		var recvBuffer = e.data;
		var dv 		   = new DataView(recvBuffer);
		clientid       = dv.getInt32(0, false);
		console.log("recvd clientid:" + clientid);
		var service    = "";
		for (var i = 4; i < 16; i++) { service += String.fromCharCode(dv.getUint8(i)); }
		var jsonstr = "";
		for (var i = 16; i < e.data.byteLength; i++) { jsonstr += String.fromCharCode(dv.getUint8(i)); }
		console.log(jsonstr);
		var obj = JSON.parse(jsonstr);
		return obj;
	}
	function send_data() { sendSvcMessage({ request : "ping", cookie : "abcdefgh"}, "simple");} } 
});
