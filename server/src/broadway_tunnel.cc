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

//File contains the imeplementation for tunneling the broadway client input to the 
//gtk broadway daemon. we use this for rendering and editing libreoffice documents
//in browser.
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
#include <boost/asio.hpp>
#include <boost/date_time/posix_time/posix_time.hpp>
#include "config/asio_no_tls_client.hpp"
#include "message_buffer/alloc.hpp"
#include "client.hpp"
#include "tpool.hh"
#include "log.hh"
#include "config.hh"
#include "broadway_tunnel.hh"

using namespace boost::archive::iterators;
typedef base64_from_binary<transform_width<const char *, 6, 8>> binToBase64;
typedef binary_from_base64<transform_width<const char *, 8, 6>> base64ToBin;
static int gNextDisplayNumber = 10;

class broadwayTunnel;
static void add2BwTunnelTbl(broadwayTunnel *bw);
static void delFromBwTunnelTbl(broadwayTunnel *bw);
static broadwayTunnel *getBwTunnel(std::string);
static broadwayTunnel *gSuicideObject = nullptr;

static void writeTunneldReply(int, const char *, size_t);
static int signalFd = -1;
static std::string debug_level = "error";
static std::string log_file = "/var/log/antkorp/tunneld";
typedef websocketpp::client<websocketpp::config::asio_client> broadwayConnectionT; //client handle of the tunnel.
static service *svc = nullptr;
static int readEnd;
static int writeEnd;
static boost::asio::posix::stream_descriptor *asioPipeHandle = nullptr;
static std::string sofficePath = "/usr/lib/libreoffice/program/soffice.bin";

//kill the child with the given pid.
static void killChild(pid_t child) 
{ 
    int rc = 0;
    if(child) rc = ::kill(child, SIGKILL); 
    if(rc < 0) _error<<"killChild() failed with errno:"<<errno;
    return;
}

//broadway tunnel.
class broadwayTunnel : public boost::intrusive::set_base_hook<boost::intrusive::optimize_size<true>>
{
    int _client = -1; //websocket client connection.
    std::string _cookie = ""; //cookie sent by the client for the edit tunnel.
    pid_t _gtkApp = 0; //id of the gtk application.
    pid_t _broadwaydChild = 0; //id of the gtk application.
    std::string _dname;
    int broadwayPort = 0; 
    int displayNumber = 0;
    std::string _address = ""; //address of the broadway server.
    unsigned int _gtkAppArgvCount = 0;
    unsigned int _broadwaydArgvCount = 0;
    char **_gtkAppArgv = nullptr; //This is to be freed by us.
    char **_broadwaydArgv = nullptr;
    int _gtkAppPipe[3] = {0, 0, 0}; //pipe linking us and the command
    int _broadwaydPipe[3] = {0, 0, 0}; //pipe linking us to the broadwayd
    broadwayConnectionT broadwayConnection;
    websocketpp::connection_hdl broadwayConnectionHdl;
    bool connectionSuccess = false;
    boost::asio::io_service &ioSvc;
    boost::asio::deadline_timer reconnectTimer;
    unsigned int retryCount = 5;
    broadwayConnectionT::connection_ptr conn;

    //tunnel the broadway data to the client.
    //create a new repaint event and then wrap the broadway data in the repaint 
    //event and send it to the client.
    public:
    void tunnelBroadwayDataToClient(std::string &data) 
    {
        const char *ptr = data.data();
        std::string event("event"), eventtype("document_repaint");
        std::stringstream base64;
        std::copy(binToBase64(ptr), 
                binToBase64(ptr + data.size()), 
                boost::archive::iterators::ostream_iterator<char>(base64));
        tupl tv[] = {
            {"mesgtype",  event},
            {"eventtype", eventtype},
            {"cookie", _cookie},
            {"data", base64.str()}
        };
        size_t size = sizeof(tv)/sizeof(tupl);
        string json = putJsonVal(tv, size);
        //watch it some times these can be pretty huge bursts coming our way.
        _info<<"tunnelBroadwayDataToClient() got some data writing it to client:";
        writeTunneldReply(_client, json.data(), json.length());
        return;
    }

    //tunnel the client data destined to broadway daemon.
    void tunnelClientDataToBroadway(std::string &data) 
    {
        std::string bin = JSONBase64::json_decode64(data);
        broadwayConnection.send(broadwayConnectionHdl, bin, \
                websocketpp::frame::opcode::BINARY);
        return;
    }

