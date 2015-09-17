#ifndef __INC_PLAYER_H__
#define __INC_PLAYER_H__

#include <string>
#include <boost/intrusive/options.hpp>
#include <boost/intrusive/set.hpp>
#include <mongo/client/dbclient.h>
#include "game.hh"
#include "board.hh"

using namespace std;
using namespace boost::intrusive;

class Player : public set_base_hook<optimize_size<true>>
{
	int  _id;
	int32_t  _conn; //network connection representing the player.
	std::string _loginid; //facebook id of the player.
	int  _boardId; //board id if he is playing.
	std::string _name;//name of the player.
	bool _canMove; //set to true on first 4 or 8.
	uint32_t _homeCount; //incremented when the pawn reaches central square.
    int _gamesPlayed; // number of games played.
    int _gamesWon; //number of games won.
    int _score; //win rate.

    void _load(mongo::BSONObj &dbObj);
    void _save(); //save the player to the mongodb.

	public:
	bool gatePass; //set to true when the player makes his first kill.
	Player(int , int, std::string, std::string);
	~Player();
	void setBoardId(int  id);
	int  getBoardId();
	friend bool operator < (const Player &p1, const Player &p2){ return p1._id > p2._id; }
	friend bool operator > (const Player &p1, const Player &p2){ return p1._id < p2._id; }
	friend bool operator == (const Player &p1, const Player &p2){ return p1._id == p2._id; } 
	std::string getLoginId();
	int  getId();
	int getConn();
	std::string getName();
	void setName(std::string);
	bool inline canMove(){ return _canMove; }
	void inline enableMove(){ _canMove = true; return; }
	void inline incrHomeCount(){ _homeCount++; return; }
	uint32_t inline getHomeCount(){ return _homeCount; }
    void inline incrGamesPlayed(){ _gamesPlayed++; _save(); return; }
    void inline incrGamesWon(){ _gamesWon++; _save(); return; }
    void inline calculateScore(){ _score = _gamesWon ? (_gamesWon*100)/_gamesPlayed : 0; _save(); return; }
};

Player* getPlayer(int  id);
Player* getPlayer(std::string login);
void universalBroadcast(const char *buf, size_t bufSize);
void kickPlayerOut(int client);
void broadcastBoardDeleteEvent(int boardid);
void sendPlayerList(int);
#endif
