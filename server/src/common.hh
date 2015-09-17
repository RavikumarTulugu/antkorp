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

#ifndef __INC_COMMON_H__
#define __INC_COMMON_H__
#include <libjson.h>
#include <vector>
#include <iostream>
#include <stdio.h>
#include <stdint.h>
#include <sys/types.h>
#include <fcntl.h>
#include <errno.h>
#include <assert.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <byteswap.h>
#include <execinfo.h>
#include <sys/wait.h>
#include <linux/capability.h>
#include <stdlib.h>
#include <endian.h>
#include <arpa/inet.h>
#include <netinet/tcp.h>
#include <stdio.h>
#include <stdarg.h>
#include <stdbool.h>
#include <errno.h>
#include <sys/time.h>
#include <time.h>
#include <stdlib.h>
#include <syslog.h>
#include <unistd.h>
#include <functional>
#include <condition_variable>
#include <mutex>
#include <iostream>
#include <thread>
#include <future>
#include <chrono>
#include <unistd.h>
#include <assert.h>
#include <semaphore.h>
#include <variant.hpp>
#include <boost/regex.hpp>
#include <boost/interprocess/sync/named_mutex.hpp>
#include <boost/lexical_cast.hpp>
#include <iomanip>
#include <locale>
#include <sstream>
#include "akorpdefs.h"
#include "ScopeGuard.h"

//Header contains common definitions used by the gateway and the other 
//service daemons
using namespace std;

//This is an internal header which is appended to the payload by the gateway before 
//sending it to the service.
typedef struct
{
    int32_t clientid; //client id is the network connection on which the packet is recieved.
    int32_t channelid; //channel id is given by the websocket demultiplexing extension 
                       //and is set by the gateway before sending the frame to the client.
    char svcName[MAX_SERVICE_NAME_LEN];
    int32_t msgLen;
}serviceHeader;

//This is the header which is sent with the payload data.
typedef struct
{
    char svcName[MAX_SERVICE_NAME_LEN];
    int32_t msgLen;
} payloadHeader;

//var can hold any data type listed below.
typedef boost::variant<unsigned int, 
        int, 
        double, 
        std::string, 
        json_string, 
        short, 
        unsigned short, 
        char, 
        unsigned char,
		off_t,
		unsigned int,
		long,
		long unsigned int,
		void*,
		json_string*,
		std::string*,
		int *,
		unsigned int *,
		unsigned long long,
		long long
		> anonType;

class tupl
{
public:
	std::string _attrName;
	anonType  _attrVal;
	tupl(std::string name, anonType val) : _attrName(name), _attrVal(val) { return; };
	~tupl(){ return; };
};

//Copied as is from www.boost.org C++11 scope guard implementation 
struct cleanup
{
    cleanup(std::function<void (void)> f) : f_(f), defuse(false) {}
    ~cleanup(void) { if (!defuse) f_(); }
private:
    std::function<void (void)> f_;
public:
	bool defuse;
};

#if 0
//taken from http://the-witness.net/news/2012/11/scopeexit-in-c11/
template <typename F>
struct ScopeExit {
    ScopeExit(F f) : f(f) {}
    ~ScopeExit() { f(); }
    F f;
};

template <typename F> ScopeExit<F> MakeScopeExit(F f) { return ScopeExit<F>(f); }
#define STRING_JOIN2(arg1, arg2) DO_STRING_JOIN2(arg1, arg2)
#define DO_STRING_JOIN2(arg1, arg2) arg1 ## arg2
#define SCOPE_EXIT(code)  auto STRING_JOIN2(scope_exit_, __LINE__) = MakeScopeExit([=](){code;})
#endif

struct syscallException : public std::exception
{
	std::string estr; //string form of error returned by strerror_r.
	int 		error; //copy of actual errno.
	const char *what() const throw () { return estr.c_str(); };
	syscallException(void) {};
	~syscallException(void) throw() {};
};

extern char __thread _estring[512];
extern syscallException exc;

//reissue the syscall if it encounters a EINTR
//return the return value of the syscall to the caller.
#define _eintr(syscall) ({ int _rc; while(( _rc = (syscall)) < 0x0 && (errno == EINTR)); (_rc); })

//pack the current errno as exception and throw to upper layers.
#define THROW_ERRNO_EXCEPTION                                           \
{                                                                       \
    exc.error = errno;					    				            \
    exc.estr.append(__FILE__);	                			            \
    exc.estr.append(":");	                			                \
    exc.estr.append(__FUNCTION__);	                	                \
    exc.estr.append("():");	                			                \
    char line[8] = {'\0'};                                              \
    sprintf(line,"%d", __LINE__);                                       \
    exc.estr.append(line, strlen(line));           		                \
    exc.estr.append(":");	                			                \
    char *__ptr = strerror_r(errno, _estring, sizeof(_estring));        \
    exc.estr.append(__ptr, strlen(__ptr));                              \
    throw exc;    											            \
}

//reissue the syscall if its interrupted in the middle (EINTR)
//return the return value of the syscall to the caller. 
//copy the location of the error and the error string, errno 
//to the exception and  throw the exception.
#define _except(syscall) ({										\
	int _rc;													\
	_rc = _eintr(syscall);	    								\
	if ( _rc < 0){				         						\
        THROW_ERRNO_EXCEPTION;                                  \
	}															\
	(_rc);														\
})



