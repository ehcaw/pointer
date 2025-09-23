"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import ExcalidrawWrapper from "@/components/whiteboard/ExcalidrawWrapper";
import React from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { NotebookView } from "@/components/views/NotebookView";
import { Node } from "@/types/note";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { FileText, Home, Clock, Share2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "@/components/navigation/sidebar";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MainPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const {
    currentView,
    setUserNotes,
    unsavedNotes,
    setDBSavedNotes,
    markNoteAsUnsaved,
  } = useNotesStore();
  const { currentNote } = useNoteEditor();
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

  const handleShareNote = async () => {
    if (!currentNote) return;
    if (typeof window === "undefined") return;

    const previewUrl = `${window.location.origin}/preview/${currentNote.pointer_id}`;

    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("Preview link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback: open the preview in a new tab
      window.open(previewUrl, "_blank");
      toast.info("Preview opened in new tab");
    }
  };

  const getDefaultInput = () => {
    switch (currentView) {
      case "note":
        return title || "Untitled Note";
      case "whiteboard":
        return "New Whiteboard";
      default:
        return title || "Untitled Note";
    }
  };

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
                    <div className="relative group">
                      <Input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onFocus={() => setIsTitleFocused(true)}
                        onBlur={() => setIsTitleFocused(false)}
                        placeholder="Untitled Note"
                        className={cn(
                          "text-lg font-semibold bg-transparent border-0 shadow-none px-3 py-2 h-auto rounded-md",
                          "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          "focus:outline-none focus-visible:ring-0 transition-all duration-200",
                          "min-w-[200px] max-w-[400px]",
                          isTitleFocused
                            ? "bg-white dark:bg-slate-800 shadow-sm ring-2 ring-primary/20 border border-primary/30"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent",
                        )}
                      />
                      {/* Visual indicator for editable state */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-md border-2 border-dashed transition-opacity duration-200 pointer-events-none",
                          isTitleFocused
                            ? "opacity-0"
                            : "opacity-0 group-hover:opacity-30 border-slate-300 dark:border-slate-600",
                        )}
                      />
                    </div>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleShareNote}
                    title="Share preview link"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}

                <UserButton />
              </div>
            </header>
          )}

          {/* Header for non-note views */}
          {currentView !== "note" && (
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4">
              {/*<div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-slate-900 dark:text-slate-100 font-medium capitalize">
                  {currentView}
                </span>
              </div>

              <div className="ml-auto">
                <UserButton />
              </div>*/}
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
                      {currentView.toLowerCase()}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {currentView != "home" && currentView != "graph" && (
                    <div className="flex items-center gap-2">
                      <BreadcrumbSeparator className="hidden md:block text-slate-400 dark:text-slate-600" />
                      <BreadcrumbItem>
                        <div className="relative group">
                          <Input
                            type="text"
                            value={getDefaultInput()}
                            onChange={handleTitleChange}
                            onFocus={() => setIsTitleFocused(true)}
                            onBlur={() => setIsTitleFocused(false)}
                            placeholder="Untitled Note"
                            className={cn(
                              "text-lg font-semibold bg-transparent border-0 shadow-none px-3 py-2 h-auto rounded-md",
                              "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
                              "focus:outline-none focus-visible:ring-0 transition-all duration-200",
                              "min-w-[200px] max-w-[400px]",
                              isTitleFocused
                                ? "bg-white dark:bg-slate-800 shadow-sm ring-2 ring-primary/20 border border-primary/30"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent",
                            )}
                          />
                          {/* Visual indicator for editable state */}
                          <div
                            className={cn(
                              "absolute inset-0 rounded-md border-2 border-dashed transition-opacity duration-200 pointer-events-none",
                              isTitleFocused
                                ? "opacity-0"
                                : "opacity-0 group-hover:opacity-30 border-slate-300 dark:border-slate-600",
                            )}
                          />
                        </div>
                      </BreadcrumbItem>
                    </div>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </header>
          )}

          <div
            className={`overflow-y-auto ${currentView === "note" ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"}`}
          >
            {currentView === "home" && <HomeView />}
            {currentView === "note" && <NotebookView />}
            {currentView === "graph" && <GraphView />}
            {currentView === "whiteboard" && <ExcalidrawWrapper />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
