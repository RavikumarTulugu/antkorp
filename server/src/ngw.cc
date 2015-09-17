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

#include <string>
#include <queue>
#include <boost/array.hpp>
#include <boost/asio.hpp>
#include <boost/enable_shared_from_this.hpp>
#include <boost/intrusive/set.hpp>
#include <algorithm>
#include <fcntl.h>           /* For O_* constants */
#include <sys/time.h>        /* For mode constants */
#include <sys/resource.h>        /* For mode constants */
#include <sys/stat.h>        /* For mode constants */
#include <sys/socket.h>        /* For mode constants */
#include <mqueue.h>
#include <cstring>
#include <arpa/inet.h>
#include <time.h>
#include "common.hh"
#include "svclib.hh"
#include "ngw.hh"
#include "log.hh"
#include "config.hh"
#include "tpool.hh"

#ifdef AKORP_SSL_CAPABLE
#warning("+-----------Building Secure version of network gateway------------------------------------+");
#else
#warning("+-----------Building non ssl version of the network gateway, is this what you want ???----+");
#endif

#ifdef LIMITED
#warning("+-----------Building limited version of network gateway only supported for 10 connections.+");
static uint64_t limitedConnectionCount = MAX_LIMITED_CONNECTION_COUNT;
static uint64_t currentConnectionCount = 0;
#endif

static void 
startServiceAccept(boost::asio::io_service *, 
boost::asio::local::stream_protocol::acceptor *);
static void 
startPeerConnAccept(boost::asio::io_service *, 
boost::asio::ip::tcp::acceptor *);
static void 
handleServiceAccept(boost::asio::io_service *, 
boost::asio::local::stream_protocol::acceptor *, 
const boost::system::error_code&);
static void 
handlePeerAccept(boost::asio::io_service *, 
boost::asio::ip::tcp::acceptor *, 
const boost::system::error_code&);
static void add2SvcConnList(serviceConnection *);
static void delFromSvcConnList(serviceConnection *);
static bool isSvcActive(std::string );
static serviceConnection* getServiceConnObj(std::string);
static void add2NtwConnList(networkConnection *);
static void delFromNtwConnList(networkConnection *);
static void handleMqRead(boost::system::error_code ec);
static boost::asio::io_service gIoSvc;
static server *gw = nullptr;
static ntwConnListT ntwConnList;
static svcConnListT svcConnList;
static std::vector<std::string> svclist; //temporary to hold the list of services between validate_handler and open.
static boost::asio::ip::udp::socket multicast_socket(gIoSvc);
static boost::asio::ip::udp::endpoint multicast_sender_endpoint;
static boost::asio::ip::tcp::socket *gPeerAcceptSocket = nullptr;
static unsigned char recvBuf[OPTIMAL_BUF_SIZE] = {'\0'};
static unsigned char sendBuf[OPTIMAL_BUF_SIZE] = {'\0'};

#ifdef  HTTP_TUNNEL_SUPPORT 
#warning("+------------Building  network gateway with HTTP Tunneling support ------------------------+");
static ThreadPool *httpWorkerPool = nullptr;
#endif

static std::string stun_server = "";
static std::string interface_address = "";
static int gw_port = -1;
static std::string debug_level = "error";
static std::string log_file = "/var/log/antkorp/ngw";
static std::string peer_multicast_address = "224.0.0.1";
static int peer_multicast_port = 23456;
static int peer_connection_port = 23457;
static std::string ssl_certificate = ""; //full path of the security certificate.
static std::string ssl_certificate_key = ""; //full path of the security certificate.
static bool cloudDeployment = false;
static sigset_t mask;
static boost::asio::posix::stream_descriptor signalChannel(gIoSvc);

//list of valid services from the configuration file. whenever a new 
//connection request arrives we should check whether the services 
//requested by the connection are from this list.
//FIXME: make this as configuration later.
static std::vector<std::string> 
validServiceList = 
{
    "simple",
    "fmgr",
    "tunneld",
    "dmgr",
    "kons",
    "reversi",
    "astchma",
    "rtc",
    "ngw",
    "auth",
    "calendar"
}; 

static bool
isSvcValid(std::string sname)
{
    for(std::string& itr2 : validServiceList){
        if(itr2 == sname) return true;
    }
    return false;
}

// we also use boost asio to listen and process the control channel requests on 
// the gateway message queue. The idea to mix message queues with boost asio 
// is taken from the below google group discussion.
// https://groups.google.com/forum/?fromgroups=#!topic/boost-list/Sz7CDtetJSU
static boost::asio::posix::stream_descriptor *gwMqFd = nullptr; //message queue on which the gateway listens for control requests.

static inline std::string
parseSvcName(const char *hayStack)
{
	std::string svcName = "undefined"; 
	char sname[MAX_SERVICE_NAME_LEN] = {'\0'};
	memcpy(sname, hayStack, sizeof(sname));
 	char *ptr = sname; 
	int i = 0;
	for (i = 0; i < MAX_SERVICE_NAME_LEN; i++){
		if (ptr[i] ==  ' '){ 
			ptr[i] = '\0'; 
			break; 
		}
	}

	if (i == MAX_SERVICE_NAME_LEN){ 
		svcName.assign(sname, MAX_SERVICE_NAME_LEN); 
	}
	else 
		svcName.assign(sname);
	return svcName;
}

static inline int
parseClientId(const char *hayStack)
{
	int32_t cid = -1;
	memcpy(&cid, hayStack, sizeof(int32_t));
	return ntohl(cid);
}

static inline int
parseSvcMsgLen(const char *hayStack)
{
	int32_t cid = -1;
	memcpy(&cid, hayStack, sizeof(int32_t));
	return ntohl(cid);
}

static inline int 
parseChannelId(const char *hayStack)
{
    int channelId = -1;
	memcpy(&channelId, hayStack, sizeof(int32_t));
	return ntohl(channelId);
}

static void 
add2NtwConnList(networkConnection *nconn) 
{ 
    ntwConnList.push_back(*nconn); 
    return; 
}

static void 
delFromNtwConnList(networkConnection *nconn) 
{ 
    ntwConnList.erase(ntwConnListT::s_iterator_to(*nconn)); 
    return; 
}

static networkConnection*
getNetworkConnObj(int connid, int channelId = -1)
{
    ntwConnListT::iterator itr;
	for(networkConnection& itr : ntwConnList) 
		if(itr.getConnId() == connid) 
            return &itr;
    return nullptr;
}

static networkConnection*
getNetworkConnObj(websocketpp::connection_hdl chdl)
{
    websocketpp::lib::error_code ec;
	for(networkConnection& itr : ntwConnList){
        server::connection_ptr cptr = gw->get_con_from_hdl(chdl, ec);
        if(ec){
            _error<<"unable to get connection pointer from connection handle.";
            return nullptr;
        }
        if(itr.getConnId() == cptr->get_raw_socket().native_handle()) 
            return &itr;
    }
    return nullptr;
}

