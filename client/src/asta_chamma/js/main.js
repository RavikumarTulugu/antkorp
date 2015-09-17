var roll = function() {
	this.timer = null;
	this.temp = null;
}
roll.prototype.start = function() {
	clearInterval(this.timer);
	this.timer = setInterval(this.changecount, 1);
}
roll.prototype.changecount = function() {
	var numbers = [ 1, 2, 3, 4, 8 ];
	var count = numbers[Math.floor(Math.random() * numbers.length)];
	$("#count-card").html(count);
	// this.dispCount(count);
}
roll.prototype.dispCount = function(count) {
	$("#count-card").html(count);
}
roll.prototype.stop = function(count) {
	var self = this;

	// console.log(count);
	clearTimeout(this.temp);
	this.temp = setTimeout(function() {
		self.hang(count, self)
	}, 3000);

}
roll.prototype.hang = function(count, obj) {
	var self = obj;
	clearInterval(self.timer);
	clearTimeout(self.temp);
	this.dispCount(count);
	log.alert("huh!" + count + " rolled..");

}

var animation = new roll;

function resetPawn(element, newParent) {
	element = $(element);
	newParent = $(newParent);

	var oldOffset = element.offset();
	element.appendTo(newParent);
	var newOffset = element.offset();

	var temp = element.clone().appendTo('body');
	temp.css('position', 'absolute').css('left', oldOffset.left).css('top',
			oldOffset.top).css('zIndex', 1000);
	element.hide();
	temp.animate({
		'top' : newOffset.top,
		'left' : newOffset.left
	}, 'slow', function() {
		element.show();
		temp.remove();
	});
}

function moveAnimate(element, direction, count) {
	// var count=0;
	if (count >= direction.length) {
		return;
	}

	var newParent = '#pos' + direction[count], element = $(element);
	newParent = $(newParent);

	var oldOffset = element.offset();
	element.appendTo(newParent);
	var newOffset = element.offset();

	var temp = element.clone().appendTo('body');
	temp.css('position', 'absolute').css('left', oldOffset.left).css('top',
			oldOffset.top).css('zIndex', 1000);
	element.hide();
	temp.animate({
		'top' : newOffset.top,
		'left' : newOffset.left
	}, 'slow', function() {
		element.show();
		temp.remove();
		// increase the counter
		count++;
		// call next animation after the current one is finished
		moveAnimate(element, direction, count);
	});
}

/*
 * connection to server
 */
function conOpen(e) {
	// start app logic
	// this.isOpened = true;
	// console.log("connection opened")
}
function conError() {
	// show err msg
}
function conClose() {
	// show err msg and logout
	// this.isOpened = false;
}

function send(obj) {

	var service = "astchma";
	var jsonstring = JSON.stringify(obj);
	var sendBuffer = new ArrayBuffer(jsonstring.length + 4 + 32);
	var dv 	       = new DataView(sendBuffer);
	//var service    = svcName;
	if (service.length < 32) { for (var i = 0; i < (32 - service.length); i++) { service += ' ';} }  //fill space for missing chars
	for (var i = 0; i < service.length; i++) { dv.setUint8(i, service.charCodeAt(i)); }
	dv.setInt32(32, jsonstring.length);
	for (var i = 0; i < jsonstring.length; i++) { dv.setUint8(i + 36, jsonstring.charCodeAt(i)); }
	ws.send(sendBuffer);

	return;

}
function recieveMessage(e) {

	var recvBuffer = e.data;
	var buffer=e.data;
	var dv 	       = new DataView(recvBuffer);
	var service    = "";
	for (var i = 0; i < 32; i++) { service += String.fromCharCode(dv.getUint8(i)); }
	var svcmsgLen = dv.getInt32(32, false);
	var jsonstr = "";
	for (var i = 36; i < buffer.byteLength; i++) { jsonstr += String.fromCharCode(dv.getUint8(i)); }
	//console.log(jsonstr);
	var obj;
	try{
	 obj = JSON.parse(jsonstr);
	 obj.service=service.toString().replace(/[\x00-\x1F\x80-\xFF]/g, "");
	}
	catch(e){
		console.log("NOT_JSON_DATA_Err: recieved data failed to parse");
		return false;
	}
	return obj;

}

function handleMessage(e) {
	app.handleMessage(e)
}

