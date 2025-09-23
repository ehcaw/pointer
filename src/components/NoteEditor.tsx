import React, { useState, useEffect } from "react";
import { useNotesStore } from "../lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { Input } from "./ui/input";

import { SimpleEditor } from "./tiptap/tiptap-templates/simple/simple-editor";

interface NoteEditorProps {
  noteId?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = () => {
  const { currentNote, markNoteAsUnsaved } = useNotesStore();
  const {
    editorRef,
    isSaving,
    saveCurrentNote,
    createEmptyNote,
    handleNavigateAway,
  } = useNoteEditor();

  const [, setTitle] = useState("");

  useEffect(() => {
    if (currentNote) setTitle(currentNote.name);
    else setTitle("");
  }, [currentNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setTitle(e.target.value);
    if (currentNote) {
      markNoteAsUnsaved({ ...currentNote, name: e.target.value });
    }
  };

  const handleCreateNew = () => createEmptyNote("New Note");
  const handleSave = async () => {
    const successfulUpdate = await saveCurrentNote();
    if (!successfulUpdate) {
      alert("Failed to save");
    }
  };
  const hna = async () =>
    handleNavigateAway(() => console.log("Navigated away"));

  // ——————————————————————————————
  // RENDER
  // ——————————————————————————————

  if (!currentNote) {
    return (
      <div className="note-editor-empty">
        <h2>No Note Selected</h2>
        <button onClick={handleCreateNew}>Create New Note</button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 h-screen overflow-y-auto">
      <div className="flex justify-between items-center">
        <Input
          type="text"
          value=""
          onChange={handleTitleChange}
          placeholder="Note Title"
          className="text-xl font-semibold w-2/3"
        />

        <div className="note-actions">
          <button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button onClick={hna}>Back</button>
        </div>
      </div>

      <div>
        <SimpleEditor
          content={currentNote.content.tiptap || {}}
          editorRef={editorRef}
        />
      </div>
    </div>
  );
};

export default NoteEditor;
