//importScripts('js/Base64.js');

onconnect = function(e) {
	var self = e.ports[0];
	var obj;
	var createUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
				function(c) {
					var r = Math.random() * 16 | 0, v = c == 'x' ? r
							: (r & 0x3 | 0x8);
					return v.toString(16);
				});
	};
	var chunkSize = 8192, cancel_state = false, cnt = 0, rblob, start = 0, stop = chunkSize, guid, remainder, blkcount, blob, percent, en_blob, siz, obj, i, send_obj, reader, files = [],
	// files_list,
	file_count, dname = [], nfile = true, p_run = false, uploadsCollection = [];

	self.onmessage = function(e) {

		var data = e.data;
		var cmd = data.mesgtype;

		switch (cmd) {
		case 'file_list':

			// self.postMessage(data.dname);

			dname.push(data.dname);
			// files_list = data.files;
			files.push(data.files);
			uploadsCollection.push(data.cookie);

			// self.postMessage(uploadCollection);

			if (p_run == false) {

				initializeProcess(false);
			}
			break;
		case 'ack':
			process();
			initializeProcess(true);
			break;
		case 'cancel':

			if (files[cnt].name != data.fname) {
				removeFileFromUploadsList(data.fname);

			} else {
				nfile = true;
				cancelCurrentUpload();
				initializeProcess(true);

			}

			break;
		}

		function removeFileFromUploadsList(fname) {
			var cfile;
			for ( var c = 0; c < files.length; c++) {
				if (files[c].name = fname)
					cfile = c;

			}
			files.splice(cfile, 1);
		}

		function cancelCurrentUpload() {

			obj = {// json format
				mesgtype : "cancel",
				service : "fmgr",
				request : "write",
				cookie : guid,
				fname : dname[cnt]
			};
			send_msg = {
				obj : obj,
				prct : 0
			};
			self.postMessage(send_msg);
		}

		function initializeProcess(cnt_inc) {
			if (!nfile)
				return;

			// self.postMessage("file initialized")
			i = 0;
			start = 0;
			stop = chunkSize;
			percent = 0;
			cnt = cnt_inc ? cnt + 1 : 0;
			p_run = true;

			if (cnt == files.length) {

				p_run = false;
				files = [];
				dname = [];
				uploadsCollection = [];

			} else {

				guid = uploadsCollection[cnt]; // createUUID();
				reminder = files[cnt].size % chunkSize;
				blkcount = Math.floor(files[cnt].size / chunkSize);
				if (reminder != 0) {
					blkcount = blkcount + 1;
				}

				process();
			}

		}

		function process() {

			if (!p_run)
				return;

			nfile = false;
			if (i == (blkcount - 1) && reminder != 0) {
				stop = start + reminder;
			}

			// self.postMessage("process started")
			self.postMessage(i + " " + blkcount);
			if (i == blkcount) {
				self.postMessage("file Completed")
				stop = start;
				self.postMessage({
					obj : {
						mesgtype : 'complete',
						cookie : uploadsCollection[cnt],
					},
					prct : 100
				});

				nfile = true;
			}
			percent = getPercentage(files[cnt], stop);
			en_blob = getDataFromChunk(files[cnt], start, stop);
			// self.postMessage(en_blob.length);

			obj = {
				mesgtype : "request",
				service : "fmgr",
				request : "write",
				cookie : uploadsCollection[cnt],
				fname : dname[cnt],
				size : en_blob.length,
				data : en_blob,
				bytesleft:files[cnt].size-start, // remaining size to upload
			};
			send_msg = {
				obj : obj,
				prct : percent,
				lastByte : stop,
				filesize:files[cnt].size,
			};

			//self.postMessage("ready to send message")
			self.postMessage(send_msg);

			//self.postMessage("Message passed")
			start = stop;
			stop = stop + chunkSize;
			i++;

			if (files[cnt].size == 0) {
				initializeProcess(true);
			}

		}

		function getPercentage(file, stop) {

			return file.size == 0 ? 100 : (stop / file.size);
		}

		function getDataFromChunk(file, start, stop) {
			var reader = new FileReaderSync();

			// self.postMessage("reader created"+files.length);

			var blob = file.slice(start, stop);
			// self.postMessage("file splitted");

			var rblob = reader.readAsDataURL(blob);
			var lx = rblob.lastIndexOf(',');

			// self.postMessage(blob);

			var en_blob = (lx == 12) ? rblob.substring(lx + 1, rblob.length)
					: '';
			self.postMessage("file readed")
			return en_blob;
		}

	}
}