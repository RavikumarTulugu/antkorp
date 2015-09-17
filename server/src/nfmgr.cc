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

//File contains the implementation for the antkorp file manager 
//file manager handles the commands for the folder and xfers to 
//and from the client.
//FIXME: implement memory pools for all objects in system. for read use shared lock for write use exclusive lock.
//FIXME: implement file locking so that 2 operations are not accessing the same file simultaneously
//FIXME: implement buffers and a separate output and input queue to further reduce the contention on the output 
//path.
//FIXME: implement stat record caching to reduce going in to the kernel for frequently used directories. 
//FIXME: run thread sanitizer and address sanitizer on the nfmgr <ever recurring task. >
//FIXME: mutrace to analyze the lock contention in the nfmgr code.
//FIXME: migrate to the boost.afio some time in future when its ready.
//FIXME: remove hard code references to the mongodb collection namespaces, use resolution functions.
//XXX:
//There exists still a race conditon between die() and the disposeXfer routines. 
//it only occurs when the connection is closed immediatly after sending the last packet of 
//xfer.
#include <ftw.h>
#include <fnmatch.h>
#include <libgen.h>
#include <dirent.h>
#include <sys/time.h>
#include <sys/resource.h>
#include <sys/file.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/signalfd.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <sys/inotify.h>
#include <signal.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <semaphore.h>
#include "JSON_Base64.h"
#include "akorpdefs.h"
#include "common.hh"
#include "mongo/client/dbclient.h"
#include <boost/filesystem.hpp>
#include <boost/checked_delete.hpp>
#include <boost/intrusive/options.hpp>
#include <boost/intrusive/slist.hpp>
#include <boost/intrusive/slist_hook.hpp>
#include <boost/intrusive/set.hpp>
#include <boost/archive/iterators/base64_from_binary.hpp>
#include <boost/archive/iterators/binary_from_base64.hpp>
#include <boost/archive/iterators/insert_linebreaks.hpp>
#include <boost/archive/iterators/transform_width.hpp>
#include <boost/archive/iterators/ostream_iterator.hpp>
#include <boost/utility/string_ref.hpp>
#include <algorithm>
#include <map>
#include <list>
#include <tuple>
#include <cassert>
#include <iostream>
#include <chrono>
#include "mime_types.hh"
#include "trie.hh"
#include "svclib.hh"
#include "reactor.hh"
#include <fcntl.h>           /* For O_* constants */
#include <sys/stat.h>        /* For mode constants */
#include <mqueue.h>
#include <attr/xattr.h>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include "config/asio_no_tls_client.hpp"
#include "message_buffer/alloc.hpp"
#include "ocache.hh"
#include "client.hpp"
#include "tpool.hh"
#include "log.hh"
#include "config.hh"
#include "nfmgr.hh"
#include <pthread.h>
#include "dtl/dtl.hpp"
extern "C" {
    #include "lua.h"
    #include "lualib.h"
    #include "lauxlib.h"
}

static std::string mongo_db_ip = "127.0.0.1";
static std::string debug_level = "error";
static std::string log_file = "/var/log/antkorp/fmgr";
static int thread_count = 100;
static std::string storage_base;
static bool cloudDeployment = true;
static Trie<statRecord> *statCache = nullptr; //cache storing the stat records in the user land.
using namespace boost::archive::iterators;
typedef base64_from_binary<transform_width<const char *, 6, 8>> binToBase64;
typedef binary_from_base64<transform_width<const char *, 8, 6>> base64ToBin;

static const int kPageSize = 4096;
static const int diskBlockSize = 64*kPageSize;

class fileXfer;
static void add2XferTbl(fileXfer *xfer);
static void delFromXferTbl(fileXfer *xfer);

class fsCommand;
static void add2CmdTbl(fsCommand *);
static void delFromCmdTbl(fsCommand*);
static fsCommand* getFsCommand(std::string );

class fileSearch;
static void add2SrchTbl(fileSearch *srch);
static void delFromSrchTbl(fileSearch *srch);

static std::vector<int> getGroupMemberList(int groupId);
static void writeFmgrReply(int, const char *, size_t);
static void readResponse(int, std::string, size_t, std::string);
static service *svc = nullptr;
static ThreadPool *tPool = nullptr;
static int signalFd = -1;
static int inotifyFd = -1;
static lua_State *L = nullptr;
static mongo::DBClientConnection conn(true, nullptr);
static std::mutex luaStateMutex; //grab the lock to operate on the mogodb 
static std::mutex gSvcLock;
static std::mutex dbMutex; //grab the lock to operate on the mogodb 
//kill the child with the given pid.
static void killChild(pid_t child) { if(child) kill(child, SIGKILL); return; }

//get the directory name given the path.
static std::string 
getDirName(std::string fpath)
{
    std::string dname;
    dname.assign(fpath, 0, fpath.find_last_of('/'));
    return dname;
}

//given a full path of file name give the name of the root folder.
//the organization folder will be at storage_base/orgname
//the groups and users folder will be located at storage_base/orgname/groups
//the groups and users folder will be located at storage_base/orgname/users
static std::string
deriveRoot(std::string fname)
{
    std::string root;
    std::string residue = fname.substr(storage_base.length());
    if (residue.find_first_of('/') != std::string::npos) 
        root.assign(residue, 0, residue.find_first_of('/'));
    root = storage_base + root;
    return root;
}

enum commandType
{
	CREATE_FILE, //create a new file.
	CREATE_DIR, //create a new directory.
	REMOVE, //remove a file or directory.
	MOVE,  //move a file or directory to a new location.
	COPY,  //copy a file or directory to a new location.
    ZIP, //zip the file.
    UNZIP //unzip the file.
};

//inotify watch list.
//list of watch records for tracking the directories.
//each directory contains the watch descriptor and the fqpn of the directory and the reference 
//count, no duplicate watch records will be created for any directory instead the reference 
//count will be incremented and the record will be freed when the last client navigates.
typedef std::tuple<int, std::list<int>> watchTuple;
typedef std::map<std::string, watchTuple> watchListT;
static watchListT watchList;

static std::string
getDirForWatchDescriptor(int wd)
{
    for(auto &kv : watchList){
        auto tpl = kv.second;
        if (std::get<0>(tpl) == wd)
            for(auto &itr : std::get<1>(tpl))
                return kv.first;
    }
    return "";
}

//print the watch list 
//used for debugging purposes.
static void 
printWatchList()
{
    for(auto &kv : watchList){
        _info<<"directory: "<<kv.first;
        _info<<"wd: "<<std::get<0>(kv.second);
        for(auto &itr : std::get<1>(kv.second)) 
            _info<<"client: "<<itr;
    }
    return;
}

//if the file is a regular file then ask file system, 
//else get the counters from the xattr data.
static uint64_t 
getFileSize(std::string dname)
{
    struct stat sb = {0};
    _except(stat(dname.c_str(), &sb));
    return sb.st_size;
}

static fileAttribRecord
getFileAttrib(std::string fname)
{
    char attribBuf[1024] = {'\0'};
    int rc = _except(getxattr(fname.c_str(), 
                FILE_ATTRIB_META_DATA, 
                attribBuf, 
                sizeof(attribBuf)));
    std::string json(attribBuf, rc);
    return std::move(fileAttribRecord::fromJson(json));
}

static fileAttribRecord
getFileAttribCopy(std::string fname)
{
    char attribBuf[1024] = {'\0'};
    int rc = _except(getxattr(fname.c_str(), 
                FILE_ATTRIB_META_DATA, 
                attribBuf, 
                sizeof(attribBuf)));
    std::string json(attribBuf, rc);
    return (fileAttribRecord::fromJson(json));
}

static void
setFileAttrib(std::string &fname, fileAttribRecord &fattr)
{
    std::string json = std::move(fileAttribRecord::toJson(fattr));
    if(json.length()){
        _except(setxattr(fname.c_str(), 
                    FILE_ATTRIB_META_DATA, 
                    json.data(), 
                    json.length(), 
                    0));
    }
    return;
}

//emit notification calls in to the lua for emitting notification.
static void
emitNotification(int sender,
        int gid,
        std::string &category,
        std::string &notiftype,
        std::string &oid,
        std::vector<int> &recievers,
        std::string &description,
        std::string &preview)
{
    lua_getglobal(L, "file_manager_notification");
    __LUA_PUSHNUMBER(L, sender);
    __LUA_PUSHNUMBER(L, gid);
    __LUA_PUSHSTRING(L, category.c_str());
    __LUA_PUSHSTRING(L, notiftype.c_str());
    __LUA_PUSHSTRING(L, oid.c_str());
    //push vector as a list to lua.
    unsigned int count = 0;
    lua_newtable(L);
    for(auto i : recievers){
        __LUA_PUSHNUMBER(L, i);
        lua_rawseti(L, -2, count + 1);
        count++;
    }
    __LUA_PUSHSTRING(L, description.c_str());
    __LUA_PUSHSTRING(L, preview.c_str());
    int rc = lua_pcall(L, 8, LUA_MULTRET, 0); //actuall call to lua
    if(rc) _error<<"lua_pcall() returned error:"<<rc<<
        " for file_manager_notification() error: "<<std::string(lua_tostring(L, -1));
    else lua_tointeger(L, -1);
    lua_settop(L, 0);
    return;
}

//log activity on the file. 
//its a simple string which is cooked at the time of notification itself.
//calls in to lua to call the log activity function.
//better do it in a thread.
void
logFileActivity(int uid, int gid, std::string oid, std::string activity)
{
    std::unique_lock<std::mutex> lock(luaStateMutex);
    lua_getglobal(L, "log_file_activity");
    __LUA_PUSHNUMBER(L, uid);
    __LUA_PUSHNUMBER(L, gid);
    __LUA_PUSHSTRING(L, oid.c_str());
    __LUA_PUSHSTRING(L, activity.c_str());
    int rc = lua_pcall(L, 4, LUA_MULTRET, 0); //actuall call to lua
    if(rc) _error<<"lua_pcall() returned error:"<<rc<<" for log_file_activity()"
    <<"error :"<<std::string(lua_tostring(L, -1));
    lua_settop(L, 0);
    return;
}

static void
notify(int uid, 
        int gid, 
        std::string &dname, 
        std::string &notiftype, 
        std::string &description, 
        std::string preview = ""
        )
{
    std::unique_lock<std::mutex> lock(luaStateMutex);
    fileAttribRecord blob(getFileAttrib(dname));
    std::string category = "file";
    if(blob.followers.size() > 1) 
        emitNotification(uid, 
                gid, 
                category, 
                notiftype, 
                dname, 
                blob.followers, 
                description, 
                preview);
    return;
}

//notify all the interesting parties about the share availability/unavailability.
static void
shareNotify(int uid, 
            int gid, 
            std::vector<int> followers,
            std::string &dname, 
            std::string &notiftype, 
            std::string &description, 
            std::string preview = ""
            )
{
    std::unique_lock<std::mutex> lock(luaStateMutex);
    fileAttribRecord blob(getFileAttrib(dname));
    std::string category = "file";
    if(followers.size())
        emitNotification(uid, 
                gid, 
                category, 
                notiftype, 
                dname, 
                followers, 
                description, 
                preview);
    return;
}

static void
setLuaServiceHandle(service *svc)
{
    std::unique_lock<std::mutex> lock(luaStateMutex);
    assert(svc);
    lua_getglobal(L, "setservicehandle");
    __LUA_PUSHLIGHTUSERDATA(L, reinterpret_cast<void*>(svc));
    int rc = lua_pcall(L, 1, LUA_MULTRET, 0); //actuall call to lua
    if(rc) _error<<"lua_pcall() returned error:"<<rc
        <<" for setservicehandle()"<<" error : "<<std::string(lua_tostring(L, -1));
    lua_settop(L, 0);
    return;
}

//takes care of updating the followers in the attached kons if 
//there is a change in the followers of the file.
//The follower needed to added/removed through the whole hierarchy 
//of the kons.
static void
addKonsFollowers(int uid, std::string konsid)
{
    std::unique_lock<std::mutex> lock(luaStateMutex);
    lua_getglobal(L, "addfollowertokonsattached2file");
    __LUA_PUSHNUMBER(L, uid);
    __LUA_PUSHSTRING(L, konsid.c_str());
    int rc = lua_pcall(L, 2, LUA_MULTRET, 0);
    if(rc) _error<<"lua_pcall() returned error:"<<rc<<" for addKonsFollowers()"
        <<" error: "<<std::string(lua_tostring(L, -1));
    lua_settop(L, 0);
    return;
}

