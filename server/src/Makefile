#****************************************************************
#* Copyright (c) Neptunium Pvt Ltd., 2014.
#* Author: Neptunium Pvt Ltd..
#*
#* This unpublished material is proprietary to Neptunium Pvt Ltd..
#* All rights reserved. The methods and techniques described herein 
#* are considered trade secrets and/or confidential. Reproduction or 
#* distribution, in whole or in part, is forbidden except by express 
#*written permission of Neptunium.
#****************************************************************/

CC=clang++
LD=clang++
#CC=clang++ -fsanitize=address -fno-omit-frame-pointer -fsanitize=thread
#LD=clang++ -fsanitize=address -fsanitize=thread
LIBAKORP=libakorp.so
CFLAGS= -c -Wall -O2 -g -std=c++0x -pthread -Wwrite-strings -DLUA_COMPAT_MODULE -Wattributes -DBOOST_ALL_DYN_LINK -D_WEBSOCKETPP_CPP11_STL_ -DWSPP_CPP11_ENABLED -DAKORP_SSL_CAPABLE -Wunused-function -DLIMITED -DHTTP_TUNNEL_SUPPORT
OBJ= obj
LDFLAGS= 
MV=mv
BUILD_DATE=
COMPILER_OPTIONS=
LINKER_OPTIONS=
STRIP=strip
#CFLAGS_SANITIZE= -fsanitize=address -fno-omit-frame-pointer 
#LDFLAGS_SANITIZE= -fsanitize=address

#Makefile to compile all the akorp daemons
LIBS= -L/usr/local/lib \
   		-L../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/sharedclient \
   		-L../../3party/mongo-cxx-driver-v2.4/ \
   		-L../../3party/snappy-1.1.2/.libs/ \
   		-L../../3party/leveldb-1.15.0/ \
		-L/usr/lib \
		-lstdc++ \
		-lpthread \
		-llua5.1  \
		-lrt  \
		-lsnappy\
		-lleveldb\
		-lmongoclient  \
		-lboost_program_options\
		-lboost_log\
		-lboost_log_setup\
		-lboost_date_time \
		-lboost_thread  \
        -lboost_exception \
		-lboost_filesystem  \
		-lboost_system \
		-lboost_regex \
		-lboost_random\
		-lssl \
		-lhtmlcxx\
		-lcrypto \
        -lcurl\
        -lgd\
		-lc

INCLUDES= -I/usr/local/include/mongo  \
			-I../../3party/dtl-1.18/ \
            -I../../3party/snappy-1.1.2/ \
            -I../../3party/leveldb-1.15.0/ \
   			-I../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/ \
   			-I../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/src/mongo \
   			-I../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/src/ \
			-I../../3party/mongo-cxx-driver-v2.4/ \
			-I../../3party/mongo-cxx-driver-v2.4/src/mongo/ \
			-I../../3party/mongo-cxx-driver-v2.4/src/ \
			-I/usr/local/include/boost  \
			-I/usr/local/include  \
			-I../../3party/libjson/ \
			-I../../3party/libjson/Source  \
			-I../../3party/libjson/Dependencies \
			-I/usr/include/lua5.1  \
			-I/usr/include/python2.7 \
			-I../../3party/  \
        	-I../../3party/websocketpp/\
            -I../../3party/websocketpp/src\
            -I../../3party/websocketpp/websocketpp

#any common sources needed by the daemons 
LIB_SOURCES= common.cc \
        log.cc\
		reactor.cc \
		tpool.cc \
		svclib.cc \
		ocache.cc \
		config.cc 

COMMON_OBJS= $(OBJ)/common.o \
		$(OBJ)/reactor.o \
		$(OBJ)/tpool.o \
		$(OBJ)/svclib.o \
		$(OBJ)/log.o \
		$(OBJ)/ocache.o \
		$(OBJ)/config.o

JSON_LIB_SOURCES= ../../3party/libjson/Source/internalJSONNode.cpp  \
		../../3party/libjson/Source/JSONAllocator.cpp \
		../../3party/libjson/Source/JSONChildren.cpp  \
		../../3party/libjson/Source/JSONDebug.cpp  \
		../../3party/libjson/Source/JSONIterators.cpp  \
		../../3party/libjson/Source/JSONMemory.cpp \
		../../3party/libjson/Source/JSONNode_Mutex.cpp  \
		../../3party/libjson/Source/JSONNode.cpp  \
		../../3party/libjson/Source/JSONPreparse.cpp  \
		../../3party/libjson/Source/JSONStream.cpp  \
		../../3party/libjson/Source/JSONValidator.cpp  \
		../../3party/libjson/Source/JSONWorker.cpp  \
		../../3party/libjson/Source/JSONWriter.cpp \
		../../3party/libjson/Source/libjson.cpp

