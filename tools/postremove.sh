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
userdel antkorp
groupdel antkorp
rm -rf "/opt/antkorp/*"
dialog --title "Delete antkorp data from mongodb ?" --defaultno --backtitle "" --yesno "Do you want to delete antkorp data from mongodb ?" 7 60
deletedb=$?
case $deletedb in
    #remove the antkorp collections from the mongodb 
   0) echo "Deleting antkorp data from the mongodb."
    mongo akorpdb --eval "db.dropDatabase()"
    rc=$?
    if [[ $rc != 0 ]] ; then
        echo "deleting database from mongodb failed with:" $rc;
    fi
    ;;
   1) echo "Leaving antkorp data in mongodb."
    ;;
esac
dialog --title "Delete antkorp configuration file ?" --defaultno --backtitle "" --yesno "Do you want to delete antkorp configuration file ?" 7 60
deleteconf=$?
case $deleteconf in
   0) echo "Deleting antkorp configuration file."
    rm -rf /etc/antkorp/antkorp.cfg
    rc=$?
    if [[ $rc != 0 ]] ; then
        echo "deleting database from mongodb failed with:" $rc;
    fi
    ;;
   1) echo "Leaving configuration file in place."
    ;;
esac
exit 0;
