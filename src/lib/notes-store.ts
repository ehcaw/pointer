import { create } from "zustand";
import type { FileNode, Node, ObjectId } from "@/types/note";
import { createObjectId } from "@/types/note";
import { database } from "./services/index";

const initialNote: FileNode = {
  _id: createObjectId(),
  tenantId: createObjectId(),
  name: "Welcome Note",
  type: "file",
  parentId: null,
  path: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  content: {
    tiptap: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Welcome to your notes app!" }],
        },
      ],
    },
    text: "Welcome to your notes app!",
  },
};

interface NotesStore {
  // Core note collections
  userNotes: Node[];
  treeStructure: Node[];

  // UI state
  openUserNotes: Node[];
  currentView: "home" | "note";
  currentNote: Node | null;
  isLoading: boolean;

  // Unsaved changes tracking
  unsavedNotes: Map<string, Node>; // Key: stringified _id, Value: modified note
  newUnsavedNotes: Node[]; // New notes that haven't been saved to DB yet

  // Basic actions
  setUserNotes: (notes: Node[]) => void;
  setOpenUserNotes: (notes: Node[]) => void;
  setTreeStructure: (structure: Node[]) => void;
  setCurrentView: (view: "home" | "note") => void;
  setCurrentNote: (note: Node | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  // Note manipulation
  addOpenUserNote: (note: Node) => void;
  closeUserNote: (noteId: string) => void;

  // Unsaved changes management
  markNoteAsUnsaved: (note: Node) => void;
  createNewNote: (
    name: string,
    parentId: ObjectId | null,
    path: ObjectId[],
  ) => Node;
  hasUnsavedChanges: () => boolean;
  getUnsavedChanges: () => Node[];
  discardAllChanges: () => void;
  discardChanges: (noteId: string) => void;

  // MongoDB operations
  fetchAllNotes: (tenantId: string) => Promise<void>;
  saveNote: (note: Node) => Promise<Node>;
  saveAllUnsavedNotes: () => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  // Core note collections
  userNotes: [initialNote],
  treeStructure: [initialNote],

  // UI state
  openUserNotes: [],
  currentView: "home",
  currentNote: null,
  isLoading: false,

  // Unsaved changes tracking
  unsavedNotes: new Map([[initialNote._id.toString(), initialNote]]),
  newUnsavedNotes: [],

  // Basic actions
  setUserNotes: (notes: Node[]) => set({ userNotes: notes }),
  setOpenUserNotes: (notes: Node[]) => set({ openUserNotes: notes }),
  setTreeStructure: (structure: Node[]) => set({ treeStructure: structure }),
  setCurrentView: (view: "home" | "note") => set({ currentView: view }),
  setCurrentNote: (note: Node | null) => set({ currentNote: note }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  // Note manipulation
  addOpenUserNote: (note: Node) => {
    // Don't add duplicates
    const state = get();
    if (
      !state.openUserNotes.some((n) => n._id.toString() === note._id.toString())
    ) {
      set({
        openUserNotes: [...state.openUserNotes, note],
        currentNote: note,
        currentView: "note",
      });
    } else {
      // Just focus the note if already open
      set({
        currentNote: note,
        currentView: "note",
      });
    }
  },

  closeUserNote: (noteId: string) => {
    const state = get();

    // Check if note has unsaved changes
    const isUnsaved =
      state.unsavedNotes.has(noteId) ||
      state.newUnsavedNotes.some((n) => n._id.toString() === noteId);

    if (isUnsaved) {
      // In a real app, you'd show a confirmation dialog here
      // For now, we'll just log a warning
      console.warn("Closing a note with unsaved changes!");
    }

    // Remove from open notes
    const openUserNotes = state.openUserNotes.filter(
      (n) => n._id.toString() !== noteId,
    );

    // Set new current note (if any)
    const currentNote =
      openUserNotes.length > 0 ? openUserNotes[openUserNotes.length - 1] : null;
    const currentView = currentNote ? "note" : "home";

    set({ openUserNotes, currentNote, currentView });
  },

  // Unsaved changes management
  markNoteAsUnsaved: (note: Node) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);

    // If it's a temporary note (hasn't been saved to DB yet), update in newUnsavedNotes
    if (!note._id || note._id.toString().startsWith("temp-")) {
      const newUnsavedNotes = [...state.newUnsavedNotes];
      const index = newUnsavedNotes.findIndex((n) => n._id === note._id);

      if (index !== -1) {
        newUnsavedNotes[index] = note;
      } else {
        newUnsavedNotes.push(note);
      }

      set({ newUnsavedNotes });
    }
    // Otherwise, it's an existing note - track changes in unsavedNotes Map
    else {
      unsavedNotes.set(note._id.toString(), note);
      set({ unsavedNotes });
    }

    // Also update in the open notes list
    const openUserNotes = [...state.openUserNotes];
    const index = openUserNotes.findIndex(
      (n) => n._id.toString() === note._id.toString(),
    );

    if (index !== -1) {
      openUserNotes[index] = note;
      set({ openUserNotes });
    }
  },