    void handleBroadwayConnectionOpen(websocketpp::connection_hdl hdl)
    {
        reconnectTimer.cancel(); //connection succeeded cancel the timer.
        _info<<"handleBroadwayConnectionOpen() connection opened";
        broadwayConnectionHdl = hdl;
        connectionSuccess = true;
        _info<<"Opened the tunnel to the broadway server successfully.";
        int rc = ::popenCustom(_gtkAppPipe, &_gtkApp, _gtkAppArgv[0], _gtkAppArgv);
        if (rc < 0){
            _error<<"popenCustom failed with rc:"<<rc;
            die();
        }
        svc->addReadFd(_gtkAppPipe[1],
                std::bind(&broadwayTunnel::handleChildStdOut,
                    this,
                    std::placeholders::_1,
                    std::placeholders::_2));
        svc->addReadFd(_gtkAppPipe[2],
                std::bind(&broadwayTunnel::handleChildStdErr,
                    this,
                    std::placeholders::_1,
                    std::placeholders::_2));
        _info<<"Spawned the gtk app successfully with pid: "<<_gtkApp;
        return;
    }

    void handleBroadwayConnectionOutput(websocketpp::connection_hdl hdl, 
            websocketpp::config::asio_client::message_type::ptr mesg)
    {
        _info<<"handleBroadwayConnectionOutput() data available";
        std::string payload = mesg->get_payload();
        tunnelBroadwayDataToClient(payload);
        return;
    }

    void handleBroadwayConnectionClose(websocketpp::connection_hdl hdl)
    {
        _info<<"handleBroadwayConnectionClose(): connection closed";
        die();
        return;
    }

    void handleBroadwayConnectionFail(websocketpp::connection_hdl hdl)
    {
        _error<<"handleBroadwayConnectionFail() failure connecting to broadway.";
        //start a tunnel specific asynchronous timer and then issue a reconnect.
        if(!connectionSuccess){
            if(retryCount){
                _error<<"Connection failure, reconnect issued:";
                reconnectTimer.expires_from_now(boost::posix_time::seconds(1));
                reconnectTimer.async_wait(boost::bind(
                            &broadwayTunnel::reconnectTimerCallback, 
                            this, 
                            boost::asio::placeholders::error));
                retryCount--;
                return;
            }
            reconnectTimer.cancel(); //connection succeeded cancel the timer.
            _error<<"handleBroadwayConnectionFail() ran out of retries and \
                committing suicide.";
            die();
        }
        return;
    }

    broadwayTunnel(boost::asio::io_service *svc, int clientid, std::string cookie,\
            std::string dname) 
        :
        _client(clientid),
        _cookie(cookie),
        _dname(dname),
        displayNumber(++gNextDisplayNumber),
        ioSvc(*svc),
        reconnectTimer(*svc, boost::posix_time::seconds(1))
    {
        _info<<"New broadway tunnel for opening document:"<<dname;
        broadwayPort = 8080 + (displayNumber);
        _address = std::string("ws://") + "127.0.0.1" + std::string(":") + \
                   num2String(broadwayPort) + std::string("/socket-bin");
        _gtkAppArgv = static_cast<char**>(operator new(64));
        _gtkAppArgv[_gtkAppArgvCount++] = strDup(sofficePath.c_str()); 
        _gtkAppArgv[_gtkAppArgvCount++] = strDup("--norestore");
        _gtkAppArgv[_gtkAppArgvCount++] = strDup("--nologo");
        _gtkAppArgv[_gtkAppArgvCount++] = strDup("--minimized");
        _gtkAppArgv[_gtkAppArgvCount++] = strDup("--view");
        _gtkAppArgv[_gtkAppArgvCount++] = strDup(dname.c_str());
        _gtkAppArgv[_gtkAppArgvCount] = nullptr;
        
        _broadwaydArgv = static_cast<char**>(operator new(64));
        _broadwaydArgv[_broadwaydArgvCount++] = strDup("/opt/antkorp/foreign/bin/broadwayd");
        _broadwaydArgv[_broadwaydArgvCount++] = strDup(std::string(std::string(":") \
                    + num2String(displayNumber)).c_str());
        _broadwaydArgv[_broadwaydArgvCount] = nullptr;
        add2BwTunnelTbl(this);
        return;
    }

