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

#include "akorpdefs.h"
#include "common.hh"
#include "log.hh"
#include <boost/bind.hpp>
#include <boost/system/error_code.hpp>
#include <boost/asio.hpp>
#include <sys/un.h>
#include <sys/file.h>
#include "svclib.hh"

service::service(std::string _svcname)
    :
   ep(AKORP_SVC_ENDPOINT),
   dataChannel(svc),
   controlChannel(svc),
   signalChannel(svc)
{
    try
    {
        bool allOk = false;
        name.assign(_svcname.c_str(), 
                (_svcname.length() <= MAX_SERVICE_NAME_LEN) ? 
                _svcname.length() : 
                MAX_SERVICE_NAME_LEN);
        //allocate memory for the data buffer. 
        data = new char [OPTIMAL_BUF_SIZE];
        //Try to open the message queue of gateway.
        gwMqFd = _except(::mq_open(AKORP_GW_MQ_NAME, O_WRONLY));
        SCOPE_EXIT{ if(!allOk) _eintr(::close(gwMqFd)); };
        _info<<"service::service() "<<_svcname
            <<" opened message queue: "<<AKORP_GW_MQ_NAME
            <<" to the network gateway.";
        //full name of the message queue.
        //open the message queue for the gateway to send control messages.
        struct mq_attr mattr = {0, 10, sizeof(controlMessage), 0};
        mqName = "/" + _svcname + ".mq";
        ::mq_unlink(mqName.c_str());
        mqFd = _except(::mq_open(mqName.c_str(), 
                    O_RDWR | O_CREAT | O_NONBLOCK, 
                    0660, 
                    &mattr));
        SCOPE_EXIT{ if(!allOk) ::mq_unlink(mqName.c_str()); };
        SCOPE_EXIT{ if(!allOk) _eintr(::close(mqFd)); };
        controlChannel.assign(mqFd);
        _info<<"service::service() "<<_svcname<<
            " created service message queue: "<<mqName;
        memset(controlFrame, 0, sizeof(controlMessage));
        controlChannel.async_read_some(boost::asio::null_buffers(),
                boost::bind(&service::readControlMessages,
                    this,
                    boost::asio::placeholders::error));
        //create a signalfd and register the handler for all the signals.
        //any signal arrives try to give it to the handler.
        sigemptyset(&mask);
        sigfillset(&mask); //except SIGKILL ofcourse
        _except(sigprocmask(SIG_BLOCK, &mask, NULL));
        sFd = _except(signalfd(-1, &mask, SFD_NONBLOCK | SFD_CLOEXEC));
        SCOPE_EXIT{ if(!allOk) _eintr(::close(sFd)); };
        signalChannel.assign(sFd);
        _info<<"service::service() "<<_svcname<<" opened signal channel.";
        signalChannel.async_read_some(boost::asio::null_buffers(), 
                boost::bind(&service::readSignal,
                    this,
                    boost::asio::placeholders::error));
        //write the service name to the gateway, pretty soon will add more
        //information.
        boost::asio::socket_base::debug option(true);
        dataChannel.connect(ep);
        _info<<"service::service() "<<_svcname<<
            " connected to the network gateway, opened data channel.";
        boost::asio::write(dataChannel, 
                boost::asio::buffer(_svcname.c_str(), 
                    _svcname.length()));
        _info<<"service::service() "<<_svcname<<
            " sent service tag to the network gateway.";
        readAsync();
        allOk = true;
        return;
    }
    catch(std::exception &e)
    {
        _error<<"exited with exception:"<<e.what();
        throw(e);
    }
    return; 
}

service::~service()
{
    _eintr(::close(sFd));
    _eintr(::close(mqFd));
    _eintr(::close(gwMqFd));
    _eintr(::mq_unlink(mqName.c_str()));
    if(data) delete data;
    return;
}

