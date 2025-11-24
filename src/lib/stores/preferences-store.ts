import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PreferencesStore {
  // UI state preferences
  currentView: "home" | "note" | "graph" | "whiteboard" | "settings";
  currentNoteId: string | null;

  // Preference setters
  setCurrentView: (
    view: "home" | "note" | "graph" | "whiteboard" | "settings",
  ) => void;
  setCurrentNoteId: (noteId: string | null) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      // UI state preferences
      currentView: "home",
      currentNoteId: null,

      // Preference setters
      setCurrentView: (
        view: "home" | "note" | "graph" | "whiteboard" | "settings",
      ) => {
        set({ currentView: view });
      },
      setCurrentNoteId: (noteId: string | null) => {
        set({ currentNoteId: noteId });
      },
    }),
    {
      name: "pointer-preferences", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist the preferences we want to save
        currentView: state.currentView,
        currentNoteId: state.currentNoteId,
      }),
    },
  ),
);
