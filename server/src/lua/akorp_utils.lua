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
require ('posix')
local lb = require "luabridge";

--XXX: common definitions are values used by all the lua code 
-- these values should match the ones in the c and C++ values 
--constants to be used to indicate the severity of syslog
--copied directly from syslog.h 
LOG_TRACE = 0;
LOG_DEBUG  = 1;  --/* debug-level messages */
LOG_INFO   = 2;  --/* informational */
LOG_WARNING = 3;  --/* warning conditions */
LOG_ERROR  = 4;  --/* error conditions */
LOG_FATAL = 5;  --/* action must be taken immediately */

--control message enumerations
CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL = 1;
CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE = 2;
CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT = 3;
CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_ADD = 4;
CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_DELETE = 5;

signature = "not_set";
function openlog(sign, logfile)
    signature = sign;
    lb.openlog(logfile);
    return logger;
end

-- logging routines.
function trace(...)
    local output = "";
    for i,v in ipairs(arg) do  output = output .. tostring(v) .. " "; end
    lb.trace(signature .. output);
    return 
end

function info(...)
    local output = "";
    for i,v in ipairs(arg) do  output = output .. tostring(v) .. " "; end
    lb.info(signature .. output);
    return 
end

function error(...)   
    local output = "";
    for i,v in ipairs(arg) do  output = output .. tostring(v) .. " "; end
    lb.error(signature .. output); 
    return 
end

function warn(...)  
    local output = "";
    for i,v in ipairs(arg) do  output = output .. tostring(v) .. " "; end
    lb.warn(signature .. output);
    return 
end

function dbug(...) 
    local output = "";
    for i,v in ipairs(arg) do  output = output .. tostring(v) .. " "; end
    lb.debug(signature .. output);
    return 
end

--deep copy of the list return a new copy of the list 
function listcopy(object)
    local lookup_table = {} 
    local function _copy(object)
        if type(object) ~= "table" then 
            return object
        elseif lookup_table[object] then 
            return lookup_table[object]
        end  
        local new_table = {} 
        lookup_table[object] = new_table
        for index, value in pairs(object) do
            new_table[_copy(index)] = _copy(value)
        end  
        return setmetatable(new_table, getmetatable(object))
    end  
    return _copy(object)
end

--[[ 
remove an item from the list if the item is there in the list. 
]]
function remove_item(list, item)
for i in ipairs(list) 
do
    if list[i] == item then
        table.remove(list, i);
        return;
    end
end
end

--[[
Check if the item is already present in the list. 
]]
function item_present(list, item)
for i in ipairs(list)
do
    if list[i] == item then
        return true;
    end
end
return false;
end

--[[
--make a set out of list 
--Usage of above set function 
look up items in the set like below 
local items = Set { "apple", "orange", "pear", "banana" }
if items["orange"] then
  -- do something
end

--iterate over items in the set as below 
local items = { "apple", "orange", "pear", "banana" }
for _,v in pairs(items) do
  if v == "orange" then
    -- do something
    return
  end
end
]]
function Set (list)
  local set = {}
  for _, l in ipairs(list) do set[l] = true end
  return set
end

--[[
below code shamelessly lifted from lua kepler project. 
]] 
function assert2 (expected, value, msg)
    if not msg then
        msg = ''
    else
        msg = tostring(msg)..'\n'
    end
    local ret = assert (value == expected,
        msg.."wrong value (["..tostring(value).."] instead of "..
        tostring(expected)..")")
    io.write('.')
    return ret
end

function check_future (ret, method, ...)
    local ok, f = pcall (method, unpack (arg))
    assert (ok, f)
    assert2 ("function", type(f))
    assert2 (ret, f())
    io.write('.')
end


--[[
build a mongo array which contains strings in the list given.
]]
function 
mongo_array_of_strings(stringlist)
mongostr = "[";
for i=1,#stringlist
do
    if i ~= 1 then
        mongostr = mongostr .. ","; 
    end
mongostr = mongostr .. "\"".. stringlist[i] .. "\""; 
end
mongostr = mongostr .. "]";
return mongostr;
end

--[[
build a mongo array which contains strings in the list given.
]]
function 
mongo_array_of_numbers(numberlist)
mongostr = "[";
for i=1,#numberlist
do
    if i ~= 1 then
        mongostr = mongostr .. ","; 
    end
mongostr = mongostr .. numberlist[i]; 
end
mongostr = mongostr .. "]";
return mongostr;
end

--[[
return the exact string if it doesnot contain trailing slash.
]]
function
trimtrailingslash(input)
--[[indexing facility for the strings to compare. ]]
getmetatable('').__index = function(str,i) return string.sub(str,i,i) end 
if input[string.len(input)] == '/' then
    return string.sub(input, 1, string.len(input) -1);
end
return input;
end
