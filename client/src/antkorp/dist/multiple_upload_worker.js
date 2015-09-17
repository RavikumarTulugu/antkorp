onconnect = function(e) {
	var self = e.ports[0];
	// var obj;
	var createUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
				function(c) {
					var r = Math.random() * 16 | 0, v = c == 'x' ? r
							: (r & 0x3 | 0x8);
					return v.toString(16);
				});
	};

	var uploads = {},queue=false,uploadOrder;
	// self.postMessage("worker started");
	// cancel_state = false,
	// cnt = 0, rblob, start = 0, stop = 4096, guid, remainder, blkcount, blob,
	// percent, en_blob, siz, obj, i, send_obj, reader, files = [], files_list,
	// file_count, dname = [], nfile = true, p_run = false;
	self.onmessage = function(e) {
		// self.postMessage("worker got message");
		var data = e.data;
		var cmd = data.mesgtype;

		switch (cmd) {
		case 'file_list':
			// self.postMessage("I just got file");
			uploads[data.cookie] = data;
			initializeProcess(data.cookie);
			break;
		case 'ack':
			process(data.cookie);
			break;
		case 'cancel':

			var id = data.cookie;
			var obj = {// json format
				mesgtype : "cancel",
				service : "fmgr",
				request : "write",
				cookie : id,
				fname : uploads[id].dname
			};
			var send_msg = {
				obj : obj,
				prct : 0
			};
			self.postMessage(send_msg);
			delete uploads[id];

			// initializeProcess(true);

			break;
		}

		function initializeProcess(id) {
			// self.postMessage("file initialized");

			uploads[id]["i"] = 0;
			// self.postMessage(uploads[id]);
			uploads[id]["start"] = 0;
			uploads[id]["stop"] = 4096;
			uploads[id]["reminder"] = uploads[id].files.size % 4096;
			uploads[id]["blkcount"] = Math.floor(uploads[id].files.size / 4096);
			if (uploads[id].reminder != 0) {
				uploads[id].blkcount += 1;
			}
			// self.postMessage("I initialized all counters");
			process(id);

		}

		function process(id) {
			// self.postMessage("I am processing");
			var current = uploads[id];
			if (!current)
				return;

			if (current.i == (current.blkcount - 1) && current.reminder != 0) {
				current.stop = current.start + current.reminder;
			}

			// self.postMessage("process started")

			if (current.i == current.blkcount) {
				current.stop = current.start;
				self.postMessage({
					obj : {
						mesgtype : 'complete',
						cookie : id,
					},
					prct : 100
				});

			}
			var percent = current.files.size == 0 ? 100 : (current.stop / current.files.size);
			var en_blob = getDataFromChunk(current.files, current.start, current.stop);
			
			var obj = {// json format
				mesgtype : "request",
				service : "fmgr",
				request : "write",
				cookie : id,
				fname : current.dname,
				size : en_blob.length,
				data : en_blob
			};
			var send_msg = {
				obj : obj,
				prct : percent,
				lastByte:current.stop
			};

			// self.postMessage("ready to send message")
			self.postMessage(send_msg);

			if (!obj.size) {
				delete current;
				return;
			}
			// self.postMessage("Message passed")
			current.start = current.stop;
			current.stop = current.stop + 4096;
			current.i++;

		}
		
		
		
		function getDataFromChunk(file,start,stop){
			var reader = new FileReaderSync();

			// self.postMessage("reader created");

			var blob = file.slice(start, stop);
			// self.postMessage("file splitted");

			
			var rblob = reader.readAsDataURL(blob);
			var lx = rblob.lastIndexOf(',');

			// self.postMessage("file readed")

			return (lx == 12) ? rblob.substring(lx + 1, rblob.length)
					: '';
			// self.postMessage(blob);
		}

	}
	
	
	
}