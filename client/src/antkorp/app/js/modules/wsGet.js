

/****************************************************************
 * Copyright (c) Neptunium Pvt Ltd., 2014.
 * Author: Neptunium Pvt Ltd..
 *
 * This unpublished material is proprietary to Neptunium Pvt Ltd..
 * All rights reserved. The methods and techniques described herein 
 * are considered trade secrets and/or confidential. Reproduction or 
 * distribution, in whole or in part, is forbidden except by express 
 * written permission of Neptunium.
 ****************************************************************/


/*
 * Websocket get
 */

var getManager = function() {
	this._maptable = {};
	var _self = this;
	this.worker = new Worker("wsGetter.js");
	this.worker.onmessage = function(e) {
		var down_data = e.data;
		if (!down_data.file) {
			//console.log(down_data);
		} else if (down_data.file.mesgtype == 'ack'
				|| down_data.file.mesgtype == 'request'
				|| down_data.file.mesgtype == 'cancel') {
			down_data.file.uid = akp_ws.handlers.akpauth.loginuserid;
			akp_ws.send({data:down_data.file});
			// console.log(down_data.file);
			if (down_data.file.mesgtype == "request") {
				var obj = _self.callGetter(down_data.file)

				if (obj.onstarted) {
					//console.log(down_data.url);
					obj.onstarted.call(_self, down_data.url);
				}
			} else if (down_data.file.mesgtype == "ack") {
				var obj = _self.callGetter(down_data.file)
				// console.log("started transfer");
				if (obj.onBlobRecieved) {
					// console.log(down_data.url);
					obj.onBlobRecieved.call(_self, down_data.chunk);
				}
			}

		} else if (down_data.file.mesgtype == 'complete') {

			// console.log(down_data.file.url);
			var obj = _self.callGetter(down_data.file)
			if (obj.oncomplete) {
				obj.oncomplete.call(_self, down_data.file.url,
						down_data.file.fl);
			}

		}
	}

	this.put = function(id, object) {
		this._maptable[id] = object;
	}
	this.callGetter = function(req) {
		return this._maptable[req.cookie];

	}
}

getManager.prototype.getEntry = function(file) {
	var unique = akp_ws.createUUID();
	file.cookie = unique;
	var entry = new wsGet(file);
	/*
	 * assume that file object like name,path,cookie
	 */

	this.put(unique, entry);
	this.postData({
		obj : file
	});
	return entry;
}
getManager.prototype.map = function(resp) {
	var entry = this.callGetter(resp),respdata;
	if(resp.error){
		//throw resp.error;
		return false;
	}else if (entry) {
		try {
			try{
				respdata = window.atob(resp.data);
			}catch(e){
				respdata = this.atob(resp.data);
			}
		
		} catch (e) {
			
			return false;

		}
		
		resp.data=respdata;
		
		this.postData({
			obj : resp
		});
		
	} 
}
getManager.prototype.postData = function(data) {

	this.worker.postMessage(data);
}


getManager.prototype.atob = function(input) {
	var keyStr = "ABCDEFGHIJKLMNOP" +

	"QRSTUVWXYZabcdef" +

	"ghijklmnopqrstuv" +

	"wxyz0123456789+/" +

	"=";

	var output = "";

	var chr1, chr2, chr3 = "";

	var enc1, enc2, enc3, enc4 = "";

	var i = 0;

	// remove all characters that are not A-Z, a-z, 0-9, +, /, or =

	var base64test = /[^A-Za-z0-9\+\/\=]/g;

	if (base64test.exec(input)) {

		alert("There were invalid base64 characters in the input text.\n" +

		"Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +

		"Expect errors in decoding.");

	}

	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	do {

		enc1 = keyStr.indexOf(input.charAt(i++));

		enc2 = keyStr.indexOf(input.charAt(i++));

		enc3 = keyStr.indexOf(input.charAt(i++));

		enc4 = keyStr.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);

		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);

		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {

			output = output + String.fromCharCode(chr2);

		}

		if (enc4 != 64) {

			output = output + String.fromCharCode(chr3);

		}

		chr1 = chr2 = chr3 = "";

		enc1 = enc2 = enc3 = enc4 = "";

	} while (i < input.length);

	return unescape(output);

}

var wsGet = function(file) {
	this.file = file;
	this.oncomplete = "";
}

var Getter = new getManager();