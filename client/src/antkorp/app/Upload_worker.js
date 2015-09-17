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


onconnect = function(e) {
	var self = e.ports[0];
	var createUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
				function(c) {
					var r = Math.random() * 16 | 0, v = c == 'x' ? r
							: (r & 0x3 | 0x8);
					return v.toString(16);
				});
	};
	
	
	var chunkSize = 255 * 1024, //max chunk size 255kb
	cancel_state = false, 
	cnt = 0, // index value of current uploading file in files[]
	
	start = 0, 
	stop = chunkSize, 
	
	guid,
	remainder, 
	
	percent,
	en_blob,
	
	chunksCount,  //number of chunks in file
	currentChunk, //current block uploading in file
	
	send_obj, //object to send as output
	obj,// original msg to out
	
	isNewFile = true, //is new file [bool]
	p_run = false, // is process running
	
	
	files = [], // files in queue to upload
	dname = [], //corresponding directory names
	uploadsCollection = [];

	self.onmessage = handleMessage;
		
		
		function handleMessage(e) {

		var data = e.data;
		var cmd = data.mesgtype;

		switch (cmd) {
		case 'file_list':

			// self.postMessage(data.dname);

			dname.push(data.dname);
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
				isNewFile = true;
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
			if (!isNewFile)
				return;

			// self.postMessage("file initialized")
			currentChunk = 0;
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
				chunksCount = Math.floor(files[cnt].size / chunkSize);
				if (reminder != 0) {
					chunksCount = chunksCount + 1;
				}

				process();
			}

		}

		function process() {

			if (!p_run)
				return;

			isNewFile = false;
			if (currentChunk == (chunksCount - 1) && reminder != 0) {
				stop = start + reminder;
			}

			// self.postMessage("process started")
			self.postMessage(currentChunk + " " + chunksCount);
			
			if (currentChunk == chunksCount) {
				//self.postMessage("file Completed")
				stop = start;
				sendComplete(cnt);
				isNewFile = true;
			}
			
			percent = getPercentage(files[cnt], stop);
			en_blob = getDataFromChunk(files[cnt], start, stop);
			
			// self.postMessage(en_blob.length);

			sendData(cnt,en_blob,percent);

			//self.postMessage("Message passed");
			
			start = stop;
			stop = stop + chunkSize;
			currentChunk++;

			if (files[cnt].size == 0) {
				initializeProcess(true);
			}

		}
		
		
		
		function sendData(index,data,percent){
			
			obj = {
					mesgtype : "request",
					service : "fmgr",
					request : "write",
					cookie : uploadsCollection[index],
					fname : dname[index],
					size : data.length,
					data : data,
					bytesleft:files[index].size-start, // remaining size to upload
				};
				send_msg = {
					obj : obj,
					prct : percent,
					lastByte : stop,
					filesize:files[index].size,
				};

				//self.postMessage("ready to send message")
				self.postMessage(send_msg);
			
		}
		
		
		function sendComplete(fileIndex){
			self.postMessage({
				obj : {
					mesgtype : 'complete',
					cookie : uploadsCollection[fileIndex],
				},
				prct : 100
			});
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

			var en_blob = (lx == 12) ? rblob.substring(lx + 1, rblob.length) : '';
			self.postMessage("file readed")
			return en_blob;
		}

	}
}