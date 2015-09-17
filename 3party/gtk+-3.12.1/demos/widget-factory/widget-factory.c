/* widget-factory: a collection of widgets in a single page, for easy
 *                 theming
 *
 * Copyright (C) 2011 Canonical Ltd
 *
 * This  library is free  software; you can  redistribute it and/or
 * modify it  under  the terms  of the  GNU Lesser  General  Public
 * License  as published  by the Free  Software  Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed  in the hope that it will be useful,
 * but  WITHOUT ANY WARRANTY; without even  the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>.
 *
 * Authored by Andrea Cimitan <andrea.cimitan@canonical.com>
 *
 */

#include "config.h"
#include <gtk/gtk.h>

static void
activate_toggle (GSimpleAction *action,
                 GVariant      *parameter,
                 gpointer       user_data)
{
  GVariant *state;

  state = g_action_get_state (G_ACTION (action));
  g_action_change_state (G_ACTION (action), g_variant_new_boolean (!g_variant_get_boolean (state)));
  g_variant_unref (state);
}

static void
change_theme_state (GSimpleAction *action,
                    GVariant      *state,
                    gpointer       user_data)
{
  GtkSettings *settings = gtk_settings_get_default ();

  g_object_set (G_OBJECT (settings),
                "gtk-application-prefer-dark-theme",
                g_variant_get_boolean (state),
                NULL);

  g_simple_action_set_state (action, state);
}

static void
activate_about (GSimpleAction *action,
                GVariant      *parameter,
                gpointer       user_data)
{
  GtkApplication *app = user_data;
  const gchar *authors[] = {
    "Andrea Cimitan",
    "Cosimo Cecchi",
    NULL
  };

  gtk_show_about_dialog (GTK_WINDOW (gtk_application_get_active_window (app)),
                         "program-name", "GTK+ Widget Factory",
                         "version", g_strdup_printf ("%s,\nRunning against GTK+ %d.%d.%d",
                                                     PACKAGE_VERSION,
                                                     gtk_get_major_version (),
                                                     gtk_get_minor_version (),
                                                     gtk_get_micro_version ()),
                         "copyright", "(C) 1997-2013 The GTK+ Team",
                         "license-type", GTK_LICENSE_LGPL_2_1,
                         "website", "http://www.gtk.org",
                         "comments", "Program to demonstrate GTK+ themes and widgets",
                         "authors", authors,
                         "logo-icon-name", "gtk3-widget-factory",
                         "title", "About GTK+ Widget Factory",
                         NULL);
}

static void
activate_quit (GSimpleAction *action,
               GVariant      *parameter,
               gpointer       user_data)
{
  GtkApplication *app = user_data;
  GtkWidget *win;
  GList *list, *next;

  list = gtk_application_get_windows (app);
  while (list)
    {
      win = list->data;
      next = list->next;

      gtk_widget_destroy (GTK_WIDGET (win));

      list = next;
    }
}

static void
spin_value_changed (GtkAdjustment *adjustment, GtkWidget *label)
{
  GtkWidget *w;
  gint v;
  gchar *text;

  v = (int)gtk_adjustment_get_value (adjustment);

  if ((v % 3) == 0)
    {
      text = g_strdup_printf ("%d is a multiple of 3", v);
      gtk_label_set_label (GTK_LABEL (label), text);
      g_free (text);
    }

  w = gtk_widget_get_ancestor (label, GTK_TYPE_REVEALER);
  gtk_revealer_set_reveal_child (GTK_REVEALER (w), (v % 3) == 0);
}

static void
dismiss (GtkWidget *button)
{
  GtkWidget *w;

  w = gtk_widget_get_ancestor (button, GTK_TYPE_REVEALER);
  gtk_revealer_set_reveal_child (GTK_REVEALER (w), FALSE);
}

static gint pulse_time = 250;
static guint pulse_id = 0;

static gboolean
pulse_it (GtkWidget *widget)
{
  gtk_progress_bar_pulse (GTK_PROGRESS_BAR (widget));

  pulse_id = g_timeout_add (pulse_time, (GSourceFunc)pulse_it, widget);

  return G_SOURCE_REMOVE;
}

