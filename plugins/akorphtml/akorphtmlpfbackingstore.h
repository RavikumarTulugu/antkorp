#ifndef _INC_AKORP_HTML_BACKINGSTORE_H_
#define _INC_AKORP_HTML_BACKINGSTORE_H_

#include <QtGui/QPlatformBackingStore>
#include <QtGui/QPlatformWindow>
#include <QtGui/QImage>

QT_BEGIN_NAMESPACE

class akorpHtmlBackingStore : public QPlatformBackingStore
{
	public:
		akorpHtmlBackingStore(QWindow *window); 
		~akorpHtmlBackingStore(); 
		QPaintDevice *paintDevice();
		void flush(QWindow *window, const QRegion &region, const QPoint &offset);
		void resize(const QSize &size, const QRegion &staticContents);
		bool scroll(const QRegion&, int, int);
		void beginPaint(const QRegion &);
		void endPaint(const QRegion &);
		void xmitImageTiled(const QPoint &target, const QRect &source, bool rgba);
	private:
		QImage mImage;
		bool mDebug;
		bool firstSync;
		QRegion mDirty;
};

QT_END_NAMESPACE
#endif