var helpView = function() {
	this.el = $("#log");
	this.defaults = {
		align : "bottomRight",
		timeout : 10000,
		closeOnClick : false,

	};

}
helpView.prototype.alert = function(msg) {
	var mesgEl = $("<p/>").addClass("log-msg").appendTo(this.el);
	if (typeof msg === "object") {
		mesgEl.append(msg.text);
	} else if (typeof msg === "string") {
		mesgEl.append(msg);
		setTimeout(function() {
			mesgEl.remove();
		}, 10000);
	} else {
		// console.log(typeof msg);
	}
	return mesgEl;
}
helpView.prototype.success = function() {

}
helpView.prototype.error = function() {

}
helpView.prototype.warning = function() {

}

var log = new helpView;

/*
 * List of boards
 */

var boards = function() {
	this.boards = {};
	this.count = 0;
}
boards.prototype.add = function(obj) {
	var board = this.boards[obj.boardid] = {
		id : obj.boardid,
		name : obj.boardname,
		player1 : obj.player1,
		player2 : obj.player2,
		player3 : obj.player3,
		player4 : obj.player4,
		started : obj.started || "false",

	};

	app.addNewBoard(board);
	if (this.count == obj.boardid)
		app.hideLoadingMsg();

}
boards.prototype.addPlayer = function(boardid, loginid, position) {

	var board = this.boards[boardid];
	board["player" + position] = loginid;
	app.incPlayer(loginid, boardid, "player" + position);
}
boards.prototype.remove = function(id, remove) {
	app.removeBoard(id, remove);
	// delete this.boards[id];
}
boards.prototype.get = function(id) {
	return this.boards[id];
}

/*
 * 
 * Table
 * 
 */

/*
 * var positions={ 1:{ 1:46, 2:47, 3:48, 4:49, 5:42, 6:35, 7:28, 8:21, 9:14,
 * 10:7, 11:6, 12:5, 13:4, 14:3, 15:2, 16:1, 17:8, 18:15, 19:22, 20:29, 21:36,
 * 22:43, 23:44 } }
 */

/*
 * Game
 * 
 */

var game = function() {
	this.id = null;
	this.playerCount = 0;
	this.table = null;
	this.map = {};
	this.self = null;
	this.diedCount = 0;
	this.homeCount = 0;
	this.canUpdate = true;
	this.changed=false;
	this.hasPass = false;
	this.timer = null;
	this.updater = null;
	this.players = {
		player1 : {
			pawns : "#p11,#p12,#p13,#p14",
			1 : {
				el : "#p11",
				status : false
			},
			2 : {
				el : "#p12",
				status : false
			},
			3 : {
				el : "#p13",
				status : false
			},
			4 : {
				el : "#p14",
				status : false
			},
		},
		player2 : {
			pawns : "#p21,#p22,#p23,#p24",
			1 : {
				el : "#p21",
				status : false
			},
			2 : {
				el : "#p22",
				status : false
			},
			3 : {
				el : "#p23",
				status : false
			},
			4 : {
				el : "#p24",
				status : false
			},
		},
		player3 : {
			pawns : "#p31,#p32,#p33,#p34",
			1 : {
				el : "#p31",
				status : false
			},
			2 : {
				el : "#p32",
				status : false
			},
			3 : {
				el : "#p33",
				status : false
			},
			4 : {
				el : "#p34",
				status : false
			},
		},
		player4 : {
			pawns : "#p41,#p42,#p43,#p44",
			1 : {
				el : "#p41",
				status : false
			},
			2 : {
				el : "#p42",
				status : false
			},
			3 : {
				el : "#p43",
				status : false
			},
			4 : {
				el : "#p44",
				status : false
			},
		},
	}
}
game.prototype.diedStatus = function() {

	var player = this.players[app.get("playerid")];
	var status = false;
	for ( var i = 1; i <= 4; i++) {
		if (!player[i].status)
			status = true;
	}
	return status;

}

game.prototype.init = function(board) {
	this.board = board;

	$("#start").hide();
	$(".roll_btn").attr("disabled", "disabled");
	$(".coin").unbind("click")
	$("#leave").show().bind('click', this.board.id, this.leave);
	$(".start_wait").show();

	for ( var i = 1; i <= 4; i++)
		if (board['player' + i])
			this.addPlayer(board['player' + i], "player" + i);

}

game.prototype.addPlayer = function(id, player) {
	this.board[player] = id;
	this.playerCount++;

	this.showStart();
	this.alivePawns(player);
	this.players[player]["id"] = id;
	this.players[player]["status"] = true;

	$("#" + player + "_pic").attr("src",
			"https://graph.facebook.com/" + id + "/picture");
	// $("#" + player + "_name").html(name);

	$("." + player + "_set").show();

}
game.prototype.removePlayer = function(resp) {
	var setee = ".player" + resp.playerid + "_set";
	$(setee).hide();
	for ( var i = 1; i < 5; i++) {
		var pawn = "#p" + resp.playerid + "" + i;
		$(pawn).hide();
	}
	log.alert("player leaved the board");

}
game.prototype.alivePawns = function(player) {

	for ( var i = 1; i <= 4; i++) {
		this.players[player][i].status = true;
	}

}
game.prototype.start = function(e) {
	// $("#start").attr("disabled", true);
	app.startGame(e.data);

}

