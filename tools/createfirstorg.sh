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
userid="";
password="";
confirm_password="";
ngw_gateway_port="";
ngw_interface_address="";
configvalid="false";

#source:
#http://stackoverflow.com/questions/14170873/bash-regex-email-matching
#copyright @ http://stackoverflow.com/users/7552/glenn-jackman
function valid_email()
{
    local email=$1;
    char='[[:alnum:]!#\$%&'\''\*\+/=?^_\`{|}~-]'
    name_part="${char}+(\.${char}+)*"
    domain="([[:alnum:]]([[:alnum:]-]*[[:alnum:]])?\.)+[[:alnum:]]([[:alnum:]-]*[[:alnum:]])?"
    begin='(^|[[:space:]])'
    end='($|[[:space:]])'
    # include capturing parentheses, 
    # these are the ** 2nd ** set of parentheses (there's a pair in $begin)
    re_email="${begin}(${name_part}@${domain})${end}"
    if [[ $email =~ $re_email ]]; then 
        return 0;
    else
        return 1;
    fi
}

function alert()
{
     dialog --title "Errors in configuration !!!" --msgbox "$1" 6 70
}

function create_first_user_and_org()
{
    tempfile=$(mktemp);
    dialog --backtitle "" --no-cancel --title "Welcome to antkorp." \
        --insecure "$@" \
        --mixedform "\nPlease enter your organization name and a userid to start with." 20 70 16 \
        "Organization Name:" 1 1 "$orgname" 1 25 25 0 0\
        "Userid           :" 2 1 "$userid" 2 25 25 0 0\
        "Password         :" 3 1 "$password" 3 25 25 0 1\
        "Retype Password  :" 4 1 "$confirm_password" 4 25 25 0 1\
        2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    orgname=${arr[0]}
    userid=${arr[1]}
    password=${arr[2]}
    confirm_password=${arr[3]}

    if [ -z "$orgname" ]; then
        alert "Need organization name.";
        return;
    fi

    if [ -z "$userid" ]; then
        alert "Need Userid.";
        return;
    fi
    
    #userid should be an email address.
    if ! valid_email $userid ; then 
        alert "Please enter a valid email address for userid";
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
    if  [ "$userid" == "^[a-zA-Z0-9_]+$" ]; then
        alert "Userid contains invalid characters, only alphabets, and digits are allowed.";
        return;
    fi
    #create the user and the org in the db.
    ngw_interface_address=`cat $configuration_file | jq '.ngw.interface_address'`;
    ngw_gateway_port=`cat $configuration_file | jq '.ngw.gateway_port'`;
    ngw_interface_address=`sed -e 's/^"//' -e 's/"$//' <<< $ngw_interface_address`;
    serveraddr=$ngw_interface_address":"$ngw_gateway_port;
    echo "server addr:" $serveraddr;
    /opt/antkorp/custom/bin/clntsim --server $serveraddr --org-create "$orgname"
    #check if the org creation is success
    org=`mongo --quiet akorpdb --eval "db.orgs.findOne({"name":\"$orgname\"})"`;
    if [ "$org" == "null" ] ; then
        alert "There was an error creating the organization  collection in mongodb, aborting installation..." ;
        exit -1;
    fi
    /opt/antkorp/custom/bin/clntsim --server "$serveraddr" --org "$orgname"  --user-create "$userid" --password "$password"
    #check if the user creation is success
    user=`mongo --quiet akorpdb --eval "db.users.findOne({"uname":\"$userid\"})"`;
    if [ "$user" == "null" ] ; then
        alert "There was an error creating the user object in the mongodb, aborting installation..." ;
        exit -1;
    fi
    configvalid="true";
    return;
}

if [ $UID != 0 ]; then
    echo "You need root permissions to run this tool.";
    exit 1;
fi

while [ $configvalid != "true" ]
do
create_first_user_and_org;
done
