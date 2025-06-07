import { useEffect, useRef, useState } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { FileNode, Node, ObjectId, createObjectId } from "@/types/note";
import { useUnsavedChanges } from "./useUnsavedChanges";

/**
 * Custom hook to connect TipTap editor with our notes store system.
 * Manages content syncing, saving, and unsaved changes tracking.
 * 
 * @returns Methods and state for interfacing between TipTap and the notes store
 */
export function useNoteEditor() {
  // Get necessary methods from notes store
  const {
    currentNote,
    setCurrentNote,
    markNoteAsUnsaved,
    saveNote,
    createNewNote
  } = useNotesStore();

  // Get methods for managing unsaved changes
  const { promptForUnsavedChanges } = useUnsavedChanges();
  
  // Local state for save operations
  const [isSaving, setIsSaving] = useState(false);
  
  // Reference to the TipTap editor instance
  const editorRef = useRef<{
    getJSON: () => any;
    getText: () => string;
  }>();

  // Keep track of last known content to avoid unnecessary updates
  const lastContentRef = useRef<{
    tiptap?: Record<string, any>;
    text?: string;
  }>({});
  
  /**
   * Save current editor content to the note and mark as unsaved
   */
  const updateNoteContent = () => {
    if (!editorRef.current || !currentNote) return;
    
    try {
      // Get content from TipTap editor
      const tiptapContent = editorRef.current.getJSON();
      const textContent = editorRef.current.getText();
      
      // Skip if content hasn't changed
      if (
        JSON.stringify(lastContentRef.current.tiptap) === JSON.stringify(tiptapContent) &&
        lastContentRef.current.text === textContent
      ) {
        return;
      }
      
      // Update last known content
      lastContentRef.current = {
        tiptap: tiptapContent,
        text: textContent
      };
      
      // Only proceed if we have a current note
      if (currentNote.type === 'file') {
        const updatedNote: FileNode = {
          ...currentNote,
          content: {
            ...currentNote.content,
            tiptap: tiptapContent,
            text: textContent,
          },
          lastEdited: new Date()
        };
        
        // Mark the note as having unsaved changes
        markNoteAsUnsaved(updatedNote);
      }
    } catch (error) {
      console.error('Error updating note content:', error);
    }
  };
  
  /**
   * Save current editor content to database
   */
  const saveCurrentNote = async (): Promise<boolean> => {
    if (!currentNote) return false;
    
    // Update content from editor first
    updateNoteContent();
    
    setIsSaving(true);
    try {
      // Save to database
      await saveNote(currentNote);
      console.log('Note saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Create a new empty note
   */
  const createEmptyNote = (name: string = 'Untitled Note') => {
    const newNote = createNewNote(name, null, []);
    setCurrentNote(newNote);
    
    // Reset the last content tracking
    lastContentRef.current = {};
    
    return newNote;
  };
  
  /**
   * Handle navigation away from the editor with unsaved changes check
   */
  const handleNavigateAway = async (
    onContinue: () => void = () => {}
  ): Promise<boolean> => {
    const result = await promptForUnsavedChanges();
    
    if (result === 'save') {
      const saveResult = await saveCurrentNote();
      if (saveResult) {
        onContinue();
        return true;
      }
      return false;
    } else if (result === 'discard') {
      onContinue();
      return true;
    }
    
    // User chose cancel
    return false;
  };
  
  // Load initial note content when currentNote changes
  useEffect(() => {
    if (currentNote && currentNote.type === 'file' && currentNote.content?.tiptap) {
      lastContentRef.current = {
        tiptap: currentNote.content.tiptap,
        text: currentNote.content.text
      };
    } else {
      lastContentRef.current = {};
    }
  }, [currentNote]);
  
  // Setup debounced content update to track changes while typing
  useEffect(() => {
    // Create a debounced function to avoid excessive updates
    let debounceTimer: NodeJS.Timeout;
    
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateNoteContent();
      }, 500); // Update after 500ms of inactivity
    };
    
    // Set up an interval to check for updates
    const intervalId = setInterval(() => {
      if (editorRef.current) {
        debouncedUpdate();
      }
    }, 2000); // Check every 2 seconds
    
    return () => {
      clearTimeout(debounceTimer);
      clearInterval(intervalId);
      // Save content one last time when unmounting
      updateNoteContent();
    };
  }, [currentNote]);
  
  return {
    editorRef,
    currentNote,
    isSaving,
    updateNoteContent,
    saveCurrentNote,
    createEmptyNote,
    handleNavigateAway,
  };
}