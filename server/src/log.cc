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

#include <iostream>
#include <string>
#include <stdlib.h>
#include <assert.h>
#include "log.hh"

static 
boost::log::sources::severity_logger<boost::log::trivial::severity_level> lg;

static std::string
getDebug( const std::string &var ) 
{
     const char *val = ::getenv(var.c_str());
     if (val == NULL) return ""; 
     else return val;
}

//open the logging module
void
openLog(std::string logFileName)
{
    //setup console dump as well if the environment variable says so.
    std::string value;
    if (((value = getDebug(std::string("ANTKORP_DEBUG"))) != "") && \
            (value == "true")){
        boost::log::add_console_log
            (
             //boost::log::keywords::auto_flush=true,
             std::cerr,
             boost::log::keywords::format = (
                 boost::log::expressions::stream
                 <<boost::log::expressions::format_date_time<boost::\
                 posix_time::ptime>("TimeStamp", "%Y-%m-%d %H:%M:%S")
                 <<":["<< boost::log::trivial::severity
                 <<"]["<<boost::log::expressions::attr<unsigned int>\
                 ("LineID")
                 <<"][pid:"<<boost::log::expressions::attr<boost::log::\
                 process_id>("ProcessID")
                 <<"][tid:"<<boost::log::expressions::attr<boost::log::\
                 thread_id>("ThreadID")
                 <<"] "<<boost::log::expressions::smessage
                 )
            );
    }
    boost::log::add_file_log
        (
         boost::log::keywords::file_name = logFileName + \
         std::string("_%Y-%m-%d_%H-%M-%S.%N.log"),
         boost::log::keywords::rotation_size = 10 * 1024 * 1024,
         boost::log::keywords::time_based_rotation = boost::log::sinks::\
         file::rotation_at_time_point(0, 0, 0),
         boost::log::keywords::auto_flush=true,
         boost::log::keywords::format = (
             boost::log::expressions::stream
             <<boost::log::expressions::format_date_time<boost::posix_time::\
             ptime>("TimeStamp", "%Y-%m-%d %H:%M:%S")
             <<":["<< boost::log::trivial::severity
             <<"]["<<boost::log::expressions::attr<unsigned int>("LineID")
             <<"][pid:"<<boost::log::expressions::attr<boost::log::process_id>\
             ("ProcessID")
             <<"][tid:"<<boost::log::expressions::attr<boost::log::thread_id>\
             ("ThreadID")
             <<"] "<<boost::log::expressions::smessage
             )
        );

    boost::log::core::get()->set_filter(boost::log::trivial::severity >= boost::\
            log::trivial::error);
    boost::log::add_common_attributes();
    return;
}

//set the severity of the logs.
void
setLogLevel(int level)
{
    switch(level)
    {
        case SEVERITY_INFO : 
            boost::log::core::get()->set_filter(boost::log::trivial::severity \
                    >= boost::log::trivial::info); 
            return;
        case SEVERITY_ERROR : 
            boost::log::core::get()->set_filter(boost::log::trivial::severity \
                    >= boost::log::trivial::error); 
            return;
        case SEVERITY_WARNING : 
            boost::log::core::get()->set_filter(boost::log::trivial::severity \
                    >= boost::log::trivial::warning); 
            return;
        case SEVERITY_FATAL : 
            boost::log::core::get()->set_filter(boost::log::trivial::severity \
                    >= boost::log::trivial::fatal); 
            return;
        case SEVERITY_TRACE : 
            boost::log::core::get()->set_filter(boost::log::trivial::severity \
                    >= boost::log::trivial::trace); 
            return;
        case SEVERITY_DEBUG : 
            boost::log::core::get()->set_filter(boost::log::trivial::severity \
                    >= boost::log::trivial::debug); 
            return;
        default: 
            assert(0);
    }
    return;
}

int
getLogLevel(void)
{
    switch(boost::log::sources::aux::get_severity_level())
    {
        case boost::log::trivial::info : return SEVERITY_INFO;
        case boost::log::trivial::error : return SEVERITY_ERROR;
        case boost::log::trivial::warning : return SEVERITY_WARNING;
        case boost::log::trivial::fatal : return SEVERITY_FATAL;
        case boost::log::trivial::trace : return SEVERITY_TRACE;
        case boost::log::trivial::debug : return SEVERITY_DEBUG;
    }
    return 0;
}


boost::log::sources::severity_logger<boost::log::trivial::severity_level>&
getLogger()
{
    return lg;
}
