#include <QImage>
#include <cairo-qt.h>
#include "akorphtmlpfwindow.h"
#undef signals
#include "broadway.h" //include all the non standard c headers here 
#include <boost/checked_delete.hpp>
#include <boost/intrusive/options.hpp>
#include <boost/intrusive/slist.hpp>
#include <boost/intrusive/slist_hook.hpp>
#include <boost/intrusive/set.hpp>
#include <algorithm>
#include <stdlib.h>
#include <errno.h>
#include <sys/file.h>
#include <common.hh>

//FIXME: Get rid of all the broadway source code references , this is GPL and we must not use 
//FIXME: send webp images instead of PNG to the client once every thing is working 

struct BroadwayOutput;

extern "C" void broadway_output_show_surface(BroadwayOutput *, int);
extern "C" void broadway_output_surface_flush(BroadwayOutput *, int);
extern "C" void broadway_output_hide_surface(BroadwayOutput *, int);
extern "C" void broadway_output_move_resize_surface (BroadwayOutput *, int, gboolean, int, int, gboolean, int, int);
extern "C" void flushOutput(BroadwayOutput *out);
extern BroadwayOutput* getBroadwayOut(void);
extern int windowIdFile; 

int
getWindowId()
{
	int winId = 0;  
	char buf[5] = {'\0'};
	int rc = ::flock(windowIdFile, LOCK_EX);
	if (rc < 0) { perror("Unable to lock the windowIdFIle"); exit(1); }
	rc = ::lseek(windowIdFile, 0, SEEK_SET);
	if (rc < 0) { perror("Unable to seek to the start of the windowIdFIle"); exit(1); }
	rc = ::read(windowIdFile, buf, sizeof(int));
	if (rc < 0) { perror("Unable to read from the windowIdFIle"); exit(1); }
	winId = atoi(buf);
	winId = (winId == 1023 || winId == 0) ? 1 : ++winId; //increment the window id roundoff if its approached 1023
	sprintf(buf, "%d", winId);
	rc = ::lseek(windowIdFile, 0, SEEK_SET);
	if (rc < 0) { perror("Unable to seek to the start of the windowIdFIle"); exit(1); }
	rc = ::write(windowIdFile, buf, sizeof(int));
	if (rc < 0) { perror("Unable to write to the windowIdFIle"); exit(1); }
	fsync(windowIdFile); //sync before unlock
	rc = ::flock(windowIdFile, LOCK_UN);
	if (rc < 0) { perror("Unable to unlock the windowIdFIle"); exit(1); }
	return winId;
}

#if 0
using namespace boost::intrusive;
typedef set<akorpHtmlPfWindow, compare<std::greater<akorpHtmlPfWindow> > > windowTable;
windowTable winTbl;
#endif 

akorpHtmlPfWindow *winTbl[1024] = {NULL};

QWindow*
getWindowRef(int id)
{ 
#if 0
	fprintf(stderr,"\ngetWindowRef called with id:%d", id);
	windowTable::iterator itr;
	for(itr = winTbl.begin(); itr != winTbl.end(); itr++) if(itr->id == id) return dynamic_cast<QWindow*>(&(*itr));
	fprintf(stderr,"\noh no its missing :%d", id);
#endif
	if (winTbl[id])
		return winTbl[id]->window();
	return NULL;
}

// Returns true if we should set WM_TRANSIENT_FOR on \a w
static inline bool isTemp(Qt::WindowType type)
{
		   //|| type == Qt::Dialog;
    return    type == Qt::Sheet
           || type == Qt::Tool
           || type == Qt::SplashScreen
           || type == Qt::ToolTip
           || type == Qt::Drawer
           || type == Qt::Popup;
}

extern void 
printFlags(Qt::WindowFlags flags);
akorpHtmlPfWindow::akorpHtmlPfWindow(QWindow *window)
 : QPlatformWindow(window),
   last_synced(false),
	id(getWindowId()),
	surface(NULL)
{
	//fprintf(stderr,"\n%s called ",__FUNCTION__);
	//winTbl.push_back(*this);
	//fprintf(stderr,"\n new win :0x%x ", this);
	winTbl[id] = this;
	//print window flags 
	Qt::WindowFlags flags = window->windowFlags();
	Qt::WindowType type = static_cast<Qt::WindowType>(int(flags & Qt::WindowType_Mask));
	//Desktop window is the desktop itself we need to drop it.
	if (type == Qt::Desktop) { fprintf(stderr,"\nDesktop window %d not propagated", id); return ; }
	const char *wintype = NULL;
	switch(type) {
		case Qt::Desktop :  wintype = "Qt::Desktop"; break; 
		case Qt::Sheet   :  wintype = "Qt::Sheet"; break; 
		case Qt::Tool    :  wintype = "Qt::Tool" ; break; 
		case Qt::SplashScreen : wintype = "Qt::SplashScreen"; break; 
		case Qt::ToolTip : wintype = "Qt::ToolTip"; break;
		case Qt::Drawer :  wintype = "Qt::Drawer"; break;
		case Qt::Popup : wintype = "Qt::Popup"; break;
		case Qt::SubWindow: wintype = "Qt::SubWindow"; break;
	}
	bool temp = isTemp(type);
#if 1
	fprintf(stderr,"\nwindowType:%s windowNature:%s geometry:x%d y%d width%d height:%d", 
			wintype, temp ? "Transient" : "Permanent", 
			geometry().x(), geometry().y(), geometry().width(), geometry().height());
#endif 
	//printFlags(flags);
	broadway_output_new_surface(
			getBroadwayOut(),
			this->id,
			this->geometry().x(),
			this->geometry().y(),
			this->geometry().width(),
			this->geometry().height(),
			temp);
	flushOutput(getBroadwayOut());
	return;
}

