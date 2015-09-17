
CC=clang++
CFLAGS= -c -Wall -g -std=c++0x -pthread -Wwrite-strings
OBJ= obj
LD=clang++
MV=mv

#Makefile to compile all the akorp daemons
LIBS= -L/usr/local/lib \
      		-L../../3party/mongo-cxx-driver-v2.4/ \
		-L/usr/lib \
		-L../../server/src/obj \
		-L/lib/x86_64-linux-gnu/ \
		-lakorp \
		-lmongoclient \
        -lboost_log\
        -lboost_date_time \
        -lboost_thread  \
		-lpthread \
        -lboost_filesystem  \
        -lboost_system \
        -lboost_regex \
		-lstdc++ \
		-lc

INCLUDES= -I/usr/local/include/boost  \
			-I../../3party/mongo-cxx-driver-v2.4/ \
			-I../../3party/mongo-cxx-driver-v2.4/src/mongo/ \
			-I../../3party/mongo-cxx-driver-v2.4/src/ \
        -I/usr/local/include/mongo  \
		-I/usr/local/include  \
		-I../../server/src/ \
		-I. \
		-I../../3party/libjson

all:  reversi

reversi:
	mkdir -p $(OBJ)
	$(CC) $(CFLAGS) $(INCLUDES) board.cc game.cc player.cc 
	$(LD) *.o  $(LIBS) -o $(OBJ)/reversi
	rm -rf *.o *.so *.a

clean:
	rm -rf *.o $(OBJ)