static void
delKonsFollowers(int uid, std::string konsid)
{
    std::unique_lock<std::mutex> lock(luaStateMutex);
    lua_getglobal(L, "remfollowerfromkonsattached2file");
    __LUA_PUSHNUMBER(L, uid);
    __LUA_PUSHSTRING(L, konsid.c_str());
    int rc = lua_pcall(L, 2, LUA_MULTRET, 0);
    if(rc) _error<<"lua_pcall() returned error:"<<rc<<" for delKonsFollowers()"
        <<" error: "<<std::string(lua_tostring(L, -1));
    lua_settop(L, 0);
    return;
}

//Add a watch to the watchlist, if its already present then increment the reference count of the watch.
static void
trackDir(std::string fqpn, int client)
{
    watchListT::iterator itr = watchList.find(fqpn);
    if (itr != watchList.end()){
        auto tpl = (*itr).second;
        std::get<1>(tpl).push_back(client);
        _info<<"Tracker added for directory:"<<fqpn
            <<" client:"<<client
            <<" watch desciptor:"<<std::get<0>(tpl);
        return;
    }
    int wd = _except(inotify_add_watch(inotifyFd, 
                fqpn.c_str(), 
                IN_CREATE | IN_DELETE | IN_DELETE_SELF | IN_MOVE_SELF | \
                IN_CLOSE_WRITE));
    watchList.insert(std::make_pair(fqpn, std::make_tuple(wd, std::list<int>())));
    std::get<1>((*watchList.begin()).second).push_back(client);
    _info<<"Tracker added for directory:"<<fqpn
        <<" client:"<<client
        <<" watch desciptor:"<<wd;
    return;
}

//delete a watch from the watch list , decrement the reference count if the reference count becomes 0 
//then do the actual deletion.
static void 
unTrackDir(std::string fqpn, int client) 
{
    watchListT::iterator itr = watchList.find(fqpn);
    if (itr != watchList.end()){
        auto tpl = (*itr).second;
        std::get<1>(tpl).remove(client);
        if (std::get<1>(tpl).size() == 0){
            _except(inotify_rm_watch(inotifyFd, std::get<0>(tpl)));
            watchList.erase(itr);
            _info<<"Tracker removed for directory:"<<fqpn<<" client:"<<client;
        }else
            _info<<"Tracker removed for directory:"<<fqpn<<" client:"<<client;
        return;
    }
    return; 
}

static void
event2Client(int client, std::string &eventtype, std::string &dname)
{
    std::string event("event");
    tupl tv[] = {
        {"mesgtype",  event},
        {"eventtype", eventtype},
        {"file", dname},
    };
    size_t size = sizeof(tv)/sizeof(tupl);
    string json = putJsonVal(tv, size);
    writeFmgrReply(client, json.c_str(), json.length());
    return;
}

static void
error2Client(int client, std::string &cookie, std::string emsg)
{
    std::string error("error");
    tupl tv[] = {
        {"mesgtype",  error},
        {"cookie"  ,  cookie},
        {"error"    ,  emsg}
    };
    size_t size = sizeof(tv)/sizeof(tupl);
    string json = putJsonVal(tv, size);
    writeFmgrReply(client, json.c_str(), json.length());
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
	writeFmgrReply(clientid, json.c_str(), json.length());
	return;
}

//check if the file is locked and reject the operation with the error.
#define checkFileLocked(__attrib, __client, __cookie, __uid, __gid, __error){ \
    if(__attrib.locked && (__attrib.lockedBy != __uid)){                      \
        error2Client(__client, __cookie, __error);                            \
        return;                                                               \
    }                                                                         \
}                                                      

static std::string
getGroupName(int gid)
{
    //Try to find whether its in the shared cache. 
    std::string gname = "";
    if(!gid) return gname;
    gname = getGnameForGid(gid);
    if(gname.size()) return gname;
    std::unique_lock<std::mutex> lock(dbMutex);
    mongo::BSONObj _o = conn.findOne("akorpdb.groups", QUERY("gid"<< gid));
    if (_o.isEmpty()){ _error<<"Unable to find the group with id:"<<gid; return gname; }
    gname = _o["gname"].String();
    //Add it to the shared cache.
    if(gname.size()) addGnameAndGid(gid, gname);
    return gname;
}

static int
getGroupOwner(int gid)
{
    //Try to find whether its in the shared cache. 
    std::unique_lock<std::mutex> lock(dbMutex);
    mongo::BSONObj _o = conn.findOne("akorpdb.groups", QUERY("gid"<< gid));
    if (_o.isEmpty()){ _error<<"Unable to find the group with id:"<<gid; return -1; }
    int groupOwner = _o["admin"].number();
    return groupOwner;
}

static std::string 
getUserName(int uid)
{
    std::string uname = "";
    if(!uid) return uname;
    uname = getUnameForUid(uid);
    if(uname.size()) return uname;
    //Try to find whether its in the shared cache. 
    std::unique_lock<std::mutex> lock(dbMutex);
    mongo::BSONObj _o = conn.findOne("akorpdb.users", QUERY("uid"<< uid));
    if (_o.isEmpty()){ _error<<"Unable to find the user with id:"<<uid; return uname; }
    uname = _o["uname"].String();
    //Add it to the shared cache.
    if(uname.size()) addUnameAndUid(uid, uname);
    return uname;
}

//file taken from the examples directory 
//in C++ dtl diff library.
static void 
unifiedDiff (string fp1, string fp2, std::stringstream &ss) 
{
    typedef std::string                 elem;
    typedef std::vector< elem >         sequence;
    typedef std::pair< elem, dtl::elemInfo > sesElem;

    ifstream      Aifs(fp1.c_str());
    ifstream      Bifs(fp2.c_str());
    elem          buf;
    sequence      ALines, BLines;
    
    while(getline(Aifs, buf)) ALines.push_back(buf);
    while(getline(Bifs, buf)) BLines.push_back(buf);
    
    dtl::Diff< elem > diff(ALines, BLines);
    diff.onHuge();
    diff.compose();
    dtl::uniHunk< sesElem > hunk;
    diff.composeUnifiedHunks();
    diff.printUnifiedFormat(ss);
    return;
}

//run the event loop for all the stream sockets sent by the 
//gw server.
class fileSearch : public boost::intrusive::set_base_hook<boost::intrusive::optimize_size<true>>
{
    int _client = -1;
    std::string _cookie = "";
    volatile bool _askedToStop = false;
    volatile bool _working = false;
    std::string _key = "";
    boost::filesystem::path _startAt;

    public:
    std::string& getClientCookie() { return _cookie; }
    fileSearch(int client, 
            std::string cookie, 
            std::string dname,
            std::string key) :
        _client(client),
        _cookie(cookie),
        _key(key),
        _startAt(dname){
            add2SrchTbl(this);
            return;
        }

    void stop() { _askedToStop = true; }
    void _run()
    {
        SCOPE_EXIT{ _working = false; };
        _info<<"\nnew search for:"<<_key;
        boost::filesystem::recursive_directory_iterator _walker(_startAt);
        char needle[256] = {'\0'};
        sprintf(needle, "*%s*", _key.c_str());
        while (_walker != boost::filesystem::recursive_directory_iterator())
        {
            //std::cerr<<"\n"<<_walker->path().string();
            if (!_askedToStop && !(fnmatch(needle, _walker->path().string().c_str(),
                            FNM_CASEFOLD))){
                struct stat sb = {0};
                int rc = stat(_walker->path().string().c_str(), &sb);
                if(rc < 0){
                    _error<<"\nstat() call failed for file:"<<_walker->path().string()
                        <<"error:"<<std::string(strerror(errno)); 
                    ++_walker;
                    continue;
                }
                boost::filesystem::path fullpath(_walker->path().string());
                std::string _fpath = fullpath.parent_path().string();
                std::string response("response");
                uint64_t fileSize = getFileSize(_fpath);
                tupl tv[] = {
                    {"mesgtype", response},
                    {"cookie"  , _cookie},
                    {"fpath", _fpath},
                    {"fname", _walker->path().string()},
                    {"isdir", std::string(S_ISDIR(sb.st_mode) ? "true" : "false")},
                    {"size",  fileSize}
                };
                size_t size = sizeof(tv)/sizeof(tupl);
                string json = putJsonVal(tv, size);
                writeFmgrReply(_client, json.c_str(), json.length());
            }
            if(_askedToStop){
                _info<<"\nsearch worker asked to stop: exiting ..";
                break;
            }
            ++_walker;
        }

        if(!_askedToStop){ 
            _info<<"\nsearch worker died a natural death.";
            _working = false;
            die(); //natural death.
        }
        return;
    }
    void die(){ delete this; }
    bool isBusy() { return _working == true; }
    void run()
    {
        _working = true;
        tPool->enqueue(std::bind(&fileSearch::_run, this)); 
        return;
    }

    ~fileSearch(){ delFromSrchTbl(this); return; }
    int getClient() { return _client; }
    friend bool operator < (const fileSearch &a, const fileSearch &b) 
    { return a._cookie < b._cookie; }
    friend bool operator > (const fileSearch &a, const fileSearch &b) 
    { return a._cookie > b._cookie; }
    friend bool operator == (const fileSearch &a, const fileSearch &b) 
    { return a._cookie == b._cookie; }
};

typedef boost::intrusive::set<fileSearch, \
            boost::intrusive::compare<std::greater<fileSearch>>> \
            fileSrchTable;
fileSrchTable srchTbl;
static std::mutex srchTblLock;

static void 
add2SrchTbl(fileSearch *srch)
{ 
	std::unique_lock<std::mutex> uniqueLock(srchTblLock);
	srchTbl.push_back(*srch); 
	return; 
}

static void 
delFromSrchTbl(fileSearch *srch) 
{ 
	std::unique_lock<std::mutex> uniqueLock(srchTblLock);
	if(srch->is_linked()) srchTbl.erase(fileSrchTable::s_iterator_to(*srch)); 
	return; 
}

static fileSearch * 
getFileSrch(std::string uuid)
{
	std::unique_lock<std::mutex> uniqueLock(srchTblLock);
	fileSrchTable::iterator itr;
	for(itr = srchTbl.begin(); itr != srchTbl.end(); itr++){
		if(itr->getClientCookie() == uuid){
			return &(*itr);
		}
	}
	return nullptr;
}

//run the event loop for all the stream sockets sent by the 
//gw server.
class relayDirectory
{
    int _client = -1;
    std::string _cookie = "";
    DIR *_dir = nullptr;
    std::string _dirName = "";
    volatile bool _working = false;

    public:
    relayDirectory(int client,
            std::string cookie,
            DIR *dir,
            std::string dname) :
        _client(client),
        _cookie(cookie), 
        _dir(dir),
        _dirName(dname) { return; }

