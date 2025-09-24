import { create } from "zustand";
import { Whiteboard } from "@/types/whiteboard";

interface WhiteboardStore {
  whiteboard: Whiteboard | null;
  getWhiteboard: () => Whiteboard | null;
  setWhiteboard: (whiteboard: Whiteboard) => void;
  updateSerializedData: (serializedData: string) => void;
  saveWhiteboard: () => void;

  hasPendingChanges: boolean;
  setPendingChanges: (pending: boolean) => void;
  lastChangeTimestamp: number;
  setLastChangeTimestamp: (timestamp: number) => void;
}

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  whiteboard: null,
  hasPendingChanges: false,
  lastChangeTimestamp: 0,
  getWhiteboard: () => get().whiteboard,
  setWhiteboard: (whiteboard: Whiteboard) => set({ whiteboard }),
  updateSerializedData: (serializedData: string) =>
    set((state) => {
      if (state.whiteboard?.serializedData === serializedData) {
        return state; // No change needed
      }
      return {
        whiteboard: state.whiteboard
          ? {
              ...state.whiteboard,
              serializedData,
              lastModified: new Date().toISOString(),
            }
          : null,
      };
    }),
  saveWhiteboard: () => {},
  setPendingChanges: (pending: boolean) => set({ hasPendingChanges: pending }),
  setLastChangeTimestamp: (timestamp: number) =>
    set({ lastChangeTimestamp: timestamp }),
}));
