
#include "akorphtmlpfscreen.h"

akorpHtmlPfScreen::akorpHtmlPfScreen() : 
	mDepth(32), 
	mFormat(QImage::Format_ARGB32),
	mGeometry(QRect(0, 0, 1400, 700)) { return; }

akorpHtmlPfScreen::~akorpHtmlPfScreen() { return; }

QRect akorpHtmlPfScreen::geometry() const { return mGeometry; }

int akorpHtmlPfScreen::depth() const { return mDepth; }

QImage::Format akorpHtmlPfScreen::format() const { return mFormat; }