game.prototype.showStart = function() {
	if (this.playerCount > 1) {
		$(".start_wait").hide();
		$("#start").show().bind('click', this.board.id, this.start)
	}

}
game.prototype.leave = function(e) {
	app.leavePlayer(e.data);
}
game.prototype.play = function() {

	$("#start").hide();
	$("#leave").show().bind('click', this.board.id, this.leave);

}
game.prototype.stop = function() {

}
game.prototype.update = function(board) {
	// console.log(board);

	if (this.canUpdate || this.changed) {
		var pawns = board.map;
		for (pawn in pawns) {
			resetPawn("#p" + pawns[pawn].pawnid, "#pos"+ pawns[pawn].cellid );

			// $("#p" + pawns[pawn].pawnid).appendTo("#pos" +
			// pawns[pawn].cellid);
		}
	}
	this.canUpdate = true;
	this.changed=false;

}
game.prototype.getMoves = function(board) {
	var coins = [];

	if (this.table == null) {
		this.table = board;
		coins = board;

		for (p in board) {
			this.map[board[p].pawnid] = board[p].cellid;
		}
	} else {

		for (p in board) {
			if (this.map[board[p].pawnid] != board[p].cellid) {
				this.map[board[p].pawnid] = board[p].cellid;
				coins.push(board[p]);
			}
		}
		this.table = board;
	}

	return coins;
}
game.prototype.enableTurn = function(turn) {
	var self = this;

	$("#player" + turn.playerid + "_pic").addClass("blink2").css({
		"-webkit-animation-play-state" : "running",
		"-moz-animation-play-state" : "running",
		"-o-animation-play-state" : "running",
		"animation-play-state" : "running",
	});

	$(".roll_btn").removeAttr("disabled").click(function() {

		app.rollReq()// turn.playerid);
		$(this).attr("disabled", "disabled").unbind("click");

	})
}
game.prototype.animateCoin = function(pawn, list) {
	this.canUpdate = false;

	moveAnimate("#p" + pawn, list, 0);

}
game.prototype.enablePawnSelect = function(obj) {

	$(".coin").unbind("click")
	var self = obj;
	self.afterAnim(self);

}
game.prototype.afterAnim = function(obj) {
	var self = obj;
	var pid = app.get("playerid");
	var pawns = self.players["player" + pid].pawns;
	$(pawns).bind("click", {
		coins : pawns,
		count : self.roll_count,
		obj : self
	}, self.selectCoin);
}
game.prototype.selectCoin = function(e) {

	var pwnid = this.id;
	var self = e.data.obj;

	var id = pwnid.substr(1, 2);

	var pos = $(this).parent("td").attr("id");

	if (!pos) {
		if (e.data.obj.roll_count == 4) {
			app.bringPawn(id);
			self.disablePawnSelect(e.data.coins);
			// $(e.data.coins).unbind("click");

		} else if (e.data.count == 8) {
			app.bringPawn(id);
			e.data.obj.roll_count = 4;

		} else {
			log
					.alert("Move not possible!<br/> Please select another coin to move.");

		}
	} else {

		var posid = pos.substr(3, 2);
		app.moveReq(id, posid, e.data.obj.roll_count);
		// $(e.data.coins).unbind("click");
		self.disablePawnSelect(e.data.coins);
	}
}
game.prototype.disablePawnSelect = function(coins) {
	$(coins).unbind("click");
	clearTimeout(this.timer);
	clearInterval(this.updater);
	$(".countDown").hide();

}
game.prototype.rollStart = function() {
	// app.rollReq(playerid);
	animation.start();
}
game.prototype.startCountDown = function() {

	var self = this;
	var pawns = this.players["player" + this.self].pawns;
	setTimeout(function() {
		$(".countDown").show();
		$("#timer").html("30");
		clearTimeout(self.timer);
		self.timer = setTimeout(function() {
			self.disablePawnSelect(pawns);
			app.moveReq(0, 0, 0);
		}, 30000)
		var i = 30;
		clearInterval(self.updater);
		self.updater = setInterval(function() {
			$("#timer").addClass("text-error").html(" " + i--);
		}, 1000)
	}, 3000)
}
game.prototype.rollStop = function(stack) {
	animation.stop(stack.roll_count);
	this.roll_count = stack.roll_count;
	var selfid = this.self;
	var self = this;

	if (stack.playerid == this.self && stack.roll_count > 3)
		this.hasPass = true;

	if (this.diedCount + this.homeCount == 4 && stack.roll_count < 4) {
		setTimeout(function() {
			if (stack.playerid == selfid)
				app.moveReq(0, 0, 0);
			log.alert("move not possible.");
		}, 3000);

	} else if (!this.hasPass) {
		setTimeout(function() {
			if (stack.playerid == selfid)
				app.moveReq(0, 0, 0);
		}, 3000);

	} else {
		if (stack.playerid == selfid)
			this.startCountDown();

		if (this.diedCount > 0 && this.roll_count > 3){
			log.alert("You can get pawn or move pawn");
		}
			
		setTimeout(function() {
			self.enablePawnSelect(self)
		}, 3000);
	}

}
game.prototype.movePawn = function() {

}
game.prototype.addPawn = function(stack) {
	// console.log(stack);
	var pawn = String(stack.pawnid);
	var pyr = stack.playerid;

	this.players["player" + pyr][pawn.substr(1, 2)].status = true;

	// if(this.diedStatus && this.roll_count>3 )
	// log.alert("")
	if (stack.playerid == this.self)
		this.diedCount--;

}
game.prototype.removePawn = function(stack) {
	// console.log(stack)
	var pawn = String(stack.pawnid);
	var pyr = stack.playerid;
	this.players["player" + pyr][pawn.substr(1, 2)].status = false;

	// pawn.substr(0,1);
	// $("#p"+pawn).appendTo(".player"+pyr+"_set");

	resetPawn("#p" + pawn, "#player" + pyr);

	if (stack.playerid == this.self)
		this.diedCount++;

}
game.prototype.gotHome = function(stack) {
	if (stack.playerid == this.self)
		this.homeCount++;
}
game.prototype.moveIgnore = function() {

}