    void _relay()
    {
        try {
            SCOPE_EXIT{ _working = false; };
            struct dirent dent = {0};
            struct dirent *dentPtr = nullptr;
            _except(readdir_r(_dir, &dent, &dentPtr));
            while (dentPtr){
                struct dirent darray[10];
                unsigned int idx = 0;
                do {
                    //only display regular files and directories
                    if((dent.d_type == DT_REG) || (dent.d_type == DT_DIR) || 
                            (dent.d_type == DT_LNK)){
                        if(!(strcmp(".", dent.d_name) == 0 || 
                                    strcmp("..", dent.d_name) == 0 || 
                                    (dent.d_name[0] == '.'))){
                            memcpy(&darray[idx], &dent, sizeof(dent));
                            idx++;
                        }
                    }
                    _except(readdir_r(_dir, &dent, &dentPtr));
                }while((idx < 10) && dentPtr);

                struct stat sbuf = {0};
                _except(stat(_dirName.c_str(), &sbuf));
                int lastaccess = static_cast<int>(sbuf.st_atime);
                //format the list of dents and send them to the client
                std::string response("response");
                tupl tv[] = {{"mesgtype", response}, {"cookie", _cookie}, \
                    {"lastaccess", lastaccess}};
                JSONNode getDirResp(JSON_NODE);
                putJsonVal(tv, sizeof(tv)/sizeof(tupl), getDirResp);
                JSONNode dirElements(JSON_ARRAY);
                dirElements.set_name("direlements");
                unsigned int elemCount = 0;
                while(idx){
                    {
                        JSONNode elemNode(JSON_NODE);
                        //more attribs will come in future on demand 
                        struct dirent element = {0};
                        memcpy(&element, &darray[elemCount++], sizeof(struct dirent));
                        struct stat sbuf = {0};
                        char path[PATH_MAX + 256] = {'\0'};
                        sprintf(path, "%s/%s", _dirName.c_str(), element.d_name);
                        _except(stat(path, &sbuf));
                        std::string filename = element.d_name;
                        std::string extension;
                        size_t pos = filename.find_last_of(".");
                        if(pos != std::string::npos) 
                            extension.assign(filename.begin()+ pos + 1, \
                                    filename.end());
                        std::string filetype = extension.size() ? \
                            getMimeType(extension) : "unknown";
                        uint64_t fileSize = getFileSize(path);
                        tupl dirAttribs[] = {
                            {"fname", std::string(element.d_name)},
                            {"isdir", std::string(element.d_type == DT_DIR ?\
                                    "true" : "false")},
                            {"size",  fileSize},
                            {"type", filetype}
                        };
                        putJsonVal(dirAttribs, 
                                sizeof(dirAttribs)/sizeof(tupl), 
                                elemNode);
                        dirElements.push_back(elemNode);
                    }
                    idx--;
                }
                getDirResp.push_back(dirElements);
                string batchResp = getDirResp.write_formatted();
                writeFmgrReply(_client, batchResp.c_str(), batchResp.length());
                if (!dentPtr) { closedir(_dir); break; }//lastbatch sent now getout
            }
        }
        catch(std::exception &ex){ 
            _error<<"Thread exited with exception"<<ex.what(); 
            error2Client(_client, 
                    _cookie, 
                    "There was some internal error performing the operation, \
                    Please retry.");
        }
        die();
        return;
    }

    bool isBusy() { return _working == true; }
    void relay() 
    { 
        _working = true;
        tPool->enqueue(std::bind(&relayDirectory::_relay, this)); 
        return;
    }
    void die(){ delete this; }
    ~relayDirectory() { return; }
};

//initialize the info record for the file or folder.
static void
initializeInfoRecord(std::string fname, int _uid, int _gid, bool ovrride = false)
{
    if(!ovrride){
        char attribBuf[1024] = {'\0'};
        int rc = getxattr(fname.c_str(), 
                FILE_ATTRIB_META_DATA, 
                attribBuf, 
                sizeof(attribBuf));
        if(rc > 0) return; //dont override if there are attributes.
    }
    fileAttribRecord blob;
    blob.ownerUid = _uid;
    blob.ownerGid = _gid;
    blob.fqpn = fname;
    blob.followers.push_back(_uid);
    setFileAttrib(fname, blob);
    return;
}


/*
   command json format can be of below type , below command example is for commands 
   which require 2 arguments like "move" or "copy". 
   std::string command = "{\"mesgtype\":\"request\", \
   \"service\" : \"fmgr\", \
   \"cookie\"  : \"Abxruyyeziyrolsu\", \
   \"request\" : \"move\", \
   \"directory\" : \"directory_name\", \
   \"destination\" : \"destination directory or file \", \
   \"srcargs\", [ arg1, arg2, arg3, arg4, arg5 ] \
   }";
   */
//command object. since there is one to one mapping 
//between the command object and thread. the static 
//function will just call the member function using 
//this handle by statically type casting it.

//base class for the file system command
class fsCommand : public boost::intrusive::set_base_hook<boost::intrusive::optimize_size<true>>
{
    public:
    pid_t _childPid = 0; //pid of the process which is running the command.
    int _popenPipe[3] = {0, 0, 0}; //pipe linking us and the command
    int _client = -1; //client which is running the command 
    unsigned int _argvCount = 0;
    char **_argv = nullptr; //This is to be freed by us.
    int _childExitCode = 0;
    commandType _ctype;//type of the command 
    std::string _srcDir = "";//src directory for commands involving 2 directories
    std::string _dstDir = "";//dst directory for commands involving 2 directories
    bool _yesall = false;  
    std::string _clientCookie = "";
    std::string _command;
    int _uid = -1; 
    int _gid = -1;
    bool childSpawned = false;

    fsCommand(int client, std::string command) //json request from the client
        : _command(command),
          _client(client)
    {
        std::string msgType, cookie, request;
        tupl t[] = {
            {"mesgtype", &msgType},
            {"request", &request},
            {"cookie", &_clientCookie},
            {"source", &_srcDir},
            {"destination", &_dstDir},
            {"uid", &_uid},
            {"gid", &_gid}
        };
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(command);

        //Allocate argv list lets say 4096 slots 
        //max number of command line arguments for any command on Unix.
        _argv = static_cast<char**>(operator new(4096));
        
        //FIXME: getJsonVal() reports falsely ignoring the list attribute fields.
        //currently we are not taking lists in to attribute count and we report 
        //less number of attributes during the validation of required fields. 
        //we need to fix this to return the number of attribs and wrap this 
        //under a macro in future.
        getJsonVal(n, t, sz); 
        if (request == "move"){
            _ctype = MOVE;
            _argv[_argvCount++] = strDup("/bin/mv");
            _argv[_argvCount++] = strDup("-i"); 
        }else if(request == "copy"){
            _ctype = COPY;
            _argv[_argvCount++] = strDup("/bin/cp");
            _argv[_argvCount++] = strDup("-iR");
        }else if(request == "remove"){
            _ctype = REMOVE;
            _argv[_argvCount++] = strDup("/bin/rm");
            _argv[_argvCount++] = strDup("-rf");
        }else if(request == "zip"){
            _ctype = ZIP;
            _argv[_argvCount++] = strDup("/usr/bin/zip");
            _argv[_argvCount++] = strDup("-rq");
            _argv[_argvCount++] = nullptr; //This is the slot where we jack in the archive file name to be 
                                           //created, all this is due to the absurdity of the zip command.
        }else if(request == "unzip"){
            _ctype = UNZIP;
            _argv[_argvCount++] = strDup("/usr/bin/unzip");
            _argv[_argvCount++] = strDup("-qu");
        }else if(request == "create_file") _ctype = CREATE_FILE; 
        else if(request == "create_dir") _ctype = CREATE_DIR; 

        JSONNode::const_iterator i = n.begin();
        while(i != n.end()){
            if ((i->type() == JSON_ARRAY) && (i->name() == "srcargs")) break; 
            i++; 
        }

        if (i != n.end()){
            JSONNode array = *i;
            //Now iterate through the array and gather the arguments.
            JSONNode::const_iterator index = array.begin();
            std::string srcArg;
            while(index != array.end()){
                srcArg = _srcDir + '/';
                srcArg += index->as_string(); 
                _argv[_argvCount++] = strDup(srcArg.c_str()); 
                index++;
            }
            //move and copy commands have the last argument as destination directory.
            if ((_ctype == MOVE) || (_ctype == COPY)) 
                _argv[_argvCount++] = strDup(_dstDir.c_str());

            //Jack in the archive name right at the 2nd slot in the argv
            if (_ctype == ZIP){
                std::string archiveName = _srcDir + '/' + _argv[3] + ".zip";
                _info<<"archive name :"<<archiveName;
                _argv[2] = strDup(archiveName.c_str());
            }
    
            if(_ctype == UNZIP){
                _argv[_argvCount++] = strDup("-d");
                _argv[_argvCount++] = strDup(_srcDir.c_str());
            }

            _argv[_argvCount] = nullptr;
        }
        add2CmdTbl(this);
        return;
    }

    //for create dir and create file commands there is no unix equivalents 
    //we do it here in this thread context itself.
    int run()
    {
        std::string folderRoot; 
        try{
            switch(_ctype)
            {
                case CREATE_DIR:
                    _except(::mkdir(_argv[0], (S_IRUSR | S_IWUSR | S_IRGRP | \
                                    S_IWGRP | S_IXGRP | S_IXUSR )));
                    //initialize the info record for the new directory.
                    initializeInfoRecord(_argv[0], _uid, _gid);
                    logFileActivity(_uid, _gid, std::string(_argv[0]), "created directory");
                    break;
                case CREATE_FILE:
                    _except(::open(_argv[0], O_CREAT | O_RDWR, 0));
                    //initialize the info record for the new file.
                    initializeInfoRecord(_argv[0], _uid, _gid);
                    logFileActivity(_uid, _gid, std::string(_argv[0]), "created file");
                    break;
                case REMOVE:
                case MOVE:
                case COPY:
                case ZIP:
                case UNZIP:
                default:
                    int rc = ::popenCustom(_popenPipe, &_childPid, _argv[0], _argv);
                    if (rc < 0){
                        _error<<"popenCustom failed with rc:"<<rc;
                        return rc;
                    }
                    _info<<"Child spawned with command:"<<_command<<" pid:"<<_childPid;
                    childSpawned = true;
                    //Add the childs stderr and stdout to the reactor.
                    //XXX: there might be a slight race but the output will be queued.
                    svc->addReadFd(_popenPipe[2], 
                            std::bind(&fsCommand::handleCommandError, 
                                this,
                                std::placeholders::_1,
                                std::placeholders::_2));
            }
            //send back a response to the client about command complete 
            if((_ctype == CREATE_DIR) || (_ctype == CREATE_FILE)){
                std::string status = (_childExitCode == 0) ? "success" : "fail"; 
                std::string response("response");
                tupl tv[] = {{"mesgtype", response}, {"cookie", _clientCookie}, {"status", status}};
                size_t size = sizeof(tv)/sizeof(tupl);
                string json = putJsonVal(tv, size);
                writeFmgrReply(_client, json.c_str(), json.length());
                die();
            }
        }
        catch(syscallException &ex){
            _childExitCode = errno;
            _error<<"fsCommand::run() caught an syscall exception while running command:"<<ex.what();
        }
        catch(std::exception &ex){
            _childExitCode = errno;
            _error<<"fsCommand::run() caught an standard exception while running command:"<<ex.what();
        }
        return 0;
    }

    void answerQuestion(std::string answer)
    {  
        const char *resp = nullptr;
        int child_stdin = _popenPipe[0];
        if (answer == "yes") resp = "y";
        else if (answer == "no") resp = "n";
        else if (answer == "cancel") kill(_childPid, SIGKILL);
        else if (answer == "yesall") { _yesall = true; resp = "y"; }
        else assert(0);
        _error<<"User response to the question:"<<answer;
        _except(::write(child_stdin, resp, strlen(resp)));  //write the input to the command
        return;
    }

	std::string& getClientCookie() { return _clientCookie; }
    int getClient() { return _client; }
    pid_t getChildPid() { return _childPid; }
    int getUid() { return _uid; } 
    int getGid() { return _gid; }
    int getCommandType() { return _ctype; }

    //There is a question for the user send him a alert message and wait
    //on the future. when the question is answered by the user the promise
    //returns with yes or no.
    //wait for the child output if there is a question to the user send a question 
    //to the client and wait on the future for 60 mins, after 60 mins try to kill 
    //the process running the command and send back an error message  to the client.
    //that we killed the command.
    void handleCommandError(service *svc, int fd)
    {
        try{
            char buf[2048] = {'\0'};
            int rc = _except(::read(fd, buf, sizeof(buf)));
            if(!rc){
                if((errno) && (errno != EAGAIN)) THROW_ERRNO_EXCEPTION;
                _info<<"fsCommand::handleCommandError() ::read() returned 0 \
                    bytes on the stderr of child, seems the child is done.";
                return;
            }
            _info<<"fsCommand::handleCommandError():"<<std::string(buf, rc)<<"rc:"<<rc;
            int child_stdin = _popenPipe[0];
            if (strchr(buf,'?')){
                if (_yesall){
                    const char *resp = "y"; 
                    _except(::write(child_stdin, resp, sizeof(resp)));  
                    return;
                }

                std::string  question("question"), estring(buf);
                //send a question to the client and wait for his reply
                tupl tv[] = {
                    {"mesgtype",  question},
                    {"cookie"  ,  _clientCookie},
                    {"estring" ,  estring}
                };
                size_t size = sizeof(tv)/sizeof(tupl);
                string json = putJsonVal(tv, size);
                writeFmgrReply(_client, json.c_str(), json.length());
            }else{
                //send the error blurb as it is to the user, he knows what he is doing 
                std::string estring(buf), error("error");
                tupl tv[] = {
                    {"mesgtype",  error},
                    {"cookie"  ,  _clientCookie},
                    {"estring" ,  estring}
                };
                size_t size = sizeof(tv)/sizeof(tupl);
                string json = putJsonVal(tv, size);
                writeFmgrReply(_client, json.c_str(), json.length());
                _error<<"fsCommand::handleCommandError() There was an error \
                    in the command fired: "<<estring;
            }
        }
        catch(syscallException &ex){ 
            _error<<"fsCommand::handleCommandError() caught syscall exception:"<<
                ex.what(); 
            throw(ex); 
        }
        catch(std::exception &ex){ 
            _error<<"fsCommand::handleCommandError() caught standard exception:"<<
                ex.what(); 
            throw(ex); 
        }
        return;
    }

