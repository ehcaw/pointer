import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { useMemo, useEffect } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { FileNode } from "@/types/note";

export const NotebookView = () => {
  const { editorRef, currentNote, isSaving, saveCurrentNote, createEmptyNote } =
    useNoteEditor();

  const { currentView, markNoteAsUnsaved, unsavedNotes } = useNotesStore();

  // Create an empty note if there isn't one already
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      createEmptyNote("Untitled Note");
    }
  }, [currentNote, currentView]);

  useEffect(() => {
    if (!currentNote || !editorRef.current) return; // Added check for editorRef.current

    // Ensure currentNote is a file before accessing content
    if (currentNote.type === "file") {
      const editorText = editorRef.current.getText();
      const currentNoteText = (currentNote as FileNode).content.text; // Declare here

      if (editorText !== currentNoteText) {
        const updatedNote = {
          ...currentNote,
          content: {
            ...currentNote.content, // Preserve other content properties
            text: editorText,
          },
        } as FileNode; // Cast to FileNode for type safety

        markNoteAsUnsaved(updatedNote);
        console.log(unsavedNotes); // Note: unsavedNotes is a snapshot from hook closure
      }
    }
  }, [markNoteAsUnsaved, currentNote, editorRef, unsavedNotes]);

  // Get TipTap content from current note
  const content =
    currentNote?.type === "file" ? currentNote.content?.tiptap || "" : "";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 h-screen overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {currentNote?.name || "Untitled Note"}
        </h2>
        <Button
          onClick={saveCurrentNote}
          disabled={isSaving}
          data-style={isSaving ? "disabled" : "primary"}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div style={{ maxHeight: "calc(100vh - 80px)" }}>
        <SimpleEditor content={content} editorRef={editorRef} />
      </div>
    </div>
  );
};
