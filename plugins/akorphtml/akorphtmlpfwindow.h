#ifndef __INC_AKORP_HTML_WINDOW_H__
#define __INC_AKORP_HTML_WINDOW_H__
#include <QPlatformWindow>
#include <algorithm>
#include <QImage>
#include "cairo.h"
#include "akorphtmlpfcursor.h"
#include <boost/checked_delete.hpp>
#include <boost/intrusive/options.hpp>
#include <boost/intrusive/set.hpp>
#include <algorithm>

QT_BEGIN_NAMESPACE

using namespace boost::intrusive;

class akorpHtmlPfWindow : public set_base_hook<optimize_size<true> >, public QPlatformWindow
{
	public:
		bool last_synced;
		int id; //id of the window exchanged by the server and the client 
		//cairo_surface_t *last_surface;
		cairo_surface_t *surface;
		akorpHtmlPfWindow (QWindow *window);
		~akorpHtmlPfWindow ();
		void raise();
		void lower();
		void requestActivateWindow();
		bool setKeyboardGrabEnabled(bool grab);
		bool setMouseGrabEnabled(bool grab);
		void setVisible(bool visible);
		void propagateSizeHints();
#if 0
		QSurfaceFormat format() const;
		void setGeometry(const QRect &rect);
		QRect geometry() const;
		QMargins frameMargins() const;
		Qt::WindowFlags setWindowFlags(Qt::WindowFlags flags);
		Qt::WindowState setWindowState(Qt::WindowState state);
		WId winId() const;
		void setParent(const QPlatformWindow *window);
		void setWindowTitle(const QString &title);
		bool isExposed() const;
		void setOpacity(qreal level);
		void handleContentOrientationChange(Qt::ScreenOrientation orientation);
		Qt::ScreenOrientation requestWindowOrientation(Qt::ScreenOrientation orientation);
#endif 
		friend bool operator< (const akorpHtmlPfWindow &a, const akorpHtmlPfWindow &b) { return a.id < b.id; }
		friend bool operator> (const akorpHtmlPfWindow &a, const akorpHtmlPfWindow &b) { return a.id > b.id; }
		friend bool operator== (const akorpHtmlPfWindow &a, const akorpHtmlPfWindow &b) { return a.id == b.id; }
};

QT_END_NAMESPACE
#endif 
