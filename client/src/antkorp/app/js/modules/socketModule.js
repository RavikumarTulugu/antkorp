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



define("socketModule",[],function() {

			/*
			 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 * Socket
			 * =======================================================================
			 */
		
	
	var Map = function(){
		this._mapList = {};
	}
	
	Map.prototype.setMessage = function(MsgObj){
		
		if(MsgObj.data.cookie){
			var MsgRef = new Message(MsgObj);
			this._mapList[MsgObj.data.cookie] = MsgRef;
			return MsgRef;
		}
		return false;
	}
	
	Map.prototype.handleResponse = function(response){
		var Msg = this._mapList[response.cookie];
		
		if(Msg){
			if(response.error){
				Msg.error(response);
			} else {
				Msg.success(response);
			}
			
			Msg.complete(response);
		}
	}
			
	var Message = function(options){
		
		this.data = options.data || "";
		this.successCallback = options.success || "";
		this.errorCallback = options.error || "";
		this.completeCallback = options.complete || "";
		this.readyState = 2;
		// 0 ==> not ready
		// 2 ==> ready
		
		var self = this;
		this.timer = setTimeout(function(){
			self.handleTimeout();
		},10*1000);
		
	}
	
	Message.prototype.handleTimeout = function(){
		var msg = {
				mesgtype : 'error',
				error : 'RequestTimeout',
				cookie: this.data.cookie,
				service:this.data.service,
		};
		
		this.error(msg);
	}
	
	Message.prototype.success = function(msg){
		if(!this.readyState)
			return false;
		
		if (typeof this.successCallback === 'function'){
			this.successCallback.call(this, msg);	
		}
		
		this.readyState = 2;
		clearTimeout(this.timer);
	}
	
	Message.prototype.error = function(msg){
		if(!this.readyState)
			return false;
		
		if (typeof this.errorCallback === 'function'){
			this.errorCallback.call(this, msg);	
		}
		
		this.readyState = 0;
		clearTimeout(this.timer);
	}
	
	Message.prototype.complete = function(msg){
		if (typeof this.completeCallback === 'function')
			this.completeCallback.call(this, msg);
		
		clearTimeout(this.timer);
	}
	
			
			
			

			var socketModule = function(options) {

				this.clientid = null;// For initializing
				this.clientidRecvd = false;
				this.svcstatus = {};
				this.regServices = {};
				this.respondTimer;
				
				//For HTTPS :443;
				//FOr HTTP : 8080;
				this.port = 8080;
				this.host = window.location.host;
				this.protocal = "wss://";
				this.serverAddress = this.protocal + this.host + ":" + this.port;
				// "ws://www.antkorp.in:443";
				this.serviceRequests = "/services=ngw,auth,fmgr,kons,rtc,calendar,tunneld";

			}
			socketModule.prototype = new Map;
			
			
			socketModule.prototype.init = function(statuschange// status msgs
			, message // message handler to deliver service msgs
			, handler // the object is to call
			) {
				var self = this;
				this.statusupdate = statuschange;// required
				this.sendMessage = message;// required
				this.handleObj = handler;// required

				if ("WebSocket" in window) {
					this.ws = new WebSocket(this.serverAddress
							+ this.serviceRequests);

					//console.log("connection issued");
					self.handleNotResponding();
					this.ws.binaryType = 'arraybuffer';
					this.ws.onopen = function(e) {

						//5 seconds  waiting for socket ready
						setTimeout(function() {
							self.conOpen(e);
						},  100);

					};
					this.ws.onerror = function(e) {
						self.conError(e)
					};
					this.ws.onclose = function(e) {
						self.conClose(e)
					};
					this.ws.onmessage = function(e) {
						self.handleMessage(e)
					};
				} else {
					this.statusupdate.call(this, {
						status : "notSupported",
					});
				}

			}

			// Testing XHR requests

			/*
			 * function reqListener () { console.log(this.responseText); };
			 * 
			 * var oReq = new XMLHttpRequest(); oReq.onload = reqListener;
			 * oReq.open("get", "http://www.antkorp.in:443/akorp.css", true);
			 * oReq.send();
			 * 
			 */
			socketModule.prototype.handleNotResponding = function() {
				/*
				 * 30 seconds to wait for response.
				 */
				var self = this;
				this.respondTimer = setTimeout(function() {
					self.statusupdate.call(self.handleObj, {
						status : "notResponding",
					});
				}, 30 * 1000)
			}
			socketModule.prototype._gotResponse = function() {
				clearTimeout(this.respondTimer);
			}
			socketModule.prototype.close = function(e) {
				this.ws.close();

			}

			socketModule.prototype.conOpen = function(e) {
				this.statusupdate.call(this.handleObj, {
					status : "opened",
					data : e
				});
				this.svcstatus["ngw"] = true;
				this._gotResponse();
			}

			socketModule.prototype.conError = function(e) {
				this.statusupdate.call(this.handleObj, {
					status : "error",
					data : e
				});
				this._gotResponse();

			}
			socketModule.prototype.conClose = function(e) {
				this.statusupdate.call(this.handleObj, {
					status : "closed",
					data : e
				});
				this._gotResponse();
			}
			socketModule.prototype.send = function(servReq) {
				/*
				 * Expecting request in format 
				 * {data : Data, success: function scs(){}, error : function() err(){}} 
				 */
				
				var msgObj = this.setMessage(servReq);
				var msg = servReq.data;
				
				
				if (!this.regServices[msg.service])
					this.statusupdate.call(this, {
						status : "unreg_err",
						service : msg.service
					})
				else if (!this.svcstatus[msg.service])
					this.statusupdate.call(this, {
						status : "svc_err",
						service : msg.service
					})
				else
					this.sendBuffer(msg);
				
				return msgObj;
			}

			socketModule.prototype.sendBuffer = function(obj) {
				// converting JSON string to arraybuffer
				if (typeof obj !== 'object') {
					console.error("Not in JSON format");
					return false;
				}
				
				//console.log(obj);

				var service = obj.service;

				
				
				delete obj.service;

				var jsonstring = JSON.stringify(obj);
				var sendBuffer = new ArrayBuffer(jsonstring.length + 4 + 32);
				var dv = new DataView(sendBuffer);
				// var service = svcName;
				if (service.length < 32) {
					for ( var i = 0; i < (32 - service.length); i++) {
						service += ' ';
					}
				}
				for ( var i = 0; i < service.length; i++) {
					dv.setUint8(i, service.charCodeAt(i));
				}
				dv.setInt32(32, jsonstring.length);
				for ( var i = 0; i < jsonstring.length; i++) {
					dv.setUint8(i + 36, jsonstring.charCodeAt(i));
				}
				// buffer contains "service,jsonstr"
				try {
					//if (this.ws.readystate == 1)// opened
						this.ws.send(sendBuffer);
					//else
						//console.log("cannot send msgs through connection.");

				} catch (e) {
					console.log("cannot send msgs through connection.");
					//console.log(e.message)
				}
				return;

			}
			socketModule.prototype.toJSON = function(buffer) {

				// converting Buffer to JSON
				// logger("msg recvd from server");
				var recvBuffer = buffer;
				var dv = new DataView(recvBuffer);
				var service = "";
				for ( var i = 0; i < 32; i++) {
					service += String.fromCharCode(dv.getUint8(i));
				}
				var svcmsgLen = dv.getInt32(32, false);
				var jsonstr = "";
				for ( var i = 36; i < buffer.byteLength; i++) {
					jsonstr += String.fromCharCode(dv.getUint8(i));
				}
				// console.log(jsonstr);
				var obj;
				try {
					obj = JSON.parse(jsonstr);
					obj.service = service.toString().replace(
							/[\x00-\x1F\x80-\xFF]/g, "");
				} catch (e) {
					try {
						obj = eval('(' + jsonstr + ')');
						obj.service = service.toString().replace(
								/[\x00-\x1F\x80-\xFF]/g, "");
					} catch (e) {
						console.error("NOT_JSON_DATA_Err: recieved data failed to parse");
						//console.log(jsonstr);
						return false;
					}
					// console.log(jsonstr + " " + service);
					// return false;
				}

				// logger(obj);

				return obj;

			}
			socketModule.prototype.handleMessage = function(e) {

				var msg = this.toJSON(e.data);
				if (!msg)
					return;

				if (!this.clientidRecvd) {
					//this.clientid = msg.clientid;
					this.clientidRecvd = true;
					this.statusupdate.call(this.handleObj, {
						status : "clientRegistered",
						data:msg,
					});

				} else if (msg.service == "ngw") {
					//messages form gatway
					
					this.handleSvcStatus.call(this, msg);
				} 
				else if (this.regServices[msg.service])	{
					/*
					 need to handle one more condition for
					 registered services.
					 */
					
					//mapping objects 
					this.handleResponse(msg);
					
					//general response
					this.sendMessage.apply(this.handleObj, [ msg ]);
				} else {
					console.error("Recieved message from unknown service");
				}
			}

			socketModule.prototype.handleSvcStatus = function(msg) {
				this.statusupdate.call(this.handleObj, {
					status : "svcupdate",
					service : msg.service_name,
					eventtype : msg.eventtype
				});

				if (msg.status == "service_up")
					this.svcstatus[msg.service_name] = true;
				else if (msg.status == "service_down")
					this.svcstatus[msg.service_name] = false;

			}
			socketModule.prototype.register = function(services) {
				for (svc in services) {
					this.svcstatus[services[svc]] = true;
					this.regServices[services[svc]] = true;
				}
			}

			return socketModule;

		});