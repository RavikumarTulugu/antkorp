/**
 * @author Raju K
 */



window.akpWS = function(statuschange,message,services) {		
								this.statusupdate = statuschange;
								this.sendMessage = message;
							
								this.clientidRecvd = false;
								this.svcstatus = {};
								this.regServices = {};
								var self = this;
								var url="ws://www.antkorp.in:443/services="
								for(var i=0;i<services.length;i++){
									url+=services[i];
								}
								this.regServices(services);
								
								if ("WebSocket" in window) {
									
									
									
									this.ws = new WebSocket(url);
									this.ws.binaryType = 'arraybuffer';
									this.ws.onopen = function(e) {
										self.conOpen(e)
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
							akpWS.prototype.close=function(){
								this.ws.close();
							}

							akpWS.prototype.conOpen = function(e) {
								this.statusupdate.call(this, {
									status : "opened",
									data : e
								});
								this.svcstatus["ngw"] = true;
							}

							akpWS.prototype.conError = function(e) {
								this.statusupdate.call(this, {
									status : "error",
									data : e
								});

							}
							akpWS.prototype.conClose = function(e) {
								this.statusupdate.call(this, {
									status : "closed",
									data : e
								});
							}
							akpWS.prototype.send = function(msg) {
								if (!this.regServices[msg.service])
									this.statusupdate.call(this, {
										status : "unreg_err",
										service : msg.service
									});
								else if (!this.svcstatus[msg.service])
									this.statusupdate.call(this, {
										status : "svc_err",
										service : msg.service
									})
								else
									this.sendBuffer(msg);
							}

							akpWS.prototype.sendBuffer = function(obj) {
								var buffer=this.toBuffer(obj);
								this.ws.send(buffer);
								return;

							}
							akpWS.prototype.set=function(){
								
							}
							
							akpWS.prototype.toBuffer=function(obj){
								var service = obj.service;
								delete obj.serivce;	
								var jsonstring = JSON.stringify(obj);
								var sendBuffer = new ArrayBuffer(jsonstring.length + 4 + 32);
								var dv 	       = new DataView(sendBuffer);
								if (service.length < 32) { for (var i = 0; i < (32 - service.length); i++) { service += ' ';} }  //fill space for missing chars
								for (var i = 0; i < service.length; i++) { dv.setUint8(i, service.charCodeAt(i)); }
								dv.setInt32(32, jsonstring.length);
								for (var i = 0; i < jsonstring.length; i++) { dv.setUint8(i + 36, jsonstring.charCodeAt(i)); }
								return sendBuffer;
							}
							
							akpWS.prototype.toJSON = function(buffer) {							
								var recvBuffer = buffer;
								var dv 	       = new DataView(recvBuffer);
								var service    = "";
								for (var i = 0; i < 32; i++) { service += String.fromCharCode(dv.getUint8(i)); }
								var svcmsgLen = dv.getInt32(32, false);
								var jsonstr = "";
								for (var i = 36; i < buffer.byteLength; i++) { jsonstr += String.fromCharCode(dv.getUint8(i)); }
								var obj;
								try{
								 obj = JSON.parse(jsonstr);
								 obj.service=service.toString().replace(/[\x00-\x1F\x80-\xFF]/g, "");
								}
								catch(e){
									console.error("NOT_JSON_DATA_Err: recieved data failed to parse");
									console.log(jsonstr + " " + service);
									return false;
								}
								
								return obj;

							}
							akpWS.prototype.handleMessage = function(e) {

								var msg = this.toJSON(e.data);
								if(!msg)
									return;
									
								
								if (!this.clientidRecvd) {
									
									this.clientidRecvd = true;
									this.statusupdate.call(this, {
										status : "clientRegistered",
									});

								} else if (msg.service == "ngw") {
									this.handleSvcStatus(msg);
								} else if (this.regServices[msg.service])
								// need to handle one more condition for
								// registered services.
								{
									this.sendMessage.call(this, msg);
								} else {
									console
											.error("Recieved message from unknown service");
								}
							}

							akpWS.prototype.handleSvcStatus = function(
									msg) {
								this.statusupdate.call(this, {
									status : "svcupdate",
									service : msg.service_name,
									status : msg.eventtype
								});
								if (msg.status == "service_up")
									this.svcstatus[msg.service_name] = true;
								else if (msg.status == "service_down")
									this.svcstatus[msg.service_name] = false;

							}
							akpWS.prototype.register = function(services) {
								for (svc in services) {
									this.svcstatus[services[svc]] = true;
									this.regServices[services[svc]] = true;
								}
							}