/*
 * app
 */

var Application = function() {
	this.me = null;
	this._me = {
		joined : false,
		boardCreator : true,
		boardName : null
	};
	this.map = {};
	this.init = function() {
		var self = this;
		$("#pagain").bind("click", function() {

			$(".gameEnd, .lost, .won").hide();
			$(".available-boards").show();
			self.resetBoard();
			self.setBoards();
		})

	}
	this.init();
}
Application.prototype.showAnimation = function() {
	$(".logboard").hide();
	$(".auth-system").append("<p class=text-info>please wait Loading..</p>");

}
Application.prototype.setBoards = function() {
	$(".content section").hide();
	$(".available-boards").show();
	var self = this;
	$(".newBoard").removeAttr("disabled").bind("click", function() {
		$(this).attr("disabled", true);
		self.createBoard();
		// self.openBoard();
	});
}
Application.prototype.resetBoard = function() {
	this.set("joined", false);
	this.set("boardCreator", false);
	this.set("boardName", null);
	this.set("playerid", null);
	this.set("boardid", null);
	this.sgame = null;

	$("#p11,#p12,#p13,#p14").appendTo("#player1_set");
	$("#p21,#p22,#p23,#p24").appendTo("#player2_set");
	$("#p31,#p32,#p33,#p34").appendTo("#player3_set");
	$("#p41,#p42,#p43,#p44").appendTo("#player4_set");
	$("#player1_set,#player2_set,#player3_set,#player4_set,#start,#leave")
			.hide();
	$("#player1_pic,#player2_pic,#player3_pic,#player4_pic").removeAttr("src");

}

