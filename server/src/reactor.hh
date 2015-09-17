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

#ifndef __INC_REACTOR_H__
#define __INC_REACTOR_H__

#include <map>
#include <vector>
#include <list>
#include <functional>
#include <sys/select.h>
#include <mutex>

//A Reactor is a simple light weight wrapper on top of the select call. 
class Reactor;
using namespace std;
class Reactor
{
	fd_set _readFdSet;
	fd_set _writeFdSet;
	fd_set _exceptFdSet;
	volatile bool stopped;

	int max; //max recalculated on every new fd add.
    std::mutex _reactorMutex; //mutex to the reactor
    std::mutex _handlerMutex; //mutex to the handler

	unsigned int _timeout;  //timeout in milliseconds.
	std::map<int, std::function<void(Reactor*, int)>> _readCbTable;
	std::map<int, std::function<void(Reactor*, int)>> _writeCbTable;
	std::map<int, std::function<void(Reactor*, int)>> _exceptCbTable;
	std::vector<int> masterFdList;
    void _run(bool once);

	public:
	Reactor();
	~Reactor();
	void run(); //run the Reactor, blocking call.
    void dispatch(void); //run the reactor once with out blocking.

	void addReadFd(int, std::function<void(Reactor*, int)> readReadyHandler);
	void addWriteFd(int, std::function<void(Reactor*, int)> writeReadyHandler);
	void addExceptFd(int, std::function<void(Reactor*, int)> exceptReadyHandler);

	void remReadFd(int);
	void remWriteFd(int);
	void remExceptFd(int);
	void setTimeout(unsigned int); //set the timeout of the reactor, default is 1sec.
	void stop(void); //stop the Reactor.
};

#endif