void
serviceConnection::informSvcStatus2AllClients(std::string status)
{
    _info<<"informing service : "<<_name<<" status: "<<status<<"to all clients";
	std::string event = "event"; 
	std::string event_type = (status == "up") ? "service_up" : "service_down";
	tupl tv[] = 
	{
		{"mesgtype", event},
		{"eventtype", event_type},
		{"service_name", _name},
	};
	std::string json = putJsonVal(tv, sizeof(tv)/sizeof(tupl));
    char statusMesg[1024] = {' '};
    websocketpp::lib::error_code ec;
    char svcname[MAX_SERVICE_NAME_LEN] = "ngw";
    unsigned int dataSize = htonl(json.length());
    for(std::map<int, std::vector<int>>::iterator itr = clientList.begin();
            itr != clientList.end();
            itr++){
        server::connection_ptr cptr = gw->get_con_from_hdl( \
                getNetworkConnObj((*itr).first)->getConnHdl(), 
                ec);
        if(ec){
            _error<<"unable to get connection pointer from connection handle.";
            continue;
        }
        memcpy(statusMesg, svcname, strlen(svcname)); //set the svcname
        memcpy(statusMesg + MAX_SERVICE_NAME_LEN, &dataSize, sizeof(int)); //set the msglen
        memcpy(statusMesg + MAX_SERVICE_NAME_LEN + sizeof(dataSize),
                nonconst(json.c_str()),
                json.length());
        unsigned int payloadSize = json.length() + 
            sizeof(dataSize) + 
            MAX_SERVICE_NAME_LEN;
        cptr->send(statusMesg, payloadSize);
    }
	return;
}

static void
add2SvcConnList(serviceConnection *sconn) 
{ 
    svcConnList.push_back(*sconn); 
    return; 
}

static void
delFromSvcConnList(serviceConnection *sconn) 
{ 
    svcConnList.erase(svcConnListT::s_iterator_to(*sconn)); 
    return; 
}

static bool
isSvcActive(std::string svcName) 
{ 
    return getServiceConnObj(svcName) ? true : false; 
}

static serviceConnection*
getServiceConnObj(std::string svcname)
{
    for(serviceConnection& itr : svcConnList) 
        if(itr.getName() == svcname) 
            return &itr;
    return nullptr;
}

//send arrival or departure status of clients to the services.
void
networkConnection::informClientStatus2AllServices(bool arrival)
{
    service::controlMessage cmsg;
    memset(&cmsg, 0, sizeof(cmsg));
    memcpy(cmsg.sender, "ngw", strlen("ngw"));
    if (arrival){
        cmsg.messageType = service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL;
        cmsg.clientArrival.clientid = _fd;
    }else{
        cmsg.messageType = service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE;
        cmsg.clientDeparture.clientid = _fd;
    }
    std::string svclist;
    if(arrival){
        for(std::string& itr : _svcList) { svclist += itr; svclist += ", "; }
        _info<<"service list negotiated by connection:"<<svclist;
    }
    for(std::string& itr : _svcList){
        serviceConnection *sc = getServiceConnObj(itr);
        if(!sc){ _error<<"connection missing for service: "<<itr; continue; }
        if (!sc->isUp()) continue;
        int mqfd = sc->getMqFd();
        if (mqfd){
            struct timespec ts = {0, 10000000}; //10 milliseconds
            clock_gettime(CLOCK_REALTIME, &ts);
            int rc = _eintr(::mq_timedsend(mqfd, 
                    reinterpret_cast<char*>(&cmsg), 
                    sizeof(cmsg), 
                    0, 
                    &ts));
            if (rc < 0) _error<<"Unable to send control message to service:"<<itr;
        }else{
            _error<<"invalid message queue identifier for the service:";
        }
    }
    return;
}

//class to respresent the service connection.
//much of the heavy lifting is done by the websocketpp library.
//we just need to parse the service frames and assemble then and 
//send to the service as one batch.
serviceConnection::serviceConnection(boost::asio::io_service *iosvc, 
        std::string name, 
        int mqfd) :
    _mqfd(mqfd),
    _name(name),
    _socket(*iosvc),
    _connMngr(new con_msg_man_type())
{
    addToList();
    return;
}

serviceConnection::~serviceConnection()
{
    delFromSvcConnList(this);
    _eintr(::close(_mqfd));
    return;
}

inline void 
serviceConnection::addToList()
{
    add2SvcConnList(this);
    return;
}

void
serviceConnection::readAsync() //trigger an asynchronous read.
{
    if(!isUp()){
        _error<<"service: "<<_name<<" not available.";
        return;
    }
    if (_newSvcMsg){
        _svcmsg = _connMngr->get_message(websocketpp::frame::opcode::BINARY, 
                sizeof(serviceHeader));
        _bytes2Recv = sizeof(serviceHeader);
    }
    _socket.async_receive(boost::asio::buffer(_data, _bytes2Recv),
            boost::bind(&serviceConnection::readComplete,
                this,
                boost::asio::placeholders::error,
                boost::asio::placeholders::bytes_transferred));
    _info<<"serviceConnection::readAsync() issued svc: "<<_name<<
        " _bytes2Recv: "<<_bytes2Recv;
    return;
}

void
serviceConnection::readComplete(const boost::system::error_code& error, 
        size_t bytesRecvd)
{
    if (error){
        _error<<"service ["<<_name<<
            "] seems to be down, closing connection."<<error.message();
        //inform all the clients about the death of the service.
        informSvcStatus2AllClients("down");
        this->markDown();
        _error<<"serviceConnection::readAsync() returned error:"<<error.message();
        return;
    }

    if(!bytesRecvd) 
        readAsync();

    size_t payloadRecvd = 0;
    const char *payload = nullptr;
    _info<<"serviceConnection::readComplete() from svc: "<<_name<<
        " bytesRecvd: "<<bytesRecvd;
    if(_newSvcMsg){
        //check if this is a broadcast message. if yes then we need to send it
        //to the clients of the service.
        char *ptr = _data.data();
        int clientid = parseClientId(ptr);
        if(clientid == -1) _isBroadcast = true; //if the client id is -1 then its a service level broadcast message.
        ptr += sizeof(int32_t);
        int32_t channelId = parseChannelId(ptr);
        ptr += sizeof(int32_t);
        std::string svcname = parseSvcName(ptr);
        ptr += MAX_SERVICE_NAME_LEN;
        _totalSvcMsgLen = parseSvcMsgLen(ptr);
        _bytes2Recv = _totalSvcMsgLen;
        _nconn = getNetworkConnObj(clientid, channelId); //_nconn can be null if the message is a broadcast.
        if(!_nconn){ //A service can by mistake send a message to a client gone down after we informed the 
                     //service. This is not a serious offence though.
            _error<<"Unable to find connection object for clientid: "<<clientid;
            _svcmsg.reset();
            _nconn = nullptr;
            _totalSvcBytesRecvd = _totalSvcMsgLen = 0;
            _newSvcMsg = true;
            readAsync();
            return;
        }
        _info<<"new message to client: "<<clientid<<" from svc: "<<svcname;
        _newSvcMsg = false;
        payloadRecvd = bytesRecvd - (2*sizeof(int32_t)); //leave the channelid and the clientid.
        payload = _data.data() + (2*sizeof(int32_t));
    }else{
        payload = _data.data();
        _totalSvcBytesRecvd += bytesRecvd;
        _bytes2Recv = _totalSvcMsgLen - _totalSvcBytesRecvd;
        payloadRecvd = bytesRecvd;
    }

    //append the payload data to the message buffer and enqueue it in the 
    //network connection queue if all the data has arrived.
    _svcmsg->append_payload(payload, payloadRecvd);
    if(_svcmsg && (_totalSvcBytesRecvd == _totalSvcMsgLen)){
        if(!_isBroadcast){
            _nconn->nq(_svcmsg);
            _nconn->send(); //trigger a send on the network connection.
        }else{
            //walk through all the clients and channels the service is serving.
            //make a copy of the message and enqueue it to all the network
            //connections and trigger a send.
            for(std::map<int, std::vector<int>>::iterator itr = \
                    clientList.begin();
                    itr != clientList.end();
                    itr++){
                networkConnection *nconn = getNetworkConnObj((*itr).first);
                assert(nconn);
                message_ptr clone = _connMngr->get_message(
                        websocketpp::frame::opcode::BINARY, 
                        _svcmsg->get_payload().size());
                clone->append_payload(_svcmsg->get_payload());
                nconn->nq(clone);
                nconn->send();
                nconn->nq_broadcast(); //FIXME: fill this once channels are supported.
                nconn->broadcast(); //xmit the message on all the channels of the client.
            }
            _isBroadcast = false;
        }
        _svcmsg.reset();
        _nconn = nullptr;
        _totalSvcBytesRecvd = _totalSvcMsgLen = 0;
        _newSvcMsg = true;
        readAsync();
        return;
    }

    readAsync();
    return;
}

