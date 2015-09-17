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

#ifndef __INC_SVC_LIB_H__
#define __INC_SVC_LIB_H__

#include <stdio.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <string.h>
#include <iostream>
#include <string>
#include <map>
#include <fcntl.h>           /* For O_* constants */
#include <sys/stat.h>        /* For mode constants */
#include <sys/signalfd.h>        /* For mode constants */
#include <mqueue.h>
#include <boost/asio.hpp>

class service;
class service
{
    public:
    //XXX: no need to take care of endian issues, since this 
    //structure will not leave a node.
    typedef struct __attribute__((packed))
    {
        enum
        {
            CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL = 1, //A new client has arrived which is requesting the service.
            CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE = 2, //An existing client has disconnected.
            CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT = 3,//A client is misbehaving or not athering to protocol.
            //sent by the service to close the client connection and all its 
            //channels.
            CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_ADD = 4, //A new channel is added to the network connection.
            CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_DELETE = 5, //A channel is deleted from the network connection.
            CONTROL_CHANNEL_MESSAGE_TYPE_HEART_BEAT = 6,  //A periodic heart beat sent by the service daemons to report health to gw.
        };
        char sender[MAX_SERVICE_NAME_LEN];
        int32_t messageType;
        union
        {
            struct __attribute__((packed)){ 
                int32_t clientid; 
                int32_t channelid; 
            }clientArrival;
            struct __attribute__((packed)){ 
                int32_t clientid; 
                int32_t channelid; 
            }clientDeparture;
            struct __attribute__((packed)){ 
                int32_t clientid;
                int32_t channelid;
                int32_t waitingTime;  // 0 value means immediatly close the connection, else start a close timer.
            }clientDisconnect;
        };
    }controlMessage;

    private:
    typedef std::function<void(service *, int, int, std::string &data)> dataHandler;
    typedef std::function<void(service *, controlMessage &cmsg)> controlHandler;
    typedef std::function<void(service *)> gwFailureHandler;
    typedef std::function<void(service *, std::string)> timerCallback;

    typedef enum 
    {
        SVCLIB_TIMER_INACTIVE,
        SVCLIB_TIMER_ACTIVE,
    }timerState;

    typedef struct Timer
    {
        //count in milliseconds.
        //timerState
        //repetable = true or false.
        //handle to the boost deadline timer. 
        //callback to be invoked up on timer fire.
        uint32_t count = 0; 
        timerState state = SVCLIB_TIMER_ACTIVE;
        bool periodic = false;
        boost::asio::deadline_timer *bt = nullptr;
        timerCallback cbk;
        Timer(boost::asio::io_service *svc, uint32_t _count, bool _periodic, timerCallback _cbk) : 
            count(_count),
            periodic(_periodic),
            cbk(_cbk)
        {
            bt = new boost::asio::deadline_timer(*svc, boost::posix_time::milliseconds(count));
            return;
        }
        ~Timer()
        {
            delete bt;
            return;
        }
    }Timer;
    std::map<std::string, Timer*> timerList;
    char *data = nullptr;
    uint32_t dataSize = OPTIMAL_BUF_SIZE;
    std::string dataBuf;
    std::string name = "";
    std::string mqName = "";
    int mqFd = -1; //our message queue.
    int gwMqFd = -1; //message queue of the network gateway.
    std::string gSvcName = "";
    sigset_t mask;
    int sFd = -1;
    ssize_t s = 0;
    bool signalHandlerSet = false;
    bool signalHandlerInfoSet = false;
    bool controlHandlerSet = false;
    bool dataHandlerSet = false;
    bool newSvcMsg = true;
    dataHandler _dh;
    controlHandler _ch;
    std::function<void(service *, int)> _sh;
    std::function<void(service *, struct signalfd_siginfo *fdsi)> _ssh;
    char svcHeader[sizeof(int32_t) + sizeof(int32_t) + MAX_SERVICE_NAME_LEN + sizeof(int32_t)] = {' '};//XXX:intentionally kept space not'\0';
    char controlFrame[sizeof(controlMessage)];
    struct signalfd_siginfo fdsi = {0};
    int32_t clientid = -1, channelid = -1, msgLen = -1;
    uint32_t totalSvcMsgLen = 0, totalSvcBytesRecvd = 0, bytes2Recv = sizeof(svcHeader);
    boost::asio::io_service svc;
    boost::asio::posix::stream_descriptor controlChannel, signalChannel;
    boost::asio::local::stream_protocol::endpoint ep;
    boost::asio::local::stream_protocol::socket dataChannel;

    public:
    void _sendSvcMessage(int, int, const char *, size_t);
    service(std::string name);
    ~service();
    std::map<int, std::pair<boost::asio::posix::stream_descriptor*, std::function<void(service*, int)>>> dynamicFdTable;
    boost::system::error_code readError;
    int getControlChannelHandle();
    int getDataChannelHandle();
    int getSignalHandle();
    void stop(); //stops the event loop can be called from any of the handlers or other threads.
    void setDataRecvHandler(dataHandler);
    void setControlRecvHandler(controlHandler);
    void setSignalHandler(std::function<void(service *, int)>);
    void setSignalHandler(std::function<void(service *, struct signalfd_siginfo *fdsi)>);
    void sendToClient(int, int, std::string &);
    void sendToClient(int, int, const char*, size_t);
    void sendToGw(controlMessage &);
    void broadcast(std::string &);
    void broadcast(const char*, size_t);
    void readControlMessages(boost::system::error_code);
    void readSignal(boost::system::error_code);
    void run();//blocking run loop repeatedly dispatchs events to their respective handlers.
    void dispatch(); //dispatch all the events to their respective handlers
    void addReadFd(int, std::function<void(service*, int)> readReadyHandler);
    void remReadFd(int);
    void readAsync();
    void readComplete(const boost::system::error_code&, size_t);
    void dynamicFdReadyHandler(const boost::system::error_code &, int);
    boost::asio::io_service* getAsioSvcRef();
    void addOneShotTimer(std::string, uint32_t, timerCallback); //install a one shot timer and callback to be called 
                                                                //when the timer fires the callback is called and 
                                                                //the timer is deleted afterwards.
    void addPeriodicTimer(std::string, uint32_t, timerCallback);  //install a repeatable timer and callback to be called 
                                                                //when the timer fires, the callback will be called up
                                                                //on every lapse of interval. The timer is restarted 
                                                                //after the callback is invoked.
    void timerCallbackDispatch(const boost::system::error_code&, std::string, Timer*);
    void startTimer(std::string); //start the timer.
    void stopTimer(std::string); //stop the timer.
    void deleteTimer(std::string); //remove a timer.
    Timer* getTimerHandle(std::string &);
};
#endif
