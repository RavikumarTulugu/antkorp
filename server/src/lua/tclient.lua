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
Test client 
Send requests to the server and handle responses. 
All the code is written in lua.
This file will be run by the sequencer.
]]

--[[
generic response handler called from the sequencer. 
this in turn will call the callback set by the send 
routine.
]]

package.cpath = package.cpath .. ";../obj/?.so";
tc = require "testclient"

function
response_handler(response)
print("response recvd");
return;
end


function 
error_handler(emsg)
print("error recvd");
return;
end

function 
timeout_handler()
print("There is a timeout");
return;
end

function 
event_handler()
print("event recvd");
return;
end

--[[
call in to the server with the given request.
]]
function
call_server(svcname, request, response_handler, error_handler, event_handler, timeout_handler)
return;
end


--[[
main routine of test client. 
add your test cases here.
]]
function
test_client_main(arg)
if arg[1] == nil then
    print("usage: testclient.lua <server_ipaddress>");
    return;
end
print(string.format("Using server address: %s", arg[1]));
return;
end

test_client_main(arg);
