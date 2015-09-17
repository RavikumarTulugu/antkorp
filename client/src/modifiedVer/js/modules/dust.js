	var EventShowView = Backbone.View.extend({
						className : "showCalEvent",
						initialize : function() {

						},
						render : function() {

						},
						getEventPeriod : function() {

							var prstdate = $.fullCalendar.formatDate(
									calevent.start, "yyyy-MM-dd");
							var lastdate = $.fullCalendar.formatDate(
									calevent.end, "yyyy-MM-dd");

							if (calevent.allDay) {
								date = $("<p/>").append("Date : " + prstdate);
								if (new Date(prstdate) - new Date(lastdate)) {
									enddate = $("<p/>").append(
											"To : " + lastdate);
								}
							} else {
								hrfrom = $("<p> "+ $.fullCalendar.formatDate(calevent.start, 'hh:mm TT')	+ " - "	+ $.fullCalendar.formatDate(calevent.end, 'hh:mm TT')+ " </p> ");
								date = $("<p> Date : " + prstdate + "</p>");
							}
						},
						setInitialPosition : function() {
							// top : jsevent.pageY - $(this).height(),
							// left : jsevent.pageX - $(this).width()},
						setPosition : function() {
							var l = $("#fcal").offset().left, t = $("#fcal")
									.offset().top, w = $("#fcal").width(), h = $(
									"#fcal").height();

							if (eventshw.offset().left + eventshw.width() > l
									+ w) {
								eventshw.css({
									right : l + w + eventshw.width() / 2
											- jsevent.pageX,
									left : "auto",
								});
							}

							if (eventshw.offset().top + eventshw.height() > t
									+ h) {
								$(".showCalEvent").css(
										{
											bottom : t + h + eventshw.height()
													/ 2 - jsevent.pageY,
											top : "auto",
										});
							}

							if (eventshw.offset().left < l) {
								eventshw.css({

									left : 0,
								});
							}
							if (eventshw.offset().top < t) {
								eventshw.css({

									top : 0,
								});
							}
						}
					})








 function handleCalEventSelect(start, end, allDay) {
 $('.showCalEvent').remove(); var view = calendar.fullCalendar("getView"); var
 obj = { start : start, end : end, allDay : allDay, }
 
  createNewEvent(view, obj, false); }
  
  function handleCalWindowResize(view) { $('#fcal').fullCalendar('option',
  'height', $("#fcal").height()); }
  
  function handleViewChange(view) { $(".fcview .calheader
  span.fctitle").html(view.title); }
  
  function showEvent(calevent, jsevent, view) { $('.showCalEvent').remove();
  
  var clsbtn = $("<span class=closeIcon ></span>").bind("click", function() {
  $('.showCalEvent').remove(); }) var closebtn = $("<p/>").append(clsbtn).css({
  "min-height" : "0px", margin : 0 });
  
  var title = $("<p/>").append(calevent.title).css({ "color" : "#29D3B8",
  "font-size" : "15px" });
  
  var date, enddate, hrfrom, editbtn, dltbtn, btnbox, elevent =
  $(this).offset();
  
  if (calevent.description) { var note = $("<p/>").append(calevent.description).css({
  'font-size' : "10px", "color" : "#ccc" }); }
  
  
  
  editbtn = $("<button/>").append("Edit").addClass("btn").bind("click",
  function(e) { createNewEvent(view, calevent, true);
  $('.showCalEvent').remove(); }); dltbtn = $("<button/>").append("Remove").addClass("btn
  redbtn").bind("click", function(e) {
  
  calendar.fullCalendar('removeEvents', calevent.id)
  $('.showCalEvent').remove(); }); btnbox = $("<p/>").addClass("").append(editbtn).append(dltbtn);
  
  var eventshw = $("<div/>").addClass("showCalEvent").appendTo(".cal_view").append(closebtn).append(title).append(note).append(hrfrom).append(date).append(enddate).css({
  
  }).append(btnbox);
  
  
   }
 

  function createNewEvent(opt, obj, update) { $('.newCalEvent').remove();
  
  var prstdate = $.fullCalendar.formatDate(obj.start, "yyyy-MM-dd"); var
  lastdate = $.fullCalendar.formatDate(obj.end, "yyyy-MM-dd"); var hrfrom,
  mont, date, enddate;
  
  var evnt = $("<p/>").attr({ 'contenteditable' : "true", "plaintext-only" :
  "true" }).addClass("eventname"); if (obj.title) { evnt.append(obj.title); }
  var note = $("<p><label>note:</label><div class='eventnote'
  contenteditable=true plaintext-only ></div></p>");
  
  if (obj.allDay) {
  
  date = $("<p><label>Date:</label><input class='evtdate' type=Date
  value='" + prstdate + "' ></p>"); if (new Date(prstdate) - new
  Date(lastdate)) {
  
  enddate = $("<p><label>To :</label><input class='evtdate' type=Date
  value='" + lastdate + "' ></p>"); } } else { hrfrom = $("<p>From : " +
  $.fullCalendar.formatDate(obj.start, "hh:mm TT") + " <br/> To : " +
  $.fullCalendar.formatDate(obj.end, "hh:mm TT") + " </p> "); date = $("<p><label>Date:</label><input
  class='evtdate' type=Date value='" + prstdate + "' ></p>"); } if (!new
  Date(prstdate) - new Date(lastdate)) { var repeat = $("<p><label>Repeat:</label><select
  id=evtrepeat name=repeat ><option>Every Day</option><option>Every week</option><option>Every
  Month</option></select></p>") } var apptype = $("<p><label>Appointment:</label><select
  id=evttype name=evttype ><option>Meeting</option><option>Reminder</option></select></p>");
  
  var crtbtn = $("<button/>").append("Save").addClass("btn").bind('click',
  function() { var evtform =
  $(this).parent().parent(".newCalEvent").children("p"); var title =
  $(this).parent().parent(".newCalEvent").children(".eventname").text(); var
  className = evtform.children("select[name=evttype]").val(); var note =
  $(this).parent().parent(".newCalEvent").children(".eventnote").text(); var
  guid = createUUID(); if (title) { if (!update) {
  
  calendar.fullCalendar('renderEvent', { title : title, start : obj.start, end :
  obj.end, allDay : obj.allDay, className : className, description : note, id :
  guid, }, true // make the event "stick" );
   } else { calendar.fullCalendar('updateEvent', obj); } }
  
  $('.newCalEvent').remove(); }); var cnlbtn = $("<button/>").append("Cancel").addClass("btn
  redbtn").bind('click', function() { $('.newCalEvent').remove(); }); var
  btnbox = $("<p/>").append(crtbtn).append(cnlbtn); $("<div/>").addClass("newCalEvent").appendTo(".cal_view").append(evnt).append(hrfrom).append(date).append(enddate).append(apptype).append(repeat).append(note).append(btnbox);
   }
 


  
  $(".cal_view").attr("data-repdate",
  today.toDateString()).children(".caldata").hide().end().children(".fcview").show("fast",
  function() { var dispCal = setTimeout(function() {
  $("#fcal").fullCalendar('today'); $('#fcal').fullCalendar('option', 'height',
  $("#fcal").height()); }, 5000); });
  
  $(".yearview .calheader span.prevyear").bind('click', yearChange);
  $(".yearview .calheader span.nextyear").bind('click', yearChange);
  
  $(".fcview .calheader span.prevfc").bind('click', function() {
  $("#fcal").fullCalendar('prev'); }); $(".fcview .calheader
  span.nextfc").bind('click', function() { $("#fcal").fullCalendar('next'); });
  
  $("li.yeartype").bind('click', function() {
  $(this).siblings("li").removeClass("calviewtypeselect").end().addClass("calviewtypeselect");
  $(".cal_view").children(".caldata").hide();
  $(".cal_view").children(".yearview").show(); yearChange();
   }) $("li.monthtype").bind('click', function() {
  $(this).siblings("li").removeClass("calviewtypeselect").end().addClass("calviewtypeselect");
  $(".cal_view").children(".caldata").hide();
  $(".cal_view").children(".fcview").show();
  
  var gotodate = calendar.fullCalendar("getDate")
  calendar.fullCalendar('gotoDate', gotodate);
  
  $("#fcal").fullCalendar("changeView", "month");
  
  var view = calendar.fullCalendar("getView"); $(".fcview .calheader
  span.fctitle").html(view.title); }) $("li.daytype").bind('click', function() {
  $(this).siblings("li").removeClass("calviewtypeselect").end().addClass("calviewtypeselect");
  $(".cal_view").children(".caldata").hide();
  $(".cal_view").children(".fcview").show();
  
  $("#fcal").fullCalendar("changeView", "agendaDay");
  
  var view = calendar.fullCalendar("getView"); $(".fcview .calheader
  span.fctitle").html(view.title);
   })
  
  $(".currentyear , .day").live('click', function() { $(".currentyear ,
  .day").removeClass("calselected"); $(this).addClass("calselected"); });
  
  function yearChange(e) { if (e) { $(this).attr("data-inc") == "true" ?
  calendar.fullCalendar('nextYear') : calendar.fullCalendar('prevYear'); } var
  date = calendar.fullCalendar('getDate'); $(".yearview .calheader
  .curyear").html(date.getFullYear()); $(".cal_view").attr("data-repdate",
  date);
   }
  
  yearChange();
  
  
  
  
  
 // code removed from index.html feb 14
  
  
  <!--
	<div class="profile_part">

	<p>
	<span class='label'>First Name:</span><span class="uinfo prfl_fname textinput">firstname</span>
	</p>
	<p>
	<span class='label'>Middle Name:</span><span class="uinfo prfl_mname textinput">middlename</span>
	</p>
	<p>
	<span class='label'>Last Name:</span><span class="uinfo prfl_lname textinput">lastname</span>
	</p>
	<p>
	<span class='label'> Sex:</span><span class="uinfo prfl_sex">gender</span>
	</p>
	<p>
	<span class='label'>DOB:</span><span class="uinfo prfl_dob">dateofbirth</span>
	</p>

	<p>
	<span class='label'>Mobile No:</span><span class="uinfo prfl_mobile">mobileno</span>
	</p>
	<p>
	<span class='label'>Home Address:</span><span class="uinfo prfl_haddr textblock">homeaddress</span>
	</p>
	</div>
	<div class="profile_part">
	<p>
	<span class='label'>Designation:</span><span class="uinfo prfl_designation textinput">designation</span>
	</p>
	<p>
	<span class='label'>Department:</span><span class="uinfo prfl_dept textinput">department</span>
	</p>
	<p>
	<span class='label'>Company Name:</span><span class="uinfo prfl_comp textinput">comppanyname</span>
	</p>

	</div>
	<div class="profile_part">

	<div class="profile_pic">
	<div class="picInner">
	<img id="usrpic"   src="css/images/stock_people.png" class="userPic" width="200" height="230"/>
	<div id='changePic'>
	Change Photo
	</div>
	</div>
	</div>
	</div>-->
  
  
  
  
  
  
  
  
  
  getFile:function(data){
	  var mimeclass = this.mime2class(data.type);
	  var sizeBytes=this.convBytes(data.size,2);
		data["mime"] = data.isdir == 'true' ? "akorp-mime-directory" : mimeclass;
		data["size"]=sizeBytes;
		return $("#attachment-template").tmpl([data]);
  },
  mime2class : function(a) {
		var b = "akorp-mime-";
		var newmime = b + a.replace(/(\.|\+|\/)/g, "-");
		return a = a.split("/"), b + a[0] + (a[0] != "image" && a[1] ? " " + b + a[1].replace(/(\.|\+)/g, "-") + " " + b + a[0] + "-" + a[1].replace(/(\.|\+\-)/g, "") : "");

	},convBytes : function(bytes, precision) {
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
	},
	
	
	
	
	
	
	 /*
	 * function
	 * appLoad(percentage,
	 * apploadstatus) {
	 * appload.children(".apploadbar").children(
	 * ".loadpercentage").css({
	 * "width" :
	 * percentage +
	 * "%" })
	 * appload.children(".apploadstatus").html(apploadstatus)
	 * if
	 * (percentage ==
	 * 100) {
	 * var
	 * appEnd =
	 * setTimeout(function() {
	 * $("#logOverlay,
	 * #loadbar").hide();
	 * $(".akorp-ui").show();
	 * $('#menu').find('li[data-tabId="planner"]')
	 * .click(); },
	 * 1000); } }
	 * 
	 * 
	 * function
	 * makeCenterDiv(id) {
	 * 
	 * var
	 * w =
	 * $(id).width();
	 * var
	 * h =
	 * $(id).height();
	 * 
	 * var
	 * nw =
	 * -w /
	 * 2;
	 * var
	 * nh =
	 * -h /
	 * 2;
	 * 
	 * $(id).css({
	 * "top" :
	 * "50%",
	 * "left" :
	 * "50%",
	 * "margin-left" :
	 * nw +
	 * "px",
	 * "margin-top" :
	 * nh +
	 * "px"
	 * }); } /*
	 * Tour
	 * cards
	 */

/*
* var firstVisit = { "container" : true, "dstore" :
* true, "kons" : true, "planner" : true, "pinit" :
* true, "men" : true, "pdt" : true };
* 
* /*$('#menu li').click( function() {
* $(this).siblings('li').removeClass('active')
* .end().addClass('active'); var tabId =
* $(this).data("tabid");
* $(".content").children().hide().end().children(
* '#' + tabId).show(); // console.log(tabId);
* 
* $(".card").hide(); $(".tourcard").hide(); if
* (firstVisit[tabId]) { // firstVisit[tabId] =
* false;
* 
* if (tabId == "container") { $(".tourcard").css({
* "top" : "10%", "left" : "30%" }).show();
* $(".card1").show("scale"); } else if (tabId ==
* "dstore") { $(".tourcard").css({ "top" : "50%",
* "left" : "60%" }).show();
* $(".card4").show("scale"); } else if (tabId ==
* "kons") { $(".tourcard").css({ "top" : "20%",
* "left" : "40%" }).show();
* $(".card2").show("scale"); } else if (tabId ==
* "planner") { $(".tourcard").css({ "top" : "50%",
* "left" : "20%" }).show();
* $(".card5").show("scale"); } else if (tabId ==
* "pinit") { $(".tourcard").css({ "top" : "40%",
* "left" : "60%" }).show();
* $(".card6").show("scale"); } }
* 
* });
*/

/*
* $("span.tourclsbtn").bind("click", function() {
* var id = $(".card:visible").data("cardid");
* firstVisit[id] = false;
* 
* $(".card").hide(); $(".tourcard").hide();
* 
* }); /*
* 
* feedback
* 
* 
* $('.feedback').bind('click', function() { $("<div/>").append("<p>Thank
* you for visiting us.</p><textarea rows=9
* cols=30></textarea>").css({ "font-size" :
* "15px", }).attr({ 'title' : "Feedback"
* }).dialog({ height : 300, width : 350, modal :
* true, buttons : { "Send" : function(e) { var cmnt =
* $(this).children("textarea").val(); if (cmnt) {
* var feedback = { id : loginuserid, name :
* usersList[loginuserid].first_name, email :
* usersList[loginuserid].email, stmt : cmnt, }
* $.ajax({ url : "feedback.php", type : "post",
* data : { userFeedback : JSON.stringify(feedback) },
* 
* success : function(response, textStatus, jqXHR) {
* 
* console.log("feedback recorded successfully " +
* response.message) },
* 
* error : function(jqXHR, textStatus, errorThrown) {
* 
* console.log("The following error occured while
* recording feedback : " + textStatus,
* errorThrown); },
* 
* complete : function() { // enable the inputs
* //console.log("user authentication successful.") }
* }); }
* 
* $(this).dialog("close").remove(); }, "cancel" :
* function() { $(this).dialog("close").remove(); } } }) })
* 
* $('body').bind({ 'unload' : function() {
* 
* worker.terminate(); Dworker.terminate();
* localStorage.clear(); window.requestFileSystem =
* window.requestFileSystem ||
* window.webkitRequestFileSystem; var fs = null;
* 
* window.requestFileSystem(window.TEMPORARY, 1024 *
* 1024, function(filesystem) { fs = filesystem; },
* errorHandler);
* 
* var dirReader = fs.root.createReader();
* dirReader.readEntries(function(entries) { for
* (var i = 0, entry; entry = entries[i]; ++i) { if
* (entry.isDirectory) {
* entry.removeRecursively(function() { },
* errorHandler); } else { entry.remove(function() { },
* errorHandler); } } }); } });
*/
	
	
	
	
	/*
	 * akp.prototype.send = function(obj) { //
	 * console.log(obj); // console.log(clientid); var
	 * service = obj.service; delete obj.service; delete
	 * obj.clientid;
	 * 
	 * if (this.services[service]) { var jsonstring =
	 * JSON.stringify(obj); var sendBuffer = new
	 * ArrayBuffer( jsonstring.length + 4 + 12); var dv =
	 * new DataView(sendBuffer);
	 * 
	 * dv.setInt32(0, clientid);
	 * 
	 * if (service.length < 12) { for ( var i = 0; i <
	 * (12 - service.length); i++) { service += ' '; }
	 * }// fill space for missing chars for ( var i = 0;
	 * i < service.length; i++) { dv.setUint8(i + 4,
	 * service.charCodeAt(i)); } for ( var i = 0; i <
	 * jsonstring.length; i++) { dv.setUint8(i + 16,
	 * jsonstring.charCodeAt(i)); }
	 * this.ws.send(sendBuffer);
	 * 
	 * return; } else { noty({ layout : 'bottomRight',
	 * theme : 'default', type : 'error', text : 'we are
	 * sorry, one of our services is down at this
	 * moment.', timeout : 5000 }); } } /*var
	 * recieveMessage = function(e) {
	 * 
	 * var recvBuffer = e.data; var dv = new
	 * DataView(recvBuffer); clientid = dv.getInt32(0,
	 * false);
	 * 
	 * var service = new String(); for ( var i = 4; i <
	 * 16; i++) { service +=
	 * String.fromCharCode(dv.getUint8(i)); } var
	 * jsonstr = ""; for ( var i = 16; i <
	 * e.data.byteLength; i++) { jsonstr +=
	 * String.fromCharCode(dv.getUint8(i)); } // var obj =
	 * eval('(' + jsonstr.toString() + ')'); var obj;
	 * 
	 * try { obj = JSON.parse(jsonstr.toString());
	 * 
	 * service = service.toString().replace(
	 * /[\x00-\x1F\x80-\xFF]/g, ""); obj.service =
	 * service.substring(0, service .indexOf(' ')) ||
	 * service;
	 * 
	 * obj.clientid = clientid; } catch (e) {
	 * 
	 * console.log("Invalid JSON String");
	 * console.log(e); console.log(jsonstr); return
	 * false; } // JSON.parse(jsonstr.toString());
	 * 
	 * return obj; }* akp.prototype.handleMessage =
	 * function(e) { //var recvd = recieveMessage(e);
	 * 
	 * var recvd=e;
	 * 
	 * if (!recvd) return;
	 * 
	 * if (clientidrecvd) { clientid = recvd.clientid;
	 * clientidrecvd = false; if (!akpauth.loginstatus) {
	 * akpauth.loginuser(fbusername); appLoad(100,
	 * "logging in user..."); } } else if
	 * (recvd.service) {
	 * 
	 * var serv = $.trim(recvd.service);
	 * 
	 * switch (serv) { case 'fmgr': vault.add(recvd);
	 * break; case 'dstore': dstore.add(recvd); //
	 * handleDstoreMessage(recvd); break; case 'kons':
	 * new kons(recvd); // handleKonsMessage(recvd);
	 * break; case 'rtc': rtc.send(recvd); break; case
	 * 'auth': akpauth.handleMessage(recvd); break; case
	 * 'ngw': this.handleServiceStatus(recvd); break;
	 * default: // if no service is specified then print
	 * it in // console log. console.log("Service not
	 * recognised:"); console.log(recvd); } } }
	 */
	
	
	
	
	
	
	/*
	 * this.services = { fmgr : true, dstore : true,
	 * kons : true, rtc : true, auth : true, ngw :
	 * true }
	 * 
	 * this.ws = new
	 * WebSocket("ws://www.antkorp.in:443");
	 * this.ws.binaryType = 'arraybuffer';
	 * this.ws.onopen = this.conOpen;
	 * this.ws.onerror = this.conError;
	 * this.ws.onclose = this.conClose;
	 * this.ws.onmessage = this.handleMessage;
	 * this.vaultdir = null; }
	 * akp.prototype.conError = function(e) {
	 * alert('ws Error Message:' + e.message); }
	 * 
	 * akp.prototype.conOpen = function(e) {
	 * 
	 * $('span#home').parent('li').addClass('node_active');
	 * 
	 * noty({ layout : 'bottomRight', theme :
	 * 'default', type : 'success', text : 'Welcome
	 * to antkorp!', timeout : 2000 }); }
	 * akp.prototype.conClose = function(e) {
	 * 
	 * var noty1 = noty({ type : 'error', text :
	 * 'Unable to connect to the server temporarily.
	 * Please try after some time!', timeout : 3000
	 * });
	 * 
	 * $("body").hide();
	 * 
	 * alert('Unable to connect to the server
	 * temporarily. Please try after some time!');
	 */
	
	
	
	
	
	
	
	
	/*
	 * var recvBuffer = buffer; var dv = new
	 * DataView(recvBuffer); var clientid =
	 * dv.getInt32(0, false);
	 * 
	 * var service = new String(); for ( var i = 4;
	 * i < 16; i++) { service +=
	 * String.fromCharCode(dv .getUint8(i)); } var
	 * jsonstr = ""; for ( var i = 16; i <
	 * buffer.byteLength; i++) { jsonstr +=
	 * String.fromCharCode(dv .getUint8(i)); }
	 * 
	 * var obj;
	 * 
	 * try { obj = JSON.parse(jsonstr.toString()); }
	 * catch (e) { obj = eval('(' +
	 * jsonstr.toString() + ')'); }
	 * 
	 * service = service.toString().replace(
	 * /[\x00-\x1F\x80-\xFF]/g, ""); obj.service =
	 * service.substring(0, service .indexOf(' ')) ||
	 * service;
	 * 
	 * obj.clientid = clientid; return obj;
	 */
	
	
	
	
	/*
	 * var jsonstring = JSON.stringify(obj); var
	 * sendBuffer = new ArrayBuffer(
	 * jsonstring.length + 4 + 12); var dv = new
	 * DataView(sendBuffer);
	 * 
	 * dv.setInt32(0, this.clientid);
	 * 
	 * if (service.length < 12) { for ( var i = 0; i <
	 * (12 - service.length); i++) { service += ' '; }
	 * }// fill space for missing chars for ( var i =
	 * 0; i < service.length; i++) { dv.setUint8(i +
	 * 4, service.charCodeAt(i)); } for ( var i = 0;
	 * i < jsonstring.length; i++) { dv.setUint8(i +
	 * 16, jsonstring .charCodeAt(i)); }
	 * 
	 */
	
	
	
	------------------------------------------------------------------------------------------------------------------------------------
	
	
	
	
	/*
	 * Facebook login system
	 */

	var fbusername;

	var asi = $("<span/>").append("antkorp").addClass(
			"asi");
	/*
	 * var fr = $( '<div id="logboard" class=" modal
	 * loginsts"></div>')
	 * .append(asi).appendTo("body");
	 */
	var entryform = $(
			"<form><input type=text placeholder='Enter your Name' /><input type=submit value='sign In' class=btn /></form>")
			.submit(openApp);
	var loginform = $("<div/>").append(entryform)
			.addClass("loginform")// .appendTo(fr);
	//

	function openApp(e) {
		// e.preventDefault();
		$("#logOverlay,#logboard").hide();
		$(".akorp-ui").show();
	}

	var fbbtn = $("<button/>")
			.append(
					"<iclass='facebook_24'></i><span> Connect with facebook</span>")
			.addClass("facebook").bind('click',
					facebookLogin).css("display","none");

	var fr = $(
			'<div id="logboard" class=" modal loginsts"></div>')
			.append(asi).append(
					'<div id="fb-root"></div>').append(
					fbbtn).appendTo("body");

	utils.makeCenter("#logboard");
	/*
	 * var appload = $( '<div id="loadbar"
	 * class="modal"></div>') .append( "<span>Please
	 * wait..</span><br/><div class='apploadbar'><div
	 * class='loadpercentage'></div></div><br/><span
	 * class='apploadstatus'>user logging in</span>")
	 * .appendTo("body").css({ "display" : "none" });
	 */
	window.fbAsyncInit = function() {
		FB.init({
			appId : 102016259946645,
			cookie : true,
			xfbml : true,
			oauth : true
		});
		FB
				.getLoginStatus(function(response) {
					if (response.status === 'connected') {
						var uid = response.authResponse.userID;
						var accessToken = response.authResponse.accessToken;
						userfbCheck();
					} else if (response.status === 'not_authorized') {
						// the user isloggedin to
						// Facebook,
						// but has not authenticated
						// your app
						// alert("not loggedin into
						// app");
						showFacebookLoginForm();
					} else {
						// the user isn't logged in to
						// Facebook.
						// alert("user not loggedin into
						// facebook
						// ");
						showFacebookLoginForm();
					}
				});

		FB.Event.subscribe('auth.login', function(
				response) {
			userfbCheck();
		});

		FB.Event.subscribe('auth.logout', function(
				response) {
			showFacebookLoginForm();
		});
	}
	// unused
	
	
	function showFacebookLoginForm(){
		$("button.facebook").show();
		$('#logboard, #logOverlay').fadeIn('fast');
	}
	function facebookLogin() {
		FB.login(handleFBlogin, {
			scope : 'email'
		});
	}
	function handleFBlogin(response) {
		if (response.authResponse) {
			// console.log('Authenticated!');

		} else {
			console
					.log('User cancelled login or did not fully authorize.');
		}
	}

	function handleDBResponse(response, textStatus,
			jqXHR) {
		var resp = JSON.parse(response);
		if (fbusername) {
			if (resp.message) {

				akpauth.adduser(fbusername, fname);
				/*
				 * appLoad( 50, "Authenticating
				 * application...");
				 */
			} else {
				if (!akpauth.loginstate) {

					akpauth.loginuser(fbusername);
					/*
					 * appLoad( 100, "logging in
					 * user...");
					 */
				}
				prflview = false;
			}
		} else {
			console.log("User name not available");
		}
	}

	function validateUser(data) {
		$.ajax({
			url : "fblogin.php",
			type : "post",
			data : {
				userProfile : JSON.stringify(data)
			},
			success : handleDBResponse,

			error : function(jqXHR, textStatus,
					errorThrown) {

				console.log(
						"The following error occured: "
								+ textStatus,
						errorThrown);
			},
			complete : function() {
				// console.log("user authentication
				// successful.")
			}
		});
	}
	function formatInfo(res) {
		var homeaddress = res.location;
		var work = res.work;
		fbinfo = {
			"dob" : res.birthday,
			"dept" : '',
			middle_name : "",
			mob : "",
			organization : "",
			jobtitle : "",
			homeaddress : "",
			"email" : res.email,
			"first_name" : res.first_name,
			"last_name" : res.last_name,
			"sex" : res.gender,
		};

		if (homeaddress) {
			fbinfo.homeaddress = homeaddress.name;
		}
		if (work) {
			if (work[0].employer)
				fbinfo.organization = work[0].employer.name;
			if (work[0].position)
				fbinfo.jobtitle = work[0].position.name;
		}

		var fbemail = res.email;
		var fname = res.last_name;
		fbusername = fbemail.substring(0, fbemail
				.lastIndexOf('@'))
				+ res.id;
	}

	function userfbCheck() {
		// $('#logboard').hide();
		// $("#logOverlay,#logboard").hide();
		// appload.show();
		// utils.makeCenter("#loadbar");

		// $(".akorp-ui").show();
		// $('#menu').find('li[data-tabId="planner"]').click();
		openApp();

		FB.api('/me', function(res) {

			formatInfo(res)
			var fbData = {
				id : res.id,
				name : res.username,
				email : res.email,
				location : res.location,
			}

			validateUser(fbData);

		});

	}
	(function(d) {
		var js, id = 'facebook-jssdk';
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement('script');
		js.id = id;
		js.async = true;
		js.src = "http://connect.facebook.net/en_US/all.js";
		d.getElementsByTagName('head')[0]
				.appendChild(js);
	}(document));
	
	
	
	/*
	 * End of Facebook Login
	 */
	
	
	
	
	
	
	
	
	
	
	
	


	  /*
		 * function appLoad(percentage, apploadstatus) {
		 * appload.children(".apploadbar").children(
		 * ".loadpercentage").css({ "width" : percentage +
		 * "%" })
		 * appload.children(".apploadstatus").html(apploadstatus)
		 * if (percentage == 100) { var appEnd =
		 * setTimeout(function() { $("#logOverlay,
		 * #loadbar").hide(); $(".akorp-ui").show();
		 * $('#menu').find('li[data-tabId="planner"]')
		 * .click(); }, 1000); } }
		 * 
		 */
	
	
	
	
	
	
	
	
	

	<section id="mail" class="container">
		<div class="mailHeadSection">
			<div>
				<button class="btn">
					Compose
				</button>
			</div>

			<!--		<div class="btn btn-icon"><input type="checkbox" /></div>   -->
			<div>
				<div class="btn btn-icon">
					Select
				</div>
				<button class="btn btn-icon icon-loop"></button>
				<button class="btn">
					more
				</button>
			</div>
			<div>
				<button class="btn btn-icon  icon-arrow-left-3"></button>
				<button class="btn btn-icon   icon-arrow-right-3"></button>
			</div>
		</div>
		<div class="mailBodySection">
			<div class="mailSideSection">
				<ul class="mailFolderList">
					<li>
						Inbox
					</li>
					<li>
						Drafts
					</li>
					<li>
						Sent
					</li>
					<li>
						Archives
					</li>
					<li>
						Trash
					</li>
				</ul>
			</div>
			<div class="mailContentSection">

				<table class="mailList">
					<tbody>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
						<tr class="mailEntry">
							<td class="mailCheck">
							<input type="checkbox" />
							</td><td class="mailSender">KR mail</td>
							<td class="mailContent"><b>Lorem Ipsum</b>-Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</td>
							<td class="mailTime">12:00AM</td>

						</tr>
					</tbody>
				</table>

			</div>

		</div>
	</section>

	<!-- End of mail -->
	
	
	
	
	
	
	
	
	
	
	
	
	
	
  
  /***************************************
   * *******************HTML5 Rocks ******
   * *************************************
   */
	id: kongaraju
	name:
	  given: Raju
	  family: Konga
	org:
	  name: antkorp
	  unit: Development Engineer
	address:
	  locality: Banglore
	  region: Banglore
	  country: India
	  lat: 53.55
	  lon: 10.0
	homepage: 
	google: kongaraju
	twitter: 
	email: kongaraju@google.com
	image: http://www.antkorp.in/site_image2.png
	
  
  
  
  
  
  
  
  
 