#define __LUA_RAWGETI(l, __index, __item)({                                                              \
    __GROW_LUA_STACK(l, 1)                                                                               \
    lua_rawgeti(l, __index, __item);                                                                     \
})

#define __LUA_PUSHBOOLEAN(l, _bool)({                                                                    \
    __GROW_LUA_STACK(l, 1)                                                                               \
    lua_pushboolean(l, _bool);                                                                           \
})

#define __LUA_PUSHNIL(l)({                                                                               \
    __GROW_LUA_STACK(l, 1)                                                                               \
    lua_pushnil(l);                                                                                      \
})

#define __LUA_PUSHSTRING(l, __string)({                                                                  \
    const char *__sptr = __string;                                                                       \
    __GROW_LUA_STACK(l, 1)                                                                               \
    lua_pushstring(l, __sptr);                                                                           \
})

#define __LUA_PUSHNUMBER(l, __number)({                                                                  \
    __GROW_LUA_STACK(l, 1)                                                                               \
    lua_pushnumber(l, __number);                                                                         \
})

#define __LUA_PUSHLIGHTUSERDATA(l, _ptr)({                                                               \
    __GROW_LUA_STACK(l, 1)                                                                               \
    lua_pushlightuserdata(l, _ptr);                                                                      \
})

//Try to grow lua stack , if not possible then bail out with exception.
//what happens in lua layer ? does the flow stop then and there right ? 
//Pop all the elements on the stack if there is a failure.
//XXX: indexes start at 1 and not 0 and go on to the top where stack[stacktop] is a legal item.
#define __GROW_LUA_STACK(l, __elcount){                                                                  \
    if(!lua_checkstack((l), (__elcount))){                                                               \
        std::string __emsg;                                                                              \
        __emsg.append("Unable to grow lua stack death by starving:");                                    \
        __emsg.append(__FILE__);                                                                         \
        __emsg.append(":");                                                                              \
        __emsg.append(num2String(__LINE__));                                                             \
        lua_settop(l, 0);                                                                                \
        throw std::runtime_error(__emsg);                                                                \
    }                                                                                                    \
}


extern void loginit(char *signature);
extern void _aprint(bool _eval, ... );
extern void dprintf( 
        const int modId, /*private to each module statically initialized in the module file. */
        const int dbgLevel, const char *file, 
        const int line, const char *fmt, 
        ... );
extern char * current_time( char *cur_time);

#if 0
/*
   Debug macros for use.
   */
#define fatal(fmt,...) dprintf(modId, FATAL,__FILE__,__LINE__,fmt,##__VA_ARGS__)
#define panic(fmt,...) dprintf(modId, PANIC,__FILE__,__LINE__,fmt,##__VA_ARGS__)
#define error(fmt,...) dprintf(modId, ERROR,__FILE__,__LINE__,fmt,##__VA_ARGS__)
#define warn(fmt,...)  dprintf(modId, WARN ,__FILE__,__LINE__,fmt,##__VA_ARGS__)
#define info(fmt,...)  dprintf(modId, INFO ,__FILE__,__LINE__,fmt,##__VA_ARGS__)
#define syserr(fmt,...) dprintf(modId, SYSERR,__FILE__,__LINE__,fmt,##__VA_ARGS__)

/* 
   cudnt work out a one argument macro we have to give atleast 2 arguments
   for this to work. :-( can any body try it out ? 
   */
#define sm_assert(exp,...){                              \
    bool _eval = (exp);                                  \
    if(_eval == false )                                  \
    {                                                    \
        error("Assertion Failure:(%s) is false :",#exp); \
        _aprint(_eval,##__VA_ARGS__);                    \
        abort();                                         \
    }                                                    \
}
#endif
int exitListenerFd();
bool getJsonVal(const JSONNode &, tupl *, int);
std::string putJsonVal(tupl *, int);
std::string putJsonVal(tupl *, int, JSONNode &);
bool getJsonSingleVal(const JSONNode &, const char *, anonType valRef);
unsigned int wsRead(int, char *, int, unsigned int *, bool peek=false);
unsigned int wsRead(int, int &, std::string &, char *, int, unsigned int *, bool);
int wsWrite(int, const char *, int, unsigned int flags = 0, bool maskPayload = false);
int wsWrite(int, int, char *, const char *, int, unsigned int, bool);
void dumptrace(void);
int popenCustom( int *, pid_t *, const char *, char **, std::string chrootPath = "");
int spawnCommand( int *, const char *, char **, int *, void(*stdout_callback)(int, const char *, size_t), void(*stderr_callback)(int, const char *, size_t));
int pcloseCustom(int *);
void msec2TimeSpec(unsigned int, struct timespec *);   
char *strDup(const char *);
int splice_all(int, loff_t *, int, loff_t *, size_t, unsigned int);
bool sendMsgToUser(int, char *);
int sendwsmsg(int, int , const char *, const char *, int, unsigned int, bool maskPayload = false);
int recvwsmsg(int, int *, char *, char *, int, unsigned int *, bool peek = false);
bool isValidIpv6(std::string &);
bool isValidIpv4(std::string &);
std::string num2String(int num);
void setCapability(int);
bool isCapabilitySet(int);
#endif
