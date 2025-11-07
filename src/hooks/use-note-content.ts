import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNotesStore, useRecentNotes } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { useNoteEditor } from "./use-note-editor";
import { isFile } from "@/types/note";

export const useNoteContent = () => {
  const { currentNote } = useNoteEditor();
  const { setCurrentNote } = useNotesStore();
  const { currentView } = usePreferencesStore();

  const updateNoteInCollections = useNotesStore(
    (state) => state.updateNoteInCollections,
  );
  const lastOpenedNote = useRecentNotes()[0];

  // Handle fallback to last opened note
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      setCurrentNote(lastOpenedNote);
    }
  }, [currentNote, currentView, lastOpenedNote, setCurrentNote]);

  const noteId = currentNote?._id?.toString() || currentNote?.pointer_id?.toString();

  // Use Convex's reactive query for real-time content updates
  const content = useQuery(
    api.notesContent.getNoteContentById,
    noteId && currentNote && isFile(currentNote) ? { noteId } : "skip",
  );

  const isLoadingContent = content === undefined;
  const noteContent = content?.tiptap || "";

  // Sync content to store when it loads
  useEffect(() => {
    if (content && noteId) {
      const noteInStore = useNotesStore.getState().findNoteById(noteId);
      if (noteInStore && isFile(noteInStore)) {
        updateNoteInCollections({
          ...noteInStore,
          content,
        });
      }
    }
  }, [content, noteId, updateNoteInCollections]);

  return {
    noteContent,
    isLoadingContent,
  };
};