void
service::_sendSvcMessage(int clientid, 
        int channelid, 
        const char *wbuf, 
        size_t wbufSize)
{
	char svcHeader[sizeof(int32_t) + sizeof(int32_t) + MAX_SERVICE_NAME_LEN \
        + sizeof(int32_t)] = {' '};
	int32_t cnid = htonl(clientid);
    int rc = 0;
    int32_t _dataSize = htonl(wbufSize);
    int32_t chnid = htonl(channelid);

    try{
        memset(&svcHeader, 0, sizeof(svcHeader));
        memcpy(svcHeader, &cnid, sizeof(clientid)); //set the clientid
        memcpy(svcHeader + sizeof(clientid), &chnid, sizeof(channelid)); //set the svcname
        memcpy(svcHeader + sizeof(clientid) + sizeof(chnid), 
                name.c_str(), 
                name.length()); //set the svcname
        memcpy(svcHeader + sizeof(clientid) + sizeof(chnid) + MAX_SERVICE_NAME_LEN, 
                &_dataSize, 
                sizeof(int32_t)); //set the msglen
        boost::asio::write(dataChannel, 
                boost::asio::buffer(svcHeader, 
                    sizeof(svcHeader)));
        boost::asio::write(dataChannel, 
                boost::asio::buffer(wbuf, 
                    wbufSize));
    }
    catch(std::exception &e)
    {
        _error<<"service::_sendSvcMessage() caught exception:"<<e.what();
        throw(e);
    }
    return;
}

void 
service::readAsync()
{
    _info<<"service::readAsync() issued with : "<<bytes2Recv;
    if(newSvcMsg){
        dataChannel.async_receive(boost::asio::buffer(svcHeader, 
                    sizeof(svcHeader)),
                boost::bind(&service::readComplete,
                    this,
                    boost::asio::placeholders::error,
                    boost::asio::placeholders::bytes_transferred));
        return;
    }
    dataChannel.async_receive(boost::asio::buffer(data, bytes2Recv),
            boost::bind(&service::readComplete,
                this,
                boost::asio::placeholders::error,
                boost::asio::placeholders::bytes_transferred));
    return;
}

void 
service::readComplete(const boost::system::error_code& error, size_t bytesRecvd)
{
    if (!bytesRecvd){
        if(error){
            _error<<"service::readComplete() returned error:"<<error.message();
            THROW_ERRNO_EXCEPTION; //throw the exception so that run will return.
            return;
        }
        _error<<"service::readComplete() bytesRecvd: 0";
        THROW_ERRNO_EXCEPTION; //throw the exception so that run will return.
        return;
    }

    if(newSvcMsg){
        char *ptr = svcHeader;
        assert(bytesRecvd == sizeof(svcHeader));
        ptr = svcHeader;
        memcpy(&clientid, ptr, sizeof(clientid));
        clientid = ntohl(clientid);
        ptr += sizeof(clientid);

        memcpy(&channelid, ptr, sizeof(channelid));
        channelid = ntohl(channelid);
        ptr += sizeof(channelid);

        char svcname[MAX_SERVICE_NAME_LEN];
        memcpy(svcname, ptr, MAX_SERVICE_NAME_LEN);
        ptr += MAX_SERVICE_NAME_LEN;

        memcpy(&totalSvcMsgLen, ptr, sizeof(totalSvcMsgLen));
        ptr += sizeof(totalSvcMsgLen);
        totalSvcMsgLen = ntohl(totalSvcMsgLen);

        bytes2Recv = totalSvcMsgLen;
        //grow the buffer if needed.
        if(dataSize < totalSvcMsgLen){
            delete data;
            data = new char[totalSvcMsgLen];
            dataSize = totalSvcMsgLen;
        }
        newSvcMsg = false;
        _info<<"service::readComplete() new service message clientid: "<<clientid
            <<" channelid: " <<channelid
            <<" svcname: "<<svcname
            <<" svcmsglen: "<<totalSvcMsgLen; 
    }else{
        _info<<"service::readComplete() processing service fragment."; 
        totalSvcBytesRecvd += bytesRecvd;
        bytes2Recv = totalSvcMsgLen - totalSvcBytesRecvd;
        for(uint32_t i = 0; i < bytesRecvd; i++) 
            dataBuf.push_back(data[i]);
    }

    if(totalSvcBytesRecvd == totalSvcMsgLen){
        _info<<"service::readComplete() full service message recvd.";
        //std::cerr<<"data dump in service::readComplete()"<<dataBuf;
        if(dataHandlerSet) _dh(this, clientid, channelid, dataBuf);
        dataBuf.clear();
        totalSvcBytesRecvd = totalSvcMsgLen = 0;
        newSvcMsg = true;
    }
    readAsync();
    return;
}

