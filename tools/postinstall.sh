#!/bin/bash 
#-----------
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

#change the permissions of the /var/log directory to the antkorp.
echo "Creating necessary symbolic links ";
ln -s -f /opt/antkorp/foreign/lib/libgtk-3.so.0.1000.7 /opt/antkorp/foreign/lib/libgtk-3.so.0
ln -s -f /opt/antkorp/foreign/lib/libgtk-3.so.0.1000.7 /opt/antkorp/foreign/lib/libgtk-3.so
ln -s -f /opt/antkorp/foreign/lib/libgdk-3.so.0.1000.7 /opt/antkorp/foreign/lib/libgdk-3.so.0
ln -s -f /opt/antkorp/foreign/lib/libgdk-3.so.0.1000.7 /opt/antkorp/foreign/lib/libgdk-3.so
ln -s -f /opt/antkorp/foreign/lib/libgailutil-3.so.0.0.0 /opt/antkorp/foreign/lib/libgailutil-3.so.0
ln -s -f /opt/antkorp/foreign/lib/libgailutil-3.so.0.0.0 /opt/antkorp/foreign/lib/libgailutil-3.so

echo "Setting permissions for the antkorp files.";
chown antkorp:antkorp /var/log/antkorp
rc=$?
if [[ $rc != 0 ]] ; then
    echo "chown antkorp:antkorp /var/log/antkorp failed with" $rc;
    exit $rc
fi

chown -R antkorp:antkorp /opt/antkorp/
rc=$?
if [[ $rc != 0 ]] ; then
    echo "chown antkorp:antkorp /opt/antkorp/custom/bin/* failed with" $rc;
    exit $rc
fi

#throw the configuration dialog to the user and aks for the configuration.
/opt/antkorp/custom/bin/configui.sh
rc=$?
if [[ $rc != 0 ]] ; then
    echo "Error writing configuration file, bailing out. installation failure.";
    exit $rc
fi

#create the antkorp database in the mongo database and all the needed collections.
#while doing that take the mongodb server address from the config file and then 
#create the database and collections in the respective mongodb server.
org=`mongo --quiet akorpdb --eval 'db.orgs.exists()'`;
if [ "$org" == "null" ] ; then
    echo "Creating antkorp database and required collections in the mongodb"
    mongo akorpdb --eval "db.meta.save({"uid": 1, "gid" : 1});"
    rc=$?
    if [[ $rc != 0 ]] ; then
        echo "Creating database in mongodb failed with" $rc;
        exit $rc
    fi
fi

#start all the antkorp services
if [ -f "/etc/init/antkorp.conf" ]; then
	echo "starting all antkorp services.";
	initctl start antkorp
fi
rc=$?
if [[ $rc != 0 ]] ; then
    echo "starting antkorp platform failed with:" $rc;
    exit $rc
fi

#throw the user creation and org creation dialog to the user for first time.
/opt/antkorp/custom/bin/createfirstorg.sh
exit 0;
