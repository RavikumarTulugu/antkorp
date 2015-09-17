TARGET = akorphtml
load(qt_plugin)

QT += core-private gui-private platformsupport-private

INCLUDEPATH       = /usr/local/Qt-5.0.0/mkspecs/linux-g++ \
					/usr/local/Qt-5.0.0/include/QtCore/5.0.0 \
					/usr/local/Qt-5.0.0/include/QtCore/5.0.0/QtCore \
					/usr/local/Qt-5.0.0/include/QtCore \
					/usr/local/Qt-5.0.0/include/QtGui/5.0.0 \
					/usr/local/Qt-5.0.0/include/QtGui/5.0.0/QtGui \
					/usr/local/Qt-5.0.0/include/QtGui\
					/usr/local/Qt-5.0.0/include/QtPlatformSupport/5.0.0 \
					/usr/local/Qt-5.0.0/include/QtPlatformSupport/5.0.0/QtPlatformSupport \
					/usr/local/Qt-5.0.0/include/QtPlatformSupport \
					/usr/local/Qt-5.0.0/include \
					.\
					../../server/src \
					../../3party/libjson \
					/usr/include/cairo \
					/usr/include/pixman-1 \
					/usr/include/freetype2 \
					/usr/include/libpng12 \
					/usr/include/glib-2.0 \
					/usr/lib/i386-linux-gnu/glib-2.0/include \
					/usr/lib/glib-2.0/include \
					/usr/include/gtk-3.0 \
					/usr/include/gtk-3.0/gdk \
					/usr/include/gio-unix-2.0/ \
					/usr/include/pango-1.0 \
					/usr/include/gdk-pixbuf-2.0 \
					/usr/include/glib-2.0 \
					/usr/lib/i386-linux-gnu/glib-2.0/include \
					/usr/include/pixman-1 \
					/usr/include/freetype2 \
 					/usr/include/libpng12 \
					/usr/local/include/cairo \
					/usr/local/include/boost \
					/usr/local/include/Poco \
					/usr/include/pango-1.0 \
					/usr/include/glib-2.0 \
					/usr/lib/glib-2.0/include \
					/usr/include/cairo \
					/usr/include/pixman-1 \
					/usr/include/freetype2 \
			    	/usr/include/libpng12

LIBS          = $(SUBLIBS) -L/usr/local/lib -lcairo -L/usr/local/Qt-5.0.0/lib -lQtPlatformSupport -L/usr/local/Qt-5.0.0/lib -lz -lQtGui -lQtCore -lGL -lpthread -lglib-2.0 -lstdc++ -lPocoFoundation -lPocoNet -lPocoUtil -lPocoXML


SOURCES =   broadway.c\
			main.cpp \
            akorphtmlpfintegration.cpp \
            akorphtmlpfscreen.cpp \
            akorphtmlpfwindow.cpp \
            akorphtmlwindow.cpp \
            akorphtmlpfclipboard.cpp \
            akorphtmlpfcursor.cpp \
            akorphtmlpfdnd.cpp \
            akorphtml.cpp \
            akorphtmlmisc.cpp \
			../../3party/libjson/Source/*.cpp \
			../../server/src/common.cc \
            akorphtmlpfbackingstore.cpp
HEADERS =   akorphtmlpfintegration.h \
            akorphtmlpfbackingstore.h \
            akorphtml.h \
            akorphtmlwindow.h \
            broadway.h

QMAKE_CFLAGS+=-g
QMAKE_CXXFLAGS+=-g

OTHER_FILES += akorphtml.json

target.path += $$[QT_INSTALL_PLUGINS]/platforms
INSTALLS += target
