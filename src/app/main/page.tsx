"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { HomeView } from "@/components/views/HomeView";
import GraphView from "@/components/views/GraphView";
import WhiteboardView from "@/components/views/WhiteboardView";
import LoadingView from "@/components/views/LoadingView";
import React from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { NotebookView } from "@/components/views/NotebookView";
import { UserSettingsView } from "@/components/views/UserSettingsView";
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

  const { setUserNotes, setDBSavedNotes, setSharedNotes } = useNotesStore();
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
  const { isLoading: isLoading } = useSWR(
    shouldFetch ? user.id : null,
    async (userId: string) => {
      const notes = await dataFetchers.fetchUserNotes(userId);
      const sharedNotes = await dataFetchers.fetchSharedNotes(userId);
      return {
        notes,
        sharedNotes,
      };
    },
    {
      onSuccess: (data) => {
        setUserNotes(data.notes);
        setDBSavedNotes(data.notes);
        setSharedNotes(data.sharedNotes);
      },
      revalidateIfStale: true,
      dedupingInterval: 60000,
    },
  );

  // Show loading while authentication is being checked
  if (!isLoaded || isLoading) {
    return <LoadingView />;
  }

  // Don't render main app if not signed in (prevents flash)
  if (!isSignedIn) {
    return <LoadingView />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-card to-background dark:from-background dark:via-card dark:to-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={12} minSize={7} maxSize={40}>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col h-full bg-background">
            {/* Header for note view */}
            {currentView === "note" && <NoteViewHeader />}

            {currentView === "whiteboard" && <WhiteboardViewHeader />}

            {/* Header for non-note views */}
            {currentView !== "note" &&
              currentView !== "whiteboard" &&
              currentView !== "settings" && <DefaultHeader />}

            <div className={`overflow-y-auto h-[calc(100vh-4rem)]`}>
              {currentView === "home" && <HomeView />}
              {currentView === "note" && <NotebookView />}
              {currentView === "graph" && <GraphView />}
              {currentView === "whiteboard" && <WhiteboardView />}
              {currentView === "settings" && <UserSettingsView />}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