void
serviceConnection::writeAsync(networkConnection *nconn) //trigger an asynchronous write.
{
    //Try to write the whole of the message at once.
    //we need to do a scatter gather op here to prepend the clientid 
    //and the channel id to the payload. this needs to be done only 
    //in case of a new service message. The pointers passed to the 
    //boost asio buffers need to be static and persist across function 
    //calls.
    std::vector<boost::asio::const_buffer> bufList;
    if (_mq.size()){
        message_ptr m = _mq.front();
        std::string payload = m->get_payload();
        if(!_marker){
             int32_t clientid = htonl(nconn->getConnId());
             int32_t channelid = htonl(nconn->getChannelId());
             _info<<"message from client: "<<nconn->getConnId()<<
                 " to svc: "<<_name <<
                 " with length: "<<payload.length();
             memcpy(payloadLabel, &clientid, sizeof(clientid));
             memcpy(payloadLabel+sizeof(clientid), &channelid, \
                     sizeof(channelid));
             bufList.push_back(boost::asio::buffer(payloadLabel, \
                         sizeof(payloadLabel)));
            _marker = payload.data();
            _bytes2Send = payload.length();
        }
        bufList.push_back(boost::asio::buffer(_marker, _bytes2Send));
        _socket.async_send(bufList,
                           0,
                           boost::bind(&serviceConnection::writeComplete,
                                       this,
                                       nconn,
                                       boost::asio::placeholders::error,
                                       boost::asio::placeholders::bytes_transferred));
        _info<<"serviceConnection::writeAsync() issued 2 svc: "<<_name<<
            " _bytes2Send: "<<_bytes2Send;
    }
    return;
}

void 
serviceConnection::writeComplete(networkConnection *nconn,
                                 const boost::system::error_code& error, 
                                 size_t bytesSent)
{
    if (error){
        _error<<"serviceConnection::writeAsync() returned error:"<<error.message();
        return;
    }
    
    if(!bytesSent){ 
        _error<<"serviceConnection::writeAsync() returned 0 bytesSent:.";
        return;
    }

    if(!_mq.size()){ 
        _error<<"empty queue nothing to write.";
        return;
    }

    _info<<"writeComplete() svc: "<<_name<<" bytesSent: "<<bytesSent;
    message_ptr m = _mq.front();
    std::string payload = m->get_payload();
    //the bytesSent count is misleading because on first write of the new svc
    //frame the bytesSent will be 8 bytes more than the actual payload length 
    //or actual length written. This is because of the vectored write we are 
    //doing those 8 bytes come from the prepending of clientid and channelid. 
    //so we need to substract them if the service frame is a new one.
    if(_marker == payload.data()) bytesSent -= (2 * sizeof(int32_t));

    _totalSvcBytesSent += bytesSent;
    if(_totalSvcBytesSent == payload.length()){
        _mq.pop();
        _marker = nullptr;
        memset(payloadLabel, 0, sizeof(payloadLabel));
        _totalSvcBytesSent = 0;
        //There are still messages in the queue trigger the next write.
        if(_mq.size()) writeAsync(nconn);
    }else{
        _info<<"bytesSent:"<<bytesSent<<
            " _totalSvcBytesSent: "<<_totalSvcBytesSent<<
            " payload.length():"<<payload.length();
        _marker = _marker + _totalSvcBytesSent;
        _bytes2Send = payload.length() - _totalSvcBytesSent;
        if(_bytes2Send) writeAsync(nconn);
    }
    return;
}

//The message queue name will be a well known name derived from the base path 
//given in the configuration. Just append the service name to the base path 
//and try to open the message queue. if successful then append the message 
//queue identifier to the service connection map.
int 
serviceConnection::openSvcMessageQueue(std::string svcName)
{
    std::string mqName = "/" + svcName + ".mq";
    int mq = _except(::mq_open(mqName.c_str(), O_WRONLY));
    _info<<"mq opened successfully mqname: "<<mqName;
    return mq;
}

//set the service message queue descriptor.
void 
serviceConnection::setMqFd(int mqfd) 
{ 
    _mqfd = mqfd; 
    return; 
}

int 
serviceConnection::getMqFd(void) 
{ 
    return _mqfd;
}

boost::asio::local::stream_protocol::socket& 
serviceConnection::getSocket() 
{
    return _socket;
}

void
serviceConnection::setSocket(boost::asio::local::stream_protocol::socket *sock) 
{
    _socket = std::move(*sock);
    return;
}

std::string 
serviceConnection::getName() 
{ 
    return _name; 
}

void 
serviceConnection::nq(message_ptr msg) 
{ 
    _mq.push(msg); 
    return; 
}

message_ptr 
serviceConnection::dq() 
{ 
    message_ptr m = _mq.front(); 
    _mq.pop(); 
    return m; 
}

void 
serviceConnection::setName(std::string name) 
{ 
    _name.assign(name); 
    return; 
}

bool 
serviceConnection::operator < (const serviceConnection &b) 
{ 
    return _name < b._name; 
}

bool 
serviceConnection::operator > (const serviceConnection &b) 
{ 
    return _name > b._name; 
}

bool 
serviceConnection::operator == (const serviceConnection &b) 
{ 
    return _name == b._name; 
}