    ~fsCommand ()
    {
        if(childSpawned){
            svc->remReadFd(_popenPipe[2]);
            pcloseCustom(_popenPipe);
        }
        if (_argv){
            for (unsigned int i = 0 ; i < _argvCount; i++) delete _argv[i];
            delete _argv;
        }
        delFromCmdTbl(this);
        return;
    }
    void die() { delete this; }
    friend bool operator < (const fsCommand &a, const fsCommand &b) 
    { return a._clientCookie < b._clientCookie; }
    friend bool operator > (const fsCommand &a, const fsCommand &b) 
    { return a._clientCookie > b._clientCookie; }
    friend bool operator == (const fsCommand &a, const fsCommand &b) 
    { return a._clientCookie == b._clientCookie; }
};

//list of all active command objects in the system 
typedef boost::intrusive::set<fsCommand, \
            boost::intrusive::compare<std::greater<fsCommand>>> \
            fsCommandTable;
fsCommandTable commTbl;

static void 
add2CmdTbl(fsCommand *fsc)
{
	assert(fsc);
	commTbl.push_back(*fsc); 
	return;
}

static void 
delFromCmdTbl(fsCommand *fsc) 
{
	assert(fsc);
    if(fsc->is_linked()) 
        commTbl.erase(fsCommandTable::s_iterator_to(*fsc)); 
	return; 
}

static fsCommand*
getFsCommand(std::string uuid)
{
	fsCommandTable::iterator itr;
    for(itr = commTbl.begin(); itr != commTbl.end(); itr++) 
        if(itr->getClientCookie() == uuid) 
            return &(*itr);
	return nullptr;
}

static fsCommand* 
getFsCommand(pid_t child)
{
	fsCommandTable::iterator itr;
    for(itr = commTbl.begin(); itr != commTbl.end(); itr++) 
        if(itr->getChildPid() == child) 
            return &(*itr);
	return nullptr;
}

//A file transfer operation can be write or read depending on whether 
//the file is being downloaded or uploaded.
class fileXfer : public boost::intrusive::set_base_hook<boost::intrusive::optimize_size<true>>
{
    std::string _fname = "";
	int _fd = -1; //file descriptor
	std::string _clientCookie = ""; //128 bit uuid is generated by the client and used as a cookie 
	int _client = -1; // network connection identifier in the gw daemon
    bool isRead = true;
    unsigned char *_buffer = nullptr;
    unsigned int  _bufferSize = 0; //amount of valid data in the buffer
    volatile bool _working = false;
    int _fileSize = 0;
    std::string _tmpName = ""; //temporary name of the file, after the xfer the file will be moved 
                               //to the actual file name in the directory.This is only applicable 
                               //for the upload operation.
    int _uid = -1; 
    int _gid = -1;

	public:
    fileXfer(const char *fname, 
            const char *clientCookie, 
            int client, 
            bool _isRead, 
            int uid, 
            int gid, 
            int fileSize = 0)
    try:
        _fname(fname),
        _clientCookie(clientCookie),
        _client(client),
        isRead(_isRead),
        _uid(uid), 
        _gid(gid),
        _fileSize(fileSize)
	{
        bool allOk = false;
        _except(posix_memalign(reinterpret_cast<void**>(&_buffer), kPageSize, diskBlockSize));
        SCOPE_EXIT{ if(!allOk) free(_buffer); };
		int flags = isRead ? (O_RDONLY) : (O_RDWR | O_CREAT | O_TRUNC);
        _tmpName = _fname;
        //turn on metering if this is not a download.
        if (!_isRead){
            //generate a temporary name
            std::string dname = _fname.substr(0, _fname.find_last_of("\\/"));
            _tmpName = dname + "/" + "." + genuuid(); //dot makes sure we are not relaying these files to the client.
        }
        _fd = _except(::open(_tmpName.c_str(), flags, (S_IRUSR | S_IWUSR | \
                        S_IXUSR | S_IRGRP | S_IWGRP | S_IXGRP)));
		add2XferTbl(this);//add to the xfer table NOTE: There is no possibility of exceptions beyond this point
        allOk = true;
		return;
	}
    catch(std::exception &ex)
    {
        _error<<"exception in fileXfer() constructor:"<<ex.what();
        throw ex;
    }
	~fileXfer()
    {
        unsigned int sleepCount = 10;
        while(_working && (--sleepCount)) usleep(100); //just wait until it comes back.
        if (_buffer) free(_buffer);
        if (_fd > 0) _eintr(::close(_fd));//close the file descriptor
        delFromXferTbl(this);
        return;
    }

    void
    readAsync()
    {
        try{
            SCOPE_EXIT{ _working = false; };
            int rc = _except(::read(_fd, _buffer, diskBlockSize)); 
            if (rc){
                std::string encodedBuf = JSONBase64::json_encode64(_buffer, rc);
                memset(_buffer, 0, rc);
                readResponse(_client, encodedBuf, encodedBuf.length(), _clientCookie);
            }else{
                readResponse(_client, "", 0, _clientCookie);
                die();
            }
        }
        catch(syscallException &ex){
            _error<<"fileXfer::readAsync() caught syscall exception:"<<ex.what(); 
            error2Client(_client, 
                    _clientCookie, 
                    "There was some internal error in downloading the file, Please retry.");
        }
        catch(std::exception &ex){ 
            _error<<"fileXfer::readAsync() caught standard exception:"<<ex.what(); 
            error2Client(_client, 
                    _clientCookie, 
                    "There was some internal error in downloading the file, Please retry.");
        }
    }

    //write the data to the file and send back an acknowledgement to the 
    //client.
    void
    writeAsync()
    {
        try{
            SCOPE_EXIT{ _working = false; };
            if(_bufferSize){
                _except(::write(_fd, _buffer, _bufferSize));
                //send back an ack to the client so that it can 
                //send additional blocks.
                std::string response("ack");
                std::string request("write");
                tupl tv[] = {{"mesgtype", response}, {"request", request}, \
                    {"cookie", _clientCookie}};
                size_t size = sizeof(tv)/sizeof(tupl);
                {
                    string writeAck = putJsonVal(tv, size);
                    writeFmgrReply(_client, writeAck.c_str(), writeAck.length());
                }
            }else{
                //if there is already a file existing 
                _info<<"fileXfer::writeAsync() trailer packet recvd for file:"<<_fname;
                bool fileExisting = false;
                struct stat sb = {0};
                if(stat(_fname.c_str(), &sb) == 0) fileExisting = true;
                //make a copy of old attributes and rewrite them back as new.
                //after creating a new version of the file move the temp path to the original path.
                fileAttribRecord oldAttrib;
                if(fileExisting) oldAttrib = getFileAttribCopy(_fname);
                //generate diff before throwing away old file.
                //if the file is less than 1 MB and is a text file.
                //else paste an error saying we cannot generate diff due to size constraints.
                std::stringstream ss;
                std::string diffResult;
                if(fileExisting){
                    if((getFileSize(_tmpName) < (1024*1024*1024)) && 
                            (getFileSize(_fname) < (1024*1024*1024))){
                        std::string extension;
                        size_t pos = _fname.find_last_of(".");
                        if(pos != std::string::npos) 
                            extension.assign(_fname.begin()+ pos + 1, 
                                    _fname.end());
                        std::string filetype = extension.size() ? \
                                               getMimeType(extension) : \
                                               "unknown";
                        //text files are of mimetype "text/";
                        unsigned found = filetype.find("text/");
                        if(found != std::string::npos){
                            _info<<"generating diff for file:"<<_fname;
                            unifiedDiff(_fname, _tmpName, ss);
                            if(ss.str().size() < (1024*1024)) diffResult = ss.str();
                            else diffResult = "Note: Diff was too large, so not displaying";
                        }
                    }else
                        diffResult = "Note: File size too large, not generating diff";
                }
                _except(::rename(_tmpName.c_str(), _fname.c_str()));
                //if this is a new file.
                //initialize the info record for the file with the default attributes.
                if(!fileExisting)
                    initializeInfoRecord(_fname, _uid, _gid);
                else
                    setFileAttrib(_fname, oldAttrib);
                std::string notiftype = "newversion";
                std::string description = "created a new version of file";
                logFileActivity(_uid, _gid, _fname, description + diffResult);
                //FIXME: If this is a personal directory and the followers are more than 
                //user then only send notification.
                //notify from the second version on wards.
                if(fileExisting) notify(_uid, _gid, _fname, notiftype, description);
                die();
            }
        }
        catch(syscallException &ex){ 
            _error<<"fileXfer()::writeAsync() caught syscall exception:"<<
                ex.what(); 
            ::unlink(_tmpName.c_str());
            error2Client(_client, 
                    _clientCookie, 
                    "There was some internal error in uploading the file, Please retry.");
        }
        catch(std::exception &ex){ 
            _error<<"fileXfer::writeAsync() caught standard exception:"<<
                ex.what(); 
            ::unlink(_tmpName.c_str());
            error2Client(_client, 
                    _clientCookie, 
                    "There was some internal error in uploading the file, Please retry.");
        }
        return;
    }

    void Read()
    { 
        _working = true;
        tPool->enqueue(std::bind(&fileXfer::readAsync, this)); 
        return; 
    }

    void Write(const char *data, size_t dataSize)
    {
        copy2Buffer(data, dataSize);
        _working = true;
        tPool->enqueue(std::bind(&fileXfer::writeAsync, this));
        return;
    }

    bool isBusy() { return _working == true; }
    bool isWrite() { return !isRead; };
    std::string getFileName() { return _fname; }
    int getFd() { return _fd; }

    //handle the acknowledgement for the download packet we have sent.
    //trigger one more read.
    void
    processDownloadAck()
    {
        Read();
        return;
    }

    void die()
    { 
        _working = false;
        _info<<"fileXfer()::die() xfer committing suicide:"<<_clientCookie;
        delete this;
        return;
    }
    void copy2Buffer(const char *data, size_t size)
    { 
        assert(size <= diskBlockSize); 
        memcpy(_buffer, data, size); 
        _bufferSize = size; 
        return; 
    }
	std::string& getClientCookie() { return _clientCookie; }
	int getFileDesc() { return _fd; }
	int getClient() { return _client; }
    friend bool operator < (const fileXfer &a, const fileXfer &b) 
    { return a._fd < b._fd; }
    friend bool operator > (const fileXfer &a, const fileXfer &b) 
    { return a._fd > b._fd; }
    friend bool operator == (const fileXfer &a, const fileXfer &b) 
    { return a._fd == b._fd; }
};

typedef boost::intrusive::set<fileXfer, \
            boost::intrusive::compare<std::greater<fileXfer>>> \
            fileXferTable;
static fileXferTable xferTbl;
std::mutex xferTblLock;

//get the filexfer object from the clientCookie 
static fileXfer* 
getFileXfer(std::string uuid)
{
	fileXfer *ft = nullptr;
	fileXferTable::iterator itr;
	std::unique_lock<std::mutex> uniqueLock(xferTblLock);
	for(itr = xferTbl.begin(); itr != xferTbl.end(); itr++) {
		if(itr->getClientCookie() == uuid) {
			return &(*itr);
		}
	}
	return ft;
}

//print the xferTbl 
static fileXfer*
printXferTbl()
{
	fileXferTable::iterator itr;
	std::unique_lock<std::mutex> uniqueLock(xferTblLock);
    for(itr = xferTbl.begin(); itr != xferTbl.end(); itr++)  
        _error<<"cookie: "<<itr->getClientCookie();
	return nullptr;
}

