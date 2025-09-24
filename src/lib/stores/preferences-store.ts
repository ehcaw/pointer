import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PreferencesStore {
  // UI state preferences
  currentView: "home" | "note" | "graph" | "whiteboard";

  // Preference setters
  setCurrentView: (view: "home" | "note" | "graph" | "whiteboard") => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      // UI state preferences
      currentView: "home",

      // Preference setters
      setCurrentView: (view: "home" | "note" | "graph" | "whiteboard") => {
        set({ currentView: view });
      },
    }),
    {
      name: "pointer-preferences", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist the preferences we want to save
        currentView: state.currentView,
      }),
    },
  ),
);
