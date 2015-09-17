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

#include "config.hh"

static boost::property_tree::ptree pt; 
boost::property_tree::ptree&  getPropertyTreeRef(void) { return pt; }

void
loadConfig(std::string filename)
{
	boost::property_tree::read_json(filename, getPropertyTreeRef());
	return;
}

