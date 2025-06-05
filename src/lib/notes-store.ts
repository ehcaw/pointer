import { create } from "zustand";
import type { Node } from "@/types/note";

interface NotesStore {
  openUserNotes: Node[];
  userNotes: Node[];
  editedNotes: Node[];
  treeStructure: Node[];
  currentView: "home" | "note";
  currentNote: Node | null;

  setOpenUserNotes: (notes: Node[]) => void;
  setUserNotes: (notes: Node[]) => void;
  setEditedNotes: (notes: Node[]) => void;

  addOpenUserNote: (note: Node) => void;
  addUserNote: (note: Node) => void;
  addEditedNote: (note: Node) => void;

  setTreeStructure: (structure: Node[]) => void;
  setCurrentView: (view: "home" | "note") => void;
  setCurrentNote: (note: Node | null) => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  openUserNotes: [],
  userNotes: [],
  editedNotes: [],
  treeStructure: [],
  currentView: "home",
  currentNote: null,

  setOpenUserNotes: (notes: Node[]) => set({ openUserNotes: notes }),
  setUserNotes: (notes: Node[]) => set({ userNotes: notes }),
  setEditedNotes: (notes: Node[]) => set({ editedNotes: notes }),
  setTreeStructure: (structure: Node[]) => set({ treeStructure: structure }),

  addOpenUserNote: (note: Node) =>
    set((state) => ({ openUserNotes: [...state.openUserNotes, note] })),
  addUserNote: (note: Node) =>
    set((state) => ({ userNotes: [...state.userNotes, note] })),
  addEditedNote: (note: Node) =>
    set((state) => ({ editedNotes: [...state.editedNotes, note] })),
  setCurrentView: (view: "home" | "note") => set({ currentView: view }),
  setCurrentNote: (note: Node | null) => set({ currentNote: note }),
}));