    void handleChildStdErr(service *rctor, int fd) 
    { 
        //inform the client that there is an error on the child
        char buf[512] = {'\0'};
        _error<<"data on child stderr:";
        int rc = _except(::read(fd, buf, sizeof(buf)));
        if (rc) _eintr(::write(2, buf, rc));
        if(!rc){
            _error<<"read() returned 0 bytes on the stderr of child, seems the child is done.";
            int exitStatus = 0;
            _eintr(::waitpid(_gtkApp, &exitStatus, 0));
            std::string status = (WEXITSTATUS(exitStatus)== 0) ? "success" : "fail"; 
            std::string response("response");
            tupl tv[] = {{"mesgtype", response}, {"cookie", getClientCookie()}, {"status",status}};
            size_t size = sizeof(tv)/sizeof(tupl);
            string json = putJsonVal(tv, size);
            writeTunneldReply(getClient(), json.c_str(), json.length());
            die();
            return;
        }
        return;
    }
    void handleChildStdOut(service *rctor, int fd) 
    { 
        //inform the client that there is an error on the child
        _error<<"data on child stdout:";
        return;
    }

    void reconnectTimerCallback(const boost::system::error_code &ec)
    {
        if(!ec){
            _info<<"reconnectTimerCallback() fired issuing reconnect.";
            broadwayConnection.connect(conn);
            reconnectTimer.expires_from_now(boost::posix_time::seconds(1));
            reconnectTimer.async_wait(
                    boost::bind(&broadwayTunnel::reconnectTimerCallback, 
                        this, 
                        boost::asio::placeholders::error));
        }
        return;
    }

    //launch the child with the arguments given.
    int run()
    {
        //set all the environment variables
        //BROADWAY_DISPLAY=:5 
        //GDK_BACKEND=broadway
        //SAL_USE_VCLPLUGIN=gtk3
        setenv("BROADWAY_DISPLAY", 
                std::string(std::string(":") + num2String(displayNumber)).c_str(), 
                true);
        setenv("GDK_BACKEND", "broadway", true);
        setenv("SAL_USE_VCLPLUGIN", "gtk3", true);
        int rc = ::popenCustom(_broadwaydPipe, &_broadwaydChild, 
                _broadwaydArgv[0], 
                _broadwaydArgv);
        if (rc < 0){
            _error<<"broadwayTunnel::run() popenCustom() failed with rc:"<<rc;
            return rc;
        }
        _info<<"Spawned the broadway demon successfully connect @:"<<_address<<
            " with pid: "<<_broadwaydChild;
        svc->addReadFd(_broadwaydPipe[1],
                std::bind(&broadwayTunnel::handleChildStdOut,
                    this,
                    std::placeholders::_1,
                    std::placeholders::_2));
        svc->addReadFd(_broadwaydPipe[2],
                std::bind(&broadwayTunnel::handleChildStdErr,
                    this,
                    std::placeholders::_1,
                    std::placeholders::_2));
        broadwayConnection.clear_access_channels(websocketpp::log::alevel::all);
        broadwayConnection.clear_error_channels(websocketpp::log::elevel::all);
		broadwayConnection.init_asio(&ioSvc);
		broadwayConnection.set_open_handler(
                websocketpp::lib::bind(&broadwayTunnel::handleBroadwayConnectionOpen, 
                    this,
                    websocketpp::lib::placeholders::_1));
		broadwayConnection.set_message_handler(
                websocketpp::lib::bind(&broadwayTunnel::handleBroadwayConnectionOutput, 
                    this,
                    websocketpp::lib::placeholders::_1,
                    websocketpp::lib::placeholders::_2));
		broadwayConnection.set_close_handler(
                websocketpp::lib::bind(&broadwayTunnel::handleBroadwayConnectionClose, 
                    this,
                    websocketpp::lib::placeholders::_1));
        broadwayConnection.set_fail_handler(
                websocketpp::lib::bind(&broadwayTunnel::handleBroadwayConnectionFail, 
                    this,
                    websocketpp::lib::placeholders::_1));
		websocketpp::lib::error_code ec;
		conn = broadwayConnection.get_connection(_address, ec);
        if(ec){
            _error<<"Failed to connect to the broadway daemon @ "<<_address<<
                " websocketpp::error"<<ec.message();
            return -1;
        }
        //give a chance to the broadwayd to bootup , issue a delayed connect.
        reconnectTimer.async_wait(boost::bind(
                    &broadwayTunnel::reconnectTimerCallback, 
                    this, 
                    boost::asio::placeholders::error));
        return rc;
    }

