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

#ifndef __INC_ASIO_H__
#define __INC_ASIO_H__

#include <string>
#include <queue>
#include <boost/array.hpp>
#include <boost/asio.hpp>
#include <boost/enable_shared_from_this.hpp>
#include <boost/intrusive/set.hpp>
#include <algorithm>
#include <fcntl.h>           /* For O_* constants */
#include <sys/stat.h>        /* For mode constants */
#include <mqueue.h>
#include <cstring>
#include "common.hh"
#include <websocketpp/config/asio.hpp>
#include <websocketpp/message_buffer/alloc.hpp>
#include <websocketpp/server.hpp>
#include <boost/date_time/posix_time/posix_time.hpp>

#ifdef AKORP_SSL_CAPABLE
typedef websocketpp::server<websocketpp::config::asio_tls> server;
#else
typedef websocketpp::server<websocketpp::config::asio> server;
#endif

typedef websocketpp::config::asio::message_type::ptr message_ptr;
typedef websocketpp::message_buffer::alloc::con_msg_manager<websocketpp::config::asio::message_type> con_msg_man_type;
typedef websocketpp::lib::shared_ptr<boost::asio::ssl::context> context_ptr;

class serviceConnection;
class networkConnection;

class serviceConnection : 
    public boost::enable_shared_from_this<serviceConnection>,
    public boost::intrusive::set_base_hook<boost::intrusive::optimize_size<true>>
{
    int _mqfd = -1; //descriptor of the message queue to the service, control channel to the service.
    bool _initialized = false; //The object is fully constructed and can be reused as is.This is needed 
                               //at the time of service registration only a new service connection is 
                               //allocated if there is no old object.
    std::string _name = ""; //name of the service.
    boost::asio::local::stream_protocol::socket _socket;
    unsigned int _svcFrameLen = 0; //length of the service frame.
    unsigned int _svcFrameLenRecvd = 0; //length of the service frame recieved so far.
    boost::array<char, OPTIMAL_BUF_SIZE> _data; //read OPTIMAL_BUF_SIZE bytes of data from the service connection.
    unsigned int _dataSize = 0;
    std::queue<message_ptr> _mq;
    const char *_marker = nullptr; 
    unsigned int _bytes2Send = 0;
    unsigned int _bytes2Recv = OPTIMAL_BUF_SIZE;
    unsigned int _totalSvcBytesRecvd = 0; 
    message_ptr _svcmsg = nullptr; //This is a response from service to an earlier reply from the client.
    con_msg_man_type::ptr _connMngr;
    unsigned int _totalSvcMsgLen = 0;
    networkConnection *_nconn = nullptr;
    unsigned int _totalSvcBytesSent = 0;
    bool _newSvcMsg = true;
    unsigned int _hbMissCount = 0;
    bool _health = false;
    char payloadLabel[2*sizeof(int)]; //label holding the client and channel id across function calls.
    bool _isBroadcast = false; //if the out going message is a broadcast one.

    public:
    std::map<int, std::vector<int>> clientList; //list of clients and channels.
    //accepting socket in to which new service connectsion will be accepted.
    static boost::asio::local::stream_protocol::socket *_gSvcAcceptSocket;

    serviceConnection(boost::asio::io_service *, std::string, int);
    ~serviceConnection();
    void addToList();
    void readComplete(const boost::system::error_code&, size_t);
    void writeComplete(networkConnection *, const boost::system::error_code&, size_t);
    void readAsync(); //trigger an asynchronous read.
    void writeAsync(networkConnection *); //trigger an asynchronous write.
    static int openSvcMessageQueue(std::string);
    void setMqFd(int);
    int getMqFd(void);
    boost::asio::local::stream_protocol::socket& getSocket();
    std::string getName();
    void nq(message_ptr);
    message_ptr dq();
    void setName(std::string);
	bool operator < (const serviceConnection &);
	bool operator > (const serviceConnection &);
	bool operator == (const serviceConnection &);
    void markDown();
    void markUp();
    void markInitialized();
    bool isInitialized();
    bool isUp();
    void setSocket(boost::asio::local::stream_protocol::socket*);
    void addClient(int clientid);
    void addChannel(int clientid, int channelid);
    void remClient(int clientid);
    void remChannel(int clientid, int channelid);
    bool isClientPresent(int clientid);
    bool isChannelPresent(int clientid, int channelid);
    void relayClientAndChannel2Service();
    void informSvcStatus2AllClients(std::string);
    std::map<int, std::vector<int>>& getClientList(); //list of clients and channels.
    size_t mqSize();
};
typedef boost::intrusive::set<serviceConnection, boost::intrusive::compare<std::greater<serviceConnection>>> svcConnListT;

class networkConnection : public boost::intrusive::set_base_hook<boost::intrusive::optimize_size<true>>
{
    std::queue<message_ptr> _mq;
    std::queue<message_ptr> _mq_bcast;
    websocketpp::connection_hdl _wsppconn;
    int _fd = -1;
    int _channelId = -1; //valid only when using demultiplexing extension.
    std::string _apikey = ""; //valid api key.
    std::vector<std::string> _svcList; //list of services negotiated by the connection.
    int _channels[256]; //list of channels opened on this connection.

    public:
    //Accounting garb. nothing significant.
    std::string subProtocol = ""; //negotiated subprotocol
    std::vector<std::string> requestedSubProtocols; //subprotocols negotiated on this connection.
    std::string _ipAddress = ""; //public ip address of the client connection.
    std::string _userAgent = ""; //useragent of the client connection.
    uint64_t _connectTimestamp = 0;//time @ which the connection was opened.
    uint64_t _inputByteCount = 0; //input Byte count.
    uint64_t _outputByteCount = 0; //output Byte count.
    bool _keepAliveEnabled = false; //are we xmitting websocket keep alives for this connection.
    bool _compressionEnabled = false; //are we enabled per message compression on this connection.
    std::string origin = ""; //origin of the websocket connection.
    std::vector<std::string> extensions; //extensions negotiated by the connection.
    std::string version = ""; //version of the websocket protocol client is running on.
    bool flowControlEnabled = false; //enabled flow control on this connection.
    bool xonXmitted = false; //xon sent.
    bool xoffXmitted = false; //xoff sent.
    std::string deviceType = "desktop";  //devicetype can be "mobile", "tablet", "desktop".
    bool compressionEnabled = false; //compression enabled on the connection.
    bool ipv6Conn = false; // is it an ipv6 connection.
    double connectionBandwidth = 0; //bandwidth of the client connection. depending on the bandwidth 
                                    //vary the compression ratio.
    networkConnection(websocketpp::connection_hdl, std::string, std::string);
    ~networkConnection();
    int getConnId();
    websocketpp::connection_hdl getConnHdl();
    void nq(message_ptr);
    void nq_broadcast();
    void broadcast();
    message_ptr dq();
    int getChannelId();
    void send();
    void registerSvc(std::string);
	bool operator < (const networkConnection &);
	bool operator > (const networkConnection &);
	bool operator == (const networkConnection &);
    void informClientStatus2AllServices(bool);
};
typedef boost::intrusive::set<networkConnection, boost::intrusive::compare<std::greater<networkConnection>>> ntwConnListT;
#endif 
