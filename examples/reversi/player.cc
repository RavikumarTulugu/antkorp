
#include "common.hh"
#include "board.hh"
#include "player.hh"
#include "svclib.hh"

extern mongo::DBClientConnection conn;
typedef boost::intrusive::set<Player, compare<std::greater<Player>>> playerListT;
playerListT playerList;
extern service *svc;

Player::Player(int id, int clnt, std::string loginid, std::string name)
	:
	_id(0),
	_conn(clnt),
	_loginid(loginid),
	gatePass(false),
	_canMove(false),
	_name(name),
	_homeCount(0),
    _gamesPlayed(0), 
    _gamesWon(0), 
    _score(0)
{
	playerList.push_back(*this); 
    mongo::BSONObj _o = conn.findOne("reversi.players", QUERY("loginid"<< loginid));
    if (!_o.isEmpty())
        _load(_o);
    else{
        std::cerr<<"\nPlayer info missing in database, New player i guess.";
        _save();
    }
	return;
}

Player::~Player()
{
	playerList.erase(playerListT::s_iterator_to(*this)); 
	return;
}

int
Player::getId()
{
	return _id;
}

std::string
Player::getLoginId()
{
	return _loginid;
}

//get the filexfer object from the filedescriptor
Player*
getPlayer(int id)
{
	playerListT::iterator itr;
	for(itr = playerList.begin(); itr != playerList.end(); itr++) 
		if(itr->getId() == id) return &(*itr);
	return NULL;
}

Player*
getPlayer(std::string login)
{
	playerListT::iterator itr;
	for(itr = playerList.begin(); itr != playerList.end(); itr++) 
		if(itr->getLoginId() == login) return &(*itr);
	return NULL;
}

int 
Player::getConn()
{
	return _conn;
}

void
Player::setBoardId(int boardid)
{
	_boardId = boardid;
	return;
}

int
Player::getBoardId()
{
	return _boardId;
}

std::string
Player::getName()
{
	return _name;
}

void
Player::setName(std::string name)
{
	_name.assign(name);
	return;
}

void
Player::_load(mongo::BSONObj &dbObj)
{
    _gamesPlayed = dbObj["played"].number();
    _gamesWon    = dbObj["won"].number();
    _score       = dbObj["score"].number();
	return;
}

void
Player::_save()
{
    mongo::BSONObjBuilder obld;
    obld.append("loginid", _loginid);
    obld.append("played", _gamesPlayed);
    obld.append("won", _gamesWon);
    obld.append("score", _score);
    conn.update("reversi.players", QUERY("loginid"<<_loginid), obld.obj(), true);
    std::string error = conn.getLastError();
    if (error.size()) std::cerr<<"\nError doing update : "<<error;
	return;
}

void
sendNewBoardEvent(Board *b)
{
	playerListT::iterator itr;
	for(itr = playerList.begin(); itr != playerList.end(); itr++){
		int clnt = (*itr).getConn();
		std::string event("event"), eventtype("new_board");
		tupl tv[] = {
			{"mesgtype", event},
			{"eventtype", eventtype}, 
			{"boardid", b->getId()},
			{"boardname", b->getName()},
			{"player1", b->getPlayer1LoginId()},
			{"player2", b->getPlayer2LoginId()},
		};
		JSONNode eventNode(JSON_NODE);
		putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
		string rollStart = eventNode.write_formatted();
		string newBoardEvent = eventNode.write_formatted();
		svc->sendToClient(clnt,
				-1,
				nonconst(newBoardEvent.c_str()), 
				newBoardEvent.length());
	}
}

void
universalBroadcast(const char *buf, size_t bufSize)
{
	playerListT::iterator itr;
	for(itr = playerList.begin(); itr != playerList.end(); itr++){
		int clnt = (*itr).getConn();
		if (clnt)
			svc->sendToClient(clnt, -1, nonconst(buf), bufSize);
	}
	return;
}

void 
broadcastBoardDeleteEvent(int boardid)
{
	std::string event("event"), eventtype("board_deleted");
	tupl tv[] = {
		{"mesgtype", event},
		{"eventtype", eventtype}, 
		{"boardid", boardid},
	};
	JSONNode eventNode(JSON_NODE);
	putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
	string boardDeleteEvent = eventNode.write_formatted();
	universalBroadcast(boardDeleteEvent.c_str(), boardDeleteEvent.length());
	return;
}

//hunt the player with the given client connection and delete him. 
//the client has closed the connection or he is not reachable. 
//send all the remaining players a player logged out event.
extern int boardCount;
void
kickPlayerOut(int client)
{
	playerListT::iterator itr;
	Player *p = NULL;
	for(itr = playerList.begin(); itr != playerList.end(); itr++){
		if(client == (*itr).getConn()){
			Board *b = getBoard((*itr).getBoardId());
			if(b){
				b->playerLeave(*itr);
				p = &(*itr);
				//delete the board if he is the last player.
				if(b->getCurrentPlayerCount() == 0){
					broadcastBoardDeleteEvent(b->getId());
					boardCount--;
					delete b;
				}
				p->setBoardId(0);
			}else{
				p = &(*itr);
                if(p){
                    std::string event("event"), eventtype("player_logout");
                    tupl tv[] = {
                        {"mesgtype", event},
                        {"eventtype", eventtype},
                        {"loginid", p->getLoginId()}
                    };
                    JSONNode eventNode(JSON_NODE);
                    putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
                    string playerLogoutEvent = eventNode.write_formatted();
                    universalBroadcast(nonconst(playerLogoutEvent.c_str()), playerLogoutEvent.length());
                }
				break;
			}
		}
	}
	if(p) delete p;
	return;
}

//send a sequence of player login events.
void 
sendPlayerList(int client)
{
    playerListT::iterator itr;
    uint32_t count = 200;
    for(itr = playerList.begin(); (itr != playerList.end()) && count && ((*itr).getConn() != client); itr++, count--){
        std::string event("event"), eventtype("player_login");
        tupl tv[] = {
            {"mesgtype", event},
            {"eventtype", eventtype},
            {"loginid", (*itr).getLoginId()},
        };
        JSONNode eventNode(JSON_NODE);
        putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
        string playerLoginEvent = eventNode.write_formatted();
        svc->sendToClient(client, 
                -1,
                nonconst(playerLoginEvent.c_str()), 
                playerLoginEvent.length());
    }
    return;
}
