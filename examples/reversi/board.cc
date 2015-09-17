#include "board.hh"
#include "player.hh"
#include "common.hh"
#include "svclib.hh"
#define SIZE (8)

typedef boost::intrusive::set<Board, compare<std::greater<Board>>> boardListT;
boardListT boardList;
extern bool gameOver;
extern int gameOverBoardId;
extern service *svc;

std::string 
Board::getPlayer1LoginId()
{ 
    return _playerList[1] ? _playerList[1]->getLoginId() : ""; 
}

std::string 
Board::getPlayer2LoginId() 
{ 
    return _playerList[2] ? _playerList[2]->getLoginId() : ""; 
}

//get the filexfer object from the filedescriptor
Board*
getBoard(int id)
{
    boardListT::iterator itr;
    for(itr = boardList.begin(); itr != boardList.end(); itr++) 
        if(itr->getId() == id) return &(*itr);
    return NULL;
}

Board*
getBoard(std::string bname)
{
    boardListT::iterator itr;
    for(itr = boardList.begin(); itr != boardList.end(); itr++) 
        if(itr->getName() == bname) return &(*itr);
    return NULL;
}

int
Board::getId()
{
    return _id;
}

Board::Board(int  id, std::string name)
    :
    _id(id),
    _name(name),
    _started(false),
    _currentPlayerCount(0),
    flipCount(4), 
    whites(2), 
    blacks(2),
    turnPassed(false)
{
    _playerList[0] = _playerList[1] = _playerList[2] = NULL;
    for(int i = 0; i < SIZE; i++) 
        for(int j = 0; j < SIZE; j++) 
            _cells[i][j] = 0;
    boardList.push_back(*this); 
    return;
}

std::string
Board::getName()
{
    return _name;
}

Board::~Board()
{
    boardList.erase(boardListT::s_iterator_to(*this)); 
    return;
}

void
Board::restart()
{
    _cells[3][3] = _cells[4][4] = 1;
    _cells[3][4] = _cells[4][3] = 2;
    std::string event("event"), eventtype("board_reset");
    tupl tv[] = {
        {"mesgtype", event},
        {"eventtype", eventtype}, 
        {"boardid", _id},
    };
    JSONNode eventNode(JSON_NODE);
    putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
    string boardReset = eventNode.write_formatted();
    broadcast(boardReset.c_str(), boardReset.length());
    syncView();
    return;
}

void
Board::start()
{
    _cells[3][3] = _cells[4][4] = 1;
    _cells[3][4] = _cells[4][3] = 2;
    _started = true;
    std::string event("event"), eventtype("board_started");
    tupl tv[] = {
        {"mesgtype", event},
        {"eventtype", eventtype}, 
        {"boardid", _id},
        {"playercount", _currentPlayerCount},
    };

    JSONNode eventNode(JSON_NODE);
    putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
    string boardStarted = eventNode.write_formatted();
    broadcast(boardStarted.c_str(), boardStarted.length());
    syncView();
    //send turn request to the next player in the list.
    std::cerr<<"\nboardid:"<<_id<<" started";
    {
        std::string event("event"), eventtype("turn_event");
        tupl tv[] = {{"mesgtype", event}, {"eventtype", eventtype}, {"boardid", _id}, {"playerid", 1}};
        JSONNode eventNode(JSON_NODE);
        JSONNode possibleCells(JSON_ARRAY);
        int moves[64] = {0}, moveCount = 0;
        calculateMove(moves, &moveCount, 1, 2);
        possibleCells.set_name("possible_cells");
        for(int i = 0; i < moveCount; i++) possibleCells.push_back(JSONNode("", moves[i]));
        eventNode.push_back(possibleCells);
        putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
        string turnEvent = eventNode.write_formatted();
        svc->sendToClient(_playerList[1]->getConn(),
                -1,
                nonconst(turnEvent.c_str()),
                turnEvent.length());
        std::cerr<<"\nsent turn event to player:1";
        _playerList[1]->incrGamesPlayed();
        _playerList[2]->incrGamesPlayed();
    }
    return;
}

void 
Board::playerJoin(Player &p1)
{
    int  playerId = 0;
    for(int  i = 1; i < 3 ; i++){
        if(!_playerList[i]){
            _playerList[i] = &p1;
            _currentPlayerCount++;
            playerId = i;
            break;
        }
    }
    
    std::string event("event"), eventtype("player_join");
    tupl tv[] = {
        {"mesgtype", event},
        {"eventtype", eventtype}, 
        {"boardid", _id},
        {"playerid", playerId},
        {"loginid", _playerList[playerId]->getLoginId()},
        {"name",     _playerList[playerId]->getName()},
        {"playercount", getBoard(_id)->getCurrentPlayerCount()}
    };
    JSONNode eventNode(JSON_NODE);
    putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
    string playerJoinEvent = eventNode.write_formatted();
    universalBroadcast(playerJoinEvent.c_str(), playerJoinEvent.length());
    return;
}