void
service::sendToClient(int clientid, int channelid, std::string &wbuf)
{
    _sendSvcMessage(clientid, channelid, wbuf.data(), wbuf.length());
    return;
}

void
service::sendToClient(int clientid, int channelid, const char *wbuf, 
        size_t wbufSize)
{
    _sendSvcMessage(clientid, channelid, wbuf, wbufSize);
    return;
}

void 
service::broadcast(std::string &wbuf)
{
    _sendSvcMessage(-1, -1, wbuf.data(), wbuf.length());
    return;
}

void
service::broadcast(const char *wbuf, size_t wbufSize)
{
    _sendSvcMessage(-1, -1, wbuf, wbufSize);
    return;
}

void
service::readControlMessages(boost::system::error_code error)
{
    _info<<"service::readControlMessages() control message from ngw";
    if (error){ 
        _error<<"service::readControlMessages() encountered an error."<<
            error.message(); 
        THROW_ERRNO_EXCEPTION; 
    }
    controlMessage cmsg;
    memset(&cmsg, 0, sizeof(cmsg));
    char *ptr = reinterpret_cast<char*>(&cmsg);
    int bytes2Read = sizeof(controlMessage); 
    int bytesRead = 0;
    do{
        ptr += bytesRead;
        bytesRead += _except(::mq_receive(mqFd, ptr, bytes2Read, nullptr));
        bytes2Read -= bytesRead;
    } while(bytes2Read);
    if(bytesRead && controlHandlerSet) 
        _ch(this, cmsg);
    controlChannel.async_read_some(boost::asio::null_buffers(),
            boost::bind(&service::readControlMessages,
            this,
            boost::asio::placeholders::error));
    return;
}

void
service::readSignal(boost::system::error_code error)
{
    if (error){ 
        _error<<"service::readSignal() encountered an exception."<<
            error.message(); 
        THROW_ERRNO_EXCEPTION; 
    }
    int fd = signalChannel.native_handle();
    ssize_t s = 0;
    do{
        struct signalfd_siginfo fdsi;
        memset(&fdsi, 0, sizeof(fdsi));
        s = _eintr(::read(fd, &fdsi, sizeof(struct signalfd_siginfo)));
        if(s < 0){
            if(errno == EAGAIN) break;
            THROW_ERRNO_EXCEPTION;
        }
        if ((s > 0) && (s != sizeof(struct signalfd_siginfo))){
            _error<<"service::readSignal() ::read() on signalfd returns \
                inconsistent size. size:"<<s;
            THROW_ERRNO_EXCEPTION;
        }
        if (signalHandlerSet) 
            _sh(this, fdsi.ssi_signo);
        if (signalHandlerInfoSet) 
            _ssh(this, &fdsi);
    }while(s > 0);
    signalChannel.async_read_some(boost::asio::null_buffers(), 
            boost::bind(&service::readSignal, 
                this, 
                boost::asio::placeholders::error));
    return;
}

void 
service::run()
{
    try
    {
        svc.run();
    }
    catch(std::exception &e)
    {
        _error<<"service::run() exited with exception:"<<e.what();
        throw(e);
    }
}

