import { create } from "zustand";
import { Whiteboard, WhiteboardAppState } from "@/types/whiteboard";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

interface WhiteboardStore {
  whiteboard: Whiteboard | null;
  setWhiteboard: (whiteboard: Whiteboard) => void;
  updateWhiteboardAppState: (appState: Partial<WhiteboardAppState>) => void;
  updateWhiteboardElements: (elements: ExcalidrawElement[]) => void;
  updateWhiteboardAppStateAndElements: (
    appState: Partial<WhiteboardAppState>,
    elements: ExcalidrawElement[],
  ) => void;
  saveWhiteboard: () => void;
}

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  whiteboard: null,
  getWhiteboard: () => get().whiteboard,
  setWhiteboard: (whiteboard: Whiteboard) => set({ whiteboard }),
  updateWhiteboardAppState: (appState: Partial<WhiteboardAppState>) => {},
  updateWhiteboardElements: (elements: ExcalidrawElement[]) => {},
  updateWhiteboardAppStateAndElements: (
    appState: Partial<WhiteboardAppState>,
    elements: ExcalidrawElement[],
  ) => {},
  saveWhiteboard: () => {},
}));
