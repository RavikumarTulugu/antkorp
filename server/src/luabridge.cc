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

#include <lua.h>
#include <lualib.h>
#include <lauxlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <sys/mount.h>
#include <stdio.h>
#include <math.h>
#include <sys/types.h>
#include <unistd.h>
#include <syslog.h>
#include <netinet/in.h>
#include <pthread.h>
#include <assert.h>
#include <signal.h>
#include <stdlib.h>
#include <stdbool.h>
#include <strings.h>
#include <linux/capability.h>
#include <sys/prctl.h>
#include <linux/prctl.h>
#include <errno.h>
#include <iostream>
#include "log.hh"
#include "akorpdefs.h"
#include "ocache.hh"
#include "svclib.hh"
#include <boost/algorithm/string.hpp>
#include <htmlcxx/html/Node.h>
#include <htmlcxx/html/ParserDom.h>
#include <curl/curl.h>
#include <string>
#include <gd.h>
#include "JSON_Base64.h"
#include <time.h>
#include <chrono>
#include <boost/algorithm/string/replace.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/random/random_device.hpp>
#include <boost/random/uniform_int_distribution.hpp>
#include <openssl/sha.h>
#include "config.hh"
#include "nfmgr.hh"

static service *svc = nullptr;
static int dataRecvFuncIdx;
static int bigDataRecvFuncIdx;
static int ctrlRecvFuncIdx; 
static int sigFuncIdx; 

__attribute__((constructor))
static void
loadLibrary(void) 
{
    std::cerr<<"\nluabridge.so module loaded";
    return;
}

__attribute__((destructor))
static void
unloadLibrary(void) 
{
    std::cerr<<"\nluabridge.so module unloaded";
    return;
}

