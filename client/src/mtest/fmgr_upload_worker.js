/**
 * @author Rajuk
 */

var obj;
var createUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

var cancel_state = false, cnt = 0, rblob, start = 0, stop = 4096, guid, remainder, blkcount, blob, percent, en_blob, siz, obj, i, send_obj, reader, files = [], files_list, file_count, dname = [], nfile = true, p_run = false;
self.onmessage = function(e) {

	var data = e.data;
	var cmd = data.mesgtype;
	var cookie=data.cookie;

	switch (cmd) {
	case 'file_list':

		// self.postMessage(data.dname);

		dname.push(data.dname);
		files_list = data.files;
		files.push(data.files);

		// self.postMessage(files);
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
			var cfile;
			for ( var c = 0; c < files.length; c++) {
				if (files[c].name = data.fname)
					cfile = c;

			}
			files.splice(cfile, 1);
		} else {
			nfile = true;
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
			initializeProcess(true);

		}

		break;
	}

	function initializeProcess(cnt_inc) {
		if (!nfile)
			return;

		// self.postMessage("file initialized")
		i = 0;
		start = 0;
		stop = 4096;
		percent = 0;
		cnt = cnt_inc ? cnt + 1 : 0;
		p_run = true;

		if (cnt == files.length) {

			p_run = false;
			files = [];
			dname = [];

		} else {

			//guid = createUUID();
			guid=cookie;
			reminder = files[cnt].size % 4096;
			blkcount = Math.floor(files[cnt].size / 4096);
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

		if (i == blkcount) {
			stop = start;
			self.postMessage({
				obj : {
					mesgtype : 'complete',
					cookie:cookie
				},
				prct : 100
			});

			nfile = true;
		}
		reader = new FileReaderSync();

		// self.postMessage("reader created"+files.length);

		blob = files[cnt].slice(start, stop);
		// self.postMessage("file splitted");

		percent = files[cnt].size == 0 ? 100 : (stop / files[cnt].size) * 100;

		rblob = reader.readAsDataURL(blob);
		var lx = rblob.lastIndexOf(',');

		// self.postMessage("file readed")

		en_blob = (lx == 12) ? rblob.substring(lx + 1, rblob.length) : '';
		self.postMessage(blob);
		obj = {// json format
			mesgtype : "request",
			service : "fmgr",
			request : "write",
			cookie : guid,
			fname : dname[cnt],
			size : en_blob.length,
			data : en_blob
		};
		send_msg = {
			obj : obj,
			prct : percent
		};

		// self.postMessage("ready to send message")
		self.postMessage(send_msg);

		// self.postMessage("Message passed")
		start = stop;
		stop = stop + 4096;
		i++;
		if (files[cnt].size == 0) {
			initializeProcess(true);
		}

	}

}
