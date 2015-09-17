--[[
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
]]

--[[
This file contains all the configuration variables for the antkorp 
lua code. 
]] 
--[[
XXX: Place only config variables which are used across all lua modules. 
]]
admin_bind_dn     = "cn=Directory Manager";
admin_pass        = '!R*975:k';
ldap_server       = 'helen:6513';
common_ldap_user_path  = "ou=akorp,dc=neptm,dc=net"; --append this to user name as "uid=username"
common_ldap_group_path = "ou=akorp,dc=neptm,dc=net"; --append this to user name as "uid=username"
ldap_user_object_class = {"top","person","organizationalPerson","inetorgperson","posixAccount"};
ldap_group_object_class = {"top","groupofuniquenames","posixgroup"};
user_home_base_path  = "/akorp/homes/users/";
group_home_base_path = "/akorp/homes/groups/";
akorp_auth_log    = "auth.log";
mongo_server_addr = "localhost";
akorp_meta_ns 	  = "akorpdb.meta"; 
akorp_doc_ns 	  = "akorpdb.docs"; 
akorp_group_ns 	  = "akorpdb.groups";
akorp_user_ns     = "akorpdb.users"; 
akorp_kons_ns     = "akorpdb.kons";
akorp_kons_log    = "kons.log";
akorp_rtc_log     =  "rtc.log";
akorp_simple_log  =  "simple.log";
akorp_notif_ns    = "akorpdb.notif";
akorp_im_ns       = "akorpdb.im";
akorp_events_ns   = "akorpdb.events";
akorp_request_ns  = "akorpdb.requests";
akorp_org_ns      = "akorpdb.orgs";
