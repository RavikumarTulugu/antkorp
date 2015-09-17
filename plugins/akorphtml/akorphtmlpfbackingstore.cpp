#include "akorphtmlpfwindow.h"
#include <assert.h>
#include "akorphtmlpfbackingstore.h"
#include "qscreen.h"
#include <QtCore/qdebug.h>
#include <QtGui/QPlatformScreen>
#include <private/qguiapplication_p.h>
#include <glib.h>

QT_BEGIN_NAMESPACE

struct BroadwayOutput;
extern BroadwayOutput *getBroadwayOut(void);

extern "C" void broadway_output_show_surface(BroadwayOutput *output,  int id);
extern "C" void broadway_output_new_surface(BroadwayOutput *output,  int id, int x, int y, int w, int h, bool temp);
extern "C" void flushOutput(BroadwayOutput *out);
extern "C" void broadway_output_surface_flush (BroadwayOutput *out, int id);
extern "C" void broadway_output_move_resize_surface (BroadwayOutput *output,int id,gboolean has_pos,int x, int y,gboolean has_size,int w,int h);
extern "C" void broadway_output_put_rgb (BroadwayOutput *output, int id, int x, int y, int w, int h, int byte_stride, void *data);
extern "C" void broadway_output_put_rgba (BroadwayOutput *output, int id, int x, int y, int w, int h, int byte_stride, void *data);

void 
printFlags(Qt::WindowFlags flags)
{
	 	if (flags & Qt::Widget) fprintf(stderr," :%s","Widget");
        if (flags & Qt::Window) fprintf(stderr," :%s","Window");
        if (flags & Qt::Dialog) fprintf(stderr," :%s","Dialog");
        if (flags & Qt::Sheet) fprintf(stderr," :%s","Sheet");
        if (flags & Qt::Drawer) fprintf(stderr," :%s","Drawer");
        if (flags & Qt::Popup) fprintf(stderr," :%s","Popup");
        if (flags & Qt::Tool) fprintf(stderr," :%s","Tool");
        if (flags & Qt::ToolTip) fprintf(stderr," :%s","ToolTip");
        if (flags & Qt::SplashScreen) fprintf(stderr," :%s","SplashScreen");
        if (flags & Qt::Desktop) fprintf(stderr," :%s","Desktop");
        if (flags & Qt::SubWindow) fprintf(stderr," :%s","SubWindow");
        if (flags & Qt::WindowType_Mask) fprintf(stderr," :%s","WindowType_Mask");
        if (flags & Qt::MSWindowsFixedSizeDialogHint) fprintf(stderr," :%s","MSWindowsFixedSizeDialogHint");
        if (flags & Qt::MSWindowsOwnDC) fprintf(stderr," :%s","MSWindowsOwnDC");
        if (flags & Qt::X11BypassWindowManagerHint) fprintf(stderr," :%s","X11BypassWindowManagerHint");
        if (flags & Qt::FramelessWindowHint) fprintf(stderr," :%s","FramelessWindowHint");
        if (flags & Qt::WindowTitleHint) fprintf(stderr," :%s","WindowTitleHint");
        if (flags & Qt::WindowSystemMenuHint) fprintf(stderr," :%s","WindowSystemMenuHint");
        if (flags & Qt::WindowMinimizeButtonHint) fprintf(stderr," :%s","WindowMinimizeButtonHint");
        if (flags & Qt::WindowMaximizeButtonHint) fprintf(stderr," :%s","WindowMaximizeButtonHint");
        if (flags & Qt::WindowMinMaxButtonsHint) fprintf(stderr," :%s","WindowMinMaxButtonsHint");
        if (flags & Qt::WindowContextHelpButtonHint) fprintf(stderr," :%s","WindowContextHelpButtonHint");
        if (flags & Qt::WindowShadeButtonHint) fprintf(stderr," :%s","WindowShadeButtonHint");
        if (flags & Qt::WindowStaysOnTopHint) fprintf(stderr," :%s","WindowStaysOnTopHint");
        if (flags & Qt::WindowTransparentForInput) fprintf(stderr," :%s","WindowTransparentForInput");
        if (flags & Qt::WindowOverridesSystemGestures) fprintf(stderr," :%s","WindowOverridesSystemGestures");
        if (flags & Qt::WindowDoesNotAcceptFocus) fprintf(stderr," :%s","WindowDoesNotAcceptFocus");
        if (flags & Qt::CustomizeWindowHint) fprintf(stderr," :%s","CustomizeWindowHint");
        if (flags & Qt::WindowStaysOnBottomHint) fprintf(stderr," :%s","WindowStaysOnBottomHint");
        if (flags & Qt::WindowCloseButtonHint) fprintf(stderr," :%s","WindowCloseButtonHint");
        if (flags & Qt::MacWindowToolBarButtonHint) fprintf(stderr," :%s","MacWindowToolBarButtonHint");
        if (flags & Qt::BypassGraphicsProxyWidget) fprintf(stderr," :%s","BypassGraphicsProxyWidget");
        if (flags & Qt::WindowOkButtonHint) fprintf(stderr," :%s","WindowOkButtonHint");
        if (flags & Qt::WindowCancelButtonHint) fprintf(stderr," :%s","WindowCancelButtonHint");
        if (flags & Qt::WindowSoftkeysVisibleHint) fprintf(stderr," :%s","WindowSoftkeysVisibleHint");
        if (flags & Qt::WindowSoftkeysRespondHint) fprintf(stderr," :%s","WindowSoftkeysRespondHint");
		return;
}

