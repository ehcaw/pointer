import { create } from "zustand";
import type { Node } from "@/types/note";

interface NotesStore {
  // Core note collections
  userNotes: Node[];
  treeStructure: Node[];

  // UI state
  openUserNotes: Node[];
  currentNote: Node | null;
  isLoading: boolean;

  // Unsaved changes tracking
  unsavedNotes: Map<string, Node>; // Key: stringified _id, Value: modified note
  newUnsavedNotes: Node[]; // New notes that haven't been saved to DB yet
  dbSavedNotes: Map<string, Node>; // keeping track of how notes are currently saved in db

  // Basic state setters
  setUserNotes: (notes: Node[]) => void;
  setOpenUserNotes: (notes: Node[]) => void;
  setTreeStructure: (structure: Node[]) => void;
  setCurrentNote: (note: Node | null) => void;
  unsetCurrentNote: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setDBSavedNotes: (notes: Node[]) => void;
  saveDBSavedNote: (note: Node) => void; // update store with note as stored in database

  // Note UI management
  addOpenUserNote: (note: Node) => void;
  closeUserNote: (noteId: string) => void;

  // Unsaved changes management (pure state operations)
  markNoteAsUnsaved: (note: Node) => void;
  hasUnsavedChanges: () => boolean;
  getUnsavedChanges: () => Node[];
  discardAllChanges: () => void;
  discardChanges: (noteId: string) => void;
  clearUnsavedNote: (noteId: string) => void;
  addNewUnsavedNote: (note: Node) => void;
  removeUnsavedNote: (noteId: string) => void;
  removeNewUnsavedNote: (noteId: string) => void;
  saveAllUnsavedNotes: () => Promise<boolean>;

  // State synchronization helpers
  updateNoteInCollections: (note: Node) => void;
  removeNoteFromCollections: (noteId: string) => void;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  // Core note collections
  userNotes: [],
  treeStructure: [],

  // UI state
  openUserNotes: [],
  currentNote: null,
  isLoading: false,

  // Unsaved changes tracking
  unsavedNotes: new Map([]),
  newUnsavedNotes: [],
  dbSavedNotes: new Map([]),

  // Basic state setters
  setUserNotes: (notes: Node[]) => set({ userNotes: notes }),
  setOpenUserNotes: (notes: Node[]) => set({ openUserNotes: notes }),
  setTreeStructure: (structure: Node[]) => set({ treeStructure: structure }),
  setCurrentNote: (note: Node | null) => {
    set({ currentNote: note });
  },
  unsetCurrentNote: () => {
    set({ currentNote: null });
  },
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setDBSavedNotes: (notes: Node[]) => {
    const dbSavedNotes = new Map<string, Node>([]);
    notes.forEach((note) =>
      dbSavedNotes.set(note.pointer_id, JSON.parse(JSON.stringify(note))),
    );
    set({ dbSavedNotes });
  },
  saveDBSavedNote: (note: Node) => {
    const dbSavedNotes = get().dbSavedNotes;
    dbSavedNotes.set(note.pointer_id, JSON.parse(JSON.stringify(note)));
    set({ dbSavedNotes });
  },
  // Note UI management
  addOpenUserNote: (note: Node) => {
    const state = get();
    if (
      !state.openUserNotes.some(
        (n) => n.pointer_id.toString() === note.pointer_id.toString(),
      )
    ) {
      set({
        openUserNotes: [...state.openUserNotes, note],
        currentNote: note,
      });
    } else {
      // Just focus the note if already open
      set({
        currentNote: note,
      });
    }
  },

  closeUserNote: (noteId: string) => {
    const state = get();

    // Check if note has unsaved changes
    const isUnsaved =
      state.unsavedNotes.has(noteId) ||
      state.newUnsavedNotes.some((n) => n.pointer_id.toString() === noteId);

    if (isUnsaved) {
      console.warn("Closing a note with unsaved changes!");
    }

    // Remove from open notes
    const openUserNotes = state.openUserNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Set new current note (if any)
    const currentNote =
      openUserNotes.length > 0 ? openUserNotes[openUserNotes.length - 1] : null;

    set({ openUserNotes, currentNote });
  },

  // Unsaved changes management
  markNoteAsUnsaved: (note: Node) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.set(note.pointer_id.toString(), note);
    set({ unsavedNotes });

    // Also update in the open notes list
    const openUserNotes = [...state.openUserNotes];
    const index = openUserNotes.findIndex(
      (n) => n.pointer_id.toString() === note.pointer_id.toString(),
    );

