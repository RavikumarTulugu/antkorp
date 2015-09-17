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

//utility which can simulate a client connection for simulating client activities 
//can be used to create initial organization and user objects.
#include <lua.h>
#include <lualib.h>
#include <lauxlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/un.h>
#include <sys/stat.h>
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
#include "clientmodule.hh"
#include "common.hh"

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

// pull out the type of messages sent by our config
#ifdef AKORP_SSL_CAPABLE
typedef websocketpp::client<websocketpp::config::asio_tls_client> client;
typedef websocketpp::config::asio_tls_client::message_type::ptr message_ptr;
typedef websocketpp::lib::shared_ptr<boost::asio::ssl::context> context_ptr;
#else
typedef websocketpp::client<websocketpp::config::asio_client> client;
typedef websocketpp::config::asio_client::message_type::ptr message_ptr;
#endif

static client c;
static std::string server;
static boost::asio::deadline_timer *responseWaitTimer = nullptr;
static boost::asio::io_service iosvc;
static lua_State *l;
#ifdef AKORP_SSL_CAPABLE
static std::string uri = "ws://";
#else
static std::string uri = "wss://";
#endif
//call a remote method and handle the response from the 
//server. requires 2 parameters the json request blob 
//and the response handler.
static int respRecvFuncIdx;
static int errRecvFuncIdx; 
static int timeoutFuncIdx;
static int eventFuncIdx;
static std::string request;
static bool responseArrived = false;
static websocketpp::connection_hdl hdl;

__attribute__((constructor))
static void
loadLibrary(void) 
{
    std::cerr<<"clientmodule module loaded";
    return;
}

__attribute__((destructor))
static void
unloadLibrary(void) 
{
    std::cerr<<"clientmodule module unloaded";
    return;
}

//invoke the lua response handler.
//FIXME: 
//check whether the incoming is in json format. 
//and we are getting a json response or json 
//error packet from the server.
static void 
responseHandler(message_ptr msg)
{
    if(msg->get_payload().find("response") != std::string::npos){
        responseArrived = true;
        lua_rawgeti(l, LUA_REGISTRYINDEX, respRecvFuncIdx);
        __LUA_PUSHSTRING(l, msg->get_payload().c_str());
        int err = lua_pcall(l, 1, LUA_MULTRET, 0);
        if(err){
            std::string error = "error calling lua function.";
            error.append(lua_tostring(l, -1));
            std::cerr<<error;
        }
        lua_settop(l, 0);
        responseWaitTimer->cancel();
        return;
    }
    if(msg->get_payload().find("error") != std::string::npos){
        responseArrived = true;
        lua_rawgeti(l, LUA_REGISTRYINDEX, errRecvFuncIdx);
        __LUA_PUSHSTRING(l, msg->get_payload().c_str());
        int err = lua_pcall(l, 1, LUA_MULTRET, 0);
        if(err){
            std::string error = "error calling lua function.";
            error.append(lua_tostring(l, -1));
            std::cerr<<error;
        }
        lua_settop(l, 0);
        responseWaitTimer->cancel();
        return;
    }
    if(msg->get_payload().find("event") != std::string::npos){
        lua_rawgeti(l, LUA_REGISTRYINDEX, eventFuncIdx);
        __LUA_PUSHSTRING(l, msg->get_payload().c_str());
        int err = lua_pcall(l, 1, LUA_MULTRET, 0);
        if(err){
            std::string error = "error calling lua function.";
            error.append(lua_tostring(l, -1));
            std::cerr<<error;
        }
        lua_settop(l, 0);
        return;
    }
    lua_settop(l, 0);
}

#ifdef AKORP_SSL_CAPABLE
static context_ptr 
on_tls_init(websocketpp::connection_hdl hdl) 
{
    std::chrono::high_resolution_clock::time_point m_tls_init = std::chrono::high_resolution_clock::now();
    context_ptr ctx(new boost::asio::ssl::context(boost::asio::ssl::context::tlsv1));
    try {
        ctx->set_options(boost::asio::ssl::context::default_workarounds | boost::asio::ssl::context::single_dh_use);
    } catch (std::exception& e) {
        std::cout << e.what() << std::endl;
    }
    return ctx;
}
#endif


static void
on_message(client* c, websocketpp::connection_hdl hdl, message_ptr msg) 
{
    responseHandler(msg);
    return;
}