void
serviceConnection::markUp()
{
    _health = true;
    return;
}

void
serviceConnection::markDown()
{
    _health = false;
    return;
}

void 
serviceConnection::markInitialized()
{
    _initialized = true;
    return;
}

bool
serviceConnection::isInitialized()
{
    return _initialized == true;
}

bool
serviceConnection::isUp()
{
    return _health == true;
}

size_t
serviceConnection::mqSize()
{
    return _mq.size();
}

//FIXME: send channelid as well once we have the support for multiplexing extension.
void
serviceConnection::relayClientAndChannel2Service()
{
    _info<<"relaying client channels and clients to the service.";
    for(std::map<int, std::vector<int>>::iterator itr = clientList.begin();
            itr != clientList.end();
            itr++){
        int clientid = (*itr).first;
        if(clientid){
            service::controlMessage cmsg;
            memset(&cmsg, 0, sizeof(cmsg));
            memcpy(cmsg.sender, "ngw", strlen("ngw"));
            cmsg.messageType = service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL;
            cmsg.clientArrival.clientid = clientid;
            cmsg.clientArrival.channelid = -1;
            struct timespec ts = {0, 10000000}; //10 milliseconds
            clock_gettime(CLOCK_REALTIME, &ts);
            int rc = _eintr(::mq_timedsend(_mqfd, 
                    reinterpret_cast<char*>(&cmsg), 
                    sizeof(cmsg), 
                    0, 
                    &ts));
            if (rc < 0) _error<<"Unable to send control message to service:"<<_name;
        }
    }
    return;
}

void
serviceConnection::addClient(int clientid)
{
    clientList[clientid].push_back(-1);
    return;
}

void
serviceConnection::remClient(int clientid)
{
	clientList.erase(clientid);
    return;
}

void 
serviceConnection::addChannel(int clientid, int channelid)
{
    clientList[clientid].push_back(channelid);
    return;
}

void
serviceConnection::remChannel(int clientid, int channelid)
{
    return;
}

bool
serviceConnection::isChannelPresent(int clientid, int channelid)
{
    return false;
}

bool
serviceConnection::isClientPresent(int clientid)
{
	return !(clientList.find(clientid) == clientList.end());
}

std::map<int, std::vector<int>>&
serviceConnection::getClientList()
{
    return clientList;
}

static void
on_open(server *s, websocketpp::connection_hdl conn)
{
    int rc = 0;
    websocketpp::lib::error_code ec;
    server::connection_ptr cptr = gw->get_con_from_hdl(conn, ec);
    if(ec) _error<<"unable to get connection pointer from connection handle.";

    //XXX: please note that all this will go in vain if there if the NAT is 
    //not configured to preserve the source address of the connection and 
    //we are sitting behind a firewall.
    struct sockaddr addr;
    memset(&addr, 0, sizeof(addr));
    socklen_t addrlen = 0;
    _except(getpeername(cptr->get_raw_socket().native_handle(), &addr, &addrlen));
    std::string ipstr = "";
    int  port = 0;
    ipstr = cptr->get_remote_endpoint();
    int flag = 1;
    //The api key and the list of services requested are in the URI of the websocket.
    //Check whether the api key provided with the connection is valid or not.
    //Check whether all the services requested are valid. if not close the connection and mark IP as rogue. 
    //Check whether all the services are online or not, form a json response compiling all the online 
    //services in the system.
    rc = setsockopt(cptr->get_raw_socket().native_handle(), 
            IPPROTO_TCP, 
            TCP_NODELAY, 
            (char*)&flag, 
            sizeof(int));
    if (rc != 0) 
        _error<<"Error transitioning to real time. error:"
            <<strerror(errno);
    else _info<<"Connection transitioned to real time now.";
    int so_keepalive = 1;
    rc = setsockopt(cptr->get_raw_socket().native_handle(), 
            SOL_SOCKET, 
            SO_KEEPALIVE, 
            &so_keepalive, 
            sizeof(so_keepalive));
    if (rc != 0) 
        _error<<"Error enabling the keepalive on the connection. error:"
            <<strerror(errno);
    else _info<<"Enabling keep alive for the connection.";
    //send the initial information like services available and the clientid to 
    //use in further communication.
    networkConnection *nconn = new networkConnection(conn, ipstr, "");
    if (!nconn){
        _fatal<<"Server out of memory, no new connections can be created.";
        cptr->close(websocketpp::error::bad_connection, 
                "Server low on resources, Please re-connect.");
        return;
    }
    nconn->origin = cptr->get_origin();
    nconn->requestedSubProtocols = cptr->get_requested_subprotocols();
    nconn->subProtocol = cptr->get_subprotocol();
    _info<<"New connection opened. clientip: "<<std::string(ipstr)<<
        " port: "<<port<<
        " origin: "<<nconn->origin<<
        " subProtococol: "<<nconn->subProtocol;
    //Form the initial registration message which returns the service health 
    // so that client can choose to 
    //use which services can be requested.
    std::string success_or_fail = "success";
    JSONNode n(JSON_NODE);
    n.push_back(JSONNode("reg_status", success_or_fail));
    //get all the config elements which need to be pushed on to the client side 
    //things like the address of the stun server etc. more to follow in future.
    n.push_back(JSONNode("stun_server", stun_server));
    JSONNode c(JSON_ARRAY);
    c.set_name("services_list");
    //Add the connection to all the services requested.
    for(std::string& itr1 : svclist){
        serviceConnection *sc = getServiceConnObj(itr1);
        if(sc) sc->addClient(nconn->getConnId());
        nconn->registerSvc(itr1); //Add it to the network connection as well.
        JSONNode snode(JSON_NODE);
        tupl tv[] = {
            {"service", itr1}, 
            {"status", ((sc) && (sc->isUp())) ? std::string("up") : std::string("down")}
        };
        putJsonVal(tv, sizeof(tv)/sizeof(tupl), snode);
        c.push_back(snode);
    }
    n.push_back(c);
    std::string json = n.write_formatted();

    char authToken[1024*2] = {' '};
    char svcname[MAX_SERVICE_NAME_LEN] = "auth";
    int32_t clientid = htonl(nconn->getConnId());
    uint32_t dataSize = htonl(json.length());
    memcpy(authToken, svcname, sizeof(svcname)); //set the svcname
    memcpy(authToken + MAX_SERVICE_NAME_LEN, &dataSize, sizeof(int32_t)); //set the msglen
    memcpy(authToken + MAX_SERVICE_NAME_LEN + sizeof(dataSize),
            nonconst(json.c_str()),
            json.length());
    unsigned int payloadSize = json.length() + sizeof(dataSize) + \
                               MAX_SERVICE_NAME_LEN;
    cptr->send(authToken, payloadSize);
    nconn->informClientStatus2AllServices(true);
    return;
}