JSON_LIB_OBJ= $(OBJ)/internalJSONNode.o  \
		$(OBJ)/JSONAllocator.o \
		$(OBJ)/JSONChildren.o  \
		$(OBJ)/JSONDebug.o  \
		$(OBJ)/JSONIterators.o  \
		$(OBJ)/JSONMemory.o \
		$(OBJ)/JSONNode_Mutex.o  \
		$(OBJ)/JSONNode.o  \
		$(OBJ)/JSONPreparse.o  \
		$(OBJ)/JSONStream.o  \
		$(OBJ)/JSONValidator.o  \
		$(OBJ)/JSONWorker.o  \
		$(OBJ)/JSONWriter.o \
		$(OBJ)/libjson.o

akorp_stuff: akorp_lib akorp_fmgr akorp_ngw luabridge luacal akorp_simple clntsim clientmodule fattr akorp_broadway_tunneld

3rdparty: mongo_cpp_driver luamongo lualdap lua-gd jq  jemalloc broadwayd snappy leveldb

all: 3rdparty akorp_stuff 

prod: all

mongo_cpp_driver:
	#scons -C ../../3party/mongo-cxx-driver-v2.4/ -f ../../3party/mongo-cxx-driver-v2.4/SConstruct --config=force
	scons -C ../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/ -f ../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/SConstruct --config=force --use-system-boost --disable-warnings-as-errors --sharedclient

luamongo: mongo_cpp_driver
	make -C ../../3party/luamongo-master/ -f ../../3party/luamongo-master/Makefile

lualdap:
	make -C ../../3party/lualdap-1.1.0/ -f ../../3party/lualdap-1.1.0/Makefile

lua-gd:
	make -C ../../3party/lua-gd/ -f ../../3party/lua-gd/Makefile 
jq:
	echo -e "Building jq needs autoreconf and configure every time.";
	cd ../../3party/jq-1.3/; ./configure; cd -;
	make -C ../../3party/jq-1.3/ -f ../../3party/jq-1.3/Makefile 

jemalloc:
	echo -e "Building jemalloc needs autoreconf and configure every time.";
	cd ../../3party/jemalloc-3.4.1/; autoreconf;./configure; cd -;
	make -C ../../3party/jemalloc-3.4.1/ -f ../../3party/jemalloc-3.4.1/Makefile 

broadwayd:
	make -C ../../3party/gtk+-3.12.1/ -f ../../3party/gtk+-3.12.1/Makefile 

snappy:
	cd ../../3party/snappy-1.1.2; ./configure ; 
	make -C ../../3party/snappy-1.1.2/ -f ../../3party/snappy-1.1.2/Makefile  

leveldb:
	cd ../../3party/leveldb-1.15.0;
	make -C ../../3party/leveldb-1.15.0/ -f ../../3party/leveldb-1.15.0/Makefile  

akorp_lib: $(LIB_SOURCES) $(JSON_LIB_SOURCES)
		mkdir -p $(OBJ)/
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) -fPIC -shared -pedantic $(INCLUDES) $(LIB_SOURCES) $(JSON_LIB_SOURCES)
		$(MV) *.o $(OBJ)
		$(LD) $(LDFLAGS) -rdynamic -shared $(COMMON_OBJS) $(JSON_LIB_OBJ) -o $(OBJ)/$(LIBAKORP)

luabridge: luabridge.cc
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) -fPIC -rdynamic $(INCLUDES) luabridge.cc
		$(MV) luabridge.o $(OBJ)/
		$(LD) $(LDFLAGS) -rdynamic -shared $(OBJ)/luabridge.o -L$(OBJ)/ $(LIBS) -lakorp -o $(OBJ)/luabridge.so

