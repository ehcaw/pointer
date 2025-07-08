import { useEffect, useRef, useState } from "react";
import { useConvex } from "convex/react";
import { useNotesStore } from "@/lib/notes-store";
import { FileNode, Node } from "@/types/note";
import { api } from "../../convex/_generated/api";
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
    markNoteAsUnsaved,
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
    tiptap?: Record<string, unknown>;
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

      console.log("USE NOTES API ", notes);

      // Build tree structure from flat notes lista
      const treeStructure = notes.filter((note) => note.parentId === null);

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
      const note = await convex.query(api.notes.findNoteByQuibbleId, {
        quibble_id: noteId,
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
  const createNewNote = async (
    name: string,
    parentId: string | null = null,
    path: string[] = [],
  ): Promise<FileNode> => {
    const tempId = `${Date.now()}-${Math.random()}`;

    const newNote: FileNode = {
      quibble_id: tempId,
      tenantId: process.env.TEMP_TENANT_ID || "12345678",
      name,
      type: "file",
      parentId,
      path,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEdited: new Date(),
      content: {
        tiptap: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            },
          ],
        },
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
      const mutationData = {
        quibble_id: noteData.quibble_id,
        name: noteData.name,
        tenantId: noteData.tenantId,
        parentId: noteData.parentId || "",
        path: noteData.path || [],
        createdAt: String(noteData.createdAt),
        updatedAt: String(noteData.updatedAt),
        lastAccessed: String(new Date()),
        lastEdited: String(noteData.lastEdited || new Date()),
        content: {
          tiptap: (noteData as FileNode).content.tiptap,
          text: (noteData as FileNode).content.text,
        },
      };

      const doesNoteExist = await fetchNoteById(note.quibble_id);
      if (doesNoteExist) {
        await convex.mutation(api.notes.updateNoteInDb, mutationData);
      } else {
        await convex.mutation(api.notes.createNoteInDb, mutationData);
      }
      const savedNote = { ...note, _id: note.quibble_id };
      updateNoteInCollections(savedNote);
      clearUnsavedNote(note.quibble_id.toString());
      dbSavedNotes.set(note.quibble_id, savedNote);

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
        await convex.mutation(api.notes.deleteNoteByQuibbleId, {
          quibble_id: noteId,
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
    const newNote = await createNewNote(name, null, []);
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
    return false;
  };

  // Load initial note content when currentNote changes
  useEffect(() => {
    if (
      currentNote &&
      currentNote.type === "file" &&
      currentNote.content?.tiptap
    ) {
      lastContentRef.current = {
        tiptap: currentNote.content.tiptap,
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
