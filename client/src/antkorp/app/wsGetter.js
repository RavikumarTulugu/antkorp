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


var bb = '', files = [], cnt = 0, d_run = false, obj, size = [], prcent = 0, creat_file = true, fileEntry, fs, pos = 0, writer,fileList={};
var BlobBuilderObj;
self.requestFileSystemSync = self.webkitRequestFileSystemSync|| self.requestFileSystemSync;
self.BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder|| self.MozBlobBuilder;



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
	;
	self.postMessage(e.toString());
}

self.onmessage = function(e) {
	var data = e.data.obj;
	
	switch (data.mesgtype) {
	case 'request':
		fileList[data.cookie]=data;
		
		initialize(data.cookie);
		break;
	case 'response':
		sendMsg(data)
		break;
	case 'cancel':
		self.postMessage('cancel called');
		if (data.fname != files[cnt].fname) {
			var cfile;
			for ( var c = 0; c < files.length; c++)
				cfile = c;

			files.splice(cfile, 1);
			self.postMessage("list item removed");
		} else {

			obj = {
				mesgtype : 'cancel',

				request : 'read',
				service : 'fmgr',
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
			fs = webkitRequestFileSystemSync(TEMPORARY, size[cnt]);

			if (cnt < files.length) {
				self.postMessage({
					file : files[cnt],
					percent : prcent
				});
			} else {
				d_run = false, cnt = 0, files = [], size = [], pos = 0,
						writer = undefined;

			}
			self.postMessage('current Item removed');
		}
		break;
	}
	
	
	function initialize(id){
		var file=fileList[id];
		/*self.postMessage({
			file : file,
			percent : 0,
		});*/
		
		
		var fname=fileList[id]["fname"];
		fileList[id]["name"] = fname.substring(fname.lastIndexOf('/') + 1,fname.length);
		fileList[id]["fs"] = webkitRequestFileSystemSync(TEMPORARY, fileList[id].size);
		fileList[id]["isCreated"]=true;
		fileList[id]["fileEntry"] = fileList[id].fs.root.getFile(fileList[id]["name"], {create : fileList[id].isCreated});
		fileList[id]["pos"]=0;
		fileList[id]["writer"]=fileList[id].fileEntry.createWriter();
		
		var obj={
				service:"fmgr",
				mesgtype:"request",
				request:"read",
				fname:file["fname"],
				size:1024,
				cookie:id
		}
		
		//var nentry=file["fileEntry"].moveTo(file["fs"].root,file["name"]);
		self.postMessage({
			file : obj,
			percent : 0,
			url:file["fileEntry"].toURL()
		});
		self.postMessage('Item added');
	}
	function sendMsg(msg){
			var id=msg.cookie;
			var data=msg.data;
			var file=fileList[id];
			var fname = fileList[id].fname;
			var filename = fname.substring(fname.lastIndexOf('/') + 1,fname.length);
			var	writer = file.writer;
			var blob;
			try {	
				 blob= toBuffer(data)
					
				writer.seek(file.pos);		
				writer.write(blob);
				file.pos += data.length;
			} catch (e) {
				errorHandler(e);
			}

			
			obj = {
				mesgtype : 'ack',
				request : 'read',
				service : 'fmgr',
				cookie : id
			}

			prcent =0;//(writer.length / file.size).toFixed(2);

			if (data.length == 0) {
				//var nentry=file["fileEntry"].moveTo(file["fs"].root,file["name"]);
				obj = {
					mesgtype : 'complete',
					fl : file["fileEntry"].file(),
					url: file["fileEntry"].toURL(),
					dfname : file.fname,
					cookie:id
				}
				self.postMessage({
					file : obj,
					percent : 100,
					
				});


			} else {
				self.postMessage({
					file : obj,
					percent : prcent,
					chunk:blob
				});
			}
		
	}
	
	function toBuffer(data){
		var byteArray = new Uint8Array(data.length);
		for ( var i = 0; i < data.length; i++) {
			byteArray[i] = data.charCodeAt(i) & 0xff;
		}
		return new Blob([ byteArray]);
	}

}
