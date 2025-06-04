import { create } from "zustand";
import type { Node } from "@/types/note";

interface NotesStore {
  openUserNotes: Node[];
  userNotes: Node[];
  editedNotes: Node[];
  treeStructure: Node[];

  setOpenUserNotes: (notes: Node[]) => void;
  setUserNotes: (notes: Node[]) => void;
  setEditedNotes: (notes: Node[]) => void;

  addOpenUserNote: (note: Node) => void;
  addUserNote: (note: Node) => void;
  addEditedNote: (note: Node) => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  openUserNotes: [],
  userNotes: [],
  editedNotes: [],
  treeStructure: [],

  setOpenUserNotes: (notes: Node[]) => set({ openUserNotes: notes }),
  setUserNotes: (notes: Node[]) => set({ userNotes: notes }),
  setEditedNotes: (notes: Node[]) => set({ editedNotes: notes }),

  addOpenUserNote: (note: Node) =>
    set((state) => ({ openUserNotes: [...state.openUserNotes, note] })),
  addUserNote: (note: Node) =>
    set((state) => ({ userNotes: [...state.userNotes, note] })),
  addEditedNote: (note: Node) =>
    set((state) => ({ editedNotes: [...state.editedNotes, note] })),

  setTreeStructure: (structure: Node[]) => set((state) -> ({state.treeStructure: structure}))
}));