    void kill() 
    { 
        killChild(_gtkApp); 
        killChild(_broadwaydChild); 
        return; 
    }

    ~broadwayTunnel() 
    { 
        if (_gtkAppArgv){
            for (unsigned int i = 0 ; i < _gtkAppArgvCount; i++) 
                delete _gtkAppArgv[i]; 
            delete _gtkAppArgv; 
        }
        if (_broadwaydArgv){ 
            for (unsigned int i = 0 ; i < _broadwaydArgvCount; i++) 
                delete _broadwaydArgv[i]; 
            delete _broadwaydArgv; 
        }
        if(_broadwaydPipe[1]) svc->remReadFd(_broadwaydPipe[1]);
        if(_broadwaydPipe[2]) svc->remReadFd(_broadwaydPipe[2]);
        if(_broadwaydChild){ 
            pcloseCustom(_broadwaydPipe); 
            killChild(_broadwaydChild); 
            _eintr(::waitpid(_broadwaydChild, NULL, 0)); 
        }
        if(_gtkAppPipe[1]) svc->remReadFd(_gtkAppPipe[1]);
        if(_gtkAppPipe[2]) svc->remReadFd(_gtkAppPipe[2]);
        if(_gtkApp){ 
            pcloseCustom(_gtkAppPipe); 
            killChild(_gtkApp); 
            _eintr(::waitpid(_gtkApp, NULL, 0)); 
        }
        reconnectTimer.cancel();
        delFromBwTunnelTbl(this); 
        return; 
    }
    
    void die()
    { 
        char ch = 'a'; 
        gSuicideObject = this; 
        _eintr(::write(writeEnd, &ch, 1)); 
        return;
    }
    std::string& getClientCookie() { return _cookie; }
    pid_t getGtkPid() { return _gtkApp; }
    pid_t getBroadwaydPid() { return _broadwaydChild; }
    int getClient() { return _client; }
    std::string getCookie() { return _cookie; }
    friend bool operator < (const broadwayTunnel &a, const broadwayTunnel &b) 
    { return a._cookie< b._cookie; }
    friend bool operator > (const broadwayTunnel &a, const broadwayTunnel &b) 
    { return a._cookie> b._cookie; }
    friend bool operator == (const broadwayTunnel &a, const broadwayTunnel &b) 
    { return a._cookie == b._cookie; }
};

typedef boost::intrusive::set<broadwayTunnel, \
boost::intrusive::compare<std::greater<broadwayTunnel>>> \
bwTunnelTblT;
static bwTunnelTblT bwTunnelTbl;

static void 
add2BwTunnelTbl(broadwayTunnel *bw) 
{ 
    assert(!bw->is_linked()); 
    bwTunnelTbl.push_back(*bw); 
    return; 
}
static void 
delFromBwTunnelTbl(broadwayTunnel *bw) 
{ 
    if (bw->is_linked()) 
        bwTunnelTbl.erase(bwTunnelTblT::s_iterator_to(*bw)); 
    return; 
} 

static broadwayTunnel * 
getBwTunnel(std::string cookie)
{
    broadwayTunnel *bw = nullptr;
    for(bwTunnelTblT::iterator itr = bwTunnelTbl.begin(); 
            itr != bwTunnelTbl.end(); 
            itr++) 
        if(itr->getClientCookie() == cookie) return &(*itr);
    return bw;
}

static broadwayTunnel * 
getBwTunnelForChildPid(pid_t pid)
{
    broadwayTunnel *bw = nullptr;
    for(bwTunnelTblT::iterator itr = bwTunnelTbl.begin(); 
            itr != bwTunnelTbl.end(); 
            itr++) 
        if((itr->getGtkPid() == pid) || (itr->getBroadwaydPid())) 
            return &(*itr);
    return bw;
}

static broadwayTunnel * 
getBwTunnelForClient(int clientid)
{
    broadwayTunnel *bw = nullptr;
    for(bwTunnelTblT::iterator itr = bwTunnelTbl.begin(); 
            itr != bwTunnelTbl.end(); 
            itr++) 
        if(itr->getClient() == clientid) return &(*itr);
    return bw;
}

