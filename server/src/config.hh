/****************************************************************
 * Copyright (c) Neptunium Pvt Ltd., 2014.
 * Author: Neptunium Pvt Ltd..
 *
 * This unpublished material is proprietary to Neptunium Pvt Ltd..
 * All rights reserved. The methods and techniques described herein 
 * are considered trade secrets and/or confidential. Reproduction or 
 * distribution, in whole or in part, is forbidden except by express 
 *written permission of Neptunium.
 ****************************************************************/

#ifndef __INC_CONFIG_H__
#define __INC_CONFIG_H__

#include <string>
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

void
loadConfig(std::string);

extern boost::property_tree::ptree& 
getPropertyTreeRef(void);

//return a configuration value, the type of the value can be int or string.
template<typename T> T 
getConfigValue(std::string attr)
{
	return getPropertyTreeRef().get<T>(attr);
}

template <typename T> T
putConfigValue(std::string attr, T val)
{
	getPropertyTreeRef().put(attr, val);
	return;
}
#endif
