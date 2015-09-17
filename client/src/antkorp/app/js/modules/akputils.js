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

define(
		"akputils",
		[ "jquery" ],
		function($) {

			var timeZonesList = {
				"-5:30" : "[GMT+05:30] India Standard Time - Kolkata"
			}

			var utils = function() {
				this._data = {};
				this.get = function(prop) {
					if (prop)
						return this._data[prop];
				};
				this.set = function(prop, val) {
					this._data[prop] = val;
				}
			}
			utils.prototype.inBox = function(el, points, container) {

				var cw = $(container).width();
				var ch = $(container).height();
				var cp = $(container).position();

				var ew = $(el).width();
				var eh = $(el).height();

				var at = points.top, al = points.left;

				if (ch + cp.top < eh + points.top) {
					at = points.top - eh;
				}

				if (cw + cp.left < ew + points.left) {
					al = points.left - ew;
				}

				$(el).css({
					top : at,
					left : al
				})
			}
			utils.prototype.linkify = function(text) {
				var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
				return text.replace(urlRegex, function(url) {
					return '<a href="' + url + '" target="_blank">' + url + '</a>';
				})
			}
			
			
			utils.prototype.isURL = function(str) {
				var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain
				// name
				'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
				'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
				
				if (!pattern.test(str)) {
					return false;
				} else {
					return true;
				}
			}
			utils.prototype.youtubeURL = function(url) {
				var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
				return (url.match(p)) ? RegExp.$1 : false;
			}
			utils.prototype.makeCenter = function(id) {
				var w = $(id).width();
				var h = $(id).height();

				var nw = -w / 2;
				var nh = -h / 2;

				$(id).css({
					"top" : "50%",
					"left" : "50%",
					"margin-left" : nw + "px",
					"margin-top" : nh + "px"
				});
			}

			utils.prototype.mime2class = function(a) {
				var b = "akorp-mime-";
				var newmime = b + a.replace(/(\.|\+|\/)/g, "-");
				return a = a.split("/"), b
						+ a[0]
						+ (a[0] != "image" && a[1] ? " " + b
								+ a[1].replace(/(\.|\+)/g, "-") + " " + b
								+ a[0] + "-" + a[1].replace(/(\.|\+\-)/g, "")
								: "");

			}
			utils.prototype.convBytes = function(bytes, precision) {
				var kilobyte = 1024;
				var megabyte = kilobyte * 1024;
				var gigabyte = megabyte * 1024;
				var terabyte = gigabyte * 1024;

				if ((bytes >= 0) && (bytes < kilobyte)) {
					return bytes + ' B';

				} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
					return (bytes / kilobyte).toFixed(precision) + ' KB';

				} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
					return (bytes / megabyte).toFixed(precision) + ' MB';

				} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
					return (bytes / gigabyte).toFixed(precision) + ' GB';

				} else if (bytes >= terabyte) {
					return (bytes / terabyte).toFixed(precision) + ' TB';

				} else {
					return bytes + ' B';
				}
			}
			utils.prototype.min2hours = function(mins) {
				var hrs = Math.round(mins / 60);
				var rem = Math.abs(mins % 60);

				var str = new String();
				str = hrs + ":" + rem
				return timeZonesList[str];
			}
			utils.prototype.htmlEscape = function(str) {
				return String(str).replace(/&/g, '&amp;').replace(/"/g,
						'&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
						.replace(/>/g, '&gt;');
			}

			utils.prototype.htmlUnescape = function(value) {
				return String(value).replace(/&quot;/g, '"').replace(/&#39;/g,
						"'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
						.replace(/&amp;/g, '&');
			}
			utils.prototype.array2string = function(array) {
				var str = "";

				var length = array.length;
				if (!length)
					return str;

				for ( var i = 0; i < length; i++) {
					str += array[i] + ",";
				}

				return str;
			}
			utils.prototype.str2Data = function(str) {
				if (!str)
					return;

				var queries = str.substr(1, str.length).split("&");
				var data = {};
				for ( var i = 0; i < queries.length; i++) {
					var attr = queries[i];
					var property = attr.split("=")[0];
					var value = attr.split("=")[1];
					data[property] = value;
				}
				return data;

			}
			utils.prototype.SHA1 = function(msg) {

				function rotl(n, s) {
					return n << s | n >>> 32 - s;
				}
				;
				function tohex(i) {
					for ( var h = "", s = 28;; s -= 4) {
						h += (i >>> s & 0xf).toString(16);
						if (!s)
							return h;
					}
				}
				;
				var H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0, M = 0x0ffffffff;
				var i, t, W = new Array(80), ml = msg.length, wa = new Array();
				msg += fcc(0x80);
				while (msg.length % 4)
					msg += fcc(0);
				for (i = 0; i < msg.length; i += 4)
					wa.push(msg.cca(i) << 24 | msg.cca(i + 1) << 16
							| msg.cca(i + 2) << 8 | msg.cca(i + 3));
				while (wa.length % 16 != 14)
					wa.push(0);
				wa.push(ml >>> 29), wa.push((ml << 3) & M);
				for ( var bo = 0; bo < wa.length; bo += 16) {
					for (i = 0; i < 16; i++)
						W[i] = wa[bo + i];
					for (i = 16; i <= 79; i++)
						W[i] = rotl(
								W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
					var A = H0, B = H1, C = H2, D = H3, E = H4;
					for (i = 0; i <= 19; i++)
								t = (rotl(A, 5) + (B & C | ~B & D) + E + W[i] + 0x5A827999)
										& M, E = D, D = C, C = rotl(B, 30),
								B = A, A = t;
					for (i = 20; i <= 39; i++)
						t = (rotl(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1)
								& M, E = D, D = C, C = rotl(B, 30), B = A,
								A = t;
					for (i = 40; i <= 59; i++)
								t = (rotl(A, 5) + (B & C | B & D | C & D) + E
										+ W[i] + 0x8F1BBCDC)
										& M, E = D, D = C, C = rotl(B, 30),
								B = A, A = t;
					for (i = 60; i <= 79; i++)
						t = (rotl(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6)
								& M, E = D, D = C, C = rotl(B, 30), B = A,
								A = t;
					H0 = H0 + A & M;
					H1 = H1 + B & M;
					H2 = H2 + C & M;
					H3 = H3 + D & M;
					H4 = H4 + E & M;
				}
				return tohex(H0) + tohex(H1) + tohex(H2) + tohex(H3)
						+ tohex(H4);

			}

			return new utils;

		});
