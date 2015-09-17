
#include <QtCore/QDebug>
#include <QTimer>
#include <BufferedStreamBuf.h>
#include <errno.h>
#include <common.hh>

//Contains commonly used classes and definitions for the akorphtml plugin 
//Copied as is from the broadway definition file 
typedef unsigned int guint32;
typedef unsigned long long guint64;

typedef struct {
  char type;
  guint32 serial;
  guint64 time;
} BroadwayInputBaseMsg;

typedef struct {
  BroadwayInputBaseMsg base;
  guint32 mouse_window_id; /* The real window, not taking grabs into account */
  guint32 event_window_id;
  int root_x;
  int root_y;
  int win_x;
  int win_y;
  guint32 state;
} BroadwayInputPointerMsg;

typedef struct {
  BroadwayInputPointerMsg pointer;
  guint32 mode;
} BroadwayInputCrossingMsg;

typedef struct {
  BroadwayInputPointerMsg pointer;
  guint32 button;
} BroadwayInputButtonMsg;

typedef struct {
  BroadwayInputPointerMsg pointer;
  int dir;
} BroadwayInputScrollMsg;

typedef struct {
  BroadwayInputBaseMsg base;
  guint32 state;
  int key;
} BroadwayInputKeyMsg;

typedef struct {
  BroadwayInputBaseMsg base;
  int res;
} BroadwayInputGrabReply;

typedef struct {
  BroadwayInputBaseMsg base;
  int id;
  int x;
  int y;
  int width;
  int height;
} BroadwayInputConfigureNotify;

typedef struct {
  BroadwayInputBaseMsg base;
  int width;
  int height;
} BroadwayInputScreenResizeNotify;

typedef struct {
  BroadwayInputBaseMsg base;
  int id;
} BroadwayInputDeleteNotify;

typedef union {
  BroadwayInputBaseMsg base;
  BroadwayInputPointerMsg pointer;
  BroadwayInputCrossingMsg crossing;
  BroadwayInputButtonMsg button;
  BroadwayInputScrollMsg scroll;
  BroadwayInputKeyMsg key;
  BroadwayInputGrabReply grab_reply;
  BroadwayInputConfigureNotify configure_notify;
  BroadwayInputDeleteNotify delete_notify;
  BroadwayInputScreenResizeNotify screen_resize_notify;
} BroadwayInputMsg;

class gwSocketStreamBuf : public Poco::BasicBufferedStreamBuf<char, std::char_traits<char> >
{
	int _sock;
	public:
		gwSocketStreamBuf(std::streamsize bufferSize, std::ios_base::openmode mode, int sock = -1) :
			_sock(sock),
			Poco::BasicBufferedStreamBuf<char, std::char_traits<char> >(bufferSize, mode) { return; }
		~gwSocketStreamBuf() { return; }
		void setSock(int sock) { _sock = sock; };
		int writeToDevice(const char_type* buffer, std::streamsize length) { 
			const char *ptr = buffer;
			int size =  length;
			int wrCount = 0;
				//fprintf(stderr, "\nwriting on to socket :%d ", size);
			while (1) {
			try_again:
				//write(2, ptr, size);
				wrCount = wsWrite(_sock, ptr, size, WS_FINAL_FRAME | WS_FRAME_TEXT);
				if (wrCount < 0) {
					if (errno == EWOULDBLOCK || errno == EAGAIN) goto try_again;
					perror("writeToDevice: write call failed:");
					return -1;
				}
				else if (wrCount < size)  { 
					size = size - wrCount; 
					ptr += wrCount; 
				}
				else break;
			}
			//fprintf(stderr, "\nwriting complete");
			return wrCount;
		}
};
//our connection to the gwserver which handles every thing
class QAbstractEventDispatcher;
class BroadwayOutput;
class akorpHtmlConnection : public QObject
{
	Q_OBJECT

	int gwSocketId;
	BroadwayOutput *gBroadwayOut;
	unsigned int gFrameSerial;
	gwSocketStreamBuf sockStream; //Create a socket buffer which will hold all the output until a flush is called.
	akorpHtmlConnection();
	QTimer *idleTimer;
	public:
		void idleTimerCallback(void);
		static akorpHtmlConnection* Instance() { return new akorpHtmlConnection; }
		static akorpHtmlConnection* getInstance() { return NULL; }
		int getGwConnId(void);
		BroadwayOutput* getBroadwayOut(void);
		~akorpHtmlConnection();
		gwSocketStreamBuf * getsockStream() { return &sockStream; }

	private slots:
			void processClientEvents();
};
