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

freshinstall="no";
configuration_file=/etc/antkorp/antkorp.cfg
export PATH=$PATH:/opt/antkorp/foreign/bin:/opt/antkorp/custom/bin;
system_mongo_server_address=127.0.0.1;
ngw_debug_level=error;
ngw_log_file=/var/log/antkorp/ngw;
ngw_server_certificate="/opt/antkorp/certs/selfsigned.pem";
ngw_server_certificate_key="/opt/antkorp/certs/selfsigned.key";
ngw_gateway_port=8080;
ngw_interface_address="";
ngw_peer_multicast_address=224.0.0.1;
ngw_peer_multicast_port=30001;
ngw_peer_connection_port=23456;

#authentication service configuration variables.
auth_debug_level=error;
auth_log_file=/var/log/antkorp/auth;
fmgr_folder_base=/opt/antkorp/homes/;
auth_ldap_base="";
auth_admin_bind_dn="";
auth_admin_pass="";
auth_ldap_server="";
auth_ldap_server_port="";
auth_common_user_path="";

#antkorp file manager configuration variables.
fmgr_debug_level=error;
fmgr_thread_count=100;
fmgr_log_file=/var/log/antkorp/fmgr;

#antkorp conversation service.
kons_debug_level=error;
kons_log_file=/var/log/antkorp/kons;

#realtime service configuration
rtc_debug_level=error;
rtc_log_file=/var/log/antkorp/rtc;
rtc_stun_server="stun:stun.l.google.com:19302";

#calendar service configuration
cron_debug_level=error;
cron_log_file=/var/log/antkorp/cron;

#tunneld service configuration 
tunneld_debug_level=error; 
tunneld_log_file=/var/log/antkorp/tunneld;

function valid_debug_level()
{
    if [ $1 !=  info ] && [ $1 != error ] && [ $1 != warning ] && [ $1 != trace ] && [ $1 != fatal ];  
    then
        return 1;
    else
        return 0;
    fi
}

#display a javascript style alert box with a message given.
function alert()
{
     dialog --title "Errors in configuration !!!" --msgbox "$1" 10 70
}

#validate ip and return true or false whether valid or not.
function valid_ip()
{
    local  ip=$1
    local  stat=1

    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        stat=$?
    fi
    return $stat
}

#check whether the ip address is present on any of the interfaces. 
#if not then the address is invalid.
function is_ip_present_on_any_iface()
{
 Interfaces=`ifconfig -a \
               | grep -o -e "[a-z][a-z]*[0-9]*[ ]*Link" \
               | perl -pe "s|^([a-z]*[0-9]*)[ ]*Link|\1|"`

               for Interface in $Interfaces; do
                   INET=`ifconfig $Interface | grep -o -e "inet addr:[^ ]*" | grep -o -e "[^:]*$"`
                       MASK=`ifconfig $Interface | grep -o -e "Mask:[^ ]*"      | grep -o -e "[^:]*$"`
                       STATUS="up"
                       if [ "$INET" == "" ]; then
                           INET="-"
                               MASK="-"
                               STATUS="down";
                       fi  
                #printf "%-10s %-15s %-16s %-4s\n" "$Interface" "$INET" "$MASK" "$STATUS"
                if [ $1 == $INET ]; then 
                    return 0;
                fi  
                done
                return 1;
}

function global_dialog() 
{ 
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "Antkorp global configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"mongodb server ip: " 1 1 "$system_mongo_server_address" 1 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile
    system_mongo_server_address=${arr[0]}
    rm $tempfile;
    validate_global_config;
    #if [ "$validation_status"  == "fail" ]; then global_dialog; fi
}

function ngw_dialog() 
{ 
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "Network gateway configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"interface address (*):" 1 1 "$ngw_interface_address" 1 25 50 50 \
	"network port:" 2 1 "$ngw_gateway_port" 2 25 50 50 \
	"debug level:" 3 1 "$ngw_debug_level" 3 25 50 50 \
	"multicast address :" 4 1 "$ngw_peer_multicast_address" 4 25 50 50 \
	"multicast port:" 5 1 "$ngw_peer_multicast_port" 5 25 50 50 \
	"peer connection port:" 6 1 "$ngw_peer_connection_port" 6 25 50 50 \
	"log file:" 7 1 "$ngw_log_file" 7 25 50 50 \
	"ssl certificate file:" 8 1 "$ngw_server_certificate" 8 25 50 50 \
	"ssl certificate key :" 9 1 "$ngw_server_certificate_key" 9 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    ngw_interface_address=${arr[0]}
    ngw_gateway_port=${arr[1]}
    ngw_debug_level=${arr[2]}
    ngw_peer_multicast_address=${arr[3]}
    ngw_peer_multicast_port=${arr[4]}
    ngw_peer_connection_port=${arr[5]}
    ngw_log_file=${arr[6]}
    ngw_server_certificate=${arr[7]}
    ngw_server_certificate_key=${arr[8]}
    rm $tempfile;
    validate_ngw_config;
}