//get the filexfer object from the filedescriptor
static fileXfer& 
getFileXfer(int fd)
{
	fileXfer *ft = nullptr;
	fileXferTable::iterator itr;
	std::unique_lock<std::mutex> uniqueLock(xferTblLock);
    for(itr = xferTbl.begin(); itr != xferTbl.end(); itr++) 
        if(itr->getFileDesc() == fd) 
            return *itr;
    return *ft;
}

static void 
add2XferTbl(fileXfer *xfer) 
{ 
    //std::cerr<<"add2XferTbl():"<<xfer<<std::endl;
    std::unique_lock<std::mutex> uniqueLock(xferTblLock);
    xferTbl.push_back(*xfer); 
    return; 
}

static void 
delFromXferTbl(fileXfer *xfer) 
{ 
    //std::cerr<<"delFromXferTbl():"<<xfer<<std::endl;
    std::unique_lock<std::mutex> uniqueLock(xferTblLock);
    if(xfer->is_linked()) 
        xferTbl.erase(fileXferTable::s_iterator_to(*xfer)); 
    return; 
}

//we have a new read request from the client.
//try to see if the file is there and not write locked. 
//start the xfer to the client.
//NOTE:
//write back the client conn identifier along with the 
//response.
static void 
handleRead(int client, char *jsonData) 
{
	std::string cookie, fname;
	int size, uid, gid;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"fname"   , &fname},
		{"size"	   , &size},
		{"uid"	   , &uid},
		{"gid"	   , &gid}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
    try{
        JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            fileXfer *xfer = getFileXfer(cookie);
            if(!xfer) 
                xfer = new fileXfer(fname.c_str(), 
                        cookie.c_str(), 
                        client, 
                        true, 
                        uid, 
                        gid);
            xfer->Read();
        }else{
            _error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
        }
    }
    catch(syscallException &ex){ 
        _error<<
            __FUNCTION__<<
            "()"<<
            " caught: syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){
        _error<<
            __FUNCTION__<<
            "()"<<
            " caught: standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}

//send requested amount of data from the offset provided.
//XXX: use pread to read from the offset.
static void
handleReadOffset(int client, char *jsonData) 
{
	std::string cookie, fname;
	int size, uid, gid, offset;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"offset"  , &offset},
		{"fname"   , &fname},
		{"size"	   , &size},
		{"uid"	   , &uid},
		{"gid"	   , &gid}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
    try{
        JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
        }else{
            _error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
        }
    }
    catch(syscallException &ex){ 
        _error<<
            __FUNCTION__<<
            "()"<<
            " caught: syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<
            __FUNCTION__<<
            "()"<<
            " caught: standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}

//Client has written the data successfully to its file system 
//and has sent an ack back, now try to send the next block of data 
//in response to this.
static void 
handleClientAck(int client, char *jsonData) 
{
	std::string cookie, fname;
	tupl t[] = {
		{"cookie"  , &cookie}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			fileXfer *xfer = getFileXfer(cookie);
            if(xfer) xfer->processDownloadAck();
            else _error<<"Unable to find xfer object for cookie:"<<cookie;
		}
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<
            __FUNCTION__<<
            "() ;caught: syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<
            __FUNCTION__<<
            "() ;caught: standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}

static void
handleCancelOp(int client, char *jsonData)
{
	std::string cookie;
	tupl t[] = {{"cookie", &cookie}};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			fsCommand *fsc = getFsCommand(cookie);
			if (fsc){
                killChild(fsc->getChildPid());
				delete fsc;
                _info<<"handleCancelOp() command with cookie: "<<cookie<<
                    " cancelled.";
				return;
			}
			fileXfer *xfr = getFileXfer(cookie); 
			if (xfr){
                unsigned int sleepCount = 10;
                while(xfr->isBusy() && (--sleepCount)) usleep(100);
                assert(sleepCount); //sleep count 0 means some thing wrong.
                //if this is a partial write then delete the partially written file.
                //dont bother about exceptions this is a best effort.
                if (xfr->isWrite()) _eintr(::close(xfr->getFd())); 
				delete xfr;
                _info<<"handleCancelOp() fileXfer with cookie: "<<cookie<<
                    " cancelled.";
				return;
			}
			fileSearch *srch = getFileSrch(cookie);
			if (srch){
                if(srch->isBusy()) srch->stop();
                unsigned int sleepCount = 10;
                while(srch->isBusy() && (--sleepCount)) usleep(100);
                assert(sleepCount); //sleep count 0 means some thing wrong.
				delete srch;
                _info<<"handleCancelOp() fileSearch operation with cookie: "<<cookie<<
                    " cancelled.";
				return;
			}
            _error<<"handleCancelOp() No operation found with the given cookie: "<<cookie;
		}else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<
            __FUNCTION__<<
            "() caught: syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<
            __FUNCTION__<<
            "() caught: standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}

//send back a data packet to the client 
static void 
readResponse(int client, std::string rbuf, size_t sz, std::string cookie) 
{
	std::string response("response");
	tupl tv[] = {
		{"mesgtype",  response},
		{"cookie"  ,  cookie},
		{"size"	   ,  sz},
		{"data"    ,  rbuf}
	};
	size_t size = sizeof(tv)/sizeof(tupl);
    string json = putJsonVal(tv, size);
    writeFmgrReply(client, json.c_str(), json.length());
	return;
}

static bool
checkAuthorization(int uid, int gid, std::string &file)
{
#if 0
    fileAttribRecord attrib(getFileAttrib(file));
    if(uid > 0){
        if(attrib.ownerUid == uid) return true;
        for(auto &itr : attrib.usersSharedWith){ if(itr == uid) return true; }
        if(gid > 0) for(auto &itr : attrib.groupsSharedWith){ if(itr == gid) return true; }
    }
    return false;
#endif
    return true; //FIXME: only for testing remove afterwards.
}

//add a inotify_watch on this directory to watch it, send events 
//to the UI accordingly to sync the view of the client with the 
//directory contents.
static void
handleGetDir(int client, char *jsonData)
{
	std::string cookie, dname;
	json_string data;
    int uid, gid;
	tupl t[] = {{"cookie", &cookie}, {"dname", &dname}, {"uid", &uid}, {"gid", &gid}};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
            if(!checkAuthorization(uid, gid, dname)){
                _error<<"Unauthorized access by user: "<<uid<<
                    " from context: "<<gid<<
                    " file: "<<dname;
                error2Client(client, 
                        cookie, 
                        "You are not authorized access to this file/folder");
                return;
            }

			DIR *dir = opendir(dname.c_str());
            if(dir){
                relayDirectory *rdir = new relayDirectory(client, 
                        cookie, 
                        dir, 
                        dname);
                rdir->relay();
                trackDir(dname, client); //Add tracker for the current directory.
                //derive the parent dir of the directory
                std::string parentDir;
                size_t pos = dname.find_last_of("/");
                if(pos != std::string::npos) 
                    parentDir.assign(dname.begin(), dname.begin() + pos);
                unTrackDir(parentDir, client); //remove tracker for the parent.
            }
            else{
                _error<<"Unable to open the directory: "<<dname;
                error2Client(client, cookie, "Unable to open the requested directory");
            }
		}
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<
            __FUNCTION__<<
            "() caught: syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<
            __FUNCTION__<<
            "() caught: standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}

//we have a new write request from the client.
//try to create the file and lock it. if we succeed
//send back a success to the client.
//NOTE:
//write back the client conn identifier along with the 
//response.
static void 
handleWrite(int client, char *jsonData) 
{
	std::string cookie, fname;
	int size, uid, gid;
	json_string data;
    int bytesleft = 0;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"fname"   , &fname},
		{"size"	   , &size},
		{"data"    , &data},
		{"uid"    , &uid},
		{"gid"    , &gid},
		{"bytesleft", &bytesleft}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            std::string decodedBuf = JSONBase64::json_decode64(data);
            fileXfer *xfer = getFileXfer(cookie);
            if (!xfer){
                _info<<"new write xfer started: cookie: "<<cookie
                    <<" name: "<<fname
                    <<" size: "<<bytesleft;
                xfer = new fileXfer(fname.c_str(), 
                        cookie.c_str(), 
                        client, 
                        false, 
                        uid, 
                        gid, 
                        bytesleft);
            }
            xfer->Write(decodedBuf.c_str(), decodedBuf.length());
        }
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<
            "handleWrite() fname:"<<
            fname<<" failed with : syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<
            "handleWrite() fname:"<< 
            fname <<
            " Exited with standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}

//write requested amount of data to the offset provided.
//XXX: use pwrite to write at the offset.
static void 
handleWriteOffset(int client, char *jsonData) 
{
	std::string cookie, fname;
	int size, uid, gid, offset;
	json_string data;
    int bytesleft = 0;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"offset"  , &offset},
		{"fname"   , &fname},
		{"size"	   , &size},
		{"data"    , &data},
		{"uid"    , &uid},
		{"gid"    , &gid},
		{"bytesleft", &bytesleft}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
        }
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<"handleWriteOffset() fname:"<<fname<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleWriteOffset() fname:"<< fname <<
            " Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
	return;
}

//handle command execution request from client
static void
handleCommand(int client, char *jsonData) 
{
    try {
        fsCommand *fsc = new fsCommand(client, jsonData);
        int rc = fsc->run();
        if(rc < 0){
            _error<<"handleCommand() fsc->run() failed with rc:"<<rc;
            delete fsc;
        }
    }
    catch(syscallException &ex){ 
        _error<<"handleCommand()"<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleCommand()"<<
            " failed with standard exception:"<<ex.what(); 
        throw(ex); 
    }
	return;
}

//vector diff function. 
//---------------------
static std::vector<int>
vectordiff(std::vector<int> &first, std::vector<int> &second) 
{
  std::vector<int> third;
  sort(first.begin(), first.end());
  sort(second.begin(), second.end());
  set_symmetric_difference(first.begin(), 
          first.end(), 
          second.begin(), 
          second.end(), 
          back_inserter(third));
  return third;
}


static inline bool
isPresent(int item, std::vector<int> &vec)
{
    bool rv = ((std::find(vec.begin(), vec.end(), item) == vec.end()) ? false : true);
    return rv;
}

