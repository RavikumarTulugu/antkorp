#include <Qt/qcoreevent.h>
#include <QtCore/qobject.h>
#include <QtCore/qthread.h>
#include <QtCore/qeventloop.h>
#include <QtCore/qglobal.h>
#include <QtGui/private/qguiapplication_p.h>
#include <qplatformwindow_qpa.h>
#include <QtGui/QGuiApplication>
#include <QtGui/qevent.h>
#include <QSocketNotifier>
#include <QTimer>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/errno.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <mqueue.h>
#include <signal.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <assert.h>
#include <BufferedStreamBuf.h>
#include <cstring>
#include <cstdio>
#include <stdint.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#undef signals 
#include "broadway.h"
#include "akorphtml.h"
#include <glib.h>
#include <gdk.h>
#include <common.hh>

char inputBuf[4096] = {0}; //input buffer to which input is read 

class keyEventFilter: public QObject
{
	public:
		keyEventFilter():QObject() {};
		~keyEventFilter(){};

		bool eventFilter(QObject* object,QEvent* event) {
			if(event->type() == QEvent::KeyPress) 
				fprintf(stderr,"\nKeyPress Event Intercepted");
			return QObject::eventFilter(object, event);
		};
};

typedef struct 
{
	char mType;
	uint32_t serialNumber;
	uint64_t timeStamp;
}header;

typedef struct 
{
	uint32_t mouseWindowId; 
	uint32_t eventWindowId; 
	uint32_t rootX; 
	uint32_t rootY; 
	uint32_t winX;
	uint32_t winY;
	uint32_t state;
}pointerInfo;

typedef struct
{
	header hdr;
	pointerInfo pinfo; 
	uint32_t mode;
}mouseCrossingMesg;

typedef struct 
{
	header hdr;
	pointerInfo pinfo; 
	uint32_t    button;
}buttonPressMesg;


typedef struct 
{
	header hdr;
	pointerInfo pinfo; 
	uint32_t    direction;
}scrollMesg;


typedef struct 
{
	header hdr;
	uint32_t state; 
	uint32_t key;
}keyInputMsg;

typedef struct 
{
	header hdr;
	uint32_t res; //response of the grab request from the server 
}inputGrabReply;

typedef struct 
{
	header hdr;
	uint32_t id;
	uint32_t x;
	uint32_t y;
	uint32_t width;
	uint32_t height;
}configureEvent;

typedef struct 
{
	header hdr;
	uint32_t height;
	uint32_t width;
}screenResizeEvent; 

typedef struct 
{
	header hdr;
	uint32_t winId;
} winDeleteEvent;

#define _getHdr(hptr, ptr){ \
	(hptr)->mType = *ptr;   \
	ptr++;					\
	(hptr)->serialNumber = strtol(ptr, &ptr, 10);  \
	ptr++; \
	(hptr)->timeStamp = strtol(ptr, &ptr, 10); \
	ptr++; \
}

#define _getPtrInfo(msg, ptr){ \
	msg->pinfo.mouseWindowId = strtol(ptr, &ptr, 10); \
	ptr++; \
	msg->pinfo.eventWindowId = strtol(ptr, &ptr, 10); \
	ptr++; \
	msg->pinfo.rootX = strtol(ptr, &ptr, 10); \
	ptr++; \
	msg->pinfo.rootY = strtol(ptr, &ptr, 10); \
	ptr++; \
	msg->pinfo.winX = strtol(ptr, &ptr, 10); \
	ptr++; \
	msg->pinfo.winY = strtol(ptr, &ptr, 10); \
	ptr++; \
	msg->pinfo.state = strtol(ptr, &ptr, 10); \
	ptr++; \
}

#define _printPinfo(pinfo) { \
	fprintf(stderr,"\n%s: mouseWindowId:%u, eventWindowId:%u, rootX:%u, rootY:%u, winX:%u, winY:%u, state:%u",\
			__FUNCTION__, \
			(pinfo)->mouseWindowId,  \
			(pinfo)->eventWindowId,  \
			(pinfo)->rootX,  \
			(pinfo)->rootY, \
			(pinfo)->winX, \
			(pinfo)->winY, \
			(pinfo)->state); \
}


using namespace std;
//using namespace Poco;

#define AKORP_SVC_ENDPOINT "/home/rk/akorp/server/src/akorp_svc_endpoint"
#define AKORP_GW_ENDPOINT "akorp_gw_endpoint"

int windowIdFile;

char mySvcId[16];
int  myClientId;  //Client id which i am talking to 

