import React, { useState, useEffect } from "react";
import { useNotesStore } from "../lib/notes-store";
import { useNoteEditor } from "../hooks/useNoteEditor";

import type { FileNode } from "../types/note";
import { SimpleEditor } from "./tiptap-templates/simple/simple-editor";

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

  const [title, setTitle] = useState("");

  useEffect(() => {
    if (currentNote) setTitle(currentNote.name);
    else setTitle("");
  }, [currentNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (currentNote) {
      markNoteAsUnsaved({ ...currentNote, name: e.target.value });
    }
  };

  const handleContentUpdate = (json: object, text: string) => {
    if (currentNote?.type === "file") {
      markNoteAsUnsaved({
        ...currentNote,
        content: { ...currentNote.content, tiptap: json, text },
        lastEdited: new Date(),
      } as FileNode);
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

  const content =
    currentNote.type === "file" ? currentNote.content?.tiptap || "" : "";

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
          className="note-title-input"
        />

        <div className="note-actions">
          <button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button onClick={hna}>Back</button>
        </div>
      </div>

      <div className="note-content-editor">
        {currentNote.type === "file" && (
          <SimpleEditor
            content={currentNote.content.tiptap || {}}
            editorRef={editorRef}
            onUpdate={handleContentUpdate}
          />
        )}
        {currentNote.type === "folder" && (
          <div className="folder-view">
            <p>This is a folder. You cannot edit its content directly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
