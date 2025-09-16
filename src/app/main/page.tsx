"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { HomeView } from "@/components/views/HomeView";
import GraphView from "@/components/views/GraphView";
import React from "react";
import { useNotesStore } from "@/lib/notes-store";
import { NotebookView } from "@/components/views/NotebookView";
import { Node } from "@/types/note";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { FileText, Home, Clock, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "@/components/navigation/sidebar";
import { useNoteEditor } from "@/hooks/use-note-editor";

export default function MainPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const {
    currentView,
    setUserNotes,
    unsavedNotes,
    setDBSavedNotes,
    markNoteAsUnsaved,
    dbSavedNotes,
  } = useNotesStore();
  const { saveCurrentNote, isSaving, currentNote } = useNoteEditor();
  const mostCurrentNote = useNotesStore.getState().currentNote;
  const noteContent = mostCurrentNote
    ? mostCurrentNote.content.tiptap
    : {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      };

  const notes: Node[] | undefined = useQuery(api.notes.readNotesFromDb);
  const [title, setTitle] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  useEffect(() => {
    if (notes && notes.length > 0) {
      setUserNotes(notes);
      setDBSavedNotes(notes);
    }
  }, [notes, setUserNotes, setDBSavedNotes]);

  useEffect(() => {
    setTitle(currentNote?.name || "Untitled Note");
  }, [currentNote]);

  // Show loading while authentication is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render main app if not signed in (prevents flash)
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setTitle(e.target.value);
    if (currentNote) {
      markNoteAsUnsaved({ ...currentNote, name: e.target.value });
      currentNote.name = e.target.value;
    }
  };

  const hasUnsavedChanges = Array.from(unsavedNotes.values()).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          {/* Header for note view */}
          {currentView === "note" && (
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4">
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
                    <Input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      onFocus={() => setIsTitleFocused(true)}
                      onBlur={() => setIsTitleFocused(false)}
                      placeholder="Untitled Note"
                      className={cn(
                        "text-xl font-semibold bg-transparent border-0 shadow-none p-0 h-auto",
                        "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "focus:outline-none focus-visible:ring-0",
                        isTitleFocused
                          ? "border-b-2 border-primary"
                          : "hover:border-b-2 hover:border-slate-300 dark:hover:border-slate-600",
                      )}
                    />
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
                <Button
                  onClick={saveCurrentNote}
                  disabled={
                    !!(
                      isSaving ||
                      (mostCurrentNote &&
                        dbSavedNotes.has(mostCurrentNote.pointer_id) &&
                        JSON.stringify(noteContent) ===
                          JSON.stringify(
                            dbSavedNotes.get(mostCurrentNote.pointer_id)
                              ?.content.tiptap,
                          ))
                    )
                  }
                  className={cn(
                    "relative rounded-lg p-2 font-medium transition-all duration-200 border",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                    isSaving ||
                      (mostCurrentNote &&
                        dbSavedNotes.has(mostCurrentNote.pointer_id) &&
                        JSON.stringify(noteContent) ===
                          JSON.stringify(
                            dbSavedNotes.get(mostCurrentNote.pointer_id)
                              ?.content.tiptap,
                          ))
                      ? // Disabled state - more refined styling
                        "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none opacity-60"
                      : // Active state - simple darker/lighter slate
                        "bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300 shadow-md hover:shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 transform hover:scale-[1.02] active:scale-[0.98]",
                  )}
                >
                  <Save
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isSaving && "animate-pulse scale-110",
                    )}
                  />
                </Button>

                {currentNote && (
                  <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(currentNote.updatedAt), {
                      addSuffix: true,
                    })}
                  </div>
                )}

                <UserButton />
              </div>
            </header>
          )}

          {/* Header for non-note views */}
          {currentView !== "note" && (
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-slate-900 dark:text-slate-100 font-medium capitalize">
                  {currentView}
                </span>
              </div>

              <div className="ml-auto">
                <UserButton />
              </div>
            </header>
          )}

          <div
            className={`overflow-y-auto ${currentView === "note" ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"}`}
          >
            {currentView === "home" && <HomeView />}
            {currentView === "note" && <NotebookView />}
            {currentView === "graph" && <GraphView />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