Application.prototype.showBoards = function(e) {
	$(".auth-system, .help").hide();
	// var self = this;
	var self = e.data;
	$(".newBoard").removeAttr("disabled").bind("click", function() {
		$(this).attr("disabled", true);
		self.createBoard();
		// self.openBoard();
	});

	$(".available-boards, .content, .app").show();
}
Application.prototype.showHelp = function() {
	$(".auth-system").hide();
	$(".help, .content, .app").show();
	$(".navBoards").show();
	$("#feedback_btn").show();
	$("#goBoards").bind("click", this, this.showBoards)

}
Application.prototype.addNewBoard = function(board) {
	var self = this;

	var playercard = $("<div/>").addClass("brdPlayers");

	for ( var i = 1; i <= 4; i++) {
		var str = "player" + i;
		if (!board[str])
			continue;

		$("<img/>").attr("src",
				"https://graph.facebook.com/" + board[str] + "/picture")
				.addClass("img-rounded").appendTo(playercard);
	}

	var joinbtn;

	if (board.started == "false") {

		joinbtn = $("<button/>").append("join").addClass(
				"btn btn-success pull-right joinbtn").bind("click", function() {
			self.joinPlayer(board.id);
		})
	}
	else{
		joinbtn=$("<p/>").append("  : playing..");
	}
	var brdname = $("<div/>").addClass("brdname well").append(
			"<p class=pull-left>" + board.name + "</p>").append(joinbtn);

	$("<div/>").addClass("boardPanel thumbnail").append(brdname).append(
			playercard).attr("data-bid", board.id).prependTo(".boards-list");
	if ($(".available-boards .emptymsg").length)
		$(".available-boards .emptymsg").remove();

}
Application.prototype.createBoard = function() {
	var self = this;
	var playerpic = $("<img/>").attr("src",
			"https://graph.facebook.com/" + this._me["id"] + "/picture")
			.addClass("img-rounded")
	var playercard = $("<div/>").addClass("brdPlayers").append(playerpic);
	var input = $("<input/>").attr({
		type : "text",
		placeholder : "Enter board name.."
	}).bind("keypress", function(e) {
		if (e.keyCode == 13) {
			var name = $(this).val();
			$(this).attr("disabled", true);
			self.openBoard(name);
		}
	});
	var brdname = $("<div/>").addClass("brdname well well-small").append(input);

	$("<div/>").addClass("boardPanel thumbnail tempboard").append(brdname)
			.append(playercard).prependTo(".boards-list");
	if ($(".available-boards .emptymsg").length)
		$(".available-boards .emptymsg").remove();
}
Application.prototype.incPlayer = function(id, bid, player) {
	var playerpic = $("<img/>").attr("src",
			"https://graph.facebook.com/" + id + "/picture").addClass(
			"img-rounded");
	var el = $(".boardPanel[data-bid=" + bid + "]");
	if (el.length)
		el.children(".brdPlayers").append(playerpic);

	if (this.get("joined"))
		if (this.get("boardid") == bid)
			this.addGamePlayer(id, player)

}
Application.prototype.removeBoard = function(bid, remove) {

	// console.log($(".boardPanel[data-bid=" + bid + "]").length);
	if (remove)
		$(".boardPanel[data-bid=" + bid + "]").remove();
	else
		$(".boardPanel[data-bid=" + bid + "]").find(".joinbtn").remove();

	if (this.get("joined"))
		if (this.get("boardid") == bid)
			this.sgame.play();
}
Application.prototype.addGamePlayer = function(id, player) {
	this.sgame.addPlayer(id, player);

}
Application.prototype.showEmptyPanel = function() {
	$(".available-boards")
			.append(
					"<p class='emptymsg alert alert-info'>There are no available boards, create a board to play</p>");
}
Application.prototype.showLoadingBoards = function() {
	/*
	 * $(".available-boards").append( "<p class='loadingboards alert alert-success'>Please
	 * wait loading boards</p>");
	 */

}
Application.prototype.hideLoadingMsg = function() {
	$(".loadingboards").remove();
}
Application.prototype.removeTemp = function() {
	$(".tempboard").remove();
}
Application.prototype.showboard = function() {

	$(".available-boards").slideUp();
	$(".game").slideDown();

}
Application.prototype.throwErr = function(ecode) {
	if (ecode == 1) {
		this.hide();
		this.showExisted();
	}

}

Application.prototype.gameOver = function(resp) {
	$("#game").hide();

	if (resp.winner == this.sgame.self)
		$(".gameEnd, .gameEnd .won").show();
	else
		$(".gameEnd, .gameEnd .won").show();

}

Application.prototype.showExisted = function() {
	alert("player already loggedin on other mechine.");
}

Application.prototype.hide = function() {
	$(".logboard,.auth-system,.available-boards, .content, .app,.game").hide();

}
Application.prototype.showUser = function(id, name) {
	$("#me-pic").attr("src",
			"https://graph.facebook.com/" + id + "/picture?width=32&height=32")
			.addClass("img-rounded");
	$("#me-name").append(name);
}

Application.prototype.initGame = function() {
	this.showboard();
	this.set("joined", true);

	var board = boardlist.get(this.get("boardid"));
	this.sgame = new game();
	this.sgame.init(board);
}