akorpHtmlConnection::akorpHtmlConnection() :
sockStream(1024*1024, std::ios_base::out)
{
	//Create a message queue to recieve the clienid value from the dmgr 
	//dmgr recieves the client id as part of the doc open command.
	char mqname[32] = {'\0'};
	sprintf(mqname, "/dmgr%d", getpid());
	fprintf(stderr,"\nchild: I am opening mqname: %s",mqname);
	struct mq_attr mattr; 
	mattr.mq_flags = 0;
	mattr.mq_maxmsg = 1; 
	mattr.mq_msgsize = 32;
	mattr.mq_curmsgs = 0;
	int mq = mq_open(mqname, O_CREAT| O_RDONLY, 0644, &mattr);
	if (mq < 0) { perror ("Unable to open the mq"); exit(1); }

	char recvBuf[32] = {'\0'};
	int rc = mq_receive(mq, recvBuf, sizeof(recvBuf), NULL);
	if (rc < 0) { perror ("Unable to receive from mq"); exit(1); }
	myClientId = atoi(recvBuf);
	fprintf(stderr,"\nChild: received clientid:%d ", myClientId);

	mq_close(mq); //close the mq
	mq_unlink(mqname); //remove the mq

	struct sockaddr_in server;
	gwSocketId = socket(AF_INET, SOCK_STREAM, 0); 
	if (gwSocketId < 0) {
		fprintf(stderr,"opening stream socket failed");
		exit(1);
	}

	server.sin_family      = AF_INET;
	server.sin_addr.s_addr = INADDR_ANY;
	server.sin_port        = htons(8890);
	if (::connect(gwSocketId,
				(struct sockaddr *) &server,
				sizeof(struct sockaddr_in)) < 0) {
		close(gwSocketId);
		fprintf(stderr,"connecting socket failed reason:%s",strerror(errno));
		exit(1);
	}

    int flag = 1;
    rc = setsockopt(gwSocketId, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));
    if(rc<0) perror("Unable to set the TCP_NODELAY flag for the socket");

	//set the fd to be nonblocking
	if (fcntl (gwSocketId, F_SETFL, O_NONBLOCK) < 0) perror("failed to set the gwSocket to be nonblocking");

	sprintf(mySvcId,"dmgr%d", getpid());
	rc = _eintr(write(gwSocketId, mySvcId, sizeof(mySvcId)));
	if (rc < 0) {
		fprintf(stderr,"writing on stream socket failed");
		exit(1);
	}

	//try to see if the windowid file is there or not if not there try to create it
	windowIdFile = ::open("/tmp/windowIdFile", O_RDWR);
	if (windowIdFile < 0) { 
		perror("Unable to open the \"/tmp/windowIdFile\", \
				This file should have been created by the gateway daemon during system bootup"); 
		exit(1); 
	}

	gBroadwayOut = broadway_output_new(gFrameSerial, gwSocketId);
	assert(gBroadwayOut);
	
	//set the output socket as gwSocketId for the window manager commands 
	sockStream.setSock(gwSocketId);

	//Create a socket notifier and register it with the qt system
	//Also connect the processEvents to the emit and wakeup signals 
	//of the event dispatcher.
	QSocketNotifier *notifier = new QSocketNotifier(gwSocketId, QSocketNotifier::Read, this);
	connect(notifier, SIGNAL(activated(int)), this, SLOT(processClientEvents()));
	QAbstractEventDispatcher *dispatcher = QGuiApplicationPrivate::eventDispatcher;
	connect(dispatcher, SIGNAL(aboutToBlock()), this, SLOT(processClientEvents()));
	connect(dispatcher, SIGNAL(awake()), this, SLOT(processClientEvents()));
	return;
}

void
akorpHtmlConnection::idleTimerCallback(void) 
{
	fprintf(stderr,"\nTimer fired");
	return;
}

akorpHtmlConnection::~akorpHtmlConnection() 
{
	close(gwSocketId);
	return;
}

int
akorpHtmlConnection::getGwConnId(void) 
{
	return gwSocketId;
}

BroadwayOutput*
akorpHtmlConnection::getBroadwayOut(void)
{
	return gBroadwayOut;
}

extern "C" BroadwayOutput* broadway_output_new(unsigned int, int);

static inline bool 
parseCrossMesg(char *buf, mouseCrossingMesg *msg)
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	_getPtrInfo(msg, ptr);
	msg->mode        = strtol(ptr, &ptr, 10);
#if 0
	_printPinfo(&msg->pinfo);
	fprintf(stderr,"msg->mode:%u", msg->mode);
#endif 
	return true; 
}

