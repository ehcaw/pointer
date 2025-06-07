import React, { useState, useEffect } from 'react';
import { useNotesStore } from '../lib/notes-store';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useNoteEditor } from '../hooks/useNoteEditor';
import { ObjectId } from 'mongodb';
import type { FileNode, Node } from '../types/note';
import { SimpleEditor } from './tiptap-templates/simple/simple-editor';

interface NoteEditorProps {
  // Optional - if not provided, will use currentNote from store
  noteId?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId }) => {
  const { 
    currentNote, 
    setCurrentNote,
    markNoteAsUnsaved,
  } = useNotesStore();
  
  const {
    editorRef,
    isSaving,
    saveCurrentNote,
    createEmptyNote,
    handleNavigateAway,
    updateNoteContent,
  } = useNoteEditor();
  
  // Local state for editing
  const [title, setTitle] = useState('');
  
  // Load note data when currentNote changes
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.name);
    } else {
      setTitle('');
    }
  }, [currentNote]);
  
  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    
    if (currentNote) {
      const updatedNote = {
        ...currentNote,
        name: e.target.value
      };
      markNoteAsUnsaved(updatedNote);
    }
  };
  
  // Handle content updates from TipTap
  const handleContentUpdate = (json: any, text: string) => {
    if (currentNote && currentNote.type === 'file') {
      const updatedNote = {
        ...currentNote,
        content: {
          ...currentNote.content,
          tiptap: json,
          text: text
        },
        lastEdited: new Date()
      } as FileNode;
      
      markNoteAsUnsaved(updatedNote);
    }
  };
  
  // Create a new note
  const handleCreateNew = () => {
    createEmptyNote('New Note');
  };
  
  // Save current note
  const handleSave = async () => {
    await saveCurrentNote();
  };
  
  // Example of handling navigation with unsaved changes
  const handleNavigateAway = async () => {
    await handleNavigateAway(() => {
      // Navigation callback - what to do after successful navigation
      console.log('Navigating away...');
    });
  };
  
  // Render placeholder if no note is selected
  if (!currentNote) {
    return (
      <div className="note-editor-empty">
        <h2>No Note Selected</h2>
        <button onClick={handleCreateNew}>Create New Note</button>
      </div>
    );
  }
  
  // Get TipTap content from current note
  const content = currentNote.type === 'file' ? 
    currentNote.content?.tiptap || "" : 
    "";
  
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
          <button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleNavigateAway}>
            Back
          </button>
        </div>
      </div>
      
      <div className="note-content-editor">
        {currentNote.type === 'file' && (
          <SimpleEditor
            content={content}
            editorRef={editorRef}
            onUpdate={handleContentUpdate}
          />
        )}
        
        {currentNote.type === 'folder' && (
          <div className="folder-view">
            <p>This is a folder. You cannot edit its content directly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;