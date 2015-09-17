#!/bin/bash 
#/****************************************************************
# * Copyright (c) Neptunium Pvt Ltd., 2014.
# * Author: Neptunium Pvt Ltd..
# *
# * This unpublished material is proprietary to Neptunium Pvt Ltd..
# * All rights reserved. The methods and techniques described herein 
# * are considered trade secrets and/or confidential. Reproduction or 
# * distribution, in whole or in part, is forbidden except by express 
# * written permission of Neptunium.
# ****************************************************************/
#check if the antkorp is already running and if the directory is there 
#then stop all antkorp services.
if [ -f "/etc/init/antkorp.conf" ]; then
	echo "stopping all antkorp services.";
	initctl stop antkorp
fi
exit 0;