static inline bool 
parseButtonPressMsg(char *buf, buttonPressMesg *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	_getPtrInfo(msg, ptr);
	msg->button = strtol(ptr, &ptr, 10);
#if 0
	_printPinfo(&msg->pinfo);
	fprintf(stderr,"msg->mode:%u", msg->button);
#endif
	return true; 
}

static inline bool 
parseMouseScrollMesg(char *buf, scrollMesg *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	_getPtrInfo(msg, ptr);
	msg->direction = strtol(ptr, &ptr, 10);
#if 0
	_printPinfo(&msg->pinfo);
	fprintf(stderr,"msg->mode:%u", msg->direction);
#endif 
	return true; 
}

static inline bool 
parseKeyMesg(char *buf, keyInputMsg *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	msg->key = strtol(ptr, &ptr, 10);
	ptr++;
	msg->state = strtol(ptr, &ptr, 10);
#if 0
	fprintf(stderr,"\nmsg->key:%u msg->state:%u", msg->key, msg->state);
#endif 
	return true; 
}

static inline bool 
parseGrabReply(char *buf, inputGrabReply *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	msg->res = strtol(ptr, &ptr, 10);
	return true; 
}

static inline bool 
parseWindowResizeEvent(char *buf, configureEvent *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	msg->id = strtol(ptr, &ptr, 10);
	ptr++;
	msg->x = strtol(ptr, &ptr, 10);
	ptr++;
	msg->y = strtol(ptr, &ptr, 10);
	ptr++;
	msg->width = strtol(ptr, &ptr, 10);
	ptr++;
	msg->height = strtol(ptr, &ptr, 10);
	ptr++;
	return true; 
}

static inline bool 
parseWindowCloseEvent(char *buf, winDeleteEvent *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	msg->winId = strtol(ptr, &ptr, 10);
	return false; 
}

static inline bool 
parseScreenConfEvent(char *buf, screenResizeEvent *msg) 
{ 
	char *ptr = buf;
	_getHdr(&msg->hdr, ptr);
	return false; 
}

//Translate a gdk event type to qt event type 
//Broadway front end sends gdk event types we have to xlate them to qt events
static Qt::MouseButton
xlateGdkButtonToQtButton(int gdkButton)
{
	switch(gdkButton) {
		//Mouse button masks 
		case 1: return Qt::LeftButton;
		case 2: return Qt::MiddleButton;
		case 3: return Qt::RightButton;
		default:
			fprintf(stderr,"\n%s:Unknown input unable to xlate", __FUNCTION__);
			return Qt::NoButton;
	}
}

static Qt::MouseButtons
xlateGdkButtonToQtButtons (int state)
{
	Qt::MouseButtons ret = 0;
	if (state & GDK_BUTTON1_MASK) ret |= Qt::LeftButton;
	if (state & GDK_BUTTON2_MASK) ret |= Qt::MiddleButton;
	if (state & GDK_BUTTON3_MASK) ret |= Qt::RightButton;
	return ret;
}

extern QWindow *getWindowRef(int );