akorpHtmlPfWindow::~akorpHtmlPfWindow()
{
	if (surface)      cairo_surface_destroy(surface);
	//winTbl.erase(windowTable::s_iterator_to(*this));
	winTbl[id] = NULL;
	//fprintf(stderr,"\n win destroyed :0x%x ", this);
	broadway_output_destroy_surface(getBroadwayOut(), id);
	flushOutput(getBroadwayOut());
	return;
}

void akorpHtmlPfWindow::raise() {
	//fprintf(stderr,"\n%s called ",__FUNCTION__);
	broadway_output_surface_flush(getBroadwayOut(), id);
	broadway_output_show_surface(getBroadwayOut(), id);
	flushOutput(getBroadwayOut());
	return;
}

void akorpHtmlPfWindow::lower() {
	broadway_output_hide_surface(getBroadwayOut(), id);
	flushOutput(getBroadwayOut());
	return;
}

void akorpHtmlPfWindow::requestActivateWindow() {
	//fprintf(stderr,"\n%s called ",__FUNCTION__);
	broadway_output_show_surface(getBroadwayOut(), id);
	broadway_output_surface_flush(getBroadwayOut(), id);
	flushOutput(getBroadwayOut());
	return;
}

bool akorpHtmlPfWindow::setKeyboardGrabEnabled(bool grab) {
	return true;
}

bool akorpHtmlPfWindow::setMouseGrabEnabled(bool grab) {
	if (grab)
		broadway_output_grab_pointer(getBroadwayOut(), id, '1');
	else 
		broadway_output_ungrab_pointer(getBroadwayOut());
	flushOutput(getBroadwayOut());
	return true;
}

void akorpHtmlPfWindow::setVisible(bool visible) {
	if (visible) {
		//fprintf(stderr,"\n%s called visible",__FUNCTION__);
		broadway_output_surface_flush(getBroadwayOut(), id);
		broadway_output_show_surface(getBroadwayOut(), id);
	}
	else {
		//fprintf(stderr,"\n%s called hide",__FUNCTION__);
		broadway_output_hide_surface(getBroadwayOut(), id);
	}
	flushOutput(getBroadwayOut());
	return;
}


void akorpHtmlPfWindow::propagateSizeHints() {
	QRect geom = geometry();
	if (geom.x() && geom.y()) {
		broadway_output_move_resize_surface( getBroadwayOut(), id, true, geom.x(), geom.y(), true, geom.width(), geom.height());
		broadway_output_surface_flush(getBroadwayOut(), id);
		broadway_output_show_surface(getBroadwayOut(), id);
		flushOutput(getBroadwayOut());
	}
	//fprintf(stderr,"\n%s :%d called", __FUNCTION__, __LINE__);
	return;
}


#if 0
QSurfaceFormat akorpHtmlPfWindow::format() const  {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

void akorpHtmlPfWindow::setGeometry(const QRect &rect) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

QRect akorpHtmlPfWindow::geometry() const  {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

QMargins akorpHtmlPfWindow::frameMargins() const {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

Qt::WindowFlags akorpHtmlPfWindow::setWindowFlags(Qt::WindowFlags flags) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

Qt::WindowState akorpHtmlPfWindow::setWindowState(Qt::WindowState state) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

WId akorpHtmlPfWindow::winId() const {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}

void akorpHtmlPfWindow::setParent(const QPlatformWindow *window) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
	return;
}

void akorpHtmlPfWindow::setWindowTitle(const QString &title) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
	return;
}

bool akorpHtmlPfWindow::isExposed() const {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
	return true;
}


void akorpHtmlPfWindow::setOpacity(qreal level) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
	return;
}

void akorpHtmlPfWindow::handleContentOrientationChange(Qt::ScreenOrientation orientation) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
	return;
}

Qt::ScreenOrientation akorpHtmlPfWindow::requestWindowOrientation(Qt::ScreenOrientation orientation) {
	fprintf(stderr," %s :%d called", __FUNCTION__, __LINE__);
}
#endif
