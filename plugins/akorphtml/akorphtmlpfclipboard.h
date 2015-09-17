#ifndef __INC_AKORP_HTML_CLIPBOARD_H__
#define __INC_AKORP_HTML_CLIPBOARD_H__

#include <QPlatformClipboard>


QT_BEGIN_NAMESPACE

class akorpHtmlPfClipboard : public QPlatformClipboard
{
	public:
		akorpHtmlPfClipboard() {};
		~akorpHtmlPfClipboard() {};
		QMimeData *mimeData(QClipboard::Mode mode = QClipboard::Clipboard) {};
		void setMimeData(QMimeData *data, QClipboard::Mode mode = QClipboard::Clipboard) {};
};


QT_END_NAMESPACE
#endif 