Application.prototype.createUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}
Application.prototype.startGame = function(bid) {
	var obj = {
		mesgtype : "request",
		request : "start",
		cookie : this.createUUID(),
		boardid : bid
	}
	send(obj);
	this.map[obj.cookie] = "start";
}
Application.prototype.rollReq = function(pid) {
	var obj = {
		mesgtype : "request",
		request : "roll",
		cookie : this.createUUID(),
		boardid : this.get("boardid"),
		playerid : this.get("playerid")
	// pid
	}
	send(obj);
	this.map[obj.cookie] = "roll";
}
Application.prototype.moveReq = function(pawn, from, count) {
	var obj = {
		mesgtype : "request",
		request : "move",
		cookie : this.createUUID(),
		boardid : this.get("boardid"),
		playerid : this.get("playerid"),
		pawnid : pawn,
		from : from,
		roll_count : count,
	}
	send(obj);
	this.map[obj.cookie] = "move";

	$(".pyr_pic").removeClass("blink2").css({
		"-webkit-animation-play-state" : "paused",
		"-moz-animation-play-state" : "paused",
		"-o-animation-play-state" : "paused",
		"animation-play-state" : "paused",
	});
}

Application.prototype.bringPawn = function(pawnid) {
	var obj = {
		mesgtype : "request",
		request : "bring_pawn",
		cookie : this.createUUID(),
		pawnid : pawnid,
		playerid : this.get("playerid"),
		boardid : this.get("boardid"),
	}
	send(obj);
	this.map[obj.cookie] = "getpawn";
}
Application.prototype.login = function(data) {

	var obj = {
		mesgtype : "request",
		request : "login",
		cookie : this.createUUID(),
		loginid : data.id,
		name : data.first_name,
	}
	send(obj);
	this.map[obj.cookie] = "login";
	this.showUser(data.id, data.first_name);

}
Application.prototype.getBoards = function() {
	var obj = {
		mesgtype : "request",
		request : "get_board_list",
		cookie : this.createUUID(),
	}
	send(obj);
	this.map[obj.cookie] = "boards";
}

Application.prototype.openBoard = function(name) {

	var obj = {
		mesgtype : "request",
		request : "open_board",
		cookie : this.createUUID(),
		loginid : this._me["id"],
		name : name
	}
	send(obj);
	this.map[obj.cookie] = "openBoard";
	this._me["boardName"] = name;

}
Application.prototype.joinPlayer = function(b_id) {

	var obj = {
		mesgtype : "request",
		request : "join",
		cookie : this.createUUID(),
		loginid : this.get("id"),
		boardid : b_id
	}
	send(obj);
	this.map[obj.cookie] = "join";
	this.set("boardid", b_id);
	this.initGame();

}
Application.prototype.leavePlayer = function(b_id) {
	var obj = {
		mesgtype : "request",
		request : "leave",
		cookie : this.createUUID(),
		loginid : this.get("id"),
		boardid : b_id
	}
	send(obj);
	this.map[obj.cookie] = "leave";
}

