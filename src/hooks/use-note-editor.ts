import { useEffect, useRef, useState } from "react";
import { useConvex } from "convex/react";
import { useNotesStore } from "@/lib/notes-store";
import { FileNode, Node } from "@/types/note";
import { api } from "../../convex/_generated/api";
import { ensureJSONString } from "@/lib/utils";
/**
 * Custom hook to connect TipTap editor with our notes store system.
 * Manages content syncing, saving, and unsaved changes tracking.
 * Serves as the main interface for all note operations.
 *
 * @returns Methods and state for interfacing between TipTap and the notes store
 */
export function useNoteEditor() {
  const convex = useConvex();

  // Get necessary methods from notes store
  const {
    currentNote,
    setCurrentNote,
    setUserNotes,
    setIsLoading,
    clearUnsavedNote,
    addNewUnsavedNote,
    updateNoteInCollections,
    removeNoteFromCollections,
    addOpenUserNote,
    setTreeStructure,
    dbSavedNotes,
  } = useNotesStore();

  // Local state for save operations
  const [isSaving, setIsSaving] = useState(false);

  // Reference to the TipTap editor instance
  const editorRef = useRef<{
    getJSON: () => Record<string, unknown>;
    getText: () => string;
    setJSON: (content: Record<string, unknown>) => void;
  }>(null);

  // Keep track of last known content to avoid unnecessary updates
  const lastContentRef = useRef<{
    tiptap?: string;
    text?: string;
  }>({});

  /**
   * Fetch all notes for a tenant from the database
   */
  const fetchAllNotes = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const notes = await convex.query(api.notes.readNotesFromDb, {
        user_id: tenantId,
      });

      const treeStructure = notes;

      setUserNotes(notes);
      setTreeStructure(treeStructure);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNoteById = async (noteId: string) => {
    try {
      const note = await convex.query(api.notes.findNoteByPointerId, {
        pointer_id: noteId,
      });
      if (!note) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Create a new note in the database
   */
  const createNewNote = async (name: string): Promise<FileNode> => {
    // Use a more predictable temp ID that won't cause hydration issues
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newNote: FileNode = {
      pointer_id: tempId,
      tenantId: process.env.TEMP_TENANT_ID || "12345678",
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      content: {
        tiptap:
          '{\n          type: "doc",\n          content: [\n            {\n              type: "paragraph",\n              content: [{ type: "text", text: "" }],\n            },\n          ],\n        }',
        text: "",
      },
    };

    // Add to store as unsaved
    addNewUnsavedNote(newNote);
    addOpenUserNote(newNote);
    setCurrentNote(newNote);

    return newNote;
  };

  /**
   * Save current editor content to database
   */
  const saveCurrentNote = async (): Promise<boolean> => {
    if (!currentNote) return false;

    setIsSaving(true);
    try {
      const success = await saveNote(currentNote);
      if (success) {
        console.log("Note saved successfully");
      }
      return success;
    } catch (error) {
      console.error("Error saving note:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save a specific note to the database
   */
  const saveNote = async (note: Node): Promise<boolean> => {
    try {
      const noteData = note;
      const rawTiptapContent = (noteData as FileNode).content.tiptap;
      const serializedTiptapContent = ensureJSONString(rawTiptapContent);
      const mutationData = {
        pointer_id: noteData.pointer_id,
        name: noteData.name,
        tenantId: noteData.tenantId,
        createdAt: String(noteData.createdAt),
        updatedAt: String(noteData.updatedAt),
        lastAccessed: String(new Date()),
        lastEdited: String(noteData.lastEdited || new Date()),
        content: {
          tiptap: serializedTiptapContent,
          text: (noteData as FileNode).content.text,
        },
      };

      const doesNoteExist = await fetchNoteById(note.pointer_id);
      if (doesNoteExist) {
        await convex.mutation(api.notes.updateNoteInDb, mutationData);
      } else {
        await convex.mutation(api.notes.createNoteInDb, mutationData);
      }
      const savedNote = { ...note, _id: note.pointer_id };
      updateNoteInCollections(savedNote);
      clearUnsavedNote(note.pointer_id.toString());
      dbSavedNotes.set(note.pointer_id, savedNote);

      console.log("note saved");
      return true;
    } catch (error) {
      console.error("Error saving note:", error);
      return false;
    }
  };

  /**
   * Delete a note from the database
   */
  const deleteNote = async (noteId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Only try to delete from DB if it's not a temp note
      if (!noteId.startsWith("temp-")) {
        await convex.mutation(api.notes.deleteNoteByPointerId, {
          pointer_id: noteId,
        });
      }

      // Remove from all collections in store
      removeNoteFromCollections(noteId);

      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new empty note and open it
   */
  const createEmptyNote = async (name: string = "Untitled Note") => {
    const newNote = await createNewNote(name);
    setCurrentNote(newNote);

    // Reset the last content tracking
    lastContentRef.current = {};

    return newNote;
  };

  /**
   * Open an existing note
   */
  const openNote = (note: Node) => {
    addOpenUserNote(note);
    setCurrentNote(note);
  };

  /**
   * Handle navigation away from the editor with unsaved changes check
   */
  const handleNavigateAway = (onContinue: () => void = () => {}): boolean => {
    onContinue();
    return false;
  };

  // Load initial note content when currentNote changes
  useEffect(() => {
    if (currentNote && currentNote.content?.tiptap) {
      lastContentRef.current = {
        tiptap: ensureJSONString(currentNote.content.tiptap),
        text: currentNote.content.text,
      };
    } else {
      lastContentRef.current = {};
    }
  }, [currentNote]);

  return {
    // Editor refs and state
    editorRef,
    currentNote,
    isSaving,

    // Note CRUD operations
    fetchAllNotes,
    fetchNoteById,
    createNewNote,
    createEmptyNote,
    openNote,
    saveCurrentNote,
    saveNote,
    deleteNote,

    // Navigation
    handleNavigateAway,
  };
}
