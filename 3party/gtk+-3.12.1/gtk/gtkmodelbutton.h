/*
 * Copyright © 2014 Red Hat, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the licence, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Matthias Clasen
 */

#ifndef __GTK_MODEL_BUTTON_H__
#define __GTK_MODEL_BUTTON_H__

#include <gtk/gtkwidget.h>

G_BEGIN_DECLS

#define GTK_TYPE_MODEL_BUTTON                            (gtk_model_button_get_type ())
#define GTK_MODEL_BUTTON(inst)                           (G_TYPE_CHECK_INSTANCE_CAST ((inst),                      \
                                                             GTK_TYPE_MODEL_BUTTON, GtkModelButton))
#define GTK_IS_MODEL_BUTTON(inst)                        (G_TYPE_CHECK_INSTANCE_TYPE ((inst),                      \
                                                             GTK_TYPE_MODEL_BUTTON))

typedef struct _GtkModelButton                            GtkModelButton;

GType                   gtk_model_button_get_type                    (void) G_GNUC_CONST;

GtkWidget *             gtk_model_button_new                         (void);

G_END_DECLS

#endif /* __GTK_MODEL_BUTTON_H__ */