static void
on_login_message(client* c, websocketpp::connection_hdl chdl, message_ptr msg) 
{
    //validate the response and set the new message handler from now on.
    hdl = chdl;
    c->set_message_handler(bind(&on_message, c,::_1,::_2));
    return;
}

static void 
on_close(client* c, websocketpp::connection_hdl hdl) 
{
    return;
}   


static void
timeout_handler(boost::system::error_code ec)
{
    lua_rawgeti(l, LUA_REGISTRYINDEX, timeoutFuncIdx);
    int err = lua_pcall(l, 0, LUA_MULTRET, 0);
    if(err){
        std::string error = "error calling lua function.";
        error.append(lua_tostring(l, -1));
        std::cerr<<error;
    }
    lua_settop(l, 0);
    responseArrived = true;
    return;
}

int
_connect(std::string server)
{
    responseWaitTimer = new boost::asio::deadline_timer(iosvc);
    responseWaitTimer->expires_from_now(boost::posix_time::seconds(3));
    responseWaitTimer->async_wait(timeout_handler);
    c.init_asio(&iosvc);
    c.set_message_handler(bind(&on_login_message,&c,::_1,::_2));
    c.set_close_handler(bind(&on_close,&c,::_1));
#ifdef AKORP_SSL_CAPABLE
    c.set_tls_init_handler(bind(&on_tls_init, ::_1));
#endif
    websocketpp::lib::error_code ec;
    server = uri + server + "/services=ngw,auth,fmgr,kons,rtc,calendar";
    std::cerr<<"opening connection to : "<<server;
    client::connection_ptr con = c.get_connection(server, ec);
    c.connect(con);
    c.run_one();
    return 0;
}

//close the connection to the server.
int
_disconnect()
{
    return 0;
}

//create a new service with the given name.
static int
connect(lua_State *l)
{
    const char *server = lua_tostring(l, 1);
    int len = strlen(server);
    if (!len){
        __LUA_PUSHSTRING(l, "invalid string given: string length 0");
        return 1;
    }else if(len > MAX_SERVICE_NAME_LEN){
        __LUA_PUSHSTRING(l, "invalid string given: string length must be less than 33.");
        return 1;
    }
    try
    {
        _connect(server);
    }
    catch(std::exception &e)
    {
        std::string error = "Unable to connect to server:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

//create a new service with the given name.
static int
disconnect(lua_State *l)
{
    try
    {
        _disconnect();
    }
    catch(std::exception &e)
    {
        std::string error = "Unable to disconnect to server:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

static int
call(lua_State *l)
{
    try
    {
            responseArrived = false;
            std::string svcname = lua_tostring(l, 1);
            request = lua_tostring(l, 2);
            luaL_checktype(l, 3, LUA_TFUNCTION);
            respRecvFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX);
            luaL_checktype(l, 4, LUA_TFUNCTION);
            errRecvFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX);
            luaL_checktype(l, 5, LUA_TFUNCTION);
            eventFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX);
            luaL_checktype(l, 6, LUA_TFUNCTION);
            timeoutFuncIdx = luaL_ref(l, LUA_REGISTRYINDEX);
            //finally make the call to the server.
            uint32_t length = request.length();
            char header[36] =  {'\0'}, *ptr = header;
            memset(header, ' ', 32);
            strncpy(header, svcname.data(), svcname.size());
            ptr += 32;
            length = htonl(length);
            mempcpy(ptr, &length, sizeof(uint32_t));
            string json(reinterpret_cast<char const*>(header), sizeof(header));
            json += request;
            c.send(hdl, json, websocketpp::frame::opcode::binary);
            responseWaitTimer->expires_from_now(boost::posix_time::seconds(3));
            responseWaitTimer->async_wait(timeout_handler);
            while(!responseArrived) c.run_one();
    }
    catch(std::exception &e)
    {
        std::string error = "Unable to call() in to server due to exception:";
        error += e.what();
        __LUA_PUSHSTRING(l, error.c_str());
        return 1;
    }
    return 0;
}

extern "C" 
{
	int
		luaopen_clientmodule(lua_State *L)
		{
            l = L;
			static const luaL_Reg Map [] = 
			{
        		{ "connect", connect},
        		{ "disconnect", disconnect},
        		{ "call", call},
        		{ nullptr, nullptr}
			};

			luaL_register (L, "clientmodule", Map);
			return true;
        }
}
