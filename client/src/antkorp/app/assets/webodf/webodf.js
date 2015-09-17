// Input 0
var webodf_version="0.4.2-1639-g2472188";
// Input 1
function Runtime(){}Runtime.prototype.getVariable=function(h){};Runtime.prototype.toJson=function(h){};Runtime.prototype.fromJson=function(h){};Runtime.prototype.byteArrayFromString=function(h,k){};Runtime.prototype.byteArrayToString=function(h,k){};Runtime.prototype.read=function(h,k,f,q){};Runtime.prototype.readFile=function(h,k,f){};Runtime.prototype.readFileSync=function(h,k){};Runtime.prototype.loadXML=function(h,k){};Runtime.prototype.writeFile=function(h,k,f){};
Runtime.prototype.isFile=function(h,k){};Runtime.prototype.getFileSize=function(h,k){};Runtime.prototype.deleteFile=function(h,k){};Runtime.prototype.log=function(h,k){};Runtime.prototype.setTimeout=function(h,k){};Runtime.prototype.clearTimeout=function(h){};Runtime.prototype.libraryPaths=function(){};Runtime.prototype.currentDirectory=function(){};Runtime.prototype.setCurrentDirectory=function(h){};Runtime.prototype.type=function(){};Runtime.prototype.getDOMImplementation=function(){};
Runtime.prototype.parseXML=function(h){};Runtime.prototype.exit=function(h){};Runtime.prototype.getWindow=function(){};Runtime.prototype.assert=function(h,k,f){};var IS_COMPILED_CODE=!0;
Runtime.byteArrayToString=function(h,k){function f(f){var c="",m,r=f.length;for(m=0;m<r;m+=1)c+=String.fromCharCode(f[m]&255);return c}function q(f){var c="",m,r=f.length,d=[],e,a,b,g;for(m=0;m<r;m+=1)e=f[m],128>e?d.push(e):(m+=1,a=f[m],194<=e&&224>e?d.push((e&31)<<6|a&63):(m+=1,b=f[m],224<=e&&240>e?d.push((e&15)<<12|(a&63)<<6|b&63):(m+=1,g=f[m],240<=e&&245>e&&(e=(e&7)<<18|(a&63)<<12|(b&63)<<6|g&63,e-=65536,d.push((e>>10)+55296,(e&1023)+56320))))),1E3===d.length&&(c+=String.fromCharCode.apply(null,
d),d.length=0);return c+String.fromCharCode.apply(null,d)}var p;"utf8"===k?p=q(h):("binary"!==k&&this.log("Unsupported encoding: "+k),p=f(h));return p};Runtime.getVariable=function(h){try{return eval(h)}catch(k){}};Runtime.toJson=function(h){return JSON.stringify(h)};Runtime.fromJson=function(h){return JSON.parse(h)};Runtime.getFunctionName=function(h){return void 0===h.name?(h=/function\s+(\w+)/.exec(h))&&h[1]:h.name};
function BrowserRuntime(h){function k(d){var a=d.length,b,g,l=0;for(b=0;b<a;b+=1)g=d.charCodeAt(b),l+=1+(128<g)+(2048<g),55040<g&&57344>g&&(l+=1,b+=1);return l}function f(d,a,b){var g=d.length,l,c;a=new Uint8Array(new ArrayBuffer(a));b?(a[0]=239,a[1]=187,a[2]=191,c=3):c=0;for(b=0;b<g;b+=1)l=d.charCodeAt(b),128>l?(a[c]=l,c+=1):2048>l?(a[c]=192|l>>>6,a[c+1]=128|l&63,c+=2):55040>=l||57344<=l?(a[c]=224|l>>>12&15,a[c+1]=128|l>>>6&63,a[c+2]=128|l&63,c+=3):(b+=1,l=(l-55296<<10|d.charCodeAt(b)-56320)+65536,
a[c]=240|l>>>18&7,a[c+1]=128|l>>>12&63,a[c+2]=128|l>>>6&63,a[c+3]=128|l&63,c+=4);return a}function q(d){var a=d.length,b=new Uint8Array(new ArrayBuffer(a)),g;for(g=0;g<a;g+=1)b[g]=d.charCodeAt(g)&255;return b}function p(d,a){var b,g,l;void 0!==a?l=d:a=d;h?(g=h.ownerDocument,l&&(b=g.createElement("span"),b.className=l,b.appendChild(g.createTextNode(l)),h.appendChild(b),h.appendChild(g.createTextNode(" "))),b=g.createElement("span"),0<a.length&&"<"===a[0]?b.innerHTML=a:b.appendChild(g.createTextNode(a)),
h.appendChild(b),h.appendChild(g.createElement("br"))):console&&console.log(a);"alert"===l&&alert(a)}function n(e,a,b){if(0!==b.status||b.responseText)if(200===b.status||0===b.status){if(b.response&&"string"!==typeof b.response)"binary"===a?(b=b.response,b=new Uint8Array(b)):b=String(b.response);else if("binary"===a)if(null!==b.responseBody&&"undefined"!==String(typeof VBArray)){b=(new VBArray(b.responseBody)).toArray();var g=b.length,l=new Uint8Array(new ArrayBuffer(g));for(a=0;a<g;a+=1)l[a]=b[a];
b=l}else{(a=b.getResponseHeader("Content-Length"))&&(a=parseInt(a,10));if(a&&a!==b.responseText.length)a:{var g=b.responseText,l=!1,c=k(g);if("number"===typeof a){if(a!==c&&a!==c+3){g=void 0;break a}l=c+3===a;c=a}g=f(g,c,l)}void 0===g&&(g=q(b.responseText));b=g}else b=b.responseText;d[e]=b;e={err:null,data:b}}else e={err:b.responseText||b.statusText,data:null};else e={err:"File "+e+" is empty.",data:null};return e}function c(d,a,b){var g=new XMLHttpRequest;g.open("GET",d,b);g.overrideMimeType&&("binary"!==
a?g.overrideMimeType("text/plain; charset="+a):g.overrideMimeType("text/plain; charset=x-user-defined"));return g}function m(e,a,b){function g(){var g;4===l.readyState&&(g=n(e,a,l),b(g.err,g.data))}if(d.hasOwnProperty(e))b(null,d[e]);else{var l=c(e,a,!0);l.onreadystatechange=g;try{l.send(null)}catch(f){b(f.message,null)}}}var r=this,d={};this.byteArrayFromString=function(d,a){var b;"utf8"===a?b=f(d,k(d),!1):("binary"!==a&&r.log("unknown encoding: "+a),b=q(d));return b};this.byteArrayToString=Runtime.byteArrayToString;
this.getVariable=Runtime.getVariable;this.fromJson=Runtime.fromJson;this.toJson=Runtime.toJson;this.readFile=m;this.read=function(d,a,b,g){m(d,"binary",function(d,e){var c=null;if(e){if("string"===typeof e)throw"This should not happen.";c=e.subarray(a,a+b)}g(d,c)})};this.readFileSync=function(d,a){var b=c(d,a,!1),g;try{b.send(null);g=n(d,a,b);if(g.err)throw g.err;if(null===g.data)throw"No data read from "+d+".";}catch(l){throw l;}return g.data};this.writeFile=function(e,a,b){d[e]=a;var g=new XMLHttpRequest,
l;g.open("PUT",e,!0);g.onreadystatechange=function(){4===g.readyState&&(0!==g.status||g.responseText?200<=g.status&&300>g.status||0===g.status?b(null):b("Status "+String(g.status)+": "+g.responseText||g.statusText):b("File "+e+" is empty."))};l=a.buffer&&!g.sendAsBinary?a.buffer:r.byteArrayToString(a,"binary");try{g.sendAsBinary?g.sendAsBinary(l):g.send(l)}catch(c){r.log("HUH? "+c+" "+a),b(c.message)}};this.deleteFile=function(e,a){delete d[e];var b=new XMLHttpRequest;b.open("DELETE",e,!0);b.onreadystatechange=
function(){4===b.readyState&&(200>b.status&&300<=b.status?a(b.responseText):a(null))};b.send(null)};this.loadXML=function(d,a){var b=new XMLHttpRequest;b.open("GET",d,!0);b.overrideMimeType&&b.overrideMimeType("text/xml");b.onreadystatechange=function(){4===b.readyState&&(0!==b.status||b.responseText?200===b.status||0===b.status?a(null,b.responseXML):a(b.responseText,null):a("File "+d+" is empty.",null))};try{b.send(null)}catch(g){a(g.message,null)}};this.isFile=function(d,a){r.getFileSize(d,function(b){a(-1!==
b)})};this.getFileSize=function(e,a){if(d.hasOwnProperty(e)&&"string"!==typeof d[e])a(d[e].length);else{var b=new XMLHttpRequest;b.open("HEAD",e,!0);b.onreadystatechange=function(){if(4===b.readyState){var g=b.getResponseHeader("Content-Length");g?a(parseInt(g,10)):m(e,"binary",function(b,g){b?a(-1):a(g.length)})}};b.send(null)}};this.log=p;this.assert=function(d,a,b){if(!d)throw p("alert","ASSERTION FAILED:\n"+a),b&&b(),a;};this.setTimeout=function(d,a){return setTimeout(function(){d()},a)};this.clearTimeout=
function(d){clearTimeout(d)};this.libraryPaths=function(){return["lib"]};this.setCurrentDirectory=function(){};this.currentDirectory=function(){return""};this.type=function(){return"BrowserRuntime"};this.getDOMImplementation=function(){return window.document.implementation};this.parseXML=function(d){return(new DOMParser).parseFromString(d,"text/xml")};this.exit=function(d){p("Calling exit with code "+String(d)+", but exit() is not implemented.")};this.getWindow=function(){return window}}
function NodeJSRuntime(){function h(c){var d=c.length,e,a=new Uint8Array(new ArrayBuffer(d));for(e=0;e<d;e+=1)a[e]=c[e];return a}function k(c,d,e){function a(a,g){if(a)return e(a,null);if(!g)return e("No data for "+c+".",null);if("string"===typeof g)return e(a,g);e(a,h(g))}c=p.resolve(n,c);"binary"!==d?q.readFile(c,d,a):q.readFile(c,null,a)}var f=this,q=require("fs"),p=require("path"),n="",c,m;this.byteArrayFromString=function(c,d){var e=new Buffer(c,d),a,b=e.length,g=new Uint8Array(new ArrayBuffer(b));
for(a=0;a<b;a+=1)g[a]=e[a];return g};this.byteArrayToString=Runtime.byteArrayToString;this.getVariable=Runtime.getVariable;this.fromJson=Runtime.fromJson;this.toJson=Runtime.toJson;this.readFile=k;this.loadXML=function(c,d){k(c,"utf-8",function(e,a){if(e)return d(e,null);if(!a)return d("No data for "+c+".",null);d(null,f.parseXML(a))})};this.writeFile=function(c,d,e){d=new Buffer(d);c=p.resolve(n,c);q.writeFile(c,d,"binary",function(a){e(a||null)})};this.deleteFile=function(c,d){c=p.resolve(n,c);
q.unlink(c,d)};this.read=function(c,d,e,a){c=p.resolve(n,c);q.open(c,"r+",666,function(b,g){if(b)a(b,null);else{var l=new Buffer(e);q.read(g,l,0,e,d,function(b){q.close(g);a(b,h(l))})}})};this.readFileSync=function(c,d){var e;e=q.readFileSync(c,"binary"===d?null:d);if(null===e)throw"File "+c+" could not be read.";"binary"===d&&(e=h(e));return e};this.isFile=function(c,d){c=p.resolve(n,c);q.stat(c,function(c,a){d(!c&&a.isFile())})};this.getFileSize=function(c,d){c=p.resolve(n,c);q.stat(c,function(c,
a){c?d(-1):d(a.size)})};this.log=function(c,d){var e;void 0!==d?e=c:d=c;"alert"===e&&process.stderr.write("\n!!!!! ALERT !!!!!\n");process.stderr.write(d+"\n");"alert"===e&&process.stderr.write("!!!!! ALERT !!!!!\n")};this.assert=function(c,d,e){c||(process.stderr.write("ASSERTION FAILED: "+d),e&&e())};this.setTimeout=function(c,d){return setTimeout(function(){c()},d)};this.clearTimeout=function(c){clearTimeout(c)};this.libraryPaths=function(){return[__dirname]};this.setCurrentDirectory=function(c){n=
c};this.currentDirectory=function(){return n};this.type=function(){return"NodeJSRuntime"};this.getDOMImplementation=function(){return m};this.parseXML=function(f){return c.parseFromString(f,"text/xml")};this.exit=process.exit;this.getWindow=function(){return null};c=new (require("xmldom").DOMParser);m=f.parseXML("<a/>").implementation}
function RhinoRuntime(){function h(c,f){var d;void 0!==f?d=c:f=c;"alert"===d&&print("\n!!!!! ALERT !!!!!");print(f);"alert"===d&&print("!!!!! ALERT !!!!!")}var k=this,f={},q=f.javax.xml.parsers.DocumentBuilderFactory.newInstance(),p,n,c="";q.setValidating(!1);q.setNamespaceAware(!0);q.setExpandEntityReferences(!1);q.setSchema(null);n=f.org.xml.sax.EntityResolver({resolveEntity:function(c,r){var d=new f.java.io.FileReader(r);return new f.org.xml.sax.InputSource(d)}});p=q.newDocumentBuilder();p.setEntityResolver(n);
this.byteArrayFromString=function(c,f){var d,e=c.length,a=new Uint8Array(new ArrayBuffer(e));for(d=0;d<e;d+=1)a[d]=c.charCodeAt(d)&255;return a};this.byteArrayToString=Runtime.byteArrayToString;this.getVariable=Runtime.getVariable;this.fromJson=Runtime.fromJson;this.toJson=Runtime.toJson;this.loadXML=function(c,r){var d=new f.java.io.File(c),e=null;try{e=p.parse(d)}catch(a){return print(a),r(a,null)}r(null,e)};this.readFile=function(m,r,d){c&&(m=c+"/"+m);var e=new f.java.io.File(m),a="binary"===r?
"latin1":r;e.isFile()?((m=readFile(m,a))&&"binary"===r&&(m=k.byteArrayFromString(m,"binary")),d(null,m)):d(m+" is not a file.",null)};this.writeFile=function(m,r,d){c&&(m=c+"/"+m);m=new f.java.io.FileOutputStream(m);var e,a=r.length;for(e=0;e<a;e+=1)m.write(r[e]);m.close();d(null)};this.deleteFile=function(m,r){c&&(m=c+"/"+m);var d=new f.java.io.File(m),e=m+Math.random(),e=new f.java.io.File(e);d.rename(e)?(e.deleteOnExit(),r(null)):r("Could not delete "+m)};this.read=function(m,r,d,e){c&&(m=c+"/"+
m);var a;a=m;var b="binary";(new f.java.io.File(a)).isFile()?("binary"===b&&(b="latin1"),a=readFile(a,b)):a=null;a?e(null,this.byteArrayFromString(a.substring(r,r+d),"binary")):e("Cannot read "+m,null)};this.readFileSync=function(c,f){if(!f)return"";var d=readFile(c,f);if(null===d)throw"File could not be read.";return d};this.isFile=function(m,r){c&&(m=c+"/"+m);var d=new f.java.io.File(m);r(d.isFile())};this.getFileSize=function(m,r){c&&(m=c+"/"+m);var d=new f.java.io.File(m);r(d.length())};this.log=
h;this.assert=function(c,f,d){c||(h("alert","ASSERTION FAILED: "+f),d&&d())};this.setTimeout=function(c){c();return 0};this.clearTimeout=function(){};this.libraryPaths=function(){return["lib"]};this.setCurrentDirectory=function(f){c=f};this.currentDirectory=function(){return c};this.type=function(){return"RhinoRuntime"};this.getDOMImplementation=function(){return p.getDOMImplementation()};this.parseXML=function(c){c=new f.java.io.StringReader(c);c=new f.org.xml.sax.InputSource(c);return p.parse(c)};
this.exit=quit;this.getWindow=function(){return null}}Runtime.create=function(){return"undefined"!==String(typeof window)?new BrowserRuntime(window.document.getElementById("logoutput")):"undefined"!==String(typeof require)?new NodeJSRuntime:new RhinoRuntime};var runtime=Runtime.create(),core={},gui={},xmldom={},odf={},ops={};
(function(){function h(c,f){var r=c+"/manifest.json",d,e;if(!n.hasOwnProperty(r)){try{d=runtime.readFileSync(r,"utf-8")}catch(a){console.log(String(a));return}d=JSON.parse(d);for(e in d)d.hasOwnProperty(e)&&(f[e]={dir:c,deps:d[e]});n[r]=1}}function k(c,f,r){var d=f[c].deps,e={};r[c]=e;d.forEach(function(a){e[a]=1});d.forEach(function(a){r[a]||k(a,f,r)});d.forEach(function(a){Object.keys(r[a]).forEach(function(a){e[a]=1})})}function f(c,f){function r(a,b){var g,d=f[a];if(-1===e.indexOf(a)&&-1===b.indexOf(a)){b.push(a);
for(g=0;g<c.length;g+=1)d[c[g]]&&r(c[g],b);b.pop();e.push(a)}}var d,e=[];for(d=0;d<c.length;d+=1)r(c[d],[]);return e}function q(c,f){for(var r=0;r<c.length&&void 0!==f[r];)null!==f[r]&&(eval(f[r]),f[r]=null),r+=1}var p={},n={};runtime.loadClass=function(c){if(!IS_COMPILED_CODE){var m=c.replace(".","/")+".js";if(!n.hasOwnProperty(m)){if(!(0<Object.keys(p).length)){var r=runtime.libraryPaths(),m={},d;runtime.currentDirectory()&&h(runtime.currentDirectory(),m);for(d=0;d<r.length;d+=1)h(r[d],m);var e;
d={};for(e in m)m.hasOwnProperty(e)&&k(e,m,d);for(e in m)m.hasOwnProperty(e)&&(r=Object.keys(d[e]),m[e].deps=f(r,d),m[e].deps.push(e));p=m}e=c.replace(".","/")+".js";c=[];e=p[e].deps;for(m=0;m<e.length;m+=1)n.hasOwnProperty(e[m])||c.push(e[m]);e=[];e.length=c.length;for(m=c.length-1;0<=m;m-=1)n[c[m]]=1,void 0===e[m]&&(r=c[m],r=p[r].dir+"/"+r,d=runtime.readFileSync(r,"utf-8"),d+="\n//# sourceURL="+r,d+="\n//@ sourceURL="+r,e[m]=d);q(c,e)}}}})();
(function(){var h=function(h){return h};runtime.getTranslator=function(){return h};runtime.setTranslator=function(k){h=k};runtime.tr=function(k){var f=h(k);return f&&"string"===String(typeof f)?f:k}})();
(function(h){function k(f){if(f.length){var h=f[0];runtime.readFile(h,"utf8",function(k,n){function c(){var d;(d=eval(r))&&runtime.exit(d)}var m="",r=n;-1!==h.indexOf("/")&&(m=h.substring(0,h.indexOf("/")));runtime.setCurrentDirectory(m);k?(runtime.log(k),runtime.exit(1)):null===r?(runtime.log("No code found for "+h),runtime.exit(1)):c.apply(null,f)})}}h=h?Array.prototype.slice.call(h):[];"NodeJSRuntime"===runtime.type()?k(process.argv.slice(2)):"RhinoRuntime"===runtime.type()?k(h):k(h.slice(1))})("undefined"!==
String(typeof arguments)&&arguments);
// Input 2
core.Async=function(){this.forEach=function(h,k,f){function q(m){c!==n&&(m?(c=n,f(m)):(c+=1,c===n&&f(null)))}var p,n=h.length,c=0;for(p=0;p<n;p+=1)k(h[p],q)};this.destroyAll=function(h,k){function f(q,p){if(p)k(p);else if(q<h.length)h[q](function(h){f(q+1,h)});else k()}f(0,void 0)}};
// Input 3
function makeBase64(){function h(a){var b,g=a.length,d=new Uint8Array(new ArrayBuffer(g));for(b=0;b<g;b+=1)d[b]=a.charCodeAt(b)&255;return d}function k(a){var b,g="",d,c=a.length-2;for(d=0;d<c;d+=3)b=a[d]<<16|a[d+1]<<8|a[d+2],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b>>>18],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b>>>12&63],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b>>>6&63],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b&
63];d===c+1?(b=a[d]<<4,g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b>>>6],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b&63],g+="=="):d===c&&(b=a[d]<<10|a[d+1]<<2,g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b>>>12],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b>>>6&63],g+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[b&63],g+="=");return g}function f(a){a=a.replace(/[^A-Za-z0-9+\/]+/g,
"");var b=a.length,g=new Uint8Array(new ArrayBuffer(3*b)),d=a.length%4,c=0,e,f;for(e=0;e<b;e+=4)f=(l[a.charAt(e)]||0)<<18|(l[a.charAt(e+1)]||0)<<12|(l[a.charAt(e+2)]||0)<<6|(l[a.charAt(e+3)]||0),g[c]=f>>16,g[c+1]=f>>8&255,g[c+2]=f&255,c+=3;b=3*b-[0,0,2,1][d];return g.subarray(0,b)}function q(a){var b,g,d=a.length,c=0,l=new Uint8Array(new ArrayBuffer(3*d));for(b=0;b<d;b+=1)g=a[b],128>g?l[c++]=g:(2048>g?l[c++]=192|g>>>6:(l[c++]=224|g>>>12&15,l[c++]=128|g>>>6&63),l[c++]=128|g&63);return l.subarray(0,
c)}function p(a){var b,g,d,c,l=a.length,e=new Uint8Array(new ArrayBuffer(l)),f=0;for(b=0;b<l;b+=1)g=a[b],128>g?e[f++]=g:(b+=1,d=a[b],224>g?e[f++]=(g&31)<<6|d&63:(b+=1,c=a[b],e[f++]=(g&15)<<12|(d&63)<<6|c&63));return e.subarray(0,f)}function n(a){return k(h(a))}function c(a){return String.fromCharCode.apply(String,f(a))}function m(a){return p(h(a))}function r(a){a=p(a);for(var b="",g=0;g<a.length;)b+=String.fromCharCode.apply(String,a.subarray(g,g+45E3)),g+=45E3;return b}function d(a,b,g){var d,c,
l,e="";for(l=b;l<g;l+=1)b=a.charCodeAt(l)&255,128>b?e+=String.fromCharCode(b):(l+=1,d=a.charCodeAt(l)&255,224>b?e+=String.fromCharCode((b&31)<<6|d&63):(l+=1,c=a.charCodeAt(l)&255,e+=String.fromCharCode((b&15)<<12|(d&63)<<6|c&63)));return e}function e(a,b){function g(){var e=l+1E5;e>a.length&&(e=a.length);c+=d(a,l,e);l=e;e=l===a.length;b(c,e)&&!e&&runtime.setTimeout(g,0)}var c="",l=0;1E5>a.length?b(d(a,0,a.length),!0):("string"!==typeof a&&(a=a.slice()),g())}function a(a){return q(h(a))}function b(a){return String.fromCharCode.apply(String,
q(a))}function g(a){return String.fromCharCode.apply(String,q(h(a)))}var l=function(a){var b={},g,d;g=0;for(d=a.length;g<d;g+=1)b[a.charAt(g)]=g;return b}("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"),u,x,w=runtime.getWindow(),y,v;w&&w.btoa?(y=w.btoa,u=function(a){return y(g(a))}):(y=n,u=function(b){return k(a(b))});w&&w.atob?(v=w.atob,x=function(a){a=v(a);return d(a,0,a.length)}):(v=c,x=function(a){return r(f(a))});core.Base64=function(){this.convertByteArrayToBase64=this.convertUTF8ArrayToBase64=
k;this.convertBase64ToByteArray=this.convertBase64ToUTF8Array=f;this.convertUTF16ArrayToByteArray=this.convertUTF16ArrayToUTF8Array=q;this.convertByteArrayToUTF16Array=this.convertUTF8ArrayToUTF16Array=p;this.convertUTF8StringToBase64=n;this.convertBase64ToUTF8String=c;this.convertUTF8StringToUTF16Array=m;this.convertByteArrayToUTF16String=this.convertUTF8ArrayToUTF16String=r;this.convertUTF8StringToUTF16String=e;this.convertUTF16StringToByteArray=this.convertUTF16StringToUTF8Array=a;this.convertUTF16ArrayToUTF8String=
b;this.convertUTF16StringToUTF8String=g;this.convertUTF16StringToBase64=u;this.convertBase64ToUTF16String=x;this.fromBase64=c;this.toBase64=n;this.atob=v;this.btoa=y;this.utob=g;this.btou=e;this.encode=u;this.encodeURI=function(a){return u(a).replace(/[+\/]/g,function(a){return"+"===a?"-":"_"}).replace(/\\=+$/,"")};this.decode=function(a){return x(a.replace(/[\-_]/g,function(a){return"-"===a?"+":"/"}))};return this};return core.Base64}core.Base64=makeBase64();
// Input 4
core.ByteArray=function(h){this.pos=0;this.data=h;this.readUInt32LE=function(){this.pos+=4;var h=this.data,f=this.pos;return h[--f]<<24|h[--f]<<16|h[--f]<<8|h[--f]};this.readUInt16LE=function(){this.pos+=2;var h=this.data,f=this.pos;return h[--f]<<8|h[--f]}};
// Input 5
core.ByteArrayWriter=function(h){function k(c){c>p-q&&(p=Math.max(2*p,q+c),c=new Uint8Array(new ArrayBuffer(p)),c.set(n),n=c)}var f=this,q=0,p=1024,n=new Uint8Array(new ArrayBuffer(p));this.appendByteArrayWriter=function(c){f.appendByteArray(c.getByteArray())};this.appendByteArray=function(c){var f=c.length;k(f);n.set(c,q);q+=f};this.appendArray=function(c){var f=c.length;k(f);n.set(c,q);q+=f};this.appendUInt16LE=function(c){f.appendArray([c&255,c>>8&255])};this.appendUInt32LE=function(c){f.appendArray([c&
255,c>>8&255,c>>16&255,c>>24&255])};this.appendString=function(c){f.appendByteArray(runtime.byteArrayFromString(c,h))};this.getLength=function(){return q};this.getByteArray=function(){var c=new Uint8Array(new ArrayBuffer(q));c.set(n.subarray(0,q));return c}};
// Input 6
core.CSSUnits=function(){var h=this,k={"in":1,cm:2.54,mm:25.4,pt:72,pc:12};this.convert=function(f,h,p){return f*k[p]/k[h]};this.convertMeasure=function(f,k){var p,n;f&&k?(p=parseFloat(f),n=f.replace(p.toString(),""),p=h.convert(p,n,k).toString()):p="";return p};this.getUnits=function(f){return f.substr(f.length-2,f.length)}};
// Input 7
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
(function(){function h(){var f,h,p,n,c;void 0===k&&(c=(f=runtime.getWindow())&&f.document,k={rangeBCRIgnoresElementBCR:!1,unscaledRangeClientRects:!1},c&&(n=c.createElement("div"),n.style.position="absolute",n.style.left="-99999px",n.style.transform="scale(2)",n.style["-webkit-transform"]="scale(2)",h=c.createElement("div"),n.appendChild(h),c.body.appendChild(n),f=c.createRange(),f.selectNode(h),k.rangeBCRIgnoresElementBCR=0===f.getClientRects().length,h.appendChild(c.createTextNode("Rect transform test")),
h=h.getBoundingClientRect(),p=f.getBoundingClientRect(),k.unscaledRangeClientRects=2<Math.abs(h.height-p.height),f.detach(),c.body.removeChild(n),f=Object.keys(k).map(function(c){return c+":"+String(k[c])}).join(", "),runtime.log("Detected browser quirks - "+f)));return k}var k;core.DomUtils=function(){function f(a,b){for(var g=0,d;a.parentNode!==b;)runtime.assert(null!==a.parentNode,"parent is null"),a=a.parentNode;for(d=b.firstChild;d!==a;)g+=1,d=d.nextSibling;return g}function k(a,b){return 0>=
a.compareBoundaryPoints(Range.START_TO_START,b)&&0<=a.compareBoundaryPoints(Range.END_TO_END,b)}function p(a,b){return 0>=a.compareBoundaryPoints(Range.END_TO_START,b)&&0<=a.compareBoundaryPoints(Range.START_TO_END,b)}function n(a,b){var g=null;a.nodeType===Node.TEXT_NODE&&(0===a.length?(a.parentNode.removeChild(a),b.nodeType===Node.TEXT_NODE&&(g=b)):(b.nodeType===Node.TEXT_NODE&&(a.appendData(b.data),b.parentNode.removeChild(b)),g=a));return g}function c(a){for(var b=a.parentNode;a.firstChild;)b.insertBefore(a.firstChild,
a);b.removeChild(a);return b}function m(a,b){for(var g=a.parentNode,d=a.firstChild,e;d;)e=d.nextSibling,m(d,b),d=e;b(a)&&(g=c(a));return g}function r(a,b){return a===b||Boolean(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_CONTAINED_BY)}function d(a,b,g){Object.keys(b).forEach(function(c){var e=c.split(":"),f=e[1],r=g(e[0]),e=b[c];"object"===typeof e&&Object.keys(e).length?(c=r?a.getElementsByTagNameNS(r,f)[0]||a.ownerDocument.createElementNS(r,c):a.getElementsByTagName(f)[0]||a.ownerDocument.createElement(c),
a.appendChild(c),d(c,e,g)):r&&a.setAttributeNS(r,c,String(e))})}var e=null;this.splitBoundaries=function(a){var b,g=[],d,c,e;if(a.startContainer.nodeType===Node.TEXT_NODE||a.endContainer.nodeType===Node.TEXT_NODE){d=a.endContainer;c=a.endContainer.nodeType!==Node.TEXT_NODE?a.endOffset===a.endContainer.childNodes.length:!1;e=a.endOffset;b=a.endContainer;if(e<b.childNodes.length)for(b=b.childNodes.item(e),e=0;b.firstChild;)b=b.firstChild;else for(;b.lastChild;)b=b.lastChild,e=b.nodeType===Node.TEXT_NODE?
b.textContent.length:b.childNodes.length;b===d&&(d=null);a.setEnd(b,e);e=a.endContainer;0!==a.endOffset&&e.nodeType===Node.TEXT_NODE&&(b=e,a.endOffset!==b.length&&(g.push(b.splitText(a.endOffset)),g.push(b)));e=a.startContainer;0!==a.startOffset&&e.nodeType===Node.TEXT_NODE&&(b=e,a.startOffset!==b.length&&(e=b.splitText(a.startOffset),g.push(b),g.push(e),a.setStart(e,0)));if(null!==d){for(e=a.endContainer;e.parentNode&&e.parentNode!==d;)e=e.parentNode;c=c?d.childNodes.length:f(e,d);a.setEnd(d,c)}}return g};
this.containsRange=k;this.rangesIntersect=p;this.getNodesInRange=function(a,b){for(var g=[],d=a.commonAncestorContainer,c,e=a.startContainer.ownerDocument.createTreeWalker(d.nodeType===Node.TEXT_NODE?d.parentNode:d,NodeFilter.SHOW_ALL,b,!1),d=e.currentNode=a.startContainer;d;){c=b(d);if(c===NodeFilter.FILTER_ACCEPT)g.push(d);else if(c===NodeFilter.FILTER_REJECT)break;d=d.parentNode}g.reverse();for(d=e.nextNode();d;)g.push(d),d=e.nextNode();return g};this.normalizeTextNodes=function(a){a&&a.nextSibling&&
(a=n(a,a.nextSibling));a&&a.previousSibling&&n(a.previousSibling,a)};this.rangeContainsNode=function(a,b){var g=b.ownerDocument.createRange(),d=b.ownerDocument.createRange(),c;g.setStart(a.startContainer,a.startOffset);g.setEnd(a.endContainer,a.endOffset);d.selectNodeContents(b);c=k(g,d);g.detach();d.detach();return c};this.mergeIntoParent=c;this.removeUnwantedNodes=m;this.getElementsByTagNameNS=function(a,b,g){var d=[];a=a.getElementsByTagNameNS(b,g);d.length=g=a.length;for(b=0;b<g;b+=1)d[b]=a.item(b);
return d};this.rangeIntersectsNode=function(a,b){var g=b.ownerDocument.createRange(),d;g.selectNodeContents(b);d=p(a,g);g.detach();return d};this.containsNode=function(a,b){return a===b||a.contains(b)};this.comparePoints=function(a,b,g,d){if(a===g)return d-b;var c=a.compareDocumentPosition(g);2===c?c=-1:4===c?c=1:10===c?(b=f(a,g),c=b<d?1:-1):(d=f(g,a),c=d<b?-1:1);return c};this.adaptRangeDifferenceToZoomLevel=function(a,b){return h().unscaledRangeClientRects?a:a/b};this.getBoundingClientRect=function(a){var b=
a.ownerDocument,g=h();if((!1===g.unscaledRangeClientRects||g.rangeBCRIgnoresElementBCR)&&a.nodeType===Node.ELEMENT_NODE)return a.getBoundingClientRect();var d;e?d=e:e=d=b.createRange();b=d;b.selectNode(a);return b.getBoundingClientRect()};this.mapKeyValObjOntoNode=function(a,b,g){Object.keys(b).forEach(function(d){var c=d.split(":"),e=c[1],c=g(c[0]),f=b[d];c?(e=a.getElementsByTagNameNS(c,e)[0],e||(e=a.ownerDocument.createElementNS(c,d),a.appendChild(e)),e.textContent=f):runtime.log("Key ignored: "+
d)})};this.removeKeyElementsFromNode=function(a,b,g){b.forEach(function(b){var d=b.split(":"),c=d[1];(d=g(d[0]))?(c=a.getElementsByTagNameNS(d,c)[0])?c.parentNode.removeChild(c):runtime.log("Element for "+b+" not found."):runtime.log("Property Name ignored: "+b)})};this.getKeyValRepresentationOfNode=function(a,b){for(var g={},d=a.firstElementChild,c;d;){if(c=b(d.namespaceURI))g[c+":"+d.localName]=d.textContent;d=d.nextElementSibling}return g};this.mapObjOntoNode=d;(function(a){var b,d;d=runtime.getWindow();
null!==d&&(b=d.navigator.appVersion.toLowerCase(),d=-1===b.indexOf("chrome")&&(-1!==b.indexOf("applewebkit")||-1!==b.indexOf("safari")),b=b.indexOf("msie"),d||b)&&(a.containsNode=r)})(this)};return core.DomUtils})();
// Input 8
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
core.EventNotifier=function(h){var k={};this.emit=function(f,h){var p,n;runtime.assert(k.hasOwnProperty(f),'unknown event fired "'+f+'"');n=k[f];for(p=0;p<n.length;p+=1)n[p](h)};this.subscribe=function(f,h){runtime.assert(k.hasOwnProperty(f),'tried to subscribe to unknown event "'+f+'"');k[f].push(h);runtime.log('event "'+f+'" subscribed.')};this.unsubscribe=function(f,h){var p;runtime.assert(k.hasOwnProperty(f),'tried to unsubscribe from unknown event "'+f+'"');p=k[f].indexOf(h);runtime.assert(-1!==
p,'tried to unsubscribe unknown callback from event "'+f+'"');-1!==p&&k[f].splice(p,1);runtime.log('event "'+f+'" unsubscribed.')};(function(){var f,q;for(f=0;f<h.length;f+=1)q=h[f],runtime.assert(!k.hasOwnProperty(q),'Duplicated event ids: "'+q+'" registered more than once.'),k[q]=[]})()};
// Input 9
/*

 Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
core.LoopWatchDog=function(h,k){var f=Date.now(),q=0;this.check=function(){var p;if(h&&(p=Date.now(),p-f>h))throw runtime.log("alert","watchdog timeout"),"timeout!";if(0<k&&(q+=1,q>k))throw runtime.log("alert","watchdog loop overflow"),"loop overflow";}};
// Input 10
core.PositionIterator=function(h,k,f,q){function p(){this.acceptNode=function(a){return!a||a.nodeType===b&&0===a.length?u:l}}function n(a){this.acceptNode=function(d){return!d||d.nodeType===b&&0===d.length?u:a.acceptNode(d)}}function c(){var a=d.currentNode,c=a.nodeType;e=c===b?a.length-1:c===g?1:0}function m(){if(null===d.previousSibling()){if(!d.parentNode()||d.currentNode===h)return d.firstChild(),!1;e=0}else c();return!0}var r=this,d,e,a,b=Node.TEXT_NODE,g=Node.ELEMENT_NODE,l=NodeFilter.FILTER_ACCEPT,
u=NodeFilter.FILTER_REJECT;this.nextPosition=function(){var a=d.currentNode,c=a.nodeType;if(a===h)return!1;if(0===e&&c===g)null===d.firstChild()&&(e=1);else if(c===b&&e+1<a.length)e+=1;else if(null!==d.nextSibling())e=0;else if(d.parentNode())e=1;else return!1;return!0};this.previousPosition=function(){var a=!0,g=d.currentNode;0===e?a=m():g.nodeType===b?e-=1:null!==d.lastChild()?c():g===h?a=!1:e=0;return a};this.previousNode=m;this.container=function(){var a=d.currentNode,g=a.nodeType;0===e&&g!==
b&&(a=a.parentNode);return a};this.rightNode=function(){var c=d.currentNode,f=c.nodeType;if(f===b&&e===c.length)for(c=c.nextSibling;c&&a(c)!==l;)c=c.nextSibling;else f===g&&1===e&&(c=null);return c};this.leftNode=function(){var b=d.currentNode;if(0===e)for(b=b.previousSibling;b&&a(b)!==l;)b=b.previousSibling;else if(b.nodeType===g)for(b=b.lastChild;b&&a(b)!==l;)b=b.previousSibling;return b};this.getCurrentNode=function(){return d.currentNode};this.unfilteredDomOffset=function(){if(d.currentNode.nodeType===
b)return e;for(var a=0,g=d.currentNode,g=1===e?g.lastChild:g.previousSibling;g;)a+=1,g=g.previousSibling;return a};this.getPreviousSibling=function(){var a=d.currentNode,b=d.previousSibling();d.currentNode=a;return b};this.getNextSibling=function(){var a=d.currentNode,b=d.nextSibling();d.currentNode=a;return b};this.setUnfilteredPosition=function(g,c){var f,m;runtime.assert(null!==g&&void 0!==g,"PositionIterator.setUnfilteredPosition called without container");d.currentNode=g;if(g.nodeType===b)return e=
c,runtime.assert(c<=g.length,"Error in setPosition: "+c+" > "+g.length),runtime.assert(0<=c,"Error in setPosition: "+c+" < 0"),c===g.length&&(d.nextSibling()?e=0:d.parentNode()?e=1:runtime.assert(!1,"Error in setUnfilteredPosition: position not valid.")),!0;f=a(g);for(m=g.parentNode;m&&m!==h&&f===l;)f=a(m),f!==l&&(d.currentNode=m),m=m.parentNode;c<g.childNodes.length&&f!==NodeFilter.FILTER_REJECT?(d.currentNode=g.childNodes.item(c),f=a(d.currentNode),e=0):e=1;f===NodeFilter.FILTER_REJECT&&(e=1);if(f!==
l)return r.nextPosition();runtime.assert(a(d.currentNode)===l,"PositionIterater.setUnfilteredPosition call resulted in an non-visible node being set");return!0};this.moveToEnd=function(){d.currentNode=h;e=1};this.moveToEndOfNode=function(a){a.nodeType===b?r.setUnfilteredPosition(a,a.length):(d.currentNode=a,e=1)};this.getNodeFilter=function(){return a};a=(f?new n(f):new p).acceptNode;a.acceptNode=a;k=k||4294967295;runtime.assert(h.nodeType!==Node.TEXT_NODE,"Internet Explorer doesn't allow tree walker roots to be text nodes");
d=h.ownerDocument.createTreeWalker(h,k,a,q);e=0;null===d.firstChild()&&(e=1)};
// Input 11
core.zip_HuftNode=function(){this.n=this.b=this.e=0;this.t=null};core.zip_HuftList=function(){this.list=this.next=null};
core.RawInflate=function(){function h(a,b,g,d,c,e){this.BMAX=16;this.N_MAX=288;this.status=0;this.root=null;this.m=0;var l=Array(this.BMAX+1),f,r,m,h,n,s,k,p=Array(this.BMAX+1),q,v,u,C=new core.zip_HuftNode,B=Array(this.BMAX);h=Array(this.N_MAX);var z,t=Array(this.BMAX+1),T,I,x;x=this.root=null;for(n=0;n<l.length;n++)l[n]=0;for(n=0;n<p.length;n++)p[n]=0;for(n=0;n<B.length;n++)B[n]=null;for(n=0;n<h.length;n++)h[n]=0;for(n=0;n<t.length;n++)t[n]=0;f=256<b?a[256]:this.BMAX;q=a;v=0;n=b;do l[q[v]]++,v++;
while(0<--n);if(l[0]===b)this.root=null,this.status=this.m=0;else{for(s=1;s<=this.BMAX&&0===l[s];s++);k=s;e<s&&(e=s);for(n=this.BMAX;0!==n&&0===l[n];n--);m=n;e>n&&(e=n);for(T=1<<s;s<n;s++,T<<=1)if(T-=l[s],0>T){this.status=2;this.m=e;return}T-=l[n];if(0>T)this.status=2,this.m=e;else{l[n]+=T;t[1]=s=0;q=l;v=1;for(u=2;0<--n;)s+=q[v++],t[u++]=s;q=a;n=v=0;do s=q[v++],0!==s&&(h[t[s]++]=n);while(++n<b);b=t[m];t[0]=n=0;q=h;v=0;h=-1;z=p[0]=0;u=null;I=0;for(k=k-1+1;k<=m;k++)for(a=l[k];0<a--;){for(;k>z+p[1+h];){z+=
p[1+h];h++;I=m-z;I=I>e?e:I;s=k-z;r=1<<s;if(r>a+1)for(r-=a+1,u=k;++s<I;){r<<=1;if(r<=l[++u])break;r-=l[u]}z+s>f&&z<f&&(s=f-z);I=1<<s;p[1+h]=s;u=Array(I);for(r=0;r<I;r++)u[r]=new core.zip_HuftNode;x=null===x?this.root=new core.zip_HuftList:x.next=new core.zip_HuftList;x.next=null;x.list=u;B[h]=u;0<h&&(t[h]=n,C.b=p[h],C.e=16+s,C.t=u,s=(n&(1<<z)-1)>>z-p[h],B[h-1][s].e=C.e,B[h-1][s].b=C.b,B[h-1][s].n=C.n,B[h-1][s].t=C.t)}C.b=k-z;v>=b?C.e=99:q[v]<g?(C.e=256>q[v]?16:15,C.n=q[v++]):(C.e=c[q[v]-g],C.n=d[q[v++]-
g]);r=1<<k-z;for(s=n>>z;s<I;s+=r)u[s].e=C.e,u[s].b=C.b,u[s].n=C.n,u[s].t=C.t;for(s=1<<k-1;0!==(n&s);s>>=1)n^=s;for(n^=s;(n&(1<<z)-1)!==t[h];)z-=p[h],h--}this.m=p[1];this.status=0!==T&&1!==m?1:0}}}function k(g){for(;b<g;){var d=a,c;c=s.length===L?-1:s[L++];a=d|c<<b;b+=8}}function f(b){return a&z[b]}function q(g){a>>=g;b-=g}function p(a,b,d){var e,l,h;if(0===d)return 0;for(h=0;;){k(v);l=w.list[f(v)];for(e=l.e;16<e;){if(99===e)return-1;q(l.b);e-=16;k(e);l=l.t[f(e)];e=l.e}q(l.b);if(16===e)m&=32767,a[b+
h++]=c[m++]=l.n;else{if(15===e)break;k(e);u=l.n+f(e);q(e);k(t);l=y.list[f(t)];for(e=l.e;16<e;){if(99===e)return-1;q(l.b);e-=16;k(e);l=l.t[f(e)];e=l.e}q(l.b);k(e);x=m-l.n-f(e);for(q(e);0<u&&h<d;)u--,x&=32767,m&=32767,a[b+h++]=c[m++]=c[x++]}if(h===d)return d}g=-1;return h}function n(a,b,g){var d,c,e,l,r,n,m,s=Array(316);for(d=0;d<s.length;d++)s[d]=0;k(5);n=257+f(5);q(5);k(5);m=1+f(5);q(5);k(4);d=4+f(4);q(4);if(286<n||30<m)return-1;for(c=0;c<d;c++)k(3),s[A[c]]=f(3),q(3);for(c=d;19>c;c++)s[A[c]]=0;v=
7;c=new h(s,19,19,null,null,v);if(0!==c.status)return-1;w=c.root;v=c.m;l=n+m;for(d=e=0;d<l;)if(k(v),r=w.list[f(v)],c=r.b,q(c),c=r.n,16>c)s[d++]=e=c;else if(16===c){k(2);c=3+f(2);q(2);if(d+c>l)return-1;for(;0<c--;)s[d++]=e}else{17===c?(k(3),c=3+f(3),q(3)):(k(7),c=11+f(7),q(7));if(d+c>l)return-1;for(;0<c--;)s[d++]=0;e=0}v=9;c=new h(s,n,257,B,N,v);0===v&&(c.status=1);if(0!==c.status)return-1;w=c.root;v=c.m;for(d=0;d<m;d++)s[d]=s[d+n];t=6;c=new h(s,m,0,I,T,t);y=c.root;t=c.m;return 0===t&&257<n||0!==c.status?
-1:p(a,b,g)}var c=[],m,r=null,d,e,a,b,g,l,u,x,w,y,v,t,s,L,z=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535],B=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,99,99],I=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],T=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],A=[16,17,18,0,8,7,9,6,
10,5,11,4,12,3,13,2,14,1,15],C;this.inflate=function(ia,z){c.length=65536;b=a=m=0;g=-1;l=!1;u=x=0;w=null;s=ia;L=0;var A=new Uint8Array(new ArrayBuffer(z));a:for(var R=0,Z;R<z&&(!l||-1!==g);){if(0<u){if(0!==g)for(;0<u&&R<z;)u--,x&=32767,m&=32767,A[0+R]=c[m]=c[x],R+=1,m+=1,x+=1;else{for(;0<u&&R<z;)u-=1,m&=32767,k(8),A[0+R]=c[m]=f(8),R+=1,m+=1,q(8);0===u&&(g=-1)}if(R===z)break}if(-1===g){if(l)break;k(1);0!==f(1)&&(l=!0);q(1);k(2);g=f(2);q(2);w=null;u=0}switch(g){case 0:Z=A;var M=0+R,S=z-R,F=void 0,F=
b&7;q(F);k(16);F=f(16);q(16);k(16);if(F!==(~a&65535))Z=-1;else{q(16);u=F;for(F=0;0<u&&F<S;)u--,m&=32767,k(8),Z[M+F++]=c[m++]=f(8),q(8);0===u&&(g=-1);Z=F}break;case 1:if(null!==w)Z=p(A,0+R,z-R);else b:{Z=A;M=0+R;S=z-R;if(null===r){for(var G=void 0,F=Array(288),G=void 0,G=0;144>G;G++)F[G]=8;for(G=144;256>G;G++)F[G]=9;for(G=256;280>G;G++)F[G]=7;for(G=280;288>G;G++)F[G]=8;e=7;G=new h(F,288,257,B,N,e);if(0!==G.status){alert("HufBuild error: "+G.status);Z=-1;break b}r=G.root;e=G.m;for(G=0;30>G;G++)F[G]=
5;C=5;G=new h(F,30,0,I,T,C);if(1<G.status){r=null;alert("HufBuild error: "+G.status);Z=-1;break b}d=G.root;C=G.m}w=r;y=d;v=e;t=C;Z=p(Z,M,S)}break;case 2:Z=null!==w?p(A,0+R,z-R):n(A,0+R,z-R);break;default:Z=-1}if(-1===Z)break a;R+=Z}s=new Uint8Array(new ArrayBuffer(0));return A}};
// Input 12
core.ScheduledTask=function(h,k){function f(){n&&(runtime.clearTimeout(p),n=!1)}function q(){f();h.apply(void 0,c);c=null}var p,n=!1,c=[];this.trigger=function(){c=Array.prototype.slice.call(arguments);n||(n=!0,p=runtime.setTimeout(q,k))};this.triggerImmediate=function(){c=Array.prototype.slice.call(arguments);q()};this.processRequests=function(){n&&q()};this.cancel=f;this.destroy=function(c){f();c()}};
// Input 13
core.UnitTest=function(){};core.UnitTest.prototype.setUp=function(){};core.UnitTest.prototype.tearDown=function(){};core.UnitTest.prototype.description=function(){};core.UnitTest.prototype.tests=function(){};core.UnitTest.prototype.asyncTests=function(){};
core.UnitTest.provideTestAreaDiv=function(){var h=runtime.getWindow().document,k=h.getElementById("testarea");runtime.assert(!k,'Unclean test environment, found a div with id "testarea".');k=h.createElement("div");k.setAttribute("id","testarea");h.body.appendChild(k);return k};
core.UnitTest.cleanupTestAreaDiv=function(){var h=runtime.getWindow().document,k=h.getElementById("testarea");runtime.assert(!!k&&k.parentNode===h.body,'Test environment broken, found no div with id "testarea" below body.');h.body.removeChild(k)};core.UnitTest.createOdtDocument=function(h,k){var f="<?xml version='1.0' encoding='UTF-8'?>",f=f+"<office:document";Object.keys(k).forEach(function(h){f+=" xmlns:"+h+'="'+k[h]+'"'});f+=">";f+=h;f+="</office:document>";return runtime.parseXML(f)};
core.UnitTestRunner=function(){function h(f){c+=1;runtime.log("fail",f)}function k(c,d){var e;try{if(c.length!==d.length)return h("array of length "+c.length+" should be "+d.length+" long"),!1;for(e=0;e<c.length;e+=1)if(c[e]!==d[e])return h(c[e]+" should be "+d[e]+" at array index "+e),!1}catch(a){return!1}return!0}function f(c,d,e){var a=c.attributes,b=a.length,g,l,n;for(g=0;g<b;g+=1)if(l=a.item(g),"xmlns"!==l.prefix&&"urn:webodf:names:steps"!==l.namespaceURI){n=d.getAttributeNS(l.namespaceURI,l.localName);
if(!d.hasAttributeNS(l.namespaceURI,l.localName))return h("Attribute "+l.localName+" with value "+l.value+" was not present"),!1;if(n!==l.value)return h("Attribute "+l.localName+" was "+n+" should be "+l.value),!1}return e?!0:f(d,c,!0)}function q(c,d){var e,a;e=c.nodeType;a=d.nodeType;if(e!==a)return h("Nodetype '"+e+"' should be '"+a+"'"),!1;if(e===Node.TEXT_NODE){if(c.data===d.data)return!0;h("Textnode data '"+c.data+"' should be '"+d.data+"'");return!1}runtime.assert(e===Node.ELEMENT_NODE,"Only textnodes and elements supported.");
if(c.namespaceURI!==d.namespaceURI)return h("namespace '"+c.namespaceURI+"' should be '"+d.namespaceURI+"'"),!1;if(c.localName!==d.localName)return h("localName '"+c.localName+"' should be '"+d.localName+"'"),!1;if(!f(c,d,!1))return!1;e=c.firstChild;for(a=d.firstChild;e;){if(!a)return h("Nodetype '"+e.nodeType+"' is unexpected here."),!1;if(!q(e,a))return!1;e=e.nextSibling;a=a.nextSibling}return a?(h("Nodetype '"+a.nodeType+"' is missing here."),!1):!0}function p(c,d){return 0===d?c===d&&1/c===1/
d:c===d?!0:"number"===typeof d&&isNaN(d)?"number"===typeof c&&isNaN(c):Object.prototype.toString.call(d)===Object.prototype.toString.call([])?k(c,d):"object"===typeof d&&"object"===typeof c?d.constructor===Element||d.constructor===Node?q(c,d):m(c,d):!1}function n(c,d,e){"string"===typeof d&&"string"===typeof e||runtime.log("WARN: shouldBe() expects string arguments");var a,b;try{b=eval(d)}catch(g){a=g}c=eval(e);a?h(d+" should be "+c+". Threw exception "+a):p(b,c)?runtime.log("pass",d+" is "+e):String(typeof b)===
String(typeof c)?(e=0===b&&0>1/b?"-0":String(b),h(d+" should be "+c+". Was "+e+".")):h(d+" should be "+c+" (of type "+typeof c+"). Was "+b+" (of type "+typeof b+").")}var c=0,m;m=function(c,d){var e=Object.keys(c),a=Object.keys(d);e.sort();a.sort();return k(e,a)&&Object.keys(c).every(function(a){var g=c[a],e=d[a];return p(g,e)?!0:(h(g+" should be "+e+" for key "+a),!1)})};this.areNodesEqual=q;this.shouldBeNull=function(c,d){n(c,d,"null")};this.shouldBeNonNull=function(c,d){var e,a;try{a=eval(d)}catch(b){e=
b}e?h(d+" should be non-null. Threw exception "+e):null!==a?runtime.log("pass",d+" is non-null."):h(d+" should be non-null. Was "+a)};this.shouldBe=n;this.countFailedTests=function(){return c};this.name=function(c){var d,e,a=[],b=c.length;a.length=b;for(d=0;d<b;d+=1){e=Runtime.getFunctionName(c[d])||"";if(""===e)throw"Found a function without a name.";a[d]={f:c[d],name:e}}return a}};
core.UnitTester=function(){function h(f,h){return"<span style='color:blue;cursor:pointer' onclick='"+h+"'>"+f+"</span>"}var k=0,f={};this.runTests=function(q,p,n){function c(a){if(0===a.length)f[m]=e,k+=r.countFailedTests(),p();else{b=a[0].f;var g=a[0].name;runtime.log("Running "+g);l=r.countFailedTests();d.setUp();b(function(){d.tearDown();e[g]=l===r.countFailedTests();c(a.slice(1))})}}var m=Runtime.getFunctionName(q)||"",r=new core.UnitTestRunner,d=new q(r),e={},a,b,g,l,u="BrowserRuntime"===runtime.type();
if(f.hasOwnProperty(m))runtime.log("Test "+m+" has already run.");else{u?runtime.log("<span>Running "+h(m,'runSuite("'+m+'");')+": "+d.description()+"</span>"):runtime.log("Running "+m+": "+d.description);g=d.tests();for(a=0;a<g.length;a+=1)b=g[a].f,q=g[a].name,n.length&&-1===n.indexOf(q)||(u?runtime.log("<span>Running "+h(q,'runTest("'+m+'","'+q+'")')+"</span>"):runtime.log("Running "+q),l=r.countFailedTests(),d.setUp(),b(),d.tearDown(),e[q]=l===r.countFailedTests());c(d.asyncTests())}};this.countFailedTests=
function(){return k};this.results=function(){return f}};
// Input 14
core.Utils=function(){function h(k,f){if(f&&Array.isArray(f)){k=k||[];if(!Array.isArray(k))throw"Destination is not an array.";k=k.concat(f.map(function(f){return h(null,f)}))}else if(f&&"object"===typeof f){k=k||{};if("object"!==typeof k)throw"Destination is not an object.";Object.keys(f).forEach(function(q){k[q]=h(k[q],f[q])})}else k=f;return k}this.hashString=function(h){var f=0,q,p;q=0;for(p=h.length;q<p;q+=1)f=(f<<5)-f+h.charCodeAt(q),f|=0;return f};this.mergeObjects=function(k,f){Object.keys(f).forEach(function(q){k[q]=
h(k[q],f[q])});return k}};
// Input 15
/*

 WebODF
 Copyright (c) 2010 Jos van den Oever
 Licensed under the ... License:

 Project home: http://www.webodf.org/
*/
runtime.loadClass("core.RawInflate");runtime.loadClass("core.ByteArray");runtime.loadClass("core.ByteArrayWriter");runtime.loadClass("core.Base64");
core.Zip=function(h,k){function f(a){var b=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,
853044451,1172266101,3705015759,2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,
4240017532,1658658271,366619977,2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,
225274430,2053790376,3826175755,2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,
2998733608,733239954,1555261956,3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,
2932959818,3654703836,1088359270,936918E3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117],c,d,g=a.length,e=0,e=0;c=-1;for(d=0;d<g;d+=1)e=(c^a[d])&255,e=b[e],c=c>>>8^e;return c^-1}function q(a){return new Date((a>>25&127)+1980,(a>>21&15)-1,a>>16&31,a>>11&15,a>>5&63,(a&31)<<1)}function p(a){var b=a.getFullYear();return 1980>b?0:b-1980<<
25|a.getMonth()+1<<21|a.getDate()<<16|a.getHours()<<11|a.getMinutes()<<5|a.getSeconds()>>1}function n(a,b){var c,d,g,e,f,h,n,m=this;this.load=function(b){if(null!==m.data)b(null,m.data);else{var c=f+34+d+g+256;c+n>l&&(c=l-n);runtime.read(a,n,c,function(c,d){if(c||null===d)b(c,d);else a:{var g=d,l=new core.ByteArray(g),n=l.readUInt32LE(),s;if(67324752!==n)b("File entry signature is wrong."+n.toString()+" "+g.length.toString(),null);else{l.pos+=22;n=l.readUInt16LE();s=l.readUInt16LE();l.pos+=n+s;if(e){g=
g.subarray(l.pos,l.pos+f);if(f!==g.length){b("The amount of compressed bytes read was "+g.length.toString()+" instead of "+f.toString()+" for "+m.filename+" in "+a+".",null);break a}g=x(g,h)}else g=g.subarray(l.pos,l.pos+h);h!==g.length?b("The amount of bytes read was "+g.length.toString()+" instead of "+h.toString()+" for "+m.filename+" in "+a+".",null):(m.data=g,b(null,g))}}})}};this.set=function(a,b,c,d){m.filename=a;m.data=b;m.compressed=c;m.date=d};this.error=null;b&&(c=b.readUInt32LE(),33639248!==
c?this.error="Central directory entry has wrong signature at position "+(b.pos-4).toString()+' for file "'+a+'": '+b.data.length.toString():(b.pos+=6,e=b.readUInt16LE(),this.date=q(b.readUInt32LE()),b.readUInt32LE(),f=b.readUInt32LE(),h=b.readUInt32LE(),d=b.readUInt16LE(),g=b.readUInt16LE(),c=b.readUInt16LE(),b.pos+=8,n=b.readUInt32LE(),this.filename=runtime.byteArrayToString(b.data.subarray(b.pos,b.pos+d),"utf8"),this.data=null,b.pos+=d+g+c))}function c(a,b){if(22!==a.length)b("Central directory length should be 22.",
w);else{var c=new core.ByteArray(a),d;d=c.readUInt32LE();101010256!==d?b("Central directory signature is wrong: "+d.toString(),w):(d=c.readUInt16LE(),0!==d?b("Zip files with non-zero disk numbers are not supported.",w):(d=c.readUInt16LE(),0!==d?b("Zip files with non-zero disk numbers are not supported.",w):(d=c.readUInt16LE(),u=c.readUInt16LE(),d!==u?b("Number of entries is inconsistent.",w):(d=c.readUInt32LE(),c=c.readUInt16LE(),c=l-22-d,runtime.read(h,c,l-c,function(a,c){if(a||null===c)b(a,w);else a:{var d=
new core.ByteArray(c),e,l;g=[];for(e=0;e<u;e+=1){l=new n(h,d);if(l.error){b(l.error,w);break a}g[g.length]=l}b(null,w)}})))))}}function m(a,b){var c=null,d,e;for(e=0;e<g.length;e+=1)if(d=g[e],d.filename===a){c=d;break}c?c.data?b(null,c.data):c.load(b):b(a+" not found.",null)}function r(a){var b=new core.ByteArrayWriter("utf8"),c=0;b.appendArray([80,75,3,4,20,0,0,0,0,0]);a.data&&(c=a.data.length);b.appendUInt32LE(p(a.date));b.appendUInt32LE(a.data?f(a.data):0);b.appendUInt32LE(c);b.appendUInt32LE(c);
b.appendUInt16LE(a.filename.length);b.appendUInt16LE(0);b.appendString(a.filename);a.data&&b.appendByteArray(a.data);return b}function d(a,b){var c=new core.ByteArrayWriter("utf8"),d=0;c.appendArray([80,75,1,2,20,0,20,0,0,0,0,0]);a.data&&(d=a.data.length);c.appendUInt32LE(p(a.date));c.appendUInt32LE(a.data?f(a.data):0);c.appendUInt32LE(d);c.appendUInt32LE(d);c.appendUInt16LE(a.filename.length);c.appendArray([0,0,0,0,0,0,0,0,0,0,0,0]);c.appendUInt32LE(b);c.appendString(a.filename);return c}function e(a,
b){if(a===g.length)b(null);else{var c=g[a];null!==c.data?e(a+1,b):c.load(function(c){c?b(c):e(a+1,b)})}}function a(a,b){e(0,function(c){if(c)b(c);else{var e,l,f=new core.ByteArrayWriter("utf8"),h=[0];for(e=0;e<g.length;e+=1)f.appendByteArrayWriter(r(g[e])),h.push(f.getLength());c=f.getLength();for(e=0;e<g.length;e+=1)l=g[e],f.appendByteArrayWriter(d(l,h[e]));e=f.getLength()-c;f.appendArray([80,75,5,6,0,0,0,0]);f.appendUInt16LE(g.length);f.appendUInt16LE(g.length);f.appendUInt32LE(e);f.appendUInt32LE(c);
f.appendArray([0,0]);a(f.getByteArray())}})}function b(b,c){a(function(a){runtime.writeFile(b,a,c)},c)}var g,l,u,x=(new core.RawInflate).inflate,w=this,y=new core.Base64;this.load=m;this.save=function(a,b,c,d){var e,l;for(e=0;e<g.length;e+=1)if(l=g[e],l.filename===a){l.set(a,b,c,d);return}l=new n(h);l.set(a,b,c,d);g.push(l)};this.remove=function(a){var b,c;for(b=0;b<g.length;b+=1)if(c=g[b],c.filename===a)return g.splice(b,1),!0;return!1};this.write=function(a){b(h,a)};this.writeAs=b;this.createByteArray=
a;this.loadContentXmlAsFragments=function(a,b){w.loadAsString(a,function(a,c){if(a)return b.rootElementReady(a);b.rootElementReady(null,c,!0)})};this.loadAsString=function(a,b){m(a,function(a,c){if(a||null===c)return b(a,null);var d=runtime.byteArrayToString(c,"utf8");b(null,d)})};this.loadAsDOM=function(a,b){w.loadAsString(a,function(a,c){if(a||null===c)b(a,null);else{var d=(new DOMParser).parseFromString(c,"text/xml");b(null,d)}})};this.loadAsDataURL=function(a,b,c){m(a,function(a,d){if(a||!d)return c(a,
null);var g=0,e;b||(b=80===d[1]&&78===d[2]&&71===d[3]?"image/png":255===d[0]&&216===d[1]&&255===d[2]?"image/jpeg":71===d[0]&&73===d[1]&&70===d[2]?"image/gif":"");for(e="data:"+b+";base64,";g<d.length;)e+=y.convertUTF8ArrayToBase64(d.subarray(g,Math.min(g+45E3,d.length))),g+=45E3;c(null,e)})};this.getEntries=function(){return g.slice()};l=-1;null===k?g=[]:runtime.getFileSize(h,function(a){l=a;0>l?k("File '"+h+"' cannot be read.",w):runtime.read(h,l-22,22,function(a,b){a||null===k||null===b?k(a,w):
c(b,k)})})};
// Input 16
gui.Avatar=function(h,k){var f=this,q,p,n;this.setColor=function(c){p.style.borderColor=c};this.setImageUrl=function(c){f.isVisible()?p.src=c:n=c};this.isVisible=function(){return"block"===q.style.display};this.show=function(){n&&(p.src=n,n=void 0);q.style.display="block"};this.hide=function(){q.style.display="none"};this.markAsFocussed=function(c){q.className=c?"active":""};this.destroy=function(c){h.removeChild(q);c()};(function(){var c=h.ownerDocument,f=c.documentElement.namespaceURI;q=c.createElementNS(f,
"div");p=c.createElementNS(f,"img");p.width=64;p.height=64;q.appendChild(p);q.style.width="64px";q.style.height="70px";q.style.position="absolute";q.style.top="-80px";q.style.left="-34px";q.style.display=k?"block":"none";q.className="handle";h.appendChild(q)})()};
// Input 17
gui.EditInfoHandle=function(h){var k=[],f,q=h.ownerDocument,p=q.documentElement.namespaceURI;this.setEdits=function(h){k=h;var c,m,r,d;f.innerHTML="";for(h=0;h<k.length;h+=1)c=q.createElementNS(p,"div"),c.className="editInfo",m=q.createElementNS(p,"span"),m.className="editInfoColor",m.setAttributeNS("urn:webodf:names:editinfo","editinfo:memberid",k[h].memberid),r=q.createElementNS(p,"span"),r.className="editInfoAuthor",r.setAttributeNS("urn:webodf:names:editinfo","editinfo:memberid",k[h].memberid),
d=q.createElementNS(p,"span"),d.className="editInfoTime",d.setAttributeNS("urn:webodf:names:editinfo","editinfo:memberid",k[h].memberid),d.innerHTML=k[h].time,c.appendChild(m),c.appendChild(r),c.appendChild(d),f.appendChild(c)};this.show=function(){f.style.display="block"};this.hide=function(){f.style.display="none"};this.destroy=function(n){h.removeChild(f);n()};f=q.createElementNS(p,"div");f.setAttribute("class","editInfoHandle");f.style.display="none";h.appendChild(f)};
// Input 18
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
gui.KeyboardHandler=function(){function h(f,h){h||(h=k.None);return f+":"+h}var k=gui.KeyboardHandler.Modifier,f=null,q={};this.setDefault=function(h){f=h};this.bind=function(f,n,c){f=h(f,n);runtime.assert(!1===q.hasOwnProperty(f),"tried to overwrite the callback handler of key combo: "+f);q[f]=c};this.unbind=function(f,n){var c=h(f,n);delete q[c]};this.reset=function(){f=null;q={}};this.handleEvent=function(p){var n=p.keyCode,c=k.None;p.metaKey&&(c|=k.Meta);p.ctrlKey&&(c|=k.Ctrl);p.altKey&&(c|=k.Alt);
p.shiftKey&&(c|=k.Shift);n=h(n,c);n=q[n];c=!1;n?c=n():null!==f&&(c=f(p));c&&(p.preventDefault?p.preventDefault():p.returnValue=!1)}};gui.KeyboardHandler.Modifier={None:0,Meta:1,Ctrl:2,Alt:4,CtrlAlt:6,Shift:8,MetaShift:9,CtrlShift:10,AltShift:12};
gui.KeyboardHandler.KeyCode={Backspace:8,Tab:9,Clear:12,Enter:13,Ctrl:17,End:35,Home:36,Left:37,Up:38,Right:39,Down:40,Delete:46,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90,LeftMeta:91,MetaInMozilla:224};(function(){return gui.KeyboardHandler})();
// Input 19
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
odf.Namespaces={namespaceMap:{db:"urn:oasis:names:tc:opendocument:xmlns:database:1.0",dc:"http://purl.org/dc/elements/1.1/",dr3d:"urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0",draw:"urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",chart:"urn:oasis:names:tc:opendocument:xmlns:chart:1.0",fo:"urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",form:"urn:oasis:names:tc:opendocument:xmlns:form:1.0",meta:"urn:oasis:names:tc:opendocument:xmlns:meta:1.0",number:"urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0",
office:"urn:oasis:names:tc:opendocument:xmlns:office:1.0",presentation:"urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",style:"urn:oasis:names:tc:opendocument:xmlns:style:1.0",svg:"urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",table:"urn:oasis:names:tc:opendocument:xmlns:table:1.0",text:"urn:oasis:names:tc:opendocument:xmlns:text:1.0",xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"},prefixMap:{},dbns:"urn:oasis:names:tc:opendocument:xmlns:database:1.0",
dcns:"http://purl.org/dc/elements/1.1/",dr3dns:"urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0",drawns:"urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",chartns:"urn:oasis:names:tc:opendocument:xmlns:chart:1.0",fons:"urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",formns:"urn:oasis:names:tc:opendocument:xmlns:form:1.0",metans:"urn:oasis:names:tc:opendocument:xmlns:meta:1.0",numberns:"urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0",officens:"urn:oasis:names:tc:opendocument:xmlns:office:1.0",
presentationns:"urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",stylens:"urn:oasis:names:tc:opendocument:xmlns:style:1.0",svgns:"urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",tablens:"urn:oasis:names:tc:opendocument:xmlns:table:1.0",textns:"urn:oasis:names:tc:opendocument:xmlns:text:1.0",xlinkns:"http://www.w3.org/1999/xlink",xmlns:"http://www.w3.org/XML/1998/namespace"};
(function(){var h=odf.Namespaces.namespaceMap,k=odf.Namespaces.prefixMap,f;for(f in h)h.hasOwnProperty(f)&&(k[h[f]]=f)})();odf.Namespaces.forEachPrefix=function(h){var k=odf.Namespaces.namespaceMap,f;for(f in k)k.hasOwnProperty(f)&&h(f,k[f])};odf.Namespaces.lookupNamespaceURI=function(h){var k=null;odf.Namespaces.namespaceMap.hasOwnProperty(h)&&(k=odf.Namespaces.namespaceMap[h]);return k};odf.Namespaces.lookupPrefix=function(h){var k=odf.Namespaces.prefixMap;return k.hasOwnProperty(h)?k[h]:null};
odf.Namespaces.lookupNamespaceURI.lookupNamespaceURI=odf.Namespaces.lookupNamespaceURI;
// Input 20
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("odf.Namespaces");
odf.OdfUtils=function(){function h(a){return"image"===(a&&a.localName)&&a.namespaceURI===I}function k(a){return null!==a&&a.nodeType===Node.ELEMENT_NODE&&"frame"===a.localName&&a.namespaceURI===I&&"as-char"===a.getAttributeNS(N,"anchor-type")}function f(a){var b;(b="annotation"===(a&&a.localName)&&a.namespaceURI===odf.Namespaces.officens)||(b="div"===(a&&a.localName)&&"annotationWrapper"===a.className);return b}function q(a){return"a"===(a&&a.localName)&&a.namespaceURI===N}function p(a){var b=a&&
a.localName;return("p"===b||"h"===b)&&a.namespaceURI===N}function n(a){for(;a&&!p(a);)a=a.parentNode;return a}function c(a){return/^[ \t\r\n]+$/.test(a)}function m(a){if(null===a||a.nodeType!==Node.ELEMENT_NODE)return!1;var b=a.localName;return/^(span|p|h|a|meta)$/.test(b)&&a.namespaceURI===N||"span"===b&&"annotationHighlight"===a.className}function r(a){var b=a&&a.localName,c=!1;b&&(a=a.namespaceURI,a===N&&(c="s"===b||"tab"===b||"line-break"===b));return c}function d(a){return r(a)||k(a)||f(a)}function e(a){var b=
a&&a.localName,c=!1;b&&(a=a.namespaceURI,a===N&&(c="s"===b));return c}function a(a){for(;null!==a.firstChild&&m(a);)a=a.firstChild;return a}function b(a){for(;null!==a.lastChild&&m(a);)a=a.lastChild;return a}function g(a){for(;!p(a)&&null===a.previousSibling;)a=a.parentNode;return p(a)?null:b(a.previousSibling)}function l(b){for(;!p(b)&&null===b.nextSibling;)b=b.parentNode;return p(b)?null:a(b.nextSibling)}function u(a){for(var b=!1;a;)if(a.nodeType===Node.TEXT_NODE)if(0===a.length)a=g(a);else return!c(a.data.substr(a.length-
1,1));else d(a)?(b=!1===e(a),a=null):a=g(a);return b}function x(b){var g=!1,e;for(b=b&&a(b);b;){e=b.nodeType===Node.TEXT_NODE?b.length:0;if(0<e&&!c(b.data)){g=!0;break}if(d(b)){g=!0;break}b=l(b)}return g}function w(a,b){return c(a.data.substr(b))?!x(l(a)):!1}function y(a,b){var e=a.data,l;if(!c(e[b])||d(a.parentNode))return!1;0<b?c(e[b-1])||(l=!0):u(g(a))&&(l=!0);return!0===l?w(a,b)?!1:!0:!1}function v(a){return(a=/(-?[0-9]*[0-9][0-9]*(\.[0-9]*)?|0+\.[0-9]*[1-9][0-9]*|\.[0-9]*[1-9][0-9]*)((cm)|(mm)|(in)|(pt)|(pc)|(px)|(%))/.exec(a))?
{value:parseFloat(a[1]),unit:a[3]}:null}function t(a){return(a=v(a))&&(0>a.value||"%"===a.unit)?null:a}function s(a){return(a=v(a))&&"%"!==a.unit?null:a}function L(a){switch(a.namespaceURI){case odf.Namespaces.drawns:case odf.Namespaces.svgns:case odf.Namespaces.dr3dns:return!1;case odf.Namespaces.textns:switch(a.localName){case "note-body":case "ruby-text":return!1}break;case odf.Namespaces.officens:switch(a.localName){case "annotation":case "binary-data":case "event-listeners":return!1}break;default:switch(a.localName){case "editinfo":return!1}}return!0}
function z(a,b,g){var e=a.startContainer.ownerDocument.createRange(),l;l=C.getNodesInRange(a,function(l){e.selectNodeContents(l);if(r(l.parentNode)||f(l.parentNode))return NodeFilter.FILTER_REJECT;if(l.nodeType===Node.TEXT_NODE){if(b&&C.rangesIntersect(a,e)||C.containsRange(a,e))if(g||Boolean(n(l)&&(!c(l.textContent)||y(l,0))))return NodeFilter.FILTER_ACCEPT}else if(d(l)){if(b&&C.rangesIntersect(a,e)||C.containsRange(a,e))return NodeFilter.FILTER_ACCEPT}else if(L(l)||m(l))return NodeFilter.FILTER_SKIP;
return NodeFilter.FILTER_REJECT});e.detach();return l}function B(a,b){var c=a;if(b<c.childNodes.length-1)c=c.childNodes[b+1];else{for(;!c.nextSibling;)c=c.parentNode;c=c.nextSibling}for(;c.firstChild;)c=c.firstChild;return c}var N=odf.Namespaces.textns,I=odf.Namespaces.drawns,T=odf.Namespaces.xlinkns,A=/^\s*$/,C=new core.DomUtils;this.isImage=h;this.isCharacterFrame=k;this.isInlineRoot=f;this.isTextSpan=function(a){return"span"===(a&&a.localName)&&a.namespaceURI===N};this.isHyperlink=q;this.getHyperlinkTarget=
function(a){return a.getAttributeNS(T,"href")};this.isParagraph=p;this.getParagraphElement=n;this.isWithinTrackedChanges=function(a,b){for(;a&&a!==b;){if(a.namespaceURI===N&&"tracked-changes"===a.localName)return!0;a=a.parentNode}return!1};this.isListItem=function(a){return"list-item"===(a&&a.localName)&&a.namespaceURI===N};this.isLineBreak=function(a){return"line-break"===(a&&a.localName)&&a.namespaceURI===N};this.isODFWhitespace=c;this.isGroupingElement=m;this.isCharacterElement=r;this.isAnchoredAsCharacterElement=
d;this.isSpaceElement=e;this.firstChild=a;this.lastChild=b;this.previousNode=g;this.nextNode=l;this.scanLeftForNonSpace=u;this.lookLeftForCharacter=function(a){var b,e=b=0;a.nodeType===Node.TEXT_NODE&&(e=a.length);0<e?(b=a.data,b=c(b.substr(e-1,1))?1===e?u(g(a))?2:0:c(b.substr(e-2,1))?0:2:1):d(a)&&(b=1);return b};this.lookRightForCharacter=function(a){var b=!1,g=0;a&&a.nodeType===Node.TEXT_NODE&&(g=a.length);0<g?b=!c(a.data.substr(0,1)):d(a)&&(b=!0);return b};this.scanLeftForAnyCharacter=function(a){var e=
!1,l;for(a=a&&b(a);a;){l=a.nodeType===Node.TEXT_NODE?a.length:0;if(0<l&&!c(a.data)){e=!0;break}if(d(a)){e=!0;break}a=g(a)}return e};this.scanRightForAnyCharacter=x;this.isTrailingWhitespace=w;this.isSignificantWhitespace=y;this.isDowngradableSpaceElement=function(a){return a.namespaceURI===N&&"s"===a.localName?u(g(a))&&x(l(a)):!1};this.getFirstNonWhitespaceChild=function(a){for(a=a&&a.firstChild;a&&a.nodeType===Node.TEXT_NODE&&A.test(a.nodeValue);)a=a.nextSibling;return a};this.parseLength=v;this.parseNonNegativeLength=
t;this.parseFoFontSize=function(a){var b;b=(b=v(a))&&(0>=b.value||"%"===b.unit)?null:b;return b||s(a)};this.parseFoLineHeight=function(a){return t(a)||s(a)};this.getImpactedParagraphs=function(a){var b,c,d;b=a.commonAncestorContainer;var g=[],e=[];for(b.nodeType===Node.ELEMENT_NODE&&(g=C.getElementsByTagNameNS(b,N,"p").concat(C.getElementsByTagNameNS(b,N,"h")));b&&!p(b);)b=b.parentNode;b&&g.push(b);c=g.length;for(b=0;b<c;b+=1)d=g[b],C.rangeIntersectsNode(a,d)&&e.push(d);return e};this.getTextNodes=
function(a,b){var d=a.startContainer.ownerDocument.createRange(),g;g=C.getNodesInRange(a,function(g){d.selectNodeContents(g);if(g.nodeType===Node.TEXT_NODE){if(b&&C.rangesIntersect(a,d)||C.containsRange(a,d))return Boolean(n(g)&&(!c(g.textContent)||y(g,0)))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}else if(C.rangesIntersect(a,d)&&L(g))return NodeFilter.FILTER_SKIP;return NodeFilter.FILTER_REJECT});d.detach();return g};this.getTextElements=z;this.getParagraphElements=function(a){var b=a.startContainer.ownerDocument.createRange(),
c;c=C.getNodesInRange(a,function(c){b.selectNodeContents(c);if(p(c)){if(C.rangesIntersect(a,b))return NodeFilter.FILTER_ACCEPT}else if(L(c)||m(c))return NodeFilter.FILTER_SKIP;return NodeFilter.FILTER_REJECT});b.detach();return c};this.getImageElements=function(a){var b=a.startContainer.ownerDocument.createRange(),c;c=C.getNodesInRange(a,function(c){b.selectNodeContents(c);return h(c)&&C.containsRange(a,b)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP});b.detach();return c};this.getHyperlinkElements=
function(a){var b=[],c=a.cloneRange();a.collapsed&&a.endContainer.nodeType===Node.ELEMENT_NODE&&(a=B(a.endContainer,a.endOffset),a.nodeType===Node.TEXT_NODE&&c.setEnd(a,1));z(c,!0,!1).forEach(function(a){for(a=a.parentNode;!p(a);){if(q(a)&&-1===b.indexOf(a)){b.push(a);break}a=a.parentNode}});c.detach();return b}};
// Input 21
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.Server=function(){};ops.Server.prototype.connect=function(h,k){};ops.Server.prototype.networkStatus=function(){};ops.Server.prototype.login=function(h,k,f,q){};ops.Server.prototype.joinSession=function(h,k,f,q){};ops.Server.prototype.leaveSession=function(h,k,f,q){};ops.Server.prototype.getGenesisUrl=function(h){};
// Input 22
xmldom.LSSerializerFilter=function(){};xmldom.LSSerializerFilter.prototype.acceptNode=function(h){};
// Input 23
xmldom.XPathIterator=function(){};xmldom.XPathIterator.prototype.next=function(){};xmldom.XPathIterator.prototype.reset=function(){};
function createXPathSingleton(){function h(c,a,b){return-1!==c&&(c<a||-1===a)&&(c<b||-1===b)}function k(c){for(var a=[],b=0,g=c.length,l;b<g;){var f=c,m=g,n=a,r="",k=[],p=f.indexOf("[",b),s=f.indexOf("/",b),q=f.indexOf("=",b);h(s,p,q)?(r=f.substring(b,s),b=s+1):h(p,s,q)?(r=f.substring(b,p),b=d(f,p,k)):h(q,s,p)?(r=f.substring(b,q),b=q):(r=f.substring(b,m),b=m);n.push({location:r,predicates:k});if(b<g&&"="===c[b]){l=c.substring(b+1,g);if(2<l.length&&("'"===l[0]||'"'===l[0]))l=l.slice(1,l.length-1);
else try{l=parseInt(l,10)}catch(z){}b=g}}return{steps:a,value:l}}function f(){var c=null,a=!1;this.setNode=function(a){c=a};this.reset=function(){a=!1};this.next=function(){var b=a?null:c;a=!0;return b}}function q(c,a,b){this.reset=function(){c.reset()};this.next=function(){for(var d=c.next();d;){d.nodeType===Node.ELEMENT_NODE&&(d=d.getAttributeNodeNS(a,b));if(d)break;d=c.next()}return d}}function p(c,a){var b=c.next(),d=null;this.reset=function(){c.reset();b=c.next();d=null};this.next=function(){for(;b;){if(d)if(a&&
d.firstChild)d=d.firstChild;else{for(;!d.nextSibling&&d!==b;)d=d.parentNode;d===b?b=c.next():d=d.nextSibling}else{do(d=b.firstChild)||(b=c.next());while(b&&!d)}if(d&&d.nodeType===Node.ELEMENT_NODE)return d}return null}}function n(c,a){this.reset=function(){c.reset()};this.next=function(){for(var b=c.next();b&&!a(b);)b=c.next();return b}}function c(c,a,b){a=a.split(":",2);var d=b(a[0]),l=a[1];return new n(c,function(a){return a.localName===l&&a.namespaceURI===d})}function m(c,a,b){var d=new f,l=r(d,
a,b),h=a.value;return void 0===h?new n(c,function(a){d.setNode(a);l.reset();return null!==l.next()}):new n(c,function(a){d.setNode(a);l.reset();return(a=l.next())?a.nodeValue===h:!1})}var r,d;d=function(c,a,b){for(var d=a,l=c.length,f=0;d<l;)"]"===c[d]?(f-=1,0>=f&&b.push(k(c.substring(a,d)))):"["===c[d]&&(0>=f&&(a=d+1),f+=1),d+=1;return d};r=function(d,a,b){var g,l,f,h;for(g=0;g<a.steps.length;g+=1){f=a.steps[g];l=f.location;if(""===l)d=new p(d,!1);else if("@"===l[0]){l=l.substr(1).split(":",2);h=
b(l[0]);if(!h)throw"No namespace associated with the prefix "+l[0];d=new q(d,h,l[1])}else"."!==l&&(d=new p(d,!1),-1!==l.indexOf(":")&&(d=c(d,l,b)));for(l=0;l<f.predicates.length;l+=1)h=f.predicates[l],d=m(d,h,b)}return d};return{getODFElementsWithXPath:function(c,a,b){var d=c.ownerDocument,l=[],h=null;if(d&&"function"===typeof d.evaluate)for(b=d.evaluate(a,c,b,XPathResult.UNORDERED_NODE_ITERATOR_TYPE,null),h=b.iterateNext();null!==h;)h.nodeType===Node.ELEMENT_NODE&&l.push(h),h=b.iterateNext();else{l=
new f;l.setNode(c);c=k(a);l=r(l,c,b);c=[];for(b=l.next();b;)c.push(b),b=l.next();l=c}return l}}}xmldom.XPath=createXPathSingleton();
// Input 24
runtime.loadClass("core.DomUtils");
core.Cursor=function(h,k){function f(a){a.parentNode&&(m.push(a.previousSibling),m.push(a.nextSibling),a.parentNode.removeChild(a))}function q(a,b,c){if(b.nodeType===Node.TEXT_NODE){runtime.assert(Boolean(b),"putCursorIntoTextNode: invalid container");var d=b.parentNode;runtime.assert(Boolean(d),"putCursorIntoTextNode: container without parent");runtime.assert(0<=c&&c<=b.length,"putCursorIntoTextNode: offset is out of bounds");0===c?d.insertBefore(a,b):(c!==b.length&&b.splitText(c),d.insertBefore(a,
b.nextSibling))}else b.nodeType===Node.ELEMENT_NODE&&b.insertBefore(a,b.childNodes.item(c));m.push(a.previousSibling);m.push(a.nextSibling)}var p=h.createElementNS("urn:webodf:names:cursor","cursor"),n=h.createElementNS("urn:webodf:names:cursor","anchor"),c,m=[],r=h.createRange(),d,e=new core.DomUtils;this.getNode=function(){return p};this.getAnchorNode=function(){return n.parentNode?n:p};this.getSelectedRange=function(){d?(r.setStartBefore(p),r.collapse(!0)):(r.setStartAfter(c?n:p),r.setEndBefore(c?
p:n));return r};this.setSelectedRange=function(a,b){r&&r!==a&&r.detach();r=a;c=!1!==b;(d=a.collapsed)?(f(n),f(p),q(p,a.startContainer,a.startOffset)):(f(n),f(p),q(c?p:n,a.endContainer,a.endOffset),q(c?n:p,a.startContainer,a.startOffset));m.forEach(e.normalizeTextNodes);m.length=0};this.hasForwardSelection=function(){return c};this.remove=function(){f(p);m.forEach(e.normalizeTextNodes);m.length=0};p.setAttributeNS("urn:webodf:names:cursor","memberId",k);n.setAttributeNS("urn:webodf:names:cursor","memberId",
k)};
// Input 25
runtime.loadClass("core.PositionIterator");core.PositionFilter=function(){};core.PositionFilter.FilterResult={FILTER_ACCEPT:1,FILTER_REJECT:2,FILTER_SKIP:3};core.PositionFilter.prototype.acceptPosition=function(h){};(function(){return core.PositionFilter})();
// Input 26
runtime.loadClass("core.PositionFilter");core.PositionFilterChain=function(){var h={},k=core.PositionFilter.FilterResult.FILTER_ACCEPT,f=core.PositionFilter.FilterResult.FILTER_REJECT;this.acceptPosition=function(q){for(var p in h)if(h.hasOwnProperty(p)&&h[p].acceptPosition(q)===f)return f;return k};this.addFilter=function(f,k){h[f]=k};this.removeFilter=function(f){delete h[f]}};
// Input 27
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
gui.AnnotatableCanvas=function(){};gui.AnnotatableCanvas.prototype.refreshSize=function(){};gui.AnnotatableCanvas.prototype.getZoomLevel=function(){};gui.AnnotatableCanvas.prototype.getSizer=function(){};
gui.AnnotationViewManager=function(h,k,f,q){function p(a){var c=a.node,l=a.end;a=d.createRange();l&&(a.setStart(c,c.childNodes.length),a.setEnd(l,0),l=e.getTextNodes(a,!1),l.forEach(function(a){var b=d.createElement("span"),e=c.getAttributeNS(odf.Namespaces.officens,"name");b.className="annotationHighlight";b.setAttribute("annotation",e);a.parentNode.insertBefore(b,a);b.appendChild(a)}));a.detach()}function n(b){var c=h.getSizer();b?(f.style.display="inline-block",c.style.paddingRight=a.getComputedStyle(f).width):
(f.style.display="none",c.style.paddingRight=0);h.refreshSize()}function c(){r.sort(function(a,c){return a.node.compareDocumentPosition(c.node)===Node.DOCUMENT_POSITION_FOLLOWING?-1:1})}function m(){var a;for(a=0;a<r.length;a+=1){var c=r[a],d=c.node.parentNode,e=d.nextElementSibling,m=e.nextElementSibling,n=d.parentNode,k=0,k=r[r.indexOf(c)-1],p=void 0,c=h.getZoomLevel();d.style.left=(f.getBoundingClientRect().left-n.getBoundingClientRect().left)/c+"px";d.style.width=f.getBoundingClientRect().width/
c+"px";e.style.width=parseFloat(d.style.left)-30+"px";k&&(p=k.node.parentNode.getBoundingClientRect(),20>=(n.getBoundingClientRect().top-p.bottom)/c?d.style.top=Math.abs(n.getBoundingClientRect().top-p.bottom)/c+20+"px":d.style.top="0px");m.style.left=e.getBoundingClientRect().width/c+"px";var e=m.style,n=m.getBoundingClientRect().left/c,k=m.getBoundingClientRect().top/c,p=d.getBoundingClientRect().left/c,q=d.getBoundingClientRect().top/c,s=0,L=0,s=p-n,s=s*s,L=q-k,L=L*L,n=Math.sqrt(s+L);e.width=n+
"px";k=Math.asin((d.getBoundingClientRect().top-m.getBoundingClientRect().top)/(c*parseFloat(m.style.width)));m.style.transform="rotate("+k+"rad)";m.style.MozTransform="rotate("+k+"rad)";m.style.WebkitTransform="rotate("+k+"rad)";m.style.msTransform="rotate("+k+"rad)"}}var r=[],d=k.ownerDocument,e=new odf.OdfUtils,a=runtime.getWindow();runtime.assert(Boolean(a),"Expected to be run in an environment which has a global window, like a browser.");this.rerenderAnnotations=m;this.getMinimumHeightForAnnotationPane=
function(){return"none"!==f.style.display&&0<r.length?(r[r.length-1].node.parentNode.getBoundingClientRect().bottom-f.getBoundingClientRect().top)/h.getZoomLevel()+"px":null};this.addAnnotation=function(a){n(!0);r.push({node:a.node,end:a.end});c();var g=d.createElement("div"),e=d.createElement("div"),f=d.createElement("div"),h=d.createElement("div"),k;k=a.node;g.className="annotationWrapper";k.parentNode.insertBefore(g,k);e.className="annotationNote";e.appendChild(k);q&&(k=d.createElement("div"),
k.className="annotationRemoveButton",e.appendChild(k));f.className="annotationConnector horizontal";h.className="annotationConnector angular";g.appendChild(e);g.appendChild(f);g.appendChild(h);a.end&&p(a);m()};this.forgetAnnotations=function(){for(;r.length;){var a=r[0],c=r.indexOf(a),e=a.node,f=e.parentNode.parentNode;"div"===f.localName&&(f.parentNode.insertBefore(e,f),f.parentNode.removeChild(f));a=a.node.getAttributeNS(odf.Namespaces.officens,"name");a=d.querySelectorAll('span.annotationHighlight[annotation="'+
a+'"]');f=e=void 0;for(e=0;e<a.length;e+=1){for(f=a.item(e);f.firstChild;)f.parentNode.insertBefore(f.firstChild,f);f.parentNode.removeChild(f)}-1!==c&&r.splice(c,1);0===r.length&&n(!1)}}};
// Input 28
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.Cursor");runtime.loadClass("core.DomUtils");runtime.loadClass("core.PositionIterator");runtime.loadClass("core.PositionFilter");runtime.loadClass("core.LoopWatchDog");runtime.loadClass("odf.OdfUtils");
gui.SelectionMover=function(h,k){function f(){w.setUnfilteredPosition(h.getNode(),0);return w}function q(a,b){var c,d=null;a&&0<a.length&&(c=b?a.item(a.length-1):a.item(0));c&&(d={top:c.top,left:b?c.right:c.left,bottom:c.bottom});return d}function p(a,b,c,d){var g=a.nodeType;c.setStart(a,b);c.collapse(!d);d=q(c.getClientRects(),!0===d);!d&&0<b&&(c.setStart(a,b-1),c.setEnd(a,b),d=q(c.getClientRects(),!0));d||(g===Node.ELEMENT_NODE&&0<b&&a.childNodes.length>=b?d=p(a,b-1,c,!0):a.nodeType===Node.TEXT_NODE&&
0<b?d=p(a,b-1,c,!0):a.previousSibling?d=p(a.previousSibling,a.previousSibling.nodeType===Node.TEXT_NODE?a.previousSibling.textContent.length:a.previousSibling.childNodes.length,c,!0):a.parentNode&&a.parentNode!==k?d=p(a.parentNode,0,c,!1):(c.selectNode(k),d=q(c.getClientRects(),!1)));runtime.assert(Boolean(d),"No visible rectangle found");return d}function n(a,b,c){var d=a,g=f(),e,l=k.ownerDocument.createRange(),m=h.getSelectedRange().cloneRange(),n;for(e=p(g.container(),g.unfilteredDomOffset(),l);0<
d&&c();)d-=1;b?(b=g.container(),g=g.unfilteredDomOffset(),-1===x.comparePoints(m.startContainer,m.startOffset,b,g)?(m.setStart(b,g),n=!1):m.setEnd(b,g)):(m.setStart(g.container(),g.unfilteredDomOffset()),m.collapse(!0));h.setSelectedRange(m,n);g=f();m=p(g.container(),g.unfilteredDomOffset(),l);if(m.top===e.top||void 0===y)y=m.left;runtime.clearTimeout(v);v=runtime.setTimeout(function(){y=void 0},2E3);l.detach();return a-d}function c(a){var b=f();return a.acceptPosition(b)===t&&(b.setUnfilteredPosition(h.getAnchorNode(),
0),a.acceptPosition(b)===t)?!0:!1}function m(a,b,c){for(var d=new core.LoopWatchDog(1E4),g=0,e=0,f=0<=b?1:-1,l=0<=b?a.nextPosition:a.previousPosition;0!==b&&l();)d.check(),e+=f,c.acceptPosition(a)===t&&(b-=f,g+=e,e=0);return g}function r(a,b,c){for(var d=f(),g=new core.LoopWatchDog(1E4),e=0,l=0;0<a&&d.nextPosition();)g.check(),c.acceptPosition(d)===t&&(e+=1,b.acceptPosition(d)===t&&(l+=e,e=0,a-=1));return l}function d(a,b,c){for(var d=f(),g=new core.LoopWatchDog(1E4),e=0,l=0;0<a&&d.previousPosition();)g.check(),
c.acceptPosition(d)===t&&(e+=1,b.acceptPosition(d)===t&&(l+=e,e=0,a-=1));return l}function e(a,b){var c=f();return m(c,a,b)}function a(a,b,c){var d=f(),g=u.getParagraphElement(d.getCurrentNode()),e=0;d.setUnfilteredPosition(a,b);c.acceptPosition(d)!==t&&(e=m(d,-1,c),0===e||g&&g!==u.getParagraphElement(d.getCurrentNode()))&&(d.setUnfilteredPosition(a,b),e=m(d,1,c));return e}function b(a,b){var c=f(),d=0,g=0,e=0>a?-1:1;for(a=Math.abs(a);0<a;){for(var l=b,h=e,m=c,n=m.container(),r=0,q=null,v=void 0,
u=10,x=void 0,w=0,F=void 0,G=void 0,V=void 0,x=void 0,da=k.ownerDocument.createRange(),D=new core.LoopWatchDog(1E4),x=p(n,m.unfilteredDomOffset(),da),F=x.top,G=void 0===y?x.left:y,V=F;!0===(0>h?m.previousPosition():m.nextPosition());)if(D.check(),l.acceptPosition(m)===t&&(r+=1,n=m.container(),x=p(n,m.unfilteredDomOffset(),da),x.top!==F)){if(x.top!==V&&V!==F)break;V=x.top;x=Math.abs(G-x.left);if(null===q||x<u)q=n,v=m.unfilteredDomOffset(),u=x,w=r}null!==q?(m.setUnfilteredPosition(q,v),r=w):r=0;da.detach();
d+=r;if(0===d)break;g+=d;a-=1}return g*e}function g(a,b){var c,d,g,e,l=f(),h=u.getParagraphElement(l.getCurrentNode()),m=0,n=k.ownerDocument.createRange();0>a?(c=l.previousPosition,d=-1):(c=l.nextPosition,d=1);for(g=p(l.container(),l.unfilteredDomOffset(),n);c.call(l);)if(b.acceptPosition(l)===t){if(u.getParagraphElement(l.getCurrentNode())!==h)break;e=p(l.container(),l.unfilteredDomOffset(),n);if(e.bottom!==g.bottom&&(g=e.top>=g.top&&e.bottom<g.bottom||e.top<=g.top&&e.bottom>g.bottom,!g))break;m+=
d;g=e}n.detach();return m}function l(a,b,c){runtime.assert(null!==a,"SelectionMover.countStepsToPosition called with element===null");var d=f(),g=d.container(),e=d.unfilteredDomOffset(),l=0,h=new core.LoopWatchDog(1E4);for(d.setUnfilteredPosition(a,b);c.acceptPosition(d)!==t&&d.previousPosition();)h.check();a=d.container();runtime.assert(Boolean(a),"SelectionMover.countStepsToPosition: positionIterator.container() returned null");b=d.unfilteredDomOffset();for(d.setUnfilteredPosition(g,e);c.acceptPosition(d)!==
t&&d.previousPosition();)h.check();g=x.comparePoints(a,b,d.container(),d.unfilteredDomOffset());if(0>g)for(;d.nextPosition()&&(h.check(),c.acceptPosition(d)===t&&(l+=1),d.container()!==a||d.unfilteredDomOffset()!==b););else if(0<g)for(;d.previousPosition()&&(h.check(),c.acceptPosition(d)!==t||(l-=1,d.container()!==a||d.unfilteredDomOffset()!==b)););return l}var u=new odf.OdfUtils,x=new core.DomUtils,w,y,v,t=core.PositionFilter.FilterResult.FILTER_ACCEPT;this.movePointForward=function(a,b){return n(a,
b||!1,w.nextPosition)};this.movePointBackward=function(a,b){return n(a,b||!1,w.previousPosition)};this.getStepCounter=function(){return{countSteps:e,convertForwardStepsBetweenFilters:r,convertBackwardStepsBetweenFilters:d,countLinesSteps:b,countStepsToLineBoundary:g,countStepsToPosition:l,isPositionWalkable:c,countPositionsToNearestStep:a}};(function(){w=gui.SelectionMover.createPositionIterator(k);var a=k.ownerDocument.createRange();a.setStart(w.container(),w.unfilteredDomOffset());a.collapse(!0);
h.setSelectedRange(a)})()};gui.SelectionMover.createPositionIterator=function(h){var k=new function(){this.acceptNode=function(f){return f&&"urn:webodf:names:cursor"!==f.namespaceURI&&"urn:webodf:names:editinfo"!==f.namespaceURI?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}};return new core.PositionIterator(h,5,k,!1)};(function(){return gui.SelectionMover})();
// Input 29
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
odf.OdfNodeFilter=function(){this.acceptNode=function(h){return"http://www.w3.org/1999/xhtml"===h.namespaceURI?NodeFilter.FILTER_SKIP:h.namespaceURI&&h.namespaceURI.match(/^urn:webodf:/)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}};
// Input 30
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.OdfUtils");runtime.loadClass("xmldom.XPath");runtime.loadClass("core.CSSUnits");odf.StyleTreeNode=function(h){this.derivedStyles={};this.element=h};
odf.Style2CSS=function(){function h(a){var b,c,d,g={};if(!a)return g;for(a=a.firstElementChild;a;){if(c=a.namespaceURI!==l||"style"!==a.localName&&"default-style"!==a.localName?a.namespaceURI===w&&"list-style"===a.localName?"list":a.namespaceURI!==l||"page-layout"!==a.localName&&"default-page-layout"!==a.localName?void 0:"page":a.getAttributeNS(l,"family"))(b=a.getAttributeNS(l,"name"))||(b=""),g.hasOwnProperty(c)?d=g[c]:g[c]=d={},d[b]=a;a=a.nextElementSibling}return g}function k(a,b){if(a.hasOwnProperty(b))return a[b];
var c,d=null;for(c in a)if(a.hasOwnProperty(c)&&(d=k(a[c].derivedStyles,b)))break;return d}function f(a,b,c){var d,g,e;if(!b.hasOwnProperty(a))return null;d=new odf.StyleTreeNode(b[a]);g=d.element.getAttributeNS(l,"parent-style-name");e=null;g&&(e=k(c,g)||f(g,b,c));e?e.derivedStyles[a]=d:c[a]=d;delete b[a];return d}function q(a,b){for(var c in a)a.hasOwnProperty(c)&&f(c,a,b)}function p(a,b,c){var d=[];c=c.derivedStyles;var g;var e=t[a],l;void 0===e?b=null:(l=b?"["+e+'|style-name="'+b+'"]':"","presentation"===
e&&(e="draw",l=b?'[presentation|style-name="'+b+'"]':""),b=e+"|"+s[a].join(l+","+e+"|")+l);null!==b&&d.push(b);for(g in c)c.hasOwnProperty(g)&&(b=p(a,g,c[g]),d=d.concat(b));return d}function n(a,b,c){for(a=a&&a.firstElementChild;a&&(a.namespaceURI!==b||a.localName!==c);)a=a.nextElementSibling;return a}function c(a,b){var c="",d,g,e;for(d=0;d<b.length;d+=1)if(g=b[d],e=a.getAttributeNS(g[0],g[1])){e=e.trim();if(E.hasOwnProperty(g[1])){var l=e.indexOf(" "),f=void 0,h=void 0;-1!==l?(f=e.substring(0,l),
h=e.substring(l)):(f=e,h="");(f=Z.parseLength(f))&&"pt"===f.unit&&0.75>f.value&&(e="0.75pt"+h)}g[2]&&(c+=g[2]+":"+e+";")}return c}function m(a){return(a=n(a,l,"text-properties"))?Z.parseFoFontSize(a.getAttributeNS(b,"font-size")):null}function r(a,b,c,d){return b+b+c+c+d+d}function d(a,c,d,g){c='text|list[text|style-name="'+c+'"]';var e=d.getAttributeNS(w,"level");d=n(d,l,"list-level-properties");d=n(d,l,"list-level-label-alignment");var f,h;d&&(f=d.getAttributeNS(b,"text-indent"),h=d.getAttributeNS(b,
"margin-left"));f||(f="-0.6cm");d="-"===f.charAt(0)?f.substring(1):"-"+f;for(e=e&&parseInt(e,10);1<e;)c+=" > text|list-item > text|list",e-=1;if(h){e=c+" > text|list-item > *:not(text|list):first-child";e+="{";e=e+("margin-left:"+h+";")+"}";try{a.insertRule(e,a.cssRules.length)}catch(m){runtime.log("cannot load rule: "+e)}}g=c+" > text|list-item > *:not(text|list):first-child:before{"+g+";";g=g+"counter-increment:list;"+("margin-left:"+f+";");g+="width:"+d+";";g+="display:inline-block}";try{a.insertRule(g,
a.cssRules.length)}catch(k){runtime.log("cannot load rule: "+g)}}function e(f,h,k,q){if("list"===h)for(var s=q.element.firstChild,u,t;s;){if(s.namespaceURI===w)if(u=s,"list-level-style-number"===s.localName){var E=u;t=E.getAttributeNS(l,"num-format");var W=E.getAttributeNS(l,"num-suffix")||"",E=E.getAttributeNS(l,"num-prefix")||"",aa={1:"decimal",a:"lower-latin",A:"upper-latin",i:"lower-roman",I:"upper-roman"},$="";E&&($+=' "'+E+'"');$=aa.hasOwnProperty(t)?$+(" counter(list, "+aa[t]+")"):t?$+(' "'+
t+'"'):$+" ''";t="content:"+$+' "'+W+'"';d(f,k,u,t)}else"list-level-style-image"===s.localName?(t="content: none;",d(f,k,u,t)):"list-level-style-bullet"===s.localName&&(t="content: '"+u.getAttributeNS(w,"bullet-char")+"';",d(f,k,u,t));s=s.nextSibling}else if("page"===h){if(t=q.element,E=W=k="",s=n(t,l,"page-layout-properties"))if(u=t.getAttributeNS(l,"name"),k+=c(s,ia),(W=n(s,l,"background-image"))&&(E=W.getAttributeNS(y,"href"))&&(k=k+("background-image: url('odfkit:"+E+"');")+c(W,z)),"presentation"===
M)for(t=(t=n(t.parentNode.parentNode,g,"master-styles"))&&t.firstElementChild;t;){if(t.namespaceURI===l&&"master-page"===t.localName&&t.getAttributeNS(l,"page-layout-name")===u){E=t.getAttributeNS(l,"name");W="draw|page[draw|master-page-name="+E+"] {"+k+"}";E="office|body, draw|page[draw|master-page-name="+E+"] {"+c(s,xa)+" }";try{f.insertRule(W,f.cssRules.length),f.insertRule(E,f.cssRules.length)}catch(fa){throw fa;}}t=t.nextElementSibling}else if("text"===M){W="office|text {"+k+"}";E="office|body {width: "+
s.getAttributeNS(b,"page-width")+";}";try{f.insertRule(W,f.cssRules.length),f.insertRule(E,f.cssRules.length)}catch(O){throw O;}}}else{k=p(h,k,q).join(",");s="";if(u=n(q.element,l,"text-properties")){E=u;t=$="";W=1;u=""+c(E,L);aa=E.getAttributeNS(l,"text-underline-style");"solid"===aa&&($+=" underline");aa=E.getAttributeNS(l,"text-line-through-style");"solid"===aa&&($+=" line-through");$.length&&(u+="text-decoration:"+$+";");if($=E.getAttributeNS(l,"font-name")||E.getAttributeNS(b,"font-family"))aa=
R[$],u+="font-family: "+(aa||$)+";";aa=E.parentNode;if(E=m(aa)){for(;aa;){if(E=m(aa)){if("%"!==E.unit){t="font-size: "+E.value*W+E.unit+";";break}W*=E.value/100}E=aa;$=aa="";aa=null;"default-style"===E.localName?aa=null:(aa=E.getAttributeNS(l,"parent-style-name"),$=E.getAttributeNS(l,"family"),aa=G.getODFElementsWithXPath(S,aa?"//style:*[@style:name='"+aa+"'][@style:family='"+$+"']":"//style:default-style[@style:family='"+$+"']",odf.Namespaces.lookupNamespaceURI)[0])}t||(t="font-size: "+parseFloat(F)*
W+V.getUnits(F)+";");u+=t}s+=u}if(u=n(q.element,l,"paragraph-properties"))t=u,u=""+c(t,B),(W=n(t,l,"background-image"))&&(E=W.getAttributeNS(y,"href"))&&(u=u+("background-image: url('odfkit:"+E+"');")+c(W,z)),(t=t.getAttributeNS(b,"line-height"))&&"normal"!==t&&(t=Z.parseFoLineHeight(t),u="%"!==t.unit?u+("line-height: "+t.value+t.unit+";"):u+("line-height: "+t.value/100+";")),s+=u;if(u=n(q.element,l,"graphic-properties"))E=u,u=""+c(E,N),t=E.getAttributeNS(a,"opacity"),W=E.getAttributeNS(a,"fill"),
E=E.getAttributeNS(a,"fill-color"),"solid"===W||"hatch"===W?E&&"none"!==E?(t=isNaN(parseFloat(t))?1:parseFloat(t)/100,W=E.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,r),(E=(W=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(W))?{r:parseInt(W[1],16),g:parseInt(W[2],16),b:parseInt(W[3],16)}:null)&&(u+="background-color: rgba("+E.r+","+E.g+","+E.b+","+t+");")):u+="background: none;":"none"===W&&(u+="background: none;"),s+=u;if(u=n(q.element,l,"drawing-page-properties"))t=""+c(u,N),"true"===u.getAttributeNS(v,
"background-visible")&&(t+="background: none;"),s+=t;if(u=n(q.element,l,"table-cell-properties"))u=""+c(u,I),s+=u;if(u=n(q.element,l,"table-row-properties"))u=""+c(u,A),s+=u;if(u=n(q.element,l,"table-column-properties"))u=""+c(u,T),s+=u;if(u=n(q.element,l,"table-properties"))t=u,u=""+c(t,C),t=t.getAttributeNS(x,"border-model"),"collapsing"===t?u+="border-collapse:collapse;":"separating"===t&&(u+="border-collapse:separate;"),s+=u;if(0!==s.length)try{f.insertRule(k+"{"+s+"}",f.cssRules.length)}catch(ja){throw ja;
}}for(var ma in q.derivedStyles)q.derivedStyles.hasOwnProperty(ma)&&e(f,h,ma,q.derivedStyles[ma])}var a=odf.Namespaces.drawns,b=odf.Namespaces.fons,g=odf.Namespaces.officens,l=odf.Namespaces.stylens,u=odf.Namespaces.svgns,x=odf.Namespaces.tablens,w=odf.Namespaces.textns,y=odf.Namespaces.xlinkns,v=odf.Namespaces.presentationns,t={graphic:"draw","drawing-page":"draw",paragraph:"text",presentation:"presentation",ruby:"text",section:"text",table:"table","table-cell":"table","table-column":"table","table-row":"table",
text:"text",list:"text",page:"office"},s={graphic:"circle connected control custom-shape ellipse frame g line measure page page-thumbnail path polygon polyline rect regular-polygon".split(" "),paragraph:"alphabetical-index-entry-template h illustration-index-entry-template index-source-style object-index-entry-template p table-index-entry-template table-of-content-entry-template user-index-entry-template".split(" "),presentation:"caption circle connector control custom-shape ellipse frame g line measure page-thumbnail path polygon polyline rect regular-polygon".split(" "),
"drawing-page":"caption circle connector control page custom-shape ellipse frame g line measure page-thumbnail path polygon polyline rect regular-polygon".split(" "),ruby:["ruby","ruby-text"],section:"alphabetical-index bibliography illustration-index index-title object-index section table-of-content table-index user-index".split(" "),table:["background","table"],"table-cell":"body covered-table-cell even-columns even-rows first-column first-row last-column last-row odd-columns odd-rows table-cell".split(" "),
"table-column":["table-column"],"table-row":["table-row"],text:"a index-entry-chapter index-entry-link-end index-entry-link-start index-entry-page-number index-entry-span index-entry-tab-stop index-entry-text index-title-template linenumbering-configuration list-level-style-number list-level-style-bullet outline-level-style span".split(" "),list:["list-item"]},L=[[b,"color","color"],[b,"background-color","background-color"],[b,"font-weight","font-weight"],[b,"font-style","font-style"]],z=[[l,"repeat",
"background-repeat"]],B=[[b,"background-color","background-color"],[b,"text-align","text-align"],[b,"text-indent","text-indent"],[b,"padding","padding"],[b,"padding-left","padding-left"],[b,"padding-right","padding-right"],[b,"padding-top","padding-top"],[b,"padding-bottom","padding-bottom"],[b,"border-left","border-left"],[b,"border-right","border-right"],[b,"border-top","border-top"],[b,"border-bottom","border-bottom"],[b,"margin","margin"],[b,"margin-left","margin-left"],[b,"margin-right","margin-right"],
[b,"margin-top","margin-top"],[b,"margin-bottom","margin-bottom"],[b,"border","border"]],N=[[b,"background-color","background-color"],[b,"min-height","min-height"],[a,"stroke","border"],[u,"stroke-color","border-color"],[u,"stroke-width","border-width"],[b,"border","border"],[b,"border-left","border-left"],[b,"border-right","border-right"],[b,"border-top","border-top"],[b,"border-bottom","border-bottom"]],I=[[b,"background-color","background-color"],[b,"border-left","border-left"],[b,"border-right",
"border-right"],[b,"border-top","border-top"],[b,"border-bottom","border-bottom"],[b,"border","border"]],T=[[l,"column-width","width"]],A=[[l,"row-height","height"],[b,"keep-together",null]],C=[[l,"width","width"],[b,"margin-left","margin-left"],[b,"margin-right","margin-right"],[b,"margin-top","margin-top"],[b,"margin-bottom","margin-bottom"]],ia=[[b,"background-color","background-color"],[b,"padding","padding"],[b,"padding-left","padding-left"],[b,"padding-right","padding-right"],[b,"padding-top",
"padding-top"],[b,"padding-bottom","padding-bottom"],[b,"border","border"],[b,"border-left","border-left"],[b,"border-right","border-right"],[b,"border-top","border-top"],[b,"border-bottom","border-bottom"],[b,"margin","margin"],[b,"margin-left","margin-left"],[b,"margin-right","margin-right"],[b,"margin-top","margin-top"],[b,"margin-bottom","margin-bottom"]],xa=[[b,"page-width","width"],[b,"page-height","height"]],E={border:!0,"border-left":!0,"border-right":!0,"border-top":!0,"border-bottom":!0,
"stroke-width":!0},R={},Z=new odf.OdfUtils,M,S,F,G=xmldom.XPath,V=new core.CSSUnits;this.style2css=function(a,b,c,d,g){for(var f,l,m,n;b.cssRules.length;)b.deleteRule(b.cssRules.length-1);f=null;d&&(f=d.ownerDocument,S=d.parentNode);g&&(f=g.ownerDocument,S=g.parentNode);if(f)for(n in odf.Namespaces.forEachPrefix(function(a,c){l="@namespace "+a+" url("+c+");";try{b.insertRule(l,b.cssRules.length)}catch(d){}}),R=c,M=a,F=runtime.getWindow().getComputedStyle(document.body,null).getPropertyValue("font-size")||
"12pt",a=h(d),d=h(g),g={},t)if(t.hasOwnProperty(n))for(m in c=g[n]={},q(a[n],c),q(d[n],c),c)c.hasOwnProperty(m)&&e(b,n,m,c[m])}};
// Input 31
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("xmldom.XPath");runtime.loadClass("odf.Namespaces");
odf.StyleInfo=function(){function h(a,b){var c,d,g,e,f,l=0;if(c=B[a.localName])if(g=c[a.namespaceURI])l=g.length;for(c=0;c<l;c+=1)d=g[c],e=d.ns,f=d.localname,(d=a.getAttributeNS(e,f))&&a.setAttributeNS(e,L[e]+f,b+d);for(g=a.firstElementChild;g;)h(g,b),g=g.nextElementSibling}function k(a,b){var c,d,g,e,f,l=0;if(c=B[a.localName])if(g=c[a.namespaceURI])l=g.length;for(c=0;c<l;c+=1)if(d=g[c],e=d.ns,f=d.localname,d=a.getAttributeNS(e,f))d=d.replace(b,""),a.setAttributeNS(e,L[e]+f,d);for(g=a.firstElementChild;g;)k(g,
b),g=g.nextElementSibling}function f(a,b){var c,d,g,e,f,l=0;if(c=B[a.localName])if(g=c[a.namespaceURI])l=g.length;for(c=0;c<l;c+=1)if(e=g[c],d=e.ns,f=e.localname,d=a.getAttributeNS(d,f))b=b||{},e=e.keyname,b.hasOwnProperty(e)?b[e][d]=1:(f={},f[d]=1,b[e]=f);return b}function q(a,b){var c,d;f(a,b);for(c=a.firstChild;c;)c.nodeType===Node.ELEMENT_NODE&&(d=c,q(d,b)),c=c.nextSibling}function p(a,b,c){this.key=a;this.name=b;this.family=c;this.requires={}}function n(a,b,c){var d=a+'"'+b,g=c[d];g||(g=c[d]=
new p(d,a,b));return g}function c(a,b,d){var g,e,f,l,h,m=0;g=a.getAttributeNS(v,"name");l=a.getAttributeNS(v,"family");g&&l&&(b=n(g,l,d));if(b){if(g=B[a.localName])if(f=g[a.namespaceURI])m=f.length;for(g=0;g<m;g+=1)if(l=f[g],e=l.ns,h=l.localname,e=a.getAttributeNS(e,h))l=l.keyname,l=n(e,l,d),b.requires[l.key]=l}for(a=a.firstElementChild;a;)c(a,b,d),a=a.nextElementSibling;return d}function m(a,b){var c=b[a.family];c||(c=b[a.family]={});c[a.name]=1;Object.keys(a.requires).forEach(function(c){m(a.requires[c],
b)})}function r(a,b){var d=c(a,null,{});Object.keys(d).forEach(function(a){a=d[a];var c=b[a.family];c&&c.hasOwnProperty(a.name)&&m(a,b)})}function d(a,b){function c(b){(b=f.getAttributeNS(v,b))&&(a[b]=!0)}var g=["font-name","font-name-asian","font-name-complex"],e,f;for(e=b&&b.firstElementChild;e;)f=e,g.forEach(c),d(a,f),e=e.nextElementSibling}function e(a,b){function c(a){var d=f.getAttributeNS(v,a);d&&b.hasOwnProperty(d)&&f.setAttributeNS(v,"style:"+a,b[d])}var d=["font-name","font-name-asian",
"font-name-complex"],g,f;for(g=a&&a.firstElementChild;g;)f=g,d.forEach(c),e(f,b),g=g.nextElementSibling}var a=odf.Namespaces.chartns,b=odf.Namespaces.dbns,g=odf.Namespaces.dr3dns,l=odf.Namespaces.drawns,u=odf.Namespaces.formns,x=odf.Namespaces.numberns,w=odf.Namespaces.officens,y=odf.Namespaces.presentationns,v=odf.Namespaces.stylens,t=odf.Namespaces.tablens,s=odf.Namespaces.textns,L={"urn:oasis:names:tc:opendocument:xmlns:chart:1.0":"chart:","urn:oasis:names:tc:opendocument:xmlns:database:1.0":"db:",
"urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0":"dr3d:","urn:oasis:names:tc:opendocument:xmlns:drawing:1.0":"draw:","urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0":"fo:","urn:oasis:names:tc:opendocument:xmlns:form:1.0":"form:","urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0":"number:","urn:oasis:names:tc:opendocument:xmlns:office:1.0":"office:","urn:oasis:names:tc:opendocument:xmlns:presentation:1.0":"presentation:","urn:oasis:names:tc:opendocument:xmlns:style:1.0":"style:","urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0":"svg:",
"urn:oasis:names:tc:opendocument:xmlns:table:1.0":"table:","urn:oasis:names:tc:opendocument:xmlns:text:1.0":"chart:","http://www.w3.org/XML/1998/namespace":"xml:"},z={text:[{ens:v,en:"tab-stop",ans:v,a:"leader-text-style"},{ens:v,en:"drop-cap",ans:v,a:"style-name"},{ens:s,en:"notes-configuration",ans:s,a:"citation-body-style-name"},{ens:s,en:"notes-configuration",ans:s,a:"citation-style-name"},{ens:s,en:"a",ans:s,a:"style-name"},{ens:s,en:"alphabetical-index",ans:s,a:"style-name"},{ens:s,en:"linenumbering-configuration",
ans:s,a:"style-name"},{ens:s,en:"list-level-style-number",ans:s,a:"style-name"},{ens:s,en:"ruby-text",ans:s,a:"style-name"},{ens:s,en:"span",ans:s,a:"style-name"},{ens:s,en:"a",ans:s,a:"visited-style-name"},{ens:v,en:"text-properties",ans:v,a:"text-line-through-text-style"},{ens:s,en:"alphabetical-index-source",ans:s,a:"main-entry-style-name"},{ens:s,en:"index-entry-bibliography",ans:s,a:"style-name"},{ens:s,en:"index-entry-chapter",ans:s,a:"style-name"},{ens:s,en:"index-entry-link-end",ans:s,a:"style-name"},
{ens:s,en:"index-entry-link-start",ans:s,a:"style-name"},{ens:s,en:"index-entry-page-number",ans:s,a:"style-name"},{ens:s,en:"index-entry-span",ans:s,a:"style-name"},{ens:s,en:"index-entry-tab-stop",ans:s,a:"style-name"},{ens:s,en:"index-entry-text",ans:s,a:"style-name"},{ens:s,en:"index-title-template",ans:s,a:"style-name"},{ens:s,en:"list-level-style-bullet",ans:s,a:"style-name"},{ens:s,en:"outline-level-style",ans:s,a:"style-name"}],paragraph:[{ens:l,en:"caption",ans:l,a:"text-style-name"},{ens:l,
en:"circle",ans:l,a:"text-style-name"},{ens:l,en:"connector",ans:l,a:"text-style-name"},{ens:l,en:"control",ans:l,a:"text-style-name"},{ens:l,en:"custom-shape",ans:l,a:"text-style-name"},{ens:l,en:"ellipse",ans:l,a:"text-style-name"},{ens:l,en:"frame",ans:l,a:"text-style-name"},{ens:l,en:"line",ans:l,a:"text-style-name"},{ens:l,en:"measure",ans:l,a:"text-style-name"},{ens:l,en:"path",ans:l,a:"text-style-name"},{ens:l,en:"polygon",ans:l,a:"text-style-name"},{ens:l,en:"polyline",ans:l,a:"text-style-name"},
{ens:l,en:"rect",ans:l,a:"text-style-name"},{ens:l,en:"regular-polygon",ans:l,a:"text-style-name"},{ens:w,en:"annotation",ans:l,a:"text-style-name"},{ens:u,en:"column",ans:u,a:"text-style-name"},{ens:v,en:"style",ans:v,a:"next-style-name"},{ens:t,en:"body",ans:t,a:"paragraph-style-name"},{ens:t,en:"even-columns",ans:t,a:"paragraph-style-name"},{ens:t,en:"even-rows",ans:t,a:"paragraph-style-name"},{ens:t,en:"first-column",ans:t,a:"paragraph-style-name"},{ens:t,en:"first-row",ans:t,a:"paragraph-style-name"},
{ens:t,en:"last-column",ans:t,a:"paragraph-style-name"},{ens:t,en:"last-row",ans:t,a:"paragraph-style-name"},{ens:t,en:"odd-columns",ans:t,a:"paragraph-style-name"},{ens:t,en:"odd-rows",ans:t,a:"paragraph-style-name"},{ens:s,en:"notes-configuration",ans:s,a:"default-style-name"},{ens:s,en:"alphabetical-index-entry-template",ans:s,a:"style-name"},{ens:s,en:"bibliography-entry-template",ans:s,a:"style-name"},{ens:s,en:"h",ans:s,a:"style-name"},{ens:s,en:"illustration-index-entry-template",ans:s,a:"style-name"},
{ens:s,en:"index-source-style",ans:s,a:"style-name"},{ens:s,en:"object-index-entry-template",ans:s,a:"style-name"},{ens:s,en:"p",ans:s,a:"style-name"},{ens:s,en:"table-index-entry-template",ans:s,a:"style-name"},{ens:s,en:"table-of-content-entry-template",ans:s,a:"style-name"},{ens:s,en:"table-index-entry-template",ans:s,a:"style-name"},{ens:s,en:"user-index-entry-template",ans:s,a:"style-name"},{ens:v,en:"page-layout-properties",ans:v,a:"register-truth-ref-style-name"}],chart:[{ens:a,en:"axis",ans:a,
a:"style-name"},{ens:a,en:"chart",ans:a,a:"style-name"},{ens:a,en:"data-label",ans:a,a:"style-name"},{ens:a,en:"data-point",ans:a,a:"style-name"},{ens:a,en:"equation",ans:a,a:"style-name"},{ens:a,en:"error-indicator",ans:a,a:"style-name"},{ens:a,en:"floor",ans:a,a:"style-name"},{ens:a,en:"footer",ans:a,a:"style-name"},{ens:a,en:"grid",ans:a,a:"style-name"},{ens:a,en:"legend",ans:a,a:"style-name"},{ens:a,en:"mean-value",ans:a,a:"style-name"},{ens:a,en:"plot-area",ans:a,a:"style-name"},{ens:a,en:"regression-curve",
ans:a,a:"style-name"},{ens:a,en:"series",ans:a,a:"style-name"},{ens:a,en:"stock-gain-marker",ans:a,a:"style-name"},{ens:a,en:"stock-loss-marker",ans:a,a:"style-name"},{ens:a,en:"stock-range-line",ans:a,a:"style-name"},{ens:a,en:"subtitle",ans:a,a:"style-name"},{ens:a,en:"title",ans:a,a:"style-name"},{ens:a,en:"wall",ans:a,a:"style-name"}],section:[{ens:s,en:"alphabetical-index",ans:s,a:"style-name"},{ens:s,en:"bibliography",ans:s,a:"style-name"},{ens:s,en:"illustration-index",ans:s,a:"style-name"},
{ens:s,en:"index-title",ans:s,a:"style-name"},{ens:s,en:"object-index",ans:s,a:"style-name"},{ens:s,en:"section",ans:s,a:"style-name"},{ens:s,en:"table-of-content",ans:s,a:"style-name"},{ens:s,en:"table-index",ans:s,a:"style-name"},{ens:s,en:"user-index",ans:s,a:"style-name"}],ruby:[{ens:s,en:"ruby",ans:s,a:"style-name"}],table:[{ens:b,en:"query",ans:b,a:"style-name"},{ens:b,en:"table-representation",ans:b,a:"style-name"},{ens:t,en:"background",ans:t,a:"style-name"},{ens:t,en:"table",ans:t,a:"style-name"}],
"table-column":[{ens:b,en:"column",ans:b,a:"style-name"},{ens:t,en:"table-column",ans:t,a:"style-name"}],"table-row":[{ens:b,en:"query",ans:b,a:"default-row-style-name"},{ens:b,en:"table-representation",ans:b,a:"default-row-style-name"},{ens:t,en:"table-row",ans:t,a:"style-name"}],"table-cell":[{ens:b,en:"column",ans:b,a:"default-cell-style-name"},{ens:t,en:"table-column",ans:t,a:"default-cell-style-name"},{ens:t,en:"table-row",ans:t,a:"default-cell-style-name"},{ens:t,en:"body",ans:t,a:"style-name"},
{ens:t,en:"covered-table-cell",ans:t,a:"style-name"},{ens:t,en:"even-columns",ans:t,a:"style-name"},{ens:t,en:"covered-table-cell",ans:t,a:"style-name"},{ens:t,en:"even-columns",ans:t,a:"style-name"},{ens:t,en:"even-rows",ans:t,a:"style-name"},{ens:t,en:"first-column",ans:t,a:"style-name"},{ens:t,en:"first-row",ans:t,a:"style-name"},{ens:t,en:"last-column",ans:t,a:"style-name"},{ens:t,en:"last-row",ans:t,a:"style-name"},{ens:t,en:"odd-columns",ans:t,a:"style-name"},{ens:t,en:"odd-rows",ans:t,a:"style-name"},
{ens:t,en:"table-cell",ans:t,a:"style-name"}],graphic:[{ens:g,en:"cube",ans:l,a:"style-name"},{ens:g,en:"extrude",ans:l,a:"style-name"},{ens:g,en:"rotate",ans:l,a:"style-name"},{ens:g,en:"scene",ans:l,a:"style-name"},{ens:g,en:"sphere",ans:l,a:"style-name"},{ens:l,en:"caption",ans:l,a:"style-name"},{ens:l,en:"circle",ans:l,a:"style-name"},{ens:l,en:"connector",ans:l,a:"style-name"},{ens:l,en:"control",ans:l,a:"style-name"},{ens:l,en:"custom-shape",ans:l,a:"style-name"},{ens:l,en:"ellipse",ans:l,a:"style-name"},
{ens:l,en:"frame",ans:l,a:"style-name"},{ens:l,en:"g",ans:l,a:"style-name"},{ens:l,en:"line",ans:l,a:"style-name"},{ens:l,en:"measure",ans:l,a:"style-name"},{ens:l,en:"page-thumbnail",ans:l,a:"style-name"},{ens:l,en:"path",ans:l,a:"style-name"},{ens:l,en:"polygon",ans:l,a:"style-name"},{ens:l,en:"polyline",ans:l,a:"style-name"},{ens:l,en:"rect",ans:l,a:"style-name"},{ens:l,en:"regular-polygon",ans:l,a:"style-name"},{ens:w,en:"annotation",ans:l,a:"style-name"}],presentation:[{ens:g,en:"cube",ans:y,
a:"style-name"},{ens:g,en:"extrude",ans:y,a:"style-name"},{ens:g,en:"rotate",ans:y,a:"style-name"},{ens:g,en:"scene",ans:y,a:"style-name"},{ens:g,en:"sphere",ans:y,a:"style-name"},{ens:l,en:"caption",ans:y,a:"style-name"},{ens:l,en:"circle",ans:y,a:"style-name"},{ens:l,en:"connector",ans:y,a:"style-name"},{ens:l,en:"control",ans:y,a:"style-name"},{ens:l,en:"custom-shape",ans:y,a:"style-name"},{ens:l,en:"ellipse",ans:y,a:"style-name"},{ens:l,en:"frame",ans:y,a:"style-name"},{ens:l,en:"g",ans:y,a:"style-name"},
{ens:l,en:"line",ans:y,a:"style-name"},{ens:l,en:"measure",ans:y,a:"style-name"},{ens:l,en:"page-thumbnail",ans:y,a:"style-name"},{ens:l,en:"path",ans:y,a:"style-name"},{ens:l,en:"polygon",ans:y,a:"style-name"},{ens:l,en:"polyline",ans:y,a:"style-name"},{ens:l,en:"rect",ans:y,a:"style-name"},{ens:l,en:"regular-polygon",ans:y,a:"style-name"},{ens:w,en:"annotation",ans:y,a:"style-name"}],"drawing-page":[{ens:l,en:"page",ans:l,a:"style-name"},{ens:y,en:"notes",ans:l,a:"style-name"},{ens:v,en:"handout-master",
ans:l,a:"style-name"},{ens:v,en:"master-page",ans:l,a:"style-name"}],"list-style":[{ens:s,en:"list",ans:s,a:"style-name"},{ens:s,en:"numbered-paragraph",ans:s,a:"style-name"},{ens:s,en:"list-item",ans:s,a:"style-override"},{ens:v,en:"style",ans:v,a:"list-style-name"}],data:[{ens:v,en:"style",ans:v,a:"data-style-name"},{ens:v,en:"style",ans:v,a:"percentage-data-style-name"},{ens:y,en:"date-time-decl",ans:v,a:"data-style-name"},{ens:s,en:"creation-date",ans:v,a:"data-style-name"},{ens:s,en:"creation-time",
ans:v,a:"data-style-name"},{ens:s,en:"database-display",ans:v,a:"data-style-name"},{ens:s,en:"date",ans:v,a:"data-style-name"},{ens:s,en:"editing-duration",ans:v,a:"data-style-name"},{ens:s,en:"expression",ans:v,a:"data-style-name"},{ens:s,en:"meta-field",ans:v,a:"data-style-name"},{ens:s,en:"modification-date",ans:v,a:"data-style-name"},{ens:s,en:"modification-time",ans:v,a:"data-style-name"},{ens:s,en:"print-date",ans:v,a:"data-style-name"},{ens:s,en:"print-time",ans:v,a:"data-style-name"},{ens:s,
en:"table-formula",ans:v,a:"data-style-name"},{ens:s,en:"time",ans:v,a:"data-style-name"},{ens:s,en:"user-defined",ans:v,a:"data-style-name"},{ens:s,en:"user-field-get",ans:v,a:"data-style-name"},{ens:s,en:"user-field-input",ans:v,a:"data-style-name"},{ens:s,en:"variable-get",ans:v,a:"data-style-name"},{ens:s,en:"variable-input",ans:v,a:"data-style-name"},{ens:s,en:"variable-set",ans:v,a:"data-style-name"}],"page-layout":[{ens:y,en:"notes",ans:v,a:"page-layout-name"},{ens:v,en:"handout-master",ans:v,
a:"page-layout-name"},{ens:v,en:"master-page",ans:v,a:"page-layout-name"}]},B,N=xmldom.XPath;this.collectUsedFontFaces=d;this.changeFontFaceNames=e;this.UsedStyleList=function(a,b){var c={};this.uses=function(a){var b=a.localName,d=a.getAttributeNS(l,"name")||a.getAttributeNS(v,"name");a="style"===b?a.getAttributeNS(v,"family"):a.namespaceURI===x?"data":b;return(a=c[a])?0<a[d]:!1};q(a,c);b&&r(b,c)};this.hasDerivedStyles=function(a,b,c){var d=c.getAttributeNS(v,"name");c=c.getAttributeNS(v,"family");
return N.getODFElementsWithXPath(a,"//style:*[@style:parent-style-name='"+d+"'][@style:family='"+c+"']",b).length?!0:!1};this.prefixStyleNames=function(a,b,c){var d;if(a){for(d=a.firstChild;d;){if(d.nodeType===Node.ELEMENT_NODE){var g=d,e=b,f=g.getAttributeNS(l,"name"),m=void 0;f?m=l:(f=g.getAttributeNS(v,"name"))&&(m=v);m&&g.setAttributeNS(m,L[m]+"name",e+f)}d=d.nextSibling}h(a,b);c&&h(c,b)}};this.removePrefixFromStyleNames=function(a,b,c){var d=RegExp("^"+b);if(a){for(b=a.firstChild;b;){if(b.nodeType===
Node.ELEMENT_NODE){var g=b,e=d,f=g.getAttributeNS(l,"name"),h=void 0;f?h=l:(f=g.getAttributeNS(v,"name"))&&(h=v);h&&(f=f.replace(e,""),g.setAttributeNS(h,L[h]+"name",f))}b=b.nextSibling}k(a,d);c&&k(c,d)}};this.determineStylesForNode=f;B=function(){var a,b,c,d,g,e={},f,l,h,m;for(c in z)if(z.hasOwnProperty(c))for(d=z[c],b=d.length,a=0;a<b;a+=1)g=d[a],h=g.en,m=g.ens,e.hasOwnProperty(h)?f=e[h]:e[h]=f={},f.hasOwnProperty(m)?l=f[m]:f[m]=l=[],l.push({ns:g.ans,localname:g.a,keyname:c});return e}()};
// Input 32
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.OdfUtils");
odf.TextSerializer=function(){function h(q){var p="",n=k.filter?k.filter.acceptNode(q):NodeFilter.FILTER_ACCEPT,c=q.nodeType,m;if(n===NodeFilter.FILTER_ACCEPT||n===NodeFilter.FILTER_SKIP)for(m=q.firstChild;m;)p+=h(m),m=m.nextSibling;n===NodeFilter.FILTER_ACCEPT&&(c===Node.ELEMENT_NODE&&f.isParagraph(q)?p+="\n":c===Node.TEXT_NODE&&q.textContent&&(p+=q.textContent));return p}var k=this,f=new odf.OdfUtils;this.filter=null;this.writeToString=function(f){if(!f)return"";f=h(f);"\n"===f[f.length-1]&&(f=
f.substr(0,f.length-1));return f}};
// Input 33
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.PositionFilter");runtime.loadClass("odf.OdfUtils");
ops.TextPositionFilter=function(h){function k(h,k,d){var e,a;if(k){if(f.isInlineRoot(k)&&f.isGroupingElement(d))return c;e=f.lookLeftForCharacter(k);if(1===e||2===e&&(f.scanRightForAnyCharacter(d)||f.scanRightForAnyCharacter(f.nextNode(h))))return n}e=null===k&&f.isParagraph(h);a=f.lookRightForCharacter(d);if(e)return a?n:f.scanRightForAnyCharacter(d)?c:n;if(!a)return c;k=k||f.previousNode(h);return f.scanLeftForAnyCharacter(k)?c:n}var f=new odf.OdfUtils,q=Node.ELEMENT_NODE,p=Node.TEXT_NODE,n=core.PositionFilter.FilterResult.FILTER_ACCEPT,
c=core.PositionFilter.FilterResult.FILTER_REJECT;this.acceptPosition=function(m){var r=m.container(),d=r.nodeType,e,a,b;if(d!==q&&d!==p)return c;if(d===p){if(!f.isGroupingElement(r.parentNode)||f.isWithinTrackedChanges(r.parentNode,h()))return c;d=m.unfilteredDomOffset();e=r.data;runtime.assert(d!==e.length,"Unexpected offset.");if(0<d){m=e[d-1];if(!f.isODFWhitespace(m))return n;if(1<d)if(m=e[d-2],!f.isODFWhitespace(m))a=n;else{if(!f.isODFWhitespace(e.substr(0,d)))return c}else b=f.previousNode(r),
f.scanLeftForNonSpace(b)&&(a=n);if(a===n)return f.isTrailingWhitespace(r,d)?c:n;a=e[d];return f.isODFWhitespace(a)?c:f.scanLeftForAnyCharacter(f.previousNode(r))?c:n}b=m.leftNode();a=r;r=r.parentNode;a=k(r,b,a)}else!f.isGroupingElement(r)||f.isWithinTrackedChanges(r,h())?a=c:(b=m.leftNode(),a=m.rightNode(),a=k(r,b,a));return a}};
// Input 34
"function"!==typeof Object.create&&(Object.create=function(h){var k=function(){};k.prototype=h;return new k});
xmldom.LSSerializer=function(){function h(f){var h=f||{},c=function(c){var a={},b;for(b in c)c.hasOwnProperty(b)&&(a[c[b]]=b);return a}(f),m=[h],k=[c],d=0;this.push=function(){d+=1;h=m[d]=Object.create(h);c=k[d]=Object.create(c)};this.pop=function(){m.pop();k.pop();d-=1;h=m[d];c=k[d]};this.getLocalNamespaceDefinitions=function(){return c};this.getQName=function(d){var a=d.namespaceURI,b=0,g;if(!a)return d.localName;if(g=c[a])return g+":"+d.localName;do{g||!d.prefix?(g="ns"+b,b+=1):g=d.prefix;if(h[g]===
a)break;if(!h[g]){h[g]=a;c[a]=g;break}g=null}while(null===g);return g+":"+d.localName}}function k(f){return f.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;")}function f(h,n){var c="",m=q.filter?q.filter.acceptNode(n):NodeFilter.FILTER_ACCEPT,r;if(m===NodeFilter.FILTER_ACCEPT&&n.nodeType===Node.ELEMENT_NODE){h.push();r=h.getQName(n);var d,e=n.attributes,a,b,g,l="",u;d="<"+r;a=e.length;for(b=0;b<a;b+=1)g=e.item(b),"http://www.w3.org/2000/xmlns/"!==
g.namespaceURI&&(u=q.filter?q.filter.acceptNode(g):NodeFilter.FILTER_ACCEPT,u===NodeFilter.FILTER_ACCEPT&&(u=h.getQName(g),g="string"===typeof g.value?k(g.value):g.value,l+=" "+(u+'="'+g+'"')));a=h.getLocalNamespaceDefinitions();for(b in a)a.hasOwnProperty(b)&&((e=a[b])?"xmlns"!==e&&(d+=" xmlns:"+a[b]+'="'+b+'"'):d+=' xmlns="'+b+'"');c+=d+(l+">")}if(m===NodeFilter.FILTER_ACCEPT||m===NodeFilter.FILTER_SKIP){for(m=n.firstChild;m;)c+=f(h,m),m=m.nextSibling;n.nodeValue&&(c+=k(n.nodeValue))}r&&(c+="</"+
r+">",h.pop());return c}var q=this;this.filter=null;this.writeToString=function(k,n){if(!k)return"";var c=new h(n);return f(c,k)}};
// Input 35
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");runtime.loadClass("xmldom.LSSerializer");runtime.loadClass("odf.OdfNodeFilter");runtime.loadClass("odf.TextSerializer");
gui.Clipboard=function(){var h,k,f;this.setDataFromRange=function(f,p){var n=!0,c,m=f.clipboardData;c=runtime.getWindow();var r=p.startContainer.ownerDocument;!m&&c&&(m=c.clipboardData);m?(r=r.createElement("span"),r.appendChild(p.cloneContents()),c=m.setData("text/plain",k.writeToString(r)),n=n&&c,c=m.setData("text/html",h.writeToString(r,odf.Namespaces.namespaceMap)),n=n&&c,f.preventDefault()):n=!1;return n};h=new xmldom.LSSerializer;k=new odf.TextSerializer;f=new odf.OdfNodeFilter;h.filter=f;k.filter=
f};
// Input 36
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.Base64");runtime.loadClass("core.Zip");runtime.loadClass("core.DomUtils");runtime.loadClass("xmldom.LSSerializer");runtime.loadClass("odf.StyleInfo");runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.OdfNodeFilter");
(function(){function h(a,b,c){for(a=a?a.firstChild:null;a;){if(a.localName===c&&a.namespaceURI===b)return a;a=a.nextSibling}return null}function k(a){var b,c=r.length;for(b=0;b<c;b+=1)if("urn:oasis:names:tc:opendocument:xmlns:office:1.0"===a.namespaceURI&&a.localName===r[b])return b;return-1}function f(a,b){var c=new n.UsedStyleList(a,b),d=new odf.OdfNodeFilter;this.acceptNode=function(a){var e=d.acceptNode(a);e===NodeFilter.FILTER_ACCEPT&&a.parentNode===b&&a.nodeType===Node.ELEMENT_NODE&&(e=c.uses(a)?
NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT);return e}}function q(a,b){var c=new f(a,b);this.acceptNode=function(a){var b=c.acceptNode(a);b!==NodeFilter.FILTER_ACCEPT||!a.parentNode||a.parentNode.namespaceURI!==odf.Namespaces.textns||"s"!==a.parentNode.localName&&"tab"!==a.parentNode.localName||(b=NodeFilter.FILTER_REJECT);return b}}function p(a,b){if(b){var c=k(b),d,e=a.firstChild;if(-1!==c){for(;e;){d=k(e);if(-1!==d&&d>c)break;e=e.nextSibling}a.insertBefore(b,e)}}}var n=new odf.StyleInfo,
c=new core.DomUtils,m=odf.Namespaces.stylens,r="meta settings scripts font-face-decls styles automatic-styles master-styles body".split(" "),d=(new Date).getTime()+"_webodf_",e=new core.Base64;odf.ODFElement=function(){};odf.ODFDocumentElement=function(){};odf.ODFDocumentElement.prototype=new odf.ODFElement;odf.ODFDocumentElement.prototype.constructor=odf.ODFDocumentElement;odf.ODFDocumentElement.prototype.fontFaceDecls=null;odf.ODFDocumentElement.prototype.manifest=null;odf.ODFDocumentElement.prototype.settings=
null;odf.ODFDocumentElement.namespaceURI="urn:oasis:names:tc:opendocument:xmlns:office:1.0";odf.ODFDocumentElement.localName="document";odf.OdfPart=function(a,b,c,d){var e=this;this.size=0;this.type=null;this.name=a;this.container=c;this.url=null;this.mimetype=b;this.onstatereadychange=this.document=null;this.EMPTY=0;this.LOADING=1;this.DONE=2;this.state=this.EMPTY;this.data="";this.load=function(){null!==d&&(this.mimetype=b,d.loadAsDataURL(a,b,function(a,b){a&&runtime.log(a);e.url=b;if(e.onchange)e.onchange(e);
if(e.onstatereadychange)e.onstatereadychange(e)}))}};odf.OdfPart.prototype.load=function(){};odf.OdfPart.prototype.getUrl=function(){return this.data?"data:;base64,"+e.toBase64(this.data):null};odf.OdfContainer=function b(g,l){function k(b){for(var c=b.firstChild,d;c;)d=c.nextSibling,c.nodeType===Node.ELEMENT_NODE?k(c):c.nodeType===Node.PROCESSING_INSTRUCTION_NODE&&b.removeChild(c),c=d}function r(b,c){for(var d=b&&b.firstChild;d;)d.nodeType===Node.ELEMENT_NODE&&d.setAttributeNS("urn:webodf:names:scope",
"scope",c),d=d.nextSibling}function w(b){var c={},d;for(b=b.firstChild;b;)b.nodeType===Node.ELEMENT_NODE&&b.namespaceURI===m&&"font-face"===b.localName&&(d=b.getAttributeNS(m,"name"),c[d]=b),b=b.nextSibling;return c}function y(b,c){var d=null,g,e,f;if(b)for(d=b.cloneNode(!0),g=d.firstElementChild;g;)e=g.nextElementSibling,(f=g.getAttributeNS("urn:webodf:names:scope","scope"))&&f!==c&&d.removeChild(g),g=e;return d}function v(b,c){var d,g,e,f=null,l={};if(b)for(c.forEach(function(b){n.collectUsedFontFaces(l,
b)}),f=b.cloneNode(!0),d=f.firstElementChild;d;)g=d.nextElementSibling,e=d.getAttributeNS(m,"name"),l[e]||f.removeChild(d),d=g;return f}function t(b){var c=D.rootElement.ownerDocument,d;if(b){k(b.documentElement);try{d=c.importNode(b.documentElement,!0)}catch(g){}}return d}function s(b){D.state=b;if(D.onchange)D.onchange(D);if(D.onstatereadychange)D.onstatereadychange(D)}function L(b){ba=null;D.rootElement=b;b.fontFaceDecls=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","font-face-decls");
b.styles=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","styles");b.automaticStyles=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","automatic-styles");b.masterStyles=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","master-styles");b.body=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","body");b.meta=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","meta")}function z(c){var g=t(c),e=D.rootElement,f;g&&"document-styles"===g.localName&&"urn:oasis:names:tc:opendocument:xmlns:office:1.0"===
g.namespaceURI?(e.fontFaceDecls=h(g,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","font-face-decls"),p(e,e.fontFaceDecls),f=h(g,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","styles"),e.styles=f||c.createElementNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0","styles"),p(e,e.styles),f=h(g,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","automatic-styles"),e.automaticStyles=f||c.createElementNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0","automatic-styles"),r(e.automaticStyles,
"document-styles"),p(e,e.automaticStyles),g=h(g,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","master-styles"),e.masterStyles=g||c.createElementNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0","master-styles"),p(e,e.masterStyles),n.prefixStyleNames(e.automaticStyles,d,e.masterStyles)):s(b.INVALID)}function B(c){c=t(c);var d,g,e,f;if(c&&"document-content"===c.localName&&"urn:oasis:names:tc:opendocument:xmlns:office:1.0"===c.namespaceURI){d=D.rootElement;e=h(c,"urn:oasis:names:tc:opendocument:xmlns:office:1.0",
"font-face-decls");if(d.fontFaceDecls&&e){f=d.fontFaceDecls;var l,k,q,u,v={};g=w(f);u=w(e);for(e=e.firstElementChild;e;){l=e.nextElementSibling;if(e.namespaceURI===m&&"font-face"===e.localName)if(k=e.getAttributeNS(m,"name"),g.hasOwnProperty(k)){if(!e.isEqualNode(g[k])){q=k;for(var z=g,C=u,B=0,T=void 0,T=q=q.replace(/\d+$/,"");z.hasOwnProperty(T)||C.hasOwnProperty(T);)B+=1,T=q+B;q=T;e.setAttributeNS(m,"style:name",q);f.appendChild(e);g[q]=e;delete u[k];v[k]=q}}else f.appendChild(e),g[k]=e,delete u[k];
e=l}f=v}else e&&(d.fontFaceDecls=e,p(d,e));g=h(c,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","automatic-styles");r(g,"document-content");f&&n.changeFontFaceNames(g,f);if(d.automaticStyles&&g)for(f=g.firstChild;f;)d.automaticStyles.appendChild(f),f=g.firstChild;else g&&(d.automaticStyles=g,p(d,g));c=h(c,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","body");if(null===c)throw"<office:body/> tag is mising.";d.body=c;p(d,d.body)}else s(b.INVALID)}function N(b){b=t(b);var c;b&&"document-meta"===
b.localName&&"urn:oasis:names:tc:opendocument:xmlns:office:1.0"===b.namespaceURI&&(c=D.rootElement,c.meta=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","meta"),p(c,c.meta))}function I(b){b=t(b);var c;b&&"document-settings"===b.localName&&"urn:oasis:names:tc:opendocument:xmlns:office:1.0"===b.namespaceURI&&(c=D.rootElement,c.settings=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","settings"),p(c,c.settings))}function T(b){b=t(b);var c;if(b&&"manifest"===b.localName&&"urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"===
b.namespaceURI)for(c=D.rootElement,c.manifest=b,b=c.manifest.firstElementChild;b;)"file-entry"===b.localName&&"urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"===b.namespaceURI&&(U[b.getAttributeNS("urn:oasis:names:tc:opendocument:xmlns:manifest:1.0","full-path")]=b.getAttributeNS("urn:oasis:names:tc:opendocument:xmlns:manifest:1.0","media-type")),b=b.nextElementSibling}function A(c){var d=c.shift();d?J.loadAsDOM(d.path,function(g,e){d.handler(e);g||D.state===b.INVALID||A(c)}):s(b.DONE)}function C(b){var c=
"";odf.Namespaces.forEachPrefix(function(b,d){c+=" xmlns:"+b+'="'+d+'"'});return'<?xml version="1.0" encoding="UTF-8"?><office:'+b+" "+c+' office:version="1.2">'}function ia(){var b=new xmldom.LSSerializer,c=C("document-meta");b.filter=new odf.OdfNodeFilter;c+=b.writeToString(D.rootElement.meta,odf.Namespaces.namespaceMap);return c+"</office:document-meta>"}function xa(b,c){var d=document.createElementNS("urn:oasis:names:tc:opendocument:xmlns:manifest:1.0","manifest:file-entry");d.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
"manifest:full-path",b);d.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:manifest:1.0","manifest:media-type",c);return d}function E(){var b=runtime.parseXML('<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"></manifest:manifest>'),c=h(b,"urn:oasis:names:tc:opendocument:xmlns:manifest:1.0","manifest"),d=new xmldom.LSSerializer,g;for(g in U)U.hasOwnProperty(g)&&c.appendChild(xa(g,U[g]));d.filter=new odf.OdfNodeFilter;return'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+
d.writeToString(b,odf.Namespaces.namespaceMap)}function R(){var b=new xmldom.LSSerializer,c=C("document-settings");b.filter=new odf.OdfNodeFilter;c+=b.writeToString(D.rootElement.settings,odf.Namespaces.namespaceMap);return c+"</office:document-settings>"}function Z(){var b,c,g,e=odf.Namespaces.namespaceMap,l=new xmldom.LSSerializer,h=C("document-styles");c=y(D.rootElement.automaticStyles,"document-styles");g=D.rootElement.masterStyles.cloneNode(!0);b=v(D.rootElement.fontFaceDecls,[g,D.rootElement.styles,
c]);n.removePrefixFromStyleNames(c,d,g);l.filter=new f(g,c);h+=l.writeToString(b,e);h+=l.writeToString(D.rootElement.styles,e);h+=l.writeToString(c,e);h+=l.writeToString(g,e);return h+"</office:document-styles>"}function M(){var b,c,d=odf.Namespaces.namespaceMap,g=new xmldom.LSSerializer,e=C("document-content");c=y(D.rootElement.automaticStyles,"document-content");b=v(D.rootElement.fontFaceDecls,[c]);g.filter=new q(D.rootElement.body,c);e+=g.writeToString(b,d);e+=g.writeToString(c,d);e+=g.writeToString(D.rootElement.body,
d);return e+"</office:document-content>"}function S(c,d){runtime.loadXML(c,function(c,g){if(c)d(c);else{var e=t(g);e&&"document"===e.localName&&"urn:oasis:names:tc:opendocument:xmlns:office:1.0"===e.namespaceURI?(L(e),s(b.DONE)):s(b.INVALID)}})}function F(b,d){var g;g=D.rootElement;var e=g.meta;e||(g.meta=e=document.createElementNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0","meta"),p(g,e));g=e;b&&c.mapKeyValObjOntoNode(g,b,odf.Namespaces.lookupNamespaceURI);d&&c.removeKeyElementsFromNode(g,
d,odf.Namespaces.lookupNamespaceURI)}function G(){function c(b,d){var g;d||(d=b);g=document.createElementNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0",d);e[b]=g;e.appendChild(g)}var d=new core.Zip("",null),g=runtime.byteArrayFromString("application/vnd.oasis.opendocument.text","utf8"),e=D.rootElement,f=document.createElementNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0","text");d.save("mimetype",g,!1,new Date);c("meta");c("settings");c("scripts");c("fontFaceDecls","font-face-decls");
c("styles");c("automaticStyles","automatic-styles");c("masterStyles","master-styles");c("body");e.body.appendChild(f);s(b.DONE);return d}function V(){var b,c=new Date,d=runtime.getWindow();b="WebODF/"+("undefined"!==String(typeof webodf_version)?webodf_version:"FromSource");d&&(b=b+" "+d.navigator.userAgent);F({"meta:generator":b},null);b=runtime.byteArrayFromString(R(),"utf8");J.save("settings.xml",b,!0,c);b=runtime.byteArrayFromString(ia(),"utf8");J.save("meta.xml",b,!0,c);b=runtime.byteArrayFromString(Z(),
"utf8");J.save("styles.xml",b,!0,c);b=runtime.byteArrayFromString(M(),"utf8");J.save("content.xml",b,!0,c);b=runtime.byteArrayFromString(E(),"utf8");J.save("META-INF/manifest.xml",b,!0,c)}function da(b,c){V();J.writeAs(b,function(b){c(b)})}var D=this,J,U={},ba;this.onstatereadychange=l;this.state=this.onchange=null;this.setRootElement=L;this.getContentElement=function(){var b;ba||(b=D.rootElement.body,ba=h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","text")||h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0",
"presentation")||h(b,"urn:oasis:names:tc:opendocument:xmlns:office:1.0","spreadsheet"));if(!ba)throw"Could not find content element in <office:body/>.";return ba};this.getDocumentType=function(){var b=D.getContentElement();return b&&b.localName};this.getPart=function(b){return new odf.OdfPart(b,U[b],D,J)};this.getPartData=function(b,c){J.load(b,c)};this.setMetadata=F;this.incrementEditingCycles=function(){var b;for(b=(b=D.rootElement.meta)&&b.firstChild;b&&(b.namespaceURI!==odf.Namespaces.metans||
"editing-cycles"!==b.localName);)b=b.nextSibling;for(b=b&&b.firstChild;b&&b.nodeType!==Node.TEXT_NODE;)b=b.nextSibling;b=b?b.data:null;b=b?parseInt(b,10):0;isNaN(b)&&(b=0);F({"meta:editing-cycles":b+1},null)};this.createByteArray=function(b,c){V();J.createByteArray(b,c)};this.saveAs=da;this.save=function(b){da(g,b)};this.getUrl=function(){return g};this.setBlob=function(b,c,d){d=e.convertBase64ToByteArray(d);J.save(b,d,!1,new Date);U.hasOwnProperty(b)&&runtime.log(b+" has been overwritten.");U[b]=
c};this.removeBlob=function(b){var c=J.remove(b);runtime.assert(c,"file is not found: "+b);delete U[b]};this.state=b.LOADING;this.rootElement=function(b){var c=document.createElementNS(b.namespaceURI,b.localName),d;b=new b.Type;for(d in b)b.hasOwnProperty(d)&&(c[d]=b[d]);return c}({Type:odf.ODFDocumentElement,namespaceURI:odf.ODFDocumentElement.namespaceURI,localName:odf.ODFDocumentElement.localName});J=g?new core.Zip(g,function(c,d){J=d;c?S(g,function(d){c&&(J.error=c+"\n"+d,s(b.INVALID))}):A([{path:"styles.xml",
handler:z},{path:"content.xml",handler:B},{path:"meta.xml",handler:N},{path:"settings.xml",handler:I},{path:"META-INF/manifest.xml",handler:T}])}):G()};odf.OdfContainer.EMPTY=0;odf.OdfContainer.LOADING=1;odf.OdfContainer.DONE=2;odf.OdfContainer.INVALID=3;odf.OdfContainer.SAVING=4;odf.OdfContainer.MODIFIED=5;odf.OdfContainer.getContainer=function(b){return new odf.OdfContainer(b,null)};return odf.OdfContainer})();
// Input 37
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.Base64");runtime.loadClass("xmldom.XPath");runtime.loadClass("odf.OdfContainer");
(function(){function h(k,p,n,c,m){var r,d=0,e;for(e in k)if(k.hasOwnProperty(e)){if(d===n){r=e;break}d+=1}r?p.getPartData(k[r].href,function(a,b){if(a)runtime.log(a);else if(b){var d="@font-face { font-family: '"+(k[r].family||r)+"'; src: url(data:application/x-font-ttf;charset=binary;base64,"+f.convertUTF8ArrayToBase64(b)+') format("truetype"); }';try{c.insertRule(d,c.cssRules.length)}catch(e){runtime.log("Problem inserting rule in CSS: "+runtime.toJson(e)+"\nRule: "+d)}}else runtime.log("missing font data for "+
k[r].href);h(k,p,n+1,c,m)}):m&&m()}var k=xmldom.XPath,f=new core.Base64;odf.FontLoader=function(){this.loadFonts=function(f,p){for(var n=f.rootElement.fontFaceDecls;p.cssRules.length;)p.deleteRule(p.cssRules.length-1);if(n){var c={},m,r,d,e;if(n)for(n=k.getODFElementsWithXPath(n,"style:font-face[svg:font-face-src]",odf.Namespaces.lookupNamespaceURI),m=0;m<n.length;m+=1)r=n[m],d=r.getAttributeNS(odf.Namespaces.stylens,"name"),e=r.getAttributeNS(odf.Namespaces.svgns,"font-family"),r=k.getODFElementsWithXPath(r,
"svg:font-face-src/svg:font-face-uri",odf.Namespaces.lookupNamespaceURI),0<r.length&&(r=r[0].getAttributeNS(odf.Namespaces.xlinkns,"href"),c[d]={href:r,family:e});h(c,f,0,p)}}};return odf.FontLoader})();
// Input 38
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("core.Utils");
odf.ObjectNameGenerator=function(h,k){function f(a,b){var c={};this.generateName=function(){var d=b(),g=0,e;do e=a+g,g+=1;while(c[e]||d[e]);c[e]=!0;return e}}function q(){var a={};[h.rootElement.automaticStyles,h.rootElement.styles].forEach(function(b){for(b=b.firstElementChild;b;)b.namespaceURI===p&&"style"===b.localName&&(a[b.getAttributeNS(p,"name")]=!0),b=b.nextElementSibling});return a}var p=odf.Namespaces.stylens,n=odf.Namespaces.drawns,c=odf.Namespaces.xlinkns,m=new core.DomUtils,r=(new core.Utils).hashString(k),
d=null,e=null,a=null,b={},g={};this.generateStyleName=function(){null===d&&(d=new f("auto"+r+"_",function(){return q()}));return d.generateName()};this.generateFrameName=function(){null===e&&(m.getElementsByTagNameNS(h.rootElement.body,n,"frame").forEach(function(a){b[a.getAttributeNS(n,"name")]=!0}),e=new f("fr"+r+"_",function(){return b}));return e.generateName()};this.generateImageName=function(){null===a&&(m.getElementsByTagNameNS(h.rootElement.body,n,"image").forEach(function(a){a=a.getAttributeNS(c,
"href");a=a.substring(9,a.lastIndexOf("."));g[a]=!0}),a=new f("img"+r+"_",function(){return g}));return a.generateName()}};
// Input 39
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.Utils");runtime.loadClass("odf.ObjectNameGenerator");runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.OdfContainer");runtime.loadClass("odf.StyleInfo");runtime.loadClass("odf.OdfUtils");
odf.Formatting=function(){function h(a){return(a=t[a])?v.mergeObjects({},a):{}}function k(a,b,c){for(a=a&&a.firstElementChild;a&&(a.namespaceURI!==b||a.localName!==c);)a=a.nextElementSibling;return a}function f(){for(var a=e.rootElement.fontFaceDecls,c={},d,f,a=a&&a.firstElementChild;a;){if(d=a.getAttributeNS(g,"name"))if((f=a.getAttributeNS(b,"font-family"))||0<a.getElementsByTagNameNS(b,"font-face-uri").length)c[d]=f;a=a.nextElementSibling}return c}function q(a){for(var b=e.rootElement.styles.firstElementChild;b;){if(b.namespaceURI===
g&&"default-style"===b.localName&&b.getAttributeNS(g,"family")===a)return b;b=b.nextElementSibling}return null}function p(a,b,c){var d,f,h;c=c||[e.rootElement.automaticStyles,e.rootElement.styles];for(h=0;h<c.length;h+=1)for(d=c[h],d=d.firstElementChild;d;){f=d.getAttributeNS(g,"name");if(d.namespaceURI===g&&"style"===d.localName&&d.getAttributeNS(g,"family")===b&&f===a||"list-style"===b&&d.namespaceURI===l&&"list-style"===d.localName&&f===a||"data"===b&&d.namespaceURI===u&&f===a)return d;d=d.nextElementSibling}return null}
function n(a){for(var b,c,d,e,f={},l=a.firstElementChild;l;){if(l.namespaceURI===g)for(d=f[l.nodeName]={},c=l.attributes,b=0;b<c.length;b+=1)e=c.item(b),d[e.name]=e.value;l=l.nextElementSibling}c=a.attributes;for(b=0;b<c.length;b+=1)e=c.item(b),f[e.name]=e.value;return f}function c(a,b){for(var c=e.rootElement.styles,d,f={},l=a.getAttributeNS(g,"family"),m=a;m;)d=n(m),f=v.mergeObjects(d,f),m=(d=m.getAttributeNS(g,"parent-style-name"))?p(d,l,[c]):null;if(m=q(l))d=n(m),f=v.mergeObjects(d,f);b&&(d=h(l))&&
(f=v.mergeObjects(d,f));return f}function m(b,c){function d(a){Object.keys(a).forEach(function(b){Object.keys(a[b]).forEach(function(a){l+="|"+b+":"+a+"|"})})}for(var g=b.nodeType===Node.TEXT_NODE?b.parentNode:b,e,f=[],l="",h=!1;g;)!h&&w.isGroupingElement(g)&&(h=!0),(e=a.determineStylesForNode(g))&&f.push(e),g=g.parentNode;h&&(f.forEach(d),c&&(c[l]=f));return h?f:void 0}function r(a){var b={orderedStyles:[]};a.forEach(function(a){Object.keys(a).forEach(function(d){var e=Object.keys(a[d])[0],f,l;(f=
p(e,d))?(l=c(f),b=v.mergeObjects(l,b),l=f.getAttributeNS(g,"display-name")):runtime.log("No style element found for '"+e+"' of family '"+d+"'");b.orderedStyles.push({name:e,family:d,displayName:l})})});return b}function d(a,b){var c=w.parseLength(a),d=b;if(c)switch(c.unit){case "cm":d=c.value;break;case "mm":d=0.1*c.value;break;case "in":d=2.54*c.value;break;case "pt":d=0.035277778*c.value;break;case "pc":case "px":case "em":break;default:runtime.log("Unit identifier: "+c.unit+" is not supported.")}return d}
var e,a=new odf.StyleInfo,b=odf.Namespaces.svgns,g=odf.Namespaces.stylens,l=odf.Namespaces.textns,u=odf.Namespaces.numberns,x=odf.Namespaces.fons,w=new odf.OdfUtils,y=new core.DomUtils,v=new core.Utils,t={paragraph:{"style:paragraph-properties":{"fo:text-align":"left"}}};this.getSystemDefaultStyleAttributes=h;this.setOdfContainer=function(a){e=a};this.getFontMap=f;this.getAvailableParagraphStyles=function(){for(var a=e.rootElement.styles,b,c,d=[],a=a&&a.firstElementChild;a;)"style"===a.localName&&
a.namespaceURI===g&&(b=a.getAttributeNS(g,"family"),"paragraph"===b&&(b=a.getAttributeNS(g,"name"),c=a.getAttributeNS(g,"display-name")||b,b&&c&&d.push({name:b,displayName:c}))),a=a.nextElementSibling;return d};this.isStyleUsed=function(b){var c,d=e.rootElement;c=a.hasDerivedStyles(d,odf.Namespaces.lookupNamespaceURI,b);b=(new a.UsedStyleList(d.styles)).uses(b)||(new a.UsedStyleList(d.automaticStyles)).uses(b)||(new a.UsedStyleList(d.body)).uses(b);return c||b};this.getDefaultStyleElement=q;this.getStyleElement=
p;this.getStyleAttributes=n;this.getInheritedStyleAttributes=c;this.getFirstCommonParentStyleNameOrSelf=function(a){var b=e.rootElement.automaticStyles,c=e.rootElement.styles,d;for(d=p(a,"paragraph",[b]);d;)a=d.getAttributeNS(g,"parent-style-name"),d=p(a,"paragraph",[b]);return(d=p(a,"paragraph",[c]))?a:null};this.hasParagraphStyle=function(a){return Boolean(p(a,"paragraph"))};this.getAppliedStyles=function(a){var b={},c=[];a.forEach(function(a){m(a,b)});Object.keys(b).forEach(function(a){c.push(r(b[a]))});
return c};this.getAppliedStylesForElement=function(a){return(a=m(a))?r(a):void 0};this.updateStyle=function(a,c){var d,l;y.mapObjOntoNode(a,c,odf.Namespaces.lookupNamespaceURI);(d=c["style:text-properties"]&&c["style:text-properties"]["style:font-name"])&&!f().hasOwnProperty(d)&&(l=a.ownerDocument.createElementNS(g,"style:font-face"),l.setAttributeNS(g,"style:name",d),l.setAttributeNS(b,"svg:font-family",d),e.rootElement.fontFaceDecls.appendChild(l))};this.createDerivedStyleObject=function(a,b,c){var d=
p(a,b);runtime.assert(Boolean(d),"No style element found for '"+a+"' of family '"+b+"'");a=d.parentNode===e.rootElement.automaticStyles?n(d):{"style:parent-style-name":a};a["style:family"]=b;v.mergeObjects(a,c);return a};this.getDefaultTabStopDistance=function(){for(var a=q("paragraph"),a=a&&a.firstElementChild,b;a;)a.namespaceURI===g&&"paragraph-properties"===a.localName&&(b=a.getAttributeNS(g,"tab-stop-distance")),a=a.nextElementSibling;b||(b="1.25cm");return w.parseNonNegativeLength(b)};this.getContentSize=
function(a,b){var c,f,l,h,m,n,r,q,u,v,t;a:{var w,M,S;c=p(a,b);runtime.assert("paragraph"===b||"table"===b,"styleFamily has to be either paragraph or table");if(c){w=c.getAttributeNS(g,"master-page-name")||"Standard";for(c=e.rootElement.masterStyles.lastElementChild;c&&c.getAttributeNS(g,"name")!==w;)c=c.previousElementSibling;w=c.getAttributeNS(g,"page-layout-name");M=y.getElementsByTagNameNS(e.rootElement.automaticStyles,g,"page-layout");for(S=0;S<M.length;S+=1)if(c=M[S],c.getAttributeNS(g,"name")===
w)break a}c=null}c||(c=k(e.rootElement.styles,g,"default-page-layout"));if(c=k(c,g,"page-layout-properties"))f=c.getAttributeNS(g,"print-orientation")||"portrait","portrait"===f?(f=21.001,l=29.7):(f=29.7,l=21.001),f=d(c.getAttributeNS(x,"page-width"),f),l=d(c.getAttributeNS(x,"page-height"),l),h=d(c.getAttributeNS(x,"margin"),null),null===h?(h=d(c.getAttributeNS(x,"margin-left"),2),m=d(c.getAttributeNS(x,"margin-right"),2),n=d(c.getAttributeNS(x,"margin-top"),2),r=d(c.getAttributeNS(x,"margin-bottom"),
2)):h=m=n=r=h,q=d(c.getAttributeNS(x,"padding"),null),null===q?(q=d(c.getAttributeNS(x,"padding-left"),0),u=d(c.getAttributeNS(x,"padding-right"),0),v=d(c.getAttributeNS(x,"padding-top"),0),t=d(c.getAttributeNS(x,"padding-bottom"),0)):q=u=v=t=q;return{width:f-h-m-q-u,height:l-n-r-v-t}}};
// Input 40
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("odf.OdfContainer");runtime.loadClass("odf.Formatting");runtime.loadClass("xmldom.XPath");runtime.loadClass("odf.FontLoader");runtime.loadClass("odf.Style2CSS");runtime.loadClass("odf.OdfUtils");runtime.loadClass("gui.AnnotationViewManager");
(function(){function h(){function a(d){c=!0;runtime.setTimeout(function(){try{d()}catch(g){runtime.log(String(g))}c=!1;0<b.length&&a(b.pop())},10)}var b=[],c=!1;this.clearQueue=function(){b.length=0};this.addToQueue=function(d){if(0===b.length&&!c)return a(d);b.push(d)}}function k(a){function b(){for(;0<c.cssRules.length;)c.deleteRule(0);c.insertRule("#shadowContent draw|page {display:none;}",0);c.insertRule("office|presentation draw|page {display:none;}",1);c.insertRule("#shadowContent draw|page:nth-of-type("+
d+") {display:block;}",2);c.insertRule("office|presentation draw|page:nth-of-type("+d+") {display:block;}",3)}var c=a.sheet,d=1;this.showFirstPage=function(){d=1;b()};this.showNextPage=function(){d+=1;b()};this.showPreviousPage=function(){1<d&&(d-=1,b())};this.showPage=function(a){0<a&&(d=a,b())};this.css=a;this.destroy=function(b){a.parentNode.removeChild(a);b()}}function f(a){for(;a.firstChild;)a.removeChild(a.firstChild)}function q(a,b,c){(new odf.Style2CSS).style2css(a.getDocumentType(),c.sheet,
b.getFontMap(),a.rootElement.styles,a.rootElement.automaticStyles)}function p(a,b,c){var d=null;a=a.rootElement.body.getElementsByTagNameNS(B,c+"-decl");c=b.getAttributeNS(B,"use-"+c+"-name");var g;if(c&&0<a.length)for(b=0;b<a.length;b+=1)if(g=a[b],g.getAttributeNS(B,"name")===c){d=g.textContent;break}return d}function n(a,b,c,d){var g=a.ownerDocument;b=a.getElementsByTagNameNS(b,c);for(a=0;a<b.length;a+=1)f(b[a]),d&&(c=b[a],c.appendChild(g.createTextNode(d)))}function c(a,b,c){b.setAttributeNS("urn:webodf:names:helper",
"styleid",a);var d,g=b.getAttributeNS(s,"anchor-type"),e=b.getAttributeNS(v,"x"),f=b.getAttributeNS(v,"y"),l=b.getAttributeNS(v,"width"),h=b.getAttributeNS(v,"height"),m=b.getAttributeNS(x,"min-height"),n=b.getAttributeNS(x,"min-width");if("as-char"===g)d="display: inline-block;";else if(g||e||f)d="position: absolute;";else if(l||h||m||n)d="display: block;";e&&(d+="left: "+e+";");f&&(d+="top: "+f+";");l&&(d+="width: "+l+";");h&&(d+="height: "+h+";");m&&(d+="min-height: "+m+";");n&&(d+="min-width: "+
n+";");d&&(d="draw|"+b.localName+'[webodfhelper|styleid="'+a+'"] {'+d+"}",c.insertRule(d,c.cssRules.length))}function m(a){for(a=a.firstChild;a;){if(a.namespaceURI===w&&"binary-data"===a.localName)return"data:image/png;base64,"+a.textContent.replace(/[\r\n\s]/g,"");a=a.nextSibling}return""}function r(a,b,c,d){function g(b){b&&(b='draw|image[webodfhelper|styleid="'+a+'"] {'+("background-image: url("+b+");")+"}",d.insertRule(b,d.cssRules.length))}function e(a){g(a.url)}c.setAttributeNS("urn:webodf:names:helper",
"styleid",a);var f=c.getAttributeNS(L,"href"),l;if(f)try{l=b.getPart(f),l.onchange=e,l.load()}catch(h){runtime.log("slight problem: "+String(h))}else f=m(c),g(f)}function d(a){var b=a.ownerDocument;A.getElementsByTagNameNS(a,s,"line-break").forEach(function(a){a.hasChildNodes()||a.appendChild(b.createElement("br"))})}function e(a){var b=a.ownerDocument;A.getElementsByTagNameNS(a,s,"s").forEach(function(a){for(var c,d;a.firstChild;)a.removeChild(a.firstChild);a.appendChild(b.createTextNode(" "));d=
parseInt(a.getAttributeNS(s,"c"),10);if(1<d)for(a.removeAttributeNS(s,"c"),c=1;c<d;c+=1)a.parentNode.insertBefore(a.cloneNode(!0),a)})}function a(a){A.getElementsByTagNameNS(a,s,"tab").forEach(function(a){a.textContent="\t"})}function b(a,b){function c(a,d){var f=l.documentElement.namespaceURI;"video/"===d.substr(0,6)?(g=l.createElementNS(f,"video"),g.setAttribute("controls","controls"),e=l.createElementNS(f,"source"),a&&e.setAttribute("src",a),e.setAttribute("type",d),g.appendChild(e),b.parentNode.appendChild(g)):
b.innerHtml="Unrecognised Plugin"}function d(a){c(a.url,a.mimetype)}var g,e,f,l=b.ownerDocument,h;if(f=b.getAttributeNS(L,"href"))try{h=a.getPart(f),h.onchange=d,h.load()}catch(n){runtime.log("slight problem: "+String(n))}else runtime.log("using MP4 data fallback"),f=m(b),c(f,"video/mp4")}function g(a){var b=a.getElementsByTagName("head")[0],c;"undefined"!==String(typeof webodf_css)?(c=a.createElementNS(b.namespaceURI,"style"),c.setAttribute("media","screen, print, handheld, projection"),c.appendChild(a.createTextNode(webodf_css))):
(c=a.createElementNS(b.namespaceURI,"link"),a="webodf.css",runtime.currentDirectory&&(a=runtime.currentDirectory()+"/../"+a),c.setAttribute("href",a),c.setAttribute("rel","stylesheet"));c.setAttribute("type","text/css");b.appendChild(c);return c}function l(a){var b=a.getElementsByTagName("head")[0],c=a.createElementNS(b.namespaceURI,"style"),d="";c.setAttribute("type","text/css");c.setAttribute("media","screen, print, handheld, projection");odf.Namespaces.forEachPrefix(function(a,b){d+="@namespace "+
a+" url("+b+");\n"});d+="@namespace webodfhelper url(urn:webodf:names:helper);\n";c.appendChild(a.createTextNode(d));b.appendChild(c);return c}var u=odf.Namespaces.drawns,x=odf.Namespaces.fons,w=odf.Namespaces.officens,y=odf.Namespaces.stylens,v=odf.Namespaces.svgns,t=odf.Namespaces.tablens,s=odf.Namespaces.textns,L=odf.Namespaces.xlinkns,z=odf.Namespaces.xmlns,B=odf.Namespaces.presentationns,N=runtime.getWindow(),I=xmldom.XPath,T=new odf.OdfUtils,A=new core.DomUtils;odf.OdfCanvas=function(m){function v(a,
b,c){function d(a,b,c,g){sa.addToQueue(function(){r(a,b,c,g)})}var g,e;g=b.getElementsByTagNameNS(u,"image");for(b=0;b<g.length;b+=1)e=g.item(b),d("image"+String(b),a,e,c)}function x(a,c){function d(a,c){sa.addToQueue(function(){b(a,c)})}var g,e,f;e=c.getElementsByTagNameNS(u,"plugin");for(g=0;g<e.length;g+=1)f=e.item(g),d(a,f)}function E(){var a;J.firstChild&&(1<O?(J.style.MozTransformOrigin="center top",J.style.WebkitTransformOrigin="center top",J.style.OTransformOrigin="center top",J.style.msTransformOrigin=
"center top"):(J.style.MozTransformOrigin="left top",J.style.WebkitTransformOrigin="left top",J.style.OTransformOrigin="left top",J.style.msTransformOrigin="left top"),J.style.WebkitTransform="scale("+O+")",J.style.MozTransform="scale("+O+")",J.style.OTransform="scale("+O+")",J.style.msTransform="scale("+O+")",Y&&((a=Y.getMinimumHeightForAnnotationPane())?J.style.minHeight=a:J.style.removeProperty("min-height")),m.style.width=Math.round(O*J.offsetWidth)+"px",m.style.height=Math.round(O*J.offsetHeight)+
"px")}function R(a){function b(a){return d===a.getAttributeNS(w,"name")}var c=A.getElementsByTagNameNS(a,w,"annotation");a=A.getElementsByTagNameNS(a,w,"annotation-end");var d,g;for(g=0;g<c.length;g+=1)d=c[g].getAttributeNS(w,"name"),Y.addAnnotation({node:c[g],end:a.filter(b)[0]||null});Y.rerenderAnnotations()}function L(a){ba?(U.parentNode||J.appendChild(U),Y&&Y.forgetAnnotations(),Y=new gui.AnnotationViewManager(F,a.body,U,qa),R(a.body),E()):U.parentNode&&(J.removeChild(U),Y.forgetAnnotations(),
E())}function M(b){function g(){f(m);m.style.display="inline-block";var l=V.rootElement;m.ownerDocument.importNode(l,!0);da.setOdfContainer(V);var h=V,k=W;(new odf.FontLoader).loadFonts(h,k.sheet);q(V,da,aa);k=V;h=$.sheet;f(m);J=G.createElementNS(m.namespaceURI,"div");J.style.display="inline-block";J.style.background="white";J.appendChild(l);m.appendChild(J);U=G.createElementNS(m.namespaceURI,"div");U.id="annotationsPane";fa=G.createElementNS(m.namespaceURI,"div");fa.id="shadowContent";fa.style.position=
"absolute";fa.style.top=0;fa.style.left=0;k.getContentElement().appendChild(fa);var r=l.body,A,R=[],D;for(A=r.firstElementChild;A&&A!==r;)if(A.namespaceURI===u&&(R[R.length]=A),A.firstElementChild)A=A.firstElementChild;else{for(;A&&A!==r&&!A.nextElementSibling;)A=A.parentNode;A&&A.nextElementSibling&&(A=A.nextElementSibling)}for(D=0;D<R.length;D+=1)A=R[D],c("frame"+String(D),A,h);R=I.getODFElementsWithXPath(r,".//*[*[@text:anchor-type='paragraph']]",odf.Namespaces.lookupNamespaceURI);for(A=0;A<R.length;A+=
1)r=R[A],r.setAttributeNS&&r.setAttributeNS("urn:webodf:names:helper","containsparagraphanchor",!0);var r=fa,M,S,F;F=0;var Q,O,R=k.rootElement.ownerDocument;if((A=l.body.firstElementChild)&&A.namespaceURI===w&&("presentation"===A.localName||"drawing"===A.localName))for(A=A.firstElementChild;A;){D=A.getAttributeNS(u,"master-page-name");if(D){for(M=k.rootElement.masterStyles.firstElementChild;M&&(M.getAttributeNS(y,"name")!==D||"master-page"!==M.localName||M.namespaceURI!==y);)M=M.nextElementSibling;
D=M}else D=null;if(D){M=A.getAttributeNS("urn:webodf:names:helper","styleid");S=R.createElementNS(u,"draw:page");O=D.firstElementChild;for(Q=0;O;)"true"!==O.getAttributeNS(B,"placeholder")&&(F=O.cloneNode(!0),S.appendChild(F),c(M+"_"+Q,F,h)),O=O.nextElementSibling,Q+=1;O=Q=F=void 0;var Y=S.getElementsByTagNameNS(u,"frame");for(F=0;F<Y.length;F+=1)Q=Y[F],(O=Q.getAttributeNS(B,"class"))&&!/^(date-time|footer|header|page-number)$/.test(O)&&Q.parentNode.removeChild(Q);r.appendChild(S);F=String(r.getElementsByTagNameNS(u,
"page").length);n(S,s,"page-number",F);n(S,B,"header",p(k,A,"header"));n(S,B,"footer",p(k,A,"footer"));c(M,S,h);S.setAttributeNS(u,"draw:master-page-name",D.getAttributeNS(y,"name"))}A=A.nextElementSibling}r=m.namespaceURI;R=l.body.getElementsByTagNameNS(t,"table-cell");for(A=0;A<R.length;A+=1)D=R.item(A),D.hasAttributeNS(t,"number-columns-spanned")&&D.setAttributeNS(r,"colspan",D.getAttributeNS(t,"number-columns-spanned")),D.hasAttributeNS(t,"number-rows-spanned")&&D.setAttributeNS(r,"rowspan",D.getAttributeNS(t,
"number-rows-spanned"));d(l.body);e(l.body);a(l.body);v(k,l.body,h);x(k,l.body);D=l.body;k=m.namespaceURI;A={};var R={},ca;M=N.document.getElementsByTagNameNS(s,"list-style");for(r=0;r<M.length;r+=1)Q=M.item(r),(O=Q.getAttributeNS(y,"name"))&&(R[O]=Q);D=D.getElementsByTagNameNS(s,"list");for(r=0;r<D.length;r+=1)if(Q=D.item(r),M=Q.getAttributeNS(z,"id")){S=Q.getAttributeNS(s,"continue-list");Q.setAttributeNS(k,"id",M);F="text|list#"+M+" > text|list-item > *:first-child:before {";if(O=Q.getAttributeNS(s,
"style-name")){Q=R[O];ca=T.getFirstNonWhitespaceChild(Q);Q=void 0;if(ca)if("list-level-style-number"===ca.localName){Q=ca.getAttributeNS(y,"num-format");O=ca.getAttributeNS(y,"num-suffix")||"";var Y="",Y={1:"decimal",a:"lower-latin",A:"upper-latin",i:"lower-roman",I:"upper-roman"},ba=void 0,ba=ca.getAttributeNS(y,"num-prefix")||"",ba=Y.hasOwnProperty(Q)?ba+(" counter(list, "+Y[Q]+")"):Q?ba+("'"+Q+"';"):ba+" ''";O&&(ba+=" '"+O+"'");Q=Y="content: "+ba+";"}else"list-level-style-image"===ca.localName?
Q="content: none;":"list-level-style-bullet"===ca.localName&&(Q="content: '"+ca.getAttributeNS(s,"bullet-char")+"';");ca=Q}if(S){for(Q=A[S];Q;)Q=A[Q];F+="counter-increment:"+S+";";ca?(ca=ca.replace("list",S),F+=ca):F+="content:counter("+S+");"}else S="",ca?(ca=ca.replace("list",M),F+=ca):F+="content: counter("+M+");",F+="counter-increment:"+M+";",h.insertRule("text|list#"+M+" {counter-reset:"+M+"}",h.cssRules.length);F+="}";A[M]=S;F&&h.insertRule(F,h.cssRules.length)}J.insertBefore(fa,J.firstChild);
E();L(l);if(!b&&(l=[V],ja.hasOwnProperty("statereadychange")))for(h=ja.statereadychange,ca=0;ca<h.length;ca+=1)h[ca].apply(null,l)}V.state===odf.OdfContainer.DONE?g():(runtime.log("WARNING: refreshOdf called but ODF was not DONE."),ma=runtime.setTimeout(function Ca(){V.state===odf.OdfContainer.DONE?g():(runtime.log("will be back later..."),ma=runtime.setTimeout(Ca,500))},100))}function S(a){sa.clearQueue();m.innerHTML=runtime.tr("Loading")+" "+a+"...";m.removeAttribute("style");V=new odf.OdfContainer(a,
function(a){V=a;M(!1)})}runtime.assert(null!==m&&void 0!==m,"odf.OdfCanvas constructor needs DOM element");runtime.assert(null!==m.ownerDocument&&void 0!==m.ownerDocument,"odf.OdfCanvas constructor needs DOM");var F=this,G=m.ownerDocument,V,da=new odf.Formatting,D,J=null,U=null,ba=!1,qa=!1,Y=null,ra,W,aa,$,fa,O=1,ja={},ma,sa=new h;this.refreshCSS=function(){q(V,da,aa);E()};this.refreshSize=function(){E()};this.odfContainer=function(){return V};this.setOdfContainer=function(a,b){V=a;M(!0===b)};this.load=
this.load=S;this.save=function(a){V.save(a)};this.addListener=function(a,b){switch(a){case "click":var c=m,d=a;c.addEventListener?c.addEventListener(d,b,!1):c.attachEvent?c.attachEvent("on"+d,b):c["on"+d]=b;break;default:c=ja.hasOwnProperty(a)?ja[a]:ja[a]=[],b&&-1===c.indexOf(b)&&c.push(b)}};this.getFormatting=function(){return da};this.getAnnotationViewManager=function(){return Y};this.refreshAnnotations=function(){L(V.rootElement)};this.rerenderAnnotations=function(){Y&&(Y.rerenderAnnotations(),
E())};this.getSizer=function(){return J};this.enableAnnotations=function(a,b){a!==ba&&(ba=a,qa=b,V&&L(V.rootElement))};this.addAnnotation=function(a){Y&&(Y.addAnnotation(a),E())};this.forgetAnnotations=function(){Y&&(Y.forgetAnnotations(),E())};this.setZoomLevel=function(a){O=a;E()};this.getZoomLevel=function(){return O};this.fitToContainingElement=function(a,b){var c=m.offsetHeight/O;O=a/(m.offsetWidth/O);b/c<O&&(O=b/c);E()};this.fitToWidth=function(a){O=a/(m.offsetWidth/O);E()};this.fitSmart=function(a,
b){var c,d;c=m.offsetWidth/O;d=m.offsetHeight/O;c=a/c;void 0!==b&&b/d<c&&(c=b/d);O=Math.min(1,c);E()};this.fitToHeight=function(a){O=a/(m.offsetHeight/O);E()};this.showFirstPage=function(){D.showFirstPage()};this.showNextPage=function(){D.showNextPage()};this.showPreviousPage=function(){D.showPreviousPage()};this.showPage=function(a){D.showPage(a);E()};this.getElement=function(){return m};this.addCssForFrameWithImage=function(a){var b=a.getAttributeNS(u,"name"),d=a.firstElementChild;c(b,a,$.sheet);
d&&r(b+"img",V,d,$.sheet)};this.destroy=function(a){var b=G.getElementsByTagName("head")[0];runtime.clearTimeout(ma);U&&U.parentNode&&U.parentNode.removeChild(U);J&&(m.removeChild(J),J=null);b.removeChild(ra);b.removeChild(W);b.removeChild(aa);b.removeChild($);D.destroy(a)};ra=g(G);D=new k(l(G));W=l(G);aa=l(G);$=l(G)}})();
// Input 41
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("core.LoopWatchDog");runtime.loadClass("odf.Namespaces");
odf.TextStyleApplicator=function(h,k,f){function q(c){function e(a,b){return"object"===typeof a&&"object"===typeof b?Object.keys(a).every(function(c){return e(a[c],b[c])}):a===b}this.isStyleApplied=function(a){a=k.getAppliedStylesForElement(a);return e(c,a)}}function p(c){var e={};this.applyStyleToContainer=function(a){var b;b=a.getAttributeNS(m,"style-name");var g=a.ownerDocument;b=b||"";if(!e.hasOwnProperty(b)){var l=b,n;n=b?k.createDerivedStyleObject(b,"text",c):c;g=g.createElementNS(r,"style:style");
k.updateStyle(g,n);g.setAttributeNS(r,"style:name",h.generateStyleName());g.setAttributeNS(r,"style:family","text");g.setAttributeNS("urn:webodf:names:scope","scope","document-content");f.appendChild(g);e[l]=g}b=e[b].getAttributeNS(r,"name");a.setAttributeNS(m,"text:style-name",b)}}function n(d,e){var a=d.ownerDocument,b=d.parentNode,g,f,h=new core.LoopWatchDog(1E4);f=[];"span"!==b.localName||b.namespaceURI!==m?(g=a.createElementNS(m,"text:span"),b.insertBefore(g,d),b=!1):(d.previousSibling&&!c.rangeContainsNode(e,
b.firstChild)?(g=b.cloneNode(!1),b.parentNode.insertBefore(g,b.nextSibling)):g=b,b=!0);f.push(d);for(a=d.nextSibling;a&&c.rangeContainsNode(e,a);)h.check(),f.push(a),a=a.nextSibling;f.forEach(function(a){a.parentNode!==g&&g.appendChild(a)});if(a&&b)for(f=g.cloneNode(!1),g.parentNode.insertBefore(f,g.nextSibling);a;)h.check(),b=a.nextSibling,f.appendChild(a),a=b;return g}var c=new core.DomUtils,m=odf.Namespaces.textns,r=odf.Namespaces.stylens;this.applyStyle=function(c,e,a){var b={},g,f,h,m;runtime.assert(a&&
a.hasOwnProperty("style:text-properties"),"applyStyle without any text properties");b["style:text-properties"]=a["style:text-properties"];h=new p(b);m=new q(b);c.forEach(function(a){g=m.isStyleApplied(a);!1===g&&(f=n(a,e),h.applyStyleToContainer(f))})}};
// Input 42
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.OdfUtils");
gui.StyleHelper=function(h){function k(f,c,h){var k=!0,d;for(d=0;d<f.length&&!(k=f[d]["style:text-properties"],k=!k||k[c]!==h);d+=1);return!k}function f(f,c,m){function k(){b=!0;(e=h.getDefaultStyleElement("paragraph"))||(e=null)}var d,e;f=q.getParagraphElements(f);for(var a={},b=!1;0<f.length;){(d=f[0].getAttributeNS(p,"style-name"))?a[d]||(e=h.getStyleElement(d,"paragraph"),a[d]=!0,e||b||k()):b?e=void 0:k();if(void 0!==e&&(d=null===e?h.getSystemDefaultStyleAttributes("paragraph"):h.getInheritedStyleAttributes(e,
!0),(d=d["style:paragraph-properties"])&&-1===m.indexOf(d[c])))return!1;f.pop()}return!0}var q=new odf.OdfUtils,p=odf.Namespaces.textns;this.getAppliedStyles=function(f){var c;f.collapsed?(c=f.startContainer,c.hasChildNodes()&&f.startOffset<c.childNodes.length&&(c=c.childNodes.item(f.startOffset)),f=[c]):f=q.getTextNodes(f,!0);return h.getAppliedStyles(f)};this.isBold=function(f){return k(f,"fo:font-weight","bold")};this.isItalic=function(f){return k(f,"fo:font-style","italic")};this.hasUnderline=
function(f){return k(f,"style:text-underline-style","solid")};this.hasStrikeThrough=function(f){return k(f,"style:text-line-through-style","solid")};this.isAlignedLeft=function(h){return f(h,"fo:text-align",["left","start"])};this.isAlignedCenter=function(h){return f(h,"fo:text-align",["center"])};this.isAlignedRight=function(h){return f(h,"fo:text-align",["right","end"])};this.isAlignedJustified=function(h){return f(h,"fo:text-align",["justify"])}};
// Input 43
core.RawDeflate=function(){function h(){this.dl=this.fc=0}function k(){this.extra_bits=this.static_tree=this.dyn_tree=null;this.max_code=this.max_length=this.elems=this.extra_base=0}function f(a,b,c,d){this.good_length=a;this.max_lazy=b;this.nice_length=c;this.max_chain=d}function q(){this.next=null;this.len=0;this.ptr=[];this.ptr.length=p;this.off=0}var p=8192,n,c,m,r,d=null,e,a,b,g,l,u,x,w,y,v,t,s,L,z,B,N,I,T,A,C,ia,xa,E,R,Z,M,S,F,G,V,da,D,J,U,ba,qa,Y,ra,W,aa,$,fa,O,ja,ma,sa,P,Q,H,Ca,Aa,va=[0,0,
0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],Da=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],K=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],Ea=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],ya;ya=[new f(0,0,0,0),new f(4,4,8,4),new f(4,5,16,8),new f(4,6,32,32),new f(4,4,16,16),new f(8,16,32,32),new f(8,16,128,128),new f(8,32,128,256),new f(32,128,258,1024),new f(32,258,258,4096)];var oa=function(b){d[a+e++]=b;if(a+e===p){var g;if(0!==e){null!==n?(b=n,n=n.next):b=new q;
b.next=null;b.len=b.off=0;null===c?c=m=b:m=m.next=b;b.len=e-a;for(g=0;g<b.len;g++)b.ptr[g]=d[a+g];e=a=0}}},za=function(b){b&=65535;a+e<p-2?(d[a+e++]=b&255,d[a+e++]=b>>>8):(oa(b&255),oa(b>>>8))},wa=function(){t=(t<<5^g[I+3-1]&255)&8191;s=x[32768+t];x[I&32767]=s;x[32768+t]=I},ga=function(a,b){y>16-b?(w|=a<<y,za(w),w=a>>16-y,y+=b-16):(w|=a<<y,y+=b)},ka=function(a,b){ga(b[a].fc,b[a].dl)},ca=function(a,b,c){return a[b].fc<a[c].fc||a[b].fc===a[c].fc&&Y[b]<=Y[c]},Ia=function(a,b,c){var d;for(d=0;d<c&&Aa<
Ca.length;d++)a[b+d]=Ca.charCodeAt(Aa++)&255;return d},ea=function(){var a,b,c=65536-C-I;if(-1===c)c--;else if(65274<=I){for(a=0;32768>a;a++)g[a]=g[a+32768];T-=32768;I-=32768;v-=32768;for(a=0;8192>a;a++)b=x[32768+a],x[32768+a]=32768<=b?b-32768:0;for(a=0;32768>a;a++)b=x[a],x[a]=32768<=b?b-32768:0;c+=32768}A||(a=Ia(g,I+C,c),0>=a?A=!0:C+=a)},X=function(a){var b=ia,c=I,d,e=N,f=32506<I?I-32506:0,l=I+258,h=g[c+e-1],m=g[c+e];N>=R&&(b>>=2);do if(d=a,g[d+e]===m&&g[d+e-1]===h&&g[d]===g[c]&&g[++d]===g[c+1]){c+=
2;d++;do++c;while(g[c]===g[++d]&&g[++c]===g[++d]&&g[++c]===g[++d]&&g[++c]===g[++d]&&g[++c]===g[++d]&&g[++c]===g[++d]&&g[++c]===g[++d]&&g[++c]===g[++d]&&c<l);d=258-(l-c);c=l-258;if(d>e){T=a;e=d;if(258<=d)break;h=g[c+e-1];m=g[c+e]}a=x[a&32767]}while(a>f&&0!==--b);return e},ta=function(a,b){u[O++]=b;0===a?Z[b].fc++:(a--,Z[ra[b]+256+1].fc++,M[(256>a?W[a]:W[256+(a>>7)])&255].fc++,l[ja++]=a,sa|=P);P<<=1;0===(O&7)&&(fa[ma++]=sa,sa=0,P=1);if(2<E&&0===(O&4095)){var c=8*O,d=I-v,g;for(g=0;30>g;g++)c+=M[g].fc*
(5+Da[g]);c>>=3;if(ja<parseInt(O/2,10)&&c<parseInt(d/2,10))return!0}return 8191===O||8192===ja},pa=function(a,b){for(var c=U[b],d=b<<1;d<=ba;){d<ba&&ca(a,U[d+1],U[d])&&d++;if(ca(a,c,U[d]))break;U[b]=U[d];b=d;d<<=1}U[b]=c},ha=function(a,b){var c=0;do c|=a&1,a>>=1,c<<=1;while(0<--b);return c>>1},la=function(a,b){var c=[];c.length=16;var d=0,g;for(g=1;15>=g;g++)d=d+J[g-1]<<1,c[g]=d;for(d=0;d<=b;d++)g=a[d].dl,0!==g&&(a[d].fc=ha(c[g]++,g))},Ja=function(a){var b=a.dyn_tree,c=a.static_tree,d=a.elems,g,e=
-1,f=d;ba=0;qa=573;for(g=0;g<d;g++)0!==b[g].fc?(U[++ba]=e=g,Y[g]=0):b[g].dl=0;for(;2>ba;)g=U[++ba]=2>e?++e:0,b[g].fc=1,Y[g]=0,Q--,null!==c&&(H-=c[g].dl);a.max_code=e;for(g=ba>>1;1<=g;g--)pa(b,g);do g=U[1],U[1]=U[ba--],pa(b,1),c=U[1],U[--qa]=g,U[--qa]=c,b[f].fc=b[g].fc+b[c].fc,Y[f]=Y[g]>Y[c]+1?Y[g]:Y[c]+1,b[g].dl=b[c].dl=f,U[1]=f++,pa(b,1);while(2<=ba);U[--qa]=U[1];f=a.dyn_tree;g=a.extra_bits;var d=a.extra_base,c=a.max_code,l=a.max_length,h=a.static_tree,m,k,n,r,q=0;for(k=0;15>=k;k++)J[k]=0;f[U[qa]].dl=
0;for(a=qa+1;573>a;a++)m=U[a],k=f[f[m].dl].dl+1,k>l&&(k=l,q++),f[m].dl=k,m>c||(J[k]++,n=0,m>=d&&(n=g[m-d]),r=f[m].fc,Q+=r*(k+n),null!==h&&(H+=r*(h[m].dl+n)));if(0!==q){do{for(k=l-1;0===J[k];)k--;J[k]--;J[k+1]+=2;J[l]--;q-=2}while(0<q);for(k=l;0!==k;k--)for(m=J[k];0!==m;)g=U[--a],g>c||(f[g].dl!==k&&(Q+=(k-f[g].dl)*f[g].fc,f[g].fc=k),m--)}la(b,e)},Ha=function(a,b){var c,d=-1,g,e=a[0].dl,f=0,l=7,h=4;0===e&&(l=138,h=3);a[b+1].dl=65535;for(c=0;c<=b;c++)g=e,e=a[c+1].dl,++f<l&&g===e||(f<h?G[g].fc+=f:0!==
g?(g!==d&&G[g].fc++,G[16].fc++):10>=f?G[17].fc++:G[18].fc++,f=0,d=g,0===e?(l=138,h=3):g===e?(l=6,h=3):(l=7,h=4))},Ka=function(){8<y?za(w):0<y&&oa(w);y=w=0},Fa=function(a,b){var c,d=0,g=0,e=0,f=0,h,m;if(0!==O){do 0===(d&7)&&(f=fa[e++]),c=u[d++]&255,0===(f&1)?ka(c,a):(h=ra[c],ka(h+256+1,a),m=va[h],0!==m&&(c-=aa[h],ga(c,m)),c=l[g++],h=(256>c?W[c]:W[256+(c>>7)])&255,ka(h,b),m=Da[h],0!==m&&(c-=$[h],ga(c,m))),f>>=1;while(d<O)}ka(256,a)},Ga=function(a,b){var c,d=-1,g,e=a[0].dl,f=0,l=7,h=4;0===e&&(l=138,
h=3);for(c=0;c<=b;c++)if(g=e,e=a[c+1].dl,!(++f<l&&g===e)){if(f<h){do ka(g,G);while(0!==--f)}else 0!==g?(g!==d&&(ka(g,G),f--),ka(16,G),ga(f-3,2)):10>=f?(ka(17,G),ga(f-3,3)):(ka(18,G),ga(f-11,7));f=0;d=g;0===e?(l=138,h=3):g===e?(l=6,h=3):(l=7,h=4)}},La=function(){var a;for(a=0;286>a;a++)Z[a].fc=0;for(a=0;30>a;a++)M[a].fc=0;for(a=0;19>a;a++)G[a].fc=0;Z[256].fc=1;sa=O=ja=ma=Q=H=0;P=1},na=function(a){var b,c,d,e;e=I-v;fa[ma]=sa;Ja(V);Ja(da);Ha(Z,V.max_code);Ha(M,da.max_code);Ja(D);for(d=18;3<=d&&0===G[Ea[d]].dl;d--);
Q+=3*(d+1)+14;b=Q+3+7>>3;c=H+3+7>>3;c<=b&&(b=c);if(e+4<=b&&0<=v)for(ga(0+a,3),Ka(),za(e),za(~e),d=0;d<e;d++)oa(g[v+d]);else if(c===b)ga(2+a,3),Fa(S,F);else{ga(4+a,3);e=V.max_code+1;b=da.max_code+1;d+=1;ga(e-257,5);ga(b-1,5);ga(d-4,4);for(c=0;c<d;c++)ga(G[Ea[c]].dl,3);Ga(Z,e-1);Ga(M,b-1);Fa(Z,M)}La();0!==a&&Ka()},Ba=function(b,g,f){var l,h,m;for(l=0;null!==c&&l<f;){h=f-l;h>c.len&&(h=c.len);for(m=0;m<h;m++)b[g+l+m]=c.ptr[c.off+m];c.off+=h;c.len-=h;l+=h;0===c.len&&(h=c,c=c.next,h.next=n,n=h)}if(l===
f)return l;if(a<e){h=f-l;h>e-a&&(h=e-a);for(m=0;m<h;m++)b[g+l+m]=d[a+m];a+=h;l+=h;e===a&&(e=a=0)}return l},ua=function(d,f,l){var h;if(!r){if(!A){y=w=0;var m,k;if(0===F[0].dl){V.dyn_tree=Z;V.static_tree=S;V.extra_bits=va;V.extra_base=257;V.elems=286;V.max_length=15;V.max_code=0;da.dyn_tree=M;da.static_tree=F;da.extra_bits=Da;da.extra_base=0;da.elems=30;da.max_length=15;da.max_code=0;D.dyn_tree=G;D.static_tree=null;D.extra_bits=K;D.extra_base=0;D.elems=19;D.max_length=7;for(k=m=D.max_code=0;28>k;k++)for(aa[k]=
m,h=0;h<1<<va[k];h++)ra[m++]=k;ra[m-1]=k;for(k=m=0;16>k;k++)for($[k]=m,h=0;h<1<<Da[k];h++)W[m++]=k;for(m>>=7;30>k;k++)for($[k]=m<<7,h=0;h<1<<Da[k]-7;h++)W[256+m++]=k;for(h=0;15>=h;h++)J[h]=0;for(h=0;143>=h;)S[h++].dl=8,J[8]++;for(;255>=h;)S[h++].dl=9,J[9]++;for(;279>=h;)S[h++].dl=7,J[7]++;for(;287>=h;)S[h++].dl=8,J[8]++;la(S,287);for(h=0;30>h;h++)F[h].dl=5,F[h].fc=ha(h,5);La()}for(h=0;8192>h;h++)x[32768+h]=0;xa=ya[E].max_lazy;R=ya[E].good_length;ia=ya[E].max_chain;v=I=0;C=Ia(g,0,65536);if(0>=C)A=
!0,C=0;else{for(A=!1;262>C&&!A;)ea();for(h=t=0;2>h;h++)t=(t<<5^g[h]&255)&8191}c=null;a=e=0;3>=E?(N=2,B=0):(B=2,z=0);b=!1}r=!0;if(0===C)return b=!0,0}h=Ba(d,f,l);if(h===l)return l;if(b)return h;if(3>=E)for(;0!==C&&null===c;){wa();0!==s&&32506>=I-s&&(B=X(s),B>C&&(B=C));if(3<=B)if(k=ta(I-T,B-3),C-=B,B<=xa){B--;do I++,wa();while(0!==--B);I++}else I+=B,B=0,t=g[I]&255,t=(t<<5^g[I+1]&255)&8191;else k=ta(0,g[I]&255),C--,I++;k&&(na(0),v=I);for(;262>C&&!A;)ea()}else for(;0!==C&&null===c;){wa();N=B;L=T;B=2;
0!==s&&N<xa&&32506>=I-s&&(B=X(s),B>C&&(B=C),3===B&&4096<I-T&&B--);if(3<=N&&B<=N){k=ta(I-1-L,N-3);C-=N-1;N-=2;do I++,wa();while(0!==--N);z=0;B=2;I++;k&&(na(0),v=I)}else 0!==z?ta(0,g[I-1]&255)&&(na(0),v=I):z=1,I++,C--;for(;262>C&&!A;)ea()}0===C&&(0!==z&&ta(0,g[I-1]&255),na(1),b=!0);return h+Ba(d,h+f,l-h)};this.deflate=function(a,b){var e,f;Ca=a;Aa=0;"undefined"===String(typeof b)&&(b=6);(e=b)?1>e?e=1:9<e&&(e=9):e=6;E=e;A=r=!1;if(null===d){n=c=m=null;d=[];d.length=p;g=[];g.length=65536;l=[];l.length=
8192;u=[];u.length=32832;x=[];x.length=65536;Z=[];Z.length=573;for(e=0;573>e;e++)Z[e]=new h;M=[];M.length=61;for(e=0;61>e;e++)M[e]=new h;S=[];S.length=288;for(e=0;288>e;e++)S[e]=new h;F=[];F.length=30;for(e=0;30>e;e++)F[e]=new h;G=[];G.length=39;for(e=0;39>e;e++)G[e]=new h;V=new k;da=new k;D=new k;J=[];J.length=16;U=[];U.length=573;Y=[];Y.length=573;ra=[];ra.length=256;W=[];W.length=512;aa=[];aa.length=29;$=[];$.length=30;fa=[];fa.length=1024}var q=Array(1024),v=[],s=[];for(e=ua(q,0,q.length);0<e;){s.length=
e;for(f=0;f<e;f++)s[f]=String.fromCharCode(q[f]);v[v.length]=s.join("");e=ua(q,0,q.length)}Ca="";return v.join("")}};
// Input 44
runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.OdfUtils");runtime.loadClass("xmldom.XPath");
gui.HyperlinkClickHandler=function(h){function k(){h().removeAttributeNS("urn:webodf:names:helper","links","inactive")}function f(){h().setAttributeNS("urn:webodf:names:helper","links","inactive")}var q=new odf.OdfUtils,p=xmldom.XPath,n=!1;this.handleClick=function(c){var f=c.target||c.srcElement,k;if(!n||c.ctrlKey||c.metaKey){a:{for(c=f;null!==c;){if(q.isHyperlink(c))break a;if(q.isParagraph(c))break;c=c.parentNode}c=null}c&&(c=q.getHyperlinkTarget(c))&&("#"===c[0]?(c=c.substring(1),f=h(),k=p.getODFElementsWithXPath(f,
"//text:bookmark-start[@text:name='"+c+"']",odf.Namespaces.lookupNamespaceURI),0===k.length&&(k=p.getODFElementsWithXPath(f,"//text:bookmark[@text:name='"+c+"']",odf.Namespaces.lookupNamespaceURI)),0<k.length&&k[0].scrollIntoView(!0)):runtime.getWindow().open(c))}};this.showPointerCursor=k;this.showTextCursor=f;this.setEditing=function(c){(n=c)?f():k()}};
// Input 45
runtime.loadClass("odf.Namespaces");
gui.ImageSelector=function(h){function k(){var c=h.getSizer(),f,k;f=p.createElement("div");f.id="imageSelector";f.style.borderWidth="1px";c.appendChild(f);q.forEach(function(c){k=p.createElement("div");k.className=c;f.appendChild(k)});return f}var f=odf.Namespaces.svgns,q="topLeft topRight bottomRight bottomLeft topMiddle rightMiddle bottomMiddle leftMiddle".split(" "),p=h.getElement().ownerDocument,n=!1;this.select=function(c){var m,r,d=p.getElementById("imageSelector");d||(d=k());n=!0;m=d.parentNode;
r=c.getBoundingClientRect();var e=m.getBoundingClientRect(),a=h.getZoomLevel();m=(r.left-e.left)/a-1;r=(r.top-e.top)/a-1;d.style.display="block";d.style.left=m+"px";d.style.top=r+"px";d.style.width=c.getAttributeNS(f,"width");d.style.height=c.getAttributeNS(f,"height")};this.clearSelection=function(){var c;n&&(c=p.getElementById("imageSelector"))&&(c.style.display="none");n=!1};this.isSelectorElement=function(c){var f=p.getElementById("imageSelector");return f?c===f||c.parentNode===f:!1}};
// Input 46
runtime.loadClass("odf.OdfCanvas");
odf.CommandLineTools=function(){this.roundTrip=function(h,k,f){return new odf.OdfContainer(h,function(q){if(q.state===odf.OdfContainer.INVALID)return f("Document "+h+" is invalid.");q.state===odf.OdfContainer.DONE?q.saveAs(k,function(h){f(h)}):f("Document was not completely loaded.")})};this.render=function(h,k,f){for(k=k.getElementsByTagName("body")[0];k.firstChild;)k.removeChild(k.firstChild);k=new odf.OdfCanvas(k);k.addListener("statereadychange",function(h){f(h)});k.load(h)}};
// Input 47
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.Member=function(h,k){var f={};this.getMemberId=function(){return h};this.getProperties=function(){return f};this.setProperties=function(h){Object.keys(h).forEach(function(k){f[k]=h[k]})};this.removeProperties=function(h){delete h.fullName;delete h.color;delete h.imageUrl;Object.keys(h).forEach(function(h){f.hasOwnProperty(h)&&delete f[h]})};runtime.assert(Boolean(h),"No memberId was supplied!");k.fullName||(k.fullName=runtime.tr("Unknown Author"));k.color||(k.color="black");k.imageUrl||(k.imageUrl=
"avatar-joe.png");f=k};
// Input 48
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("core.PositionFilter");runtime.loadClass("odf.OdfUtils");
(function(){function h(f,h,p){function n(a,b){function c(a){for(var b=0;a&&a.previousSibling;)b+=1,a=a.previousSibling;return b}this.steps=a;this.node=b;this.setIteratorPosition=function(a){a.setUnfilteredPosition(b.parentNode,c(b));do if(h.acceptPosition(a)===u)break;while(a.nextPosition())}}function c(a){return a.nodeType===Node.ELEMENT_NODE&&a.getAttributeNS(d,"nodeId")}function m(a){var b=k;a.setAttributeNS(d,"nodeId",b.toString());k+=1;return b}function r(b,g){var e,l=null;for(b=b.childNodes[g]||
b;!l&&b&&b!==f;)(e=c(b))&&(l=a[e])&&l.node!==b&&(runtime.log("Cloned node detected. Creating new bookmark"),l=null,b.removeAttributeNS(d,"nodeId")),b=b.parentNode;return l}var d="urn:webodf:names:steps",e={},a={},b=new odf.OdfUtils,g=new core.DomUtils,l,u=core.PositionFilter.FilterResult.FILTER_ACCEPT;this.updateCache=function(d,g,f,l){var h;0===f&&b.isParagraph(g)?(h=!0,l||(d+=1)):g.hasChildNodes()&&g.childNodes[f]&&(g=g.childNodes[f],(h=b.isParagraph(g))&&(d+=1));h&&(f=c(g)||m(g),(l=a[f])?l.node===
g?l.steps=d:(runtime.log("Cloned node detected. Creating new bookmark"),f=m(g),l=a[f]=new n(d,g)):l=a[f]=new n(d,g),f=l,d=Math.ceil(f.steps/p)*p,g=e[d],!g||f.steps>g.steps)&&(e[d]=f)};this.setToClosestStep=function(a,b){for(var c=Math.floor(a/p)*p,d;!d&&0!==c;)d=e[c],c-=p;d=d||l;d.setIteratorPosition(b);return d.steps};this.setToClosestDomPoint=function(a,b,c){var d;if(a===f&&0===b)d=l;else if(a===f&&b===f.childNodes.length)d=Object.keys(e).map(function(a){return e[a]}).reduce(function(a,b){return b.steps>
a.steps?b:a},l);else if(d=r(a,b),!d)for(c.setUnfilteredPosition(a,b);!d&&c.previousNode();)d=r(c.container(),c.unfilteredDomOffset());d=d||l;d.setIteratorPosition(c);return d.steps};this.updateCacheAtPoint=function(b,d){var l={};Object.keys(a).map(function(b){return a[b]}).filter(function(a){return a.steps>b}).forEach(function(b){var h=Math.ceil(b.steps/p)*p,m,k;if(g.containsNode(f,b.node)){if(d(b),m=Math.ceil(b.steps/p)*p,k=l[m],!k||b.steps>k.steps)l[m]=b}else delete a[c(b.node)];e[h]===b&&delete e[h]});
Object.keys(l).forEach(function(a){e[a]=l[a]})};l=new function(a,b){this.steps=a;this.node=b;this.setIteratorPosition=function(a){a.setUnfilteredPosition(b,0);do if(h.acceptPosition(a)===u)break;while(a.nextPosition())}}(0,f)}var k=0;ops.StepsTranslator=function(f,k,p,n){function c(){var b=f();b!==r&&(runtime.log("Undo detected. Resetting steps cache"),r=b,d=new h(r,p,n),a=k(r))}function m(a,c){if(!c||p.acceptPosition(a)===b)return!0;for(;a.previousPosition();)if(p.acceptPosition(a)===b){if(c(0,a.container(),
a.unfilteredDomOffset()))return!0;break}for(;a.nextPosition();)if(p.acceptPosition(a)===b){if(c(1,a.container(),a.unfilteredDomOffset()))return!0;break}return!1}var r=f(),d=new h(r,p,n),e=new core.DomUtils,a=k(f()),b=core.PositionFilter.FilterResult.FILTER_ACCEPT;this.convertStepsToDomPoint=function(g){var e,f;0>g&&(runtime.log("warn","Requested steps were negative ("+g+")"),g=0);c();for(e=d.setToClosestStep(g,a);e<g&&a.nextPosition();)(f=p.acceptPosition(a)===b)&&(e+=1),d.updateCache(e,a.container(),
a.unfilteredDomOffset(),f);e!==g&&runtime.log("warn","Requested "+g+" steps but only "+e+" are available");return{node:a.container(),offset:a.unfilteredDomOffset()}};this.convertDomPointToSteps=function(g,f,h){var k;c();e.containsNode(r,g)||(f=0>e.comparePoints(r,0,g,f),g=r,f=f?0:r.childNodes.length);a.setUnfilteredPosition(g,f);m(a,h)||a.setUnfilteredPosition(g,f);h=a.container();f=a.unfilteredDomOffset();g=d.setToClosestDomPoint(h,f,a);if(0>e.comparePoints(a.container(),a.unfilteredDomOffset(),
h,f))return 0<g?g-1:g;for(;(a.container()!==h||a.unfilteredDomOffset()!==f)&&a.nextPosition();)(k=p.acceptPosition(a)===b)&&(g+=1),d.updateCache(g,a.container(),a.unfilteredDomOffset(),k);return g+0};this.prime=function(){var g,e;c();for(g=d.setToClosestStep(0,a);a.nextPosition();)(e=p.acceptPosition(a)===b)&&(g+=1),d.updateCache(g,a.container(),a.unfilteredDomOffset(),e)};this.handleStepsInserted=function(a){c();d.updateCacheAtPoint(a.position,function(b){b.steps+=a.length})};this.handleStepsRemoved=
function(a){c();d.updateCacheAtPoint(a.position,function(b){b.steps-=a.length;0>b.steps&&(b.steps=0)})}};ops.StepsTranslator.PREVIOUS_STEP=0;ops.StepsTranslator.NEXT_STEP=1;return ops.StepsTranslator})();
// Input 49
xmldom.RNG={};
xmldom.RelaxNGParser=function(){function h(c,e){this.message=function(){e&&(c+=1===e.nodeType?" Element ":" Node ",c+=e.nodeName,e.nodeValue&&(c+=" with value '"+e.nodeValue+"'"),c+=".");return c}}function k(c){if(2>=c.e.length)return c;var e={name:c.name,e:c.e.slice(0,2)};return k({name:c.name,e:[e].concat(c.e.slice(2))})}function f(c){c=c.split(":",2);var e="",a;1===c.length?c=["",c[0]]:e=c[0];for(a in m)m[a]===e&&(c[0]=a);return c}function q(c,e){for(var a=0,b,g,h=c.name;c.e&&a<c.e.length;)if(b=c.e[a],
"ref"===b.name){g=e[b.a.name];if(!g)throw b.a.name+" was not defined.";b=c.e.slice(a+1);c.e=c.e.slice(0,a);c.e=c.e.concat(g.e);c.e=c.e.concat(b)}else a+=1,q(b,e);b=c.e;"choice"!==h||b&&b[1]&&"empty"!==b[1].name||(b&&b[0]&&"empty"!==b[0].name?(b[1]=b[0],b[0]={name:"empty"}):(delete c.e,c.name="empty"));if("group"===h||"interleave"===h)"empty"===b[0].name?"empty"===b[1].name?(delete c.e,c.name="empty"):(h=c.name=b[1].name,c.names=b[1].names,b=c.e=b[1].e):"empty"===b[1].name&&(h=c.name=b[0].name,c.names=
b[0].names,b=c.e=b[0].e);"oneOrMore"===h&&"empty"===b[0].name&&(delete c.e,c.name="empty");if("attribute"===h){g=c.names?c.names.length:0;for(var m,k=[],n=[],a=0;a<g;a+=1)m=f(c.names[a]),n[a]=m[0],k[a]=m[1];c.localnames=k;c.namespaces=n}"interleave"===h&&("interleave"===b[0].name?c.e="interleave"===b[1].name?b[0].e.concat(b[1].e):[b[1]].concat(b[0].e):"interleave"===b[1].name&&(c.e=[b[0]].concat(b[1].e)))}function p(c,e){for(var a=0,b;c.e&&a<c.e.length;)b=c.e[a],"elementref"===b.name?(b.id=b.id||
0,c.e[a]=e[b.id]):"element"!==b.name&&p(b,e),a+=1}var n=this,c,m={"http://www.w3.org/XML/1998/namespace":"xml"},r;r=function(c,e,a){var b=[],g,h,n=c.localName,q=[];g=c.attributes;var p=n,y=q,v={},t,s;for(t=0;g&&t<g.length;t+=1)if(s=g.item(t),s.namespaceURI)"http://www.w3.org/2000/xmlns/"===s.namespaceURI&&(m[s.value]=s.localName);else{"name"!==s.localName||"element"!==p&&"attribute"!==p||y.push(s.value);if("name"===s.localName||"combine"===s.localName||"type"===s.localName){var L=s,z;z=s.value;z=
z.replace(/^\s\s*/,"");for(var B=/\s/,N=z.length-1;B.test(z.charAt(N));)N-=1;z=z.slice(0,N+1);L.value=z}v[s.localName]=s.value}g=v;g.combine=g.combine||void 0;c=c.firstChild;p=b;y=q;for(v="";c;){if(c.nodeType===Node.ELEMENT_NODE&&"http://relaxng.org/ns/structure/1.0"===c.namespaceURI){if(t=r(c,e,p))"name"===t.name?y.push(m[t.a.ns]+":"+t.text):"choice"===t.name&&t.names&&t.names.length&&(y=y.concat(t.names),delete t.names),p.push(t)}else c.nodeType===Node.TEXT_NODE&&(v+=c.nodeValue);c=c.nextSibling}c=
v;"value"!==n&&"param"!==n&&(c=/^\s*([\s\S]*\S)?\s*$/.exec(c)[1]);"value"===n&&void 0===g.type&&(g.type="token",g.datatypeLibrary="");"attribute"!==n&&"element"!==n||void 0===g.name||(h=f(g.name),b=[{name:"name",text:h[1],a:{ns:h[0]}}].concat(b),delete g.name);"name"===n||"nsName"===n||"value"===n?void 0===g.ns&&(g.ns=""):delete g.ns;"name"===n&&(h=f(c),g.ns=h[0],c=h[1]);1<b.length&&("define"===n||"oneOrMore"===n||"zeroOrMore"===n||"optional"===n||"list"===n||"mixed"===n)&&(b=[{name:"group",e:k({name:"group",
e:b}).e}]);2<b.length&&"element"===n&&(b=[b[0]].concat({name:"group",e:k({name:"group",e:b.slice(1)}).e}));1===b.length&&"attribute"===n&&b.push({name:"text",text:c});1!==b.length||"choice"!==n&&"group"!==n&&"interleave"!==n?2<b.length&&("choice"===n||"group"===n||"interleave"===n)&&(b=k({name:n,e:b}).e):(n=b[0].name,q=b[0].names,g=b[0].a,c=b[0].text,b=b[0].e);"mixed"===n&&(n="interleave",b=[b[0],{name:"text"}]);"optional"===n&&(n="choice",b=[b[0],{name:"empty"}]);"zeroOrMore"===n&&(n="choice",b=
[{name:"oneOrMore",e:[b[0]]},{name:"empty"}]);if("define"===n&&g.combine){a:{p=g.combine;y=g.name;v=b;for(t=0;a&&t<a.length;t+=1)if(s=a[t],"define"===s.name&&s.a&&s.a.name===y){s.e=[{name:p,e:s.e.concat(v)}];a=s;break a}a=null}if(a)return null}a={name:n};b&&0<b.length&&(a.e=b);for(h in g)if(g.hasOwnProperty(h)){a.a=g;break}void 0!==c&&(a.text=c);q&&0<q.length&&(a.names=q);"element"===n&&(a.id=e.length,e.push(a),a={name:"elementref",id:a.id});return a};this.parseRelaxNGDOM=function(d,e){var a=[],b=
r(d&&d.documentElement,a,void 0),g,f,k={};for(g=0;g<b.e.length;g+=1)f=b.e[g],"define"===f.name?k[f.a.name]=f:"start"===f.name&&(c=f);if(!c)return[new h("No Relax NG start element was found.")];q(c,k);for(g in k)k.hasOwnProperty(g)&&q(k[g],k);for(g=0;g<a.length;g+=1)q(a[g],k);e&&(n.rootPattern=e(c.e[0],a));p(c,a);for(g=0;g<a.length;g+=1)p(a[g],a);n.start=c;n.elements=a;n.nsmap=m;return null}};
// Input 50
runtime.loadClass("core.Cursor");runtime.loadClass("core.EventNotifier");runtime.loadClass("gui.SelectionMover");
ops.OdtCursor=function(h,k){var f=this,q={},p,n,c,m=new core.EventNotifier([ops.OdtCursor.signalCursorUpdated]);this.removeFromOdtDocument=function(){c.remove()};this.move=function(c,d){var e=0;0<c?e=n.movePointForward(c,d):0>=c&&(e=-n.movePointBackward(-c,d));m.emit(ops.OdtCursor.signalCursorUpdated,f);return e};this.subscribe=function(c,d){m.subscribe(c,d)};this.unsubscribe=function(c,d){m.unsubscribe(c,d)};this.getStepCounter=function(){return n.getStepCounter()};this.getMemberId=function(){return h};
this.getNode=function(){return c.getNode()};this.getAnchorNode=function(){return c.getAnchorNode()};this.getSelectedRange=function(){return c.getSelectedRange()};this.setSelectedRange=function(h,d){c.setSelectedRange(h,d);m.emit(ops.OdtCursor.signalCursorUpdated,f)};this.hasForwardSelection=function(){return c.hasForwardSelection()};this.getOdtDocument=function(){return k};this.getSelectionType=function(){return p};this.setSelectionType=function(c){q.hasOwnProperty(c)?p=c:runtime.log("Invalid selection type: "+
c)};this.resetSelectionType=function(){f.setSelectionType(ops.OdtCursor.RangeSelection)};c=new core.Cursor(k.getDOM(),h);n=new gui.SelectionMover(c,k.getRootNode());q[ops.OdtCursor.RangeSelection]=!0;q[ops.OdtCursor.RegionSelection]=!0;f.resetSelectionType()};ops.OdtCursor.RangeSelection="Range";ops.OdtCursor.RegionSelection="Region";ops.OdtCursor.signalCursorUpdated="cursorUpdated";(function(){return ops.OdtCursor})();
// Input 51
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.EventNotifier");runtime.loadClass("core.DomUtils");runtime.loadClass("odf.OdfUtils");runtime.loadClass("odf.Namespaces");runtime.loadClass("gui.SelectionMover");runtime.loadClass("core.PositionFilterChain");runtime.loadClass("ops.StepsTranslator");runtime.loadClass("ops.TextPositionFilter");runtime.loadClass("ops.Member");
ops.OdtDocument=function(h){function k(){var a=h.odfContainer().getContentElement(),b=a&&a.localName;runtime.assert("text"===b,"Unsupported content element type '"+b+"' for OdtDocument");return a}function f(){return k().ownerDocument}function q(a){for(;a&&!(a.namespaceURI===odf.Namespaces.officens&&"text"===a.localName||a.namespaceURI===odf.Namespaces.officens&&"annotation"===a.localName);)a=a.parentNode;return a}function p(b){this.acceptPosition=function(c){c=c.container();var d;d="string"===typeof b?
a[b].getNode():b;return q(c)===q(d)?l:u}}function n(a){var b=gui.SelectionMover.createPositionIterator(k());a=w.convertStepsToDomPoint(a);b.setUnfilteredPosition(a.node,a.offset);return b}function c(a,b){return h.getFormatting().getStyleElement(a,b)}function m(a){return c(a,"paragraph")}var r=this,d,e,a={},b={},g=new core.EventNotifier([ops.OdtDocument.signalMemberAdded,ops.OdtDocument.signalMemberUpdated,ops.OdtDocument.signalMemberRemoved,ops.OdtDocument.signalCursorAdded,ops.OdtDocument.signalCursorRemoved,
ops.OdtDocument.signalCursorMoved,ops.OdtDocument.signalParagraphChanged,ops.OdtDocument.signalParagraphStyleModified,ops.OdtDocument.signalCommonStyleCreated,ops.OdtDocument.signalCommonStyleDeleted,ops.OdtDocument.signalTableAdded,ops.OdtDocument.signalOperationExecuted,ops.OdtDocument.signalUndoStackChanged,ops.OdtDocument.signalStepsInserted,ops.OdtDocument.signalStepsRemoved]),l=core.PositionFilter.FilterResult.FILTER_ACCEPT,u=core.PositionFilter.FilterResult.FILTER_REJECT,x,w,y;this.getDOM=
f;this.getRootElement=q;this.getIteratorAtPosition=n;this.convertDomPointToCursorStep=function(a,b,c){return w.convertDomPointToSteps(a,b,c)};this.convertDomToCursorRange=function(a,b){var c,d;c=b&&b(a.anchorNode,a.anchorOffset);c=w.convertDomPointToSteps(a.anchorNode,a.anchorOffset,c);b||a.anchorNode!==a.focusNode||a.anchorOffset!==a.focusOffset?(d=b&&b(a.focusNode,a.focusOffset),d=w.convertDomPointToSteps(a.focusNode,a.focusOffset,d)):d=c;return{position:c,length:d-c}};this.convertCursorToDomRange=
function(a,b){var c=f().createRange(),d,g;d=w.convertStepsToDomPoint(a);b?(g=w.convertStepsToDomPoint(a+b),0<b?(c.setStart(d.node,d.offset),c.setEnd(g.node,g.offset)):(c.setStart(g.node,g.offset),c.setEnd(d.node,d.offset))):c.setStart(d.node,d.offset);return c};this.getStyleElement=c;this.upgradeWhitespacesAtPosition=function(a){a=n(a);var b,c,g;a.previousPosition();a.previousPosition();for(g=-1;1>=g;g+=1){b=a.container();c=a.unfilteredDomOffset();if(b.nodeType===Node.TEXT_NODE&&" "===b.data[c]&&
d.isSignificantWhitespace(b,c)){runtime.assert(" "===b.data[c],"upgradeWhitespaceToElement: textNode.data[offset] should be a literal space");var e=b.ownerDocument.createElementNS(odf.Namespaces.textns,"text:s");e.appendChild(b.ownerDocument.createTextNode(" "));b.deleteData(c,1);0<c&&(b=b.splitText(c));b.parentNode.insertBefore(e,b);b=e;a.moveToEndOfNode(b)}a.nextPosition()}};this.downgradeWhitespacesAtPosition=function(a){var b=n(a),c;a=b.container();for(b=b.unfilteredDomOffset();!d.isSpaceElement(a)&&
a.childNodes[b];)a=a.childNodes[b],b=0;a.nodeType===Node.TEXT_NODE&&(a=a.parentNode);d.isDowngradableSpaceElement(a)&&(b=a.firstChild,c=a.lastChild,e.mergeIntoParent(a),c!==b&&e.normalizeTextNodes(c),e.normalizeTextNodes(b))};this.getParagraphStyleElement=m;this.getParagraphElement=function(a){return d.getParagraphElement(a)};this.getParagraphStyleAttributes=function(a){return(a=m(a))?h.getFormatting().getInheritedStyleAttributes(a):null};this.getTextNodeAtStep=function(b,c){var d=n(b),g=d.container(),
e,h=0,l=null;g.nodeType===Node.TEXT_NODE?(e=g,h=d.unfilteredDomOffset(),0<e.length&&(0<h&&(e=e.splitText(h)),e.parentNode.insertBefore(f().createTextNode(""),e),e=e.previousSibling,h=0)):(e=f().createTextNode(""),h=0,g.insertBefore(e,d.rightNode()));if(c){if(a[c]&&r.getCursorPosition(c)===b){for(l=a[c].getNode();l.nextSibling&&"cursor"===l.nextSibling.localName;)l.parentNode.insertBefore(l.nextSibling,l);0<e.length&&e.nextSibling!==l&&(e=f().createTextNode(""),h=0);l.parentNode.insertBefore(e,l)}}else for(;e.nextSibling&&
"cursor"===e.nextSibling.localName;)e.parentNode.insertBefore(e.nextSibling,e);for(;e.previousSibling&&e.previousSibling.nodeType===Node.TEXT_NODE;)e.previousSibling.appendData(e.data),h=e.previousSibling.length,e=e.previousSibling,e.parentNode.removeChild(e.nextSibling);for(;e.nextSibling&&e.nextSibling.nodeType===Node.TEXT_NODE;)e.appendData(e.nextSibling.data),e.parentNode.removeChild(e.nextSibling);return{textNode:e,offset:h}};this.fixCursorPositions=function(){var b=new core.PositionFilterChain;
b.addFilter("BaseFilter",x);Object.keys(a).forEach(function(c){var d=a[c],g=d.getStepCounter(),e,f,h=!1;b.addFilter("RootFilter",r.createRootFilter(c));c=g.countStepsToPosition(d.getAnchorNode(),0,b);g.isPositionWalkable(b)?0===c&&(h=!0,d.move(0)):(h=!0,e=g.countPositionsToNearestStep(d.getNode(),0,b),f=g.countPositionsToNearestStep(d.getAnchorNode(),0,b),d.move(e),0!==c&&(0<f&&(c+=1),0<e&&(c-=1),g=g.countSteps(c,b),d.move(g),d.move(-g,!0)));h&&r.emit(ops.OdtDocument.signalCursorMoved,d);b.removeFilter("RootFilter")})};
this.getDistanceFromCursor=function(b,c,d){b=a[b];var g,e;runtime.assert(null!==c&&void 0!==c,"OdtDocument.getDistanceFromCursor called without node");b&&(g=w.convertDomPointToSteps(b.getNode(),0),e=w.convertDomPointToSteps(c,d));return e-g};this.getCursorPosition=function(b){return(b=a[b])?w.convertDomPointToSteps(b.getNode(),0):0};this.getCursorSelection=function(b){b=a[b];var c=0,d=0;b&&(c=w.convertDomPointToSteps(b.getNode(),0),d=w.convertDomPointToSteps(b.getAnchorNode(),0));return{position:d,
length:c-d}};this.getPositionFilter=function(){return x};this.getOdfCanvas=function(){return h};this.getRootNode=k;this.addMember=function(a){runtime.assert(void 0===b[a.getMemberId()],"This member already exists");b[a.getMemberId()]=a};this.getMember=function(a){return b.hasOwnProperty(a)?b[a]:null};this.removeMember=function(a){delete b[a]};this.getCursor=function(b){return a[b]};this.getCursors=function(){var b=[],c;for(c in a)a.hasOwnProperty(c)&&b.push(a[c]);return b};this.addCursor=function(b){runtime.assert(Boolean(b),
"OdtDocument::addCursor without cursor");var c=b.getStepCounter().countSteps(1,x),d=b.getMemberId();runtime.assert("string"===typeof d,"OdtDocument::addCursor has cursor without memberid");runtime.assert(!a[d],"OdtDocument::addCursor is adding a duplicate cursor with memberid "+d);b.move(c);a[d]=b};this.removeCursor=function(b){var c=a[b];return c?(c.removeFromOdtDocument(),delete a[b],r.emit(ops.OdtDocument.signalCursorRemoved,b),!0):!1};this.moveCursor=function(b,c,d,g){b=a[b];c=r.convertCursorToDomRange(c,
d);b&&c&&(b.setSelectedRange(c,0<=d),b.setSelectionType(g||ops.OdtCursor.RangeSelection))};this.getFormatting=function(){return h.getFormatting()};this.emit=function(a,b){g.emit(a,b)};this.subscribe=function(a,b){g.subscribe(a,b)};this.unsubscribe=function(a,b){g.unsubscribe(a,b)};this.createRootFilter=function(a){return new p(a)};this.close=function(a){a()};this.destroy=function(a){a()};x=new ops.TextPositionFilter(k);d=new odf.OdfUtils;e=new core.DomUtils;w=new ops.StepsTranslator(k,gui.SelectionMover.createPositionIterator,
x,500);g.subscribe(ops.OdtDocument.signalStepsInserted,w.handleStepsInserted);g.subscribe(ops.OdtDocument.signalStepsRemoved,w.handleStepsRemoved);g.subscribe(ops.OdtDocument.signalOperationExecuted,function(a){var b=a.spec(),c=b.memberid,b=(new Date(b.timestamp)).toISOString(),d=h.odfContainer();a.isEdit&&(c=r.getMember(c).getProperties().fullName,d.setMetadata({"dc:creator":c,"dc:date":b},null),y||(d.incrementEditingCycles(),d.setMetadata(null,["meta:editing-duration","meta:document-statistic"])),
y=a)})};ops.OdtDocument.signalMemberAdded="member/added";ops.OdtDocument.signalMemberUpdated="member/updated";ops.OdtDocument.signalMemberRemoved="member/removed";ops.OdtDocument.signalCursorAdded="cursor/added";ops.OdtDocument.signalCursorRemoved="cursor/removed";ops.OdtDocument.signalCursorMoved="cursor/moved";ops.OdtDocument.signalParagraphChanged="paragraph/changed";ops.OdtDocument.signalTableAdded="table/added";ops.OdtDocument.signalCommonStyleCreated="style/created";
ops.OdtDocument.signalCommonStyleDeleted="style/deleted";ops.OdtDocument.signalParagraphStyleModified="paragraphstyle/modified";ops.OdtDocument.signalOperationExecuted="operation/executed";ops.OdtDocument.signalUndoStackChanged="undo/changed";ops.OdtDocument.signalStepsInserted="steps/inserted";ops.OdtDocument.signalStepsRemoved="steps/removed";(function(){return ops.OdtDocument})();
// Input 52
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.Operation=function(){};ops.Operation.prototype.init=function(h){};ops.Operation.prototype.execute=function(h){};ops.Operation.prototype.spec=function(){};
// Input 53
runtime.loadClass("core.DomUtils");runtime.loadClass("gui.Avatar");runtime.loadClass("ops.OdtCursor");
gui.Caret=function(h,k,f){function q(d){e&&r.parentNode&&(!a||d)&&(d&&void 0!==b&&runtime.clearTimeout(b),a=!0,c.style.opacity=d||"0"===c.style.opacity?"1":"0",b=runtime.setTimeout(function(){a=!1;q(!1)},500))}function p(a,b){var c=a.getBoundingClientRect(),d=0,g=0;c&&b&&(d=Math.max(c.top,b.top),g=Math.min(c.bottom,b.bottom));return g-d}function n(){var a;a=h.getSelectedRange().cloneRange();var b=h.getNode(),e,f=null;b.previousSibling&&(e=b.previousSibling.nodeType===Node.TEXT_NODE?b.previousSibling.textContent.length:
b.previousSibling.childNodes.length,a.setStart(b.previousSibling,0<e?e-1:0),a.setEnd(b.previousSibling,e),(e=a.getBoundingClientRect())&&e.height&&(f=e));b.nextSibling&&(a.setStart(b.nextSibling,0),a.setEnd(b.nextSibling,0<(b.nextSibling.nodeType===Node.TEXT_NODE?b.nextSibling.textContent.length:b.nextSibling.childNodes.length)?1:0),(e=a.getBoundingClientRect())&&e.height&&(!f||p(b,e)>p(b,f))&&(f=e));a=f;b=h.getOdtDocument().getOdfCanvas().getZoomLevel();d&&h.getSelectionType()===ops.OdtCursor.RangeSelection?
c.style.visibility="visible":c.style.visibility="hidden";a?(c.style.top="0",f=g.getBoundingClientRect(c),8>a.height&&(a={top:a.top-(8-a.height)/2,height:8}),c.style.height=g.adaptRangeDifferenceToZoomLevel(a.height,b)+"px",c.style.top=g.adaptRangeDifferenceToZoomLevel(a.top-f.top,b)+"px"):(c.style.height="1em",c.style.top="5%")}var c,m,r,d=!0,e=!1,a=!1,b,g=new core.DomUtils;this.handleUpdate=n;this.refreshCursorBlinking=function(){f||h.getSelectedRange().collapsed?(e=!0,q(!0)):(e=!1,c.style.opacity=
"0")};this.setFocus=function(){e=!0;m.markAsFocussed(!0);q(!0)};this.removeFocus=function(){e=!1;m.markAsFocussed(!1);c.style.opacity="1"};this.show=function(){d=!0;n();m.markAsFocussed(!0)};this.hide=function(){d=!1;n();m.markAsFocussed(!1)};this.setAvatarImageUrl=function(a){m.setImageUrl(a)};this.setColor=function(a){c.style.borderColor=a;m.setColor(a)};this.getCursor=function(){return h};this.getFocusElement=function(){return c};this.toggleHandleVisibility=function(){m.isVisible()?m.hide():m.show()};
this.showHandle=function(){m.show()};this.hideHandle=function(){m.hide()};this.ensureVisible=function(){var a,b,d,g,e=h.getOdtDocument().getOdfCanvas().getElement().parentNode,f;d=e.offsetWidth-e.clientWidth+5;g=e.offsetHeight-e.clientHeight+5;f=c.getBoundingClientRect();a=f.left-d;b=f.top-g;d=f.right+d;g=f.bottom+g;f=e.getBoundingClientRect();b<f.top?e.scrollTop-=f.top-b:g>f.bottom&&(e.scrollTop+=g-f.bottom);a<f.left?e.scrollLeft-=f.left-a:d>f.right&&(e.scrollLeft+=d-f.right);n()};this.destroy=function(a){runtime.clearTimeout(b);
m.destroy(function(b){b?a(b):(r.removeChild(c),a())})};(function(){var a=h.getOdtDocument().getDOM();c=a.createElementNS(a.documentElement.namespaceURI,"span");c.className="caret";c.style.top="5%";r=h.getNode();r.appendChild(c);m=new gui.Avatar(r,k);n()})()};
// Input 54
gui.EventManager=function(h){function k(){var a=this,b=[];this.filters=[];this.handlers=[];this.handleEvent=function(c){-1===b.indexOf(c)&&(b.push(c),a.filters.every(function(a){return a(c)})&&a.handlers.forEach(function(a){a(c)}),runtime.setTimeout(function(){b.splice(b.indexOf(c),1)},0))}}function f(a){var b=a.scrollX,c=a.scrollY;this.restore=function(){a.scrollX===b&&a.scrollY===c||a.scrollTo(b,c)}}function q(a){var b=a.scrollTop,c=a.scrollLeft;this.restore=function(){if(a.scrollTop!==b||a.scrollLeft!==
c)a.scrollTop=b,a.scrollLeft=c}}function p(a,b,c){var e="on"+b,f=!1;a.attachEvent&&(f=a.attachEvent(e,c));!f&&a.addEventListener&&(a.addEventListener(b,c,!1),f=!0);f&&!d[b]||!a.hasOwnProperty(e)||(a[e]=c)}function n(c,d){var f=a[c]||null,m;!f&&d&&(m=h.getOdfCanvas().getElement(),f=a[c]=new k,e[c]&&(p(r,c,f.handleEvent),p(b,c,f.handleEvent)),p(m,c,f.handleEvent));return f}function c(){return h.getDOM().activeElement===b}function m(a){for(var b=[];a;)(a.scrollWidth>a.clientWidth||a.scrollHeight>a.clientHeight)&&
b.push(new q(a)),a=a.parentNode;b.push(new f(r));return b}var r=runtime.getWindow(),d={beforecut:!0,beforepaste:!0},e={mousedown:!0,mouseup:!0,focus:!0},a={},b;this.addFilter=function(a,b){n(a,!0).filters.push(b)};this.subscribe=function(a,b){n(a,!0).handlers.push(b)};this.unsubscribe=function(a,b){var c=n(a,!1),d=c&&c.handlers.indexOf(b);c&&-1!==d&&c.handlers.splice(d,1)};this.hasFocus=c;this.focus=function(){var a;c()||(a=m(b),b.focus(),a.forEach(function(a){a.restore()}))};this.getEventTrap=function(){return b};
this.blur=function(){c()&&b.blur()};(function(){var a=h.getOdfCanvas().getElement(),c=a.ownerDocument;runtime.assert(Boolean(r),"EventManager requires a window object to operate correctly");b=c.createElement("div");b.id="eventTrap";a.appendChild(b)})()};
// Input 55
runtime.loadClass("core.Async");runtime.loadClass("core.DomUtils");runtime.loadClass("core.EventNotifier");runtime.loadClass("core.ScheduledTask");runtime.loadClass("ops.OdtDocument");runtime.loadClass("ops.OdtCursor");
(function(){function h(f,h){function k(c){r=c.which&&String.fromCharCode(c.which)===m;m=void 0;return!1===r}function n(c){r&&h(c.data);r=!1}function c(c){m=c.data;r=!1}var m,r=!1;this.destroy=function(d){f.unsubscribe("textInput",n);f.unsubscribe("compositionend",c);f.unsubscribe("keypress",k);d()};f.subscribe("textInput",n);f.subscribe("compositionend",c);f.addFilter("keypress",k)}function k(f,h){function k(c){m&&c.data&&h(c.data);m=!1;r.cancel()}function n(c){c.data||(m=!0,r.trigger())}function c(){m=
!1;r.cancel()}var m=!1,r;this.destroy=function(c){f.unsubscribe("textInput",k);f.unsubscribe("compositionend",n);f.unsubscribe("compositionstart",n);r.destroy(c)};(function(){f.subscribe("textInput",k);f.subscribe("compositionend",n);f.subscribe("compositionstart",c);r=new core.ScheduledTask(function(){m=!1},0)})()}gui.InputMethodEditor=function(f,q,p){function n(){var c;y&&(y=!1,c=b.getNode(),c.removeAttributeNS(a,"composing"),t.emit(gui.InputMethodEditor.signalCompositionEnd,{data:v}),v="")}function c(a){y=
!0;v+=a;w.trigger()}function m(){var a=e.getSelection(),c,d=g.ownerDocument;n();for(u.containsNode(q.getOdfCanvas().getElement(),g)||q.getOdfCanvas().getElement().appendChild(g);1<g.childNodes.length;)g.removeChild(g.firstChild);c=g.firstChild;if(!c||c.nodeType!==Node.TEXT_NODE){for(;g.firstChild;)g.removeChild(g.firstChild);c=g.appendChild(d.createTextNode(""))}b&&b.getSelectedRange().collapsed?c.deleteData(0,c.length):c.replaceData(0,c.length,x);p.focus();a.collapse(g.firstChild,0);a.extend&&a.extend(g,
g.childNodes.length)}function r(){var c=b.getNode();w.cancel();c.setAttributeNS(a,"composing","true");y||t.emit(gui.InputMethodEditor.signalCompositionStart,{data:""})}function d(a){c(a.data)}var e=runtime.getWindow(),a="urn:webodf:names:cursor",b=null,g=p.getEventTrap(),l=new core.Async,u=new core.DomUtils,x="b",w,y=!1,v="",t=new core.EventNotifier([gui.InputMethodEditor.signalCompositionStart,gui.InputMethodEditor.signalCompositionEnd]),s=[],L;this.subscribe=t.subscribe;this.unsubscribe=t.unsubscribe;
this.registerCursor=function(a){var c;a.getMemberId()===f&&(c=p.hasFocus(),b=a,b.subscribe(ops.OdtCursor.signalCursorUpdated,m),a=b.getNode(),a.insertBefore(g,a.firstChild),c&&m())};this.removeCursor=function(a){a===f&&(a=p.hasFocus(),b.unsubscribe(ops.OdtCursor.signalCursorUpdated,m),b=null,q.getOdfCanvas().getElement().appendChild(g),m(),a&&p.focus())};this.destroy=function(a){p.unsubscribe("compositionstart",r);p.unsubscribe("compositionend",d);p.unsubscribe("keypress",n);l.destroyAll(L,a)};(function(){p.subscribe("compositionstart",
r);p.subscribe("compositionend",d);p.subscribe("keypress",n);s.push(new h(p,c));s.push(new k(p,c));L=s.map(function(a){return a.destroy});g.setAttribute("contenteditable","true");g.setAttribute("tabindex",-1);w=new core.ScheduledTask(m,1);L.push(w.destroy)})()};gui.InputMethodEditor.signalCompositionStart="input/compositionstart";gui.InputMethodEditor.signalCompositionEnd="input/compositionend";return gui.InputMethodEditor})();
// Input 56
runtime.loadClass("gui.SelectionMover");gui.ShadowCursor=function(h){var k=h.getDOM().createRange(),f=!0;this.removeFromOdtDocument=function(){};this.getMemberId=function(){return gui.ShadowCursor.ShadowCursorMemberId};this.getSelectedRange=function(){return k};this.setSelectedRange=function(h,p){k=h;f=!1!==p};this.hasForwardSelection=function(){return f};this.getOdtDocument=function(){return h};this.getSelectionType=function(){return ops.OdtCursor.RangeSelection};k.setStart(h.getRootNode(),0)};
gui.ShadowCursor.ShadowCursorMemberId="";(function(){return gui.ShadowCursor})();
// Input 57
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
gui.UndoManager=function(){};gui.UndoManager.prototype.subscribe=function(h,k){};gui.UndoManager.prototype.unsubscribe=function(h,k){};gui.UndoManager.prototype.setOdtDocument=function(h){};gui.UndoManager.prototype.saveInitialState=function(){};gui.UndoManager.prototype.resetInitialState=function(){};gui.UndoManager.prototype.setPlaybackFunction=function(h){};gui.UndoManager.prototype.hasUndoStates=function(){};gui.UndoManager.prototype.hasRedoStates=function(){};
gui.UndoManager.prototype.moveForward=function(h){};gui.UndoManager.prototype.moveBackward=function(h){};gui.UndoManager.prototype.onOperationExecuted=function(h){};gui.UndoManager.signalUndoStackChanged="undoStackChanged";gui.UndoManager.signalUndoStateCreated="undoStateCreated";gui.UndoManager.signalUndoStateModified="undoStateModified";(function(){return gui.UndoManager})();
// Input 58
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
gui.UndoStateRules=function(){function h(f){return f.spec().optype}function k(f){return f.isEdit}this.getOpType=h;this.isEditOperation=k;this.isPartOfOperationSet=function(f,q){if(f.isEdit){if(0===q.length)return!0;var p;if(p=q[q.length-1].isEdit)a:{p=q.filter(k);var n=h(f),c;b:switch(n){case "RemoveText":case "InsertText":c=!0;break b;default:c=!1}if(c&&n===h(p[0])){if(1===p.length){p=!0;break a}n=p[p.length-2].spec().position;p=p[p.length-1].spec().position;c=f.spec().position;if(p===c-(p-n)){p=
!0;break a}}p=!1}return p}return!0}};
// Input 59
runtime.loadClass("xmldom.RelaxNGParser");
xmldom.RelaxNG=function(){function h(a){return function(){var b;return function(){void 0===b&&(b=a());return b}}()}function k(a,b){return function(){var c={},d=0;return function(e){var g=e.hash||e.toString();if(c.hasOwnProperty(g))return c[g];c[g]=e=b(e);e.hash=a+d.toString();d+=1;return e}}()}function f(a){return function(){var b={};return function(c){var d,e;if(b.hasOwnProperty(c.localName)){if(e=b[c.localName],d=e[c.namespaceURI],void 0!==d)return d}else b[c.localName]=e={};return e[c.namespaceURI]=
d=a(c)}}()}function q(a,b,c){return function(){var d={},e=0;return function(g,f){var h=b&&b(g,f),l;if(void 0!==h)return h;l=g.hash||g.toString();h=f.hash||f.toString();if(d.hasOwnProperty(l)){if(l=d[l],l.hasOwnProperty(h))return l[h]}else d[l]=l={};l[h]=h=c(g,f);h.hash=a+e.toString();e+=1;return h}}()}function p(a,b){"choice"===b.p1.type?p(a,b.p1):a[b.p1.hash]=b.p1;"choice"===b.p2.type?p(a,b.p2):a[b.p2.hash]=b.p2}function n(a,b){return{type:"element",nc:a,nullable:!1,textDeriv:function(){return z},
startTagOpenDeriv:function(c){return a.contains(c)?g(b,B):z},attDeriv:function(){return z},startTagCloseDeriv:function(){return this}}}function c(){return{type:"list",nullable:!1,hash:"list",textDeriv:function(){return B}}}function m(a,b,c,e){if(b===z)return z;if(e>=c.length)return b;0===e&&(e=0);for(var g=c.item(e);g.namespaceURI===d;){e+=1;if(e>=c.length)return b;g=c.item(e)}return g=m(a,b.attDeriv(a,c.item(e)),c,e+1)}function r(a,b,c){c.e[0].a?(a.push(c.e[0].text),b.push(c.e[0].a.ns)):r(a,b,c.e[0]);
c.e[1].a?(a.push(c.e[1].text),b.push(c.e[1].a.ns)):r(a,b,c.e[1])}var d="http://www.w3.org/2000/xmlns/",e,a,b,g,l,u,x,w,y,v,t,s,L,z={type:"notAllowed",nullable:!1,hash:"notAllowed",nc:void 0,p:void 0,p1:void 0,p2:void 0,textDeriv:function(){return z},startTagOpenDeriv:function(){return z},attDeriv:function(){return z},startTagCloseDeriv:function(){return z},endTagDeriv:function(){return z}},B={type:"empty",nullable:!0,hash:"empty",nc:void 0,p:void 0,p1:void 0,p2:void 0,textDeriv:function(){return z},
startTagOpenDeriv:function(){return z},attDeriv:function(){return z},startTagCloseDeriv:function(){return B},endTagDeriv:function(){return z}},N={type:"text",nullable:!0,hash:"text",nc:void 0,p:void 0,p1:void 0,p2:void 0,textDeriv:function(){return N},startTagOpenDeriv:function(){return z},attDeriv:function(){return z},startTagCloseDeriv:function(){return N},endTagDeriv:function(){return z}};e=q("choice",function(a,b){if(a===z)return b;if(b===z||a===b)return a},function(a,b){var c={},d;p(c,{p1:a,
p2:b});b=a=void 0;for(d in c)c.hasOwnProperty(d)&&(void 0===a?a=c[d]:b=void 0===b?c[d]:e(b,c[d]));return function(a,b){return{type:"choice",nullable:a.nullable||b.nullable,hash:void 0,nc:void 0,p:void 0,p1:a,p2:b,textDeriv:function(c,d){return e(a.textDeriv(c,d),b.textDeriv(c,d))},startTagOpenDeriv:f(function(c){return e(a.startTagOpenDeriv(c),b.startTagOpenDeriv(c))}),attDeriv:function(c,d){return e(a.attDeriv(c,d),b.attDeriv(c,d))},startTagCloseDeriv:h(function(){return e(a.startTagCloseDeriv(),
b.startTagCloseDeriv())}),endTagDeriv:h(function(){return e(a.endTagDeriv(),b.endTagDeriv())})}}(a,b)});a=function(a,b,c){return function(){var d={},e=0;return function(g,f){var h=b&&b(g,f),l,m;if(void 0!==h)return h;l=g.hash||g.toString();h=f.hash||f.toString();l<h&&(m=l,l=h,h=m,m=g,g=f,f=m);if(d.hasOwnProperty(l)){if(l=d[l],l.hasOwnProperty(h))return l[h]}else d[l]=l={};l[h]=h=c(g,f);h.hash=a+e.toString();e+=1;return h}}()}("interleave",function(a,b){if(a===z||b===z)return z;if(a===B)return b;if(b===
B)return a},function(b,c){return{type:"interleave",nullable:b.nullable&&c.nullable,hash:void 0,p1:b,p2:c,textDeriv:function(d,g){return e(a(b.textDeriv(d,g),c),a(b,c.textDeriv(d,g)))},startTagOpenDeriv:f(function(d){return e(t(function(b){return a(b,c)},b.startTagOpenDeriv(d)),t(function(c){return a(b,c)},c.startTagOpenDeriv(d)))}),attDeriv:function(d,g){return e(a(b.attDeriv(d,g),c),a(b,c.attDeriv(d,g)))},startTagCloseDeriv:h(function(){return a(b.startTagCloseDeriv(),c.startTagCloseDeriv())}),endTagDeriv:void 0}});
b=q("group",function(a,b){if(a===z||b===z)return z;if(a===B)return b;if(b===B)return a},function(a,c){return{type:"group",p1:a,p2:c,nullable:a.nullable&&c.nullable,textDeriv:function(d,g){var f=b(a.textDeriv(d,g),c);return a.nullable?e(f,c.textDeriv(d,g)):f},startTagOpenDeriv:function(d){var g=t(function(a){return b(a,c)},a.startTagOpenDeriv(d));return a.nullable?e(g,c.startTagOpenDeriv(d)):g},attDeriv:function(d,g){return e(b(a.attDeriv(d,g),c),b(a,c.attDeriv(d,g)))},startTagCloseDeriv:h(function(){return b(a.startTagCloseDeriv(),
c.startTagCloseDeriv())})}});g=q("after",function(a,b){if(a===z||b===z)return z},function(a,b){return{type:"after",p1:a,p2:b,nullable:!1,textDeriv:function(c,d){return g(a.textDeriv(c,d),b)},startTagOpenDeriv:f(function(c){return t(function(a){return g(a,b)},a.startTagOpenDeriv(c))}),attDeriv:function(c,d){return g(a.attDeriv(c,d),b)},startTagCloseDeriv:h(function(){return g(a.startTagCloseDeriv(),b)}),endTagDeriv:h(function(){return a.nullable?b:z})}});l=k("oneormore",function(a){return a===z?z:
{type:"oneOrMore",p:a,nullable:a.nullable,textDeriv:function(c,d){return b(a.textDeriv(c,d),e(this,B))},startTagOpenDeriv:function(c){var d=this;return t(function(a){return b(a,e(d,B))},a.startTagOpenDeriv(c))},attDeriv:function(c,d){return b(a.attDeriv(c,d),e(this,B))},startTagCloseDeriv:h(function(){return l(a.startTagCloseDeriv())})}});x=q("attribute",void 0,function(a,b){return{type:"attribute",nullable:!1,hash:void 0,nc:a,p:b,p1:void 0,p2:void 0,textDeriv:void 0,startTagOpenDeriv:void 0,attDeriv:function(c,
d){return a.contains(d)&&(b.nullable&&/^\s+$/.test(d.nodeValue)||b.textDeriv(c,d.nodeValue).nullable)?B:z},startTagCloseDeriv:function(){return z},endTagDeriv:void 0}});u=k("value",function(a){return{type:"value",nullable:!1,value:a,textDeriv:function(b,c){return c===a?B:z},attDeriv:function(){return z},startTagCloseDeriv:function(){return this}}});y=k("data",function(a){return{type:"data",nullable:!1,dataType:a,textDeriv:function(){return B},attDeriv:function(){return z},startTagCloseDeriv:function(){return this}}});
t=function T(a,b){return"after"===b.type?g(b.p1,a(b.p2)):"choice"===b.type?e(T(a,b.p1),T(a,b.p2)):b};s=function(a,b,c){var d=c.currentNode;b=b.startTagOpenDeriv(d);b=m(a,b,d.attributes,0);var g=b=b.startTagCloseDeriv(),d=c.currentNode;b=c.firstChild();for(var f=[],h;b;)b.nodeType===Node.ELEMENT_NODE?f.push(b):b.nodeType!==Node.TEXT_NODE||/^\s*$/.test(b.nodeValue)||f.push(b.nodeValue),b=c.nextSibling();0===f.length&&(f=[""]);h=g;for(g=0;h!==z&&g<f.length;g+=1)b=f[g],"string"===typeof b?h=/^\s*$/.test(b)?
e(h,h.textDeriv(a,b)):h.textDeriv(a,b):(c.currentNode=b,h=s(a,h,c));c.currentNode=d;return b=h.endTagDeriv()};w=function(a){var b,c,d;if("name"===a.name)b=a.text,c=a.a.ns,a={name:b,ns:c,hash:"{"+c+"}"+b,contains:function(a){return a.namespaceURI===c&&a.localName===b}};else if("choice"===a.name){b=[];c=[];r(b,c,a);a="";for(d=0;d<b.length;d+=1)a+="{"+c[d]+"}"+b[d]+",";a={hash:a,contains:function(a){var d;for(d=0;d<b.length;d+=1)if(b[d]===a.localName&&c[d]===a.namespaceURI)return!0;return!1}}}else a=
{hash:"anyName",contains:function(){return!0}};return a};v=function A(d,g){var f,h;if("elementref"===d.name){f=d.id||0;d=g[f];if(void 0!==d.name){var m=d;f=g[m.id]={hash:"element"+m.id.toString()};m=n(w(m.e[0]),v(m.e[1],g));for(h in m)m.hasOwnProperty(h)&&(f[h]=m[h]);return f}return d}switch(d.name){case "empty":return B;case "notAllowed":return z;case "text":return N;case "choice":return e(A(d.e[0],g),A(d.e[1],g));case "interleave":f=A(d.e[0],g);for(h=1;h<d.e.length;h+=1)f=a(f,A(d.e[h],g));return f;
case "group":return b(A(d.e[0],g),A(d.e[1],g));case "oneOrMore":return l(A(d.e[0],g));case "attribute":return x(w(d.e[0]),A(d.e[1],g));case "value":return u(d.text);case "data":return f=d.a&&d.a.type,void 0===f&&(f=""),y(f);case "list":return c()}throw"No support for "+d.name;};this.makePattern=function(a,b){var c={},d;for(d in b)b.hasOwnProperty(d)&&(c[d]=b[d]);return d=v(a,c)};this.validate=function(a,b){var c;a.currentNode=a.root;c=s(null,L,a);c.nullable?b(null):(runtime.log("Error in Relax NG validation: "+
c),b(["Error in Relax NG validation: "+c]))};this.init=function(a){L=a}};
// Input 60
runtime.loadClass("xmldom.RelaxNGParser");
xmldom.RelaxNG2=function(){function h(c,f){this.message=function(){f&&(c+=f.nodeType===Node.ELEMENT_NODE?" Element ":" Node ",c+=f.nodeName,f.nodeValue&&(c+=" with value '"+f.nodeValue+"'"),c+=".");return c}}function k(c,f,h,d){return"empty"===c.name?null:p(c,f,h,d)}function f(c,f){if(2!==c.e.length)throw"Element with wrong # of elements: "+c.e.length;for(var r=f.currentNode,d=r?r.nodeType:0,e=null;d>Node.ELEMENT_NODE;){if(d!==Node.COMMENT_NODE&&(d!==Node.TEXT_NODE||!/^\s+$/.test(f.currentNode.nodeValue)))return[new h("Not allowed node of type "+
d+".")];d=(r=f.nextSibling())?r.nodeType:0}if(!r)return[new h("Missing element "+c.names)];if(c.names&&-1===c.names.indexOf(n[r.namespaceURI]+":"+r.localName))return[new h("Found "+r.nodeName+" instead of "+c.names+".",r)];if(f.firstChild()){for(e=k(c.e[1],f,r);f.nextSibling();)if(d=f.currentNode.nodeType,!(f.currentNode&&f.currentNode.nodeType===Node.TEXT_NODE&&/^\s+$/.test(f.currentNode.nodeValue)||d===Node.COMMENT_NODE))return[new h("Spurious content.",f.currentNode)];if(f.parentNode()!==r)return[new h("Implementation error.")]}else e=
k(c.e[1],f,r);f.nextSibling();return e}var q,p,n;p=function(c,m,n,d){var e=c.name,a=null;if("text"===e)a:{for(var b=(c=m.currentNode)?c.nodeType:0;c!==n&&3!==b;){if(1===b){a=[new h("Element not allowed here.",c)];break a}b=(c=m.nextSibling())?c.nodeType:0}m.nextSibling();a=null}else if("data"===e)a=null;else if("value"===e)d!==c.text&&(a=[new h("Wrong value, should be '"+c.text+"', not '"+d+"'",n)]);else if("list"===e)a=null;else if("attribute"===e)a:{if(2!==c.e.length)throw"Attribute with wrong # of elements: "+
c.e.length;e=c.localnames.length;for(a=0;a<e;a+=1){d=n.getAttributeNS(c.namespaces[a],c.localnames[a]);""!==d||n.hasAttributeNS(c.namespaces[a],c.localnames[a])||(d=void 0);if(void 0!==b&&void 0!==d){a=[new h("Attribute defined too often.",n)];break a}b=d}a=void 0===b?[new h("Attribute not found: "+c.names,n)]:k(c.e[1],m,n,b)}else if("element"===e)a=f(c,m);else if("oneOrMore"===e){d=0;do b=m.currentNode,e=p(c.e[0],m,n),d+=1;while(!e&&b!==m.currentNode);1<d?(m.currentNode=b,a=null):a=e}else if("choice"===
e){if(2!==c.e.length)throw"Choice with wrong # of options: "+c.e.length;b=m.currentNode;if("empty"===c.e[0].name){if(e=p(c.e[1],m,n,d))m.currentNode=b;a=null}else{if(e=k(c.e[0],m,n,d))m.currentNode=b,e=p(c.e[1],m,n,d);a=e}}else if("group"===e){if(2!==c.e.length)throw"Group with wrong # of members: "+c.e.length;a=p(c.e[0],m,n)||p(c.e[1],m,n)}else if("interleave"===e)a:{b=c.e.length;d=[b];for(var g=b,l,q,x,w;0<g;){l=0;q=m.currentNode;for(a=0;a<b;a+=1)x=m.currentNode,!0!==d[a]&&d[a]!==x&&(w=c.e[a],(e=
p(w,m,n))?(m.currentNode=x,void 0===d[a]&&(d[a]=!1)):x===m.currentNode||"oneOrMore"===w.name||"choice"===w.name&&("oneOrMore"===w.e[0].name||"oneOrMore"===w.e[1].name)?(l+=1,d[a]=x):(l+=1,d[a]=!0));if(q===m.currentNode&&l===g){a=null;break a}if(0===l){for(a=0;a<b;a+=1)if(!1===d[a]){a=[new h("Interleave does not match.",n)];break a}a=null;break a}for(a=g=0;a<b;a+=1)!0!==d[a]&&(g+=1)}a=null}else throw e+" not allowed in nonEmptyPattern.";return a};this.validate=function(c,f){c.currentNode=c.root;var h=
k(q.e[0],c,c.root);f(h)};this.init=function(c,f){q=c;n=f}};
// Input 61
/*

 Copyright (C) 2012 KO GmbH <aditya.bhatt@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.EditInfo=function(h,k){function f(){var f=[],c;for(c in p)p.hasOwnProperty(c)&&f.push({memberid:c,time:p[c].time});f.sort(function(c,f){return c.time-f.time});return f}var q,p={};this.getNode=function(){return q};this.getOdtDocument=function(){return k};this.getEdits=function(){return p};this.getSortedEdits=function(){return f()};this.addEdit=function(f,c){p[f]={time:c}};this.clearEdits=function(){p={}};this.destroy=function(f){h.parentNode&&h.removeChild(q);f()};q=k.getDOM().createElementNS("urn:webodf:names:editinfo",
"editinfo");h.insertBefore(q,h.firstChild)};
// Input 62
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");
ops.OpAddAnnotation=function(){function h(c,f,d){var e=c.getTextNodeAtStep(d,k);e&&(c=e.textNode,d=c.parentNode,e.offset!==c.length&&c.splitText(e.offset),d.insertBefore(f,c.nextSibling),0===c.length&&d.removeChild(c))}var k,f,q,p,n,c;this.init=function(c){k=c.memberid;f=parseInt(c.timestamp,10);q=parseInt(c.position,10);p=parseInt(c.length,10)||0;n=c.name};this.isEdit=!0;this.execute=function(m){var r={},d=m.getCursor(k),e,a;a=new core.DomUtils;c=m.getDOM();var b=new Date(f),g,l,u,x;e=c.createElementNS(odf.Namespaces.officens,
"office:annotation");e.setAttributeNS(odf.Namespaces.officens,"office:name",n);g=c.createElementNS(odf.Namespaces.dcns,"dc:creator");g.setAttributeNS("urn:webodf:names:editinfo","editinfo:memberid",k);g.textContent=m.getMember(k).getProperties().fullName;l=c.createElementNS(odf.Namespaces.dcns,"dc:date");l.appendChild(c.createTextNode(b.toISOString()));b=c.createElementNS(odf.Namespaces.textns,"text:list");u=c.createElementNS(odf.Namespaces.textns,"text:list-item");x=c.createElementNS(odf.Namespaces.textns,
"text:p");u.appendChild(x);b.appendChild(u);e.appendChild(g);e.appendChild(l);e.appendChild(b);r.node=e;if(!r.node)return!1;if(p){e=c.createElementNS(odf.Namespaces.officens,"office:annotation-end");e.setAttributeNS(odf.Namespaces.officens,"office:name",n);r.end=e;if(!r.end)return!1;h(m,r.end,q+p)}h(m,r.node,q);m.emit(ops.OdtDocument.signalStepsInserted,{position:q,length:p});d&&(e=c.createRange(),a=a.getElementsByTagNameNS(r.node,odf.Namespaces.textns,"p")[0],e.selectNodeContents(a),d.setSelectedRange(e),
m.emit(ops.OdtDocument.signalCursorMoved,d));m.getOdfCanvas().addAnnotation(r);m.fixCursorPositions();return!0};this.spec=function(){return{optype:"AddAnnotation",memberid:k,timestamp:f,position:q,length:p,name:n}}};
// Input 63
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpAddCursor=function(){var h,k;this.init=function(f){h=f.memberid;k=f.timestamp};this.isEdit=!1;this.execute=function(f){var k=f.getCursor(h);if(k)return!1;k=new ops.OdtCursor(h,f);f.addCursor(k);f.emit(ops.OdtDocument.signalCursorAdded,k);return!0};this.spec=function(){return{optype:"AddCursor",memberid:h,timestamp:k}}};
// Input 64
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.Member");ops.OpAddMember=function(){var h,k,f;this.init=function(q){h=q.memberid;k=parseInt(q.timestamp,10);f=q.setProperties};this.isEdit=!1;this.execute=function(k){if(k.getMember(h))return!1;var p=new ops.Member(h,f);k.addMember(p);k.emit(ops.OdtDocument.signalMemberAdded,p);return!0};this.spec=function(){return{optype:"AddMember",memberid:h,timestamp:k,setProperties:f}}};
// Input 65
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");
ops.OpAddStyle=function(){var h,k,f,q,p,n,c=odf.Namespaces.stylens;this.init=function(c){h=c.memberid;k=c.timestamp;f=c.styleName;q=c.styleFamily;p="true"===c.isAutomaticStyle||!0===c.isAutomaticStyle;n=c.setProperties};this.isEdit=!0;this.execute=function(h){var k=h.getOdfCanvas().odfContainer(),d=h.getFormatting(),e=h.getDOM().createElementNS(c,"style:style");if(!e)return!1;n&&d.updateStyle(e,n);e.setAttributeNS(c,"style:family",q);e.setAttributeNS(c,"style:name",f);p?k.rootElement.automaticStyles.appendChild(e):
k.rootElement.styles.appendChild(e);h.getOdfCanvas().refreshCSS();p||h.emit(ops.OdtDocument.signalCommonStyleCreated,{name:f,family:q});return!0};this.spec=function(){return{optype:"AddStyle",memberid:h,timestamp:k,styleName:f,styleFamily:q,isAutomaticStyle:p,setProperties:n}}};
// Input 66
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("odf.OdfUtils");runtime.loadClass("odf.TextStyleApplicator");
ops.OpApplyDirectStyling=function(){function h(f,d,e){var a=f.getOdfCanvas().odfContainer(),b=m.splitBoundaries(d),g=c.getTextNodes(d,!1);d={startContainer:d.startContainer,startOffset:d.startOffset,endContainer:d.endContainer,endOffset:d.endOffset};(new odf.TextStyleApplicator(new odf.ObjectNameGenerator(a,k),f.getFormatting(),a.rootElement.automaticStyles)).applyStyle(g,d,e);b.forEach(m.normalizeTextNodes)}var k,f,q,p,n,c=new odf.OdfUtils,m=new core.DomUtils;this.init=function(c){k=c.memberid;f=
c.timestamp;q=parseInt(c.position,10);p=parseInt(c.length,10);n=c.setProperties};this.isEdit=!0;this.execute=function(m){var d=m.convertCursorToDomRange(q,p),e=c.getImpactedParagraphs(d);h(m,d,n);d.detach();m.getOdfCanvas().refreshCSS();m.fixCursorPositions();e.forEach(function(a){m.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:a,memberId:k,timeStamp:f})});m.getOdfCanvas().rerenderAnnotations();return!0};this.spec=function(){return{optype:"ApplyDirectStyling",memberid:k,timestamp:f,
position:q,length:p,setProperties:n}}};
// Input 67
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: http://gitorious.org/webodf/webodf/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("odf.OdfUtils");
ops.OpApplyHyperlink=function(){function h(c){for(;c;){if(m.isHyperlink(c))return!0;c=c.parentNode}return!1}var k,f,q,p,n,c=new core.DomUtils,m=new odf.OdfUtils;this.init=function(c){k=c.memberid;f=c.timestamp;q=c.position;p=c.length;n=c.hyperlink};this.isEdit=!0;this.execute=function(r){var d=r.getDOM(),e=r.convertCursorToDomRange(q,p),a=c.splitBoundaries(e),b=[],g=m.getTextNodes(e,!1);if(0===g.length)return!1;g.forEach(function(a){var c=m.getParagraphElement(a);runtime.assert(!1===h(a),"The given range should not contain any link.");
var g=n,e=d.createElementNS(odf.Namespaces.textns,"text:a");e.setAttributeNS(odf.Namespaces.xlinkns,"xlink:type","simple");e.setAttributeNS(odf.Namespaces.xlinkns,"xlink:href",g);a.parentNode.insertBefore(e,a);e.appendChild(a);-1===b.indexOf(c)&&b.push(c)});a.forEach(c.normalizeTextNodes);e.detach();r.getOdfCanvas().refreshSize();r.getOdfCanvas().rerenderAnnotations();b.forEach(function(a){r.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:a,memberId:k,timeStamp:f})});return!0};this.spec=
function(){return{optype:"ApplyHyperlink",memberid:k,timestamp:f,position:q,length:p,hyperlink:n}}};
// Input 68
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpInsertImage=function(){var h,k,f,q,p,n,c,m,r=odf.Namespaces.drawns,d=odf.Namespaces.svgns,e=odf.Namespaces.textns,a=odf.Namespaces.xlinkns;this.init=function(a){h=a.memberid;k=a.timestamp;f=a.position;q=a.filename;p=a.frameWidth;n=a.frameHeight;c=a.frameStyleName;m=a.frameName};this.isEdit=!0;this.execute=function(b){var g=b.getOdfCanvas(),l=b.getTextNodeAtStep(f,h),u,x;if(!l)return!1;u=l.textNode;x=b.getParagraphElement(u);var l=l.offset!==u.length?u.splitText(l.offset):u.nextSibling,w=b.getDOM(),
y=w.createElementNS(r,"draw:image"),w=w.createElementNS(r,"draw:frame");y.setAttributeNS(a,"xlink:href",q);y.setAttributeNS(a,"xlink:type","simple");y.setAttributeNS(a,"xlink:show","embed");y.setAttributeNS(a,"xlink:actuate","onLoad");w.setAttributeNS(r,"draw:style-name",c);w.setAttributeNS(r,"draw:name",m);w.setAttributeNS(e,"text:anchor-type","as-char");w.setAttributeNS(d,"svg:width",p);w.setAttributeNS(d,"svg:height",n);w.appendChild(y);u.parentNode.insertBefore(w,l);b.emit(ops.OdtDocument.signalStepsInserted,
{position:f,length:1});0===u.length&&u.parentNode.removeChild(u);g.addCssForFrameWithImage(w);g.refreshCSS();b.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:x,memberId:h,timeStamp:k});g.rerenderAnnotations();return!0};this.spec=function(){return{optype:"InsertImage",memberid:h,timestamp:k,filename:q,position:f,frameWidth:p,frameHeight:n,frameStyleName:c,frameName:m}}};
// Input 69
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpInsertTable=function(){function h(c,a){var b;if(1===d.length)b=d[0];else if(3===d.length)switch(c){case 0:b=d[0];break;case q-1:b=d[2];break;default:b=d[1]}else b=d[c];if(1===b.length)return b[0];if(3===b.length)switch(a){case 0:return b[0];case p-1:return b[2];default:return b[1]}return b[a]}var k,f,q,p,n,c,m,r,d;this.init=function(e){k=e.memberid;f=e.timestamp;n=e.position;q=e.initialRows;p=e.initialColumns;c=e.tableName;m=e.tableStyleName;r=e.tableColumnStyleName;d=e.tableCellStyleMatrix};
this.isEdit=!0;this.execute=function(d){var a=d.getTextNodeAtStep(n),b=d.getRootNode();if(a){var g=d.getDOM(),l=g.createElementNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:table"),u=g.createElementNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:table-column"),x,w,y,v;m&&l.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:style-name",m);c&&l.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:name",c);u.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0",
"table:number-columns-repeated",p);r&&u.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:style-name",r);l.appendChild(u);for(y=0;y<q;y+=1){u=g.createElementNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:table-row");for(v=0;v<p;v+=1)x=g.createElementNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:table-cell"),(w=h(y,v))&&x.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:table:1.0","table:style-name",w),w=g.createElementNS("urn:oasis:names:tc:opendocument:xmlns:text:1.0",
"text:p"),x.appendChild(w),u.appendChild(x);l.appendChild(u)}a=d.getParagraphElement(a.textNode);b.insertBefore(l,a.nextSibling);d.emit(ops.OdtDocument.signalStepsInserted,{position:n,length:p*q+1});d.getOdfCanvas().refreshSize();d.emit(ops.OdtDocument.signalTableAdded,{tableElement:l,memberId:k,timeStamp:f});d.getOdfCanvas().rerenderAnnotations();return!0}return!1};this.spec=function(){return{optype:"InsertTable",memberid:k,timestamp:f,position:n,initialRows:q,initialColumns:p,tableName:c,tableStyleName:m,
tableColumnStyleName:r,tableCellStyleMatrix:d}}};
// Input 70
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpInsertText=function(){var h,k,f,q,p;this.init=function(n){h=n.memberid;k=n.timestamp;f=n.position;q=n.text;p="true"===n.moveCursor||!0===n.moveCursor};this.isEdit=!0;this.execute=function(n){var c,m,r,d=null,e=n.getDOM(),a,b=0,g,l=n.getCursor(h),u;n.upgradeWhitespacesAtPosition(f);if(c=n.getTextNodeAtStep(f)){m=c.textNode;d=m.nextSibling;r=m.parentNode;a=n.getParagraphElement(m);for(u=0;u<q.length;u+=1)if(" "===q[u]&&(0===u||u===q.length-1||" "===q[u-1])||"\t"===q[u])0===b?(c.offset!==m.length&&
(d=m.splitText(c.offset)),0<u&&m.appendData(q.substring(0,u))):b<u&&(b=q.substring(b,u),r.insertBefore(e.createTextNode(b),d)),b=u+1,g=" "===q[u]?"text:s":"text:tab",g=e.createElementNS("urn:oasis:names:tc:opendocument:xmlns:text:1.0",g),g.appendChild(e.createTextNode(q[u])),r.insertBefore(g,d);0===b?m.insertData(c.offset,q):b<q.length&&(c=q.substring(b),r.insertBefore(e.createTextNode(c),d));r=m.parentNode;d=m.nextSibling;r.removeChild(m);r.insertBefore(m,d);0===m.length&&m.parentNode.removeChild(m);
n.emit(ops.OdtDocument.signalStepsInserted,{position:f,length:q.length});l&&p&&(n.moveCursor(h,f+q.length,0),n.emit(ops.OdtDocument.signalCursorMoved,l));0<f&&(1<f&&n.downgradeWhitespacesAtPosition(f-2),n.downgradeWhitespacesAtPosition(f-1));n.downgradeWhitespacesAtPosition(f);n.downgradeWhitespacesAtPosition(f+q.length-1);n.downgradeWhitespacesAtPosition(f+q.length);n.getOdfCanvas().refreshSize();n.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:a,memberId:h,timeStamp:k});n.getOdfCanvas().rerenderAnnotations();
return!0}return!1};this.spec=function(){return{optype:"InsertText",memberid:h,timestamp:k,position:f,text:q,moveCursor:p}}};
// Input 71
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpMoveCursor=function(){var h,k,f,q,p;this.init=function(n){h=n.memberid;k=n.timestamp;f=n.position;q=n.length||0;p=n.selectionType||ops.OdtCursor.RangeSelection};this.isEdit=!1;this.execute=function(k){var c=k.getCursor(h),m;if(!c)return!1;m=k.convertCursorToDomRange(f,q);c.setSelectedRange(m,0<=q);c.setSelectionType(p);k.emit(ops.OdtDocument.signalCursorMoved,c);return!0};this.spec=function(){return{optype:"MoveCursor",memberid:h,timestamp:k,position:f,length:q,selectionType:p}}};
// Input 72
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");runtime.loadClass("core.DomUtils");
ops.OpRemoveAnnotation=function(){var h,k,f,q,p;this.init=function(n){h=n.memberid;k=n.timestamp;f=parseInt(n.position,10);q=parseInt(n.length,10);p=new core.DomUtils};this.isEdit=!0;this.execute=function(h){for(var c=h.getIteratorAtPosition(f).container(),k,r,d;c.namespaceURI!==odf.Namespaces.officens||"annotation"!==c.localName;)c=c.parentNode;if(null===c)return!1;(k=c.getAttributeNS(odf.Namespaces.officens,"name"))&&(r=p.getElementsByTagNameNS(h.getRootNode(),odf.Namespaces.officens,"annotation-end").filter(function(c){return k===
c.getAttributeNS(odf.Namespaces.officens,"name")})[0]||null);h.getOdfCanvas().forgetAnnotations();for(d=p.getElementsByTagNameNS(c,"urn:webodf:names:cursor","cursor");d.length;)c.parentNode.insertBefore(d.pop(),c);c.parentNode.removeChild(c);r&&r.parentNode.removeChild(r);h.emit(ops.OdtDocument.signalStepsRemoved,{position:0<f?f-1:f,length:q});h.fixCursorPositions();h.getOdfCanvas().refreshAnnotations();return!0};this.spec=function(){return{optype:"RemoveAnnotation",memberid:h,timestamp:k,position:f,
length:q}}};
// Input 73
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpRemoveBlob=function(){var h,k,f;this.init=function(q){h=q.memberid;k=q.timestamp;f=q.filename};this.isEdit=!0;this.execute=function(h){h.getOdfCanvas().odfContainer().removeBlob(f);return!0};this.spec=function(){return{optype:"RemoveBlob",memberid:h,timestamp:k,filename:f}}};
// Input 74
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpRemoveCursor=function(){var h,k;this.init=function(f){h=f.memberid;k=f.timestamp};this.isEdit=!1;this.execute=function(f){return f.removeCursor(h)?!0:!1};this.spec=function(){return{optype:"RemoveCursor",memberid:h,timestamp:k}}};
// Input 75
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: http://gitorious.org/webodf/webodf/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("odf.OdfUtils");
ops.OpRemoveHyperlink=function(){var h,k,f,q,p=new core.DomUtils,n=new odf.OdfUtils;this.init=function(c){h=c.memberid;k=c.timestamp;f=c.position;q=c.length};this.isEdit=!0;this.execute=function(c){var m=c.convertCursorToDomRange(f,q),r=n.getHyperlinkElements(m);runtime.assert(1===r.length,"The given range should only contain a single link.");r=p.mergeIntoParent(r[0]);m.detach();c.getOdfCanvas().refreshSize();c.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:n.getParagraphElement(r),
memberId:h,timeStamp:k});c.getOdfCanvas().rerenderAnnotations();return!0};this.spec=function(){return{optype:"RemoveHyperlink",memberid:h,timestamp:k,position:f,length:q}}};
// Input 76
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.Member");ops.OpRemoveMember=function(){var h,k;this.init=function(f){h=f.memberid;k=parseInt(f.timestamp,10)};this.isEdit=!1;this.execute=function(f){if(!f.getMember(h))return!1;f.removeMember(h);f.emit(ops.OdtDocument.signalMemberRemoved,h);return!0};this.spec=function(){return{optype:"RemoveMember",memberid:h,timestamp:k}}};
// Input 77
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpRemoveStyle=function(){var h,k,f,q;this.init=function(p){h=p.memberid;k=p.timestamp;f=p.styleName;q=p.styleFamily};this.isEdit=!0;this.execute=function(h){var k=h.getStyleElement(f,q);if(!k)return!1;k.parentNode.removeChild(k);h.getOdfCanvas().refreshCSS();h.emit(ops.OdtDocument.signalCommonStyleDeleted,{name:f,family:q});return!0};this.spec=function(){return{optype:"RemoveStyle",memberid:h,timestamp:k,styleName:f,styleFamily:q}}};
// Input 78
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.OdfUtils");runtime.loadClass("core.DomUtils");
ops.OpRemoveText=function(){function h(f){function d(a){return m.hasOwnProperty(a.namespaceURI)||"br"===a.localName&&n.isLineBreak(a.parentNode)||a.nodeType===Node.TEXT_NODE&&m.hasOwnProperty(a.parentNode.namespaceURI)}function e(a){if(n.isCharacterElement(a))return!1;if(a.nodeType===Node.TEXT_NODE)return 0===a.textContent.length;for(a=a.firstChild;a;){if(m.hasOwnProperty(a.namespaceURI)||!e(a))return!1;a=a.nextSibling}return!0}function a(b){var g;b.nodeType===Node.TEXT_NODE?(g=b.parentNode,g.removeChild(b)):
g=c.removeUnwantedNodes(b,d);return!n.isParagraph(g)&&g!==f&&e(g)?a(g):g}this.isEmpty=e;this.mergeChildrenIntoParent=a}var k,f,q,p,n,c,m={};this.init=function(h){runtime.assert(0<=h.length,"OpRemoveText only supports positive lengths");k=h.memberid;f=h.timestamp;q=parseInt(h.position,10);p=parseInt(h.length,10);n=new odf.OdfUtils;c=new core.DomUtils;m[odf.Namespaces.dbns]=!0;m[odf.Namespaces.dcns]=!0;m[odf.Namespaces.dr3dns]=!0;m[odf.Namespaces.drawns]=!0;m[odf.Namespaces.chartns]=!0;m[odf.Namespaces.formns]=
!0;m[odf.Namespaces.numberns]=!0;m[odf.Namespaces.officens]=!0;m[odf.Namespaces.presentationns]=!0;m[odf.Namespaces.stylens]=!0;m[odf.Namespaces.svgns]=!0;m[odf.Namespaces.tablens]=!0;m[odf.Namespaces.textns]=!0};this.isEdit=!0;this.execute=function(m){var d,e,a,b,g=m.getCursor(k),l=new h(m.getRootNode());m.upgradeWhitespacesAtPosition(q);m.upgradeWhitespacesAtPosition(q+p);e=m.convertCursorToDomRange(q,p);c.splitBoundaries(e);d=m.getParagraphElement(e.startContainer);a=n.getTextElements(e,!1,!0);
b=n.getParagraphElements(e);e.detach();a.forEach(function(a){l.mergeChildrenIntoParent(a)});e=b.reduce(function(a,b){var c,d=!1,g=a,e=b,f,h=null;l.isEmpty(a)&&(d=!0,b.parentNode!==a.parentNode&&(f=b.parentNode,a.parentNode.insertBefore(b,a.nextSibling)),e=a,g=b,h=g.getElementsByTagNameNS("urn:webodf:names:editinfo","editinfo")[0]||g.firstChild);for(;e.hasChildNodes();)c=d?e.lastChild:e.firstChild,e.removeChild(c),"editinfo"!==c.localName&&g.insertBefore(c,h);f&&l.isEmpty(f)&&l.mergeChildrenIntoParent(f);
l.mergeChildrenIntoParent(e);return g});m.emit(ops.OdtDocument.signalStepsRemoved,{position:q,length:p});m.downgradeWhitespacesAtPosition(q);m.fixCursorPositions();m.getOdfCanvas().refreshSize();m.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:e||d,memberId:k,timeStamp:f});g&&(g.resetSelectionType(),m.emit(ops.OdtDocument.signalCursorMoved,g));m.getOdfCanvas().rerenderAnnotations();return!0};this.spec=function(){return{optype:"RemoveText",memberid:k,timestamp:f,position:q,length:p}}};
// Input 79
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpSetBlob=function(){var h,k,f,q,p;this.init=function(n){h=n.memberid;k=n.timestamp;f=n.filename;q=n.mimetype;p=n.content};this.isEdit=!0;this.execute=function(h){h.getOdfCanvas().odfContainer().setBlob(f,q,p);return!0};this.spec=function(){return{optype:"SetBlob",memberid:h,timestamp:k,filename:f,mimetype:q,content:p}}};
// Input 80
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpSetParagraphStyle=function(){var h,k,f,q;this.init=function(p){h=p.memberid;k=p.timestamp;f=p.position;q=p.styleName};this.isEdit=!0;this.execute=function(p){var n;n=p.getIteratorAtPosition(f);return(n=p.getParagraphElement(n.container()))?(""!==q?n.setAttributeNS("urn:oasis:names:tc:opendocument:xmlns:text:1.0","text:style-name",q):n.removeAttributeNS("urn:oasis:names:tc:opendocument:xmlns:text:1.0","style-name"),p.getOdfCanvas().refreshSize(),p.emit(ops.OdtDocument.signalParagraphChanged,
{paragraphElement:n,timeStamp:k,memberId:h}),p.getOdfCanvas().rerenderAnnotations(),!0):!1};this.spec=function(){return{optype:"SetParagraphStyle",memberid:h,timestamp:k,position:f,styleName:q}}};
// Input 81
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpSplitParagraph=function(){var h,k,f,q,p;this.init=function(n){h=n.memberid;k=n.timestamp;f=n.position;q="true"===n.moveCursor||!0===n.moveCursor;p=new odf.OdfUtils};this.isEdit=!0;this.execute=function(n){var c,m,r,d,e,a,b,g=n.getCursor(h);n.upgradeWhitespacesAtPosition(f);c=n.getTextNodeAtStep(f);if(!c)return!1;m=n.getParagraphElement(c.textNode);if(!m)return!1;r=p.isListItem(m.parentNode)?m.parentNode:m;0===c.offset?(b=c.textNode.previousSibling,a=null):(b=c.textNode,a=c.offset>=c.textNode.length?
null:c.textNode.splitText(c.offset));for(d=c.textNode;d!==r;){d=d.parentNode;e=d.cloneNode(!1);a&&e.appendChild(a);if(b)for(;b&&b.nextSibling;)e.appendChild(b.nextSibling);else for(;d.firstChild;)e.appendChild(d.firstChild);d.parentNode.insertBefore(e,d.nextSibling);b=d;a=e}p.isListItem(a)&&(a=a.childNodes[0]);0===c.textNode.length&&c.textNode.parentNode.removeChild(c.textNode);n.emit(ops.OdtDocument.signalStepsInserted,{position:f,length:1});g&&q&&(n.moveCursor(h,f+1,0),n.emit(ops.OdtDocument.signalCursorMoved,
g));n.fixCursorPositions();n.getOdfCanvas().refreshSize();n.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:m,memberId:h,timeStamp:k});n.emit(ops.OdtDocument.signalParagraphChanged,{paragraphElement:a,memberId:h,timeStamp:k});n.getOdfCanvas().rerenderAnnotations();return!0};this.spec=function(){return{optype:"SplitParagraph",memberid:h,timestamp:k,position:f,moveCursor:q}}};
// Input 82
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.Member");runtime.loadClass("xmldom.XPath");
ops.OpUpdateMember=function(){function h(){var c="//dc:creator[@editinfo:memberid='"+k+"']",c=xmldom.XPath.getODFElementsWithXPath(n.getRootNode(),c,function(c){return"editinfo"===c?"urn:webodf:names:editinfo":odf.Namespaces.lookupNamespaceURI(c)}),f;for(f=0;f<c.length;f+=1)c[f].textContent=q.fullName}var k,f,q,p,n;this.init=function(c){k=c.memberid;f=parseInt(c.timestamp,10);q=c.setProperties;p=c.removedProperties};this.isEdit=!1;this.execute=function(c){n=c;var f=c.getMember(k);if(!f)return!1;p&&
f.removeProperties(p);q&&(f.setProperties(q),q.fullName&&h());c.emit(ops.OdtDocument.signalMemberUpdated,f);return!0};this.spec=function(){return{optype:"UpdateMember",memberid:k,timestamp:f,setProperties:q,removedProperties:p}}};
// Input 83
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OpUpdateMetadata=function(){var h,k,f,q;this.init=function(p){h=p.memberid;k=parseInt(p.timestamp,10);f=p.setProperties;q=p.removedProperties};this.isEdit=!0;this.execute=function(h){h=h.getOdfCanvas().odfContainer();var k=[],c=["dc:date","dc:creator","meta:editing-cycles"];f&&c.forEach(function(c){if(f[c])return!1});q&&(c.forEach(function(c){if(-1!==k.indexOf(c))return!1}),k=q.attributes.split(","));h.setMetadata(f,k);return!0};this.spec=function(){return{optype:"UpdateMetadata",memberid:h,timestamp:k,
setProperties:f,removedProperties:q}}};
// Input 84
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("odf.Namespaces");
ops.OpUpdateParagraphStyle=function(){function h(c,f){var d,e,a=f?f.split(","):[];for(d=0;d<a.length;d+=1)e=a[d].split(":"),c.removeAttributeNS(odf.Namespaces.lookupNamespaceURI(e[0]),e[1])}var k,f,q,p,n,c=odf.Namespaces.stylens;this.init=function(c){k=c.memberid;f=c.timestamp;q=c.styleName;p=c.setProperties;n=c.removedProperties};this.isEdit=!0;this.execute=function(f){var k=f.getFormatting(),d,e,a;return(d=""!==q?f.getParagraphStyleElement(q):k.getDefaultStyleElement("paragraph"))?(e=d.getElementsByTagNameNS(c,
"paragraph-properties")[0],a=d.getElementsByTagNameNS(c,"text-properties")[0],p&&k.updateStyle(d,p),n&&(n["style:paragraph-properties"]&&(h(e,n["style:paragraph-properties"].attributes),0===e.attributes.length&&d.removeChild(e)),n["style:text-properties"]&&(h(a,n["style:text-properties"].attributes),0===a.attributes.length&&d.removeChild(a)),h(d,n.attributes)),f.getOdfCanvas().refreshCSS(),f.emit(ops.OdtDocument.signalParagraphStyleModified,q),f.getOdfCanvas().rerenderAnnotations(),!0):!1};this.spec=
function(){return{optype:"UpdateParagraphStyle",memberid:k,timestamp:f,styleName:q,setProperties:p,removedProperties:n}}};
// Input 85
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.OpAddMember");runtime.loadClass("ops.OpUpdateMember");runtime.loadClass("ops.OpRemoveMember");runtime.loadClass("ops.OpAddCursor");runtime.loadClass("ops.OpApplyDirectStyling");runtime.loadClass("ops.OpRemoveCursor");runtime.loadClass("ops.OpMoveCursor");runtime.loadClass("ops.OpSetBlob");runtime.loadClass("ops.OpRemoveBlob");runtime.loadClass("ops.OpInsertImage");runtime.loadClass("ops.OpInsertTable");runtime.loadClass("ops.OpInsertText");runtime.loadClass("ops.OpRemoveText");
runtime.loadClass("ops.OpSplitParagraph");runtime.loadClass("ops.OpSetParagraphStyle");runtime.loadClass("ops.OpUpdateParagraphStyle");runtime.loadClass("ops.OpAddStyle");runtime.loadClass("ops.OpRemoveStyle");runtime.loadClass("ops.OpAddAnnotation");runtime.loadClass("ops.OpRemoveAnnotation");runtime.loadClass("ops.OpUpdateMetadata");runtime.loadClass("ops.OpApplyHyperlink");runtime.loadClass("ops.OpRemoveHyperlink");
ops.OperationFactory=function(){function h(f){return function(){return new f}}var k;this.register=function(f,h){k[f]=h};this.create=function(f){var h=null,p=k[f.optype];p&&(h=p(f),h.init(f));return h};k={AddMember:h(ops.OpAddMember),UpdateMember:h(ops.OpUpdateMember),RemoveMember:h(ops.OpRemoveMember),AddCursor:h(ops.OpAddCursor),ApplyDirectStyling:h(ops.OpApplyDirectStyling),SetBlob:h(ops.OpSetBlob),RemoveBlob:h(ops.OpRemoveBlob),InsertImage:h(ops.OpInsertImage),InsertTable:h(ops.OpInsertTable),
InsertText:h(ops.OpInsertText),RemoveText:h(ops.OpRemoveText),SplitParagraph:h(ops.OpSplitParagraph),SetParagraphStyle:h(ops.OpSetParagraphStyle),UpdateParagraphStyle:h(ops.OpUpdateParagraphStyle),AddStyle:h(ops.OpAddStyle),RemoveStyle:h(ops.OpRemoveStyle),MoveCursor:h(ops.OpMoveCursor),RemoveCursor:h(ops.OpRemoveCursor),AddAnnotation:h(ops.OpAddAnnotation),RemoveAnnotation:h(ops.OpRemoveAnnotation),UpdateMetadata:h(ops.OpUpdateMetadata),ApplyHyperlink:h(ops.OpApplyHyperlink),RemoveHyperlink:h(ops.OpRemoveHyperlink)}};
// Input 86
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OperationRouter=function(){};ops.OperationRouter.prototype.setOperationFactory=function(h){};ops.OperationRouter.prototype.setPlaybackFunction=function(h){};ops.OperationRouter.prototype.push=function(h){};ops.OperationRouter.prototype.close=function(h){};ops.OperationRouter.prototype.subscribe=function(h,k){};ops.OperationRouter.prototype.unsubscribe=function(h,k){};ops.OperationRouter.prototype.hasLocalUnsyncedOps=function(){};ops.OperationRouter.prototype.hasSessionHostConnection=function(){};
// Input 87
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.OperationTransformMatrix=function(){function h(a){a.position+=a.length;a.length*=-1}function k(a){var b=0>a.length;b&&h(a);return b}function f(a,b){var c=[];a&&["style:parent-style-name","style:next-style-name"].forEach(function(d){a[d]===b&&c.push(d)});return c}function q(a,b){a&&["style:parent-style-name","style:next-style-name"].forEach(function(c){a[c]===b&&delete a[c]})}function p(a){var b={};Object.keys(a).forEach(function(c){b[c]="object"===typeof a[c]?p(a[c]):a[c]});return b}function n(a,
b,c,d){var e,f,h=!1,k=!1,m,n,p=d&&d.attributes?d.attributes.split(","):[];a&&(c||0<p.length)&&Object.keys(a).forEach(function(b){e=a[b];"object"!==typeof e&&(m=c&&c[b],void 0!==m?(delete a[b],k=!0,m===e&&(delete c[b],h=!0)):p&&-1!==p.indexOf(b)&&(delete a[b],k=!0))});if(b&&b.attributes&&(c||0<p.length)){n=b.attributes.split(",");for(d=0;d<n.length;d+=1)if(f=n[d],c&&void 0!==c[f]||p&&-1!==p.indexOf(f))n.splice(d,1),d-=1,k=!0;0<n.length?b.attributes=n.join(","):delete b.attributes}return{majorChanged:h,
minorChanged:k}}function c(a){for(var b in a)if(a.hasOwnProperty(b))return!0;return!1}function m(a){for(var b in a)if(a.hasOwnProperty(b)&&("attributes"!==b||0<a.attributes.length))return!0;return!1}function r(a,b,d){var e=a.setProperties?a.setProperties[d]:null,f=a.removedProperties?a.removedProperties[d]:null,h=b.setProperties?b.setProperties[d]:null,k=b.removedProperties?b.removedProperties[d]:null,p;p=n(e,f,h,k);e&&!c(e)&&delete a.setProperties[d];f&&!m(f)&&delete a.removedProperties[d];h&&!c(h)&&
delete b.setProperties[d];k&&!m(k)&&delete b.removedProperties[d];return p}function d(a,b){return{opSpecsA:[a],opSpecsB:[b]}}var e={AddCursor:{AddCursor:d,AddMember:d,AddStyle:d,ApplyDirectStyling:d,InsertText:d,MoveCursor:d,RemoveCursor:d,RemoveMember:d,RemoveStyle:d,RemoveText:d,SetParagraphStyle:d,SplitParagraph:d,UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},AddMember:{AddStyle:d,InsertText:d,MoveCursor:d,RemoveCursor:d,RemoveStyle:d,RemoveText:d,SetParagraphStyle:d,SplitParagraph:d,
UpdateMetadata:d,UpdateParagraphStyle:d},AddStyle:{AddStyle:d,ApplyDirectStyling:d,InsertText:d,MoveCursor:d,RemoveCursor:d,RemoveMember:d,RemoveStyle:function(a,b){var c,d=[a],e=[b];a.styleFamily===b.styleFamily&&(c=f(a.setProperties,b.styleName),0<c.length&&(c={optype:"UpdateParagraphStyle",memberid:b.memberid,timestamp:b.timestamp,styleName:a.styleName,removedProperties:{attributes:c.join(",")}},e.unshift(c)),q(a.setProperties,b.styleName));return{opSpecsA:d,opSpecsB:e}},RemoveText:d,SetParagraphStyle:d,
SplitParagraph:d,UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},ApplyDirectStyling:{ApplyDirectStyling:function(a,b,d){var e,f,h,k,m,n,q,s;k=[a];h=[b];if(!(a.position+a.length<=b.position||a.position>=b.position+b.length)){e=d?a:b;f=d?b:a;if(a.position!==b.position||a.length!==b.length)n=p(e),q=p(f);b=r(f,e,"style:text-properties");if(b.majorChanged||b.minorChanged)h=[],a=[],k=e.position+e.length,m=f.position+f.length,f.position<e.position?b.minorChanged&&(s=p(q),s.length=e.position-f.position,
a.push(s),f.position=e.position,f.length=m-f.position):e.position<f.position&&b.majorChanged&&(s=p(n),s.length=f.position-e.position,h.push(s),e.position=f.position,e.length=k-e.position),m>k?b.minorChanged&&(n=q,n.position=k,n.length=m-k,a.push(n),f.length=k-f.position):k>m&&b.majorChanged&&(n.position=m,n.length=k-m,h.push(n),e.length=m-e.position),e.setProperties&&c(e.setProperties)&&h.push(e),f.setProperties&&c(f.setProperties)&&a.push(f),d?(k=h,h=a):k=a}return{opSpecsA:k,opSpecsB:h}},InsertText:function(a,
b){b.position<=a.position?a.position+=b.text.length:b.position<=a.position+a.length&&(a.length+=b.text.length);return{opSpecsA:[a],opSpecsB:[b]}},MoveCursor:d,RemoveCursor:d,RemoveStyle:d,RemoveText:function(a,b){var c=a.position+a.length,d=b.position+b.length,e=[a],f=[b];d<=a.position?a.position-=b.length:b.position<c&&(a.position<b.position?a.length=d<c?a.length-b.length:b.position-a.position:(a.position=b.position,d<c?a.length=c-d:e=[]));return{opSpecsA:e,opSpecsB:f}},SetParagraphStyle:d,SplitParagraph:function(a,
b){b.position<a.position?a.position+=1:b.position<a.position+a.length&&(a.length+=1);return{opSpecsA:[a],opSpecsB:[b]}},UpdateMetadata:d,UpdateParagraphStyle:d},InsertText:{InsertText:function(a,b,c){a.position<b.position?b.position+=a.text.length:a.position>b.position?a.position+=b.text.length:c?b.position+=a.text.length:a.position+=b.text.length;return{opSpecsA:[a],opSpecsB:[b]}},MoveCursor:function(a,b){var c=k(b);a.position<b.position?b.position+=a.text.length:a.position<b.position+b.length&&
(b.length+=a.text.length);c&&h(b);return{opSpecsA:[a],opSpecsB:[b]}},RemoveCursor:d,RemoveMember:d,RemoveStyle:d,RemoveText:function(a,b){var c;c=b.position+b.length;var d=[a],e=[b];c<=a.position?a.position-=b.length:a.position<=b.position?b.position+=a.text.length:(b.length=a.position-b.position,c={optype:"RemoveText",memberid:b.memberid,timestamp:b.timestamp,position:a.position+a.text.length,length:c-a.position},e.unshift(c),a.position=b.position);return{opSpecsA:d,opSpecsB:e}},SplitParagraph:function(a,
b,c){if(a.position<b.position)b.position+=a.text.length;else if(a.position>b.position)a.position+=1;else return c?b.position+=a.text.length:a.position+=1,null;return{opSpecsA:[a],opSpecsB:[b]}},UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},MoveCursor:{MoveCursor:d,RemoveCursor:function(a,b){return{opSpecsA:a.memberid===b.memberid?[]:[a],opSpecsB:[b]}},RemoveMember:d,RemoveStyle:d,RemoveText:function(a,b){var c=k(a),d=a.position+a.length,e=b.position+b.length;e<=a.position?a.position-=b.length:
b.position<d&&(a.position<b.position?a.length=e<d?a.length-b.length:b.position-a.position:(a.position=b.position,a.length=e<d?d-e:0));c&&h(a);return{opSpecsA:[a],opSpecsB:[b]}},SetParagraphStyle:d,SplitParagraph:function(a,b){var c=k(a);b.position<a.position?a.position+=1:b.position<a.position+a.length&&(a.length+=1);c&&h(a);return{opSpecsA:[a],opSpecsB:[b]}},UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},RemoveCursor:{RemoveCursor:function(a,b){var c=a.memberid===b.memberid;return{opSpecsA:c?
[]:[a],opSpecsB:c?[]:[b]}},RemoveMember:d,RemoveStyle:d,RemoveText:d,SetParagraphStyle:d,SplitParagraph:d,UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},RemoveMember:{RemoveStyle:d,RemoveText:d,SetParagraphStyle:d,SplitParagraph:d,UpdateMetadata:d,UpdateParagraphStyle:d},RemoveStyle:{RemoveStyle:function(a,b){var c=a.styleName===b.styleName&&a.styleFamily===b.styleFamily;return{opSpecsA:c?[]:[a],opSpecsB:c?[]:[b]}},RemoveText:d,SetParagraphStyle:function(a,b){var c,d=[a],e=[b];"paragraph"===
a.styleFamily&&a.styleName===b.styleName&&(c={optype:"SetParagraphStyle",memberid:a.memberid,timestamp:a.timestamp,position:b.position,styleName:""},d.unshift(c),b.styleName="");return{opSpecsA:d,opSpecsB:e}},SplitParagraph:d,UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:function(a,b){var c,d=[a],e=[b];"paragraph"===a.styleFamily&&(c=f(b.setProperties,a.styleName),0<c.length&&(c={optype:"UpdateParagraphStyle",memberid:a.memberid,timestamp:a.timestamp,styleName:b.styleName,removedProperties:{attributes:c.join(",")}},
d.unshift(c)),a.styleName===b.styleName?e=[]:q(b.setProperties,a.styleName));return{opSpecsA:d,opSpecsB:e}}},RemoveText:{RemoveText:function(a,b){var c=a.position+a.length,d=b.position+b.length,e=[a],f=[b];d<=a.position?a.position-=b.length:c<=b.position?b.position-=a.length:b.position<c&&(a.position<b.position?(a.length=d<c?a.length-b.length:b.position-a.position,c<d?(b.position=a.position,b.length=d-c):f=[]):(c<d?b.length-=a.length:b.position<a.position?b.length=a.position-b.position:f=[],d<c?(a.position=
b.position,a.length=c-d):e=[]));return{opSpecsA:e,opSpecsB:f}},SplitParagraph:function(a,b){var c=a.position+a.length,d=[a],e=[b];b.position<=a.position?a.position+=1:b.position<c&&(a.length=b.position-a.position,c={optype:"RemoveText",memberid:a.memberid,timestamp:a.timestamp,position:b.position+1,length:c-b.position},d.unshift(c));a.position+a.length<=b.position?b.position-=a.length:a.position<b.position&&(b.position=a.position);return{opSpecsA:d,opSpecsB:e}},UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},
SetParagraphStyle:{UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},SplitParagraph:{SplitParagraph:function(a,b,c){a.position<b.position?b.position+=1:a.position>b.position?a.position+=1:a.position===b.position&&(c?b.position+=1:a.position+=1);return{opSpecsA:[a],opSpecsB:[b]}},UpdateMember:d,UpdateMetadata:d,UpdateParagraphStyle:d},UpdateMember:{UpdateMetadata:d,UpdateParagraphStyle:d},UpdateMetadata:{UpdateMetadata:function(a,b,d){var e,f=[a],h=[b];e=d?a:b;a=d?b:a;n(a.setProperties||null,
a.removedProperties||null,e.setProperties||null,e.removedProperties||null);e.setProperties&&c(e.setProperties)||e.removedProperties&&m(e.removedProperties)||(d?f=[]:h=[]);a.setProperties&&c(a.setProperties)||a.removedProperties&&m(a.removedProperties)||(d?h=[]:f=[]);return{opSpecsA:f,opSpecsB:h}},UpdateParagraphStyle:d},UpdateParagraphStyle:{UpdateParagraphStyle:function(a,b,d){var e,f=[a],h=[b];a.styleName===b.styleName&&(e=d?a:b,a=d?b:a,r(a,e,"style:paragraph-properties"),r(a,e,"style:text-properties"),
n(a.setProperties||null,a.removedProperties||null,e.setProperties||null,e.removedProperties||null),e.setProperties&&c(e.setProperties)||e.removedProperties&&m(e.removedProperties)||(d?f=[]:h=[]),a.setProperties&&c(a.setProperties)||a.removedProperties&&m(a.removedProperties)||(d?h=[]:f=[]));return{opSpecsA:f,opSpecsB:h}}}};this.passUnchanged=d;this.extendTransformations=function(a){Object.keys(a).forEach(function(b){var c=a[b],d,f=e.hasOwnProperty(b);runtime.log((f?"Extending":"Adding")+" map for optypeA: "+
b);f||(e[b]={});d=e[b];Object.keys(c).forEach(function(a){var e=d.hasOwnProperty(a);runtime.assert(b<=a,"Wrong order:"+b+", "+a);runtime.log("  "+(e?"Overwriting":"Adding")+" entry for optypeB: "+a);d[a]=c[a]})})};this.transformOpspecVsOpspec=function(a,b){var c=a.optype<=b.optype,d;runtime.log("Crosstransforming:");runtime.log(runtime.toJson(a));runtime.log(runtime.toJson(b));c||(d=a,a=b,b=d);(d=(d=e[a.optype])&&d[b.optype])?(d=d(a,b,!c),c||null===d||(d={opSpecsA:d.opSpecsB,opSpecsB:d.opSpecsA})):
d=null;runtime.log("result:");d?(runtime.log(runtime.toJson(d.opSpecsA)),runtime.log(runtime.toJson(d.opSpecsB))):runtime.log("null");return d}};
// Input 88
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.OperationFactory");runtime.loadClass("ops.OperationTransformMatrix");
ops.OperationTransformer=function(){function h(h){var k=[];h.forEach(function(c){k.push(f.create(c))});return k}function k(f,h){for(var c,m,r=[],d=[];0<f.length&&h;){c=f.shift();c=q.transformOpspecVsOpspec(c,h);if(!c)return null;r=r.concat(c.opSpecsA);if(0===c.opSpecsB.length){r=r.concat(f);h=null;break}for(;1<c.opSpecsB.length;){m=k(f,c.opSpecsB.shift());if(!m)return null;d=d.concat(m.opSpecsB);f=m.opSpecsA}h=c.opSpecsB.pop()}h&&d.push(h);return{opSpecsA:r,opSpecsB:d}}var f,q=new ops.OperationTransformMatrix;
this.setOperationFactory=function(h){f=h};this.getOperationTransformMatrix=function(){return q};this.transform=function(f,n){for(var c,m=[];0<n.length;){c=k(f,n.shift());if(!c)return null;f=c.opSpecsA;m=m.concat(c.opSpecsB)}return{opsA:h(f),opsB:h(m)}}};
// Input 89
/*

 Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
ops.TrivialOperationRouter=function(){var h,k;this.setOperationFactory=function(f){h=f};this.setPlaybackFunction=function(f){k=f};this.push=function(f){f.forEach(function(f){f=f.spec();f.timestamp=(new Date).getTime();f=h.create(f);k(f)})};this.close=function(f){f()};this.subscribe=function(f,h){};this.unsubscribe=function(f,h){};this.hasLocalUnsyncedOps=function(){return!1};this.hasSessionHostConnection=function(){return!0}};
// Input 90
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.EditInfo");runtime.loadClass("gui.EditInfoHandle");
gui.EditInfoMarker=function(h,k){function f(d,a){return runtime.setTimeout(function(){c.style.opacity=d},a)}var q=this,p,n,c,m,r,d;this.addEdit=function(e,a){var b=Date.now()-a;h.addEdit(e,a);n.setEdits(h.getSortedEdits());c.setAttributeNS("urn:webodf:names:editinfo","editinfo:memberid",e);runtime.clearTimeout(r);runtime.clearTimeout(d);1E4>b?(m=f(1,0),r=f(0.5,1E4-b),d=f(0.2,2E4-b)):1E4<=b&&2E4>b?(m=f(0.5,0),d=f(0.2,2E4-b)):m=f(0.2,0)};this.getEdits=function(){return h.getEdits()};this.clearEdits=
function(){h.clearEdits();n.setEdits([]);c.hasAttributeNS("urn:webodf:names:editinfo","editinfo:memberid")&&c.removeAttributeNS("urn:webodf:names:editinfo","editinfo:memberid")};this.getEditInfo=function(){return h};this.show=function(){c.style.display="block"};this.hide=function(){q.hideHandle();c.style.display="none"};this.showHandle=function(){n.show()};this.hideHandle=function(){n.hide()};this.destroy=function(e){runtime.clearTimeout(m);runtime.clearTimeout(r);runtime.clearTimeout(d);p.removeChild(c);
n.destroy(function(a){a?e(a):h.destroy(e)})};(function(){var d=h.getOdtDocument().getDOM();c=d.createElementNS(d.documentElement.namespaceURI,"div");c.setAttribute("class","editInfoMarker");c.onmouseover=function(){q.showHandle()};c.onmouseout=function(){q.hideHandle()};p=h.getNode();p.appendChild(c);n=new gui.EditInfoHandle(p);k||q.hide()})()};
// Input 91
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
gui.PlainTextPasteboard=function(h,k){function f(f,h){f.init(h);return f}this.createPasteOps=function(q){var p=h.getCursorPosition(k),n=p,c=[];q.replace(/\r/g,"").split("\n").forEach(function(h){c.push(f(new ops.OpSplitParagraph,{memberid:k,position:n,moveCursor:!0}));n+=1;c.push(f(new ops.OpInsertText,{memberid:k,position:n,text:h,moveCursor:!0}));n+=h.length});c.push(f(new ops.OpRemoveText,{memberid:k,position:p,length:1}));return c}};
// Input 92
runtime.loadClass("core.DomUtils");runtime.loadClass("odf.OdfUtils");runtime.loadClass("odf.OdfNodeFilter");runtime.loadClass("gui.SelectionMover");
gui.SelectionView=function(h){function k(){var a=b.getRootNode();g!==a&&(g=a,l=g.parentNode.parentNode.parentNode,l.appendChild(x),x.setAttribute("class","selectionOverlay"),x.appendChild(w))}function f(a){t=a;x.style.display=!0===a?"block":"none"}function q(a){var c=v.getBoundingClientRect(l),d=b.getOdfCanvas().getZoomLevel(),e={};e.top=v.adaptRangeDifferenceToZoomLevel(a.top-c.top,d);e.left=v.adaptRangeDifferenceToZoomLevel(a.left-c.left,d);e.bottom=v.adaptRangeDifferenceToZoomLevel(a.bottom-c.top,
d);e.right=v.adaptRangeDifferenceToZoomLevel(a.right-c.left,d);e.width=v.adaptRangeDifferenceToZoomLevel(a.width,d);e.height=v.adaptRangeDifferenceToZoomLevel(a.height,d);return e}function p(a){a=a.getBoundingClientRect();return Boolean(a&&0!==a.height)}function n(a){var b=y.getTextElements(a,!0,!1),c=a.cloneRange(),d=a.cloneRange();a=a.cloneRange();if(!b.length)return null;var e;a:{e=0;var f=b[e],g=c.startContainer===f?c.startOffset:0,h=g;c.setStart(f,g);for(c.setEnd(f,h);!p(c);){if(f.nodeType===
Node.ELEMENT_NODE&&h<f.childNodes.length)h=f.childNodes.length;else if(f.nodeType===Node.TEXT_NODE&&h<f.length)h+=1;else if(b[e])f=b[e],e+=1,g=h=0;else{e=!1;break a}c.setStart(f,g);c.setEnd(f,h)}e=!0}if(!e)return null;a:{e=b.length-1;f=b[e];h=g=d.endContainer===f?d.endOffset:f.length||f.childNodes.length;d.setStart(f,g);for(d.setEnd(f,h);!p(d);){if(f.nodeType===Node.ELEMENT_NODE&&0<g)g=0;else if(f.nodeType===Node.TEXT_NODE&&0<g)g-=1;else if(b[e])f=b[e],e-=1,g=h=f.length||f.childNodes.length;else{b=
!1;break a}d.setStart(f,g);d.setEnd(f,h)}b=!0}if(!b)return null;a.setStart(c.startContainer,c.startOffset);a.setEnd(d.endContainer,d.endOffset);return{firstRange:c,lastRange:d,fillerRange:a}}function c(a,b){var c={};c.top=Math.min(a.top,b.top);c.left=Math.min(a.left,b.left);c.right=Math.max(a.right,b.right);c.bottom=Math.max(a.bottom,b.bottom);c.width=c.right-c.left;c.height=c.bottom-c.top;return c}function m(a,b){b&&0<b.width&&0<b.height&&(a=a?c(a,b):b);return a}function r(a){function c(a){s.setUnfilteredPosition(a,
0);return w.acceptNode(a)===L&&t.acceptPosition(s)===L?L:z}function d(a){var b=null;c(a)===L&&(b=v.getBoundingClientRect(a));return b}var e=a.commonAncestorContainer,f=a.startContainer,g=a.endContainer,h=a.startOffset,k=a.endOffset,l,n,p=null,q,r=u.createRange(),t,w=new odf.OdfNodeFilter,x;if(f===e||g===e)return r=a.cloneRange(),p=r.getBoundingClientRect(),r.detach(),p;for(a=f;a.parentNode!==e;)a=a.parentNode;for(n=g;n.parentNode!==e;)n=n.parentNode;t=b.createRootFilter(f);for(e=a.nextSibling;e&&
e!==n;)q=d(e),p=m(p,q),e=e.nextSibling;if(y.isParagraph(a))p=m(p,v.getBoundingClientRect(a));else if(a.nodeType===Node.TEXT_NODE)e=a,r.setStart(e,h),r.setEnd(e,e===n?k:e.length),q=r.getBoundingClientRect(),p=m(p,q);else for(x=u.createTreeWalker(a,NodeFilter.SHOW_TEXT,c,!1),e=x.currentNode=f;e&&e!==g;)r.setStart(e,h),r.setEnd(e,e.length),q=r.getBoundingClientRect(),p=m(p,q),l=e,h=0,e=x.nextNode();l||(l=f);if(y.isParagraph(n))p=m(p,v.getBoundingClientRect(n));else if(n.nodeType===Node.TEXT_NODE)e=n,
r.setStart(e,e===a?h:0),r.setEnd(e,k),q=r.getBoundingClientRect(),p=m(p,q);else for(x=u.createTreeWalker(n,NodeFilter.SHOW_TEXT,c,!1),e=x.currentNode=g;e&&e!==l;)if(r.setStart(e,0),r.setEnd(e,k),q=r.getBoundingClientRect(),p=m(p,q),e=x.previousNode())k=e.length;return p}function d(a,b){var c=a.getBoundingClientRect(),d={width:0};d.top=c.top;d.bottom=c.bottom;d.height=c.height;d.left=d.right=b?c.right:c.left;return d}function e(){k();if(h.getSelectionType()===ops.OdtCursor.RangeSelection){f(!0);var a=
h.getSelectedRange(),b=n(a),e,g,l,m,p,s,t;if(a.collapsed||!b)f(!1);else{f(!0);a=b.firstRange;e=b.lastRange;b=b.fillerRange;g=q(d(a,!1));m=q(d(e,!0));l=(l=r(b))?q(l):c(g,m);p=l.left;l=g.left+Math.max(0,l.width-(g.left-l.left));s=Math.min(g.top,m.top);t=m.top+m.height;g=[{x:g.left,y:s+g.height},{x:g.left,y:s},{x:l,y:s},{x:l,y:t-m.height},{x:m.right,y:t-m.height},{x:m.right,y:t},{x:p,y:t},{x:p,y:s+g.height},{x:g.left,y:s+g.height}];m="";for(p=0;p<g.length;p+=1)m+=g[p].x+","+g[p].y+" ";w.setAttribute("points",
m);a.detach();e.detach();b.detach()}}else f(!1)}function a(a){a===h&&e()}var b=h.getOdtDocument(),g,l,u=b.getDOM(),x=u.createElementNS("http://www.w3.org/2000/svg","svg"),w=u.createElementNS("http://www.w3.org/2000/svg","polygon"),y=new odf.OdfUtils,v=new core.DomUtils,t=!0,s=gui.SelectionMover.createPositionIterator(b.getRootNode()),L=NodeFilter.FILTER_ACCEPT,z=NodeFilter.FILTER_REJECT;this.show=this.rerender=e;this.hide=function(){f(!1)};this.visible=function(){return t};this.destroy=function(b){l.removeChild(x);
h.getOdtDocument().unsubscribe(ops.OdtDocument.signalCursorMoved,a);b()};(function(){var b=h.getMemberId();k();x.setAttributeNS("urn:webodf:names:editinfo","editinfo:memberid",b);h.getOdtDocument().subscribe(ops.OdtDocument.signalCursorMoved,a)})()};
// Input 93
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("gui.SelectionView");
gui.SelectionViewManager=function(){function h(){return Object.keys(k).map(function(f){return k[f]})}var k={};this.getSelectionView=function(f){return k.hasOwnProperty(f)?k[f]:null};this.getSelectionViews=h;this.removeSelectionView=function(f){k.hasOwnProperty(f)&&(k[f].destroy(function(){}),delete k[f])};this.hideSelectionView=function(f){k.hasOwnProperty(f)&&k[f].hide()};this.showSelectionView=function(f){k.hasOwnProperty(f)&&k[f].show()};this.rerenderSelectionViews=function(){Object.keys(k).forEach(function(f){k[f].visible()&&
k[f].rerender()})};this.registerCursor=function(f,h){var p=f.getMemberId(),n=new gui.SelectionView(f);h?n.show():n.hide();return k[p]=n};this.destroy=function(f){var k=h();(function n(c,h){h?f(h):c<k.length?k[c].destroy(function(f){n(c+1,f)}):f()})(0,void 0)}};
// Input 94
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.DomUtils");runtime.loadClass("gui.UndoManager");runtime.loadClass("gui.UndoStateRules");
gui.TrivialUndoManager=function(h){function k(){u.emit(gui.UndoManager.signalUndoStackChanged,{undoAvailable:c.hasUndoStates(),redoAvailable:c.hasRedoStates()})}function f(){b!==d&&b!==g[g.length-1]&&g.push(b)}function q(a){var b=a.previousSibling||a.nextSibling;a.parentNode.removeChild(a);m.normalizeTextNodes(b)}function p(a){return Object.keys(a).map(function(b){return a[b]})}function n(b){function c(a){var b=a.spec();if(f[b.memberid])switch(b.optype){case "AddCursor":d[b.memberid]||(d[b.memberid]=
a,delete f[b.memberid],g-=1);break;case "MoveCursor":e[b.memberid]||(e[b.memberid]=a)}}var d={},e={},f={},g,h=b.pop();a.getCursors().forEach(function(a){f[a.getMemberId()]=!0});for(g=Object.keys(f).length;h&&0<g;)h.reverse(),h.forEach(c),h=b.pop();return p(d).concat(p(e))}var c=this,m=new core.DomUtils,r,d=[],e,a,b=[],g=[],l=[],u=new core.EventNotifier([gui.UndoManager.signalUndoStackChanged,gui.UndoManager.signalUndoStateCreated,gui.UndoManager.signalUndoStateModified,gui.TrivialUndoManager.signalDocumentRootReplaced]),
x=h||new gui.UndoStateRules;this.subscribe=function(a,b){u.subscribe(a,b)};this.unsubscribe=function(a,b){u.unsubscribe(a,b)};this.hasUndoStates=function(){return 0<g.length};this.hasRedoStates=function(){return 0<l.length};this.setOdtDocument=function(b){a=b};this.resetInitialState=function(){g.length=0;l.length=0;d.length=0;b.length=0;r=null;k()};this.saveInitialState=function(){var c=a.getOdfCanvas().odfContainer(),e=a.getOdfCanvas().getAnnotationViewManager();e&&e.forgetAnnotations();r=c.rootElement.cloneNode(!0);
a.getOdfCanvas().refreshAnnotations();c=r;m.getElementsByTagNameNS(c,"urn:webodf:names:cursor","cursor").forEach(q);m.getElementsByTagNameNS(c,"urn:webodf:names:cursor","anchor").forEach(q);f();g.unshift(d);b=d=n(g);g.length=0;l.length=0;k()};this.setPlaybackFunction=function(a){e=a};this.onOperationExecuted=function(a){l.length=0;x.isEditOperation(a)&&b===d||!x.isPartOfOperationSet(a,b)?(f(),b=[a],g.push(b),u.emit(gui.UndoManager.signalUndoStateCreated,{operations:b}),k()):(b.push(a),u.emit(gui.UndoManager.signalUndoStateModified,
{operations:b}))};this.moveForward=function(a){for(var c=0,d;a&&l.length;)d=l.pop(),g.push(d),d.forEach(e),a-=1,c+=1;c&&(b=g[g.length-1],k());return c};this.moveBackward=function(c){for(var f=a.getOdfCanvas(),h=f.odfContainer(),m=0;c&&g.length;)l.push(g.pop()),c-=1,m+=1;m&&(h.setRootElement(r.cloneNode(!0)),f.setOdfContainer(h,!0),u.emit(gui.TrivialUndoManager.signalDocumentRootReplaced,{}),a.getCursors().forEach(function(b){a.removeCursor(b.getMemberId())}),d.forEach(e),g.forEach(function(a){a.forEach(e)}),
f.refreshCSS(),b=g[g.length-1]||d,k());return m}};gui.TrivialUndoManager.signalDocumentRootReplaced="documentRootReplaced";(function(){return gui.TrivialUndoManager})();
// Input 95
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("ops.TrivialOperationRouter");runtime.loadClass("ops.OperationFactory");runtime.loadClass("ops.OdtDocument");
ops.Session=function(h){var k=new ops.OperationFactory,f=new ops.OdtDocument(h),q=null;this.setOperationFactory=function(f){k=f;q&&q.setOperationFactory(k)};this.setOperationRouter=function(h){q=h;h.setPlaybackFunction(function(h){return h.execute(f)?(f.emit(ops.OdtDocument.signalOperationExecuted,h),!0):!1});h.setOperationFactory(k)};this.getOperationFactory=function(){return k};this.getOdtDocument=function(){return f};this.enqueue=function(f){q.push(f)};this.close=function(h){q.close(function(k){k?
h(k):f.close(h)})};this.destroy=function(h){f.destroy(h)};this.setOperationRouter(new ops.TrivialOperationRouter)};
// Input 96
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 This file is part of WebODF.

 WebODF is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License (GNU AGPL)
 as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.

 WebODF is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 @licend

 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.EventNotifier");runtime.loadClass("core.PositionFilter");runtime.loadClass("ops.Session");runtime.loadClass("ops.OpAddAnnotation");runtime.loadClass("ops.OpRemoveAnnotation");runtime.loadClass("gui.SelectionMover");
gui.AnnotationController=function(h,k){function f(){var e=c.getCursor(k),e=e&&e.getNode(),a=!1;if(e){a:{for(a=c.getRootNode();e&&e!==a;){if(e.namespaceURI===d&&"annotation"===e.localName){e=!0;break a}e=e.parentNode}e=!1}a=!e}a!==m&&(m=a,r.emit(gui.AnnotationController.annotatableChanged,m))}function q(c){c.getMemberId()===k&&f()}function p(c){c===k&&f()}function n(c){c.getMemberId()===k&&f()}var c=h.getOdtDocument(),m=!1,r=new core.EventNotifier([gui.AnnotationController.annotatableChanged]),d=odf.Namespaces.officens;
this.isAnnotatable=function(){return m};this.addAnnotation=function(){var d=new ops.OpAddAnnotation,a=c.getCursorSelection(k),b=a.length,a=a.position;m&&(a=0<=b?a:a+b,b=Math.abs(b),d.init({memberid:k,position:a,length:b,name:k+Date.now()}),h.enqueue([d]))};this.removeAnnotation=function(d){var a,b;a=c.convertDomPointToCursorStep(d,0)+1;b=c.convertDomPointToCursorStep(d,d.childNodes.length);d=new ops.OpRemoveAnnotation;d.init({memberid:k,position:a,length:b-a});b=new ops.OpMoveCursor;b.init({memberid:k,
position:0<a?a-1:a,length:0});h.enqueue([d,b])};this.subscribe=function(c,a){r.subscribe(c,a)};this.unsubscribe=function(c,a){r.unsubscribe(c,a)};this.destroy=function(d){c.unsubscribe(ops.OdtDocument.signalCursorAdded,q);c.unsubscribe(ops.OdtDocument.signalCursorRemoved,p);c.unsubscribe(ops.OdtDocument.signalCursorMoved,n);d()};c.subscribe(ops.OdtDocument.signalCursorAdded,q);c.subscribe(ops.OdtDocument.signalCursorRemoved,p);c.subscribe(ops.OdtDocument.signalCursorMoved,n);f()};
gui.AnnotationController.annotatableChanged="annotatable/changed";(function(){return gui.AnnotationController})();
// Input 97
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.EventNotifier");runtime.loadClass("core.Utils");runtime.loadClass("odf.OdfUtils");runtime.loadClass("ops.OpAddStyle");runtime.loadClass("ops.OpSetParagraphStyle");runtime.loadClass("gui.StyleHelper");
gui.DirectParagraphStyler=function(h,k,f){function q(){function a(b,d,e){b!==d&&(void 0===c&&(c={}),c[e]=d);return d}var b=l.getCursor(k),b=b&&b.getSelectedRange(),c;v=a(v,b?w.isAlignedLeft(b):!1,"isAlignedLeft");t=a(t,b?w.isAlignedCenter(b):!1,"isAlignedCenter");s=a(s,b?w.isAlignedRight(b):!1,"isAlignedRight");L=a(L,b?w.isAlignedJustified(b):!1,"isAlignedJustified");c&&y.emit(gui.DirectParagraphStyler.paragraphStylingChanged,c)}function p(a){a.getMemberId()===k&&q()}function n(a){a===k&&q()}function c(a){a.getMemberId()===
k&&q()}function m(){q()}function r(a){var b=l.getCursor(k);b&&l.getParagraphElement(b.getNode())===a.paragraphElement&&q()}function d(a){return a===ops.StepsTranslator.NEXT_STEP}function e(a){var b=l.getCursor(k).getSelectedRange(),b=x.getParagraphElements(b),c=l.getFormatting();b.forEach(function(b){var e=l.convertDomPointToCursorStep(b,0,d),g=b.getAttributeNS(odf.Namespaces.textns,"style-name");b=f.generateStyleName();var m;g&&(m=c.createDerivedStyleObject(g,"paragraph",{}));m=a(m||{});g=new ops.OpAddStyle;
g.init({memberid:k,styleName:b,styleFamily:"paragraph",isAutomaticStyle:!0,setProperties:m});m=new ops.OpSetParagraphStyle;m.init({memberid:k,styleName:b,position:e});h.enqueue([g,m])})}function a(a){e(function(b){return u.mergeObjects(b,a)})}function b(b){a({"style:paragraph-properties":{"fo:text-align":b}})}function g(a,b){var c=l.getFormatting().getDefaultTabStopDistance(),d=b["style:paragraph-properties"],d=(d=d&&d["fo:margin-left"])&&x.parseLength(d);return u.mergeObjects(b,{"style:paragraph-properties":{"fo:margin-left":d&&
d.unit===c.unit?d.value+a*c.value+d.unit:a*c.value+c.unit}})}var l=h.getOdtDocument(),u=new core.Utils,x=new odf.OdfUtils,w=new gui.StyleHelper(l.getFormatting()),y=new core.EventNotifier([gui.DirectParagraphStyler.paragraphStylingChanged]),v,t,s,L;this.isAlignedLeft=function(){return v};this.isAlignedCenter=function(){return t};this.isAlignedRight=function(){return s};this.isAlignedJustified=function(){return L};this.alignParagraphLeft=function(){b("left");return!0};this.alignParagraphCenter=function(){b("center");
return!0};this.alignParagraphRight=function(){b("right");return!0};this.alignParagraphJustified=function(){b("justify");return!0};this.indent=function(){e(g.bind(null,1));return!0};this.outdent=function(){e(g.bind(null,-1));return!0};this.subscribe=function(a,b){y.subscribe(a,b)};this.unsubscribe=function(a,b){y.unsubscribe(a,b)};this.destroy=function(a){l.unsubscribe(ops.OdtDocument.signalCursorAdded,p);l.unsubscribe(ops.OdtDocument.signalCursorRemoved,n);l.unsubscribe(ops.OdtDocument.signalCursorMoved,
c);l.unsubscribe(ops.OdtDocument.signalParagraphStyleModified,m);l.unsubscribe(ops.OdtDocument.signalParagraphChanged,r);a()};l.subscribe(ops.OdtDocument.signalCursorAdded,p);l.subscribe(ops.OdtDocument.signalCursorRemoved,n);l.subscribe(ops.OdtDocument.signalCursorMoved,c);l.subscribe(ops.OdtDocument.signalParagraphStyleModified,m);l.subscribe(ops.OdtDocument.signalParagraphChanged,r);q()};gui.DirectParagraphStyler.paragraphStylingChanged="paragraphStyling/changed";(function(){return gui.DirectParagraphStyler})();
// Input 98
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.EventNotifier");runtime.loadClass("core.Utils");runtime.loadClass("ops.OpApplyDirectStyling");runtime.loadClass("gui.StyleHelper");
gui.DirectTextStyler=function(h,k){function f(a,b){for(var c=0,d=b[c];d&&a;)a=a[d],c+=1,d=b[c];return b.length===c?a:void 0}function q(a,b){var c=f(a[0],b);return a.every(function(a){return c===f(a,b)})?c:void 0}function p(){var a=t.getCursor(k),a=(a=a&&a.getSelectedRange())&&s.getAppliedStyles(a)||[];a[0]&&z&&(a[0]=v.mergeObjects(a[0],z));return a}function n(){function a(b,d,e){b!==d&&(void 0===c&&(c={}),c[e]=d);return d}var b,c;B=p();N=a(N,B?s.isBold(B):!1,"isBold");I=a(I,B?s.isItalic(B):!1,"isItalic");
T=a(T,B?s.hasUnderline(B):!1,"hasUnderline");A=a(A,B?s.hasStrikeThrough(B):!1,"hasStrikeThrough");b=B&&q(B,["style:text-properties","fo:font-size"]);C=a(C,b&&parseFloat(b),"fontSize");ia=a(ia,B&&q(B,["style:text-properties","style:font-name"]),"fontName");c&&L.emit(gui.DirectTextStyler.textStylingChanged,c)}function c(a){a.getMemberId()===k&&n()}function m(a){a===k&&n()}function r(a){a.getMemberId()===k&&n()}function d(){n()}function e(a){var b=t.getCursor(k);b&&t.getParagraphElement(b.getNode())===
a.paragraphElement&&n()}function a(a,b){var c=t.getCursor(k);if(!c)return!1;c=s.getAppliedStyles(c.getSelectedRange());b(!a(c));return!0}function b(a){var b=t.getCursorSelection(k),c={"style:text-properties":a};0!==b.length?(a=new ops.OpApplyDirectStyling,a.init({memberid:k,position:b.position,length:b.length,setProperties:c}),h.enqueue([a])):(z=v.mergeObjects(z||{},c),n())}function g(a,c){var d={};d[a]=c;b(d)}function l(a){a=a.spec();z&&a.memberid===k&&"SplitParagraph"!==a.optype&&(z=null,n())}function u(a){g("fo:font-weight",
a?"bold":"normal")}function x(a){g("fo:font-style",a?"italic":"normal")}function w(a){g("style:text-underline-style",a?"solid":"none")}function y(a){g("style:text-line-through-style",a?"solid":"none")}var v=new core.Utils,t=h.getOdtDocument(),s=new gui.StyleHelper(t.getFormatting()),L=new core.EventNotifier([gui.DirectTextStyler.textStylingChanged]),z,B=[],N=!1,I=!1,T=!1,A=!1,C,ia;this.formatTextSelection=b;this.createCursorStyleOp=function(a,b){var c=null;z&&(c=new ops.OpApplyDirectStyling,c.init({memberid:k,
position:a,length:b,setProperties:z}),z=null,n());return c};this.setBold=u;this.setItalic=x;this.setHasUnderline=w;this.setHasStrikethrough=y;this.setFontSize=function(a){g("fo:font-size",a+"pt")};this.setFontName=function(a){g("style:font-name",a)};this.getAppliedStyles=function(){return B};this.toggleBold=a.bind(this,s.isBold,u);this.toggleItalic=a.bind(this,s.isItalic,x);this.toggleUnderline=a.bind(this,s.hasUnderline,w);this.toggleStrikethrough=a.bind(this,s.hasStrikeThrough,y);this.isBold=function(){return N};
this.isItalic=function(){return I};this.hasUnderline=function(){return T};this.hasStrikeThrough=function(){return A};this.fontSize=function(){return C};this.fontName=function(){return ia};this.subscribe=function(a,b){L.subscribe(a,b)};this.unsubscribe=function(a,b){L.unsubscribe(a,b)};this.destroy=function(a){t.unsubscribe(ops.OdtDocument.signalCursorAdded,c);t.unsubscribe(ops.OdtDocument.signalCursorRemoved,m);t.unsubscribe(ops.OdtDocument.signalCursorMoved,r);t.unsubscribe(ops.OdtDocument.signalParagraphStyleModified,
d);t.unsubscribe(ops.OdtDocument.signalParagraphChanged,e);t.unsubscribe(ops.OdtDocument.signalOperationExecuted,l);a()};t.subscribe(ops.OdtDocument.signalCursorAdded,c);t.subscribe(ops.OdtDocument.signalCursorRemoved,m);t.subscribe(ops.OdtDocument.signalCursorMoved,r);t.subscribe(ops.OdtDocument.signalParagraphStyleModified,d);t.subscribe(ops.OdtDocument.signalParagraphChanged,e);t.subscribe(ops.OdtDocument.signalOperationExecuted,l);n()};gui.DirectTextStyler.textStylingChanged="textStyling/changed";
(function(){return gui.DirectTextStyler})();
// Input 99
runtime.loadClass("odf.OdfUtils");
gui.HyperlinkController=function(h,k){var f=new odf.OdfUtils,q=h.getOdtDocument();this.addHyperlink=function(f,n){var c=q.getCursorSelection(k),m=new ops.OpApplyHyperlink,r=[];if(0===c.length||n)n=n||f,m=new ops.OpInsertText,m.init({memberid:k,position:c.position,text:n}),c.length=n.length,r.push(m);m=new ops.OpApplyHyperlink;m.init({memberid:k,position:c.position,length:c.length,hyperlink:f});r.push(m);h.enqueue(r)};this.removeHyperlinks=function(){var p=gui.SelectionMover.createPositionIterator(q.getRootNode()),n=
q.getCursor(k).getSelectedRange(),c=f.getHyperlinkElements(n),m=n.collapsed&&1===c.length,r=q.getDOM().createRange(),d=[],e,a;0!==c.length&&(c.forEach(function(b){r.selectNodeContents(b);e=q.convertDomToCursorRange({anchorNode:r.startContainer,anchorOffset:r.startOffset,focusNode:r.endContainer,focusOffset:r.endOffset});a=new ops.OpRemoveHyperlink;a.init({memberid:k,position:e.position,length:e.length});d.push(a)}),m||(m=c[0],-1===n.comparePoint(m,0)&&(r.setStart(m,0),r.setEnd(n.startContainer,n.startOffset),
e=q.convertDomToCursorRange({anchorNode:r.startContainer,anchorOffset:r.startOffset,focusNode:r.endContainer,focusOffset:r.endOffset}),0<e.length&&(a=new ops.OpApplyHyperlink,a.init({memberid:k,position:e.position,length:e.length,hyperlink:f.getHyperlinkTarget(m)}),d.push(a))),c=c[c.length-1],p.moveToEndOfNode(c),p=p.unfilteredDomOffset(),1===n.comparePoint(c,p)&&(r.setStart(n.endContainer,n.endOffset),r.setEnd(c,p),e=q.convertDomToCursorRange({anchorNode:r.startContainer,anchorOffset:r.startOffset,
focusNode:r.endContainer,focusOffset:r.endOffset}),0<e.length&&(a=new ops.OpApplyHyperlink,a.init({memberid:k,position:e.position,length:e.length,hyperlink:f.getHyperlinkTarget(c)}),d.push(a)))),h.enqueue(d),r.detach())}};
// Input 100
runtime.loadClass("odf.Namespaces");runtime.loadClass("odf.ObjectNameGenerator");
gui.ImageManager=function(h,k,f){var q={"image/gif":".gif","image/jpeg":".jpg","image/png":".png"},p=odf.Namespaces.textns,n=h.getOdtDocument(),c=n.getFormatting(),m={};this.insertImage=function(r,d,e,a){var b;runtime.assert(0<e&&0<a,"Both width and height of the image should be greater than 0px.");b=n.getParagraphElement(n.getCursor(k).getNode()).getAttributeNS(p,"style-name");m.hasOwnProperty(b)||(m[b]=c.getContentSize(b,"paragraph"));b=m[b];e*=0.0264583333333334;a*=0.0264583333333334;var g=1,l=
1;e>b.width&&(g=b.width/e);a>b.height&&(l=b.height/a);g=Math.min(g,l);b=e*g;e=a*g;l=n.getOdfCanvas().odfContainer().rootElement.styles;a=r.toLowerCase();var g=q.hasOwnProperty(a)?q[a]:null,u;a=[];runtime.assert(null!==g,"Image type is not supported: "+r);g="Pictures/"+f.generateImageName()+g;u=new ops.OpSetBlob;u.init({memberid:k,filename:g,mimetype:r,content:d});a.push(u);c.getStyleElement("Graphics","graphic",[l])||(r=new ops.OpAddStyle,r.init({memberid:k,styleName:"Graphics",styleFamily:"graphic",
isAutomaticStyle:!1,setProperties:{"style:graphic-properties":{"text:anchor-type":"paragraph","svg:x":"0cm","svg:y":"0cm","style:wrap":"dynamic","style:number-wrapped-paragraphs":"no-limit","style:wrap-contour":"false","style:vertical-pos":"top","style:vertical-rel":"paragraph","style:horizontal-pos":"center","style:horizontal-rel":"paragraph"}}}),a.push(r));r=f.generateStyleName();d=new ops.OpAddStyle;d.init({memberid:k,styleName:r,styleFamily:"graphic",isAutomaticStyle:!0,setProperties:{"style:parent-style-name":"Graphics",
"style:graphic-properties":{"style:vertical-pos":"top","style:vertical-rel":"baseline","style:horizontal-pos":"center","style:horizontal-rel":"paragraph","fo:background-color":"transparent","style:background-transparency":"100%","style:shadow":"none","style:mirror":"none","fo:clip":"rect(0cm, 0cm, 0cm, 0cm)","draw:luminance":"0%","draw:contrast":"0%","draw:red":"0%","draw:green":"0%","draw:blue":"0%","draw:gamma":"100%","draw:color-inversion":"false","draw:image-opacity":"100%","draw:color-mode":"standard"}}});
a.push(d);u=new ops.OpInsertImage;u.init({memberid:k,position:n.getCursorPosition(k),filename:g,frameWidth:b+"cm",frameHeight:e+"cm",frameStyleName:r,frameName:f.generateFrameName()});a.push(u);h.enqueue(a)}};
// Input 101
/*

 Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("core.PositionFilter");
gui.TextManipulator=function(h,k,f){function q(c){var d=new ops.OpRemoveText;d.init({memberid:k,position:c.position,length:c.length});return d}function p(c){0>c.length&&(c.position+=c.length,c.length=-c.length);return c}function n(f,d){var e=new core.PositionFilterChain,a=gui.SelectionMover.createPositionIterator(c.getRootElement(f)),b=d?a.nextPosition:a.previousPosition;e.addFilter("BaseFilter",c.getPositionFilter());e.addFilter("RootFilter",c.createRootFilter(k));for(a.setUnfilteredPosition(f,0);b();)if(e.acceptPosition(a)===
m)return!0;return!1}var c=h.getOdtDocument(),m=core.PositionFilter.FilterResult.FILTER_ACCEPT;this.enqueueParagraphSplittingOps=function(){var f=p(c.getCursorSelection(k)),d,e=[];0<f.length&&(d=q(f),e.push(d));d=new ops.OpSplitParagraph;d.init({memberid:k,position:f.position,moveCursor:!0});e.push(d);h.enqueue(e);return!0};this.removeTextByBackspaceKey=function(){var f=c.getCursor(k),d=p(c.getCursorSelection(k)),e=null;0===d.length?n(f.getNode(),!1)&&(e=new ops.OpRemoveText,e.init({memberid:k,position:d.position-
1,length:1}),h.enqueue([e])):(e=q(d),h.enqueue([e]));return null!==e};this.removeTextByDeleteKey=function(){var f=c.getCursor(k),d=p(c.getCursorSelection(k)),e=null;0===d.length?n(f.getNode(),!0)&&(e=new ops.OpRemoveText,e.init({memberid:k,position:d.position,length:1}),h.enqueue([e])):(e=q(d),h.enqueue([e]));return null!==e};this.removeCurrentSelection=function(){var f=p(c.getCursorSelection(k));0!==f.length&&(f=q(f),h.enqueue([f]));return!0};this.insertText=function(m){var d=p(c.getCursorSelection(k)),
e,a=[];0<d.length&&(e=q(d),a.push(e));e=new ops.OpInsertText;e.init({memberid:k,position:d.position,text:m,moveCursor:!0});a.push(e);f&&(m=f(d.position,m.length))&&a.push(m);h.enqueue(a)}};(function(){return gui.TextManipulator})();
// Input 102
runtime.loadClass("core.DomUtils");runtime.loadClass("core.Async");runtime.loadClass("core.ScheduledTask");runtime.loadClass("odf.OdfUtils");runtime.loadClass("odf.ObjectNameGenerator");runtime.loadClass("ops.OdtCursor");runtime.loadClass("ops.OpAddCursor");runtime.loadClass("ops.OpRemoveCursor");runtime.loadClass("ops.StepsTranslator");runtime.loadClass("gui.Clipboard");runtime.loadClass("gui.DirectTextStyler");runtime.loadClass("gui.DirectParagraphStyler");runtime.loadClass("gui.KeyboardHandler");
runtime.loadClass("gui.HyperlinkClickHandler");runtime.loadClass("gui.HyperlinkController");runtime.loadClass("gui.ImageManager");runtime.loadClass("gui.ImageSelector");runtime.loadClass("gui.TextManipulator");runtime.loadClass("gui.AnnotationController");runtime.loadClass("gui.EventManager");runtime.loadClass("gui.PlainTextPasteboard");runtime.loadClass("gui.InputMethodEditor");
gui.SessionController=function(){var h=core.PositionFilter.FilterResult.FILTER_ACCEPT;gui.SessionController=function(k,f,q,p){function n(a,b,c){var d=new ops.OpMoveCursor;d.init({memberid:f,position:a,length:b||0,selectionType:c});return d}function c(a){var b=/[A-Za-z0-9]/,c=gui.SelectionMover.createPositionIterator(H.getRootNode()),d;for(c.setUnfilteredPosition(a.startContainer,a.startOffset);c.previousPosition();){d=c.getCurrentNode();if(d.nodeType===Node.TEXT_NODE){if(d=d.data[c.unfilteredDomOffset()],
!b.test(d))break}else if(!va.isTextSpan(d))break;a.setStart(c.container(),c.unfilteredDomOffset())}c.setUnfilteredPosition(a.endContainer,a.endOffset);do if(d=c.getCurrentNode(),d.nodeType===Node.TEXT_NODE){if(d=d.data[c.unfilteredDomOffset()],!b.test(d))break}else if(!va.isTextSpan(d))break;while(c.nextPosition());a.setEnd(c.container(),c.unfilteredDomOffset())}function m(a){var b=H.getParagraphElement(a.startContainer),c=H.getParagraphElement(a.endContainer);b&&a.setStart(b,0);c&&(va.isParagraph(a.endContainer)&&
0===a.endOffset?a.setEndBefore(c):a.setEnd(c,c.childNodes.length))}function r(a){a=H.getDistanceFromCursor(f,a,0);var b=null!==a?a+1:null,c;if(b||a)c=H.getCursorPosition(f),a=n(c+a,b-a,ops.OdtCursor.RegionSelection),k.enqueue([a]);X.focus()}function d(a){var b=0<=Aa.comparePoints(a.anchorNode,a.anchorOffset,a.focusNode,a.focusOffset),c=a.focusNode.ownerDocument.createRange();b?(c.setStart(a.anchorNode,a.anchorOffset),c.setEnd(a.focusNode,a.focusOffset)):(c.setStart(a.focusNode,a.focusOffset),c.setEnd(a.anchorNode,
a.anchorOffset));return{range:c,hasForwardSelection:b}}function e(a,b){return b?{anchorNode:a.startContainer,anchorOffset:a.startOffset,focusNode:a.endContainer,focusOffset:a.endOffset}:{anchorNode:a.endContainer,anchorOffset:a.endOffset,focusNode:a.startContainer,focusOffset:a.startOffset}}function a(a){return function(b){var c=a(b);return function(b,d){return a(d)===c}}}function b(b,d,g){var h=H.getOdfCanvas().getElement(),l;l=Aa.containsNode(h,b.startContainer);h=Aa.containsNode(h,b.endContainer);
if(l||h)if(l&&h&&(2===g?c(b):3<=g&&m(b)),b=e(b,d),d=H.convertDomToCursorRange(b,a(va.getParagraphElement)),b=H.getCursorSelection(f),d.position!==b.position||d.length!==b.length)b=n(d.position,d.length,ops.OdtCursor.RangeSelection),k.enqueue([b])}function g(a){var b=H.getCursorSelection(f),c=H.getCursor(f).getStepCounter();0!==a&&(a=0<a?c.convertForwardStepsBetweenFilters(a,oa,za):-c.convertBackwardStepsBetweenFilters(-a,oa,za),a=b.length+a,k.enqueue([n(b.position,a)]))}function l(a){var b=H.getCursorPosition(f),
c=H.getCursor(f).getStepCounter();0!==a&&(a=0<a?c.convertForwardStepsBetweenFilters(a,oa,za):-c.convertBackwardStepsBetweenFilters(-a,oa,za),k.enqueue([n(b+a,0)]))}function u(){l(-1);return!0}function x(){l(1);return!0}function w(){g(-1);return!0}function y(){g(1);return!0}function v(a,b){var c=H.getParagraphElement(H.getCursor(f).getNode());runtime.assert(Boolean(c),"SessionController: Cursor outside paragraph");c=H.getCursor(f).getStepCounter().countLinesSteps(a,oa);b?g(c):l(c)}function t(){v(-1,
!1);return!0}function s(){v(1,!1);return!0}function L(){v(-1,!0);return!0}function z(){v(1,!0);return!0}function B(a,b){var c=H.getCursor(f).getStepCounter().countStepsToLineBoundary(a,oa);b?g(c):l(c)}function N(){B(-1,!1);return!0}function I(){B(1,!1);return!0}function T(){B(-1,!0);return!0}function A(){B(1,!0);return!0}function C(b,c){var d=H.getCursor(f),g=c(d.getNode()),d=e(d.getSelectedRange(),d.hasForwardSelection());runtime.assert(Boolean(g),"SessionController: Cursor outside root");0>b?(d.focusNode=
g,d.focusOffset=0):(d.focusNode=g,d.focusOffset=g.childNodes.length);g=H.convertDomToCursorRange(d,a(c));k.enqueue([n(g.position,g.length)])}function ia(){C(-1,H.getParagraphElement);return!0}function xa(){C(1,H.getParagraphElement);return!0}function E(a){var b=H.getCursor(f),b=H.getRootElement(b.getNode());runtime.assert(Boolean(b),"SessionController: Cursor outside root");a=0>a?H.convertDomPointToCursorStep(b,0,function(a){return a===ops.StepsTranslator.NEXT_STEP}):H.convertDomPointToCursorStep(b,
b.childNodes.length);k.enqueue([n(a,0)]);return!0}function R(){E(-1);return!0}function Z(){E(1);return!0}function M(){C(-1,H.getRootElement);return!0}function S(){C(1,H.getRootElement);return!0}function F(){var b=H.getCursor(f),b=H.getRootElement(b.getNode());runtime.assert(Boolean(b),"SessionController: Cursor outside root");b=H.convertDomToCursorRange({anchorNode:b,anchorOffset:0,focusNode:b,focusOffset:b.childNodes.length},a(H.getRootElement));k.enqueue([n(b.position,b.length)]);return!0}function G(){var a=
H.getCursor(f);if(a&&a.getSelectionType()===ops.OdtCursor.RegionSelection&&(a=va.getImageElements(a.getSelectedRange())[0])){Ha.select(a.parentNode);return}Ha.clearSelection()}function V(a){var b=H.getCursor(f).getSelectedRange();b.collapsed?a.preventDefault():Da.setDataFromRange(a,b)?la.removeCurrentSelection():runtime.log("Cut operation failed")}function da(){return!1!==H.getCursor(f).getSelectedRange().collapsed}function D(a){var b=H.getCursor(f).getSelectedRange();b.collapsed?a.preventDefault():
Da.setDataFromRange(a,b)||runtime.log("Copy operation failed")}function J(a){var b;Q.clipboardData&&Q.clipboardData.getData?b=Q.clipboardData.getData("Text"):a.clipboardData&&a.clipboardData.getData&&(b=a.clipboardData.getData("text/plain"));b&&(la.removeCurrentSelection(),k.enqueue(La.createPasteOps(b)));a.preventDefault?a.preventDefault():a.returnValue=!1}function U(){return!1}function ba(a){if(ea)ea.onOperationExecuted(a)}function qa(a){H.emit(ops.OdtDocument.signalUndoStackChanged,a)}function Y(){return ea?
(ea.moveBackward(1),Ga.trigger(),!0):!1}function ra(){return ea?(ea.moveForward(1),Ga.trigger(),!0):!1}function W(){var a=Q.getSelection(),b=0<a.rangeCount&&d(a);wa&&b&&(ka=!0,Ha.clearSelection(),Ka.setUnfilteredPosition(a.focusNode,a.focusOffset),ca.acceptPosition(Ka)===h&&(2===Ba?c(b.range):3<=Ba&&m(b.range),q.setSelectedRange(b.range,b.hasForwardSelection),H.emit(ops.OdtDocument.signalCursorMoved,q)))}function aa(a){var b=a.target||a.srcElement,c=H.getCursor(f);if(wa=b&&Aa.containsNode(H.getOdfCanvas().getElement(),
b))ka=!1,ca=H.createRootFilter(b),Ba=a.detail,c&&a.shiftKey?Q.getSelection().collapse(c.getAnchorNode(),0):(a=Q.getSelection(),b=c.getSelectedRange(),X.blur(),a.extend?c.hasForwardSelection()?(a.collapse(b.startContainer,b.startOffset),a.extend(b.endContainer,b.endOffset)):(a.collapse(b.endContainer,b.endOffset),a.extend(b.startContainer,b.startOffset)):(a.removeAllRanges(),a.addRange(b.cloneRange()),X.getEventTrap().setActive())),1<Ba&&W()}function $(a){var c=a.target||a.srcElement,e=a.detail,f=
a.clientX,g=a.clientY;Fa.processRequests();va.isImage(c)&&va.isCharacterFrame(c.parentNode)?(r(c.parentNode),X.focus()):wa&&!Ha.isSelectorElement(c)&&(ka?(b(q.getSelectedRange(),q.hasForwardSelection(),a.detail),X.focus()):Ia=runtime.setTimeout(function(){var a;a=(a=Q.getSelection())?{anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}:null;var c;if(!a.anchorNode&&!a.focusNode){var h=H.getDOM();c=null;h.caretRangeFromPoint?(h=h.caretRangeFromPoint(f,
g),c={container:h.startContainer,offset:h.startOffset}):h.caretPositionFromPoint&&(h=h.caretPositionFromPoint(f,g))&&h.offsetNode&&(c={container:h.offsetNode,offset:h.offset});c&&(a.anchorNode=c.container,a.anchorOffset=c.offset,a.focusNode=a.anchorNode,a.focusOffset=a.anchorOffset)}a.anchorNode&&a.focusNode&&(a=d(a),b(a.range,a.hasForwardSelection,e));X.focus()},0));Ba=0;ka=wa=!1}function fa(){wa&&X.focus();Ba=0;ka=wa=!1}function O(a){$(a)}function ja(a){var b=a.target||a.srcElement,c=null;"annotationRemoveButton"===
b.className?(c=Aa.getElementsByTagNameNS(b.parentNode,odf.Namespaces.officens,"annotation")[0],ta.removeAnnotation(c)):$(a)}function ma(a){(a=a.data)&&la.insertText(a)}function sa(a){return function(){a();return!0}}function P(a){return function(b){return H.getCursor(f).getSelectionType()===ops.OdtCursor.RangeSelection?a(b):!0}}var Q=runtime.getWindow(),H=k.getOdtDocument(),Ca=new core.Async,Aa=new core.DomUtils,va=new odf.OdfUtils,Da=new gui.Clipboard,K=new gui.KeyboardHandler,Ea=new gui.KeyboardHandler,
ya=new gui.KeyboardHandler,oa=new core.PositionFilterChain,za=H.getPositionFilter(),wa=!1,ga=new odf.ObjectNameGenerator(H.getOdfCanvas().odfContainer(),f),ka=!1,ca=null,Ia,ea=null,X=new gui.EventManager(H),ta=new gui.AnnotationController(k,f),pa=new gui.DirectTextStyler(k,f),ha=p&&p.directParagraphStylingEnabled?new gui.DirectParagraphStyler(k,f,ga):null,la=new gui.TextManipulator(k,f,pa.createCursorStyleOp),Ja=new gui.ImageManager(k,f,ga),Ha=new gui.ImageSelector(H.getOdfCanvas()),Ka=gui.SelectionMover.createPositionIterator(H.getRootNode()),
Fa,Ga,La=new gui.PlainTextPasteboard(H,f),na=new gui.InputMethodEditor(f,H,X),Ba=0,ua=new gui.HyperlinkClickHandler(H.getRootNode),Ma=new gui.HyperlinkController(k,f);runtime.assert(null!==Q,"Expected to be run in an environment which has a global window, like a browser.");oa.addFilter("BaseFilter",za);oa.addFilter("RootFilter",H.createRootFilter(f));this.selectRange=b;this.moveCursorToLeft=u;this.moveCursorToDocumentStart=R;this.moveCursorToDocumentEnd=Z;this.extendSelectionToDocumentStart=M;this.extendSelectionToDocumentEnd=
S;this.extendSelectionToEntireDocument=F;this.startEditing=function(){var a;H.getOdfCanvas().getElement().classList.add("virtualSelections");na.subscribe(gui.InputMethodEditor.signalCompositionStart,la.removeCurrentSelection);na.subscribe(gui.InputMethodEditor.signalCompositionEnd,ma);X.subscribe("keydown",K.handleEvent);X.subscribe("keypress",Ea.handleEvent);X.subscribe("keyup",ya.handleEvent);X.subscribe("beforecut",da);X.subscribe("cut",V);X.subscribe("copy",D);X.subscribe("beforepaste",U);X.subscribe("paste",
J);X.subscribe("mousedown",aa);X.subscribe("mousemove",Fa.trigger);X.subscribe("mouseup",ja);X.subscribe("contextmenu",O);X.subscribe("dragend",fa);H.subscribe(ops.OdtDocument.signalOperationExecuted,Ga.trigger);H.subscribe(ops.OdtDocument.signalOperationExecuted,ba);H.subscribe(ops.OdtDocument.signalCursorAdded,na.registerCursor);H.subscribe(ops.OdtDocument.signalCursorRemoved,na.removeCursor);a=new ops.OpAddCursor;a.init({memberid:f});k.enqueue([a]);ea&&ea.saveInitialState();ua.setEditing(!0)};
this.endEditing=function(){var a;a=new ops.OpRemoveCursor;a.init({memberid:f});k.enqueue([a]);ea&&ea.resetInitialState();H.unsubscribe(ops.OdtDocument.signalCursorAdded,na.registerCursor);H.unsubscribe(ops.OdtDocument.signalCursorRemoved,na.removeCursor);H.unsubscribe(ops.OdtDocument.signalOperationExecuted,ba);H.unsubscribe(ops.OdtDocument.signalOperationExecuted,Ga.trigger);na.unsubscribe(gui.InputMethodEditor.signalCompositionStart,la.removeCurrentSelection);na.unsubscribe(gui.InputMethodEditor.signalCompositionEnd,
ma);X.unsubscribe("keydown",K.handleEvent);X.unsubscribe("keypress",Ea.handleEvent);X.unsubscribe("keyup",ya.handleEvent);X.unsubscribe("cut",V);X.unsubscribe("beforecut",da);X.unsubscribe("copy",D);X.unsubscribe("paste",J);X.unsubscribe("beforepaste",U);X.unsubscribe("mousemove",Fa.trigger);X.unsubscribe("mousedown",aa);X.unsubscribe("mouseup",ja);X.unsubscribe("contextmenu",O);X.unsubscribe("dragend",fa);H.getOdfCanvas().getElement().classList.remove("virtualSelections");ua.setEditing(!1)};this.getInputMemberId=
function(){return f};this.getSession=function(){return k};this.setUndoManager=function(a){ea&&ea.unsubscribe(gui.UndoManager.signalUndoStackChanged,qa);if(ea=a)ea.setOdtDocument(H),ea.setPlaybackFunction(function(a){a.execute(H)}),ea.subscribe(gui.UndoManager.signalUndoStackChanged,qa)};this.getUndoManager=function(){return ea};this.getAnnotationController=function(){return ta};this.getDirectTextStyler=function(){return pa};this.getDirectParagraphStyler=function(){return ha};this.getHyperlinkController=
function(){return Ma};this.getImageManager=function(){return Ja};this.getTextManipulator=function(){return la};this.getEventManager=function(){return X};this.getKeyboardHandlers=function(){return{keydown:K,keypress:Ea}};this.destroy=function(a){var b=[Fa.destroy,pa.destroy,na.destroy];runtime.clearTimeout(Ia);ha&&b.push(ha.destroy);Ca.destroyAll(b,a)};(function(){var a=-1!==Q.navigator.appVersion.toLowerCase().indexOf("mac"),b=gui.KeyboardHandler.Modifier,c=gui.KeyboardHandler.KeyCode;Fa=new core.ScheduledTask(W,
0);Ga=new core.ScheduledTask(G,0);K.bind(c.Tab,b.None,P(function(){la.insertText("\t");return!0}));K.bind(c.Left,b.None,P(u));K.bind(c.Right,b.None,P(x));K.bind(c.Up,b.None,P(t));K.bind(c.Down,b.None,P(s));K.bind(c.Backspace,b.None,sa(la.removeTextByBackspaceKey));K.bind(c.Delete,b.None,la.removeTextByDeleteKey);K.bind(c.Left,b.Shift,P(w));K.bind(c.Right,b.Shift,P(y));K.bind(c.Up,b.Shift,P(L));K.bind(c.Down,b.Shift,P(z));K.bind(c.Home,b.None,P(N));K.bind(c.End,b.None,P(I));K.bind(c.Home,b.Ctrl,P(R));
K.bind(c.End,b.Ctrl,P(Z));K.bind(c.Home,b.Shift,P(T));K.bind(c.End,b.Shift,P(A));K.bind(c.Up,b.CtrlShift,P(ia));K.bind(c.Down,b.CtrlShift,P(xa));K.bind(c.Home,b.CtrlShift,P(M));K.bind(c.End,b.CtrlShift,P(S));a?(K.bind(c.Clear,b.None,la.removeCurrentSelection),K.bind(c.Left,b.Meta,P(N)),K.bind(c.Right,b.Meta,P(I)),K.bind(c.Home,b.Meta,P(R)),K.bind(c.End,b.Meta,P(Z)),K.bind(c.Left,b.MetaShift,P(T)),K.bind(c.Right,b.MetaShift,P(A)),K.bind(c.Up,b.AltShift,P(ia)),K.bind(c.Down,b.AltShift,P(xa)),K.bind(c.Up,
b.MetaShift,P(M)),K.bind(c.Down,b.MetaShift,P(S)),K.bind(c.A,b.Meta,P(F)),K.bind(c.B,b.Meta,P(pa.toggleBold)),K.bind(c.I,b.Meta,P(pa.toggleItalic)),K.bind(c.U,b.Meta,P(pa.toggleUnderline)),ha&&(K.bind(c.L,b.MetaShift,P(ha.alignParagraphLeft)),K.bind(c.E,b.MetaShift,P(ha.alignParagraphCenter)),K.bind(c.R,b.MetaShift,P(ha.alignParagraphRight)),K.bind(c.J,b.MetaShift,P(ha.alignParagraphJustified))),ta&&K.bind(c.C,b.MetaShift,ta.addAnnotation),K.bind(c.Z,b.Meta,Y),K.bind(c.Z,b.MetaShift,ra),K.bind(c.LeftMeta,
b.Meta,ua.showPointerCursor),ya.bind(c.LeftMeta,b.None,ua.showTextCursor),K.bind(c.MetaInMozilla,b.Meta,ua.showPointerCursor),ya.bind(c.MetaInMozilla,b.None,ua.showTextCursor)):(K.bind(c.A,b.Ctrl,P(F)),K.bind(c.B,b.Ctrl,P(pa.toggleBold)),K.bind(c.I,b.Ctrl,P(pa.toggleItalic)),K.bind(c.U,b.Ctrl,P(pa.toggleUnderline)),ha&&(K.bind(c.L,b.CtrlShift,P(ha.alignParagraphLeft)),K.bind(c.E,b.CtrlShift,P(ha.alignParagraphCenter)),K.bind(c.R,b.CtrlShift,P(ha.alignParagraphRight)),K.bind(c.J,b.CtrlShift,P(ha.alignParagraphJustified))),
ta&&K.bind(c.C,b.CtrlAlt,ta.addAnnotation),K.bind(c.Z,b.Ctrl,Y),K.bind(c.Z,b.CtrlShift,ra),K.bind(c.Ctrl,b.Ctrl,ua.showPointerCursor),ya.bind(c.Ctrl,b.None,ua.showTextCursor));Ea.setDefault(P(function(a){var b;b=null===a.which||void 0===a.which?String.fromCharCode(a.keyCode):0!==a.which&&0!==a.charCode?String.fromCharCode(a.which):null;return!b||a.altKey||a.ctrlKey||a.metaKey?!1:(la.insertText(b),!0)}));Ea.bind(c.Enter,b.None,P(la.enqueueParagraphSplittingOps));X.subscribe("click",ua.handleClick)})()};
return gui.SessionController}();
// Input 103
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("gui.Caret");
gui.CaretManager=function(h){function k(a){return b.hasOwnProperty(a)?b[a]:null}function f(){return Object.keys(b).map(function(a){return b[a]})}function q(a){a===h.getInputMemberId()&&h.getSession().getOdtDocument().getOdfCanvas().getElement().removeAttribute("tabindex");delete b[a]}function p(a){a=a.getMemberId();a===h.getInputMemberId()&&(a=k(a))&&a.refreshCursorBlinking()}function n(){var a=k(h.getInputMemberId());u=!1;a&&a.ensureVisible()}function c(){var a=k(h.getInputMemberId());a&&(a.handleUpdate(),
u||(u=!0,l=runtime.setTimeout(n,50)))}function m(a){a.memberId===h.getInputMemberId()&&c()}function r(){var a=k(h.getInputMemberId());a&&a.setFocus()}function d(){var a=k(h.getInputMemberId());a&&a.removeFocus()}function e(){var a=k(h.getInputMemberId());a&&a.show()}function a(){var a=k(h.getInputMemberId());a&&a.hide()}var b={},g=runtime.getWindow(),l,u=!1;this.registerCursor=function(a,d,e){var f=a.getMemberId();d=new gui.Caret(a,d,e);b[f]=d;f===h.getInputMemberId()?(runtime.log("Starting to track input on new cursor of "+
f),a.subscribe(ops.OdtCursor.signalCursorUpdated,c),h.getEventManager().focus()):a.subscribe(ops.OdtCursor.signalCursorUpdated,d.handleUpdate);return d};this.getCaret=k;this.getCarets=f;this.destroy=function(c){var k=h.getSession().getOdtDocument(),n=h.getEventManager(),u=f();runtime.clearTimeout(l);k.unsubscribe(ops.OdtDocument.signalParagraphChanged,m);k.unsubscribe(ops.OdtDocument.signalCursorMoved,p);k.unsubscribe(ops.OdtDocument.signalCursorRemoved,q);n.unsubscribe("focus",r);n.unsubscribe("blur",
d);g.removeEventListener("focus",e,!1);g.removeEventListener("blur",a,!1);(function s(a,b){b?c(b):a<u.length?u[a].destroy(function(b){s(a+1,b)}):c()})(0,void 0);b={}};(function(){var b=h.getSession().getOdtDocument(),c=h.getEventManager();b.subscribe(ops.OdtDocument.signalParagraphChanged,m);b.subscribe(ops.OdtDocument.signalCursorMoved,p);b.subscribe(ops.OdtDocument.signalCursorRemoved,q);c.subscribe("focus",r);c.subscribe("blur",d);g.addEventListener("focus",e,!1);g.addEventListener("blur",a,!1)})()};
// Input 104
/*

 Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>

 @licstart
 The JavaScript code in this page is free software: you can redistribute it
 and/or modify it under the terms of the GNU Affero General Public License
 (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 the License, or (at your option) any later version.  The code is distributed
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this code.  If not, see <http://www.gnu.org/licenses/>.

 As additional permission under GNU AGPL version 3 section 7, you
 may distribute non-source (e.g., minimized or compacted) forms of
 that code without the copy of the GNU GPL normally required by
 section 4, provided you include this license notice and a URL
 through which recipients can access the Corresponding Source.

 As a special exception to the AGPL, any HTML file which merely makes function
 calls to this code, and for that purpose includes it by reference shall be
 deemed a separate work for copyright law purposes. In addition, the copyright
 holders of this code give you permission to combine this code with free
 software libraries that are released under the GNU LGPL. You may copy and
 distribute such a system following the terms of the GNU AGPL for this code
 and the LGPL for the libraries. If you modify this code, you may extend this
 exception to your version of the code, but you are not obligated to do so.
 If you do not wish to do so, delete this exception statement from your
 version.

 This license applies to this entire compilation.
 @licend
 @source: http://www.webodf.org/
 @source: https://github.com/kogmbh/WebODF/
*/
runtime.loadClass("gui.Caret");runtime.loadClass("ops.EditInfo");runtime.loadClass("gui.EditInfoMarker");gui.SessionViewOptions=function(){this.caretBlinksOnRangeSelect=this.caretAvatarsInitiallyVisible=this.editInfoMarkersInitiallyVisible=!0};
gui.SessionView=function(){return function(h,k,f,q,p){function n(a,b,c){function d(b,c,e){c=b+'[editinfo|memberid="'+a+'"]'+e+c;a:{var f=u.firstChild;for(b=b+'[editinfo|memberid="'+a+'"]'+e+"{";f;){if(f.nodeType===Node.TEXT_NODE&&0===f.data.indexOf(b)){b=f;break a}f=f.nextSibling}b=null}b?b.data=c:u.appendChild(document.createTextNode(c))}d("div.editInfoMarker","{ background-color: "+c+"; }","");d("span.editInfoColor","{ background-color: "+c+"; }","");d("span.editInfoAuthor",'{ content: "'+b+'"; }',
":before");d("dc|creator","{ background-color: "+c+"; }","");d(".selectionOverlay","{ fill: "+c+"; stroke: "+c+";}","")}function c(a){var b,c;for(c in w)w.hasOwnProperty(c)&&(b=w[c],a?b.show():b.hide())}function m(a){q.getCarets().forEach(function(b){a?b.showHandle():b.hideHandle()})}function r(a){var b=a.getMemberId();a=a.getProperties();n(b,a.fullName,a.color);k===b&&n("","",a.color)}function d(a){var b=a.getMemberId(),c=f.getOdtDocument().getMember(b).getProperties();q.registerCursor(a,v,t);p.registerCursor(a,
!0);if(a=q.getCaret(b))a.setAvatarImageUrl(c.imageUrl),a.setColor(c.color);runtime.log("+++ View here +++ eagerly created an Caret for '"+b+"'! +++")}function e(a){a=a.getMemberId();var b=p.getSelectionView(k),c=p.getSelectionView(gui.ShadowCursor.ShadowCursorMemberId),d=q.getCaret(k);a===k?(c.hide(),b&&b.show(),d&&d.show()):a===gui.ShadowCursor.ShadowCursorMemberId&&(c.show(),b&&b.hide(),d&&d.hide())}function a(a){p.removeSelectionView(a)}function b(a){var b=a.paragraphElement,c=a.memberId;a=a.timeStamp;
var d,e="",g=b.getElementsByTagNameNS(x,"editinfo")[0];g?(e=g.getAttributeNS(x,"id"),d=w[e]):(e=Math.random().toString(),d=new ops.EditInfo(b,f.getOdtDocument()),d=new gui.EditInfoMarker(d,y),g=b.getElementsByTagNameNS(x,"editinfo")[0],g.setAttributeNS(x,"id",e),w[e]=d);d.addEdit(c,new Date(a))}function g(){L=!0}function l(){s=runtime.getWindow().setInterval(function(){L&&(p.rerenderSelectionViews(),L=!1)},200)}var u,x="urn:webodf:names:editinfo",w={},y=void 0!==h.editInfoMarkersInitiallyVisible?
Boolean(h.editInfoMarkersInitiallyVisible):!0,v=void 0!==h.caretAvatarsInitiallyVisible?Boolean(h.caretAvatarsInitiallyVisible):!0,t=void 0!==h.caretBlinksOnRangeSelect?Boolean(h.caretBlinksOnRangeSelect):!0,s,L=!1;this.showEditInfoMarkers=function(){y||(y=!0,c(y))};this.hideEditInfoMarkers=function(){y&&(y=!1,c(y))};this.showCaretAvatars=function(){v||(v=!0,m(v))};this.hideCaretAvatars=function(){v&&(v=!1,m(v))};this.getSession=function(){return f};this.getCaret=function(a){return q.getCaret(a)};
this.destroy=function(c){var h=f.getOdtDocument(),k=Object.keys(w).map(function(a){return w[a]});h.unsubscribe(ops.OdtDocument.signalMemberAdded,r);h.unsubscribe(ops.OdtDocument.signalMemberUpdated,r);h.unsubscribe(ops.OdtDocument.signalCursorAdded,d);h.unsubscribe(ops.OdtDocument.signalCursorRemoved,a);h.unsubscribe(ops.OdtDocument.signalParagraphChanged,b);h.unsubscribe(ops.OdtDocument.signalCursorMoved,e);h.unsubscribe(ops.OdtDocument.signalParagraphChanged,g);h.unsubscribe(ops.OdtDocument.signalTableAdded,
g);h.unsubscribe(ops.OdtDocument.signalParagraphStyleModified,g);runtime.getWindow().clearInterval(s);u.parentNode.removeChild(u);(function T(a,b){b?c(b):a<k.length?k[a].destroy(function(b){T(a+1,b)}):c()})(0,void 0)};(function(){var c=f.getOdtDocument(),h=document.getElementsByTagName("head")[0];c.subscribe(ops.OdtDocument.signalMemberAdded,r);c.subscribe(ops.OdtDocument.signalMemberUpdated,r);c.subscribe(ops.OdtDocument.signalCursorAdded,d);c.subscribe(ops.OdtDocument.signalCursorRemoved,a);c.subscribe(ops.OdtDocument.signalParagraphChanged,
b);c.subscribe(ops.OdtDocument.signalCursorMoved,e);l();c.subscribe(ops.OdtDocument.signalParagraphChanged,g);c.subscribe(ops.OdtDocument.signalTableAdded,g);c.subscribe(ops.OdtDocument.signalParagraphStyleModified,g);u=document.createElementNS(h.namespaceURI,"style");u.type="text/css";u.media="screen, print, handheld, projection";u.appendChild(document.createTextNode("@namespace editinfo url(urn:webodf:names:editinfo);"));u.appendChild(document.createTextNode("@namespace dc url(http://purl.org/dc/elements/1.1/);"));
h.appendChild(u)})()}}();
// Input 105
var webodf_css="@namespace draw url(urn:oasis:names:tc:opendocument:xmlns:drawing:1.0);\n@namespace fo url(urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0);\n@namespace office url(urn:oasis:names:tc:opendocument:xmlns:office:1.0);\n@namespace presentation url(urn:oasis:names:tc:opendocument:xmlns:presentation:1.0);\n@namespace style url(urn:oasis:names:tc:opendocument:xmlns:style:1.0);\n@namespace svg url(urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0);\n@namespace table url(urn:oasis:names:tc:opendocument:xmlns:table:1.0);\n@namespace text url(urn:oasis:names:tc:opendocument:xmlns:text:1.0);\n@namespace webodfhelper url(urn:webodf:names:helper);\n@namespace cursor url(urn:webodf:names:cursor);\n@namespace editinfo url(urn:webodf:names:editinfo);\n@namespace annotation url(urn:webodf:names:annotation);\n@namespace dc url(http://purl.org/dc/elements/1.1/);\n@namespace svgns url(http://www.w3.org/2000/svg);\n\noffice|document > *, office|document-content > * {\n  display: none;\n}\noffice|body, office|document {\n  display: inline-block;\n  position: relative;\n}\n\ntext|p, text|h {\n  display: block;\n  padding: 0;\n  margin: 0;\n  line-height: normal;\n  position: relative;\n  min-height: 1.3em; /* prevent empty paragraphs and headings from collapsing if they are empty */\n}\n*[webodfhelper|containsparagraphanchor] {\n  position: relative;\n}\ntext|s {\n    white-space: pre;\n}\ntext|tab {\n  display: inline;\n  white-space: pre;\n}\ntext|tracked-changes {\n  /*Consumers that do not support change tracking, should ignore changes.*/\n  display: none;\n}\noffice|binary-data {\n  display: none;\n}\noffice|text {\n  display: block;\n  text-align: left;\n  overflow: visible;\n  word-wrap: break-word;\n}\n\noffice|text::selection {\n  /** Let's not draw selection highlight that overflows into the office|text\n   * node when selecting content across several paragraphs\n   */\n  background: transparent;\n}\n\n.virtualSelections office|document *::selection {\n  background: transparent;\n}\n.virtualSelections office|document *::-moz-selection {\n  background: transparent;\n}\n\noffice|text * draw|text-box {\n/** only for text documents */\n    display: block;\n    border: 1px solid #d3d3d3;\n}\noffice|spreadsheet {\n  display: block;\n  border-collapse: collapse;\n  empty-cells: show;\n  font-family: sans-serif;\n  font-size: 10pt;\n  text-align: left;\n  page-break-inside: avoid;\n  overflow: hidden;\n}\noffice|presentation {\n  display: inline-block;\n  text-align: left;\n}\n#shadowContent {\n  display: inline-block;\n  text-align: left;\n}\ndraw|page {\n  display: block;\n  position: relative;\n  overflow: hidden;\n}\npresentation|notes, presentation|footer-decl, presentation|date-time-decl {\n    display: none;\n}\n@media print {\n  draw|page {\n    border: 1pt solid black;\n    page-break-inside: avoid;\n  }\n  presentation|notes {\n    /*TODO*/\n  }\n}\noffice|spreadsheet text|p {\n  border: 0px;\n  padding: 1px;\n  margin: 0px;\n}\noffice|spreadsheet table|table {\n  margin: 3px;\n}\noffice|spreadsheet table|table:after {\n  /* show sheet name the end of the sheet */\n  /*content: attr(table|name);*/ /* gives parsing error in opera */\n}\noffice|spreadsheet table|table-row {\n  counter-increment: row;\n}\noffice|spreadsheet table|table-row:before {\n  width: 3em;\n  background: #cccccc;\n  border: 1px solid black;\n  text-align: center;\n  content: counter(row);\n  display: table-cell;\n}\noffice|spreadsheet table|table-cell {\n  border: 1px solid #cccccc;\n}\ntable|table {\n  display: table;\n}\ndraw|frame table|table {\n  width: 100%;\n  height: 100%;\n  background: white;\n}\ntable|table-header-rows {\n  display: table-header-group;\n}\ntable|table-row {\n  display: table-row;\n}\ntable|table-column {\n  display: table-column;\n}\ntable|table-cell {\n  width: 0.889in;\n  display: table-cell;\n  word-break: break-all; /* prevent long words from extending out the table cell */\n}\ndraw|frame {\n  display: block;\n}\ndraw|image {\n  display: block;\n  width: 100%;\n  height: 100%;\n  top: 0px;\n  left: 0px;\n  background-repeat: no-repeat;\n  background-size: 100% 100%;\n  -moz-background-size: 100% 100%;\n}\n/* only show the first image in frame */\ndraw|frame > draw|image:nth-of-type(n+2) {\n  display: none;\n}\ntext|list:before {\n    display: none;\n    content:\"\";\n}\ntext|list {\n    counter-reset: list;\n}\ntext|list-item {\n    display: block;\n}\ntext|number {\n    display:none;\n}\n\ntext|a {\n    color: blue;\n    text-decoration: underline;\n    cursor: pointer;\n}\noffice|text[webodfhelper|links=\"inactive\"] text|a {\n    cursor: text;\n}\ntext|note-citation {\n    vertical-align: super;\n    font-size: smaller;\n}\ntext|note-body {\n    display: none;\n}\ntext|note:hover text|note-citation {\n    background: #dddddd;\n}\ntext|note:hover text|note-body {\n    display: block;\n    left:1em;\n    max-width: 80%;\n    position: absolute;\n    background: #ffffaa;\n}\nsvg|title, svg|desc {\n    display: none;\n}\nvideo {\n    width: 100%;\n    height: 100%\n}\n\n/* below set up the cursor */\ncursor|cursor {\n    display: inline;\n    width: 0;\n    height: 1em;\n    /* making the position relative enables the avatar to use\n       the cursor as reference for its absolute position */\n    position: relative;\n    z-index: 1;\n}\n\ncursor|cursor > .caret {\n    /* IMPORTANT: when changing these values ensure DEFAULT_CARET_TOP and DEFAULT_CARET_HEIGHT\n        in Caret.js remain in sync */\n    display: inline;\n    position: absolute;\n    top: 5%; /* push down the caret; 0px can do the job, 5% looks better, 10% is a bit over */\n    height: 1em;\n    border-left: 2px solid black;\n    outline: none;\n}\n\ncursor|cursor > .handle {\n    padding: 3px;\n    box-shadow: 0px 0px 5px rgba(50, 50, 50, 0.75);\n    border: none !important;\n    border-radius: 5px;\n    opacity: 0.3;\n}\n\ncursor|cursor > .handle > img {\n    border-radius: 5px;\n}\n\ncursor|cursor > .handle.active {\n    opacity: 0.8;\n}\n\ncursor|cursor > .handle:after {\n    content: ' ';\n    position: absolute;\n    width: 0px;\n    height: 0px;\n    border-style: solid;\n    border-width: 8.7px 5px 0 5px;\n    border-color: black transparent transparent transparent;\n\n    top: 100%;\n    left: 43%;\n}\n\n/** Input Method Editor input pane & behaviours */\n/* not within a cursor */\n#eventTrap {\n    height: 1px;\n    margin: auto 0;\n    display: block;\n    position: absolute;\n    left: -10000px;\n    width: 1px;\n    outline: none;\n}\n\n/* within a cursor */\ncursor|cursor > #eventTrap {\n    display: inline-block;\n    position: static;\n    left: 0;\n    margin-right: -1px; /* Hide the content editable's own caret */\n    color: rgba(255, 255, 255, 0); /** additionally hide the blinking caret by setting the colour to fully transparent */\n    overflow: hidden; /* The overflow visibility is used to hide and show characters being entered */\n    height: 1px;\n    width: 1px; /* marginRight + width must equal 0 so chrome & FF don't think the element takes up space */\n}\n\ncursor|cursor[cursor|composing=\"true\"] > #eventTrap {\n    color: inherit; /* make colour non-transparent again to show the entered text */\n    overflow: visible; /* The overflow visibility is used to hide and show characters being entered */\n    height: auto;\n    width: auto;\n}\n\ncursor|cursor[cursor|composing=\"true\"] {\n    display: inline-block;\n    width: auto;\n    height: inherit;\n}\n\ncursor|cursor[cursor|composing=\"true\"] > .caret {\n    /* during composition, the caret should be pushed along by the composition text, inline with the text */\n    position: static;\n    /* as it is now part of an inline-block, it will no longer need correct to top or height values to align properly */\n    height: auto !important;\n    top: auto !important;\n}\n\n.editInfoMarker {\n    position: absolute;\n    width: 10px;\n    height: 100%;\n    left: -20px;\n    opacity: 0.8;\n    top: 0;\n    border-radius: 5px;\n    background-color: transparent;\n    box-shadow: 0px 0px 5px rgba(50, 50, 50, 0.75);\n}\n.editInfoMarker:hover {\n    box-shadow: 0px 0px 8px rgba(0, 0, 0, 1);\n}\n\n.editInfoHandle {\n    position: absolute;\n    background-color: black;\n    padding: 5px;\n    border-radius: 5px;\n    opacity: 0.8;\n    box-shadow: 0px 0px 5px rgba(50, 50, 50, 0.75);\n    bottom: 100%;\n    margin-bottom: 10px;\n    z-index: 3;\n    left: -25px;\n}\n.editInfoHandle:after {\n    content: ' ';\n    position: absolute;\n    width: 0px;\n    height: 0px;\n    border-style: solid;\n    border-width: 8.7px 5px 0 5px;\n    border-color: black transparent transparent transparent;\n\n    top: 100%;\n    left: 5px;\n}\n.editInfo {\n    font-family: sans-serif;\n    font-weight: normal;\n    font-style: normal;\n    text-decoration: none;\n    color: white;\n    width: 100%;\n    height: 12pt;\n}\n.editInfoColor {\n    float: left;\n    width: 10pt;\n    height: 10pt;\n    border: 1px solid white;\n}\n.editInfoAuthor {\n    float: left;\n    margin-left: 5pt;\n    font-size: 10pt;\n    text-align: left;\n    height: 12pt;\n    line-height: 12pt;\n}\n.editInfoTime {\n    float: right;\n    margin-left: 30pt;\n    font-size: 8pt;\n    font-style: italic;\n    color: yellow;\n    height: 12pt;\n    line-height: 12pt;\n}\n\n.annotationWrapper {\n    display: inline;\n    position: relative;\n}\n\n.annotationRemoveButton:before {\n    content: '\u00d7';\n    color: white;\n    padding: 5px;\n    line-height: 1em;\n}\n\n.annotationRemoveButton {\n    width: 20px;\n    height: 20px;\n    border-radius: 10px;\n    background-color: black;\n    box-shadow: 0px 0px 5px rgba(50, 50, 50, 0.75);\n    position: absolute;\n    top: -10px;\n    left: -10px;\n    z-index: 3;\n    text-align: center;\n    font-family: sans-serif;\n    font-style: normal;\n    font-weight: normal;\n    text-decoration: none;\n    font-size: 15px;\n}\n.annotationRemoveButton:hover {\n    cursor: pointer;\n    box-shadow: 0px 0px 5px rgba(0, 0, 0, 1);\n}\n\n.annotationNote {\n    width: 4cm;\n    position: absolute;\n    display: inline;\n    z-index: 10;\n}\n.annotationNote > office|annotation {\n    display: block;\n    text-align: left;\n}\n\n.annotationConnector {\n    position: absolute;\n    display: inline;\n    z-index: 2;\n    border-top: 1px dashed brown;\n}\n.annotationConnector.angular {\n    -moz-transform-origin: left top;\n    -webkit-transform-origin: left top;\n    -ms-transform-origin: left top;\n    transform-origin: left top;\n}\n.annotationConnector.horizontal {\n    left: 0;\n}\n.annotationConnector.horizontal:before {\n    content: '';\n    display: inline;\n    position: absolute;\n    width: 0px;\n    height: 0px;\n    border-style: solid;\n    border-width: 8.7px 5px 0 5px;\n    border-color: brown transparent transparent transparent;\n    top: -1px;\n    left: -5px;\n}\n\noffice|annotation {\n    width: 100%;\n    height: 100%;\n    display: none;\n    background: rgb(198, 238, 184);\n    background: -moz-linear-gradient(90deg, rgb(198, 238, 184) 30%, rgb(180, 196, 159) 100%);\n    background: -webkit-linear-gradient(90deg, rgb(198, 238, 184) 30%, rgb(180, 196, 159) 100%);\n    background: -o-linear-gradient(90deg, rgb(198, 238, 184) 30%, rgb(180, 196, 159) 100%);\n    background: -ms-linear-gradient(90deg, rgb(198, 238, 184) 30%, rgb(180, 196, 159) 100%);\n    background: linear-gradient(180deg, rgb(198, 238, 184) 30%, rgb(180, 196, 159) 100%);\n    box-shadow: 0 3px 4px -3px #ccc;\n}\n\noffice|annotation > dc|creator {\n    display: block;\n    font-size: 10pt;\n    font-weight: normal;\n    font-style: normal;\n    font-family: sans-serif;\n    color: white;\n    background-color: brown;\n    padding: 4px;\n}\noffice|annotation > dc|date {\n    display: block;\n    font-size: 10pt;\n    font-weight: normal;\n    font-style: normal;\n    font-family: sans-serif;\n    border: 4px solid transparent;\n}\noffice|annotation > text|list {\n    display: block;\n    padding: 5px;\n}\n\n/* This is very temporary CSS. This must go once\n * we start bundling webodf-default ODF styles for annotations.\n */\noffice|annotation text|p {\n    font-size: 10pt;\n    color: black;\n    font-weight: normal;\n    font-style: normal;\n    text-decoration: none;\n    font-family: sans-serif;\n}\n\ndc|*::selection {\n    background: transparent;\n}\ndc|*::-moz-selection {\n    background: transparent;\n}\n\n#annotationsPane {\n    background-color: #EAEAEA;\n    width: 4cm;\n    height: 100%;\n    display: none;\n    position: absolute;\n    outline: 1px solid #ccc;\n}\n\n.annotationHighlight {\n    background-color: yellow;\n    position: relative;\n}\n\n.selectionOverlay {\n    position: absolute;\n    pointer-events: none;\n    top: 0;\n    left: 0;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    z-index: 15;\n}\n.selectionOverlay > polygon {\n    fill-opacity: 0.3;\n    stroke-opacity: 0.8;\n    stroke-width: 1;\n    fill-rule: evenodd;\n}\n\n#imageSelector {\n    display: none;\n    position: absolute;\n    border-style: solid;\n    border-color: black;\n}\n\n#imageSelector > div {\n    width: 5px;\n    height: 5px;\n    display: block;\n    position: absolute;\n    border: 1px solid black;\n    background-color: #ffffff;\n}\n\n#imageSelector > .topLeft {\n    top: -4px;\n    left: -4px;\n}\n\n#imageSelector > .topRight {\n    top: -4px;\n    right: -4px;\n}\n\n#imageSelector > .bottomRight {\n    right: -4px;\n    bottom: -4px;\n}\n\n#imageSelector > .bottomLeft {\n    bottom: -4px;\n    left: -4px;\n}\n\n#imageSelector > .topMiddle {\n    top: -4px;\n    left: 50%;\n    margin-left: -2.5px; /* half of the width defined in #imageSelector > div */\n}\n\n#imageSelector > .rightMiddle {\n    top: 50%;\n    right: -4px;\n    margin-top: -2.5px; /* half of the height defined in #imageSelector > div */\n}\n\n#imageSelector > .bottomMiddle {\n    bottom: -4px;\n    left: 50%;\n    margin-left: -2.5px; /* half of the width defined in #imageSelector > div */\n}\n\n#imageSelector > .leftMiddle {\n    top: 50%;\n    left: -4px;\n    margin-top: -2.5px; /* half of the height defined in #imageSelector > div */\n}\n";
