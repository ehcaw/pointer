import { useEffect, useRef, useState, useCallback } from "react";
import { useConvex } from "convex/react";
import { createDataFetchers } from "@/lib/utils/dataFetchers";
import { useNotesStore, useRecentNotes } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { useNoteEditor } from "./use-note-editor";
import { isFile } from "@/types/note";

export const useNoteContent = () => {
  const { currentNote } = useNoteEditor();
  const { setCurrentNote } = useNotesStore();
  const { currentView } = usePreferencesStore();

  const [noteContent, setNoteContent] = useState(
    (currentNote && isFile(currentNote) && currentNote?.content?.tiptap) || "",
  );
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const convex = useConvex();
  const { fetchNoteContentById } = createDataFetchers(convex);

  // Track the current note ID to prevent race conditions
  const currentNoteIdRef = useRef<string | null>(null);

  const updateNoteInCollections = useNotesStore(
    (state) => state.updateNoteInCollections,
  );
  const lastOpenedNote = useRecentNotes()[0];

  // Memoized content loading function
  const loadNoteContent = useCallback(
    async (noteId: string) => {
      if (!noteId) return;

      setIsLoadingContent(true);
      try {
        const content = await fetchNoteContentById(noteId);
        const parsed = JSON.parse(content);

        // Update the content state
        setNoteContent(parsed.tiptap || "");

        // Update the note in store if found
        const noteInStore = useNotesStore.getState().findNoteById(noteId);
        if (noteInStore && isFile(noteInStore)) {
          updateNoteInCollections({
            ...noteInStore,
            content: parsed,
          });
        }
      } catch (error) {
        console.error("Failed to load note content:", error);
        setNoteContent("");
      } finally {
        setIsLoadingContent(false);
      }
    },
    [fetchNoteContentById, updateNoteInCollections],
  );

  // Handle content loading when currentNote changes
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      setCurrentNote(lastOpenedNote);
      return;
    }

    if (!currentNote) return;

    const noteId =
      currentNote._id?.toString() || currentNote.pointer_id?.toString();

    // Skip if this is the same note we're already loading
    if (currentNoteIdRef.current === noteId) return;

    currentNoteIdRef.current = noteId;

    // Load content if not available or if tiptap content is missing
    if (currentNote && isFile(currentNote) && !currentNote?.content?.tiptap) {
      loadNoteContent(noteId);
    } else {
      setNoteContent(
        (isFile(currentNote) && currentNote?.content?.tiptap) || "",
      );
    }
  }, [
    currentNote,
    loadNoteContent,
    currentView,
    lastOpenedNote,
    setCurrentNote,
  ]);

  // Reset note ID ref when component unmounts or note changes
  useEffect(() => {
    return () => {
      if (!currentNote) {
        currentNoteIdRef.current = null;
      }
    };
  }, [currentNote]);

  return {
    noteContent,
    isLoadingContent,
    currentNoteIdRef,
  };
};
