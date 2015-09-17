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

#ifndef __INC_LOG_H__ 
#define __INC_LOG_H__
#include <string>
#include <boost/log/core.hpp>
#include <boost/log/trivial.hpp>
#include <boost/log/expressions.hpp>
#include <boost/log/sinks/text_file_backend.hpp>
#include <boost/log/utility/setup/console.hpp>
#include <boost/log/utility/setup/file.hpp>
#include <boost/log/utility/setup/common_attributes.hpp>
#include <boost/log/sources/severity_logger.hpp>
#include <boost/log/sources/record_ostream.hpp>
#include <boost/log/attributes/timer.hpp>
#include <boost/log/attributes/named_scope.hpp>
#include <boost/log/support/date_time.hpp>

#define SEVERITY_INFO boost::log::trivial::info
#define SEVERITY_ERROR boost::log::trivial::error
#define SEVERITY_WARNING boost::log::trivial::warning
#define SEVERITY_FATAL boost::log::trivial::fatal
#define SEVERITY_TRACE boost::log::trivial::trace
#define SEVERITY_DEBUG boost::log::trivial::debug

#define _fatal BOOST_LOG_SEV(getLogger(), boost::log::v2_mt_posix::trivial::fatal) 
#define _error BOOST_LOG_SEV(getLogger(), boost::log::v2_mt_posix::trivial::error) 
#define _warn  BOOST_LOG_SEV(getLogger(), boost::log::v2_mt_posix::trivial::warning) 
#define _info  BOOST_LOG_SEV(getLogger(), boost::log::v2_mt_posix::trivial::info) 
#define _debug BOOST_LOG_SEV(getLogger(), boost::log::v2_mt_posix::trivial::debug) 
#define _trace BOOST_LOG_SEV(getLogger(), boost::log::v2_mt_posix::trivial::trace) 

boost::log::sources::severity_logger<boost::log::trivial::severity_level>& getLogger();
void setLogLevel(int );
int getLogLevel(void);
void openLog(std::string );
#endif
