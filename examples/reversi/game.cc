#include <sys/types.h>
#include <sys/stat.h>
#include <sys/errno.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <signal.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <assert.h>
#include <cstring>
#include <cstdio>
#include <stdint.h>
#include <fcntl.h>
#include "akorpdefs.h"
#include "common.hh"
#include "reactor.hh"
#include "board.hh"
#include "svclib.hh"
#include "player.hh"
#include <fcntl.h>           /* For O_* constants */
#include <sys/stat.h>        /* For mode constants */
#include <mqueue.h>
#include <mongo/client/dbclient.h>
#include <mongo/bson/bsonobj.h>

int gwSocketId = -1;
char _rbuf[2048];
std::string encodedBuf;
int gPlayerId = 0;
int gBoardId = 0;
uint32_t seed = getpid(); 
int boardCount = 0;
int playerCount = 0;
extern void sendNewBoardEvent(Board*);
service *svc;
bool gameOver = false;
int gameOverBoardId = 0;
mongo::DBClientConnection conn(true, NULL);

//send leader board
//read the leaders from the mongodb and then 
//send leaderboard events to the client.
//All getting and sending happens in this function.
static void
sendTop10(int client, std::string cookie)
{
    std::string mesgtype("response"), response("leader_board");
	tupl tv[] = {
		{"mesgtype", mesgtype},
		{"response", response}, 
		{"cookie", cookie}
	};
	JSONNode leaderBoard(JSON_NODE);
	putJsonVal(tv, sizeof(tv)/sizeof(tupl), leaderBoard);
	JSONNode leaderArray(JSON_ARRAY);
    leaderArray.set_name("leader_list");
    auto_ptr<mongo::DBClientCursor> cursor = conn.query("reversi.players", QUERY("score"<< mongo::GTE << 0).sort("score", -1), 10);
    while(cursor->more()){
        mongo::BSONObj dbObj = cursor->next();
        int sc = dbObj["score"].number();
        std::string lgid;  
        dbObj["loginid"].Val(lgid);
        tupl scoreAttribs[] = {{"loginid", lgid}, {"score", sc}};
        JSONNode scoreTuple(JSON_NODE);
		putJsonVal(scoreAttribs, sizeof(scoreAttribs)/sizeof(tupl), scoreTuple);
        leaderArray.push_back(scoreTuple);
    }
    leaderBoard.push_back(leaderArray);
	string leaderBoardResp = leaderBoard.write_formatted();
    svc->sendToClient(client,
            -1,
            nonconst(leaderBoardResp.c_str()),
            leaderBoardResp.length());
    return;
}

//send back an error message to the client 
static void 
error2Client(int clnt, std::string cookie, std::string error)
{ 
	std::string response("response");
	std::string sf("error");
	tupl tv[] = {
		{"mesgtype", response}, 
		{"cookie", cookie}, 
		{"status", sf}, 
		{"error", error}};
	size_t size = sizeof(tv)/sizeof(tupl);
	std::string json = putJsonVal(tv, size);
	svc->sendToClient(clnt, -1, nonconst(json.c_str()), json.length());
	return;
}

static void 
success2Client(int clientid, std::string &cookie)
{
	std::string response("response");
	std::string sf("success");
	tupl tv[] = {
		{"mesgtype", response}, 
		{"cookie", cookie}, 
		{"status", sf}};
	size_t size = sizeof(tv)/sizeof(tupl);
	std::string json = putJsonVal(tv, size);
	svc->sendToClient(clientid, -1, nonconst(json.c_str()), json.length());
	return;
}

