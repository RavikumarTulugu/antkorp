//importScripts('js/Base64.js');

onconnect = function(e) {
	var self = e.ports[0], runComments = true;
	var bb = '', files = [], cnt = 0, d_run = false, obj, size = [], prcent = 0, creat_file = true, fileEntry, fs, pos = 0, writer;
	var BlobBuilderObj;
	self.requestFileSystemSync = self.webkitRequestFileSystemSync
			|| self.requestFileSystemSync;
	self.BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder
			|| self.MozBlobBuilder;

	// var ff = new WebKitBlobBuilder();
	// var BlobBuilderObj = new WebKitBlobBuilder();

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
		}

		self.postMessage(msg);
	}

	function clearFileSystem() {
		trace("request to clear file system");
		try {
			var fs = webkitRequestFileSystemSync(TEMPORARY, 1024);
			trace("file system requested");
			var dirReader = fs.root.createReader();
			trace("writer created for reading entries");

			dirReader.readEntries(function(entries) {

				trace("reading entries in file system");
				for ( var i = 0, entry; entry = entries[i]; ++i) {
					if (entry.isDirectory) {
						entry.removeRecursively(function() {
						}, errorHandler);
					} else {
						entry.remove(function() {
						}, errorHandler);
					}
				}
				trace("file system cleared");
			}, errorHandler);
		} catch (e) {
			trace(e.message);
		}
	}

	function trace(msg) {
		if (runComments) {
			self.postMessage(msg)
		}
	}

	clearFileSystem();

	self.onmessage = function(e) {
		var data = e.data.obj;
		// trace("Message " + data.mesgtype );

		switch (data.mesgtype) {
		case 'request':
			files.push(data);
			size.push(e.data.siz);
			trace("new download request");

			if (d_run == true)
				return;

			trace("process not running");

			d_run = true;
			fs = webkitRequestFileSystemSync(TEMPORARY, size[cnt]);

			handleDownloadReq();

			break;
		case 'response':
			handleResponse(data)
			break;
		case 'cancel':

			cancelDownload();
			break;
		case "clearFS":
			clearFileSystem();
			break;

		default:
			trace("invalid Message Type");
		}

		function handleResponse(data) {
			if (d_run != true)
				return;

			trace("appending response data ");
			var fname = files[cnt].fname;
			var filename = pathToName(fname);

			try {
				var blob = dataToBlob(data.data);

				fileEntry = getFileandAppendBlob(filename, blob);
				trace("file updated");
				pos += data.data.length;

			} catch (e) {
				errorHandler(e);
			}

			creat_file = false;

			if (data.data.length == 0) {
				fileDownloadCompleted(fileEntry);
			} else {
				sendAck();
			}

		}

		function sendAck() {
			trace("got data and sending ack");
			obj = {
				mesgtype : 'ack',
				request : 'read',
				service : 'fmgr',
				cookie : data.cookie
			}

			var prcent = getPercentage(size[cnt]);
			self.postMessage({
				file : obj,
				percent : prcent,
				progressed : pos,
			});
		}

		function sendCancel() {
			trace("cancel recieved");
			obj = {
				mesgtype : 'cancel',
				request : 'read',
				service : 'fmgr',
				cookie : data.cookie
			}
			self.postMessage({
				file : obj,
				percent : 0
			});
		}

		function pathToName(path) {
			return path.substring(path.lastIndexOf('/') + 1, path.length);
		}

		function getPercentage(size) {
			trace(writer.length + " / " + size);

			return (writer.length / size);

		}

		function fileDownloadCompleted(fileEntry) {
			trace("File download completed");
			obj = {
				mesgtype : 'save',
				fl : fileEntry.file(),
				dfname : files[cnt].fname
			}
			self.postMessage({
				file : obj,
				percent : 1
			});
			reset();
			newDownload();
		}

		function getFileandAppendBlob(filename, blob) {

			trace("data append to file");
			var fileEntry = fs.root.getFile(filename, {
				create : creat_file
			});

			if (!writer) {
				writer = fileEntry.createWriter();
				pos = 0;
			}
			writer.seek(pos);
			writer.write(blob);
			return fileEntry;
		}

		function dataToBlob(data) {
			var byteArray = new Uint8Array(data.length);
			for ( var i = 0; i < data.length; i++) {
				byteArray[i] = data.charCodeAt(i) & 0xff;
			}

			return blob = new Blob([ byteArray.buffer ]);
		}

		function cancelDownload() {
			trace('cancel called');
			if (data.fname != pathToName(files[cnt].fname)) {
				for ( var c = 0; c < files.length; c++) {
					if (pathToName(files[c].fname) == data.fname) {
						files.splice(c, 1);
						break;
					}
				}

				trace("removed from downloads list");
			} else {
				sendCancel();
				fileEntry.remove(function(){
					trace("Entry removed successfully");
				});
				prcent = 0;
				reset();
				newDownload();

			}
		}
		function reset() {

			writer = undefined;
			creat_file = true;
			cnt += 1;
			fs = webkitRequestFileSystemSync(TEMPORARY, size[cnt]);
			prcent = 0;
		}

		function isFileExists(filename) {
			trace(filename);
			try {
				var fs = webkitRequestFileSystemSync(TEMPORARY, 0);
				var fileEntry = fs.root.getFile(filename, {
					create : false
				});

				trace("Checking is already file created.");
			} catch (e) {
				trace(e.message);
			}

			if (fileEntry)
				return fileEntry;
			else 
				return false;

			var writer = fileEntry.createWriter();

			trace("checking sizes of the given file and existing files");
			if (writer.length == size[cnt])
				return fileEntry;

			return false;
		}

		function newDownload() {
			if (cnt < files.length) {
				handleDownloadReq();
				trace("still files in the list");
			} else {
				trace("list downloads completed, clearing all lists");
				d_run = false, cnt = 0, files = [], size = [], pos = 0,
						writer = undefined;

			}
		}

		function handleDownloadReq() {
			trace("requested to download file");
			var fname = files[cnt].fname;
			var filename = pathToName(fname);
			trace("checking for file in filesystem");
			var existedEntry = isFileExists(filename);
			
			//

			/*if (existedEntry) {

				trace("File already in filesystem");
				fileDownloadCompleted(existedEntry);
				return;

			} else {
				self.postMessage({
					file : files[cnt],
					percent : 0
				});
			}*/
			
			if(existedEntry)
				{
				trace("removing existed entry...");
				existedEntry.remove(function(){
					trace("existed file removed.");
				});
				}
			
			
			self.postMessage({
				file : files[cnt],
				percent : 0
			});
			
		}

	}
}