static broadwayTunnel * 
getBwTunnelForClient(std::string cookie)
{
    broadwayTunnel *bw = nullptr;
    for(bwTunnelTblT::iterator itr = bwTunnelTbl.begin(); 
            itr != bwTunnelTbl.end(); 
            itr++) 
        if(itr->getCookie() == cookie) return &(*itr);
    return bw;
}

static void
event2Client(int clnt, std::string &eventtype, std::string &dname)
{
    std::string event("event");
    tupl tv[] = {
        {"mesgtype",  event},
        {"eventtype", eventtype},
        {"file", dname},
    };
    size_t size = sizeof(tv)/sizeof(tupl);
    string json = putJsonVal(tv, size);
    writeTunneldReply(clnt, json.c_str(), json.length());
    return;
}

static void
error2Client(int clnt, std::string &cookie, std::string emsg)
{
    std::string error("error");
    tupl tv[] = {
        {"mesgtype",  error},
        {"cookie"  ,  cookie},
        {"error"    ,  emsg}
    };
    size_t size = sizeof(tv)/sizeof(tupl);
    string json = putJsonVal(tv, size);
    writeTunneldReply(clnt, json.c_str(), json.length());
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
	writeTunneldReply(clientid, json.c_str(), json.length());
	return;
}

//open the document check the extension before opening the doc. 
//this will spawn a soffice program with the document.
//create a client connection to the broadwayd server and then add
//the connection identifier to the reactor and then 
static void
handleOpen(service *svc, int clnt, char *jsonData)
{
	std::string cookie, dname;
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
            _info<<"handleOpen() new open request: dname:"
                <<dname<<" uid:"
                <<uid<<" gid:"
                <<gid;
            bool opendoc = false;
            if(strstr(dname.c_str(), ".odp") || strstr(dname.c_str(), ".fodp") ||
                    strstr(dname.c_str(), ".odt") || strstr(dname.c_str(), ".fodt") ||
                    strstr(dname.c_str(), ".ods") || strstr(dname.c_str(), ".fods") ||
                    strstr(dname.c_str(), ".odg") || strstr(dname.c_str(), ".fodg") ||
                    strstr(dname.c_str(), ".odf")) 
                opendoc = true;
            if(!opendoc){
                _error<<"handleOpen() unsupported file type requested:";
                error2Client(clnt, cookie, "No support to open this file type");
                return;
            }
            broadwayTunnel *bw = nullptr; 
            //only one tunnel per client is supported as of now so reject any further requests. 
            bw = getBwTunnelForClient(clnt);
            if(bw){
                _error<<"handleOpen() more than one tunnel open requested";
                error2Client(clnt, 
                        cookie, 
                        "Only one document can be opened per client as of now.");
                return;
            }
            success2Client(clnt, cookie);
            bw = new broadwayTunnel(svc->getAsioSvcRef(), clnt, cookie, dname);
            int rc = bw->run();
            if(rc < 0){
                error2Client(clnt, 
                        cookie, 
                        "There was some internal error on server, Please retry \
                        the operation.");
                _error<<"broadwayTunnel::run() failed with rc:"<<rc;
                delete bw;
            }
        }
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation \
                requested.";
            error2Client(clnt, 
                    cookie, 
                    "Not enough data to perform the operation");
		}
	}
    catch(syscallException &ex){ 
        _error<<"handleOpen() dname:"<<dname<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleOpen() dname:"<<dname <<
            " Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
	return;
}

static void
handleClose(service *svc, int clnt, char *jsonData)
{
    std::string cookie;
    int gid, uid;
    tupl t[] = {
        {"cookie"  , &cookie},
        {"gid"   , &gid},
        {"uid"   , &uid}
    };
    unsigned int sz = sizeof(t)/sizeof(tupl);
    try {
        JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            _info<<"handleClose() close request:"<<" uid:"<<uid<<" gid:"<<gid;
            broadwayTunnel *bw = nullptr; 
            bw = getBwTunnelForClient(cookie);
            if(bw){
                _error<<"handleClose() tunnel missing with the given cookieid:"
                    <<cookie;
                error2Client(clnt, 
                        cookie, 
                        "There was some internal error on server");
                return;
            }
            delete bw;
            success2Client(clnt, cookie);
        }
        else{
            _error<<""<<__FUNCTION__<<"() Not enough data to perform operation \
                requested.";
            error2Client(clnt, 
                    cookie, 
                    "Not enough data to perform the operation");
        }
    }
    catch(syscallException &ex){
        _error<<"handleClose() "<<
            " failed with : syscall exception:"<<ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){
        _error<<"handleClose()"<<
            " Exited with standard exception:"<<ex.what(); 
        throw(ex); 
    }
    return;
}

