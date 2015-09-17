#ifndef __INC_BOARD_H__
#define __INC_BOARD_H__

#include <string>
#include <boost/intrusive/set.hpp>
#include "game.hh"
#include "player.hh"

using namespace boost::intrusive;
using namespace std;
class Board : public set_base_hook<optimize_size<true>>
{
    int           _id;
    std::string  _name;
    bool          _started;
    uint8_t      _currentPlayerCount;
    Player          *_playerList[3]; //playerid is the index in to this array.
    int          _cells[8][8];
    int          flipCount; 
    int          whites;
    int          blacks;

    public:
    int         turnPassed;
    void flip(int, int);
    Board(int , std::string name="");
    ~Board();
    void restart();
    void start();
    void playerJoin(Player &);
    void playerLeave(Player &);
    void syncView();
    int getId();
    std::string getName();
    int  getPlayerId(std::string);
    friend bool operator < (const Board &b1, const Board &b2) { return b1._id > b2._id; }
    friend bool operator > (const Board &b1, const Board &b2) { return b1._id < b2._id; }
    friend bool operator == (const Board &b1, const Board &b2) { return b1._id == b2._id; }
    std::string getPlayer1LoginId();
    std::string getPlayer2LoginId();
    bool isStarted(){ return _started; }
    void broadcast(const char *, size_t);
    int inline getCurrentPlayerCount() { return _currentPlayerCount; }
    void calculateMove(int *, int *, int, int);
    void makeMove(int, int, int, int);
};

Board* getBoard(int );
Board* getBoard(std::string);
void sendBoardList(int , std::string);

#endif
