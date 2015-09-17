define("akp", [ "require","jquery","akpauth", "../lib/jquery.noty", "../lib/bottomRight", "../lib/default"], function(require,$,akpauth) {

console.log("akp.js loaded");
console.log(akpauth);
var auth = require("akpauth");
console.log(auth)
if(!auth)return;
	

	var init = true;
	var clientid;
	var akp = function() {

		this.services = {
			fmgr : true,
			dstore : true,
			kons : true,
			rtc : true,
			auth : true,
			ngw : true
		}

		//this.ws = new WebSocket("ws://www.antkorp.in:443");
		this.ws = new WebSocket("ws://bldsvrub1304:443");
		this.ws.binaryType = 'arraybuffer';
		this.ws.onopen = this.conOpen;
		this.ws.onerror = this.conError;
		this.ws.onclose = this.conClose;
		this.ws.onmessage = this.handleMessage;
	}
	akp.prototype.conError = function(e) {
		alert('ws Error Message:' + e.message);
	}
	akp.prototype.createUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
	akp.prototype.conOpen = function() {

		$('span#home').parent('li').addClass('node_active');

		noty({
			layout : 'bottomRight',
			theme : 'default',
			type : 'success',
			text : 'Welcome to antkorp!',
			timeout : 2000
		});

	}
	akp.prototype.conClose = function() {
		console.log("Websocket connection closed");
		var noty1 = noty({
			layout : 'bottomRight',
			theme : 'default',
			type : 'error',
			text : 'Unable to connect to the server temporarily. Please try after some time!',
			timeout : 3000
		});

		$("body").hide();

		alert('Unable to connect to the server temporarily. Please try after some time!');

	}
	akp.prototype.send = function(obj) {
		console.log(obj);
		var service = obj.service;
		delete obj.service;
		delete obj.clientid;

		if (this.services[service]) {
			var jsonstring = JSON.stringify(obj);
			var sendBuffer = new ArrayBuffer(jsonstring.length + 4 + 12);
			var dv = new DataView(sendBuffer);

			dv.setInt32(0, clientid);

			if (service.length < 12) {
				for (var i = 0; i < (12 - service.length); i++) {
					service += ' ';
				}
			}//fill space for missing chars
			for (var i = 0; i < service.length; i++) {
				dv.setUint8(i + 4, service.charCodeAt(i));
			}
			for (var i = 0; i < jsonstring.length; i++) {
				dv.setUint8(i + 16, jsonstring.charCodeAt(i));
			}
			this.ws.send(sendBuffer);

			return;
		} else {
			noty({
				layout : 'bottomRight',
				theme : 'default',
				type : 'error',
				text : 'we are sorry, one of our services is down at this moment.',
				timeout : 5000
			});
		}

	}
	var recieveMessage = function(e) {

		var recvBuffer = e.data;
		var dv = new DataView(recvBuffer);
		clientid = dv.getInt32(0, false);

		var service = new String();
		for (var i = 4; i < 16; i++) {
			service += String.fromCharCode(dv.getUint8(i));
		}
		var jsonstr = "";
		for (var i = 16; i < e.data.byteLength; i++) {
			jsonstr += String.fromCharCode(dv.getUint8(i));
		}

		var obj = eval('(' + jsonstr.toString() + ')');
		//JSON.parse(jsonstr.toString());

		service = service.toString().replace(/[\x00-\x1F\x80-\xFF]/g, "");
		obj.service = service.substring(0, service.indexOf(' ')) || service;

		obj.clientid = clientid;
		return obj;

	}
	akp.prototype.handleMessage = function(e) {
		var recvd = recieveMessage(e);

		if (init) {
			clientid = recvd.clientid;

			/*if (!loginsuccess) {
			 //loginuser(fbusername);
			 }
			 //FIXME: desable on facebook login enabled.*/
			init = false;

		} else if (recvd.service) {

			var serv = $.trim(recvd.service);

			switch(serv) {
				case 'fmgr':
					handleFmgrMessage(recvd);
					break;
				case 'dstore':
					handleDstoreMessage(recvd);
					break;
				case 'kons':
					handleKonsMessage(recvd);
					break;
				case 'rtc':
					handleRtcMessage(recvd);
					break;
				case 'auth':
					auth.handleMessage(recvd);
					break;
				case 'ngw':
					handleServiceStatus(recvd);
					break;
				default:
					//if no service is specified then print it in console log.
					console.log("Service not recognised:");
					console.log(recvd);
			}
		}

	}
	akp.prototype.handleServiceStatus = function(resp) {
		var svcname;
		var svcstatus;

		if (resp.eventtype == "service_up") {
			svcstatus = true;
		} else {
			svcstatus = false;
		}

		if (resp.service_name == "fmgr") {
			svcname = "Vault";
		} else if (resp.service_name == "dstore") {
			svcname = "Dstore";
		} else if (resp.service_name == "kons") {
			svcname = "Konverations";
		} else if (resp.service_name == "rtc") {
			svcname = "Communication"
		} else if (resp.service_name == "auth") {
			svcname = "Authentication"
		}

		var stts = svcstatus ? "up" : "down";
		var stype = svcstatus ? "success" : "error";
		noty({
			layout : 'bottomRight',
			theme : 'default',
			type : stype,
			text : svcname + " service is " + stts,
			timeout : 5000
		});

		services[resp.service_name] = svcstatus;

	}
	//exports.akp= new akp();

	var akp_ws = new akp();
	return akp_ws;

})
