#ifndef __INC_AKORP_HTML_SCREEN_H__
#define __INC_AKORP_HTML_SCREEN_H__

#include <QtGui/QPlatformScreen>
#include <QtCore/QObject>
#include <QtCore/QScopedPointer>
#include "akorphtmlpfwindow.h"

QT_BEGIN_NAMESPACE

class akorpHtmlPfScreen : public QPlatformScreen
{
	int mDepth;
	QImage::Format mFormat;
	QSize mPhysicalSize;
	QRect mGeometry;

	public:
	akorpHtmlPfScreen();
	~akorpHtmlPfScreen();
	QRect geometry() const;
	int depth() const;
	QImage::Format format() const;
};

QT_END_NAMESPACE
#endif