void
service::dispatch()
{
    try
    {
        svc.run_one();
    }
    catch(std::exception &e)
    {
        _error<<"service::dispatch() exited with exception:"<<e.what();
        throw(e);
    }
}

//stop the event loop.
//can be called safely from any of the handlers.
void
service::stop()
{
    try
    {
        svc.stop();
    }
    catch(std::exception &e)
    {
        _error<<"service::stop() exited with exception:"<<e.what();
        throw(e);
    }
    return;
}

void 
service::setDataRecvHandler(dataHandler dh)
{
    _dh = dh;
    dataHandlerSet = true;
    return;
}

void 
service::setControlRecvHandler(controlHandler ch)
{
    _ch = ch;
    controlHandlerSet = true;
    return;
}

void
service::setSignalHandler(std::function<void(service *, int)> sh)
{
    _sh = sh;
    signalHandlerSet = true;
    return;
}

void
service::setSignalHandler(std::function<void(service *, 
            struct signalfd_siginfo *fdsi)> ssh)
{
    _ssh = ssh;
    signalHandlerInfoSet = true;
    return;
}

int
service::getControlChannelHandle()
{
    return mqFd;
}

int 
service::getDataChannelHandle()
{
    return dataChannel.native_handle();
}

int 
service::getSignalHandle()
{
    return sFd;
}

void 
service::sendToGw(controlMessage &cmsg)
{
    memcpy(cmsg.sender, name.c_str(), name.length());
    if(gwMqFd){
        int rc = _eintr(::mq_send(gwMqFd, 
                    reinterpret_cast<char*>(&cmsg), 
                    sizeof(cmsg), 
                    0));
        if (rc < 0){
            _error<<"unable to send message to the gateway:";
        }
    }
    return;
}

void 
service::dynamicFdReadyHandler(const boost::system::error_code &error, int fd)
{
    if(!error){
        auto it = dynamicFdTable.find(fd);
        if(it == dynamicFdTable.end()){
            _error<<"service::dynamicFdReadyHandler() unable to find the fd: "<<fd;
            THROW_ERRNO_EXCEPTION;
        }
        it->second.second(this, fd);
        it->second.first->async_read_some(boost::asio::null_buffers(), 
                boost::bind(&service::dynamicFdReadyHandler, 
                    this, 
                    boost::asio::placeholders::error,
                    fd));
        return;
    }
    if(error != boost::asio::error::operation_aborted)
        _error<<"service::dynamicFdReadyHandler() error on fd: "<<fd<<
            " error:"<<error.message();
    return;
}

void 
service::addReadFd(int fd, std::function<void(service*, int)> readReadyHandler)
{ 
    boost::asio::posix::stream_descriptor *dynamicFdHandle = nullptr;
    dynamicFdHandle = new boost::asio::posix::stream_descriptor(this->svc);
    //fcntl(fd, F_SETFL, O_NONBLOCK);
    dynamicFdHandle->assign(fd);
    dynamicFdTable[fd] = std::make_pair(dynamicFdHandle, readReadyHandler);
    dynamicFdHandle->async_read_some(boost::asio::null_buffers(), 
            boost::bind(&service::dynamicFdReadyHandler, 
                this,
                boost::asio::placeholders::error,
                fd));
    return;
}

void 
service::remReadFd(int fd)
{
    boost::asio::posix::stream_descriptor *dynamicFdHandle = nullptr; 
    auto it = dynamicFdTable.find(fd);
    if(it == dynamicFdTable.end()){
        _error<<"service::remReadFd() unable to find the fd: "<<fd;
        return;
    }
    dynamicFdHandle = it->second.first;
    if(dynamicFdHandle){
        dynamicFdHandle->cancel();
        dynamicFdHandle->release();
        dynamicFdTable.erase(it);
        delete dynamicFdHandle;
    }
    return;
}

