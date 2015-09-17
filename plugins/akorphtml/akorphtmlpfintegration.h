
#ifndef _INC_AKORP_HTML_PLATFORM_INTEGRATION_H_
#define _INC_AKORP_HTML_PLATFORM_INTEGRATION_H_

#include <QtGui/QPlatformIntegration>
#include <QtGui/QPlatformScreen>

QT_BEGIN_NAMESPACE
class akorpHtmlPfEventDispatcher;
class akorpHtmlPfScreen;
class akorpHtmlConnection;
class akorpHtmlPfIntegration : public QPlatformIntegration
{
public:
    akorpHtmlPfIntegration();
    ~akorpHtmlPfIntegration();

    bool hasCapability(QPlatformIntegration::Capability cap) const;

    QPlatformWindow *createPlatformWindow(QWindow *window) const;
    QPlatformBackingStore *createPlatformBackingStore(QWindow *window) const;
    QAbstractEventDispatcher *guiThreadEventDispatcher() const;

private:
	QAbstractEventDispatcher *m_eventDispatcher;
	akorpHtmlPfScreen 		 *screen;
	QScopedPointer<QPlatformServices> m_services;
	akorpHtmlConnection *m_connection;
	QScopedPointer<QPlatformFontDatabase> m_fontDatabase;
	QScopedPointer<QPlatformInputContext> m_inputContext;
	//akorpHtmlEventDispatcher *m_eventDispatcher;
};

QT_END_NAMESPACE

#endif
