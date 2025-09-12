"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppSidebar } from "@/components/navigation/Sidebar";
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
import { HomeView } from "@/components/views/HomeView";
import GraphView from "@/components/views/GraphView";
import React from "react";
import { useNotesStore } from "@/lib/notes-store";
import { NotebookView } from "@/components/views/NotebookView";
import { FileNode, Node } from "@/types/note";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { FileText, Home, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserButton } from "@clerk/nextjs";

export default function MainPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const {
    currentView,
    currentNote,
    setUserNotes,
    unsavedNotes,
    setDBSavedNotes,
  } = useNotesStore();

  const notes: Node[] | undefined = useQuery(api.notes.readNotesFromDb);

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

                <UserButton />
              </div>
            </header>
          )}

          {/* Header for non-note views */}
          {currentView !== "note" && (
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4">
              <SidebarTrigger className="-ml-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4 bg-slate-200 dark:bg-slate-700"
              />

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