Application.prototype.handleMessage = function(msg) {
	var recvd = recieveMessage(msg);
	// console.log(recvd);

	if (!clientidRecvd) {
		clientid = recvd.clientid;
		clientidRecvd = true;
		// console.log("client id recvd");
	} else if (recvd.mesgtype == "event") {
		// console.log(recvd.eventtype);
		switch (recvd.eventtype) {
		case "new_board":
			boardlist.add(recvd);
			if (this.get("boardCreator"))
				if (recvd.boardname == this.get("boardName")) {
					this.joinPlayer(recvd.boardid)
					this.set("joined", true);
					this.removeTemp();
				}

			break;
		case "player_join":
			boardlist.addPlayer(recvd.boardid, recvd.loginid, recvd.playerid);
			break;
		case "player_leave":
			this.sgame.removePlayer(recvd);
			break;
		case "board_started":

			boardlist.remove(recvd.boardid, false);
			log.alert("Lets play the game.");
			break;
		case "board_update":
			// console.log(recvd);
			this.sgame.update(recvd);
			break;
		case "board_animate":
			// console.log(recvd);
			this.sgame.animateCoin(recvd.pawnid, recvd.move_list);
			break;
		case "board_deleted":
			boardlist.remove(recvd.boardid, true);
			break;
		case "turn_event":
			log.alert(":) Its your Turn, Lets roll!.");
			this.sgame.enableTurn(recvd);
			break;
		case "roll_start":
			this.sgame.rollStart();
			break;
		case "roll_stop":
			this.sgame.rollStop(recvd);
			break;
		case "move_not_possible":
			log.alert("You cannot move the coin");
			this.sgame.moveIgnore();
			break;
		case "pawn_died":
			log.alert("oh! coin died");
			this.sgame.removePawn(recvd);
			break;
		case "pawn_alive":
			log.alert("pawn released");
			this.sgame.changed=true;
			this.sgame.addPawn(recvd);
			break;
		case "home_event":
			this.sgame.gotHome(recvd);
			break;
		case "chance_event":
			log.alert(":) You got one more chance!");
			this.sgame.enablePawnSelect(this.sgame);
			break;
		case "game_over_event":
			app.gameOver(recvd);
			break;
		case "service_down":
			$("body").hide();
			alert("server down, please try after some time");
			break;
		default:
			// console.log("event type not found");

		}

	} else {
		// console.log(this.map[recvd.cookie]);
		switch (this.map[recvd.cookie]) {
		case "login":

			if (recvd.mesgtype == "error") {
				// console.log(recvd.emsg);
				app.throwErr(1);
			} else {
				// console.log(recvd);
				this.showHelp();
				this.getBoards();
				// this.showBoards();

			}
			break;
		case "boards":
			if (recvd.board_count == 0)
				this.showEmptyPanel();
			else if (recvd.board_count) {
				// console.log("board_count: " + recvd.board_count);
				boardlist.count = recvd.board_count;
				this.showLoadingBoards();
			} else {
				boardlist.add(recvd);
				// console.log("board Recieved");
			}
			// console.log(recvd);

			break;
		case "openBoard":
			// console.log(recvd);
			if (recvd.status == "success")
				this._me["boardCreator"] = true;

			break;
		case "join":
			// console.log(recvd);
			// this.initGame();

			this.set("playerid", recvd.playerid);
			this.sgame.self = recvd.playerid;

			break;
		case "start":
			// console.log(recvd);
			break;
		case "roll":
			// console.log(recvd);

			break;
		case "getpawn":
			// console.log(recvd);
			break;
		case "leave":
			this.resetBoard();
			this.setBoards();
			break;
		default:
			// console.log(" response not recognised");
		}
	}
}

Application.prototype.logout = function() {
	var obj = {
		mesgtype : "request",
		request : "logout",
		cookie : this.createUUID(),
		loginid : this.get("id"),
	}
	send(obj);
	this.map[obj.cookie] = "logout";
}
Application.prototype.setInfo = function(info) {
	this._me = info;
}
Application.prototype.get = function(prop) {
	if (prop)
		return this._me[prop];
	else
		return this._me;
}
Application.prototype.set = function(prop, value) {
	this._me[prop] = value;
	return;
}

/*
 * allPlayers
 */

var list = function() {
	this.users = {};
}
list.prototype.add = function(user) {
	this.users[user.id] = user;
}
list.prototype.get = function(id) {
	return this.users[id];
}

/*
 * user
 */

var app = new Application;
var boardlist = new boards;
var userslist = new list;

var ws = new WebSocket("ws://www.antkorp.in:443/services=astchma");
var clientid = null;
var clientidRecvd = false;
ws.binaryType = 'arraybuffer';
ws.onopen = conOpen;
ws.onerror = conError;
ws.onclose = conClose;
ws.onmessage = handleMessage;

/*
 * g-plus one
 */

(function() {
	var po = document.createElement('script');
	po.type = 'text/javascript';
	po.async = true;
	po.src = 'https://apis.google.com/js/plusone.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(po, s);
})();

/*
 * Tweet
 */

// function(d,s,id){var
// js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
/*
 * Feed back
 */
$("#post_fk").bind("click", send_feedback);

function send_feedback(e) {
	var cmnt = $("#feedback").val();
	$("#feedback").empty();
	if (cmnt) {
		var feedback = {
			id : app.get("id"),
			name : app.get("first_name"),
			email : app.get("email"),
			stmt : cmnt,
		}
		$.ajax({
			url : "../php/feedback.php",
			type : "post",
			data : {
				userFeedback : JSON.stringify(feedback)
			},

			success : function(response, textStatus, jqXHR) {

				console.log("feedback recorded successfully "
						+ response.message)
			},

			error : function(jqXHR, textStatus, errorThrown) {

				console.log(
						"The following error occured while recording feedback : "
								+ textStatus, errorThrown);
			},

			complete : function() {

			}
		});
	}

}

/*
 * Login system
 */

var fbusername;
var fbbtn = $("<button/>").append(
		"<i class='facebook_24'></i><span> Join with facebook</span>")
		.addClass("facebook").bind('click', facebookLogin);
var note_sec = $("<p/>").append("we do not send emails or store your details.")
		.addClass("text-error");
