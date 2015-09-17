#include "akorphtmlpfintegration.h"
#include "akorphtmlpfscreen.h"
#include "akorphtmlpfwindow.h"
#include "akorphtmlpfbackingstore.h"
#include <QtPlatformSupport/private/qgenericunixeventdispatcher_p.h>
#include <QtPlatformSupport/private/qgenericunixfontdatabase_p.h>
#include <QtPlatformSupport/private/qgenericunixfontdatabase_p.h>
#include <QtPlatformSupport/private/qgenericunixservices_p.h>
#include <private/qplatforminputcontextfactory_qpa_p.h>
#include <qplatforminputcontext_qpa.h>
#include <QtGui/private/qpixmap_raster_p.h>
#include <QtGui/private/qguiapplication_p.h>
#include <QtGui/QPlatformWindow>
#include <sys/types.h>
#include <sys/errno.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <signal.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <assert.h>
#include "akorphtml.h"
#undef signals //NOTE: qt and gtk+ both define a signals macro which conflicts with each others, so undef the qt one once we are done with it
#include "broadway.h"
#include <BufferedStreamBuf.h>
#include <cstring>
#include <cstdio>
#include <common.hh>

QT_BEGIN_NAMESPACE

akorpHtmlConnection *gConn;

extern int myClientId;
extern char mySvcId[];

//append to the buffer stream
#if 0
extern "C" void writeToGwSvr(char *buf, size_t size) 
{ 
	std::string service;
	service.assign(mySvcId, strlen(mySvcId));
	std::string wmgrcommand;
	wmgrcommand.assign(buf, size);
	//std::cerr<<"From Plugin=>"<< "clientId: "<<myClientId << "service: "<<service << "wmgrcommand: "<<wmgrcommand;
	tupl tv[] = {{"clientid", myClientId}, {"service", service}, {"wmgrcommand", wmgrcommand}};
	size_t sz = sizeof(tv)/sizeof(tupl);
	std::string jsonOutput = putJsonVal(tv, sz);
	gConn->getsockStream()->sputn(jsonOutput.c_str(), jsonOutput.length());
	return;
}
#endif 

std::string outputStream; //2 megabyte

//Every write appends to the stream until a flush is called 
//A flush just sets the wmgr command feild and forms a json 
//packet and puts it on the wire.

//append to the buffer stream
extern "C" void writeToGwSvr(char *buf, size_t size) 
{
	outputStream.append(buf, size);
	return;
}

extern "C" int getGwConnId(void) { return gConn->getGwConnId(); }
BroadwayOutput *getBroadwayOut() { return gConn->getBroadwayOut(); }

//flush the stream to the gw socket
//one flush results in sending the whole data as one websocket frame
#if 0
extern "C" void flushOutput(BroadwayOutput *out) { gConn->getsockStream()->sync(); return; }
#endif 
extern "C" void flushOutput(BroadwayOutput *out) 
{
	//std::cerr<<"From Plugin=>"<< "clientId: "<<myClientId << "service: "<<service << "wmgrcommand: "<<wmgrcommand;
	std::string service;
	service.assign(mySvcId, strlen(mySvcId));
	tupl tv[] = {{"clientid", myClientId}, {"service", service}, {"wmgrcommand", outputStream}};
	size_t sz = sizeof(tv)/sizeof(tupl);
	std::string jsonOutput = putJsonVal(tv, sz);
	gConn->getsockStream()->sputn(jsonOutput.c_str(), jsonOutput.length());
	gConn->getsockStream()->sync();
	outputStream.clear();
	return;
}

akorpHtmlPfIntegration::akorpHtmlPfIntegration() :
	m_eventDispatcher(createUnixEventDispatcher()),
	m_services(new QGenericUnixServices),
	screen(new akorpHtmlPfScreen)
{
	//Try to connect to the gateway server and get the socket descriptor 
	//to use this is our doorway to the client.
	//Add the screen to the integration
	screenAdded(screen);
	m_fontDatabase.reset(new QGenericUnixFontDatabase());
	m_inputContext.reset(QPlatformInputContextFactory::create());
	QGuiApplicationPrivate::instance()->setEventDispatcher(m_eventDispatcher);
	gConn = m_connection = akorpHtmlConnection::Instance();
	outputStream.reserve(2*1024*1024);
	return;
}

akorpHtmlPfIntegration::~akorpHtmlPfIntegration()
{
	//delete m_eventDispatcher;
	//delete screen;
	delete m_connection;
	gConn = NULL;
	fprintf(stderr, "\nakorphtml platform Integration detached");
	return;
}

bool akorpHtmlPfIntegration::hasCapability(QPlatformIntegration::Capability cap) const
{
	switch (cap) {
		case ThreadedPixmaps: return true;
		case OpenGL: return true;
		case ThreadedOpenGL: return false;
		default: return QPlatformIntegration::hasCapability(cap);
	}   
}

QPlatformWindow *akorpHtmlPfIntegration::createPlatformWindow(QWindow *window) const
{
	QPlatformWindow *w =  new akorpHtmlPfWindow(window);
	w->requestActivateWindow();
	return w;
}

QPlatformBackingStore *akorpHtmlPfIntegration::createPlatformBackingStore(QWindow *window) const
{
    return new akorpHtmlBackingStore(window);
}

QAbstractEventDispatcher *akorpHtmlPfIntegration::guiThreadEventDispatcher() const
{
    return m_eventDispatcher;
}

QT_END_NAMESPACE
