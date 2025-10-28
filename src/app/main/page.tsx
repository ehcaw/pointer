"use client";

import { HomeView } from "@/components/views/HomeView";
import GraphView from "@/components/views/GraphView";
import WhiteboardView from "@/components/views/WhiteboardView";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { NotebookView } from "@/components/views/NotebookView";
import { UserSettingsView } from "@/components/views/UserSettingsView";

import DefaultHeader from "@/components/views/headers/DefaultHeader";
import NoteViewHeader from "@/components/views/headers/NoteViewHeader";
import WhiteboardViewHeader from "@/components/views/headers/WhiteboardViewHeader";

export default function MainPage() {
  const { currentView } = usePreferencesStore();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header for note view */}
      {currentView === "note" && <NoteViewHeader />}

      {currentView === "whiteboard" && <WhiteboardViewHeader />}

      {/* Header for non-note views */}
      {currentView !== "note" &&
        currentView !== "whiteboard" &&
        currentView !== "settings" && <DefaultHeader />}

      <div className="overflow-y-auto h-[calc(100vh-4rem)]">
        {currentView === "home" && <HomeView />}
        {currentView === "note" && <NotebookView />}
        {currentView === "graph" && <GraphView />}
        {currentView === "whiteboard" && <WhiteboardView />}
        {currentView === "settings" && <UserSettingsView />}
      </div>
    </div>
  );
}