// var asi = $("<span/>").append("Do you want to Play ascma").addClass("asi");
var fr = $('<div/>').addClass("logboard").append(fbbtn).append(note_sec)
		.appendTo(".auth-system").hide();

$("body").append('<div id="fb-root"></div>');

$("#shareApp").bind("click", shareWithFacebook);

/*
 * var appload = $('<div id="loadbar" class="modal"></div>') .append( "<span>Please
 * wait..</span><br/><div class='apploadbar'><div class='loadpercentage'></div></div><br/><span
 * class='apploadstatus'>user logging in</span>") .appendTo("body").css({
 * "display" : "none" });
 * 
 * 
 * Sign In to antkorp
 */
// .append('<div class="fb-login-button" data-size="large"
// scope="email,user_birthday,user_work_history" >Login with Facebook</div>')
// $('<div id="logOverlay" class="overlay"></div>').appendTo('body');
window.fbAsyncInit = function() {
	FB.init({
		appId : 279062668889287,
		cookie : true,
		xfbml : true,
		oauth : true,

	});

	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			var uid = response.authResponse.userID;
			var accessToken = response.authResponse.accessToken;
			userfbCheck();
		} else if (response.status === 'not_authorized') {
			// the user is logged in to Facebook,
			// but has not authenticated your app
			// alert("not loggedin into app");
			$('.logboard').fadeIn('fast');
		} else {
			// the user isn't logged in to Facebook.
			// alert("user not loggedin into facebook ");
			$('.logboard').fadeIn('fast');
		}
	});

	FB.Event.subscribe('auth.login', function(response) {
		userfbCheck();

	});

	FB.Event.subscribe('auth.logout', function(response) {
		$('#logboard, #logOverlay').fadeIn('fast');
	});
};

function send_message_FB() {
	FB
			.ui({
				method : 'send',
				name : "play asta chamma online",
				link : 'http://www.astachamma.com/',
				description : 'Hi friends lets play our traditional game asta chamma online. Do you want to play with me, login to astachamma.com',
			});
	// console.log(ids);
}

function get_friends() {
	FB.api('/me/friends', function(resp) {
		var ids = [];
		var fds_list = resp.data;
		for ( var i = 0; i < fds_list.length; i++) {
			ids.push(fds_list[i].id);
		}
		shareWithFacebook(ids)

	});
}

function shareWithFacebook(ids) {
	FB
			.ui(
					{
						method : 'apprequests',
						message : 'Hi friends lets play our traditional game asta chamma online'
					}, requestCallback);
}

function requestCallback(resp) {
	// console.log(resp);
}

function facebookLogin() {
	// app.showAnimation();
	FB.login(function(response) {
		if (response.authResponse) {
			// console.log('Authenticated!');
			// location.reload(); //or do whatever you want
		} else {
			console.log('User cancelled login or did not fully authorize.');
		}
	}, {
		scope : 'email,user_birthday,user_work_history,friends_online_presence'
	});
}

function getInfo(res) {
	var homeaddress = res.location;
	var work = res.work;
	var fbinfo = {
		id : res.id,
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
		"name" : res.first_name + " " + res.last_name
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

	return fbinfo;

	/*
	 * var fbemail = res.email; var fname = res.last_name; fbusername =
	 * fbemail.substring(0, fbemail.lastIndexOf('@')) + res.id; //
	 * console.log(newfbusername);
	 * 
	 * var fbData = { id : res.id, name : res.username, email : res.email,
	 * location : res.location, }
	 */

}

function userfbCheck() {
	// app.showAnimation();
	FB.api('/me', function(res) {
		// console.log(res);

		var fbdata = getInfo(res);
		app.setInfo(fbdata);

		$.ajax({
			url : "php/fblogin.php",
			type : "post",
			data : {
				userProfile : JSON.stringify(fbdata)
			},

			success : function(response, textStatus, jqXHR) {

				var resp = JSON.parse(response);

				app.login(fbdata);

				/*
				 * if (fbusername) { if (resp.message) { //
				 * akpauth.adduser(fbusername, fname); // appLoad(50,
				 * "Authenticating application..."); } else { if
				 * (!akpauth.loginstate) { // akpauth.loginuser(fbusername); //
				 * appLoad(100, "logging in user..."); } // prflview = false; } }
				 * else { console.log("User name not available"); }
				 */
			},

			error : function(jqXHR, textStatus, errorThrown) {

				console.log("The following error occured: " + textStatus,
						errorThrown);
			},

			complete : function() {
				// enable the inputs
				console.log("user authentication successful.")

			}
		});

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
	d.getElementsByTagName('head')[0].appendChild(js);
}(document));
