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
local json = require ('cjson')
require ('akorp_utils')
require ('akorp_common')
local lb = require ('luabridge')
require ('posix')
require ('lualdap')
require ('base64')

local db = assert(mongo.Connection.New())
mongo_server_addr = lb.getstrconfig("system.mongo_server_address");
assert(mongo_server_address);
assert(db:connect(mongo_server_address))
for i = 1,100, 1 do
	local user, err = db:find_one("akorpdb.users", {uid = i});
	if user then
		print("+----------------------------------------+");
		if not user.dept then
			print(string.format("dept missing for user: %s", user.uname));
			user.dept = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.dob then
			print(string.format("dob missing for user: %s", user.uname));
			user.dob = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.email then
			print(string.format("email missing for user: %s", user.uname));
			user.email = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.first_name then
			print(string.format("first_name missing for user: %s", user.uname));
			user.first_name = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.middle_name then
			print(string.format("middle_name missing for user: %s", user.uname));
			user.middle_name = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.last_name then
			print(string.format("last_name missing for user: %s", user.uname));
			user.last_name = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.homeaddress then
			print(string.format("homeaddress missing for user: %s", user.uname));
			user.homeaddress = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.mob then
			print(string.format("mob missing for user: %s", user.uname));
			user.mob = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.organization then
			print(string.format("organization missing for user: %s", user.uname));
			user.organization = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.sex then
			print(string.format("sex missing for user: %s", user.uname));
			user.sex = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
		if not user.jobtitle then
			print(string.format("job title missing for user: %s", user.uname));
			user.jobtitle = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
		end
        if not user.stream_updates then 
			print(string.format("stream updates missing for user: %s", user.uname));
			user.stream_updates = {};
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
        end
        if not user.bookmarks then
			print(string.format("stream updates missing for user: %s", user.uname));
			user.bookmarks = {};
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
        end
        if not user.bookmarks then
			print(string.format("bookmark list missing for user: %s", user.uname));
			user.bookmarks = {};
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
        end
        if not user.salt then
			print(string.format("salt is missing for user: %s", user.uname));
			user.salt = 0;
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
        end
        if not user.auth_token then
			print(string.format("auth_token is missing for user: %s", user.uname));
			user.auth_token = "";
			local ok, e = db:update("akorpdb.users", { uid = user.uid }, user);
			if not ok then
				print("update failed");
			end
        end
	else
		print(string.format("\ndb:find_one for user:%d failed",i));
	end
end

for i = 1000,1001, 1 do
	local group, err = db:find_one("akorpdb.groups", {gid = i});
	if group then
		print("+----------------------------------------+");
		if not group.homedir or group.homedir == "" then
			print(string.format("homedir missing for group: %s", group.gname));
			group.homedir = group_home_base_path .. group.gname;
			local ok, e = db:update("akorpdb.groups", { gid = group.gid }, group);
			if not ok then
				print("update failed");
			end
		end
		if not group.categories then
			print(string.format("categories missing for group: %s", group.gname));
            group.categories = {};
			local ok, e = db:update("akorpdb.groups", { gid = group.gid }, group);
			if not ok then
				print("update failed");
			end
		end
	else
		print(string.format("\ndb:find_one for group:%d failed", i));
	end
end