    if (index !== -1) {
      openUserNotes[index] = note;
      set({ openUserNotes });
    }
  },

  hasUnsavedChanges: () => {
    const state = get();
    return state.unsavedNotes.size > 0 || state.newUnsavedNotes.length > 0;
  },

  getUnsavedChanges: () => {
    const state = get();
    return [
      ...Array.from(state.unsavedNotes.values()),
      ...state.newUnsavedNotes,
    ];
  },

  discardAllChanges: () => {
    const state = get();

    // Replace open notes with their original versions
    const openUserNotes = state.openUserNotes.map((note) => {
      if (state.unsavedNotes.has(note.pointer_id.toString())) {
        // Find original note
        return (
          state.userNotes.find(
            (n) => n.pointer_id.toString() === note.pointer_id.toString(),
          ) || note
        );
      }
      return note;
    });

    // Update current note if needed
    let currentNote = state.currentNote;
    if (
      currentNote &&
      state.unsavedNotes.has(currentNote.pointer_id.toString())
    ) {
      // If current note was unsaved
      currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
    }

    set({
      unsavedNotes: new Map(),
      newUnsavedNotes: [],
      openUserNotes,
      currentNote,
    });
  },

  discardChanges: (noteId: string) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);

    // Check if it's a new note or an existing one with unsaved changes
    const isNewNote = state.newUnsavedNotes.some(
      (n) => n.pointer_id.toString() === noteId,
    );

    if (isNewNote) {
      // Remove from new notes
      const newUnsavedNotes = state.newUnsavedNotes.filter(
        (n) => n.pointer_id.toString() !== noteId,
      );

      // Remove from open notes
      const openUserNotes = state.openUserNotes.filter(
        (n) => n.pointer_id.toString() !== noteId,
      );

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote.pointer_id.toString() === noteId) {
        currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
      }

      set({
        newUnsavedNotes,
        openUserNotes,
        currentNote,
      });
    } else {
      // Remove from unsaved notes Map
      unsavedNotes.delete(noteId);

      // Replace with original in open notes
      const openUserNotes = [...state.openUserNotes];
      const index = openUserNotes.findIndex(
        (n) => n.pointer_id.toString() === noteId,
      );

      if (index !== -1) {
        // Find original note
        const originalNote = state.userNotes.find(
          (n) => n.pointer_id.toString() === noteId,
        );

        if (originalNote) {
          openUserNotes[index] = originalNote;
        }
      }

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote.pointer_id.toString() === noteId) {
        currentNote =
          openUserNotes.find((n) => n.pointer_id.toString() === noteId) || null;
      }

      set({
        unsavedNotes,
        openUserNotes,
        currentNote,
      });
    }
  },

  clearUnsavedNote: (noteId: string) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.delete(noteId);
    set({ unsavedNotes });
  },

  addNewUnsavedNote: (note: Node) => {
    const state = get();
    const newUnsavedNotes = [...state.newUnsavedNotes, note];
    set({ newUnsavedNotes });
  },

  removeUnsavedNote: (noteId: string) => {
    const state = get();
    const unsavedNotes = state.unsavedNotes;
    unsavedNotes.delete(noteId);
    set({ unsavedNotes: unsavedNotes });
  },

  removeNewUnsavedNote: (noteId: string) => {
    const state = get();
    const newUnsavedNotes = state.newUnsavedNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );
    set({ newUnsavedNotes });
  },

  // State synchronization helpers
  updateNoteInCollections: (note: Node) => {
    const state = get();

    // Update in userNotes
    const userNotes = state.userNotes.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    // Update in open notes
    const openUserNotes = state.openUserNotes.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    // Update current note if needed
    let currentNote = state.currentNote;
    if (
      currentNote &&
      currentNote.pointer_id.toString() === note.pointer_id.toString()
    ) {
      currentNote = note;
    }

    // Update tree structure if needed
    const treeStructure = state.treeStructure.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    set({
      userNotes,
      openUserNotes,
      currentNote,
      treeStructure,
    });
  },

  removeNoteFromCollections: (noteId: string) => {
    const state = get();

    // Remove from userNotes
    const userNotes = state.userNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Remove from open notes
    const openUserNotes = state.openUserNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Remove from tree structure
    const treeStructure = state.treeStructure.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Remove from unsaved changes if present
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.delete(noteId);

    const newUnsavedNotes = state.newUnsavedNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Update current note if needed
    let currentNote = state.currentNote;
    if (currentNote && currentNote.pointer_id.toString() === noteId) {
      currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
    }

    set({
      userNotes,
      openUserNotes,
      treeStructure,
      unsavedNotes,
      newUnsavedNotes,
      currentNote,
    });
  },
  saveAllUnsavedNotes: async () => {
    const state = get();
    const unsavedChanges = [
      ...Array.from(state.unsavedNotes.values()),
      ...state.newUnsavedNotes,
    ];

    if (unsavedChanges.length === 0) return true;

    try {
      const updatedUserNotes = [...state.userNotes];
      const updatedOpenUserNotes = [...state.openUserNotes];
      const updatedTreeStructure = [...state.treeStructure];
      let updatedCurrentNote = state.currentNote;

      for (const note of unsavedChanges) {
        const noteId = note.pointer_id.toString();

        // Update or add to userNotes
        const userNoteIndex = updatedUserNotes.findIndex(
          (n) => n.pointer_id.toString() === noteId,
        );
        if (userNoteIndex !== -1) {
          updatedUserNotes[userNoteIndex] = note;
        } else {
          updatedUserNotes.push(note); // Add new notes to userNotes
        }

        // Update open notes
        const openNoteIndex = updatedOpenUserNotes.findIndex(
          (n) => n.pointer_id.toString() === noteId,
        );
        if (openNoteIndex !== -1) {
          updatedOpenUserNotes[openNoteIndex] = note;
        }

        // Update current note if it's the one being saved
        if (
          updatedCurrentNote &&
          updatedCurrentNote.pointer_id.toString() === noteId
        ) {
          updatedCurrentNote = note;
        }

        // Update or add to tree structure
        const treeNoteIndex = updatedTreeStructure.findIndex(
          (n) => n.pointer_id.toString() === noteId,
        );
        if (treeNoteIndex !== -1) {
          updatedTreeStructure[treeNoteIndex] = note;
        } else {
          updatedTreeStructure.push(note); // Add new notes to treeStructure
        }
      }

      // Perform a single, batched state update
      set({
        userNotes: updatedUserNotes,
        openUserNotes: updatedOpenUserNotes,
        treeStructure: updatedTreeStructure,
        currentNote: updatedCurrentNote,
        unsavedNotes: new Map(),
        newUnsavedNotes: [],
      });
      return true;
    } catch (error) {
      console.error("Error saving all notes:", error);
      return false;
    }
  },
}));