static void 
on_close(server *s, websocketpp::connection_hdl conn)
{
#ifdef LIMITED
    currentConnectionCount--;
#endif
    //inform all the services about the connection close.
    websocketpp::lib::error_code ec;
    server::connection_ptr cptr = gw->get_con_from_hdl(conn, ec);
    if(ec) _error<<"unable to get connection pointer from connection handle.";
    networkConnection *nobj = getNetworkConnObj(conn);
    _info<<"Connection closed ip: "<<nobj->_ipAddress<<
        " close_code:"<<cptr->get_remote_close_code()<<
        " close_reason:"<<cptr->get_remote_close_reason();
    nobj->informClientStatus2AllServices(false);
    delete nobj;
    return;
}

static void 
on_fail(server *s, websocketpp::connection_hdl conn)
{
    _info<<"connection failure.";
    networkConnection *nobj = getNetworkConnObj(conn);
    nobj->informClientStatus2AllServices(false);
    delete nobj;
    return;
}

static bool
on_ping(server *s, websocketpp::connection_hdl conn, std::string ping)
{
    _info<<"ping recvd with "<<ping;
    return true;
}

static void 
on_pong(server *s, websocketpp::connection_hdl conn, std::string pong)
{
    _info<<"pong recvd with "<<pong;
    return;
}

static void 
on_pong_timeout(server *s, websocketpp::connection_hdl conn)
{
    _info<<"pong wait timed out.";
    return;
}

static void 
interrupt_handler(server *s, websocketpp::connection_hdl conn)
{
    _info<<"connection interrupted.";
    return;
}

static void 
conn_fail_handler(server *s, websocketpp::connection_hdl conn)
{
    _error<<"conn_fail_handler(): details below";
    websocketpp::lib::error_code ec;
    server::connection_ptr cptr = gw->get_con_from_hdl(conn, ec);
    if(!ec){
        ec = cptr->get_ec();
        if(ec) _error<<"Connection failed. error_code:"<<ec
            <<"message : " <<cptr->get_ec().message();
    }
    return;
}

static bool
validate_handler(server *s, websocketpp::connection_hdl conn)
{
    //check whether all the services requested are active and 
    //then reply with only with the active services available.
    //client can choose to continue or not.
    _info<<"validation handler.";
#ifdef LIMITED
    if(currentConnectionCount == MAX_LIMITED_CONNECTION_COUNT)
    {
        _error<<"Your version of the product is a limited version for 10 users. \
            Please buy full version for more users.Thank you";
        return false;
    }
    currentConnectionCount++;
#endif
    websocketpp::lib::error_code ec;
    server::connection_ptr cptr = gw->get_con_from_hdl(conn, ec);
    if(ec) _error<<"unable to get connection pointer from connection handle.";
    //walk the resource string and extract the list of services.
    //check against the valid services. 
    //Add the connection to the service client list.
    svclist.clear();
    std::string resource = cptr->get_resource();
    _info<<"URI: "<<resource;
    const char *ptr = resource.c_str();
    ptr = strstr(ptr, "services");
    if (!ptr) return false;
    ptr += strlen("services");
    while((*ptr) && (*ptr != '=')) ptr++;
    ptr++; //skip the '='
    while(*ptr){
        unsigned int count = 0;
        char svcname[128], *ptr1 = svcname;
        memset(svcname, 0, sizeof(svcname));
        while((*ptr) && (*ptr != ',')){
            if(isspace(*ptr)){ ptr++;  continue; }
            *ptr1++ = *ptr++;
            count++;
        }
        //std::cerr<<"pushing: "<<std::string(svcname, count);
        svclist.push_back(std::string(svcname, count));
        if(*ptr) ptr++; //skip the ','
    }

    for(std::string& itr1 : svclist){
        //std::cerr<<"itr1: "<<itr1;
        if(!isSvcValid(itr1)){
            _error<<"connection requested invalid service: "
                <<itr1<<" terminated.";
            return false;
        }
    }
    return true;
}

//we are gauranteed that we will be woken up only when we recieve a
//complete websocket frame. so we dont need to be worried about the 
//framing issues any more. most of the times a complete service message
//will be encapsulated inside a websocket frame. if the service message 
//crosses a websocket frame boundary then we are in soup. we need to 
//assemble the service frame and the send it all once to the service.
static void 
on_message(server *s, websocketpp::connection_hdl conn, message_ptr msg)
{
    websocketpp::lib::error_code ec;
    _info<<"connection message.";
    networkConnection *nptr = getNetworkConnObj(conn);
    std::string payload = msg->get_payload();
    if (payload.length() > (2*OPTIMAL_BUF_SIZE)){
        _error<<"more payload recieved than allowed on conn: "
            <<nptr->getConnId();
        server::connection_ptr cptr = gw->get_con_from_hdl(conn, ec);
        cptr->close(websocketpp::error::bad_connection, 
                "more payload recieved than allowed on connection, limit 256kb");
        nptr->informClientStatus2AllServices(false);
        delete nptr;
        return;
    }
    nptr->_inputByteCount += (msg->get_header().size() + msg->get_payload().size());
    const char *ptr = payload.data(); //pointer to the raw buffer.
    std::string svcname = parseSvcName(ptr);
    serviceConnection *sconn = getServiceConnObj(svcname);
    //check if the message is destined for the network gateway itself.
    //this can be the heart beat message.
    if((!sconn) || (sconn && !(sconn->isUp()))){
        //FIXME: return back an error to the client as service is down.
        _error<<"service seems to be down. svcname:"<<svcname; 
        return;
    }
    bool trigger = (sconn->mqSize()) ? false : true;//Trigger a write only if the queue is empty.
    sconn->nq(msg);
    if(trigger) sconn->writeAsync(nptr);
    return;
}

networkConnection::networkConnection(websocketpp::connection_hdl wsppconn, 
        std::string ipaddress, 
        std::string useragent) :
    _wsppconn(wsppconn),
    _ipAddress(ipaddress),
    _userAgent(useragent)
{
    websocketpp::lib::error_code ec;
    server::connection_ptr cptr = gw->get_con_from_hdl(wsppconn, ec);
    if(ec) _error<<"unable to get connection pointer from connection handle.";
    _fd = cptr->get_raw_socket().native_handle();
    add2NtwConnList(this);
    return;
}

networkConnection::~networkConnection()
{
    _eintr(::close(_fd));
    delFromNtwConnList(this);
    _wsppconn.reset();
    //delete the clientid from all the service connection objects which the 
    //client has registered with.
    for(std::string& itr : _svcList){
        serviceConnection *sc = getServiceConnObj(itr);
        if(!sc){ _error<<"connection missing for service: "<<itr; continue; }
        sc->remClient(_fd);
    }
    return;
}

int 
networkConnection::getConnId() 
{ 
    return _fd; 
}

int 
networkConnection::getChannelId()
{
    return _channelId;
}

websocketpp::connection_hdl
networkConnection::getConnHdl()
{
    return _wsppconn;
}

void 
networkConnection::nq(message_ptr msg) 
{ 
    _mq.push(msg); 
    return; 
}

void
networkConnection::nq_broadcast() 
{
    return;
}

//send the first outgoing message on all the channels of the client.
void
networkConnection::broadcast()
{
    return;
}

