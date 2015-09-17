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
#include <stdio.h>
#include <math.h>
#include <sys/types.h>
#include <unistd.h>
#include <assert.h>
#include <signal.h>
#include <stdlib.h>
#include <stdbool.h>
#include <strings.h>
#include <errno.h>
#include <iostream>
#include "akorpdefs.h"
#include "common.hh"
#ifndef BOOST_NO_CXX11_EXPLICIT_CONVERSION_OPERATORS //FIXME: BUG on boost, remove this once we migrate to boost-1.54 
#define BOOST_NO_CXX11_EXPLICIT_CONVERSION_OPERATORS
#include <boost/date_time/local_time/local_time.hpp>
#endif
#include <boost/date_time/posix_time/posix_time_types.hpp>
#include <boost/algorithm/string.hpp>
#include <string>
#include <time.h>
#include <chrono>
#include <boost/lexical_cast.hpp>

using namespace boost::gregorian;
using namespace boost::local_time; 
using namespace boost::posix_time; 

__attribute__((constructor))
static void
loadLibrary(void) 
{
    std::cerr<<"\nluacal.so module loaded";
    return;
}

__attribute__((destructor))
static void
unloadLibrary(void) 
{
    std::cerr<<"\nluacal.so module unloaded";
    return;
}

//Try to load the timezone file from the given location.
//the timezone file is distributed with the boost C++ library. 
//the file contains tuples of 11 fields terminated by newlines 
//and only boost library can parse and load the timezones.
static int 
loadtimezones(lua_State *l)
{
    
    try{
        tz_database tzDb;
        tzDb.load_from_file(std::string(lua_tostring(l, 1))); 
    }
    catch(std::exception &ex)
    {
        std::string error = "luacal.cc::loadtimezones() Unable to send data to \
                             client due to exception:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, false);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    
    __LUA_PUSHNUMBER(l, true);
    return 1;
}

static int 
currenttime(lua_State *l)
{
   #if 0
    boost::posix_time::ptime time = boost::posix_time::microsec_clock::local_time();
    boost::posix_time::time_duration duration(time.time_of_day());
    __LUA_PUSHNUMBER(l, duration.total_milliseconds());
    #endif
    
    __LUA_PUSHNUMBER(l, time(NULL));

    //returns the count in the milliseconds order which is more accurate @ the time of high loads.
    #if 0
    std::chrono::time_point<std::chrono::steady_clock> tp = std::chrono::steady_clock::now();
    int64_t count = std::chrono::duration_cast<std::chrono::seconds>(tp.time_since_epoch()).count();
    __LUA_PUSHNUMBER(l, count);
    #endif
    return 1;
}

const std::locale format = std::locale(std::locale::classic(), \
        new boost::posix_time::time_input_facet("%Y-%m-%d %H:%M:%S%F%Q"));
static std::time_t 
pt_to_time_t(const boost::posix_time::ptime& pt) 
{
    boost::posix_time::ptime timet_start(boost::gregorian::date(1970, 1, 1));
    boost::posix_time::time_duration diff = pt - timet_start;
    return diff.ticks()/boost::posix_time::time_duration::rep_type::ticks_per_second;
}

static boost::posix_time::ptime 
utc2Ptime(const std::string& s)
{
    boost::posix_time::ptime pt; 
    std::istringstream is(s);
    is.imbue(format);
    is >> pt; 
    return pt; 
}

static time_t
utc2Timet(const std::string& s)
{
    boost::posix_time::ptime pt = utc2Ptime(s);
    if(pt == boost::posix_time::ptime()) return 0;
    return pt_to_time_t(pt);
}

//routine to convert a utc time string to time_t format.
static int 
utc2unixtime(lua_State *l)
{
    //This time string should be in UTC format and contains a 'Z' at the end 
    //boost routines have a problem when they see a 'Z' and throw a lexical 
    //exception processing the string. remove the 'Z' char and then pass the 
    //string to boost routine.
    try{
        std::string utc(lua_tostring(l, 1));
        time_t x = utc2Timet(utc);
        if(x) __LUA_PUSHNUMBER(l, x);
        else{
            std::string error = "luacal.cc::utc2unixtime() Unable to generate \
                                 timestamp from utc:";
            __LUA_PUSHNUMBER(l, 0); //0 is invalid unix time stamp remember.
            __LUA_PUSHSTRING(l, error.c_str());
            return 2;
        }
    }
    catch(std::exception &ex)
    {
        std::string error = "luacal.cc::utc2unixtime() Unable to generate \
                             timestamp from utc:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0); //0 is invalid unix time stamp remember.
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//gimme a list of recurring daily dates starting from given date. 
//until the end of the current year.
static int
recurdaily(lua_State *l)
{
    try {
        boost::posix_time::ptime ptstart = utc2Ptime(lua_tostring(l, 1));
        boost::posix_time::ptime ptend = utc2Ptime(lua_tostring(l, 2));
        int year = ptstart.date().year();
        int month = ptstart.date().month();
        int day = ptstart.date().day();

        boost::gregorian::date endOfYear(year, 12, 31);
        boost::gregorian::day_iterator ditr(boost::gregorian::date(year, month, day));
        lua_newtable(l);
        ++ditr; //skip the current day. 
        for (int i = 0; ditr <= endOfYear; ++ditr, i++){
            lua_newtable(l);
            {
                __LUA_PUSHSTRING(l, 
                        to_iso_extended_string(boost::posix_time::ptime(*ditr) + 
                            ptstart.time_of_day()).c_str());
                //std::cerr<<"daily:tstart "<<to_iso_extended_string(boost::posix_time::ptime(*ditr) + ptstart.time_of_day());
                lua_setfield(l, -2, "tstart");
                __LUA_PUSHSTRING(l, 
                        to_iso_extended_string(boost::posix_time::ptime(*ditr) + 
                            ptend.time_of_day()).c_str());
                //std::cerr<<"monthly:tend"<<to_iso_extended_string(boost::posix_time::ptime(*ditr) + ptstart.time_of_day());
                lua_setfield(l, -2, "tend");
            }
            lua_rawseti(l, -2, i+1);
        }
    }
    catch(std::exception& ex){
        std::string error = "luacal.cc::recurdaily() Unable to generate recurring\
                             daily event:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, false);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//gimme a list of recurring weekly dates starting from given date.
//until the end of the current year.
static int
recurweekly(lua_State *l)
{
    try {
        boost::posix_time::ptime ptstart = utc2Ptime(lua_tostring(l, 1));
        boost::posix_time::ptime ptend = utc2Ptime(lua_tostring(l, 2));
        int year = ptstart.date().year();
        int month = ptstart.date().month();
        int day = ptstart.date().day();

        boost::gregorian::date endOfYear(year, 12, 31);
        boost::gregorian::week_iterator witr(boost::gregorian::date(year, month, 
                    day));
        lua_newtable(l);
        ++witr;
        for (int i = 0; witr <= endOfYear; ++witr, i++){
            lua_newtable(l);
            {
                __LUA_PUSHSTRING(l, 
                        to_iso_extended_string(boost::posix_time::ptime(*witr) + 
                            ptstart.time_of_day()).c_str());
                lua_setfield(l, -2, "tstart");
                __LUA_PUSHSTRING(l, 
                        to_iso_extended_string(boost::posix_time::ptime(*witr) + 
                            ptend.time_of_day()).c_str());
                lua_setfield(l, -2, "tend");
            }
            lua_rawseti(l, -2, i+1);
        }
    }
    catch(std::exception& ex){
        std::string error = "luacal.cc::recurweekly() Unable to generate recurring\
                             weekly event:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, false);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//gimme a list of recurring monthly dates starting from given date.
//until the end of the current year.
static int
recurmonthly(lua_State *l)
{
    try {
        boost::posix_time::ptime ptstart = utc2Ptime(lua_tostring(l, 1));
        boost::posix_time::ptime ptend = utc2Ptime(lua_tostring(l, 2));
        int year = ptstart.date().year();
        int month = ptstart.date().month();
        int day = ptstart.date().day();

        boost::gregorian::date endOfYear(year, 12, 31);
        boost::gregorian::month_iterator mitr(boost::gregorian::date(year, month,
                    day));
        lua_newtable(l);
        ++mitr;
        for (int i = 0; mitr <= endOfYear; ++mitr, i++){
            lua_newtable(l);
            {
                __LUA_PUSHSTRING(l, 
                        to_iso_extended_string(boost::posix_time::ptime(*mitr) + 
                            ptstart.time_of_day()).c_str());
                lua_setfield(l, -2, "tstart");
                //std::cerr<<"monthly:tstart "<<to_iso_extended_string(boost::posix_time::ptime(*mitr) + ptstart.time_of_day());
                __LUA_PUSHSTRING(l, 
                        to_iso_extended_string(boost::posix_time::ptime(*mitr) + 
                            ptend.time_of_day()).c_str());
                //std::cerr<<"monthly:tend"<<to_iso_extended_string(boost::posix_time::ptime(*mitr) + ptstart.time_of_day());
                lua_setfield(l, -2, "tend");
            }
            lua_rawseti(l, -2, i+1);
        }
    }
    catch(std::exception& ex){
        std::string error = "luacal.cc::recurmonthly() Unable to generate \
                             recurring monthly event:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, false);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//return the current utc time in time_t format.
static int
utcnow(lua_State *l)
{
    try {
        boost::posix_time::ptime now = second_clock::universal_time();
        time_t x = utc2Timet(to_iso_extended_string(now));
        if(x) __LUA_PUSHNUMBER(l, x);
        else{
            std::string error = "luacal.cc::utcnow() Unable to generate timestamp\
                                 from utc:";
            __LUA_PUSHNUMBER(l, 0); //0 is invalid unix time stamp remember.
            __LUA_PUSHSTRING(l, error.c_str());
            return 2;
        }
    }catch(std::exception& ex){
        std::string error = "luacal.cc::utcnow() Unable to generate recurring monthly\
                             event:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

static int
millisleep(lua_State *l)
{
    int usec = lua_tonumber(l, 1);
    if (usec) usleep(usec*1000);
    return 1;
}

//return the UTC start of today in unix time_t format.
static int
todayStart(lua_State *l)
{
    try {
        boost::posix_time::ptime today_start(boost::gregorian::day_clock::\
                universal_day());
        __LUA_PUSHNUMBER(l, pt_to_time_t(today_start));
    }catch(std::exception& ex){
        std::string error = "luacal.cc::todayStart() Unable to generate today\
                             start timestamp:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

//return the UTC end of today in unix time_t format.
static int 
todayEnd(lua_State *l)
{
    try {
        boost::posix_time::ptime today_start(boost::gregorian::day_clock::\
                universal_day());
        boost::posix_time::ptime today_end(today_start + boost::gregorian::\
                date_duration(1));
        __LUA_PUSHNUMBER(l, pt_to_time_t(today_end));
    }catch(std::exception& ex){
        std::string error = "luacal.cc::todayEnd() Unable to generate today\
                             end timestamp:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

static int 
humanReadable(lua_State *l)
{
    try {
        time_t t = lua_tonumber(l, 1);
        struct tm *info = nullptr;
        char buffer[80] = {'\0'};
        info = localtime(&t);
        assert(info);
        strftime(buffer, 80, "%A %B %d %I:%M %p", info);
        __LUA_PUSHSTRING(l, buffer);
    }catch(std::exception& ex){
        std::string error = "luacal.cc::humanReadable() Unable to generate today \
                             end timestamp:";
        error += ex.what();
        __LUA_PUSHNUMBER(l, 0);
        __LUA_PUSHSTRING(l, error.c_str());
        return 2;
    }
    return 1;
}

extern "C" 
{
	int luaopen_luacal(lua_State *L)
		{
			static const luaL_Reg calMap [] = 
			{ 
                {"currenttime", currenttime},
                {"loadtimezones", loadtimezones},
                {"utc2unixtime", utc2unixtime},
                {"recurdaily", recurdaily},
                {"recurweekly", recurweekly},
                {"recurmonthly", recurmonthly},
                {"utcnow", utcnow},
                {"millisleep", millisleep},
                {"todaystart", todayStart},
                {"todayend", todayEnd},
                {"humanreadable", humanReadable},
        		{ nullptr, nullptr}
			};

			luaL_register (L, "luacal", calMap);
			return true;
        }
}