function auth_dialog() 
{ 
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "Authentication service configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"log file:" 1 1 "$auth_log_file" 1 25 50 50 \
	"debug level:" 2 1 "$auth_debug_level" 2 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    auth_log_file=${arr[0]}
    auth_debug_level=${arr[1]}
    rm $tempfile;
    validate_auth_config;
}

function fmgr_dialog() 
{ 
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "File manager service configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"debug level:" 1 1 "$fmgr_debug_level" 1 25 50 50 \
	"thread count:" 2 1 "$fmgr_thread_count" 2 25 50 50 \
	"log file:" 3 1 "$fmgr_log_file" 3 25 50 50 \
	"storage directory(*):" 4 1 "$fmgr_folder_base" 4 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    fmgr_debug_level=${arr[0]}
    fmgr_thread_count=${arr[1]}
    fmgr_log_file=${arr[2]}
    fmgr_folder_base=${arr[3]}
    rm $tempfile;
    validate_fmgr_config;
}

function cron_dialog() 
{ 
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "calendar service configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"log file:" 1 1 "$cron_log_file" 1 25 50 50 \
	"debug level:" 2 1 "$cron_debug_level" 2 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    cron_log_file=${arr[0]}
    cron_debug_level=${arr[1]}
    rm $tempfile;
    validate_cron_config;
}

function rtc_dialog() 
{ 
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "real time communication service configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"log file:" 1 1 "$rtc_log_file" 1 25 50 50 \
	"debug level:" 2 1 "$rtc_debug_level" 2 25 50 50 \
	"stun server:" 3 1 "$rtc_stun_server" 3 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    rtc_log_file=${arr[0]}
    rtc_debug_level=${arr[1]}
    rtc_stun_server=${arr[2]}
    rm $tempfile;
    validate_rtc_config;
}

function kons_dialog()
{
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "konversations service configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"log file:" 1 1 "$kons_log_file" 1 25 50 50 \
	"debug level:" 2 1 "$kons_debug_level" 2 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    kons_log_file=${arr[0]}
    kons_debug_level=${arr[1]}
    rm $tempfile;
    validate_kons_config;
}

function tunneld_dialog()
{
    tempfile=$(mktemp);
	dialog --backtitle "" --no-ok --no-cancel --title "Broadway tunnel service configuration" \
	--form "\nPress Enter to return to previous menu." 20 70 16 \
	"log file:" 1 1 "$tunneld_log_file" 1 25 50 50 \
	"debug level:" 2 1 "$tunneld_debug_level" 2 25 50 50 \
	2>$tempfile;
    arr=();
    while read -r line; do arr+=("$line"); done< $tempfile;
    tunneld_log_file=${arr[0]}
    tunneld_debug_level=${arr[1]}
    rm $tempfile;
    validate_tunneld_config;
}

#function checks the exit status of the prev run command and alerts the user 
#with a given error message and exits.
function error_alert()
{
    if [ ! $? -eq 0 ]; then
        dialog --title "Errors in configuration !!!" --msgbox "$1" 6 70
        exit 1;
    fi
}

function check_null_and_exit()
{
    if [ $2 == "null" ]; then 
        alert "$1"" :parameter missing."" configuration file seems to be corrupted, some parameters are missing.";
        exit 1;
    fi
}