message_ptr 
networkConnection::dq() 
{ 
    message_ptr m = _mq.front(); 
    _mq.pop(); 
    return m; 
}

void
networkConnection::send()
{
    websocketpp::lib::error_code ec;
    server::connection_ptr cptr = gw->get_con_from_hdl(_wsppconn, ec);
    if (!ec){
        ec = cptr->send(_mq.front());
        _info<<"network message put on wire.";
        if(!ec){
            _outputByteCount += (_mq.front()->get_header().size() + \
                    _mq.front()->get_payload().size());
            _mq.pop();
        }else{
            _error<<"There was an error sending message to client";
        }
    }else
        _error<<"There was an error getting connection ptr from connection handle.";
    return;
}

bool 
networkConnection::operator < (const networkConnection &b) 
{ 
    return _fd < b._fd; 
}

bool 
networkConnection::operator > (const networkConnection &b) 
{ 
    return _fd > b._fd; 
}

bool 
networkConnection::operator == (const networkConnection &b) 
{ 
    return _fd == b._fd; 
}

void 
networkConnection::registerSvc(std::string svc)
{
    _svcList.push_back(svc);
    return;
}

//accepting socket in to which new service connectsion will be accepted.
boost::asio::local::stream_protocol::socket *serviceConnection::_gSvcAcceptSocket;
static void
startServiceAccept(boost::asio::io_service *iosvc,
                   boost::asio::local::stream_protocol::acceptor *_acceptor)
{
    //XXX: this is a little confusing here how boost asio returns the new 'connected' socket.
    //we are preallocating a new socket here to hold the connected socket. This new socket 
    //will be a dummy one and becomes valid only when the accept handler (handleServiceAccept) is 
    //invoked.
    if(!serviceConnection::_gSvcAcceptSocket)
        serviceConnection::_gSvcAcceptSocket = \
        new boost::asio::local::stream_protocol::socket(*iosvc);
    _acceptor->async_accept(*serviceConnection::_gSvcAcceptSocket,
                            boost::bind(handleServiceAccept,
                                        iosvc,
                                        _acceptor,
                                        boost::asio::placeholders::error));
    return;
}

static void
startPeerConnAccept(boost::asio::io_service *iosvc,
                   boost::asio::ip::tcp::acceptor *_acceptor)
{
    //XXX: this is a little confusing here how boost asio returns the new 'connected' socket.
    //we are preallocating a new socket here to hold the connected socket. This new socket 
    //will be a dummy one and becomes valid only when the accept handler (handlePeerAccept) is 
    //invoked.
    if(!gPeerAcceptSocket) gPeerAcceptSocket = \
     new boost::asio::ip::tcp::socket(*iosvc);
    _acceptor->async_accept(*gPeerAcceptSocket,
                            boost::bind(handlePeerAccept,
                                        iosvc,
                                        _acceptor,
                                        boost::asio::placeholders::error));
    return;
}

static void
handlePeerAccept(boost::asio::io_service *iosvc,
                    boost::asio::ip::tcp::acceptor *_acceptor,
                    const boost::system::error_code &error)
{
    _info<<"New peer connection from :";
    startPeerConnAccept(iosvc, _acceptor);
    return;
}

static void
handleServiceAccept(boost::asio::io_service *iosvc,
                    boost::asio::local::stream_protocol::acceptor *_acceptor,
                    const boost::system::error_code &error)
{
    //do a synchronous read and then read the service name from the 
    //connection.
    char sbuf[32] = {'\0'};
    _info<<"native handle of the connection: "<<
        serviceConnection::_gSvcAcceptSocket->native_handle();
    size_t rc = serviceConnection::_gSvcAcceptSocket->read_some(
            boost::asio::buffer(sbuf, 
                32));
    std::string sname(sbuf, rc);
    _info<<"New service connection from service:"<<sname;
    //if the service is not present in the list then create a new one and 
    //mark it initialized.
    bool _new = false;
    serviceConnection *sobj = getServiceConnObj(sname), *old = nullptr;
    if (sobj){
        //send a error message on control channel to the service and close the
        //connection.
        _error<<"Stale service handle already present for the service, \
            reinitializing the service handle.";
        old = sobj;
        sobj = nullptr;
    }
    if(!sobj){
        _new = true;
        sobj = new serviceConnection(iosvc, sname, -1);
        //copy the client list from the old service object to the new object.
        if (old){
            sobj->clientList.insert(old->clientList.begin(), old->clientList.end());
            delete old;
        }
    }
    sobj->setMqFd(serviceConnection::openSvcMessageQueue(sname));
    sobj->setSocket(serviceConnection::_gSvcAcceptSocket);
    sobj->markUp();
    sobj->informSvcStatus2AllClients("up");
    //relay a series of clientArrival for all the existing channels and connections. 
    //already in the service connection object.
    if(!_new) sobj->relayClientAndChannel2Service();
    sobj->readAsync();
    startServiceAccept(iosvc, _acceptor);
    return;
}

static void
handleMqRead(boost::system::error_code ec)
{
    _info<<"control message from service.";
    service::controlMessage cmsg;
    networkConnection *nobj = nullptr;
    memset(&cmsg, 0, sizeof(cmsg));
    int rc = _except(::mq_receive(gwMqFd->native_handle(), 
                       reinterpret_cast<char*>(&cmsg), 
                       sizeof(cmsg), 
                       nullptr));
    assert(rc == sizeof(cmsg));
    switch(cmsg.messageType)
    {
        case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT:
            _info<<"recvd disconnect message from service for client:"<<
                cmsg.clientDisconnect.clientid;
            nobj = getNetworkConnObj(cmsg.clientDisconnect.clientid);
            assert(nobj);
            nobj->informClientStatus2AllServices(false);
            delete nobj;
            break;
        default:
            _error<<"unknown message type from the service.";
            break;
    }
    gwMqFd->async_read_some(boost::asio::null_buffers(),
            boost::bind(&handleMqRead,
            boost::asio::placeholders::error));
    return;
}

static void 
newPeerArrival(const boost::system::error_code& error,
      size_t bytes_recvd)
{
    if (!error)
    {
        _info<<"new peer arrived";
        multicast_socket.async_receive_from(
                boost::asio::buffer(recvBuf, sizeof(recvBuf)), 
                multicast_sender_endpoint,
                boost::bind(&newPeerArrival,
                    boost::asio::placeholders::error,
                    boost::asio::placeholders::bytes_transferred));
    }
    return;
}

