#!/bin/bash
unset LUA_PATH 
unset LUA_CPATH 
unset LD_LIBRARY_PATH 
unset SAL_USE_VCLPLUGIN
unset BROADWAY_DISPLAY
unset GDK_BACKEND
export LUA_PATH="/opt/antkorp/foreign/lua/5.1/?.lua;/opt/antkorp/custom/lua/?.lua;/usr/local/share/lua/5.1/?.lua"
export LUA_CPATH="/opt/antkorp/custom/lib/?.so;/opt/antkorp/foreign/lib/?.so;/usr/lib/lua/5.1/?.so;/usr/local/lib/lua/5.1/?.so;/opt/antkorp/foreign/lib/lua/5.1/?.so"
export LD_LIBRARY_PATH="/opt/antkorp/custom/lib/:/opt/antkorp/foreign/lib/:/usr/local/lib"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/opt/antkorp/foreign/bin/:/opt/antkorp/custom/bin:/opt/antkorp/foreign/lua/:/opt/antkorp/custom/lua"
export SAL_USE_VCLPLUGIN=gtk3
export GDK_BACKEND=broadway
export BROADWAY_DISPLAY=:1
export ANTKORP_DEBUG="false"
