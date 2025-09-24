import { useEffect, useRef, useState } from "react";
import { useConvex } from "convex/react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { FileNode, Node } from "@/types/note";
import { api } from "../../convex/_generated/api";
import { ensureJSONString } from "@/lib/utils";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { v4 as uuidv4 } from "uuid";

/**
 * Custom hook to connect TipTap editor with our notes store system.
 * Manages content syncing, saving, and unsaved changes tracking.
 * Serves as the main interface for all note operations.
 *
 * @returns Methods and state for interfacing between TipTap and the notes store
 */
export function useNoteEditor() {
  const convex = useConvex();

  const { setCurrentView } = usePreferencesStore();
  // Get necessary methods from notes store
  const {
    currentNote,
    setCurrentNote,
    setUserNotes,
    setIsLoading,
    clearUnsavedNote,
    addNewUnsavedNote,
    updateNoteInCollections,
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
  const fetchAllNotes = async () => {
    setIsLoading(true);
    try {
      const notes = await convex.query(api.notes.readNotesFromDb, {});

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
    const id = uuidv4();

    const userId = await convex.action(api.notes.getUserId);

    const newNote: FileNode = {
      pointer_id: id,
      tenantId: userId?.toString() || "unknown",
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      content: {
        tiptap: "",
        text: "",
      },
    };

    // Add to store as unsaved
    addNewUnsavedNote(newNote);
    addOpenUserNote(newNote);
    setCurrentView("note");
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
    console.log(note.content);
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
  const deleteNote = async (
    noteId: string,
    tenantId: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Only try to delete from DB if it's not a temp note
      const updatedNotes = await convex.mutation(
        api.notes.deleteNoteByPointerId,
        {
          pointer_id: noteId,
          user_id: tenantId,
        },
      );

      // Remove from all collections in store
      // removeNoteFromCollections(noteId);
      setUserNotes(updatedNotes);
      setTreeStructure(updatedNotes);

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
