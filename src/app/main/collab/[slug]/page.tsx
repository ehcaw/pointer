"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import NoteViewHeader from "@/components/views/headers/NoteViewHeader";
import LoadingView from "@/components/views/LoadingView";
import { useNoteEditor } from "@/hooks/use-note-editor";
import CollaborativeNotebookView from "@/components/views/CollaborativeNotebookView";

export default function CollaborativeNotePage() {
  const { currentNote } = useNotesStore();

  // Use hooks for editor management
  const { editorRef } = useNoteEditor();

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current?.cleanupProvider) {
        editorRef.current.cleanupProvider();
      }
    };
  }, [editorRef]);

  if (!currentNote) {
    return <LoadingView />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <NoteViewHeader />
      <CollaborativeNotebookView />
    </div>
  );
}