static void
handleOpenBoard(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid, bname;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"loginid", &loginid},
		{"name", &bname},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			if (getBoard(bname)){
				std::string emsg("a board with same name already present."), err("error");
				tupl tv[] = {
					{"mesgtype", err},
					{"cookie", cookie},
					{"error",  emsg}
				};
				JSONNode errNode(JSON_NODE);
				putJsonVal(tv, sizeof(tv)/sizeof(tupl), errNode);
				string error = errNode.write_formatted();
				svc->sendToClient(clnt,
						-1,
						nonconst(error.c_str()),
						error.length());
				return;
			}
			gBoardId++;
			Board *b = new Board(gBoardId, bname);
			boardCount++;
			success2Client(clnt, cookie);
			//publish an event for board creation to all the players.
			sendNewBoardEvent(b);
			return;
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleStart(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid, name;
	int boardid = 0;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"boardid", &boardid},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			Board *b = getBoard(boardid);
			if (b && b->isStarted()){
				return;
			}
			if (b) b->start();
			return;
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleRestart(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid, name;
	int boardid = 0;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"boardid", &boardid},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			Board *b = getBoard(boardid);
			if (b && b->isStarted()){
				return;
			}
			std::string event("event"), event_type("board_restart");
			tupl tv[] = {
				{"mesgtype", event},
				{"eventype", event_type},
				{"cookie", cookie},
				{"boardid", boardid},
			};
			JSONNode eventNode(JSON_NODE);
			putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
			string gameStart = eventNode.write_formatted();
			universalBroadcast(gameStart.c_str(), gameStart.length());
			b->start();
			return;
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleLogin(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid, name;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"loginid" , &loginid},
		{"name", &name}
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			if(getPlayer(loginid)){
				std::string emsg("Player already logged in."), err("error");
				tupl tv[] = {
					{"mesgtype", err},
					{"cookie", cookie},
					{"error",  emsg}
				};
				JSONNode errNode(JSON_NODE);
				putJsonVal(tv, sizeof(tv)/sizeof(tupl), errNode);
				string error = errNode.write_formatted();
				svc->sendToClient(clnt,
						-1,
						nonconst(error.c_str()),
						error.length());
				return;
			}
			gPlayerId++;
			Player *p = new Player(gPlayerId, clnt, loginid, name);
			std::cerr<<"\nNew player logged in : "<<name;
			playerCount++;
			std::string response("response");
			tupl tv[] = {
				{"mesgtype", response},
				{"cookie", cookie},
				{"boardcount", boardCount},
				{"playercount", playerCount},
			};
			JSONNode respNode(JSON_NODE);
			putJsonVal(tv, sizeof(tv)/sizeof(tupl), respNode);
			string resp = respNode.write_formatted();
			svc->sendToClient(clnt,
					-1,
					nonconst(resp.c_str()),
					resp.length());
            {
                std::string event("event"), eventtype("player_login");
                tupl tv[] = {
                    {"mesgtype", event},
                    {"eventtype", eventtype},
                    {"loginid", loginid}
                };
                JSONNode eventNode(JSON_NODE);
                putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
                string playerLoginEvent = eventNode.write_formatted();
                universalBroadcast(nonconst(playerLoginEvent.c_str()), playerLoginEvent.length());
            }
            sendPlayerList(clnt);
            return;
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleLogout(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid, name;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"loginid" , &loginid},
		{"name", &name}
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			Player *p = getPlayer(loginid);
			if(p){
				Board *b = getBoard(p->getBoardId());
				if(b){
					b->playerLeave(*p);
					//delete the board if he is the last player.
					if(b->getCurrentPlayerCount() == 0){
						broadcastBoardDeleteEvent(b->getId());
						delete b;
						boardCount--;
					}
					return;
				}
				delete p;
				playerCount--;
			}
            {
                std::string event("event"), eventtype("player_logout");
                tupl tv[] = {
                    {"mesgtype", event},
                    {"eventtype", eventtype},
                    {"loginid", loginid}
                };
                JSONNode eventNode(JSON_NODE);
                putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
                string playerLogoutEvent = eventNode.write_formatted();
                universalBroadcast(nonconst(playerLogoutEvent.c_str()), playerLogoutEvent.length());
            }
			return;
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void 
handleJoin(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid;
	int boardid;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"loginid" , &loginid},
		{"boardid" , &boardid},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			Player *p = getPlayer(loginid);
			if(p){
				Board *b = getBoard(boardid);
				if(b){
					b->playerJoin(*p);
					p->setBoardId(boardid);
					std::string response("response");
					tupl tv[] = {
						{"mesgtype", response},
						{"cookie", cookie},
						{"playerid", b->getPlayerId(loginid)},
					};
					JSONNode respNode(JSON_NODE);
					putJsonVal(tv, sizeof(tv)/sizeof(tupl), respNode);
					string resp = respNode.write_formatted();
					svc->sendToClient(clnt,
							-1,
							nonconst(resp.c_str()),
							resp.length());
					return;
				}
			}
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void 
handleLeave(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request, loginid;
	int boardid;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
		{"loginid" , &loginid},
		{"boardid" , &boardid},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			Player *p = getPlayer(loginid);
			if(p){
				Board *b = getBoard(boardid);
				if(b){
					b->playerLeave(*p);
					p->setBoardId(0);
					success2Client(clnt, cookie);
					//delete the board if he is the last player.
					if(b->getCurrentPlayerCount() == 0){
						broadcastBoardDeleteEvent(boardid);
						boardCount--;
						delete b;
					}
					return;
				}
			}
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleGetBoardList(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			std::string mesgtype("response"), response("board_list");
			tupl tv[] = {
				{"mesgtype", mesgtype},
				{"response", response}, 
				{"cookie", cookie},
				{"board_count", boardCount},
			};
			JSONNode respNode(JSON_NODE);
			putJsonVal(tv, sizeof(tv)/sizeof(tupl), respNode);
			string respBuf = respNode.write_formatted();
			svc->sendToClient(clnt,
					-1,
					nonconst(respBuf.c_str()), 
					respBuf.length());
			if(boardCount) 
				sendBoardList(clnt, cookie);
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleGetPlayerList(int clnt, char *jsonData) 
{
	std::string msgType, cookie, request;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie"  , &cookie},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
            sendPlayerList(clnt);
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleMessage(int clnt, char *jsonData)
{
	std::string msgType, cookie, request, text;
	int boardid, playerid;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"boardid", &boardid}, 
		{"sender", &playerid},
		{"text",  &text},
	};
	int  sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			//broadcast the roll_start event to all the players.
			Board *b = getBoard(boardid);
			{
				std::string event("event"), eventtype("message");
				tupl tv[] = {
					{"mesgtype", event},
					{"eventtype", eventtype}, 
					{"boardid", boardid},
					{"sender", playerid},
					{"text",  text},
				};
				JSONNode eventNode(JSON_NODE);
				putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
				string mesg = eventNode.write_formatted();
				b->broadcast(mesg.c_str(), mesg.length());
			}
		}else{
			std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
		}
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

//handle the flip event, 
//verify whether its a valid position and then alter the board state
//and broadcast the board to all the players.
static void
handleFlip(int clnt, char *jsonData)
{
	std::string msgType, cookie, request;
	int boardid = 0, playerid = 0, cellIndex = 0;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"boardid", &boardid}, 
		{"playerid", &playerid},
		{"cellindex", &cellIndex}
	};
	int  sz = sizeof(t)/sizeof(tupl);
    try{
        JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            //broadcast the roll_start event to all the players.
            Board *b = getBoard(boardid);
            if(b){
                b->flip(playerid, cellIndex);
                if(cellIndex >= 0) b->turnPassed = 0;
                else (b->turnPassed)++;
            }
        }else{
            std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
        }
    }
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleGetLeaderBoard(int clnt, char *jsonData)
{
	std::string msgType, cookie, request;
	tupl t[] = {
		{"mesgtype", &msgType},
		{"request" , &request},
		{"cookie" , &cookie},
	};
	int  sz = sizeof(t)/sizeof(tupl);
    try{
        JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            sendTop10(clnt, cookie);
        }else{
            std::cerr<<"\n"<<__FUNCTION__<<"Not enough data to perform operation requested.";
        }
    }
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void 
processWsInput(int clientid, char *rbuf, int  bufSz) 
{
	char *jsonData = rbuf;
	try {
		JSONNode n = libjson::parse(jsonData);
		//extract all possible parameters for a message 
		//a message can be a request response or event or error
		std::string msgType, request, cookie;
		tupl t[] = {
			{"mesgtype", &msgType},
			{"request" , &request},
			{"cookie"  , &cookie},
		};

		int  sz = sizeof(t)/sizeof(tupl);
		getJsonVal(n, t, sz);
		if (msgType == "request"){
			if (request == "login") 		  handleLogin(clientid, jsonData);
			if (request == "logout") 		  handleLogout(clientid, jsonData);
			else if(request == "join")		  handleJoin(clientid, jsonData);
			else if (request == "leave") 	  handleLeave(clientid, jsonData);
			else if (request == "open_board") 	  handleOpenBoard(clientid, jsonData);
			else if (request == "get_board_list") handleGetBoardList(clientid, jsonData);
			else if (request == "get_player_list") handleGetPlayerList(clientid, jsonData);
			else if (request == "start") 		  handleStart(clientid, jsonData);
			else if (request == "restart") 	  	  handleRestart(clientid, jsonData);
			else if (request == "message") 	  handleMessage(clientid, jsonData);
			else if (request == "flip") 	  handleFlip(clientid, jsonData);
			else if (request == "get_leader_board") handleGetLeaderBoard(clientid, jsonData);
		}
        
        //delete any boards for which game is over.
        if(gameOver){
            Board *b = getBoard(gameOverBoardId);
            broadcastBoardDeleteEvent(gameOverBoardId);
            if(b) delete b;
            gameOver = false; 
            gameOverBoardId = 0;
        }
	}
	catch(syscallException &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: syscall exception:"<<ex.what();
	}
	catch(std::exception &ex)
	{
		std::cerr<<__FUNCTION__<<";caught: standard exception:"<<ex.what();
	}
	return;
}

static void
handleRequest(service *svc, int clientid, int channelid, std::string &data)
{
	processWsInput(clientid, nonconst(data.data()), data.size());
    return;
}

static void
handleControlMesg(service *svc, service::controlMessage &cmsg)
{
    if(cmsg.messageType == service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE)
            kickPlayerOut(cmsg.clientDeparture.clientid);
    return;
}

int
main(int ac, char **av)
{
	try {
        conn.connect("localhost");
        svc = new service("reversi");
        svc->setDataRecvHandler(handleRequest);
        svc->setControlRecvHandler(handleControlMesg);
        svc->run();
	}
	catch(syscallException &e) { std::cerr<<"crashed with exception "<<e.what(); }
	catch(std::exception &e) { std::cerr<<"crashed with exception "<<e.what(); }
	return 0;
}