#for string parameters jq returns the strings with '"' characters at start and end of the 
#string, we need to remove and assign it to shell variables. because we will append '"' 
#while saving it back to the json file. all this is needed to avoid user mentioning '"' 
#in the configuration dialog for string values.
function read_configuration()
{
    echo "reading configuration from the config file.....hold on";
    system_mongo_server_address=`cat $configuration_file | jq '.system.mongo_server_address'`;
    check_null_and_exit system_mongo_server_address $system_mongo_server_address;
    system_mongo_server_address=${system_mongo_server_address:1:-1};

    ngw_debug_level=`cat $configuration_file | jq '.ngw.debug_level'`;
    check_null_and_exit ngw_debug_level $ngw_debug_level;
    ngw_debug_level=${ngw_debug_level:1:-1};
    ngw_log_file=`cat $configuration_file | jq '.ngw.log_file'`;
    check_null_and_exit ngw_log_file $ngw_log_file;
    ngw_log_file=${ngw_log_file:1:-1};
    ngw_server_certificate=`cat $configuration_file | jq '.ngw.server_certificate'`;
    check_null_and_exit ngw_server_certificate $ngw_server_certificate;
    ngw_server_certificate=${ngw_server_certificate:1:-1};
    ngw_server_certificate_key=`cat $configuration_file | jq '.ngw.server_certificate_key'`;
    check_null_and_exit ngw_server_certificate_key $ngw_server_certificate_key;
    ngw_server_certificate_key=${ngw_server_certificate_key:1:-1};
    ngw_gateway_port=`cat $configuration_file | jq '.ngw.gateway_port'`;
    check_null_and_exit ngw_gateway_port $ngw_gateway_port;
    ngw_interface_address=`cat $configuration_file | jq '.ngw.interface_address'`;
    check_null_and_exit ngw_interface_address $ngw_interface_address;
    ngw_interface_address=${ngw_interface_address:1:-1};
    ngw_peer_multicast_address=`cat $configuration_file | jq '.ngw.peer_multicast_address'`;
    check_null_and_exit ngw_peer_multicast_address $ngw_peer_multicast_address;
    ngw_peer_multicast_address=${ngw_peer_multicast_address:1:-1};
    ngw_peer_multicast_port=`cat $configuration_file | jq '.ngw.peer_multicast_port'`;
    check_null_and_exit ngw_peer_multicast_port $ngw_peer_multicast_port;
    ngw_peer_connection_port=`cat $configuration_file | jq '.ngw.peer_connection_port'`;
    check_null_and_exit ngw_peer_connection_port $ngw_peer_connection_port;

    auth_debug_level=`cat $configuration_file | jq '.auth.debug_level'`;
    check_null_and_exit auth_debug_level $auth_debug_level;
    auth_debug_level=${auth_debug_level:1:-1};
    auth_log_file=`cat $configuration_file | jq '.auth.log_file'`;
    check_null_and_exit auth_log_file $auth_log_file;
    auth_log_file=${auth_log_file:1:-1};

    fmgr_folder_base=`cat $configuration_file | jq '.fmgr.folder_dir'`;
    check_null_and_exit fmgr_folder_base $fmgr_folder_base;
    fmgr_folder_base=${fmgr_folder_base:1:-1};
    fmgr_debug_level=`cat $configuration_file | jq '.fmgr.debug_level'`;
    check_null_and_exit fmgr_debug_level $fmgr_debug_level;
    fmgr_debug_level=${fmgr_debug_level:1:-1};
    fmgr_thread_count=`cat $configuration_file | jq '.fmgr.thread_count'`;
    check_null_and_exit fmgr_thread_count $fmgr_thread_count;
    fmgr_log_file=`cat $configuration_file | jq '.fmgr.log_file'`;
    check_null_and_exit fmgr_log_file $fmgr_log_file;
    fmgr_log_file=${fmgr_log_file:1:-1};

    kons_debug_level=`cat $configuration_file | jq '.kons.debug_level'`;
    check_null_and_exit kons_debug_level $kons_debug_level;
    kons_debug_level=${kons_debug_level:1:-1};
    kons_log_file=`cat $configuration_file | jq '.kons.log_file'`;
    check_null_and_exit kons_log_file $kons_log_file;
    kons_log_file=${kons_log_file:1:-1};

    rtc_debug_level=`cat $configuration_file | jq '.rtc.debug_level'`;
    check_null_and_exit rtc_debug_level $rtc_debug_level;
    rtc_debug_level=${rtc_debug_level:1:-1};
    rtc_log_file=`cat $configuration_file | jq '.rtc.log_file'`;
    check_null_and_exit rtc_log_file $rtc_log_file;
    rtc_log_file=${rtc_log_file:1:-1};
    rtc_stun_server=`cat $configuration_file | jq '.rtc.stun_server'`;
    check_null_and_exit rtc_stun_server $rtc_stun_server;
    rtc_stun_server=${rtc_stun_server:1:-1};

    cron_debug_level=`cat $configuration_file | jq '.cron.debug_level'`;
    check_null_and_exit cron_debug_level $cron_debug_level;
    cron_debug_level=${cron_debug_level:1:-1};
    cron_log_file=`cat $configuration_file | jq '.cron.log_file'`;
    check_null_and_exit cron_log_file $cron_log_file;
    cron_log_file=${cron_log_file:1:-1};

    tunneld_debug_level=`cat $configuration_file | jq '.tunneld.debug_level'`;
    check_null_and_exit tunneld_debug_level $tunneld_debug_level;
    tunneld_debug_level=${tunneld_debug_level:1:-1};
    tunneld_log_file=`cat $configuration_file | jq '.tunneld.log_file'`;
    check_null_and_exit tunneld_log_file $tunneld_log_file;
    tunneld_log_file=${tunneld_log_file:1:-1};
}