//invoked when normal http requests arrive on the port.
//these are forwarded to the http server as is and the response from the http server is 
//sent back to the client.
#ifdef  HTTP_TUNNEL_SUPPORT 
static void
handleHttpRequestAndResponse(server::connection_ptr con,
        boost::asio::ip::tcp::socket *socket)
{
    _info<<"handleHttpRequestAndResponse():";
    //FIXME: make the webserver address configurable.
    boost::asio::ip::tcp::endpoint http_server_endpoint(
            boost::asio::ip::address::from_string("127.0.0.1"), 
            80);
    socket->connect(http_server_endpoint);
    auto httpRequest = con->get_request();
    std::cerr<<"request:"<<httpRequest.raw();
    socket->send(boost::asio::buffer(httpRequest.raw()));
    boost::asio::streambuf response; //automatically grows to accomodate.
    boost::system::error_code error;
    while (boost::asio::read(*socket, 
                response, 
                boost::asio::transfer_at_least(1), 
                error))
        if (error != boost::asio::error::eof){
            _error<<"error reading from the http socket:"<<error.category().name();
            con->set_status(websocketpp::http::status_code::internal_server_error);
            return;
        }
    std::istream is(&response);
    std::string httpResponse;
    is >> httpResponse; //just like scanf write the characters to the string.
    std::cerr<<"response:"<<httpResponse;
    int _fd = con->get_raw_socket().native_handle(); //get the native socket handle and write the whole shit to the client.
    assert(_fd >= 0);
    boost::asio::ip::tcp::socket httpConnection(gIoSvc);
    httpConnection.assign(boost::asio::ip::tcp::v4(), 
            _fd); //FIXME: how do we rewrite it for v6() ?
    int rc = boost::asio::write(httpConnection,
            boost::asio::buffer(httpResponse.c_str(),
                httpResponse.length()));
    if(rc <= 0) 
        _error<<"error writing to the http socket. error:"
            <<std::string(strerror(errno));
    con->set_status(websocketpp::http::status_code::ok);
    return;
}
#endif

#ifdef  HTTP_TUNNEL_SUPPORT 
static void
tunnelHttp(server*s, websocketpp::connection_hdl hdl) 
{
    _info<<"http request:";
    server::connection_ptr con = gw->get_con_from_hdl(hdl);
    boost::asio::ip::tcp::socket *socket = new boost::asio::ip::tcp::socket(gIoSvc);
    httpWorkerPool->enqueue(std::bind(&handleHttpRequestAndResponse, con, socket)); 
    return;
}
#endif

//read the network gateway configuration and populate the variables. 
//also valuate the configuration and throw any exceptions if there 
//any errors.
static void 
readConfig()
{
    interface_address = getConfigValue<std::string> ("ngw.interface_address");
    gw_port = getConfigValue<int>("ngw.gateway_port");
    debug_level = getConfigValue<std::string>("ngw.debug_level");
    log_file = getConfigValue<std::string>("ngw.log_file");
    peer_multicast_address = getConfigValue<std::string>("ngw.peer_multicast_address");
    peer_multicast_port = getConfigValue<int>("ngw.peer_multicast_port");
    peer_connection_port = getConfigValue<int>("ngw.peer_connection_port");
    ssl_certificate = getConfigValue<std::string>("ngw.server_certificate");
    ssl_certificate_key = getConfigValue<std::string>("ngw.server_certificate_key");
    stun_server = getConfigValue<std::string>("rtc.stun_server");
    return;
}

static void 
dumpConfig()
{
    _trace<<"interface_address: "<<interface_address;
    _trace<<"gw_port: "<<gw_port;
    _trace<<"debug_level: "<<debug_level;
    _trace<<"log_file: "<<log_file;
    _trace<<"peer_multicast_address: "<<peer_multicast_address;
    _trace<<"peer_multicast_port: "<<peer_multicast_port;
    _trace<<"peer_connection_port: "<<peer_connection_port;
    _trace<<"server ssl certificate: "<<ssl_certificate;
    _trace<<"server ssl certificate key: "<<ssl_certificate_key;
    return;
}

#ifdef AKORP_SSL_CAPABLE
static std::string 
get_password() 
{
    return "";
}

static context_ptr 
negotiate_tls(websocketpp::connection_hdl hdl)
{
    _info<< "negotiate_tls() called with hdl: " << hdl.lock().get();
    context_ptr ctx(new boost::asio::ssl::context(boost::asio::ssl::context::tlsv1));
    try 
    {
        ctx->set_options(boost::asio::ssl::context::default_workarounds |
                //boost::asio::ssl::context::no_sslv2 |
                boost::asio::ssl::context::single_dh_use);
        ctx->set_password_callback(bind(&get_password));
        ctx->use_certificate_chain_file(ssl_certificate);
        ctx->use_private_key_file(ssl_certificate_key, boost::asio::ssl::\
                context::pem);
    }
    catch (std::exception& e)
    {
        _error<< e.what() << std::endl;
    }
    return ctx;
}
#endif

struct destroyNtwConn
{ 
    void operator()(networkConnection *ntw) 
    {
            assert(ntw);
            delete ntw; 
    }
};

static void
handleSignal(boost::system::error_code error)
{
    if (error){ 
        _error<<"handleSignal() encountered an exception."<<
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
            _error<<"handleSignal() ::read() on signalfd returns inconsistent \
                size. size:"<<s;
            THROW_ERRNO_EXCEPTION;
        }

        if(fdsi.ssi_signo == SIGTERM){
           ntwConnList.erase_and_dispose(ntwConnList.begin(), 
                   ntwConnList.end(),
                   std::bind(destroyNtwConn(), 
                       std::placeholders::_1));
           _info<<"Got SIGTERM from operating system exiting now.";
           exit(0);
        }else
            _error<<"Unhandled signal recieved dropped signum: "<<fdsi.ssi_signo;
    }while(s > 0);
    signalChannel.async_read_some(boost::asio::null_buffers(),
            boost::bind(&handleSignal,
                boost::asio::placeholders::error));
    return;
}

