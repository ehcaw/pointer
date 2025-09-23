import { create } from "zustand";
import { Whiteboard, WhiteboardAppState } from "@/types/whiteboard";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

interface WhiteboardStore {
  whiteboard: Whiteboard | null;
  getWhiteboard: () => Whiteboard | null;
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
  updateWhiteboardAppState: (appState: Partial<WhiteboardAppState>) =>
    set((state) => ({
      whiteboard: state.whiteboard
        ? {
            ...state.whiteboard,
            appState: {
              ...state.whiteboard.appState,
              ...appState,
            },
          }
        : null,
    })),
  updateWhiteboardElements: (elements: ExcalidrawElement[]) =>
    set((state) => ({
      whiteboard: state.whiteboard
        ? {
            ...state.whiteboard,
            elements,
          }
        : null,
    })),
  updateWhiteboardAppStateAndElements: (
    appState: Partial<WhiteboardAppState>,
    elements: ExcalidrawElement[],
  ) =>
    set((state) => ({
      whiteboard: state.whiteboard
        ? {
            ...state.whiteboard,
            appState: {
              ...state.whiteboard.appState,
              ...appState,
            },
            elements,
          }
        : null,
    })),
  saveWhiteboard: () => {},
}));