//handle the broadway input message and send it to the corresponding client.
static void
handleBroadwayInput(service *svc, int clnt, char *jsonData)
{
	std::string cookie;
    std::string data;
    int gid, uid;
	tupl t[] = {
		{"cookie"  , &cookie},
		{"uid"     , &uid},
        {"data",     &data}
	};
	unsigned int sz = sizeof(t)/sizeof(tupl);
	try {
		JSONNode n = libjson::parse(jsonData);
        if(getJsonVal(n, t, sz)){
            _info<<"handleBroadwayInput(): client activity.";
            broadwayTunnel *bw = getBwTunnelForClient(clnt);
            if(bw) bw->tunnelClientDataToBroadway(data);
            else {
                _error<<"broadwayTunnel missing for client:"<<clnt;
                error2Client(clnt, 
                        cookie, 
                        "There was some internal error performing the operation,\
                        Please retry.");
            }
        }
		else{
			_error<<""<<__FUNCTION__<<"() Not enough data to perform operation \
                requested.";
		}
	}
    catch(syscallException &ex){ 
        _error<<"handleBroadwayInput() :failed with : syscall exception:"<<
            ex.what(); 
        throw(ex); 
    }
    catch(std::exception &ex){ 
        _error<<"handleBroadwayInput(): Exited with standard exception:"<<
            ex.what(); 
        throw(ex); 
    }
	return;
}