int
main(int argc, char* argv[])
{
    try{
        _except(daemon(0, 1)); //daemonize ourselves and detach from the controlling terminal.

        //load the configuration file in to the memory.
        loadConfig("/etc/antkorp/antkorp.cfg");
        readConfig();

        //Open the log file.
        openLog(log_file);
        setLogLevel(SEVERITY_TRACE);
        dumpConfig();

        if(debug_level == "info")  setLogLevel(SEVERITY_INFO);
        else if(debug_level == "error") setLogLevel(SEVERITY_ERROR);
        else if(debug_level == "warning") setLogLevel(SEVERITY_WARNING);
        else if(debug_level == "fatal") setLogLevel(SEVERITY_FATAL);
        else if(debug_level == "debug") setLogLevel(SEVERITY_DEBUG);
        else if(debug_level == "trace") setLogLevel(SEVERITY_TRACE);

        //Create the thread pool to handle the http requests and send them to the apache.
        //A whole thread gets blocked during the period of http request and response. if 
        //there is a huge influx then requests might get dropped.
#ifdef  HTTP_TUNNEL_SUPPORT 
        _info<<"HTTP Tunneling support is enabled.";
        httpWorkerPool = new ThreadPool(100);
        _info<<"Thread pool created with 60 batch count:";
#endif

#ifdef LIMITED
        _info<<"Network gateway limited connection version booting.";
#else
        _info<<"Network gateway unlimited version booting.";
#endif

        //set the core file limit as unlimited. 
        struct rlimit lim = {RLIM_INFINITY, RLIM_INFINITY};
        _except(::setrlimit(RLIMIT_CORE, &lim));
#ifdef AKORP_SSL_CAPABLE
        _info<< "Starting gateway server on: " << gw_port<< std::endl;
#else
        _info<< "Starting secure gateway server on: " << gw_port<< std::endl;
#endif
        //install signal handlers
        sigemptyset(&mask);
        sigfillset(&mask); //except SIGKILL ofcourse
        _except(sigprocmask(SIG_BLOCK, &mask, NULL));
        int sFd = _except(signalfd(-1, &mask, SFD_NONBLOCK | SFD_CLOEXEC));
        signalChannel.assign(sFd);
        signalChannel.async_read_some(boost::asio::null_buffers(), 
                boost::bind(&handleSignal,
                    boost::asio::placeholders::error));

        std::string mqName = AKORP_GW_MQ_NAME;
        struct mq_attr mattr = {0, 10, sizeof(service::controlMessage), 0};
        //open the network gateway message queue and add it to the boost ioservice.
        int mqfd = _except(::mq_open(mqName.c_str(), O_RDWR | O_CREAT | O_NONBLOCK,\
                    0660, NULL));
        //int mqfd = _except(::mq_open(mqName.c_str(), O_RDWR | O_CREAT | O_NONBLOCK, 0660, &mattr));
        assert(mqfd > 0);
        gwMqFd = new boost::asio::posix::stream_descriptor(gIoSvc);
        gwMqFd->assign(mqfd);
        //hook up the read call to the message queue.
        gwMqFd->async_read_some(boost::asio::null_buffers(),
                boost::bind(&handleMqRead,
                    boost::asio::placeholders::error));

        ::unlink(AKORP_SVC_ENDPOINT); //Remove previous binding.
        //open up the unix domain service channel.     
        boost::asio::local::stream_protocol::endpoint svcConnEndpoint(AKORP_SVC_ENDPOINT);
        boost::asio::local::stream_protocol::acceptor svcConnAcceptor(gIoSvc, svcConnEndpoint);
        startServiceAccept(&gIoSvc, &svcConnAcceptor);

        //open the peer connection interface. This interface will be used for other peers to 
        //connect with us.
        _info<<"Trying to open the peer connection port, this will be used for \
            accepting peer connections.";
        boost::asio::ip::tcp::endpoint peerConnEndpoint(
                boost::asio::ip::tcp::v4(), 
                peer_connection_port);
        boost::asio::ip::tcp::acceptor peerConnAcceptor(gIoSvc, 
                peerConnEndpoint);
        startPeerConnAccept(&gIoSvc, &peerConnAcceptor);
        _info<<"Peer connection port opened successfully.";
        //open up the multicast channel 
        //new peers will announce themselves on this channel. 
        //once we announce ourselves the other peers will connect to use via tcp.
        //forming a star topology.
        _info<<"Trying to open the multicast channel and join the group.";
        boost::asio::ip::address_v4 multicast_address = \
        boost::asio::ip::address_v4::from_string(peer_multicast_address); 
        boost::asio::ip::udp::endpoint multicast_endpoint(\
                boost::asio::ip::udp::v4(), 
                peer_multicast_port);
        multicast_socket.open(multicast_endpoint.protocol());
        multicast_socket.set_option(boost::asio::ip::udp::socket::reuse_address(true));
        multicast_socket.bind(multicast_endpoint);
        multicast_socket.set_option(
                boost::asio::ip::multicast::join_group(multicast_address));
        multicast_socket.async_receive_from(
                boost::asio::buffer(recvBuf, sizeof(recvBuf)), 
                multicast_sender_endpoint,
                boost::bind(&newPeerArrival, 
                    boost::asio::placeholders::error, 
                    boost::asio::placeholders::bytes_transferred));
        _info<<"Opened the multicast channel and join the group successfully.";
        _info<<"Announcing arrival to peers on multicast channel.";
        //put some thing on the channel to tell we have arrived.
        //mostly this will be ip address.
        //do it 3 times in a loop with a 1 sec interval, this is just to ensure 
        //that no packets are lost.
#if 0
        unsigned int announceCount = 3;
        while(announceCount--){
            multicast_socket.send(boost::asio::buffer(sendBuf, sizeof(sendBuf)));
            sleep(1);
        }
        _info<<"Total 3 Announcements were made with an interval of 1 sec.";
#endif
        _info<<"Trying to open the main port to the world.";
        gw = new server();
        if ((debug_level == "debug") || (debug_level == "info"))
        {
            gw->set_access_channels(websocketpp::log::alevel::all);
            gw->set_error_channels(websocketpp::log::elevel::all);
        }
        gw->clear_access_channels(websocketpp::log::alevel::all);
        gw->init_asio(&gIoSvc);
        gw->set_open_handler(websocketpp::lib::bind(&on_open, 
                    gw, 
                    websocketpp::lib::placeholders::_1));
        gw->set_close_handler(websocketpp::lib::bind(&on_close, 
                    gw, 
                    websocketpp::lib::placeholders::_1));
        gw->set_interrupt_handler(websocketpp::lib::bind(&interrupt_handler, 
                    gw, 
                    websocketpp::lib::placeholders::_1));
        gw->set_fail_handler(websocketpp::lib::bind(&conn_fail_handler, 
                    gw, 
                    websocketpp::lib::placeholders::_1));
        gw->set_validate_handler(websocketpp::lib::bind(&validate_handler, 
                    gw, 
                    websocketpp::lib::placeholders::_1));
        gw->set_ping_handler(websocketpp::lib::bind(&on_ping, 
                    gw,
                    websocketpp::lib::placeholders::_1,
                    websocketpp::lib::placeholders::_2));
        gw->set_pong_handler(websocketpp::lib::bind(&on_pong,
                    gw,
                    websocketpp::lib::placeholders::_1,
                    websocketpp::lib::placeholders::_2));
        gw->set_pong_timeout_handler(websocketpp::lib::bind(&on_pong, 
                    gw,
                    websocketpp::lib::placeholders::_1,
                    websocketpp::lib::placeholders::_2));
        gw->set_message_handler(websocketpp::lib::bind(&on_message, 
                    gw,
                    websocketpp::lib::placeholders::_1, 
                    websocketpp::lib::placeholders::_2));
#ifdef AKORP_SSL_CAPABLE
        gw->set_tls_init_handler(bind(&negotiate_tls,::_1));
#endif

#ifdef  HTTP_TUNNEL_SUPPORT
        gw->set_http_handler(websocketpp::lib::bind(&tunnelHttp, 
                    gw,
                    websocketpp::lib::placeholders::_1
                    ));
#endif
        gw->listen(boost::asio::ip::tcp::endpoint(
                    boost::asio::ip::address::from_string(
                        interface_address), 
                    gw_port));
        gw->start_accept();
        _info<< "Gateway server booted succesfully. Maximum payload message is 256kb.";
        gw->run();
    }
    catch(std::exception& e)
    {
        _error<< "Exception: " << e.what() << std::endl;
        return -1;
    }
    return 0;
}