luacal: luacal.cc
		$(CC) $(CFLAGS)  $(CFLAGS_SANITIZE) -fPIC -rdynamic $(INCLUDES) luacal.cc
		$(MV) luacal.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE) -rdynamic -shared $(OBJ)/luacal.o -L$(OBJ)/ $(LIBS) -lakorp -o $(OBJ)/luacal.so

pythbridge: pythbridge.cc
		$(CC) $(CFLAGS) -fPIC -rdynamic $(INCLUDES) pythbridge.cc
		$(MV) pythbridge.o  $(OBJ)/
		$(LD) $(LDFLAGS) -rdynamic -shared $(OBJ)/pythbridge.o  $(LIBS) -L$(OBJ)/ -lakorp -o $(OBJ)/pythbridge.so

akorp_fmgr: nfmgr.cc mime_types.cc
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE)  $(INCLUDES) mime_types.cc nfmgr.cc
		$(MV) mime_types.o nfmgr.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE) $(OBJ)/nfmgr.o $(OBJ)/mime_types.o  $(LIBS) -L$(OBJ)/ -lakorp -o $(OBJ)/akorp_fmgr

akorp_broadway_tunneld: broadway_tunnel.cc
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) $(INCLUDES) broadway_tunnel.cc
		$(MV) broadway_tunnel.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE) $(OBJ)/broadway_tunnel.o  $(LIBS) -L$(OBJ)/ -lakorp -o $(OBJ)/akorp_broadway_tunneld

akorp_ngw: ngw.cc
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) $(INCLUDES) ngw.cc
		$(MV) ngw.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE) $(OBJ)/ngw.o $(LIBS)  -L$(OBJ)/ -lakorp -o $(OBJ)/akorp_ngw

akorp_simple: simple.cc simple.hh
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE)  $(INCLUDES) simple.cc
		$(MV) simple.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE) $(OBJ)/simple.o $(LIBS)  -L$(OBJ)/ -lakorp -o $(OBJ)/simple

clntsim: clntsim.cc clntsim.hh
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) $(INCLUDES) clntsim.cc clntsim.hh
		$(MV) clntsim.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE) $(OBJ)/clntsim.o $(LIBS)  -L$(OBJ)/ -lakorp -o $(OBJ)/clntsim

clientmodule: clientmodule.cc clientmodule.hh
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) -fPIC -rdynamic $(INCLUDES) clientmodule.cc
		$(MV) clientmodule.o $(OBJ)/
		$(LD) $(LDFLAGS)  $(LDFLAGS_SANITIZE) -rdynamic -shared $(OBJ)/clientmodule.o $(LIBS) -L$(OBJ)/ -lakorp -o $(OBJ)/clientmodule.so

fattr: fattr.cc
		$(CC) $(CFLAGS) $(CFLAGS_SANITIZE) $(INCLUDES) fattr.cc nfmgr.hh
		$(MV) fattr.o $(OBJ)/
		$(LD) $(LDFLAGS) $(LDFLAGS_SANITIZE)  $(OBJ)/fattr.o $(LIBS)  -L$(OBJ)/ -lakorp -o $(OBJ)/fattr


clean:
	#scons -C ../../3party/mongo-cxx-driver-v2.4/ -f ../../3party/mongo-cxx-driver-v2.4/SConstruct -c
	scons -C ../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/ -f ../../3party/mongo-cxx-driver-legacy-0.0-26compat-2.6.11/SConstruct -c --use-system-boost --disable-warnings-as-errors 
	make -C ../../3party/luamongo-master/ -f ../../3party/luamongo-master/Makefile clean;
	rm -rf $(OBJ)
	rm -rf *.o *.so *.a
	make -C ../../3party/jq-1.3/ -f ../../3party/jq-1.3/Makefile clean;
	make -C ../../3party/lualdap-1.1.0/ -f ../../3party/lualdap-1.1.0/Makefile clean;
	make -C ../../3party/gtk+-3.12.1/ -f ../../3party/gtk+-3.12.1/Makefile clean;
	make -C ../../3party/lua-gd/ -f ../../3party/lua-gd/Makefile  clean;
	make -C ../../3party/jemalloc-3.4.1/ -f ../../3party/jemalloc-3.4.1/Makefile clean;
	make -C ../../3party/snappy-1.1.2/ -f ../../3party/snappy-1.1.2/Makefile  clean;
	make -C ../../3party/leveldb-1.15.0/ -f ../../3party/leveldb-1.15.0/Makefile  clean;