  createNewNote: (
    name: string,
    parentId: ObjectId | null,
    path: ObjectId[],
  ) => {
    const state = get();

    // Generate a temporary ID for the new note
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newNote: FileNode = {
      _id: createObjectId(tempId), // Will be replaced with a real ObjectId when saved
      tenantId:
        state.userNotes.length > 0
          ? state.userNotes[0].tenantId
          : createObjectId(), // Placeholder, should be set properly
      name,
      type: "file",
      parentId,
      path,
      createdAt: new Date(),
      updatedAt: new Date(),
      content: {}, // Empty content for a new note
    };

    // Add to newUnsavedNotes
    const newUnsavedNotes = [...state.newUnsavedNotes, newNote];

    // Also add to open notes and set as current
    const openUserNotes = [...state.openUserNotes, newNote];

    set({
      newUnsavedNotes,
      openUserNotes,
      currentNote: newNote,
      currentView: "note",
    });

    return newNote;
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
    const openUserNotes = state.openUserNotes
      .map((note) => {
        if (state.unsavedNotes.has(note._id.toString())) {
          // Find original note
          return (
            state.userNotes.find(
              (n) => n._id.toString() === note._id.toString(),
            ) || note
          );
        }
        return note;
      })
      .filter((note) => {
        // Filter out any notes that were newly created but not saved
        return !note._id.toString().startsWith("temp-");
      });

    // Update current note if needed
    let currentNote = state.currentNote;
    if (
      currentNote &&
      (state.unsavedNotes.has(currentNote._id.toString()) ||
        currentNote._id.toString().startsWith("temp-"))
    ) {
      // If current note was unsaved
      currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
    }

    const currentView = currentNote ? "note" : "home";

    set({
      unsavedNotes: new Map(),
      newUnsavedNotes: [],
      openUserNotes,
      currentNote,
      currentView,
    });
  },

