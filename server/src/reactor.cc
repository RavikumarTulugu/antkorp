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

#include <sys/types.h> 
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include "akorpdefs.h"
#include "common.hh"
#include "reactor.hh"
#include "log.hh"

Reactor::Reactor()
	:
		max(0),
		_timeout(1000),
		stopped(false)
{
	FD_ZERO(&_readFdSet);
	FD_ZERO(&_writeFdSet);
	FD_ZERO(&_exceptFdSet);
	return;
}

Reactor::~Reactor()
{
	stop();
	return;
}

void
Reactor::_run(bool once) //run the Reactor, blocking call.
{
    std::vector<std::pair<int, std::function<void(Reactor*, int)>>> readable, writable, exceptable;
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
    assert(max); //run cannot be called with out any fds.
    do{
        struct timeval tv = {0, _timeout = (once) ? 0 : _timeout };
        fd_set _readWorkingFdSet, _writeWorkingFdSet, _exceptWorkingFdSet;

        FD_ZERO(&_readWorkingFdSet);
        FD_ZERO(&_writeWorkingFdSet);
        FD_ZERO(&_exceptWorkingFdSet);

        memcpy(&_readWorkingFdSet, &_readFdSet, sizeof(fd_set));
        memcpy(&_writeWorkingFdSet, &_writeFdSet, sizeof(fd_set));
        memcpy(&_exceptWorkingFdSet, &_exceptFdSet, sizeof(fd_set));

        int rc = select(max+1,
                &_readWorkingFdSet,
                &_writeWorkingFdSet,
                &_exceptWorkingFdSet,
                &tv);
        if(rc <= 0 ){
            if (rc == 0){
                if(once) 
                    break; //There is a timeout go back to start.
                else 
                    continue;
            }else{
                perror("select() failed:");
            }
        }
        for(int& it : masterFdList){
            if(FD_ISSET(it, &_readWorkingFdSet)) readable.push_back(std::make_pair(it, _readCbTable[it]));
            if(FD_ISSET(it, &_writeWorkingFdSet)) writable.push_back(std::make_pair(it, _writeCbTable[it]));
            if(FD_ISSET(it, &_exceptWorkingFdSet)) exceptable.push_back(std::make_pair(it, _exceptCbTable[it]));
        }

        //dispatch all the callbacks.
        for(auto it : readable){
            _reactorMutex.unlock();
            it.second(this, it.first);
            _reactorMutex.lock();
        }
        for(auto it : writable){
            _reactorMutex.unlock();
            it.second(this, it.first);
            _reactorMutex.lock();
        }
        for(auto it : exceptable){
            _reactorMutex.unlock();
            it.second(this, it.first);
            _reactorMutex.lock();
        }
    }while(!stopped && !once);
    return;
}

void
Reactor::run() //run the Reactor, blocking call.
{
    _run(false);
	return;
}

void 
Reactor::dispatch()
{
    _run(true);
    return;
}

void 
Reactor::addReadFd(int fd, std::function<void(Reactor*, int)> readReadyHandler)
{
	//recalculate max 
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	max = max < fd ? fd : max;
	FD_SET(fd, &_readFdSet);
	_readCbTable[fd] = readReadyHandler;
    masterFdList.push_back(fd);
	return;
}

void 
Reactor::addWriteFd(int fd, std::function<void(Reactor*, int)> writeReadyHandler)
{
	//recalculate max 
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	max = max < fd ? fd : max;
	FD_SET(fd, &_writeFdSet);
	_writeCbTable[fd] = writeReadyHandler;
    masterFdList.push_back(fd);
	return;
}

void 
Reactor::addExceptFd(int fd, std::function<void(Reactor*, int)> exceptReadyHandler)
{
	//recalculate max 
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	max = max < fd ? fd : max;
	FD_SET(fd, &_exceptFdSet);
	_exceptCbTable[fd] = exceptReadyHandler;
    masterFdList.push_back(fd);
	return;
}

void 
Reactor::remReadFd(int fd)
{
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	//recalculate max 
	max = max < fd ? fd : max;
	FD_CLR(fd, &_readFdSet);
	_readCbTable.erase(fd);
    masterFdList.erase(std::remove(masterFdList.begin(), masterFdList.end(), fd), masterFdList.end());
	return;
}

void 
Reactor::remWriteFd(int fd)
{
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	//recalculate max 
	max = max < fd ? fd : max;
	FD_CLR(fd, &_writeFdSet);
	_writeCbTable.erase(fd);
    masterFdList.erase(std::remove(masterFdList.begin(), masterFdList.end(), fd), masterFdList.end());
	return;
}

void 
Reactor::remExceptFd(int fd)
{
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	//recalculate max 
	max = max < fd ? fd : max;
	FD_CLR(fd, &_exceptFdSet);
	_exceptCbTable.erase(fd);
    masterFdList.erase(std::remove(masterFdList.begin(), masterFdList.end(), fd), masterFdList.end());
	return;
}

void
Reactor::setTimeout(unsigned int timeout)
{
    std::unique_lock<std::mutex> reactorLock(_reactorMutex);
	_timeout = timeout ? timeout : _timeout;
	return;
}

void
Reactor::stop(void)
{
	stopped = true;
	return;
}
