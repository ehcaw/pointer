import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { useEffect } from "react"; // Removed useMemo as it's no longer used
import { useNotesStore } from "@/lib/notes-store";
import { Button } from "@/components/tiptap-ui-primitive/button";
// FileNode import is not directly used here anymore, removed for cleanliness if not needed elsewhere

export const NotebookView = () => {
  const { editorRef, currentNote, isSaving, saveCurrentNote, createEmptyNote, handleEditorUpdate } = // Imported handleEditorUpdate
    useNoteEditor();

  const { currentView } = useNotesStore(); // unsavedNotes and markNoteAsUnsaved are now handled inside useNoteEditor

  // Create an empty note if there isn\'t one already
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      createEmptyNote("Untitled Note");
    }
  }, [currentNote, currentView, createEmptyNote]); // Added createEmptyNote to deps

  // Removed the manual useEffect hook that checked editorRef.current.getText()
  // Changes will now be detected by TipTap's onUpdate event passed to SimpleEditor

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
        <SimpleEditor
          content={content}
          editorRef={editorRef}
          onUpdate={handleEditorUpdate} // Pass the handler to the SimpleEditor
        />
      </div>
    </div>
  );
};