boost::asio::io_service*
service::getAsioSvcRef()
{
    return &svc;
}

service::Timer*
service::getTimerHandle(std::string &cookie)
{
    for(auto &kv : timerList) if (kv.first == cookie) return kv.second;
    return nullptr;
}

//install a one shot timer and callback to be called 
//when the timer fires the callback is called and 
//the timer is deleted afterwards.
void 
service::addOneShotTimer(std::string cookie, uint32_t count, timerCallback callback) 
{
    service::Timer *svcTimer = new service::Timer(&svc, count, false, callback);
    timerList.insert(std::make_pair(cookie, svcTimer));
    svcTimer->bt->async_wait(boost::bind(&service::timerCallbackDispatch, 
                this, 
                boost::asio::placeholders::error, 
                cookie, 
                svcTimer));
    return;
}

//install a repeatable timer and callback to be called 
//when the timer fires, the callback will be called up
//on every lapse of interval. The timer is restarted 
//after the callback is invoked.
void 
service::addPeriodicTimer(std::string cookie, uint32_t count, timerCallback callback) 
{
    service::Timer *svcTimer = new service::Timer(&svc, count, true, callback);
    timerList.insert(std::make_pair(cookie, svcTimer));
    svcTimer->bt->async_wait(boost::bind(&service::timerCallbackDispatch, 
                this, 
                boost::asio::placeholders::error, 
                cookie, 
                svcTimer));
    return;
}

//start the timer.
void 
service::startTimer(std::string cookie)
{
    auto timer = getTimerHandle(cookie);
    if(timer){
        timerState state = timer->state;
        if(state == SVCLIB_TIMER_ACTIVE) return;
        timer->state = SVCLIB_TIMER_ACTIVE;
        boost::asio::deadline_timer *bt = timer->bt;
        assert(bt);
        bt->expires_from_now(boost::posix_time::milliseconds(timer->count));
        bt->async_wait(boost::bind(&service::timerCallbackDispatch, 
                    this, 
                    boost::asio::placeholders::error, 
                    cookie, 
                    timer));
        return;
    }
    _error<<"timer with given cookie: "<<cookie<<" not found.";
    return;
}

//stop the timer.
void 
service::stopTimer(std::string cookie)
{
    auto timer = getTimerHandle(cookie);
    if(timer){
        timerState state = timer->state;
        if(state != SVCLIB_TIMER_ACTIVE) return;
        boost::asio::deadline_timer *bt = timer->bt;
        assert(bt);
        bt->cancel();
        return;
    }
    _error<<"timer with given cookie: "<<cookie<<" not found.";
    return;
} 

//delete a timer.
void 
service::deleteTimer(std::string cookie)
{
    auto timer = getTimerHandle(cookie);
    if(timer){
        timerList.erase(cookie);
        timer->bt->cancel();
        delete timer;
        return;
    }
    _error<<"timer with given cookie: "<<cookie<<" not found.";
    return;
}

//invoke the application timer callback registered by the application.
void 
service::timerCallbackDispatch(const boost::system::error_code &ec, 
        std::string cookie, 
        service::Timer *timer)
{
    if(ec){
        if(ec != boost::asio::error::operation_aborted)
            _error<<"service::timerCallbackDispatch() encountered error: "<<
                ec.message(); 
        return; 
    }
    assert(timer);
    //if the timer is not of a repititive type then set the state to SVCLIB_TIMER_INACTIVE
    bool repititive = timer->periodic;
    if(!repititive){
        timer->state = SVCLIB_TIMER_INACTIVE;
        return;
    }
    boost::asio::deadline_timer *bt = timer->bt;
    assert(bt);
    bt->expires_from_now(boost::posix_time::milliseconds(timer->count));
    bt->async_wait(boost::bind(&service::timerCallbackDispatch, 
                this, 
                boost::asio::placeholders::error, 
                cookie, 
                timer));
    timer->cbk(this, cookie);
    return;
}
