"use client";
import { CollaborativeEditor } from "../tiptap/tiptap-templates/collaborative/collaborative-editor";
import { FloatingToolbar } from "../tiptap/tiptap-templates/toolbar/FloatingToolbar";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useEffect, useRef, useState, useCallback } from "react";
import { Clock } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Editor } from "@tiptap/react";
import { useConvex } from "convex/react";
import { createDataFetchers } from "@/lib/utils/dataFetchers";
import { useNotesStore, useRecentNotes } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";

export const CollaborativeNotebookView = ({}) => {
  const { currentNote, editorRef } = useNoteEditor();

  const { setCurrentNote } = useNotesStore();
  const { currentView } = usePreferencesStore();

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [noteContent, setNoteContent] = useState(
    currentNote?.content?.tiptap || "",
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

        const noteInStore = useNotesStore
          .getState()
          .userNotes.find(
            (note) =>
              note.pointer_id?.toString() ===
              currentNote?.pointer_id?.toString(),
          );
        if (noteInStore) {
          updateNoteInCollections({
            ...noteInStore,
            content: parsed,
          });
        }
      } catch (error) {
        console.error("Failed to load collaborative note content:", error);
        setNoteContent("");
      } finally {
        setIsLoadingContent(false);
      }
    },
    [fetchNoteContentById, currentNote, updateNoteInCollections],
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
    if (!currentNote?.content?.tiptap) {
      loadNoteContent(noteId);
    } else {
      setNoteContent(currentNote.content.tiptap || "");
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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-background dark:from-background dark:via-background dark:to-background">
      {/* Main Editor */}
      <div className="px-6 py-8 pb-20">
        <div className="mx-auto max-w-[100%]">
          {/* Floating Toolbar */}
          {editor && editorContainerRef.current && (
            <FloatingToolbar
              editor={editor}
              editorContainerRef={editorContainerRef}
            />
          )}
          <div className="bg-card rounded-sm shadow-sm border border-border overflow-hidden">
            <div
              className="w-full min-h-[calc(100vh-240px)]"
              ref={editorContainerRef}
            >
              <CollaborativeEditor
                id={currentNote?.pointer_id || "default-doc"}
                key={currentNote?.pointer_id || "default-doc"}
                content={isLoadingContent ? "" : noteContent}
                editorRef={editorRef}
                onEditorReady={setEditor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with note info */}
      {currentNote && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 dark:bg-background/80 backdrop-blur-sm border-t border-border dark:border-border h-16">
          <div className="px-6 py-4 h-full">
            <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground h-full">
              <div className="flex items-center gap-4"></div>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  Last saved {new Date(currentNote.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
