import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { useEffect, useState } from "react"; // Removed useMemo as it's no longer used
import { useNotesStore } from "@/lib/notes-store";
import { Button } from "@/components/tiptap-ui-primitive/button";

import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export const NotebookView = () => {
  const {
    currentNote,
    editorRef,
    isSaving,
    saveCurrentNote,
    createEmptyNote,
    handleEditorUpdate,
  } = useNoteEditor(); // Imported handleEditorUpdate

  const { currentView, markNoteAsUnsaved } = useNotesStore(); // unsavedNotes and markNoteAsUnsaved are now handled inside useNoteEditor

  // Create an empty note if there isn\'t one already
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      createEmptyNote("Untitled Note");
    }
  }, [currentNote, currentView, createEmptyNote]); // Added createEmptyNote to deps

  const [title, setTitle] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setTitle(e.target.value);
    if (currentNote) {
      markNoteAsUnsaved({ ...currentNote, name: e.target.value });
    }
  };

  useEffect(() => {
    if (currentNote) setTitle(currentNote.name);
    else setTitle("");
  }, [currentNote]);
  const noteContent = currentNote
    ? currentNote.content.tiptap
    : {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 h-screen overflow-y-auto">
      <div className="flex justify-between items-center">
        {/* Replace the h2 with the Input component */}
        {/* Seamless input that looks like an h2 */}
        <Input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onFocus={() => setIsTitleFocused(true)}
          onBlur={() => setIsTitleFocused(false)}
          placeholder="Untitled Note"
          className={cn(
            "text-xl font-semibold w-2/3 bg-transparent",
            "px-0 py-1 border-0 shadow-none", // Remove input styling
            "focus:outline-none", // Remove default focus outline
            isTitleFocused
              ? "border-b-2 border-primary" // Show bottom border when focused
              : "hover:border-b-2 hover:border-gray-300 h2-styling", // Light border on hover
          )}
        />
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
          key={currentNote?.quibble_id || "new-note"}
          content={noteContent}
          editorRef={editorRef}
          onUpdate={handleEditorUpdate}
        />
      </div>
    </div>
  );
};