static void
update_pulse_time (GtkAdjustment *adjustment, GtkWidget *widget)
{
  gdouble value;

  value = gtk_adjustment_get_value (adjustment);

  /* vary between 50 and 450 */
  pulse_time = 50 + 4 * value;

  if (value == 100 && pulse_id != 0)
    {
      g_source_remove (pulse_id);
      pulse_id = 0;
    }
  else if (value < 100 && pulse_id == 0)
    {
      pulse_id = g_timeout_add (pulse_time, (GSourceFunc)pulse_it, widget);
    }
}

static guint pulse_entry_id = 0;

static gboolean
pulse_entry (GtkEntry *entry)
{
  gtk_entry_progress_pulse (entry);

  pulse_entry_id = g_timeout_add (100, (GSourceFunc)pulse_entry, entry);

  return G_SOURCE_REMOVE;
}

static void
on_entry_icon_release (GtkEntry            *entry,
                       GtkEntryIconPosition icon_pos,
                       GdkEvent            *event,
                       gpointer             user_data)
{
  static int num = 0;

  if (icon_pos != GTK_ENTRY_ICON_SECONDARY)
    return;

  num++;

  if (num % 3 == 0)
    {
      if (pulse_entry_id > 0)
        g_source_remove (pulse_entry_id);
      gtk_entry_set_progress_fraction (entry, 0);
    }
  else if (num % 3 == 1)
    gtk_entry_set_progress_fraction (entry, 0.25);
  else if (num % 3 == 2)
    {
      gtk_entry_set_progress_pulse_step (entry, 0.1);
      pulse_entry (entry);
    }

}

static void
startup (GApplication *app)
{
  GtkBuilder *builder;
  GMenuModel *appmenu;

  builder = gtk_builder_new ();
  gtk_builder_add_from_resource (builder, "/ui/widget-factory.ui", NULL);

  appmenu = (GMenuModel *)gtk_builder_get_object (builder, "appmenu");

  gtk_application_set_app_menu (GTK_APPLICATION (app), appmenu);

  g_object_unref (builder);
}

static void
activate (GApplication *app)
{
  GtkBuilder *builder;
  GtkWindow *window;
  GtkWidget *widget;
  GtkAdjustment *adj;
  static GActionEntry win_entries[] = {
    { "dark", activate_toggle, NULL, "false", change_theme_state }
  };

  builder = gtk_builder_new ();
  gtk_builder_add_from_resource (builder, "/ui/widget-factory.ui", NULL);
  gtk_builder_add_callback_symbol (builder, "on_entry_icon_release", (GCallback)on_entry_icon_release);
  gtk_builder_connect_signals (builder, NULL);

  window = (GtkWindow *)gtk_builder_get_object (builder, "window");
  gtk_application_add_window (GTK_APPLICATION (app), window);
  g_action_map_add_action_entries (G_ACTION_MAP (window),
                                   win_entries, G_N_ELEMENTS (win_entries),
                                   window);

  widget = (GtkWidget *)gtk_builder_get_object (builder, "progressbar3");
  pulse_id = g_timeout_add (250, (GSourceFunc)pulse_it, widget);
  g_signal_connect (gtk_builder_get_object (builder, "adjustment1"),
                    "value-changed",
                    G_CALLBACK (update_pulse_time), widget);

  widget = (GtkWidget *)gtk_builder_get_object (builder, "page2dismiss");
  g_signal_connect (widget, "clicked", G_CALLBACK (dismiss), NULL);

  widget = (GtkWidget *)gtk_builder_get_object (builder, "page2note");
  adj = (GtkAdjustment *) gtk_builder_get_object (builder, "adjustment2");
  g_signal_connect (adj, "value-changed", G_CALLBACK (spin_value_changed), widget);

  gtk_widget_show_all (GTK_WIDGET (window));

  g_object_unref (builder);
}

int
main (int argc, char *argv[])
{
  GtkApplication *app;
  static GActionEntry app_entries[] = {
    { "about", activate_about, NULL, NULL, NULL },
    { "quit", activate_quit, NULL, NULL, NULL },
  };

  gtk_init (&argc, &argv);

  app = gtk_application_new ("org.gtk.WidgetFactory", 0);

  g_action_map_add_action_entries (G_ACTION_MAP (app),
                                   app_entries, G_N_ELEMENTS (app_entries),
                                   app);

  g_signal_connect (app, "startup", G_CALLBACK (startup), NULL);
  g_signal_connect (app, "activate", G_CALLBACK (activate), NULL);

  g_application_run (G_APPLICATION (app), argc, argv);

  return 0;
}
