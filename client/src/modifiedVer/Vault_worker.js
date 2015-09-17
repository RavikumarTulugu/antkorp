importScripts('js/Base64.js');

onconnect = function(e) {
	var self = e.ports[0];
	var obj;
	var createUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};

	var cnt = 0, rblob, start = 0, stop = 4096, guid, remainder, blkcount, blob, percent, en_blob, siz, obj, i, send_obj, reader, files = [], files_list, file_count, dname, nfile, p_run = false;
	self.onmessage = function(e) {
		//self.postMessage('Enters to the onmessage');
		var data = e.data;
		var cmd = data.mesgtype;
		var clientid = data.clientid;
		if (cmd == 'file_list') {
			dname = data.dname;
			files_list = data.files;
			for (var j = 0; j < data.files.length; j++)
				files.push(data.files[j]);

			//self.postMessage("file pushed");
			file_count = files.length;
			if (p_run == false) {
				cnt = 0, i = 0;
				start = 0;
				stop = 4096;
				guid = createUUID();
				//generating guid
				p_run = true;
				reminder = files[cnt].size % 4096;
				blkcount = Math.floor(files[cnt].size / 4096);
				if (reminder != 0) {
					blkcount = blkcount + 1;
				}
				process();
			}
		} else if (cmd == 'ack') {//&& data.cookie == guid
			process();
			if (nfile == true) {
				i = 0;
				start = 0;
				stop = 4096;
				percent = 0;
				cnt += 1;
				if (cnt == file_count) {
					p_run = false;
					files = [];

				}
				guid = createUUID();
				reminder = files[cnt].size % 4096;
				blkcount = Math.floor(files[cnt].size / 4096);
				if (reminder != 0) {
					blkcount = blkcount + 1;
				}
				process();
			}
		}

		function process() {
			//self.postMessage('upload started');
			if (p_run == true) {
				nfile = false;
				if (i == (blkcount - 1) && reminder != 0) {
					stop = start + reminder;
				}

				if (i == blkcount) {
					stop = start;
					self.postMessage({obj:{mesgtype:'complete'},prct:100});
					nfile = true;
				}
				reader = new FileReaderSync();

				blob = files[cnt].webkitSlice(start, stop);
				percent = (stop / files[cnt].size) * 100;
				//rblob = reader.readAsBinaryString(blob);
				rblob = reader.readAsDataURL(blob);
				var lx=rblob.lastIndexOf(',');
				//self.postMessage(lx);
				en_blob= lx==11 ? rblob.substring(lx+1,rblob.length) :'';//self.postMessage();
				//self.postMessage(en_blob)
				//var bytes = new Uint8Array(blob);
				//self.postMessage("bytes initialized");
				//self.postMessage('before:'+rblob.length)
				//en_blob = Base64.encode(rblob);
				
				//self.postMessage("encoded:"+en_blob.length);
				obj = {//json format
					clientid : clientid,
					mesgtype : "request",
					service : "fmgr",
					request : "write",
					cookie : guid,
					fname : dname + '/' + files[cnt].name,
					size : en_blob.length,
					data : en_blob
				};
				send_msg = {
					obj : obj,
					prct : percent
				};
				self.postMessage(send_msg);
				//self.postMessage('msg sent to UI');
				start = stop;
				stop = stop + 4096;
				i++;
			}
		}

	}
}