void 
Board::playerLeave(Player &p2)
{
    int  playerId = 0;
    std::string lgid; 
    for(int  i = 1; i < 3; i++){
        if((_playerList[i]) && (_playerList[i]->getLoginId() == p2.getLoginId())){
            lgid = _playerList[i]->getLoginId();
            _playerList[i] = NULL;
            _currentPlayerCount--;
            playerId = i;
            break;
        }
    }

    std::string event("event"), eventtype("player_leave");
    tupl tv[] = {
        {"mesgtype", event},
        {"eventtype", eventtype}, 
        {"boardid", _id},
        {"playerid", playerId},
        {"loginid", lgid},
    };
    JSONNode eventNode(JSON_NODE);
    putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
    string playerLeftEvent = eventNode.write_formatted();
    broadcast(playerLeftEvent.c_str(), playerLeftEvent.length());
    return;
}

int  
Board::getPlayerId(std::string loginid)
{
    for(int  i = 1; i < 3; i++){
        if((_playerList[i]) && (_playerList[i]->getLoginId() == loginid)){
            return i;
        }
    }
    assert(0);
    return 0;
}

void
Board::broadcast(const char *buf, size_t bufSize)
{
    for(int  i = 1; i < 3; i++){
        if(_playerList[i]){
            svc->sendToClient(_playerList[i]->getConn(), 
                    -1,
                    nonconst(buf), 
                    bufSize);
        }
    }
    return;
}

//send the new board to all the players.
void 
Board::syncView()
{

    std::string event("event"), eventtype("board_update");
    tupl tv[] = {
        {"mesgtype", event},
        {"eventtype", eventtype}, 
        {"boardid", _id},
        {"whitecoins", whites},
        {"blackcoins", blacks},
    };
    JSONNode boardUpdate(JSON_NODE);
    putJsonVal(tv, sizeof(tv)/sizeof(tupl), boardUpdate);
    JSONNode cellArray(JSON_ARRAY);
    cellArray.set_name("map");
    for(int i = 0; i < SIZE; i++)
        for(int j = 0; j < SIZE; j++){
            JSONNode mapTuple(JSON_NODE);
            tupl boardPosition[] = {{"cellid", (i*8) + j}, {"value", _cells[i][j]}};
            putJsonVal(boardPosition, sizeof(boardPosition)/sizeof(tupl), mapTuple);
            cellArray.push_back(mapTuple);
        }
    boardUpdate.push_back(cellArray);
    size_t size = sizeof(tv)/sizeof(tupl);
    string boardUpdateResp = boardUpdate.write_formatted();
    broadcast(boardUpdateResp.c_str(), boardUpdateResp.length());
    //write(2, boardUpdateResp.c_str(), boardUpdateResp.length());
    return;
}


//calculate the possible moves for a player and return the count. 
void 
Board::calculateMove(int *moves, int *moveCount, int player, int opponent)
{
    int rowdelta = 0, coldelta = 0, row = 0, col = 0, x = 0, y = 0;
    for(row = 0; row < SIZE; row++)
        for(col = 0; col < SIZE; col++){
            if(_cells[row][col] != 0) 
                continue;                    

            for(rowdelta = -1; rowdelta <= 1; rowdelta++)
                for(coldelta = -1; coldelta <= 1; coldelta++){
                    if(row + rowdelta < 0 || row + rowdelta >= SIZE ||
                            col + coldelta < 0 || col + coldelta >=  SIZE ||
                            (rowdelta ==0 && coldelta==0)) 
                        continue;

                    if(_cells[row + rowdelta][col + coldelta] == opponent){
                        x = row + rowdelta;
                        y = col + coldelta;
                        for(;;){
                            x += rowdelta;     
                            y += coldelta;  

                            if(x < 0 || x >= SIZE || y < 0 || y >= SIZE) 
                                break;

                            if(_cells[x][y] == 0)  
                                break;
                            if(_cells[x][y] == player){
                                moves[(*moveCount)++] = row*SIZE + col;
                                break;
                            }
                        }
                    }
                }
        }
    return;
}

