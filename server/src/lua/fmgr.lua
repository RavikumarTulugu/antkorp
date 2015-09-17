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
This file contains the ancillary fmgr support code to interact with the mongodb.
things like adding kons and relaying notifications. all which is too complex to 
write in C++ and easy to write in lua. 
]]
require ('mongo')
--require ('config');
require ('akorp_utils');
require ('akorp_common');
require ('luabridge');
local stp = require ('stack_trace_plus');
debug.traceback = stp.stacktrace;

signature  = " akorp_fmgr: ";
clientid   = 0; 
svcname    = "fmgr";

--[[
read the configuration and populate the variables. 
]]
function
readconfig()
mongo_server_addr = luabridge.getstrconfig("system.mongo_server_address");
log_file = luabridge.getstrconfig("fmgr.log_file");
debug_level = luabridge.getstrconfig("fmgr.debug_level");
return;
end

function 
file_manager_notification(notifier, group, category, notiftype, oid, recievers, description, preview)
info("sending file manager notification");
return send_notification(notifier, group, category, notiftype, oid, recievers, description, preview);
end

function 
log_file_activity(uid, gid, file, activity)
info("logging activity of file", file, activity);
local ao = activity_object.new();
if ao then
    ao.uid = uid; 
    ao.gid = gid; 
    ao.id  = file; 
    ao.activity = activity;
    ao.activity_type = "file";
    ao:insert();
else
    error("unable to allocate a new activity object:");
end
return;
end

function
add_user_as_tracker(uid, kons)
if not item_present(kons.trackers, uid) then
    table.insert(kons.trackers, uid);
    kons:update();
end
for i,child in ipairs(kons.children) do
    local ckons = getkonvobj(child);
    if ckons then
        add_user_as_tracker(uid, ckons);
    else
        error_to_client(clientid, channelid, "There was some error performing operation, pls retry");
        error("failed to retrieve the children kons from the database.");
    end
end
return;
end

function
addfollowertokonsattached2file(uid, konsid)
info("adding follower to the attached kons object and its hierarchy");
local kons = getkonvobj(konsid);
if kons then
    add_user_as_tracker(uid, kons);
else
    error("Unable to find the attached kons object for the file");
end
return;
end

function 
remove_user_as_tracker(uid, kons)
for i,child in ipairs(kons.children) do
    local ckons = getkonvobj(child); -- Pls note that these are ids and not actual objects.
    if ckons then
        remove_user_as_tracker(uid, ckons);
        if item_present(ckons.trackers, uid) then
            remove_item(ckons.trackers, uid);
            ckons:update();
        end
    else
        error_to_client(clientid, channelid, "There was some error performing operation, pls retry");
        error("failed to retrieve the children kons from the database.");
    end
end
return;
end

function
remfollowerfromkonsattached2file(uid, konsid)
info("removing follower from the attached kons object and its hierarchy");
local kons = getkonvobj(konsid);
if kons then
    remove_user_as_tracker(uid, kons);
else
    error("Unable to find the attached kons object for the file");
end
return;
end

function
del_children_dfs(kons)
for i,child in ipairs(kons.children) do
    local ckons = getkonvobj(child);
    if ckons then
        del_children_dfs(ckons);
        local ok, err = db:remove(akorp_kons_ns(), {id = ckons.id});
        if not ok and err then
            error(string.format("db:remove failed with err=%s", err));
            return;
        end
        --delete all the notifications related to this konv.
        local querystr = "{".. "\"".."category".."\""..":".."\"".."file".."\""..",".."\"".."kons".."\""..":".."\""..ckons.id.."\"".."}";
        ok, err = db:remove(akorp_notif_ns(), querystr);
        if not ok and err then
            error("Unable to delete the notifications for the deleted konv object.");
        end
    else
        error("failed to retrieve the children kons from the database.");
    end
end
kons.children = {};
return;
end

--[[
Take as much time as possible we are running in a worker.
get the konversation object from the database with the attached_object as the 
fname and delete the object and all its children recursively.
Delete any notifications generated for this file.
Delete any activity object for this file.
]]
function
cleanupDbForFile(fname)
local querystr = "{".. "\"".."category".."\""..":".."\"".."file".."\""..",".."\"".."attached_object".."\""..":".."\""..fname.."\"".."}";
info(querystr);
local kons, err = db:find_one(akorp_kons_ns(), querystr);
if kons then
    del_children_dfs(kons); -- delete children
    querystr = "{".. "\"".."category".."\""..":".."\"".."kons".."\""..",".."\"".."kons".."\""..":".."\""..kons.id.."\"".."}";
    ok, err = db:remove(akorp_notif_ns(), querystr);
    if not ok and err then
        error(string.format("Unable to delete the notifications for the deleted konv object err: %s", err));
    end
    konv_object_delete(kons.id); -- delete self
end
querystr = "{" .. "\"" .. "category" .. "\"" .. " : " .. "\"" .. "file" .. "\"" .. "," .. "file :" .. "\"" .. fname .. "\"" .. "}";
info(querystr);
ok, err = db:remove(akorp_notif_ns(), querystr);
if not ok and err then
    error(string.format("Unable to delete the notifications for the file object err: %s", err));
end
querystr = "{" .. "id" .. ":" .. "/" .. luabridge.sanitizepath(fname) .. "/".. "}";
info(querystr);
ok, err = db:remove(akorp_activity_ns(), querystr);
if not ok and err then
    error(string.format("Unable to delete the activity object for the file err: %s", err));
end
return;
end

readconfig();
db = assert(mongo.Connection.New())
assert(db:connect(mongo_server_addr))
info("connected to mongodb");