function write_configuration()
{
    CONFIG_START="{\n";
    CONFIG_END="}\n";
    GLOBAL_CONFIG=""\"system"\" : \n {\n "\"mongo_server_address"\": "\"$system_mongo_server_address"\"\n},\n";
    NGW_CONFIG=""\"ngw"\":  \n\
    { \n \
    "\"interface_address"\": "\"$ngw_interface_address"\",\n \
    "\"server_certificate"\": "\"$ngw_server_certificate"\",\n \
    "\"server_certificate_key"\": "\"$ngw_server_certificate_key"\",\n \
    "\"gateway_port"\": $ngw_gateway_port, \n \
    "\"debug_level"\": "\"$ngw_debug_level"\" ,\n\
    "\"log_file"\": "\"$ngw_log_file"\" ,\n\
    "\"peer_multicast_address"\": "\"$ngw_peer_multicast_address"\", \n\
    "\"peer_multicast_port"\": $ngw_peer_multicast_port ,\n\
    "\"peer_connection_port"\": $ngw_peer_connection_port \n\
    },\n";
    AUTH_CONFIG=""\"auth"\":  \n\
    {  \n \
    "\"debug_level"\": "\"$auth_debug_level"\", \n\
    "\"log_file"\": "\"$auth_log_file"\" \n\
    },\n";
    FMGR_CONFIG=""\"fmgr"\": \n \
    { \n \
    "\"debug_level"\": "\"$fmgr_debug_level"\" , \n\
    "\"log_file"\": "\"$fmgr_log_file"\" ,\n\
    "\"thread_count"\": $fmgr_thread_count, \n\
    "\"folder_dir"\": "\"$fmgr_folder_base"\"\n \
    },\n";
    CRON_CONFIG=""\"cron"\": \n \
    {  \n \
    "\"debug_level"\": "\"$cron_debug_level"\", \n\
    "\"log_file"\": "\"$cron_log_file"\"\n\
    },\n";
    RTC_CONFIG=""\"rtc"\": \n \
    {  \n \
    "\"debug_level"\": "\"$rtc_debug_level"\", \n\
    "\"log_file"\": "\"$rtc_log_file"\",\n\
    "\"stun_server"\": "\"$rtc_stun_server"\" \n\
    },\n";
    KONS_CONFIG=""\"kons"\": \n\
    {  \n \
    "\"debug_level"\": "\"$kons_debug_level"\", \n\
    "\"log_file"\": "\"$kons_log_file"\" \n\
    },\n";
    TUNNELD_CONFIG=""\"tunneld"\": \n\
    {   \n \
    "\"debug_level"\": "\"$tunneld_debug_level"\",\n\
    "\"log_file"\": "\"$tunneld_log_file"\" \n\
    }\n";
    JSON=$CONFIG_START$GLOBAL_CONFIG$NGW_CONFIG$FMGR_CONFIG$AUTH_CONFIG$CRON_CONFIG$RTC_CONFIG$KONS_CONFIG$TUNNELD_CONFIG$CONFIG_END;
    #echo -e $JSON
    echo -e $JSON > $configuration_file;
}

function validate_global_config()
{
    validation_status="fail";
    if ! [[ "$system_mongo_server_address" ]]; then
        alert "One of the parameters in global configuration left empty.";
        return;
    fi
    if ! valid_ip $system_mongo_server_address ; then
        alert "Invalid IP address given for mongo server address under system configuration.";
        return;
    fi
    validation_status="success";
}

