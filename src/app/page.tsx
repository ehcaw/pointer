"use client";
import { AppSidebar } from "@/components/navigation/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { HomeView } from "@/components/views/home-view";
import React, { useEffect } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { NotebookView } from "@/components/views/notebook-view";
import { FileNode, Node } from "@/types/note";
import { useHotkeys } from "react-hotkeys-hook";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { FileText, Home, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Page() {
  const { currentView, currentNote, setUserNotes, unsavedNotes } =
    useNotesStore();
  const { saveCurrentNote } = useNoteEditor();

  const notes: Node[] | undefined = useQuery(api.notes.readNotesFromDb, {
    user_id: "12345678",
  });

  useEffect(() => {
    if (notes && notes.length > 0) {
      setUserNotes(notes);
    }
  }, [notes, setUserNotes]);

  const hasUnsavedChanges = Array.from(unsavedNotes.values()).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          {/* Header for note view */}
          {currentView === "note" && (
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4">
              <SidebarTrigger className="-ml-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4 bg-slate-200 dark:bg-slate-700"
              />

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="#"
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <Home className="h-3 w-3" />
                      workspace
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-slate-400 dark:text-slate-600" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="#"
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <FileText className="h-3 w-3" />
                      notes
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-slate-400 dark:text-slate-600" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-medium">
                      {(currentNote as FileNode)?.name || "Untitled"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Status indicators */}
              <div className="ml-auto flex items-center gap-2">
                {hasUnsavedChanges && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Unsaved changes
                  </Badge>
                )}

                {currentNote && (
                  <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(currentNote.updatedAt), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </div>
            </header>
          )}

          {/* Main content area */}
          <div className="flex-1">
            {currentView === "home" && (
              <div className="h-full">
                <HomeView />
              </div>
            )}
            {currentView === "note" && <NotebookView />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
