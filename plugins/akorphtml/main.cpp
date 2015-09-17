#include <QObject>
#include <QtGui/QPlatformIntegrationPlugin>
#include "akorphtmlpfintegration.h"

QT_BEGIN_NAMESPACE

class akorpHtmlPfIntegrationPlugin : public QPlatformIntegrationPlugin
{
    Q_OBJECT
    Q_PLUGIN_METADATA(IID "org.qt-project.Qt.QPlatformIntegrationFactoryInterface" FILE "akorphtml.json")
public:
    QStringList keys() const;
    QPlatformIntegration *create(const QString&, const QStringList&);
};

QStringList akorpHtmlPfIntegrationPlugin::keys() const
{
    QStringList list;
    list << "akorphtml";
    return list;
}

QPlatformIntegration *akorpHtmlPfIntegrationPlugin::create(const QString& system, const QStringList& paramList)
{
    Q_UNUSED(paramList);
    if (system.toLower() == "akorphtml")
        return new akorpHtmlPfIntegration;

    return 0;
}

QT_END_NAMESPACE

#include "main.moc"
