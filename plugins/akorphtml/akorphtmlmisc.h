
#include "broadway.h"
#include "stdint.h"
BroadwayOutput *broadwayOutputNew(int sock);
void broadwayOutputFree(BroadwayOutput *output);
int broadwayOutputFlush(BroadwayOutput *output);
void broadwayOutputGrabPointer(BroadwayOutput *output, int id, bool owner_event);
uint32_t broadwayOutputUngrabPointer(BroadwayOutput *output);
void broadwayOutputNewSurface(BroadwayOutput *output, int id, int x, int y, int w, int h, bool is_temp);
void broadwayOutputShowSurface(BroadwayOutput *output,  int id);
void broadwayOutputHideSurface(BroadwayOutput *output,  int id);
void broadwayOutputDestroySurface(BroadwayOutput *output,  int id);
void broadwayOutputMoveResizeSurface(BroadwayOutput *output,
		int             id,
		bool            has_pos,
		int             x,
		int             y,
		bool            has_size,
		int             w,
		int             h);
void broadwayOutputSetTransientFor(BroadwayOutput *output, int id, int parent_id);
void broadwayOutputPutRgb(BroadwayOutput *output,  int id, int x, int y,
			 int w, int h, int byte_stride, void *data);
void broadwayOutputPutRgba(BroadwayOutput *output,  int id, int x, int y,
			  int w, int h, int byte_stride, void *data);
void broadwayOutputSurfaceFlush(BroadwayOutput *output, int id);
