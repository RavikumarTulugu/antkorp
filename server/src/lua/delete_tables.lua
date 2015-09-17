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
require ('config')
require ('akorp_utils')
require ('akorp_common')
local lb = require ('luabridge') 
local stp = require ('stack_trace_plus');
debug.traceback = stp.stacktrace;

local db = assert(mongo.Connection.New())
mongo_server_addr = lb.getstrconfig("system.mongo_server_address");
assert(mongo_server_address);
assert(db:connect(mongo_server_address))
--delete the akorp database in the mongodb 
--delete the akorp db meta object 
db:drop_collection(akorp_meta_ns());
--delete the user collection 
db:drop_collection(akorp_user_ns());
--delete the group collection 
db:drop_collection(akorp_group_ns());
--delete the kons collection 
db:drop_collection(akorp_kons_ns());
--delete the docs collection 
db:drop_collection(akorp_doc_ns());
--delete the notification collection 
db:drop_collection(akorp_notif_ns());
--delete the events collection
db:drop_collection(akorp_events_ns());
--delete the activity 
db:drop_collection(akorp_activity_ns());
--delete the instant messages collection
db:drop_collection(akorp_im_ns());
--delete the instant messages collection
db:drop_collection(akorp_org_ns());
--delete the requests collection
db:drop_collection(akorp_request_ns());