function validate_ngw_config()
{
    validation_status="fail";
    if ! [[ "$ngw_interface_address" && "$ngw_log_file" && "$ngw_server_certificate_key" && "$ngw_server_certificate" \
            && "$ngw_debug_level" && "$ngw_peer_multicast_port" && "$ngw_gateway_port" && "$ngw_peer_multicast_address" \
            && "$ngw_peer_connection_port" ]]; then
        alert "One of the parameters in network gateway configuration left empty.";
        return;
    fi
    if ! valid_ip $ngw_interface_address; then
        alert "Invalid IP address given for interface_address under network gateway configuration.";
        return;
    fi
    if ! is_ip_present_on_any_iface $ngw_interface_address; then
        alert "Invalid IP address given for interface_address under network gateway configuration. IP address should be present on one of the interfaces";
        return;
    fi
    if ! valid_ip $ngw_peer_multicast_address ; then
        alert "Invalid IP address given for peer_multicast_address under network gateway configuration.";
        return;
    fi
    if [[ $ngw_gateway_port -lt 1024 ]] ; then
        alert "network gateway port should be a nonzero value greater than 1024.";
        return;
    fi
    if [[ $ngw_peer_connection_port -lt 1024 ]] ; then
        alert "peer connection port under network gateway configuration should be nonzero value greater than 1024.";
        return;
    fi
    if [[ $ngw_peer_multicast_port -lt 1024 ]] ; then
        alert "peer multicast port under network gateway configuration should be nonzero value greater than 1024.";
        return;
    fi
    if ! valid_debug_level $ngw_debug_level; then 
        alert "Invalid level specified for debug_level under network gateway configuration.";
        return;
    fi
    if [ ! -f $ngw_server_certificate ]; then
        alert "No certificate found at the given location, Please give correct location of the certificate.";
        return;
    fi
    if [ ! -f $ngw_server_certificate_key ]; then
        alert "No certificate key found at the given location, Please give correct location of the certificate key.";
        return;
    fi
    validation_status="success";
}

function validate_fmgr_config()
{
    validation_status="fail";
    if ! [[ "$fmgr_thread_count" && "$fmgr_debug_level" ]]; then
        alert "One of the parameters in file manager configuration left empty.";
        return;
    fi
    if [[ $fmgr_thread_count -eq 0 ]] ; then
        alert "file manager thread count should be a nonzero value.";
        return;
    fi
    if ! valid_debug_level $fmgr_debug_level; then 
        alert "Invalid level specified for debug_level under file manager service configuration.";
        return;
    fi
    validation_status="success";
}

function validate_kons_config()
{
    validation_status="fail";
    if ! [[ "$kons_debug_level" && "$kons_log_file" ]]; then
        alert "One of the parameters in konversations configuration left empty.";
        return;
    fi
    if ! valid_debug_level $kons_debug_level; then 
        alert "Invalid level specified for debug_level under konversation service configuration.";
        return;
    fi
    validation_status="success";
}

function validate_tunneld_config()
{
    validation_status="fail";
    if ! [[ "$tunneld_debug_level" && "$tunneld_log_file" ]]; then
        alert "One of the parameters in tunnel service configuration left empty.";
        return;
    fi
    if ! valid_debug_level $tunneld_debug_level; then 
        alert "Invalid level specified for debug_level under tunnel service configuration.";
        return;
    fi
    validation_status="success";
}

function validate_rtc_config()
{
    validation_status="fail";
    if ! [[ "$rtc_stun_server" && "$rtc_debug_level" && "$rtc_log_file" ]]; then
        alert "One of the parameters in real time communication configuration left empty.";
        return;
    fi
    if ! valid_debug_level $rtc_debug_level; then 
        alert "Invalid level specified for debug_level under real time communication service configuration.";
        return;
    fi
    validation_status="success";
}

function validate_cron_config()
{
    validation_status="fail";
    if ! [[ "$cron_debug_level" && "$cron_log_file" ]]; then
        alert "One of the parameters in calendar service configuration left empty.";
        return;
    fi
    if ! valid_debug_level $cron_debug_level; then 
        alert "Invalid level specified for debug_level under real time communication service configuration.";
        return;
    fi
    validation_status="success";
}