//gimme a new uuid.
static int
generateUuid(lua_State *l)
{
    try{
        boost::uuids::uuid _u = boost::uuids::random_generator()();
        const std::string uidstr = boost::lexical_cast<std::string>(_u);
        __LUA_PUSHSTRING(l, uidstr.c_str());
        return 1;
    }
    catch(std::exception &e)
    {
        __LUA_PUSHNIL(l);
        std::string error = "Unable to generate uuid:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
}

static int 
currenttime(lua_State *l)
{
   #if 0
    boost::posix_time::ptime time = boost::posix_time::microsec_clock::local_time();
    boost::posix_time::time_duration duration(time.time_of_day());
    __LUA_PUSHNUMBER(l, duration.total_milliseconds());
    #endif
    
    try{
    __LUA_PUSHNUMBER(l, time(NULL));
    }
    catch(std::exception &e)
    {
        __LUA_PUSHNIL(l);
        std::string error = "luabridge.cc::currenttime() Unable to generate time:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }

    //returns the count in the milliseconds order which is more accurate @ the time of high loads.
    #if 0
    std::chrono::time_point<std::chrono::steady_clock> tp = std::chrono::steady_clock::now();
    int64_t count = std::chrono::duration_cast<std::chrono::seconds>(tp.time_since_epoch()).count();
    __LUA_PUSHNUMBER(l, count);
    #endif
    return 1;
}

//create a new service with the given name.
static int
createservice(lua_State *l)
{
    try 
    {
        const char *svcname = lua_tostring(l, 1);
        int len = strlen(svcname);
        if (!len){
            __LUA_PUSHSTRING(l, "luabridge.cc::createservice() invalid string \
                    given: string length 0");
            return 1;
        }else if(len > MAX_SERVICE_NAME_LEN){
            __LUA_PUSHSTRING(l, "luabridge.cc::createservice() invalid string \
                    given: string length must be less than 33.");
            return 1;
        }
        svc = new service(svcname);
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::createservice() Unable to create \
                             service:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int
deleteservice(lua_State *l)
{
    try 
    {
        if(svc){
            svc->stop();
            delete svc;
        }else{
            __LUA_PUSHSTRING(l, "luabridge.cc::deleteservice() no service to \
                    delete: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::deleteservice() exception thrown \
                             in delete service:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int
run(lua_State *l)
{
    try 
    {
        if(svc) svc->run();
        else{
            __LUA_PUSHSTRING(l, "luabridge.cc::run() no service to run: create \
                    service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::run() exception thrown in service::run():";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int
dispatch(lua_State *l)
{
    try 
    {
        if(svc) svc->dispatch();
        else{
            __LUA_PUSHSTRING(l, "luabridge.cc::dispatch() no service to call \
                    dispatch on: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::dispatch() Unable to delete service:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int
send2client(lua_State *l)
{
    try
    {
        int clientid = lua_tonumber(l, 1);
        int channelid = lua_tonumber(l, 2);
        const char *data = lua_tostring(l, 3);
        if(svc && clientid) svc->sendToClient(clientid, channelid, data, strlen(data));
        else{
            __LUA_PUSHSTRING(l, "luabridge.cc::send2client() no service to call \
                    send2client on: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::send2client() Unable to send data to \
                             client due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

/* assume that table is on the stack top */
bool
getintfield(lua_State *l, const char *key, int *result)
{
    __LUA_PUSHSTRING(l, key);
    lua_gettable(l, -2);
    if (!lua_isnumber(l, -1)){
        return false;
    }
    *result = (int)lua_tonumber(l, -1);
    lua_pop(l, 1);
    return true;
}

const char *
getstringfield(lua_State *l, const char *key)
{
    const char *result = nullptr;
    __LUA_PUSHSTRING(l, key);
    lua_gettable(l, -2);
    if (!lua_isstring(l, -1)){
        return nullptr;
    }
    result = lua_tostring(l, -1);
    lua_pop(l, 1);
    return result;
}

static int
send2gw(lua_State *l)
{
    try
    {
        //fill the control message according to the lua table.
        int mtype;
        int reason_len; 

        service::controlMessage cmsg;
        memset(&cmsg, 0, sizeof(service::controlMessage));
        if(!getintfield(l, "messageType", &mtype)) 
            throw std::invalid_argument("luabridge.cc::send2gw() messageType field \
                    missing in table");
        switch(mtype)
        {
            case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT:
                cmsg.messageType = mtype;
                if(!getintfield(l, "clientid", &cmsg.clientDisconnect.clientid))
                    throw std::invalid_argument("luabridge.cc::send2gw() clientid \
                            field missing in table");
                if(!getintfield(l, "channelid", &cmsg.clientDisconnect.channelid))
                    throw std::invalid_argument("luabridge.cc::send2gw() channelid \
                            field missing in table");
                if(!getintfield(l, "waitingtime", &cmsg.clientDisconnect.waitingTime))
                    throw std::invalid_argument("luabridge.cc::send2gw() waitingtime \
                            field missing in table");
                break;

            default:
                    throw std::invalid_argument("luabridge.cc::send2gw() invalid value\
                            for message type field");
        }
        if(svc) svc->sendToGw(cmsg);
        else{
            __LUA_PUSHSTRING(l, "luabridge.cc::send2gw() no service to call send2gw on:\
                    create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::send2gw() Unable to send message to gateway \
                             due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
broadcast(lua_State *l)
{
    try 
    {
        const char *data = lua_tostring(l, 1);
        if(svc) svc->broadcast(data, strlen(data));
        else{
            __LUA_PUSHSTRING(l, "luabridge.cc::broadcast() no service to call \
                    broadcast on: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::broadcast() Unable to send message \
                             to gateway due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static void
handleRequest(lua_State *l, service *svc, int clientid, int channelid, std::string &data)
{
    //std::cerr<<"handleRequest invoked.";
    //std::cerr<<"recv data from the client.";
    __LUA_RAWGETI(l, LUA_REGISTRYINDEX, dataRecvFuncIdx);
    __LUA_PUSHNUMBER(l, clientid);
    __LUA_PUSHNUMBER(l, channelid);
    __LUA_PUSHSTRING(l, data.c_str()); //on expensive string copy is done here this is done 
                                     //to copy the data from C++ to lua data system so 
                                     //that lua can do automatic garbage collection.
    int err = lua_pcall(l, 3, LUA_MULTRET, 0);
    if(err){
        std::string error = std::string(__FUNCTION__) + "()" + " error calling lua function.";
        error.append(lua_tostring(l, -1));
    }
    lua_settop(l, 0);
    return;
}

//fmgr data is too big to copy so we need to pass forward the pointer to the buffer
//and forward it through lua to other C++ parts.
static void
handleBigDataRequest(lua_State *l, service *svc, int clientid, int channelid, std::string &data)
{
    __LUA_RAWGETI(l, LUA_REGISTRYINDEX, bigDataRecvFuncIdx);
    __LUA_PUSHNUMBER(l, clientid);
    __LUA_PUSHNUMBER(l, channelid);
    
    //make a copy of the data and then return the pointer to the buffer to lua 
    //the lua code will pass it as it is to the C++ back.some where the code 
    //which is done with the buffer need to de allocate it. for ex: the code 
    //writing to the disk will de allocate buffer after its done.
    #if 0
    __LUA_PUSHSTRING(l, data.c_str()); //on expensive string copy is done here this is done 
                                     //to copy the data from C++ to lua data system so 
                                     //that lua can do automatic garbage collection.
    #endif
    std::string *copy = new std::string(data);
    void *vptr = static_cast<void*>(copy);
    __LUA_PUSHLIGHTUSERDATA(l, vptr);
    int err = lua_pcall(l, 3, LUA_MULTRET, 0);
    if(err){
        std::string error = std::string(__FUNCTION__) + "()" + " error calling lua function.";
        error.append(lua_tostring(l, -1));
    }
    lua_settop(l, 0);
    return;
}

static int
setdatarecvhandler(lua_State *l)
{
    try 
    {
        if(svc){
            svc->setDataRecvHandler(std::bind(handleRequest, 
                                    l,
                                    std::placeholders::_1,
                                    std::placeholders::_2,
                                    std::placeholders::_3,
                                    std::placeholders::_4));
            //store the lua function in the registry to be called later.
            luaL_checktype(l, 1, LUA_TFUNCTION);
            dataRecvFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX); //creates the reference to the lua function
                                                              //which is on the top of the argument stack 
                                                              //and pops the stack as well.
        }else{
            __LUA_PUSHSTRING(l, "luabrdige.cc::setdatarecvhandler() no service to \
                    call setdatarecvhandler on: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::setdatarecvhandler() Unable to set data \
                             receive handler due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//bigdata recieve handler will return a pointer to the buffer but not copy of data.
//the pointer should be passed on to the other C++ code and will be freed.
static int
setbigdatarecvhandler(lua_State *l)
{
    try 
    {
        if(svc){
            svc->setDataRecvHandler(std::bind(handleBigDataRequest, 
                                    l,
                                    std::placeholders::_1,
                                    std::placeholders::_2,
                                    std::placeholders::_3,
                                    std::placeholders::_4));
            //store the lua function in the registry to be called later.
            luaL_checktype(l, 1, LUA_TFUNCTION);
            bigDataRecvFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX); //creates the reference to the lua function
                                                              //which is on the top of the argument stack 
                                                              //and pops the stack as well.
        }else{
            __LUA_PUSHSTRING(l, "luabridge.cc::setbigdatarecvhandler() no service\
                    to call setbigdatarecvhandler on: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::setbigdatarecvhandler() Unable to set \
                             data receive handler due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static void
handleControlMesg(lua_State *l, service *svc, service::controlMessage &cmsg)
{
    //std::cerr<<"recvd control message:";
    __LUA_RAWGETI(l, LUA_REGISTRYINDEX, ctrlRecvFuncIdx);
    //a c structure translates to a table in lua. we have to dynamically construct the table here
    //depending on the type of the structure. and invoke the handler with the table.
    lua_newtable(l);
    __LUA_PUSHSTRING(l, "messageType"); 
    __LUA_PUSHNUMBER(l, cmsg.messageType); 
    lua_settable(l, -3); //sets msg["messageType"] = cmsg.messageType;
    switch(cmsg.messageType)
    {
        case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL:
        case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_ADD:
                __LUA_PUSHSTRING(l, "clientid");
                __LUA_PUSHNUMBER(l, cmsg.clientArrival.clientid); 
                lua_settable(l, -3);//sets msg[clientid] = cmsg.clientArrival.clientid;

                __LUA_PUSHSTRING(l, "channelid");
                __LUA_PUSHNUMBER(l, cmsg.clientArrival.channelid); 
                lua_settable(l, -3);//sets msg[clientid] = cmsg.clientArrival.clientid;
                break;

        case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE:
        case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_DELETE:
                __LUA_PUSHSTRING(l, "clientid");
                __LUA_PUSHNUMBER(l, cmsg.clientDeparture.clientid); 
                lua_settable(l, -3);

                __LUA_PUSHSTRING(l, "channelid");
                __LUA_PUSHNUMBER(l, cmsg.clientDeparture.channelid); 
                lua_settable(l, -3);//sets msg[clientid] = cmsg.clientArrival.clientid;
                break;

        case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_HEART_BEAT:
                break;

        default:
        std::cerr<<"Unknown control message type:";
        return;
    }
    //call the lua function using lua_pcall.
    int err = lua_pcall(l, 1, LUA_MULTRET, 0);
    if(err){
        std::string error = std::string(__FUNCTION__) + "()" + " error calling lua function.";
        error.append(lua_tostring(l, -1));
        std::cerr<<error<<":"<<"lua_pcall() returned: "<<err;
    }
    lua_settop(l, 0);
    return;
}

static void
handleSignals(lua_State *l, service *svc, int sig)
{
    __LUA_RAWGETI(l, LUA_REGISTRYINDEX, sigFuncIdx);
    __LUA_PUSHNUMBER(l, sig);
    //call the lua function using lua_pcall.
    int err = lua_pcall(l, 1, LUA_MULTRET, 0);
    if(err){
        std::string error = std::string(__FUNCTION__) + "()" + " error calling lua function.";
        error.append(lua_tostring(l, -1));
        std::cerr<<error<<":"<<"lua_pcall() returned: "<<err;
    }
    lua_settop(l, 0);
    return;
}

static int
setcontrolrecvhandler(lua_State *l)
{
    try
    {
        if(svc){ 
            svc->setControlRecvHandler(std::bind(handleControlMesg, 
                        l, 
                        std::placeholders::_1, 
                        std::placeholders::_2));
            //store the lua function in the registry to be called later.
            luaL_checktype(l, 1, LUA_TFUNCTION);
            ctrlRecvFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX); //creates the reference to the lua function
                                                              //which is on the top of the argument stack 
                                                              //and pops the stack as well.
        }else{
            __LUA_PUSHSTRING(l, "luabridge.cc::setcontrolrecvhandler() no \
                    service to call setcontrolrecvhandler on: create service\
                    first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::setcontrolrecvhandler() Unable to \
                             set control receive handler due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int
setsignalhandler(lua_State *l)
{
    try
    {
        if(svc){
            svc->setSignalHandler(std::bind(handleSignals, 
                        l, 
                        std::placeholders::_1, 
                        std::placeholders::_2));
            //store the lua function in the registry to be called later.
            luaL_checktype(l, 1, LUA_TFUNCTION);
            sigFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX); //creates the reference to the lua function
                                                         //which is on the top of the argument stack 
                                                         //and pops the stack as well.
        }else{
            __LUA_PUSHSTRING(l, "luabridge.cc::setsignalhandler() no service \
                    to call setsignalhandler on: create service first");
            return 1;
        }
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::setsignalhandler() Unable to set \
                             control receive handler due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//make a copy of big data and return it to the lua as a string.
//XXX: pretty expensive operation memory wise.
static int
getcopyofbigdata(lua_State *l)
{
    try
    {
        const void *vptr = lua_topointer(l, 1);
        const std::string *sptr = static_cast<const std::string*>(vptr);
        __LUA_PUSHSTRING(l, sptr->c_str());
    }
    catch(std::exception &e)
    {
        std::string error = "Unable to set data receive handler due to exception:";
        error += e.what();
        __LUA_PUSHNIL(l);
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//for some reason lua code cannot progress and chose to decide the big data buffer.
static int
destroybigdata(lua_State *l)
{
    try
    {
        const void *vptr = lua_topointer(l, 1);
        const std::string *sptr = static_cast<const std::string*>(vptr);
        delete sptr;
    }
    catch(std::exception &e)
    {
        std::string error = "luabridge.cc::destroybigdata() Unable to set \
                             data receive handler due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//change the priviliges to given uid and gid 
static int
privchange(lua_State *l)
{
	int uid = lua_tonumber(l, 1);
	int gid = lua_tonumber(l, 2);
	int rc = -1;
	if (uid && gid){
		if (prctl(PR_CAPBSET_READ, CAP_SETUID, 0, 0, 0) == false) goto fail;
		if (prctl(PR_CAPBSET_READ, CAP_SETGID, 0, 0, 0) == false) goto fail;
		rc = setgid(gid); if (rc < 0) goto fail;
		rc = setuid(uid); if (rc < 0) goto fail;
	}

	__LUA_PUSHBOOLEAN(l, true);
	return 1;

fail: 
	__LUA_PUSHBOOLEAN(l, false);
	__LUA_PUSHSTRING (l, strerror(errno));
	return 2;
}

//given the uid return the clientid
static int
getclientid(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        if(uid){
            __LUA_PUSHNUMBER(l, getClientIdForUid(uid));
            return 1;
        }
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, "luabridge.cc::getclientid() Invalid uid supplied \
                uid cannot be 0 or -ve");
        return 2;
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::getclientid() failed with:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
}

static int
getuidforclientid(lua_State *l)
{
    try
    {
        int clientid = lua_tonumber(l, 1);
        if(clientid){
            __LUA_PUSHNUMBER(l, getUidForClientId(clientid));
            return 1;
        }
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, "luabridge.cc::getuidforclientid() Invalid uid \
                supplied uid cannot be 0 or -ve");
        return 2;
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::getuidforclientid() failed with:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
}

//send a message to a particular user, the message is a json object. 
//the arguments are just a userid and the message and the length of 
//the message.
static int
send2user(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        const char *msg = lua_tostring(l, 2);
        int msgLen = strlen(msg);
        if(uid){
            int clientid = getClientIdForUid(uid);
            if (clientid && msgLen){
                svc->sendToClient(clientid, -1, nonconst(msg), msgLen);
                return 0;
            }
        }
        __LUA_PUSHSTRING(l, "luabridge.cc::send2user() invalid parameters given");
        return 1;
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::send2user() failed with:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
}

//a client tuple contains the uid and gid and the clientid.
static int
putclienttuple(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        int clientid = lua_tonumber(l, 2);
        int gid = lua_tonumber(l, 3);
        if (uid && clientid && gid){
            putSession(uid, clientid, gid);
            return 0;
        }
        __LUA_PUSHSTRING(l, "invalid clientid or uid or gid, cannot be 0 or -ve");
        return 1;
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::putclienttuple() failed with:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
}

//a client tuple contains the uid 
static int
remclienttuple(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        if(uid){
            delSession(uid);
            return 0;
        }
        __LUA_PUSHSTRING(l, "invalid clientid or uid or gid, cannot be 0 or -ve");
        return 1;
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::remclienttuple() failed with:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
}

//print the session entry table.
static int
printsessiontbl(lua_State *l)
{
	printSessionTbl();
	return 0;
}

//print the session entry table.
static int
delsessiontbl(lua_State *l)
{
	delSessionTbl();
	return 0;
}

class MyCurlObject 
{
  public:
    MyCurlObject (std::string url){
      curl = curl_easy_init();
      if(!curl)
        throw std::string ("Curl did not initialize!");
 
      curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, &MyCurlObject::curlWriter);
      curl_easy_setopt(curl, CURLOPT_WRITEDATA, &curlBuffer);
      curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
      curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5);
      curl_easy_perform(curl);
    };
 
    static int curlWriter(char *data, size_t size, size_t nmemb, std::string *buffer){
      int result = 0;
      if (buffer != NULL){
        buffer->append(data, size * nmemb);
        result = size * nmemb;
      }
      return result;
    }
 
    std::string getData (){ 
        return curlBuffer; 
    }
 
  protected:
    CURL *curl;
    std::string curlBuffer;
};

std::string
content(tree<htmlcxx::HTML::Node> const &dom, tree<htmlcxx::HTML::Node>::iterator const &parent)
{
    std::string result;
    for (unsigned i=0; i<dom.number_of_children(parent); i++){
        tree<htmlcxx::HTML::Node>::iterator it = dom.child(parent,i);
        if (!it->isTag() && !it->isComment()) result += it->text();
    }
    return result;
}

void
getSiteInfo(std::string url, 
        std::string &title, 
        std::string &imageUrl, 
        std::string &description, 
        std::string &imageType)
{
    MyCurlObject moco(url);
    std::string html = moco.getData();
    //std::cerr<<"htmlbody:"<<html;
    htmlcxx::HTML::ParserDom parser;
    tree<htmlcxx::HTML::Node> dom = parser.parseTree(html);
    tree<htmlcxx::HTML::Node>::iterator it = dom.begin();
    tree<htmlcxx::HTML::Node>::iterator end = dom.end();
    it = dom.begin();
    end = dom.end();
    for (;it != end; ++it){
        if (it->tagName() == "img"){
            it->parseAttributes();
            auto attrMap = it->attributes();
            for(auto &kv : attrMap ){
                if (kv.first == "src") imageUrl = kv.second;
            }
        }
        else if(it->tagName() == "title") title = content(dom, it);
        else if ((it->tagName() == "meta") && 
                (it->text().find("description") != std::string::npos) &&
                (it->text().find("content") != std::string::npos)){
            std::cerr<<"text:"<<it->text()<<std::endl;
            it->parseAttributes();
            auto attrMap = it->attributes();
            for(auto &kv : attrMap){
                if (kv.first == "content"){
                    description = kv.second;
                }
            }
        }
    }
    //if there is already a slash in the end then take it as it is otherwise append a slash.
    std::string slash = "";
    if (url.at(url.length() - 1) != '/') slash = "/";
    //some times the image url is relative so we need to append the url if its the case.
    if (imageUrl.find("http:") == std::string::npos) imageUrl = url + slash + imageUrl;

    //identify the image type by extension.
    //Add more types later.
    if (imageUrl.find("jpeg") != std::string::npos) imageType = "jpeg";
    else if (imageUrl.find("jpg") != std::string::npos) imageType = "jpeg";
    else if (imageUrl.find("png") != std::string::npos) imageType = "png";
    else if (imageUrl.find("pnm") != std::string::npos) imageType = "pnm";
    else if (imageUrl.find("ico") != std::string::npos) imageType = "ico";
    else if (imageUrl.find("webp") != std::string::npos) imageType = "webp";
    //std::cout<<"Url: "<<url<<", Title: "<<title<<", description: "<<description<<", imageUrl: "<<imageUrl;
    return;
}

//also send the image type for the png and the jpeg etc.
static int
gensitethumbnail(lua_State *l)
{
    try{
        std::string title, imageUrl, description, image, url = lua_tostring(l, 1), imageType;
        getSiteInfo(url, title, imageUrl, description, imageType);
        if (imageUrl != ""){
            MyCurlObject moco(imageUrl);
            image = moco.getData();
            //std::cerr<<"getting image from url:"<<imageUrl;
            //std::cerr<<"printing image:"<<image;
            std::string base64image; 
            if(imageType == "jpeg"){
                gdImagePtr im = gdImageCreateFromJpegPtr(image.length(), 
                        static_cast<void*>(nonconst(image.data())));
                if(im){
                    int sx = im->sx;
                    int sy = im->sy;
                    int size = 0;
                    int quality = 100;
                    gdImagePtr tim = gdImageCreateTrueColor(96, 96);
                    gdImageCopyResampled(tim, im, 0, 0, 0, 0, 96, 96, sx, sy);
                    std::string mime = "data:image/jpeg;base64,";
                    void *str = gdImageJpegPtr(tim, &size, quality);
                    if(str) base64image = mime + JSONBase64::json_encode64(static_cast<const unsigned char*>(str), 
                            size);
                    else _error<<"Unable to generate the jpeg image thumbnail";
                }
            }else if(imageType == "png"){
                gdImagePtr im = gdImageCreateFromPngPtr(image.length(), 
                        static_cast<void*>(nonconst(image.data())));
                if(im){
                    int sx = im->sx;
                    int sy = im->sy;
                    int size = 0;
                    int quality = 100;
                    gdImagePtr tim = gdImageCreateTrueColor(96, 96);
                    gdImageAlphaBlending(tim, false);
                    gdImageSaveAlpha(tim, true);
                    int transparent = gdImageColorAllocateAlpha(tim, 255, 255, 255, 127);
                    gdImageFilledRectangle(tim, 0, 0, sx, sy, transparent);
                    gdImageCopyResampled(tim, im, 0, 0, 0, 0, 96, 96, sx, sy);
                    std::string mime = "data:image/png;base64,";
                    void *str = gdImagePngPtr(tim, &size);
                    if(str) base64image = mime + JSONBase64::json_encode64(static_cast<const unsigned char *>(str), 
                            size);
                    else _error<<"Unable to generate the png image thumbnail";
                }
            }else if(imageType == "gif"){
                gdImagePtr im = gdImageCreateFromGifPtr(image.length(), static_cast<void*>(nonconst(image.data())));
                if(im){
                    int sx = im->sx;
                    int sy = im->sy;
                    int size = 0;
                    int quality = 100;
                    gdImagePtr tim = gdImageCreateTrueColor(96, 96);
                    gdImageCopyResampled(tim, im, 0, 0, 0, 0, 96, 96, sx, sy);
                    std::string mime = "data:image/gif;base64,";
                    void *str = gdImageGifPtr(tim, &size);
                    if(str) base64image = mime + JSONBase64::json_encode64(static_cast<const unsigned char *>(str), 
                            size);
                    else _error<<"Unable to generate the gif image thumbnail";
                }
            }else if(imageType == "bmp"){
            }
            __LUA_PUSHSTRING(l, title.c_str());
            __LUA_PUSHSTRING(l, description.c_str());
            __LUA_PUSHSTRING(l, base64image.c_str());
            return 3;
        }
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::gensitethumbnail() Unable to generate site thumbnail:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
openlog(lua_State *l)
{
    try {
        openLog(lua_tostring(l, 1));
        __LUA_PUSHNUMBER(l, 1);
        return 1;
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::openlog() Unable to open the log file:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
}

static int 
setlevel(lua_State *l)
{
    try {
        setLogLevel(lua_tonumber(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::setlevel() Unable to set the severity:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
getlevel(lua_State *l)
{
    try {
        __LUA_PUSHNUMBER(l, getLogLevel());
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::getlevel() Unable to get the severity:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

static int 
info(lua_State *l)
{
    try {
       _info<<std::string(lua_tostring(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::info() failed";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
warn(lua_State *l)
{
    try {
       _warn<<std::string(lua_tostring(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::warn() failed";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
error(lua_State *l)
{
    try {
       _error<<std::string(lua_tostring(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::error() failed";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
debug(lua_State *l)
{
    try {
       _debug<<std::string(lua_tostring(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::debug() failed";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
fatal(lua_State *l)
{
    try {
       _fatal<<std::string(lua_tostring(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::fatal() failed";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
trace(lua_State *l)
{
    try {
       _trace<<std::string(lua_tostring(l, 1));
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::trace() failed";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int 
setservicehandle(lua_State *l)
{
    svc = reinterpret_cast<service*>(lua_touserdata(l, 1));
    return 0;
}

#include <attr/xattr.h>
static int 
getfileobject(lua_State *l)
{
    char attribBuf[1024] = {'\0'};
    int rc = getxattr(lua_tostring(l, 1), FILE_ATTRIB_META_DATA, attribBuf, sizeof(attribBuf));
    if((rc < 0) && (errno == ENODATA)){
        std::cerr<<"Unable to getattribute of the file";
        __LUA_PUSHNIL(l);
        __LUA_PUSHSTRING(l, "luabridge.cc::getfileobject() Unable to retrieve the attributes of the file");
        return 2; //This may be a fresh file just created.
    }
    std::string json(attribBuf, rc);
    __LUA_PUSHSTRING(l, json.c_str());
    return 1;
}

static int
setfileobject(lua_State *l)
{
    std::string json(lua_tostring(l, 2), strlen(lua_tostring(l, 2)));
    if(json.length()){ 
        int rc = setxattr(lua_tostring(l, 1), FILE_ATTRIB_META_DATA, json.data(), json.length(), 0);
        if (rc < 0){
            std::cerr<<"Unable to getattribute of the file";
            __LUA_PUSHSTRING(l, "luabridge.cc::setfileobject() Unable to retrieve the attributes of the file");
            return 1; //This may be a fresh file just created.
        }
    }
    return 0;
}

//size is the number of gigabytes 
static int
setfolderlimit(lua_State *l)
{
    try {
        std::string _folderRoot(lua_tostring(l, 1));
        int size = lua_tonumber(l, 2);
        char attribBuf[1024] = {'\0'};
        int rc = getxattr(_folderRoot.c_str(), 
                FILE_ATTRIB_META_DATA, 
                attribBuf, 
                sizeof(attribBuf));
        if((rc < 0) && (errno == ENODATA)){
            _error<<"setfolderlimit() getxattr failed with :"<<errno;
            std::string error = "luabridge.cc::setfolderlimit() Unable to set the folder limit: getxattr() failed";
            __LUA_PUSHNIL(l);
            __LUA_PUSHSTRING(l, error.c_str());
            return 2;
        }
        std::string json(attribBuf, rc);
        fileAttribRecord blob(std::move(fileAttribRecord::fromJson(json)));
        uint64_t folderLimitInBytes = size * 1024 * 1024 * 1024;
        blob.folderLimitMsb = (int32_t)(folderLimitInBytes >> 32);
        blob.folderLimitLsb = (int32_t)(folderLimitInBytes);
        json = std::move(fileAttribRecord::toJson(blob));
        _except(setxattr(_folderRoot.c_str(), 
                    FILE_ATTRIB_META_DATA, 
                    json.data(), 
                    json.length(), 
                    0));
    }catch(std::exception& ex){
        __LUA_PUSHNIL(l);
        std::string error = "luabridge.cc::setfolderlimit() Unable to set the folder limit:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

static int 
getintconfig(lua_State *l)
{
    try {
        const char *key = lua_tostring(l, 1);
        assert(key);
        __LUA_PUSHNUMBER(l, getConfigValue<int>(key));
    }catch(std::exception& ex){
        __LUA_PUSHNIL(l);
        std::string error = "luabridge.cc::getintconfig() Unable to get the integer config:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

static int 
getstrconfig(lua_State *l)
{
    try {
        const char *key = lua_tostring(l, 1);
        assert(key);
        std::string value = getConfigValue<std::string>(key);
        __LUA_PUSHSTRING(l, value.c_str());
    }catch(std::exception& ex){
        __LUA_PUSHNIL(l);
        std::string error = "luabridge.cc::getstrconfig() Unable to get the string config:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//read the configuration from the file and load it in to memory.
static int 
loadconfig(lua_State *l)
{
    try {
        const char *fname = lua_tostring(l, 1);
        assert(fname);
        loadConfig(fname);
    }catch(std::exception& ex){
        std::string error = "luabridge.cc::loadconfig() Unable to put the string config:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//daemonize the lua application after calling there wont be any controlling terminal.
//you need to open the log file before calling this.
static int 
daemonize(lua_State *l)
{
    try
    {
        _except(daemon(0, 1)); //dont change directory and then dont close the stderr and stdout.
    }
    catch(std::exception &ex)
    {
        std::string error = "luabridge.cc::daemonize():";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//boost random device is a non-deterministic random number generator, on linux it uses /dev/urandom 
//to generate cryptographically secure random number.
static int
gencryptrand(lua_State *l)
{
    try {
        boost::random::random_device rd;
        __LUA_PUSHNUMBER(l, rd());
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::gencryptrand() boost random_device failure:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

static int
randstring(lua_State *l)
{
    try {
        std::string chars("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()`~-_=+[{]{\\|;:'\",<.>/?");
        boost::random::random_device rng;
        boost::random::uniform_int_distribution<> index_dist(0, chars.size() - 1);
        std::string randstring;
        for(int i = 0; i < 32; ++i) randstring.push_back(chars[index_dist(rng)]);
        __LUA_PUSHSTRING(l, randstring.c_str());
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::randstring() boost random_device failure:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//call in to sha512 and get a hash of the string given. 
static int 
sha512hash(lua_State *l)
{
    std::string input(lua_tostring(l, 1));
    assert(input.size() > 0);
    char outputBuffer[2*SHA512_DIGEST_LENGTH] = {'\0'};
    unsigned char hash[2*SHA512_DIGEST_LENGTH];
    SHA512_CTX sha512;
    SHA512_Init(&sha512);
    SHA512_Update(&sha512, input.c_str(), input.size());
    SHA512_Final(hash, &sha512);
    int i = 0;
    for(i = 0; i < SHA512_DIGEST_LENGTH; i++) sprintf(outputBuffer + (i * 2), "%02x", hash[i]);
    __LUA_PUSHSTRING(l, outputBuffer);
    return 1;
}

//call in to bcrypt() and get a hash of the string given. 
static int 
bcrypthash(lua_State *l)
{
    _error<<"Unimplemented function called.";
    assert(0); 
    return 0;
}

//parse the command line options 
//the input is a table of long options with out '--'. 
//the output is a table of key value pairs. 
//if any option is not passed by the program then a nil is put at the 
//index of the option.
static int
parsecmdopt(lua_State *l)
{
    _error<<"Unimplemented function called.";
    assert(0); 
    return 0;
}

//call the lua timer callback the callback index is in the function object.
static void
luaTimerCallback(service *svc, std::string cookie, lua_State *l, int timerFuncIdx)
{
    //call the lua callback.
    __LUA_RAWGETI(l, LUA_REGISTRYINDEX, timerFuncIdx);
    __LUA_PUSHSTRING(l, cookie.c_str());
    int err = lua_pcall(l, 1, LUA_MULTRET, 0);
    if(err){
        std::string error = std::string("luabridge.cc::luaTimerCallback(): error calling lua function:");
        error.append(lua_tostring(l, -1));
    }
    lua_settop(l, 0);
    return;
}

static int
addoneshottimer(lua_State *l)
{
    try {
        int count = lua_tonumber(l, 2);
        std::string cookie = lua_tostring(l, 1);
        luaL_checktype(l, 3, LUA_TFUNCTION);
        svc->addOneShotTimer(cookie, 
                count, 
                std::bind(luaTimerCallback, 
                    svc, 
                    cookie, 
                    l, 
                    luaL_ref(l, LUA_REGISTRYINDEX)));
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "service::addoneshottimer() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
addperiodictimer(lua_State *l)
{
    try {
        int count = lua_tonumber(l, 2);
        std::string cookie = lua_tostring(l, 1);
        luaL_checktype(l, 3, LUA_TFUNCTION);
        svc->addPeriodicTimer(cookie, 
                count, 
                std::bind(luaTimerCallback, 
                    svc, 
                    cookie, 
                    l, 
                    luaL_ref(l, 
                        LUA_REGISTRYINDEX)));
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "service::addperiodictimer() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
starttimer(lua_State *l)
{
    try {
        std::string cookie = lua_tostring(l, 1);
        svc->startTimer(cookie);
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "service::startimer() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
deletetimer(lua_State *l)
{
    try {
        std::string cookie = lua_tostring(l, 1);
        svc->deleteTimer(cookie);
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "service::deletetimer() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
stoptimer(lua_State *l)
{
    try {
        std::string cookie = lua_tostring(l, 1);
        svc->stopTimer(cookie);
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "service::stoptimer() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
sanitizepath(lua_State *l)
{
    try {
        std::string path = lua_tostring(l, 1);
        boost::algorithm::replace_all(path, "/", "\\/");
        boost::algorithm::replace_all(path, "+", "\\+");
        boost::algorithm::replace_all(path, "-", "\\-");
        boost::algorithm::replace_all(path, ".", "\\.");
        boost::algorithm::replace_all(path, "'", "\\'");
        boost::algorithm::replace_all(path, "?", "\\?");
        boost::algorithm::replace_all(path, "$", "\\$");
        boost::algorithm::replace_all(path, "*", "\\*");
        boost::algorithm::replace_all(path, "&", "\\&");
        boost::algorithm::replace_all(path, ";", "\\;");
        boost::algorithm::replace_all(path, "[", "\\[");
        boost::algorithm::replace_all(path, "]", "\\]");
        boost::algorithm::replace_all(path, "@", "\\@");
        boost::algorithm::replace_all(path, "%", "\\%");
        boost::algorithm::replace_all(path, "#", "\\#");
        boost::algorithm::replace_all(path, ">", "\\>");
        boost::algorithm::replace_all(path, "<", "\\<");
        boost::algorithm::replace_all(path, " ", "\\ ");
        _info<<"sanitizepath() : "<<path;
        __LUA_PUSHSTRING(l, path.c_str());
        return 1;
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::sanitizepath() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
isgroupmember(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        int gid = lua_tonumber(l, 2);
        if(uid && gid){
            __LUA_PUSHNUMBER(l, isGroupMember(uid, gid));
            return 1;
        }
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::isgroupmember() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    __LUA_PUSHNUMBER(l, 0);
    return 1;
}

static int 
adduidgidmapping(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        int gid = lua_tonumber(l, 2);
        if(uid && gid) addUidAndGidMapping(uid, gid);
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::adduidgidmapping() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

static int 
deluidgidmapping(lua_State *l)
{
    try
    {
        int uid = lua_tonumber(l, 1);
        int gid = lua_tonumber(l, 2);
        if(uid && gid) delUidAndGidMapping(uid, gid);
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::deluidgidmapping() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

//perform a bind mount requires 2 filesystem paths.
static int
bindmount(lua_State *l)
{
    try
    {
        const char *src = lua_tostring(l, 1);
        const char *dst = lua_tostring(l, 2);
        if(src && dst)
            _except(mount(src, dst, nullptr, MS_BIND, nullptr));
        else
            throw std::invalid_argument("arguments missing");
    }catch(std::exception& ex){
        __LUA_PUSHNUMBER(l, -1);
        std::string error = "luabridge.cc::bindmount() failed with error:";
        error += ex.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 0;
}

extern "C" 
{
	int
		luaopen_luabridge(lua_State *L)
		{
			static const luaL_Reg bridgeMap [] = 
			{ 
				{"privchange", privchange},
				{"getclientid", getclientid},
				{"putclienttuple", putclienttuple},
				{"remclienttuple", remclienttuple},
				{"getuidforclientid", getuidforclientid},
				{"printsessiontbl", printsessiontbl},
				{"delsessiontbl", delsessiontbl},
                {"createservice", createservice},
                {"run", run},
                {"dispatch", dispatch},
                {"send2client", send2client},
				{"send2user", send2user},
                {"send2gw", send2gw},
                {"isgroupmember", isgroupmember},
                {"adduidgidmapping", adduidgidmapping},
                {"deluidgidmapping", deluidgidmapping},

                {"setdatarecvhandler", setdatarecvhandler},
                {"setbigdatarecvhandler", setbigdatarecvhandler},
                {"setcontrolrecvhandler", setcontrolrecvhandler},
                {"setsignalhandler", setsignalhandler},

                {"addoneshottimer", addoneshottimer},
                {"addperiodictimer", addperiodictimer},
                {"starttimer", starttimer},
                {"stoptimer", stoptimer},
                {"deletetimer", deletetimer},

                {"getcopyofbigdata", getcopyofbigdata},
                {"destroybigdata", destroybigdata},
                {"setservicehandle", setservicehandle},

                {"broadcast", broadcast},
                {"deleteservice", deleteservice},
                {"currenttime", currenttime},
                {"gensitethumbnail", gensitethumbnail},
                {"genuuid", generateUuid},

                {"openlog", openlog},
                {"setlevel", setlevel},
                {"getlevel", getlevel},

                {"info", info},
                {"warn", warn},
                {"error", error},
                {"fatal", fatal},
                {"trace", trace},
                {"debug", debug},

                {"getfileobject", getfileobject},
                {"setfileobject", setfileobject},
                {"setfolderlimit", setfolderlimit},

                {"loadconfig", loadconfig},
                {"getintconfig", getintconfig},
                {"getstrconfig", getstrconfig},

                {"gencryptrand", gencryptrand},
                {"sha512hash", sha512hash},
                {"bcrypthash", bcrypthash},
                {"randstring", randstring},
                {"sanitizepath", sanitizepath},
        
                {"daemonize", daemonize},
                {"parsecmdopt", parsecmdopt},
                {"bindmount", bindmount},
        		{ nullptr, nullptr}
			};

			luaL_register (L, "luabridge", bridgeMap);
			return true;
        }
}