void 
Board::makeMove(int row, int col, int player, int opponent)
{
    //std::cerr<<"\nmake move : row: "<<row<<" col: "<<col<<" player: "<<player;
    int rowdelta = 0, coldelta = 0, x = 0, y = 0;              
    _cells[row][col] = player;

    for(rowdelta = -1; rowdelta <= 1; rowdelta++)
        for(coldelta = -1; coldelta <= 1; coldelta++){
            if(row + rowdelta < 0 || row + rowdelta >= SIZE ||
                    col + coldelta < 0 || col + coldelta >= SIZE ||  
                    (rowdelta ==0 && coldelta == 0))
                continue;

            if(_cells[row + rowdelta][col + coldelta] == opponent){
                x = row + rowdelta;
                y = col + coldelta;

                for(;;){
                    x += rowdelta;
                    y += coldelta;

                    if(x < 0 || x >= SIZE || y < 0 || y >= SIZE)
                        break;

                    if(_cells[x][y] == 0)
                        break;

                    if(_cells[x][y] == player){
                        while(_cells[x -= rowdelta][y -= coldelta] == opponent) _cells[x][y] = player;
                        break;
                    }
                }
            }
        }

    //after every move the old count becomes obsolete.
    whites = 0; 
    blacks = 0; 
    flipCount = 0;

    for(int i = 0; i < SIZE; i++)
        for(int j = 0; j < SIZE; j++){
            if(_cells[i][j] == 1){ whites++; flipCount++; }
            else if(_cells[i][j] == 2){ blacks++; flipCount++; }
        }
    return;
}

//check what are the valid positions for the 
void 
Board::flip(int playerId, int cellIndex)
{
    if(cellIndex >= 0){
        makeMove(cellIndex / SIZE,  cellIndex % SIZE, playerId, playerId == 1 ? 2 : 1);
        syncView();
    }
    //send turn event to the next player.
    {
        int moves [64] = {0}, moveCount = 0;
        calculateMove(moves, &moveCount, playerId == 1 ? 2 : 1, playerId);
        std::string event("event"), eventtype("turn_event");
        tupl tv[] = {{"mesgtype", event}, {"eventtype", eventtype}, {"boardid", _id}, {"playerid", playerId == 1 ? 2 : 1}};
        JSONNode eventNode(JSON_NODE);
        JSONNode possibleCells(JSON_ARRAY);
        possibleCells.set_name("possible_cells");
        for(int i = 0; i < moveCount; i++) possibleCells.push_back(JSONNode("", moves[i]));
        eventNode.push_back(possibleCells);
        putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
        string turnEvent = eventNode.write_formatted();
        Player *p = _playerList[playerId == 1 ? 2 : 1];
        if(p){
            svc->sendToClient(p->getConn(),
                    -1,
                    nonconst(turnEvent.c_str()),
                    turnEvent.length());
        } 
        if((flipCount == 64) || (turnPassed == 2)){
            std::string event("event"), eventtype("game_over_event");
            int winnerid = whites > blacks ? 1 : 2;
            tupl tv[] = 
            {
                {"mesgtype", event},
                {"eventtype", eventtype},
                {"boardid", _id},
                {"winner", winnerid},
            };
            JSONNode eventNode(JSON_NODE);
            putJsonVal(tv, sizeof(tv)/sizeof(tupl), eventNode);
            string gameOverEvent = eventNode.write_formatted();
            broadcast(gameOverEvent.c_str(), gameOverEvent.length());
            _started = false;
            //mark the board for deletion as the game is over now. 
            gameOver = true;
            gameOverBoardId = _id;
            _playerList[winnerid]->incrGamesWon();
            _playerList[winnerid]->calculateScore();
            _playerList[winnerid == 1 ? 2 : 1]->calculateScore();
            return;
        }
    }
    return;
}

void 
sendBoardList(int clnt, std::string cookie)
{
    boardListT::iterator itr;
    int  sendCount = 200;
    for(itr = boardList.begin(); 
            (itr != boardList.end()) && 
            sendCount; 
            itr++, sendCount--){
        Board *b = &(*itr);
        //send turn request to the next player in the list.
        std::string mesgtype("response"), response("board_list");
        tupl tv[] = 
        {
            {"mesgtype", mesgtype},
            {"response", response}, 
            {"cookie", cookie},
            {"boardid", b->getId()},
            {"boardname", b->getName()},
            {"started", b->isStarted() ? "true" : "false"},
            {"playercount", b->getCurrentPlayerCount()},
            {"player1", b->getPlayer1LoginId()},
            {"player2", b->getPlayer2LoginId()},
        };
        JSONNode respNode(JSON_NODE);
        putJsonVal(tv, sizeof(tv)/sizeof(tupl), respNode);
        string respBuf = respNode.write_formatted();
        svc->sendToClient(clnt,
                -1,
                nonconst(respBuf.c_str()), 
                respBuf.length());
    }
    return;
}
