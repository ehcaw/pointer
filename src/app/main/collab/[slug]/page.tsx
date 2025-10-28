"use client";

import { useEffect, use } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import NoteViewHeader from "@/components/views/headers/NoteViewHeader";
import LoadingView from "@/components/views/LoadingView";
import { useNoteEditor } from "@/hooks/use-note-editor";
import CollaborativeNotebookView from "@/components/views/CollaborativeNotebookView";
import { useRouter } from "next/navigation";
import { usePreferencesStore } from "@/lib/stores/preferences-store";

export default function CollaborativeNotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { currentNote, setCurrentNote, userNotes, sharedNotes } =
    useNotesStore();
  const { setCurrentView } = usePreferencesStore();
  const router = useRouter();

  // Fetch the note by pointer_id (slug) from both userNotes and sharedNotes
  const note =
    userNotes.find((note) => note.pointer_id === slug) ||
    sharedNotes.find((note) => note.pointer_id === slug);

  // Use hooks for editor management
  const { editorRef } = useNoteEditor();

  // Set the current note when the note is loaded
  useEffect(() => {
    if (note && note.pointer_id === slug) {
      setCurrentNote(note);
    } else {
      setCurrentNote(null);
      setCurrentView("home");
      router.push("/main");
    }
  }, [note, slug, setCurrentNote, router, setCurrentView]);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current?.cleanupProvider) {
        editorRef.current.cleanupProvider();
      }
    };
  }, [editorRef]);

  if (!note || !currentNote) {
    return <LoadingView />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <NoteViewHeader />
      <div className="overflow-y-auto h-[calc(100vh-4rem)]">
        <CollaborativeNotebookView />
      </div>
    </div>
  );
}
