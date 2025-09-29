"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HomeView } from "@/components/views/HomeView";
import GraphView from "@/components/views/GraphView";
import WhiteboardView from "@/components/views/WhiteboardView";
import React from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { NotebookView } from "@/components/views/NotebookView";
import AppSidebar from "@/components/navigation/sidebar";

import DefaultHeader from "@/components/views/headers/DefaultHeader";
import NoteViewHeader from "@/components/views/headers/NoteViewHeader";
import WhiteboardViewHeader from "@/components/views/headers/WhiteboardViewHeader";

import { createDataFetchers } from "@/lib/utils/dataFetchers";

import useSWR from "swr";
import { useConvex } from "convex/react";

export default function MainPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  const { setUserNotes, setDBSavedNotes } = useNotesStore();
  const { currentView } = usePreferencesStore();

  const convex = useConvex();
  const dataFetchers = createDataFetchers(convex);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  const shouldFetch = isLoaded && isSignedIn && user?.id;
  const { isLoading } = useSWR(
    shouldFetch ? user.id : null,
    async (userId: string) => {
      const result = await dataFetchers.fetchUserNotes(userId);
      return result;
    },
    {
      onSuccess: (data) => {
        setUserNotes(data);
        setDBSavedNotes(data);
      },
      revalidateIfStale: true,
      dedupingInterval: 60000,
    },
  );

  // Show loading while authentication is being checked
  if (!isLoaded || isLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          {/* Header for note view */}
          {currentView === "note" && <NoteViewHeader />}

          {currentView === "whiteboard" && <WhiteboardViewHeader />}

          {/* Header for non-note views */}
          {currentView !== "note" && currentView !== "whiteboard" && (
            <DefaultHeader />
          )}

          <div
            className={`overflow-y-auto ${currentView === "note" ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"}`}
          >
            {currentView === "home" && <HomeView />}
            {currentView === "note" && <NotebookView />}
            {currentView === "graph" && <GraphView />}
            {currentView === "whiteboard" && <WhiteboardView />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