//process the websocket input
static void 
processRequest (service *svc, int clientid, char *rbuf, unsigned int bufSz) 
{
	int nwConn = clientid;
	char *jsonData = rbuf;
    std::string cookie, msgType, request;
    try {
        JSONNode n = libjson::parse(jsonData);
        //extract all possible parameters for a message 
        //a message can be a request response or event or error
        tupl t[] = {
            {"mesgtype", &msgType},
            {"request" , &request},
            {"cookie"  , &cookie}
        };

        unsigned int sz = sizeof(t)/sizeof(tupl);
        getJsonVal(n, t, sz);
        if (msgType == "request"){
            if (request == "open") 
                handleOpen(svc, 
                        nwConn, 
                        jsonData);
            else if (request == "broadway_input") 
                handleBroadwayInput(svc, 
                        nwConn, 
                        jsonData);
            else if (request == "close") 
                handleClose(svc, 
                        nwConn, 
                        jsonData);
        }
    }
    catch(syscallException &ex){
        _error<<__FUNCTION__<<"() ;caught: syscall exception:"<<ex.what(); 
        error2Client(nwConn, 
                cookie, 
                "There was some internal error performing the operation,\
                Please retry.");
    }
    catch(std::exception &ex){ 
        _error<<__FUNCTION__<<"() ;caught: standard exception:"<<ex.what(); 
        error2Client(nwConn, 
                cookie, 
                "There was some internal error performing the operation,\
                Please retry.");
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
    try 
    {
        processRequest(svc, clientid, nonconst(data.data()), data.size());
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

//handle the client departure.
static void 
handleClientGone(int clientid)
{
    _info<<"client departure : "<<clientid;
    //get the broadway tunnel and delete the tunnel object. 
    broadwayTunnel *bw = getBwTunnelForClient(clientid); 
    if(bw) delete bw;
    return;
}

//clean up the pending operations for the clients which have went down.
//delete all the pending operations in progress for the particular client.
static void
handleControlMesg(service *svc, service::controlMessage &cmsg)
{
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
                handleClientGone(cmsg.clientDeparture.clientid);
                break;
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT:
                handleClientGone(cmsg.clientDisconnect.clientid);
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
writeTunneldReply(int clientid, const char *buf, size_t bufSz)
{
	//respond back to the client
    svc->sendToClient(clientid, -1, buf, bufSz);
	return;
}

static void
handleChildDeath(struct signalfd_siginfo *fdsi)
{
    pid_t child = fdsi->ssi_pid;
    _info<<"Child death handler called reaping status child:"<<child;
    //get the fsCommand object using the child pid and delete the object.
    broadwayTunnel *bw = nullptr;
    bw = getBwTunnelForChildPid(child);
    if(bw){
        int client = bw->getClient();
        if(client){
            int exitStatus = 0;
            waitpid(child, &exitStatus, 0);
            if(!WIFSIGNALED(exitStatus) && WIFEXITED(exitStatus) && \
                    (WEXITSTATUS(exitStatus) != 0)){
                _error<<"Child: "<<child<<" exited with status:"<<exitStatus;
            }
            //inform the client that his tunnel has crashed.
            error2Client(client, bw->getClientCookie(), "There was an internal \
                    error on server, Please try the operation again");
            delete bw;
        }
    }else
        _error<<"missing tunnel for the child:"<<child;
    return;
}

struct disposeTunnel
{
    void operator()(broadwayTunnel *bt) 
    {
        assert(bt);
        delete bt; 
    }
};

static void
handleTerminationSignal(struct signalfd_siginfo *fdsi)
{
    _info<<"recvd sigterm handler exiting...";
    bwTunnelTbl.erase_and_dispose(bwTunnelTbl.begin(), 
            bwTunnelTbl.end(), 
            std::bind(disposeTunnel(), 
                std::placeholders::_1));
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

static void
readConfig()
{
    //sofficePath = getConfigValue<std::string>("tunneld.libreoffice_path");
    debug_level = getConfigValue<std::string>("tunneld.debug_level");
    log_file = getConfigValue<std::string>("tunneld.log_file");
    return;
}

static void
deleteTunnel()
{
    char ch = '\0';
    _eintr(::read(readEnd, &ch, 1));
    if(gSuicideObject) delete gSuicideObject;
    gSuicideObject = nullptr;
    asioPipeHandle->async_read_some(boost::asio::null_buffers(), 
            boost::bind(deleteTunnel));
    return;
}

int
main(int ac, char **av)
{
    sleep(3);
    //Check for executables at well known locations and then set the path 
    //name for the applications accordingly. different distributions 
    //place applications @ different locations.
	std::set_terminate(unCaughtExceptionHandler);
	try {
		struct rlimit lim = {RLIM_INFINITY, RLIM_INFINITY};
		_except(::setrlimit(RLIMIT_CORE, &lim));
		_except(::daemon(0, 1));
        loadConfig("/etc/antkorp/antkorp.cfg");
        readConfig();
		//open the log file.
		openLog(log_file);
        setLogLevel(SEVERITY_TRACE);
        if(debug_level == "info")  setLogLevel(SEVERITY_INFO);
        else if(debug_level == "error") setLogLevel(SEVERITY_ERROR);
        else if(debug_level == "warning") setLogLevel(SEVERITY_WARNING);
        else if(debug_level == "fatal") setLogLevel(SEVERITY_FATAL);
        else if(debug_level == "debug") setLogLevel(SEVERITY_DEBUG);
        else if(debug_level == "trace") setLogLevel(SEVERITY_TRACE);
		svc = new service("tunneld");
		_info<<"Service created and registered with ngw";

        int fd[2];
        _except(::pipe(fd));
        readEnd = fd[0];
        writeEnd = fd[1];
        _except(::fcntl(readEnd, F_SETFD, O_NONBLOCK));
        _except(::fcntl(writeEnd, F_SETFD, O_NONBLOCK));
        asioPipeHandle = new boost::asio::posix::stream_descriptor(*svc->\
                getAsioSvcRef());
        asioPipeHandle->assign(readEnd);
        asioPipeHandle->async_read_some(boost::asio::null_buffers(), 
                boost::bind(deleteTunnel));
		_info<<"Created eventfd for reaping tunnel objects.";
        svc->setDataRecvHandler(handleRequest);
        svc->setControlRecvHandler(handleControlMesg);
        svc->setSignalHandler(processSignals);
		_info<<"Blocking on the iosvc::run() till eternity ...";
        svc->run();
	}
	catch(syscallException &ex) 
    { 
        _error<<"main() Exited with syscall  exception:"<<ex.what(); 
        return -1; 
    }
	catch(std::exception &ex) 
    { 
        _error<<"main() Exited with standard exception:"<<ex.what(); 
        return -1; 
    }
	return 0;
}