//mark the file as shared and update the list of groups/users with whom the file is 
//being shared with.
//Create a symbolic link in the group or user with whom the file is being shared with.
//FIXME:
//Should we add the new folks with whom the file is shared to the follower list as well ?
//and send them notifications for the file changes and comments.
//XXX: only group owner can add or delete shares for the files in the group folder.
static void
handleShare(int client, char *jsonData)
{
	std::string cookie, fname;
    int uid, gid;
    std::vector<int> oldUserSharesRemoved, oldGroupSharesRemoved; 
    std::vector<int> newUserSharesAdded, newGroupSharesAdded;
    std::vector<int> oldUserShares, oldGroupShares, newUserShares, newGroupShares;
    std::string notiftype, description; 
    std::string userListString, groupListString;
    std::string activity;

	tupl t[] = 
    {
		{"uid", &uid},
		{"gid", &gid},
		{"cookie", &cookie},
		{"fname", &fname}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
        _info<<"file is shared :"<<fname;
        JSONNode::const_iterator uItr = n.end(), gItr = n.end();
        for(JSONNode::const_iterator i = n.begin(); i != n.end(); i++){
            if((i->type() == JSON_ARRAY) && (i->name() == "uid_list")) uItr = i;
            if((i->type() == JSON_ARRAY) && (i->name() == "gid_list")) gItr = i;
        }
        if(uItr != n.end()){
            JSONNode array = *uItr;
            for(JSONNode::const_iterator index = array.begin();
                    index != array.end();
                    index++){
                newUserShares.push_back(index->as_int()); 
                _info<<index->as_int()<<" added to newUserShares";
              }
        }
        if(gItr != n.end()){
            JSONNode array = *gItr;
            for(JSONNode::const_iterator index = array.begin();
                    index != array.end();
                    index++){
                newGroupShares.push_back(index->as_int()); 
                _info<<index->as_int()<<" added to newGroupShares";
               }
        }
        //FIXME: getJsonVal() reports falsely ignoring the list attribute fields.
        //currently we are not taking lists in to attribute count and we report 
        //less number of attributes during the validation of required fields. 
        //we need to fix this to return the number of attribs and wrap this 
        //under a macro in future.
        getJsonVal(n, t, sz);
        fileAttribRecord attrib(getFileAttrib(fname));
        checkFileLocked(attrib, client, cookie, uid, gid, "You cannot perform \
                this operation, the file is locked");
        oldUserShares = attrib.usersSharedWith;
        oldGroupShares = attrib.groupsSharedWith;

        //Calculate the newGroupSharesAdded and newUserSharesAdded.
        for(auto &u : newUserShares){
            if(!isPresent(u, oldUserShares)){
                newUserSharesAdded.push_back(u);
            }
        }

        for(auto &g : newGroupShares){ 
            if(!isPresent(g, oldGroupShares)){ 
                newGroupSharesAdded.push_back(g);
            }
        }

        //Calculate the oldGroupSharesRemoved and oldUserSharesRemoved.
        for(auto &u : oldUserShares){ 
            if(!isPresent(u, newUserShares)){
                oldUserSharesRemoved.push_back(u);
            }
        }

        for(auto &g : oldGroupShares){
            if(!isPresent(g, newGroupShares)){ 
                oldGroupSharesRemoved.push_back(g);
            }
        }

        std::string folderRoot = deriveRoot(fname);
        std::string shareName;
        size_t pos = fname.find_last_of("/");
        if(pos != std::string::npos) 
            shareName.assign(fname.begin() + pos + 1, fname.end());
        else 
            throw(std::runtime_error("Invalid file name given by the error"));

        _info<<"Share name :"<<shareName;

        //Add shares for new groups and users 
        notiftype = "file_shared";
        description = shareName + ": file shared with your group";
        for(auto &g : newGroupSharesAdded){
            std::string gname = getGroupName(g);
            if (gname.length()){
                std::string sharePath = folderRoot + "/"  + "groups" + "/" + 
                    gname + "/" + "shares" + "/" + shareName;
                _info<<"symbolic link created for file: "<<fname
                    <<" shared as: "<<sharePath;
                int rc = _eintr(::symlink(fname.c_str(), sharePath.c_str()));
                if(rc < 0) _error<<"symlink() call failed with errno: "<<errno;
                else {
                    _info<<"Created group share :"<<sharePath;
                    shareNotify(uid, gid, newGroupSharesAdded, sharePath, 
                            notiftype, description);
                    groupListString += gname;
                    groupListString += ", ";
                }
            }else{
                _error<<"Unable to get the groupname for gid:"<<g;
            }
        }

        activity = "file shared with groups: " + groupListString;
        if(newGroupSharesAdded.size()) logFileActivity(uid, gid, fname, activity);

        notiftype = "file_shared";
        description = shareName + "file shared with you";
        for(auto &u : newUserSharesAdded){
            std::string uname = getUserName(u);
            if (uname.length()){
                std::string sharePath = folderRoot + "/" + "users" + "/" + uname + 
                    "/" + "shares" + "/" + shareName;
                _info<<"symbolic link created for file: "<<fname<<" shared as: "<<sharePath;
                int rc = _eintr(::symlink(fname.c_str(), sharePath.c_str()));
                if(rc < 0) _error<<"symlink() call failed with errno: "<<errno;
                else { 
                    _info<<"Created user share :"<<sharePath;
                    shareNotify(uid, gid, newUserSharesAdded, sharePath, 
                            notiftype, description);
                    userListString += uname;
                    userListString += ", ";
                }
            }else{
                _error<<"Unable to get the username for uid:"<<u;
            }
        }

        activity = "file shared with users: " + userListString;
        if(newUserSharesAdded.size()) logFileActivity(uid, gid, fname, activity);

        notiftype = "file_unshared";
        description = shareName + "file share no longer available for your group";
        //Remove shares for old groups and users.
        for(auto &g : oldGroupSharesRemoved){
            std::string gname = getGroupName(g);
            if (gname.length()){
                std::string sharePath = folderRoot + "/"  + "groups" + "/" + gname + 
                    "/" + "shares" + "/" + shareName;
                ::unlink(sharePath.c_str());
                _info<<"Removed group share :"<<sharePath;
                shareNotify(uid, gid, oldGroupSharesRemoved, sharePath, notiftype,
                        description);
                groupListString += gname;
                groupListString += ", ";
            }else{
                _error<<"Unable to get the groupname for gid:"<<g;
            }
        }

        activity = "file share removed for groups: " + groupListString;
        if(oldGroupSharesRemoved.size()) logFileActivity(uid, gid, fname, activity);

        notiftype = "file_unshared";
        description = shareName + "file share no longer available for you";
        for(auto &u : oldUserSharesRemoved){
            std::string uname = getUserName(u);
            if (uname.length()){
                std::string sharePath = folderRoot + "/" + "users" + "/" + 
                    uname + "/" + "shares" + "/" + shareName;
                ::unlink(sharePath.c_str());
                _info<<"Removed user share :"<<sharePath;
                shareNotify(uid, gid, oldUserSharesRemoved, sharePath, notiftype, 
                        description);
                userListString += uname;
                userListString += ", ";
            }else{
                _error<<"Unable to get the username for uid:"<<u;
            }
        }

        activity = "file share removed for users: " + userListString;
        if(oldUserSharesRemoved.size()) logFileActivity(uid, gid, fname, activity);

        //see if there is any change at all.
        if(newUserSharesAdded.size() || newGroupSharesAdded.size() || 
                oldUserSharesRemoved.size() || oldGroupSharesRemoved.size()){
            attrib.isShared = (newUserShares.size() + newGroupShares.size()) ? true : false;
            attrib.usersSharedWith = newUserShares;
            attrib.groupsSharedWith = newGroupShares;
            setFileAttrib(fname, attrib);
        }
        success2Client(client, cookie);
	}
    catch(syscallException &ex){ 
        _error<<__FUNCTION__<<
            "() caught: syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<__FUNCTION__<<
            "() caught: standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static void 
handleClientAnswer(int client, char *jsonData)
{
    std::string cookie, answer;
    tupl t[] = {
		{"cookie"  , &cookie},
		{"answer"  , &answer}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try{
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){
			fsCommand *fsc = getFsCommand(cookie);
			if (fsc) fsc->answerQuestion(answer);
		}
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<__FUNCTION__<<
            "() ;caught: syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<__FUNCTION__<<
            "() ;caught: standard exception:"<<ex.what(); 
        throw(ex); 
    }
	return;
}

static void 
handleFileSearch(int client, char *jsonData) 
{
	std::string cookie, dname, key;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"dname"   , &dname},
		{"key"   , &key}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
		if(getJsonVal(n, t, sz)){ 
            fileSearch *fsc = new fileSearch(client, cookie, dname, key);
            fsc->run();
        }
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<"handleFileSearch() dname:"<<dname<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleFileSearch() dname:"<<dname <<
            " Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
	return;
}

static void
handleGetInfo(int client, char *jsonData)
{
    std::string cookie, dname;
    int gid, uid;
    tupl t[] = 
    {
        {"cookie"  , &cookie},
        {"dname"   , &dname},
        {"gid"   , &gid},
        {"uid"   , &uid}
    };
    unsigned int sz = sizeof(t)/sizeof(tupl);
    try {
        JSONNode n = libjson::parse(jsonData);
        //Try to fetch the attributes in a usual way, if present then send them 
        //across to the client. if the attributes are not present then we have 
        //lot of work to do.Try to get the group information using the gid in the 
        //request and then populate the followers. Add all the followers as the 
        //group members.
        if(getJsonVal(n, t, sz)){
            //if the dname is in the shares folder then reject the request saying 
            //unauthorized access.
            std::string uname = getUserName(uid);
            std::string gname = getGroupName(gid);
            std::string folderRoot = deriveRoot(dname);
            std::string userShare(folderRoot + "/" + "users" + "/" + uname + "/" + "shares");
            std::string groupShare(folderRoot + "/" + "groups" + "/" + gname + "/" + "shares");
            if((dname.find(userShare) != std::string::npos) || \
                    (dname.find(groupShare) != std::string::npos)){
                error2Client(client, cookie, "Info cannot be retrieved for shares");
                return;
            }
            std::string json;
            char attribBuf[1024] = {'\0'};
            int rc = getxattr(dname.c_str(), FILE_ATTRIB_META_DATA, attribBuf, sizeof(attribBuf));
            bool attribsPresent = ((rc < 0) && (errno == ENODATA)) ? false : true;
            if(!attribsPresent) initializeInfoRecord(dname, uid, gid);
            //send the response back to the client.
            std::string response("response");
            tupl tv[] = {{"mesgtype", response}, {"cookie", cookie}};
            JSONNode infoResponse(JSON_NODE);
            putJsonVal(tv, sizeof(tv)/sizeof(tupl), infoResponse);
            std::string jsonBuf;
            if (attribsPresent) jsonBuf.assign(attribBuf, rc);
            else jsonBuf = json;
            JSONNode infoNode = libjson::parse(jsonBuf);
            infoNode.set_name("info");
            //Also add the stat related information to the infoNode. 
            //oh god now we need to isse a stat call.
            struct stat sbuf = {0};
            _except(stat(dname.c_str(), &sbuf));
            int accessTime = sbuf.st_atime, modifiedTime = sbuf.st_mtime;
            infoNode.push_back(JSONNode("lastaccessed", accessTime));
            infoNode.push_back(JSONNode("lastmodified", modifiedTime));
            infoResponse.push_back(infoNode);
            std::string responseBuf = std::move(infoResponse.write_formatted());
            writeFmgrReply(client, responseBuf.c_str(), responseBuf.length());
        }
        else{
            _error<<""<<__FUNCTION__<<"() Not enough data to perform operation requested.";
        }
    }
    catch(syscallException &ex){ 
        _error<<"handleGetInfo() dname:"<<dname<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleGetInfo() dname:"<<dname <<
            " Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static fileAttribRecord*
handleSetInfo(int client, char *jsonData)
{
	std::string cookie, dname;
    fileAttribRecord *blob = nullptr;
    int gid, uid;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"dname"   , &dname},
		{"gid"   , &gid},
		{"uid"   , &uid}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            for(JSONNode::const_iterator i = n.begin()  ;i != n.end(); i++){
                if ((i->type() == JSON_NODE) && (i->name() == "info")){
                    std::string infojson = (*i).write_formatted();
                    blob = new fileAttribRecord(fileAttribRecord::fromJson(infojson));
                    std::string json = std::move(fileAttribRecord::toJson(*blob));
                    _except(setxattr(dname.c_str(), 
                                FILE_ATTRIB_META_DATA, 
                                json.data(), 
                                json.length(), 
                                0));
                    success2Client(client, cookie);
                    break;
                }
            }
        }
		else{
            _error<<""<<__FUNCTION__<<"() Not enough data to perform \
                operation requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<"handleSetInfo() dname:"<<dname<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleSetInfo() dname:"<<dname <<
            " Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
	return blob;
}

static void 
handleSetDescription(int client, char *jsonData) 
{
    try
    {
        std::string notiftype, description, preview, fname, cookie;
        int gid, uid;
        tupl t[] = {{"cookie", &cookie}, {"dname", &fname}, {"gid", &gid}, {"uid", &uid}};
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(jsonData);
        getJsonVal(n, t, sz);
        fileAttribRecord attrib(getFileAttrib(fname));
        checkFileLocked(attrib, client, cookie, uid, gid, "You cannot perform \
                this operation, the file is locked");
        handleSetInfo(client, jsonData);
        notiftype = "description_changed";
        success2Client(client, cookie);
    }
    catch(syscallException &ex){ 
        _error<<"handleSetDescription() failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleSetDescription() Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static void 
handleTagChange(int client, char *jsonData) 
{
    try
    {
        std::string notiftype, description, preview, fname, cookie;
        int gid, uid;
        tupl t[] = {{"cookie", &cookie}, {"dname", &fname}, {"gid", &gid}, {"uid", &uid}};
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(jsonData);
        getJsonVal(n, t, sz);
        fileAttribRecord attrib(getFileAttrib(fname));
        checkFileLocked(attrib, client, cookie, uid, gid, "You cannot perform \
                this operation, the file is locked");
        handleSetInfo(client, jsonData);
        notiftype = "changed_tag";
        description = "added/removed tag on file:";
        description += fname;
        success2Client(client, cookie);
        notify(uid, gid, fname, notiftype, description);
        logFileActivity(uid, gid, fname, "added/removed a tag");
    }
    catch(syscallException &ex){ 
        _error<<"handleTagChange() failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleTagChange() Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static void	
handleFollow(int client,  char *jsonData)
{
    try
    {
        std::string notiftype, description, preview, fname, cookie;
        int gid, uid;
        tupl t[] = {{"cookie", &cookie}, {"dname", &fname}, {"gid", &gid}, {"uid", &uid}};
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(jsonData);
        getJsonVal(n, t, sz);
        fileAttribRecord *fa = handleSetInfo(client, jsonData);
        if(fa){
            notiftype = "started_following";
            description = "started following the file:";
            description += fname;
            notify(uid, gid, fname, notiftype, description);
            logFileActivity(uid, gid, fname, "started following");
            if(fa->kons != "") addKonsFollowers(uid, fa->kons);
        }
        success2Client(client, cookie);
    }
    catch(syscallException &ex){ 
        _error<<"handleFollow() failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleFollow() Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static void	
handleUnfollow(int client, char *jsonData)
{
    try
    {
        std::string notiftype, description, preview, fname, cookie;
        int gid, uid;
        tupl t[] = {{"cookie", &cookie}, {"dname", &fname}, {"gid", &gid}, {"uid", &uid}};
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(jsonData);
        getJsonVal(n, t, sz);
        fileAttribRecord *fa = handleSetInfo(client, jsonData);
        if(fa && (fa->kons != "")) delKonsFollowers(uid, fa->kons);
        success2Client(client, cookie);
    }
    catch(syscallException &ex){ 
        _error<<"handleUnfollow() failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleUnfollow() Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static void	
handleLock(int client, char *jsonData)
{
    try
    {
        std::string notiftype, description, preview, fname, cookie;
        int gid, uid;
        tupl t[] = {{"cookie", &cookie}, {"dname", &fname}, {"gid", &gid}, {"uid", &uid}};
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(jsonData);
        getJsonVal(n, t, sz);
        fileAttribRecord attrib(getFileAttrib(fname));
        checkFileLocked(attrib, client, cookie, uid, gid, "You cannot perform \
                this operation, the file is locked");
        attrib.locked = 1;
        attrib.lockedBy = uid;
        handleSetInfo(client, jsonData);
        success2Client(client, cookie);
        notiftype = "locked";
        description = "locked the file:";
        description += fname;
        notify(uid, gid, fname, notiftype, description);
        logFileActivity(uid, gid, fname, "locked the file");
    }
    catch(syscallException &ex){ 
        _error<<"handleLock() failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleLock() Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static void	
handleUnlock(int client, char *jsonData)
{
    try
    {
        std::string notiftype, description, preview, fname, cookie;
        int gid, uid;
        tupl t[] = {{"cookie", &cookie}, {"dname", &fname}, {"gid", &gid}, {"uid", &uid}};
        unsigned int sz = sizeof(t)/sizeof(tupl);
        JSONNode n = libjson::parse(jsonData);
        getJsonVal(n, t, sz);
        fileAttribRecord attrib(getFileAttrib(fname));
        checkFileLocked(attrib, client, cookie, uid, gid, "You cannot perform \
                this operation, the file is locked");
        attrib.locked = 0;
        attrib.lockedBy = 0;
        handleSetInfo(client, jsonData);
        success2Client(client, cookie);
        notiftype = "unlocked";
        description = "unlocked the file:";
        description += fname;
        notify(uid, gid, fname, notiftype, description);
        logFileActivity(uid, gid, fname, "Unlocked the file");
    }
    catch(syscallException &ex){ 
        _error<<"handleUnlock() failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleUnlock() Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

//process the websocket input
static void 
processRequest (int clientid, char *rbuf, unsigned int bufSz) 
{
	int client = clientid;
	char *jsonData = rbuf;
    std::string cookie, msgType, request;
	try {
        if(!libjson::is_valid(jsonData)){
            _error<<"Client sent invalid json format or data not in json format:\
                dropping request. Please look in to /var/log/antkorp/startup.log \
                for more info"; 
            std::cerr<<"invalid json data dump: "<<rbuf;
            return;
        }
		JSONNode n = libjson::parse(jsonData);
		//extract all possible parameters for a message 
		//a message can be a request response or event or error
		tupl t[] = 
        {
			{"mesgtype", &msgType},
			{"request" , &request},
			{"cookie"  , &cookie}
		};
		unsigned int sz = sizeof(t)/sizeof(tupl);
		getJsonVal(n, t, sz);
		if (msgType == "request"){
			if (request == "read") 				handleRead(client, jsonData);
			else if (request == "get_offset") 	handleReadOffset(client, jsonData);
			else if (request == "write") 		handleWrite(client, jsonData);
			else if (request == "put_offset") 	handleWriteOffset(client, jsonData);
			else if (request == "search") 		handleFileSearch(client, jsonData);
			else if (request == "getdir") 		handleGetDir(client, jsonData);
			else if (request == "cancel") 		handleCancelOp(client, jsonData);
			else if (request == "share") 		handleShare(client, jsonData);
			else if (request == "getinfo") 		handleGetInfo(client, jsonData);
			else if (request == "setinfo") 		handleSetInfo(client, jsonData);
			else if (request == "setdesc") 		handleSetDescription(client, jsonData);
			else if (request == "tagchange") 	handleTagChange(client, jsonData);
			else if (request == "follow") 	    handleFollow(client, jsonData);
			else if (request == "unfollow")     handleUnfollow(client, jsonData);
			else if (request == "lock")         handleLock(client, jsonData);
			else if (request == "unlock")       handleUnlock(client, jsonData);
			else if ((request == "remove") || (request == "copy") ||
					(request == "move") || (request == "rename") || 
					(request == "create_file") || (request == "create_dir")) 
												handleCommand(client, jsonData);
		} else if (msgType == "ack") 			handleClientAck(client, jsonData);
		else if (msgType == "answer") 			handleClientAnswer(client, jsonData);
	}
    catch(syscallException &ex){
        _error<<__FUNCTION__<<"() ;caught: syscall exception:"<<ex.what(); 
        error2Client(client, 
                cookie, 
                "There was some internal error performing the operation, Please retry.");
    }
    catch(std::exception &ex){ 
        _error<<__FUNCTION__<<"() ;caught: standard exception:"<<ex.what(); 
        error2Client(client, 
                cookie, 
                "There was some internal error performing the operation, Please retry.");
    }
	return;
}

static void
unCaughtExceptionHandler()
{
	dumptrace();
	assert(0);
	return;
}

static void
handleRequest(service *svc, int clientid, int channelid, std::string &data)
{
    _info<<"new data request.";
    try 
    {
        processRequest(clientid, nonconst(data.data()), data.size());
    }
    catch(syscallException &e){ 
        _error<<"handleRequest() encountered a syscall exception:"<<e.what(); 
    }
    catch(std::exception &e){ 
        _error<<"handleRequest() encountered a standard exception:"<<e.what(); 
    }
    return;
}

//handle the client departure.
static void 
handleClientArrival(int clientid)
{
    _info<<"client arrival: "<<clientid;
    return;
}

struct disposeXfer
{ 
    void operator()(fileXfer *xfer, int clientid) 
    { 
        if(clientid == xfer->getClient()) 
            delete xfer; 
        else 
            add2XferTbl(xfer);
    }
};

struct disposeFsCommand
{
    void operator()(fsCommand *fc, int clientid)
    {
        if(clientid == fc->getClient()){
            killChild(fc->getChildPid());
            delete fc;
        }else
            add2CmdTbl(fc);
    }
};

struct disposeFileSearch
{ 
    void operator()(fileSearch *fs, int clientid)
    {
        if(clientid == fs->getClient()){
            if(fs->isBusy()) fs->stop(); //ask the thread to stop and wait.
            unsigned int sleepCount = 10;
            while(fs->isBusy() && (--sleepCount)) usleep(100);
            assert(sleepCount); //sleep count 0 means some thing wrong.
            delete fs;
        }else
            add2SrchTbl(fs);
    }
};

//handle the client departure.
static void 
handleClientDeparture(int clientid)
{
    _info<<"client departure : "<<clientid;
    //delete the xfer objects if any related to the client.
    xferTbl.erase_and_dispose(xferTbl.begin(), 
            xferTbl.end(), 
            std::bind(disposeXfer(), 
                std::placeholders::_1, 
                clientid));
    //cancle on going commands using kill.
    commTbl.erase_and_dispose(commTbl.begin(), 
            commTbl.end(), 
            std::bind(disposeFsCommand(), 
                std::placeholders::_1, 
                clientid));
    //cancel any search operations in progress.
    srchTbl.erase_and_dispose(srchTbl.begin(), 
            srchTbl.end(), 
            std::bind(disposeFileSearch(), 
                std::placeholders::_1, 
                clientid));
    //delete the clientid from the directory watchlist.
    watchListT::iterator itr = watchList.begin();
    if (itr != watchList.end()){
        auto tpl = (*itr).second;
        std::get<1>(tpl).remove(clientid);
        if (std::get<1>(tpl).size() == 0){
            _except(inotify_rm_watch(inotifyFd, std::get<0>(tpl)));
            watchList.erase(itr);
        }
    }
    return;
}

//clean up the pending operations for the clients which have went down.
//delete all the pending operations in progress for the particular client.
static void
handleControlMesg(service *svc, service::controlMessage &cmsg)
{
    _info<<"new control request.";
    try 
    {
        switch(cmsg.messageType)
        {
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL:
                handleClientArrival(cmsg.clientArrival.clientid);
                break;
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_ADD:
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_DELETE:
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_HEART_BEAT:
                break;
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE:
                handleClientDeparture(cmsg.clientDeparture.clientid);
                break;
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT:
                handleClientDeparture(cmsg.clientDisconnect.clientid);
                break;
            default:
                _error<<"message with unsupported op from gateway.";
                return;
        }
    }
    catch(syscallException &e){ 
        _error<<"handleControlMesg() encountered a syscall exception:"<<e.what(); 
    }
    catch(std::exception &e){ 
        _error<<"handleControlMesg() encountered a standard exception:"<<e.what(); 
    }
    return;
}

static void 
writeFmgrReply(int clientid, const char *buf, size_t bufSz)
{
	//respond back to the client
	std::unique_lock<std::mutex> lock(gSvcLock);
    svc->sendToClient(clientid, -1, buf, bufSz);
	return;
}

static void 
_initializeFileDirectory(const std::string *dname, int uid, int gid)
{
    initializeInfoRecord(*dname, uid, gid);
    logFileActivity(uid, gid, *dname, "created a new version");
    boost::filesystem::recursive_directory_iterator _walker(*dname);
    while (_walker != boost::filesystem::recursive_directory_iterator())
    {
        if(boost::filesystem::is_directory(_walker->path())) 
            _initializeFileDirectory(&_walker->path().string(), uid, gid);
        else{
            initializeInfoRecord(_walker->path().string(), uid, gid);
            logFileActivity(uid, gid, *dname, "created a new version");
        }
        ++_walker;
    }
    return;
}

//walk recursively
static void
initializeFileDirectory(std::string dname, int uid, int gid)
{
    try
    {
        return _initializeFileDirectory(&dname, uid, gid);
    }
    catch(syscallException &ex){ 
        _error<<"syscall exception in initializeFileDirectory():"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"standard exception in initializeFileDirectory():"<<ex.what(); 
        throw(ex); 
    }
    return;
}

//recursively initialize the attribs of all the files down.
//This is a free thread and exits on its own no need to control this.
static void 
spawnAttribInitializer(std::string dname, int uid, int gid)
{
    tPool->enqueue(std::bind(initializeFileDirectory, dname, uid, gid));
    return;
}

//shoot the queries to the mongodb.
static void 
_cleanupMongodbForRemovedDirectory(std::string dname)
{
    if(!dname.size()) return;
    _info<<"cleaning up the database for the file: "<<dname;
    std::unique_lock<std::mutex> lock(luaStateMutex);
    lua_getglobal(L, "cleanupDbForFile");
    __LUA_PUSHSTRING(L, dname.c_str());
    int rc = lua_pcall(L, 1, LUA_MULTRET, 0); //actuall call to lua
    if(rc) _error<<"lua_pcall() returned error:"<<rc<<" for cleanupDbForFile() "
        <<" error: "<<std::string(lua_tostring(L, -1));
    lua_settop(L, 0);
    return;
}

//cleanup the mongodb for the deleted directories or files. 
//This includes
//notifications - notifications generated for the files. 
//activity log  for the files.
//Konversations held on the file.
static void
cleanupMongodbForRemovedDirectory(std::string dname)
{
    tPool->enqueue(std::bind(_cleanupMongodbForRemovedDirectory, dname));
    return;
}

static void
handleChildDeath(struct signalfd_siginfo *fdsi)
{
    pid_t child = fdsi->ssi_pid;
    _info<<"handleChildDeath() Child death handler called reaping status child:"<<child;
    //get the fsCommand object using the child pid and delete the object.
    fsCommand *fc = getFsCommand(child);
    int client = fc ? fc->getClient() : 0;
    if(client){
        int exitStatus = 0;
        waitpid(child, &exitStatus, 0);
        if(!WIFSIGNALED(exitStatus) && 
                WIFEXITED(exitStatus) && 
                (WEXITSTATUS(exitStatus) != 0)){
            _error<<"Child: "<<child<<" exited with status:"<<exitStatus;
        }
        if(fc){
            std::string status = (WEXITSTATUS(exitStatus)== 0) ? "success" : "fail"; 
            std::string response("response");
            tupl tv[] = {{"mesgtype", response}, {"cookie", fc->getClientCookie()}, {"status",status}};
            size_t size = sizeof(tv)/sizeof(tupl);
            string json = putJsonVal(tv, size);
            writeFmgrReply(client, json.c_str(), json.length());
            if (status == "success" ){
                //initialize the info records for all the newly created files and directories.
                //and log activity
                if((fc->_ctype == MOVE) || (fc->_ctype == COPY)){
                    if(boost::filesystem::is_directory(fc->_dstDir)){
                        for (unsigned int i = 2 ; i < (fc->_argvCount - 1); i++){
                            std::string source(fc->_argv[i]);
                            std::string sourceLeaf = "";
                            size_t pos = source.find_last_of("/");
                            if(pos != std::string::npos) 
                                sourceLeaf.assign(source.begin() + pos + 1, source.end());
                            else 
                                throw(std::runtime_error("Invalid file name given by the error"));
                            //get the leaf from the sources and append them 
                            //to the dstDir. new files will be of _dstDir+source_leaf
                            sourceLeaf = fc->_dstDir + "/" + sourceLeaf;
                            _info<<"sourceFile: "<<sourceLeaf;
                            if(boost::filesystem::is_directory(sourceLeaf)){
                                spawnAttribInitializer(sourceLeaf, fc->_uid, fc->_gid);
                            }else{
                                initializeInfoRecord(sourceLeaf, fc->_uid, fc->_gid);
                                logFileActivity(fc->_uid, fc->_gid, sourceLeaf, "created a new version");
                            }
                        }
                    }
                }else if(fc->_ctype == REMOVE){
                    for (unsigned int i = 2 ; i < fc->_argvCount; i++){
                        std::string source(fc->_argv[i]);
                        cleanupMongodbForRemovedDirectory(source);
                    }
                }else if(fc->_ctype == ZIP){
                    //create the info record for the new archive born 
                    std::string archiveName(fc->_argv[2]);
                    initializeInfoRecord(archiveName, fc->_uid, fc->_gid);
                    logFileActivity(fc->_uid, fc->_gid, archiveName, "created a new version");
                }else if(fc->_ctype == UNZIP){
                    //create the info record for the new file or directory born
                    //FIXME: how do we get the file or directory name which is extracted ? 
                }
            }
            delete fc;
        }
    }else
        _error<<"handleChildDeath() Unable to find the Command object handle for child:"<<child;
    return;
}

static void
handleTerminationSignal(struct signalfd_siginfo *fdsi)
{
    _info<<"handleTerminationSignal() recvd sigterm handler exiting...";
    exit(0);
    return;
}

static void
processSignals(service *svc, struct signalfd_siginfo *fdsi)
{
    if (fdsi->ssi_signo == SIGCHLD) handleChildDeath(fdsi);
    else if (fdsi->ssi_signo == SIGTERM) handleTerminationSignal(fdsi);
    return;
}

#define EVENT_SIZE  (sizeof (struct inotify_event))
#define EVENT_BUF_LEN  (1024*(EVENT_SIZE + 16))

//called when there is a change in the file system directory we are tracking
//xlates the event and sends it to the client.
static void
watchFilesystem(service *svc, int fd)
{
    _info<<"watchFilesystem() file system event observed";
    try{
        std::string notiftype, description, preview;
        assert(fd > 0);
        char buf[EVENT_BUF_LEN];
        int length = _eintr(::read(fd, buf, sizeof(buf)));
        if((length <= 0) && (errno == EAGAIN))
        { 
            _error<<"watchFilesystem() ::read() on inotifyfd returned EAGAIN"; 
            return; 
        }
        int i = 0;
        while (i < length){
            struct inotify_event *event = (struct inotify_event *) &buf[i];     
            if (event->len){
                std::string fname(event->name);
                if(fname.at(0) == '.'){
                    i += EVENT_SIZE + event->len;
                    continue; //no need to inform clients about "." files.
                }
                std::string directory = getDirForWatchDescriptor(event->wd);
                fname = directory + "/" + fname;
                if (event->mask & IN_CREATE){
                    if (event->mask & IN_ISDIR){
                        _info<<"New directory created:"<<event->name;
                        notiftype = "directory_created";
                    }
                    else{
                        _info<<"New File created:"<<event->name;
                        notiftype = "file_created";
                    }
                }
                else if(event->mask & IN_DELETE){
                    if (event->mask & IN_ISDIR){
                        _info<<"Directory deleted:"<<event->name;
                        notiftype = "directory_deleted";
                    }else{
                        _info<<"File deleted:"<<event->name;
                        notiftype = "file_deleted";
                    }
                }
                else if(event->mask & IN_CLOSE_WRITE){
                    _info<<"File modified:"<<event->name;
                    notiftype = "file_modified";
                }
                else if((event->mask & IN_DELETE_SELF) || \
                        (event->mask & IN_MOVE_SELF)){
                    _info<<"Directory moved or deleted:"<<event->name;
                    notiftype = "self_deleted";
                }
                _info<<"Filesystem event observed "<<" event type:"
                    <<notiftype<<" fname:"
                    <<event->name<<" descriptor:"
                    <<event->wd;
                for(auto &kv : watchList){
                    auto tpl = kv.second;
                    if (std::get<0>(tpl) == (event->wd)){
                        for(auto &itr : std::get<1>(tpl)){
                            _info<<"sending event to client:"<<itr
                                <<" fname:"<<fname
                                <<" notiftype:"<<notiftype;
                            if((notiftype == "file_created") || 
                                    (notiftype == "file_modified") || 
                                    (notiftype == "directory_created")){
                                struct stat sbuf = {0};
                                _except(stat(fname.c_str(), &sbuf));
                                std::string event("event");
                                std::string extension;
                                size_t pos = fname.find_last_of(".");
                                if(pos != std::string::npos) 
                                    extension.assign(fname.begin()+ pos + 1, 
                                            fname.end());
                                std::string filetype = extension.size() ? \
                                                       getMimeType(extension) : \
                                                       "unknown";
                                uint64_t fileSize = sbuf.st_size;
                                tupl tv[] = 
                                {
                                    {"mesgtype",  event},
                                    {"eventtype", notiftype},
                                    {"fname", fname},
                                    {"isdir", std::string(S_ISDIR(sbuf.st_mode) ? \
                                            "true" : "false")},
                                    {"size",  fileSize},
                                    {"type", filetype}
                                };
                                size_t size = sizeof(tv)/sizeof(tupl);
                                string json = putJsonVal(tv, size);
                                writeFmgrReply(itr, json.c_str(), json.length());
                            }
                            if((notiftype == "file_deleted") || 
                                    (notiftype == "directory_deleted")){
                                std::string event("event");
                                tupl tv[] = 
                                {
                                    {"mesgtype",  event},
                                    {"eventtype", notiftype},
                                    {"fname", fname},
                                };
                                size_t size = sizeof(tv)/sizeof(tupl);
                                string json = putJsonVal(tv, size);
                                writeFmgrReply(itr, json.c_str(), json.length());
                            }
                        }
                    }
                }
            }
            i += EVENT_SIZE + event->len;
        }
    }
    catch(syscallException &ex){ 
        _error<<"syscall exception in watchFilesystem():"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"standard exception in watchFilesystem():"<<ex.what(); 
        throw(ex); 
    }
    return;
}

static std::vector<int>
getGroupMemberList(int groupId)
{
    std::vector<int> memberList;
    std::unique_lock<std::mutex> lock(dbMutex);
    mongo::BSONObj _o = conn.findOne("akorpdb.groups", QUERY("gid"<< groupId));
    if (_o.isEmpty()){ _error<<"Unable to find the group with id:"<<groupId; 
        return memberList; }
    mongo::BSONObj _membersObj = _o["members"].Obj();
    _membersObj.vals<int>(memberList);
    return std::move(memberList);
}

static void
readConfig()
{
    mongo_db_ip = getConfigValue<std::string>("system.mongo_server_address");
    debug_level = getConfigValue<std::string>("fmgr.debug_level");
    log_file = getConfigValue<std::string>("fmgr.log_file");
    thread_count = getConfigValue<int>("fmgr.thread_count");
    storage_base = getConfigValue<std::string>("fmgr.folder_dir");
    return;
}

static void 
dumpConfig()
{
    _trace<<"dumping config:";
    _trace<<"mongo_db_ip: "<<mongo_db_ip;
    _trace<<"debug_level: "<<debug_level;
    _trace<<"log_file: "<<log_file;
    _trace<<"thread_count: "<<thread_count;
    _trace<<"storage_base: "<<storage_base;
    return;
}

static void 
mutex_lock(void *vptr)
{
    (static_cast<std::mutex*>(vptr))->lock();
    return;
}

static void 
mutex_unlock(void *vptr)
{
    (static_cast<std::mutex*>(vptr))->unlock();
    return;
}

int
main(int ac, char **av)
{
    sleep(3);
	std::set_terminate(unCaughtExceptionHandler);
	try {
		struct rlimit lim = {RLIM_INFINITY, RLIM_INFINITY};
		_except(::setrlimit(RLIMIT_CORE, &lim));
		_except(daemon(0, 1));
        loadConfig("/etc/antkorp/antkorp.cfg");
        readConfig();
		//open the log file.
		openLog(log_file);
        setLogLevel(SEVERITY_TRACE);
        dumpConfig(); //dump config for informational purpose only works with info level.

        if(debug_level == "info")  setLogLevel(SEVERITY_INFO);
        else if(debug_level == "error") setLogLevel(SEVERITY_ERROR);
        else if((debug_level == "warning") || ( debug_level == "warn")) 
            setLogLevel(SEVERITY_WARNING);
        else if(debug_level == "fatal") setLogLevel(SEVERITY_FATAL);
        else if(debug_level == "debug") setLogLevel(SEVERITY_DEBUG);
        else if(debug_level == "trace") setLogLevel(SEVERITY_TRACE);

		_info<<"Deployment model: "<<(cloudDeployment ? "Cloud":"OnPremise");
		svc = new service("fmgr");
		_info<<"Service created and registered with ngw";
		inotifyFd = _except(inotify_init());
        svc->addReadFd(inotifyFd, watchFilesystem);
		_info<<"Opened inotify fd for watching directory changes.";

        conn.connect(mongo_db_ip);
		_info<<"Connected to mongodb @ "<<mongo_db_ip;
        
		_info<<"Opening lua library and loading the fmgr.lua module";
		L = lua_open();
		luaL_openlibs(L);
		int rc = luaL_dofile(L, "/opt/antkorp/custom/lua/fmgr.lua");
        if(rc != 0){
            const char *er = lua_tostring(L, -1);
            _error<<"failed to load fmgr.lua cannot proceed bailing out .."
                <<std::string(er); 
            return -1; 
        }
		_info<<"Opened lua state and loaded the fmgr.lua module";
        setLuaServiceHandle(svc); //set the service handle to the lua to be used to send and recv notifications.
        svc->setControlRecvHandler(handleControlMesg);
        svc->setDataRecvHandler(handleRequest);
        svc->setSignalHandler(processSignals);
		tPool = new ThreadPool(thread_count);
		_info<<"Thread pool created with "<<thread_count<<" batch count.";
		_info<<"Blocking on the service::run() till eternity ...";
        svc->run();
	}
    catch(syscallException &ex){ 
        _error<<"main() Exited with syscall exception:"<<ex.what(); 
        return -1; 
    }
    catch(std::exception &ex){ 
        _error<<"main() Exited with standard exception:"<<ex.what(); 
        return -1; 
    }
	return 0;
}