akorpHtmlBackingStore::akorpHtmlBackingStore(QWindow *window) : 
	QPlatformBackingStore(window), 
	mDebug(false),
	firstSync(true),
	mImage(0)
{
	return; 
}

akorpHtmlBackingStore::~akorpHtmlBackingStore()
{
	return; 
}

QPaintDevice *akorpHtmlBackingStore::paintDevice() { return &mImage; }

//transmit an image as a sequence of further small tiled images. 
void
akorpHtmlBackingStore::xmitImageTiled(const QPoint &target, const QRect  &source, bool rgba = false)
{
	int src_x = source.x();
	int src_y = source.y();
	int target_x = target.x();
	int target_y = target.y();
	int width = source.width();
	int height = source.height();
	akorpHtmlPfWindow *win = static_cast<akorpHtmlPfWindow*>(window()->handle());

	//FIXME: just rough estimates change them after 
	uint32_t max_req_size = 64*1024;//8kb
	uint32_t req_size = 128; //max size of request header preceding the image 
	int rows_per_put = (max_req_size - req_size) / mImage.bytesPerLine();

	while (height > 0) {
		//broadway_output_show_surface(getBroadwayOut(), win->id);
		int rows = std::min(height, rows_per_put);
		//copy the subimage to the new image 
		QImage subImage = mImage.copy(src_x, src_y, width, rows);
		if (rgba)
			broadway_output_put_rgba ( getBroadwayOut(), win->id, src_x, src_y, width, rows, subImage.bytesPerLine(), subImage.bits());
		else 
			broadway_output_put_rgb( getBroadwayOut(), win->id, src_x, src_y, width, rows, subImage.bytesPerLine(), subImage.bits());
		//fprintf(stderr,"\n rows:%u height:%u width:%u rows_per_put:%u stride:%u x:%u y:%u ", rows, height, width, rows_per_put, subImage.bytesPerLine(), src_x, src_y);
		src_y += rows;
		target_y += rows;
		height -= rows;
		//Dump the image for debugging purposes 
#if 0
		static int n = 0;
		const QString fileName = QString::fromAscii("win%1_%2.png").arg(win->id).arg(n++);
		subImage.save(fileName);
#endif 
#if 0
		flushOutput(getBroadwayOut());
		broadway_output_surface_flush (getBroadwayOut(), win->id);
		flushOutput(getBroadwayOut());
#endif 
	}
	
	broadway_output_surface_flush (getBroadwayOut(), win->id);
	flushOutput(getBroadwayOut());
	return;
}

//whenever a widget is repainted the qt system gives the region of the repaint 
//and the location of the repaint. we need to identify the window from the 
//region and offset and send the data to the window for repaint. 
//Create the surfaces first time the flush is called. copy the image to the 
//surface and send the surface for renderign to the client. 
void 
akorpHtmlBackingStore::flush(
		QWindow *window, 
		const QRegion &region, 
		const QPoint &offset)
{
	QSize imageSize = mImage.size();
	QRegion clipped = region;
	clipped &= QRect(0, 0, window->width(), window->height());
	clipped &= QRect(0, 0, imageSize.width(), imageSize.height()).translated(-offset);
	QRect bounds = clipped.boundingRect();

	if (bounds.isNull()) return;

	akorpHtmlPfWindow *platformWindow = static_cast<akorpHtmlPfWindow*>(window->handle());
	QVector<QRect> rects = clipped.rects();
	for (int i = 0; i < rects.size(); ++i) xmitImageTiled(rects.at(i).topLeft(), rects.at(i).translated(offset), true);
	//fprintf(stderr,"\nflush called for win:%d", platformWindow->id);
	//broadway_output_surface_flush (getBroadwayOut(), platformWindow->id);
	return;
}

void 
akorpHtmlBackingStore::resize(
		const QSize &size, 
		const QRegion &region)
{
	QImage::Format format = QGuiApplication::primaryScreen()->handle()->format();
	if (mImage.size() != size) {
		mImage = QImage(size, format); 
		//destroy the old surfaces and recreate the surfaces for the window
		unsigned char *imageData = mImage.bits();
		uint32_t imageSize = mImage.byteCount();
		Q_UNUSED(imageSize);
		akorpHtmlPfWindow *win = static_cast<akorpHtmlPfWindow*>(window()->handle());
		assert(win);
		//Create the surfaces first time the flush is called. copy the image to the 
		//surface and send the surface for renderign to the client. 
		if (win->surface) cairo_surface_destroy(win->surface);
		win->surface = cairo_image_surface_create_for_data (
				mImage.bits(),
				CAIRO_FORMAT_ARGB32,
				mImage.width(), 
				mImage.height(),
				mImage.bytesPerLine());
		assert(win->surface);
		broadway_output_move_resize_surface(getBroadwayOut(), 
				win->id,
				true,
				win->geometry().x(),
				win->geometry().y(),
				true,
				mImage.width(), 
				mImage.height());
		broadway_output_surface_flush (getBroadwayOut(), win->id);
		flushOutput(getBroadwayOut());
	}
	return; 
}

void 
akorpHtmlBackingStore::beginPaint(const QRegion &area)
{
	return;
}

void 
akorpHtmlBackingStore::endPaint(const QRegion &area)
{
	return; 
}

extern void 
qt_scrollRectInImage(QImage &img, const QRect &rect, const QPoint &offset);

bool
akorpHtmlBackingStore::scroll(const QRegion &area, int dx, int dy)
{
	const QVector<QRect> rects = area.rects();
	for (int i = 0; i < rects.size(); ++i)
		qt_scrollRectInImage(mImage, rects.at(i), QPoint(dx, dy));
	return true;
}

QT_END_NAMESPACE
