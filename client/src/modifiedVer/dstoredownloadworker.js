//importScripts('js/Base64.js');

onconnect = function(e) {
	var self = e.ports[0];
	var bb = '', files = [], cnt = 0, d_run = false, obj, size = [], prcent = 0, creat_file = true, fileEntry, fs, pos = 0, writer;
	
	var BlobBuilderObj;
	self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
	self.BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder;
	//var ff = new WebKitBlobBuilder();

	//var BlobBuilderObj = new WebKitBlobBuilder();
	function errorHandler(e) {
		var msg = '';
		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				msg = 'QUOTA_EXCEEDED_ERR';
				break;
			case FileError.NOT_FOUND_ERR:
				msg = 'NOT_FOUND_ERR';
				break;
			case FileError.SECURITY_ERR:
				msg = 'SECURITY_ERR';
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				msg = 'INVALID_MODIFICATION_ERR';
				break;
			case FileError.INVALID_STATE_ERR:
				msg = 'INVALID_STATE_ERR';
				break;
			default:
				msg = 'Unknown Error';
				break;
		};
		self.postMessage(e.toString());
	}


	self.onmessage = function(e) {
		var data = e.data.obj;
		var clientid = e.data.obj.clientid;
		//	self.postMessage(e.data);
		switch(data.mesgtype) {
			case 'request' :
				files.push(data);
				size.push(e.data.siz);

				if (d_run == false) {
					self.postMessage({
						file : files[cnt],
						percent : 0
					});
					d_run = true;
					fs = webkitRequestFileSystemSync(TEMPORARY, size[cnt]);
				}
				break;
			case 'response':
				if (d_run == true) {
					var fname = files[cnt].fname;
					var filename = fname.substring(fname.lastIndexOf('/') + 1, fname.length);

					try {

						fileEntry = fs.root.getFile(filename, {
							create : creat_file
						});

						var byteArray = new Uint8Array(data.data.length);
						for (var i = 0; i < data.data.length; i++) {
							byteArray[i] = data.data.charCodeAt(i) & 0xff;
						}

						//BlobBuilderObj = new WebKitBlobBuilder();
						//BlobBuilderObj.append(byteArray.buffer);
						
						
						var blob=new Blob([byteArray.buffer]);
						
						if (!writer) {
							writer = fileEntry.createWriter();
							pos = 0;
						}
						writer.seek(pos);
						writer.write(blob);
						pos += data.data.length;
					} catch (e) {
						errorHandler(e);
					}

					creat_file = false;
					obj = {
						mesgtype : 'ack',
						clientid : clientid,
						request : 'read',
						service : 'dstore',
						cookie : data.cookie
					}

					prcent = (writer.length / size[cnt]).toFixed(2);

					if (data.data.length == 0) {
						obj = {
							mesgtype : 'save',
							fl : fileEntry.file(),
							//url : fileEntry.toURL(),
							//blob : BlobBuilderObj.getBlob(),
							dfname : files[cnt].fname
						}
						self.postMessage({
							file : obj,
							percent : 100
						});
						writer = undefined;
						creat_file = true;
						cnt += 1;
						fs = webkitRequestFileSystemSync(TEMPORARY, size[cnt]/*File Size*/);

						if (cnt < files.length) {
							self.postMessage({
								file : files[cnt],
								percent : prcent
							});
						} else {
							d_run = false, cnt = 0, files = [], size = [], pos = 0, writer = undefined;

						}
					} else {
						self.postMessage({
							file : obj,
							percent : prcent
						});
					}
				}
				break;
			case 'cancel':
			self.postMessage('cancel called');
			if(data.fname!=files[cnt].fname){
				var cfile;
				for(var c=0;c<files.length;c++)
				cfile=c;
				
				files.splice(cfile,1);
				self.postMessage("list item removed");
			}
			else{
				
				obj = {
					mesgtype : 'cancel',
					clientid : clientid,
					request : 'read',
					service : 'dstore',
					cookie : data.cookie
				}
				self.postMessage({
					file : obj,
					percent : 100
				});
				
				fileEntry.remove();
				writer = undefined;
				creat_file = true;
				cnt += 1;
				fs = webkitRequestFileSystemSync(TEMPORARY, size[cnt]/*File Size*/);

				if (cnt < files.length) {
					self.postMessage({
						file : files[cnt],
						percent : prcent
					});
				} else {
					d_run = false, cnt = 0, files = [], size = [], pos = 0, writer = undefined;

				}
				self.postMessage('current Item removed');
				}
				break;
		}

	}
}