function validate_auth_config()
{
    validation_status="fail";
    if ! [[ "$auth_debug_level" && "$auth_log_file" ]]; then
        alert "One of the parameters in calendar service configuration left empty.";
        return;
    fi
    if ! valid_debug_level $auth_debug_level; then  
        alert "Invalid level specified for debug_level under authentication service configuration.";
        return;
    fi
    validation_status="success";
}

function validate_configuration()
{
    validate_global_config;
    validate_ngw_config;
    validate_fmgr_config;
    validate_kons_config;
    validate_rtc_config;
    validate_cron_config;
    validate_tunneld_config;
    return;
}

#write all the configuration values to the file and exit.
function save_and_exit()
{
    validate_configuration;
    if [ "$validation_status"  == "success" ]; then 
        echo "Creating the base directory for storing files and folders";
        #see if the directory already exists if not try to create it.
        #if it already exists then see if the directory permissions are to be read and written by antkorp
        if [ ! -d "$fmgr_folder_base" ]; then
            mkdir -p $fmgr_folder_base;
            dircreatestatus=$?
            if [ $dircreatestatus -eq 0 ];then
               echo "Creation of base directory succeeded, setting permissions"
               chown -R antkorp:antkorp  $fmgr_folder_base;
               chownstatus=$?
               if [ ! $chownstatus -eq 0 ]; then 
                    echo "Setting ownership for the folder base directory failed, you are not root it seems.";
                    exit 1;
               fi
            else
               alert "Creation of base directory failed, Please check if you have permissions."
               exit 1;
            fi
        else
            #Try to see if the directory can be written and read by antkorp.
            echo "Base directory already exists checking if antkorp has read and write access to the folder.";
            #create a temporary file and copy it to the folder if we succeed then try to remove.
            tempfile="junk.txt";
            >$fmgr_folder_base/$tempfile;
            createcode=$?
            rm $fmgr_folder_base/$tempfile;
            if [ ! $createcode -eq 0 ]; then 
               alert "Base directory is not written by system user 'antkorp'.";
               exit 1;
            fi
        fi
 
        write_configuration;
        if [ "$freshinstall" != "yes" ]; then
            dialog --title "Restart antkorp" --backtitle "Configuration changed." --yesno "Configuration will take effect only on restart, do you want to restart antkorp now ?" 7 60
                restartantkorp=$?
                case $restartantkorp in
                0) echo "Restarting antkorp platform ..."
                   restart antkorp;
                ;;
                1) echo "Configuration will take effect on next bootup."
                ;;
                esac
        fi
        exit 0;
    fi
}

choice=0
if [ $UID != 0 ]; then
    echo "You need root permissions to run this tool.";
    exit 1;
fi


#check if there is a 'orgs' collection in the mongodb. if there is then 
#its not an old installation.
org=`mongo --quiet akorpdb --eval 'db.orgs.exists()'`;
if [ -f $configuration_file ]; then
    alert "There is a configuration file already present in standard location. You can modify or select exit to continue with existing configuration.";
    read_configuration;
else
    alert "Configuration file missing in standard location, starting with default values.";
    if [ "$org" == "null" ] ; then
        freshinstall="yes";
    fi
fi


while [ $choice -lt 9 ]
do
dialog --no-ok --no-cancel --title "Antkorp platform configuration dialog" \
--menu "Please enter the configuration for antkorp platform." 20 55 10 \
1 "Antkorp platform global configuration." \
2 "Network gateway configuration." \
3 "Konversations service configuration." \
4 "Realtime communication service configuration." \
5 "Calendar service configuration." \
6 "Authentication service configuration." \
7 "File manager service configuration." \
8 "Broadway tunnel service configuration." \
9 "Save & Exit." \
10 "Exit." 2> /tmp/menuchoice;
choice=`cat /tmp/menuchoice`
case $choice in
        1)
	    global_dialog;
        ;;
        2)
	    ngw_dialog;
        ;;
        3)
	    kons_dialog;
        ;;
        4)
	    rtc_dialog; 
        ;;
        5)
	    cron_dialog;
        ;;
        6)
	   auth_dialog;
        ;;
	    7) 
	   fmgr_dialog;
	    ;;
        8)
        tunneld_dialog;
        ;;
        9)
	    save_and_exit;
        ;;
        10)
        exit 0;
        ;;
    esac
done