  discardChanges: (noteId: string) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);

    // Check if it's a new note or an existing one with unsaved changes
    const isNewNote = state.newUnsavedNotes.some(
      (n) => n._id.toString() === noteId,
    );

    if (isNewNote) {
      // Remove from new notes
      const newUnsavedNotes = state.newUnsavedNotes.filter(
        (n) => n._id.toString() !== noteId,
      );

      // Remove from open notes
      const openUserNotes = state.openUserNotes.filter(
        (n) => n._id.toString() !== noteId,
      );

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote._id.toString() === noteId) {
        currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
      }

      const currentView = currentNote ? "note" : "home";

      set({
        newUnsavedNotes,
        openUserNotes,
        currentNote,
        currentView,
      });
    } else {
      // Remove from unsaved notes Map
      unsavedNotes.delete(noteId);

      // Replace with original in open notes
      const openUserNotes = [...state.openUserNotes];
      const index = openUserNotes.findIndex((n) => n._id.toString() === noteId);

      if (index !== -1) {
        // Find original note
        const originalNote = state.userNotes.find(
          (n) => n._id.toString() === noteId,
        );

        if (originalNote) {
          openUserNotes[index] = originalNote;
        }
      }

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote._id.toString() === noteId) {
        currentNote =
          openUserNotes.find((n) => n._id.toString() === noteId) || null;
      }

      set({
        unsavedNotes,
        openUserNotes,
        currentNote,
      });
    }
  },

  // MongoDB operations
  fetchAllNotes: async (tenantId: string) => {
    set({ isLoading: true });

    try {
      const notes = await database.getAllNotes(tenantId);

      // Build tree structure from flat notes list
      const treeStructure = notes.filter((note) => note.parentId === null);

      set({
        userNotes: notes,
        treeStructure,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      set({ isLoading: false });
    }
  },

  saveNote: async (note: Node) => {
    const state = get();
    set({ isLoading: true });

    try {
      let savedNote: Node;

      // Check if it's a new note (with temp ID) or an existing one
      if (note._id.toString().startsWith("temp-")) {
        // Create new note in DB
        const { _id, ...noteData } = note;
        savedNote = await database.createNote(noteData);

        // Remove from newUnsavedNotes
        const newUnsavedNotes = state.newUnsavedNotes.filter(
          (n) => n._id.toString() !== note._id.toString(),
        );

        // Update in open notes
        const openUserNotes = state.openUserNotes.map((n) =>
          n._id.toString() === note._id.toString() ? savedNote : n,
        );

        // Update current note if needed
        let currentNote = state.currentNote;
        if (currentNote && currentNote._id.toString() === note._id.toString()) {
          currentNote = savedNote;
        }

        // Add to userNotes
        const userNotes = [...state.userNotes, savedNote];

        // Update tree structure if needed
        const treeStructure = [...state.treeStructure];
        if (!savedNote.parentId) {
          treeStructure.push(savedNote);
        }

        set({
          newUnsavedNotes,
          openUserNotes,
          currentNote,
          userNotes,
          treeStructure,
          isLoading: false,
        });
      } else {
        // Update existing note in DB
        savedNote = await database.updateNote(note._id.toString(), note);

        // Remove from unsavedNotes
        const unsavedNotes = new Map(state.unsavedNotes);
        unsavedNotes.delete(note._id.toString());

        // Update in userNotes
        const userNotes = state.userNotes.map((n) =>
          n._id.toString() === note._id.toString() ? savedNote : n,
        );

        // Update in open notes
        const openUserNotes = state.openUserNotes.map((n) =>
          n._id.toString() === note._id.toString() ? savedNote : n,
        );

        // Update current note if needed
        let currentNote = state.currentNote;
        if (currentNote && currentNote._id.toString() === note._id.toString()) {
          currentNote = savedNote;
        }

        // Update tree structure if needed
        const treeStructure = state.treeStructure.map((n) =>
          n._id.toString() === note._id.toString() ? savedNote : n,
        );

        set({
          unsavedNotes,
          userNotes,
          openUserNotes,
          currentNote,
          treeStructure,
          isLoading: false,
        });
      }

      return savedNote;
    } catch (error) {
      console.error("Failed to save note:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  saveAllUnsavedNotes: async () => {
    const state = get();
    set({ isLoading: true });

    try {
      const unsavedChanges = [
        ...Array.from(state.unsavedNotes.values()),
        ...state.newUnsavedNotes,
      ];

      if (unsavedChanges.length === 0) {
        set({ isLoading: false });
        return;
      }

      const savedNotes = await database.bulkSaveNotes(unsavedChanges);

      // Update userNotes with saved notes
      const userNotes = [...state.userNotes];

      savedNotes.forEach((savedNote) => {
        const existingIndex = userNotes.findIndex(
          (n) => n._id.toString() === savedNote._id.toString(),
        );

        if (existingIndex !== -1) {
          userNotes[existingIndex] = savedNote;
        } else {
          userNotes.push(savedNote);
        }
      });

      // Update open notes with saved versions
      const openUserNotes = state.openUserNotes.map((openNote) => {
        const savedVersion = savedNotes.find(
          (n) =>
            n._id.toString() === openNote._id.toString() ||
            (openNote._id.toString().startsWith("temp-") &&
              n.name === openNote.name),
        );

        return savedVersion || openNote;
      });

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote) {
        const savedVersion = savedNotes.find(
          (n) =>
            n._id.toString() === currentNote?._id.toString() ||
            (currentNote._id.toString().startsWith("temp-") &&
              n.name === currentNote.name),
        );

        if (savedVersion) {
          currentNote = savedVersion;
        }
      }

      // Update tree structure
      const treeStructure = state.treeStructure.map((node) => {
        const savedVersion = savedNotes.find(
          (n) => n._id.toString() === node._id.toString(),
        );

        return savedVersion || node;
      });

      // Add any new top-level nodes to tree structure
      savedNotes.forEach((savedNote) => {
        if (
          !savedNote.parentId &&
          !treeStructure.some(
            (n) => n._id.toString() === savedNote._id.toString(),
          )
        ) {
          treeStructure.push(savedNote);
        }
      });

      set({
        userNotes,
        openUserNotes,
        currentNote,
        treeStructure,
        unsavedNotes: new Map(),
        newUnsavedNotes: [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to save all notes:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteNote: async (noteId: string) => {
    const state = get();
    set({ isLoading: true });

    try {
      await database.deleteNote(noteId);

      // Remove from userNotes
      const userNotes = state.userNotes.filter(
        (n) => n._id.toString() !== noteId,
      );

      // Remove from open notes
      const openUserNotes = state.openUserNotes.filter(
        (n) => n._id.toString() !== noteId,
      );

      // Remove from tree structure
      const treeStructure = state.treeStructure.filter(
        (n) => n._id.toString() !== noteId,
      );

      // Remove from unsaved changes if present
      const unsavedNotes = new Map(state.unsavedNotes);
      unsavedNotes.delete(noteId);

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote._id.toString() === noteId) {
        currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
      }

      const currentView = currentNote ? "note" : "home";

      set({
        userNotes,
        openUserNotes,
        treeStructure,
        unsavedNotes,
        currentNote,
        currentView,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to delete note:", error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
