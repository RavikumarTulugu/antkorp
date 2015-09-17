#!/usr/bin/env lua5.1
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

require ('os')
require ('mongo')
require ('json')
require ('posix')
require ('lualdap')
require ('base64')
require ('akorp_utils')
require ('akorp_common')
require ('config')
package.cpath = "../obj/?.so"
require ('luamodule') 
local stp = require ('stack_trace_plus');
debug.traceback = stp.stacktrace;

local db = assert(mongo.Connection.New())
assert(db:connect('localhost'))

--Create the akorp database in the mongodb 

--Create the akorp db meta object
db:insert(akorp_meta_ns, { uid= 1020 , gid = 1000 });
--Create the group collection 
local group = group_object.new();
group.gname = "akorp";
group.gid 	= 1000;
group.homedir = group_home_base_path .. gname;
db:insert(akorp_group_ns, group);

--Create the user collection 
local user = user_object.new();
user.uname = "akorp";
user.uid 	= 1020;
user.gid 	= 1000;
db:insert(akorp_user_ns, user);

--Create the kons collection 
db:insert(akorp_kons_ns, {});

--Create the docs collection 
db:insert(akorp_doc_ns, {});

--create the notification collection. 
db:insert(akorp_notif_ns, {});

--create the notification collection. 
db:insert(akorp_im_ns, {});

