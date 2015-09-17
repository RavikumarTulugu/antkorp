#!/bin/bash
#-------------
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

export PATH=$PATH:/opt/antkorp/foreign/bin:/opt/antkorp/custom/bin;
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/lib:/opt/antkorp/custom/lib:/opt/antkorp/foreign/lib;
configuration_file=/etc/antkorp/antkorp.cfg
orgname="";
password="";
confirm_password="";
ngw_gateway_port="";
ngw_interface_address="";
configvalid="false";

function alert()
{
     dialog --title "Errors in configuration !!!" --msgbox "$1" 6 70
}

function admin_passwd_reset()
{
    tempfile=$(mktemp);
    dialog --backtitle "This utility will allow you to reset the admin password of organization" --no-cancel --title "Admin password reset" \
        --insecure "$@" \
        --mixedform "\nPlease enter the organization name and the new admin password" 20 70 16 \
        "Organization Name:" 1 1 "$orgname" 1 25 25 0 0\
        "Password         :" 2 1 "$password" 2 25 25 0 1\
        "Retype Password  :" 3 1 "$confirm_password" 3 25 25 0 1\
        2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    orgname=${arr[0]}
    password=${arr[1]}
    confirm_password=${arr[2]}

    if [ -z "$orgname" ]; then
        alert "Need organization name.";
        return;
    fi

    if [ -z "$password" ]; then
         alert "Password field cannot be empty.";
         return;
    fi

    if [ -z "$confirm_password" ]; then
        alert "Please confirm your password by retyping.";
        return;
    fi

    if [ "$password" != "$confirm_password" ] ; then
        alert "Password entries donot match, retype correct password.";
        return;
    fi
    #validate the organization name and the userid for allowed characters.
    if [ "$orgname" == "^[a-zA-Z0-9_]+$" ]; then
        alert "Organization name contains invalid characters, only alphabets and digits are allowed.";
        return;
    fi
    #create the user and the org in the db.
    ngw_interface_address=`cat $configuration_file | jq '.ngw.interface_address'`;
    ngw_gateway_port=`cat $configuration_file | jq '.ngw.gateway_port'`;
    ngw_interface_address=`sed -e 's/^"//' -e 's/"$//' <<< $ngw_interface_address`;
    serveraddr=$ngw_interface_address":"$ngw_gateway_port;
    echo "server addr:" $serveraddr;
    org=`mongo --quiet akorpdb --eval "db.orgs.findOne({"name":\"$orgname\"})"`;
    if [ "$org" == "null" ] ; then
        alert "There was an error creating the organization  collection in mongodb, aborting installation..." ;
        exit -1;
    fi
    configvalid="true";
    /opt/antkorp/custom/bin/clntsim --server "$serveraddr" --org "$orgname"  --admin-passwd-reset "$password"
    return;
}

if [ $UID != 0 ]; then
    echo "You need root permissions to run this tool.";
    exit 1;
fi

while [ $configvalid != "true" ]
do
admin_passwd_reset;
done