void
dispatchEventsToQt(char *evBuf)
{
	char *ptr = evBuf;
	QEvent::Type keyEventType = QEvent::None;
	header base; 
	memset(&base, 0, sizeof(header));
	//Extract the header part first 
	_getHdr(&base, ptr);
	//fprintf(stderr,"\n%s", evBuf);
	switch(base.mType)
	{
		case 'm': //Mouse pointer movement 
			{
				mouseCrossingMesg mouseCross;
				memset(&mouseCross, 0, sizeof(mouseCross));
				//broadway client still sends events when the mouse is not present on 
				//any surface these events need to be ignored. There are too many of them.
				parseCrossMesg(evBuf, &mouseCross);
				//fprintf(stderr,"\n%s: Mouse move event", __FUNCTION__);
				if (mouseCross.pinfo.mouseWindowId && mouseCross.pinfo.eventWindowId) {
					QPointF local(mouseCross.pinfo.winX, mouseCross.pinfo.winY);
					QPointF global (mouseCross.pinfo.rootX, mouseCross.pinfo.rootY);
					QWindow *win = getWindowRef(mouseCross.pinfo.mouseWindowId);
					Qt::MouseButtons buttons = xlateGdkButtonToQtButtons(mouseCross.pinfo.state);
					//it might happen the window is deleted but still the broadway client sends 
					//the old window id in the cross message. in that case the window handle will 
					//be missing as the window is gone long back.
					if (win) {
						QWindowSystemInterface::handleMouseEvent(win,
								mouseCross.hdr.timeStamp,
								local,
								global,
								buttons);
					}
				}
			}
			break;
		case 's': //Mouse wheel movement
			{
				//NOTE: The broadway client does not send the pixelDelta and the angledelta 
				//parameters. so we use a common guess for these 2 values and run the show 
				//for now.
				scrollMesg scroll;
				memset(&scroll, 0, sizeof(scroll));
				parseMouseScrollMesg(evBuf, &scroll);
				if (scroll.pinfo.mouseWindowId || scroll.pinfo.eventWindowId) {
					QPointF local  (scroll.pinfo.winX, scroll.pinfo.winY);
					QPointF global (scroll.pinfo.rootX, scroll.pinfo.rootY);
					//QPoint pixelDelta (0, 0);
					//QPoint angleDelta (scroll.direction ? 115 : -115, scroll.pinfo.winY);
					QWindow *win = getWindowRef(scroll.pinfo.mouseWindowId);
					assert(win);
					QWindowSystemInterface::handleWheelEvent(win,
							scroll.hdr.timeStamp,
							local,
							global,
							scroll.direction ? 30 : -30,
							Qt::Vertical
							);
				}
			}
			break;
		case 'b': //Mouse button Down 
			{
				buttonPressMesg bPressDown;
				memset(&bPressDown, 0, sizeof(bPressDown));
				parseButtonPressMsg(evBuf, &bPressDown);
				//fprintf(stderr,"\n%s: Button down event", __FUNCTION__);
				if (bPressDown.pinfo.mouseWindowId && bPressDown.pinfo.eventWindowId) {
					QPointF local(bPressDown.pinfo.winX, bPressDown.pinfo.winY);
					QPointF global (bPressDown.pinfo.rootX, bPressDown.pinfo.rootY);
					Qt::MouseButtons buttons = xlateGdkButtonToQtButtons(bPressDown.pinfo.state);
					Qt::MouseButton button  = xlateGdkButtonToQtButton(bPressDown.button);
					buttons ^= button;
					QWindow *win = getWindowRef(bPressDown.pinfo.mouseWindowId);
					if (win) {
						QWindowSystemInterface::handleMouseEvent(win, 
								bPressDown.hdr.timeStamp, 
								local, 
								global, 
								buttons);
						//activate the window and set the focus 
						QWindowSystemInterface::handleWindowActivated(win);
					}
				}
			}
			break;
		case 'B': //Mouse button Up
			{
				buttonPressMesg bPressUp;
				memset(&bPressUp, 0, sizeof(bPressUp));
				parseButtonPressMsg(evBuf, &bPressUp);
				//fprintf(stderr,"\n%s: Button up event", __FUNCTION__);
				if (bPressUp.pinfo.mouseWindowId && bPressUp.pinfo.eventWindowId) {
					QPointF local(bPressUp.pinfo.winX, bPressUp.pinfo.winY);
					QPointF global (bPressUp.pinfo.rootX, bPressUp.pinfo.rootY);
					Qt::MouseButtons buttons = xlateGdkButtonToQtButtons(bPressUp.pinfo.state);
					Qt::MouseButton button = xlateGdkButtonToQtButton(bPressUp.button);
					buttons ^= button;
					QWindow *win = getWindowRef(bPressUp.pinfo.mouseWindowId);
					if (win) {
						QWindowSystemInterface::handleMouseEvent(win, 
								bPressUp.hdr.timeStamp, 
								local, 
								global, 
								buttons);
					}
				}
			}
			break;
		case 'e': //Mouse enters the window 
			{
				mouseCrossingMesg mouseCross;
				memset(&mouseCross, 0, sizeof(mouseCross));
				parseCrossMesg(evBuf, &mouseCross);
				QWindow *win = getWindowRef(mouseCross.pinfo.eventWindowId);
				QWindowSystemInterface::handleEnterEvent(win);
			}
			break;
		case 'l': //Mouse leaves the window 
			{
				mouseCrossingMesg mouseCross;
				memset(&mouseCross, 0, sizeof(mouseCross));
				parseCrossMesg(evBuf, &mouseCross);
				QWindow *win = getWindowRef(mouseCross.pinfo.eventWindowId);
				QWindowSystemInterface::handleLeaveEvent(win);
			}
			break;
		case 'k': //keyboard key pressed
			keyEventType = QEvent::KeyPress; //Fall through case
		case 'K': //keyboard key Released
			{
				if (keyEventType != QEvent::KeyPress) keyEventType = QEvent::KeyRelease;

				keyInputMsg key;
				memset(&key, 0, sizeof(key));
				parseKeyMesg(evBuf, &key);
				QString keyStr;
#if 0
				if ((key.key > 255) && (key.key < 0xff00))  {
					fprintf(stderr,"\nSorry we dont support unicode keyboard yet");
					return;
				}
#endif 
				keyStr = QChar(key.key);
				Qt::KeyboardModifiers qtMod = Qt::NoModifier;
				if (key.state & GDK_SHIFT_MASK) qtMod |= Qt::ShiftModifier;
				if (key.state & GDK_CONTROL_MASK) qtMod |= Qt::ControlModifier;
				if (key.state & GDK_MOD1_MASK) qtMod |= Qt::AltModifier;
				if (key.state & GDK_META_MASK) qtMod |= Qt::MetaModifier;
				//if(keyEventType == QEvent::KeyPress) fprintf(stderr,"\nkeypressed: %c", key.key);
#if 1
				QWindow *fWin = QGuiApplication::focusWindow();
				if (fWin) {
					QWindowSystemInterface::handleKeyEvent(
							fWin,
							keyEventType,
							key.key,
							qtMod,
							keyStr);
				} else
					fprintf(stderr,"\nOoops i fucked up !!!  No window in focus found");
#endif

#if 0
				static bool filterInstalled = false;
				if (!filterInstalled) {
					qGuiApp->installEventFilter(new keyEventFilter);
					filterInstalled = true;
				}
#endif
			}
			break;
		case 'g': //reply to the grab 
		case 'u': //reply to the ungrab
			{
				inputGrabReply  grply;
				memset(&grply, 0, sizeof(grply));
				if(parseGrabReply(evBuf, &grply)) {
				} 
				else 
					fprintf(stderr,"\n%s: parseGrabReply failed ", __FUNCTION__);
			}
			break;
		case 'w': //Some window event 
			{
				//fprintf(stderr,"\nWindow resize event");
				configureEvent conf;
				memset(&conf, 0, sizeof(conf));
				parseWindowResizeEvent(evBuf, &conf);
				QWindow *win = getWindowRef(conf.id);
				if (win) {
					QRect oldr = win->geometry();
					QRect newr;
					newr.setX(conf.x);
					newr.setY(conf.y);
					newr.setWidth(conf.width);
					newr.setHeight(conf.height);
					//Check whether there is a change in the size and location
					if (oldr != newr) {
#if 0
						fprintf(stderr,"\ngeometry change old.x:%d old.y:%d old.width:%d old.height:%d",
								oldr.x(), oldr.y(), oldr.width(), oldr.height());
						fprintf(stderr,"\ngeometry change new.x:%d new.y:%d new.width:%d new.height:%d", 
								newr.x(), newr.y(), newr.width(), newr.height());
#endif 
						win->setGeometry(newr);
						QWindowSystemInterface::handleGeometryChange(win, newr);
					}
				}
			}
			break;
		case 'W': //Window closed 
			{
				winDeleteEvent del;
				memset(&del, 0, sizeof(del));
				parseWindowCloseEvent(evBuf, &del);
				QWindow *win = getWindowRef(del.winId);
				if (win) QWindowSystemInterface::handleCloseEvent(win);
			}
			break;
		case 'd': //Screen reconfigure
			{
				screenResizeEvent scrnEvt;
				memset(&scrnEvt, 0, sizeof(scrnEvt));
				if(parseScreenConfEvent(evBuf, &scrnEvt)) {
				}else 
					fprintf(stderr,"\n%s: parseScreenConfEvent failed ", __FUNCTION__);
			}
			break;
		default:
			static uint32_t unknownEventCount;
			fprintf(stderr,"\nUnknown event type:%c count:%u buf=%s", base.mType, unknownEventCount++, evBuf);
			break;
	}
}

void
akorpHtmlConnection::processClientEvents()
{
	std::string wmgrevent;
	int rc = -1;
	//All the input coming to us is actually a websocket frames forwarded by 
	//the gateway daemon. so use wsRead to readin the websocket frames.
	//get the clientid and store it for sending it back to the client when
	//sending output.
	//XXX: Empty the socket whenever the callback is called.
	uint8_t flags;
	do {
		wmgrevent.clear();
		rc = wsRead(gwSocketId, inputBuf, sizeof(inputBuf), &flags);
		if (rc > 0) {
			JSONNode n = libjson::parse(inputBuf);
			getJsonSingleVal(n, "clientid", &myClientId);
			getJsonSingleVal(n, "wmgrevent", &wmgrevent);
			char *input = nonconst(wmgrevent.c_str());
			if (input) {
				dispatchEventsToQt(input);
				memset(inputBuf, 0, rc);
			}
		} else break;
	} while (rc > 0);
	return;
}
