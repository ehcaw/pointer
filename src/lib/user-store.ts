import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define user theme preferences
export type ThemePreference = "light" | "dark" | "system";

// Define user interface
export interface User {
  _id: string; // MongoDB ObjectId as string
  name: string;
  email: string;
  createdAt: Date;
  preferences: {
    theme: ThemePreference;
    sidebarExpanded: boolean;
    defaultEditor: "simple" | "advanced";
  };
}

interface UserStore {
  // User data
  currentUser: User | null;
  isAuthenticated: boolean;
  lastActive: Date | null;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  updateUserPreferences: (preferences: Partial<User["preferences"]>) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemePreference) => void;
  updateLastActive: () => void;

  // Beta testing features
  enableBetaFeatures: boolean;
  toggleBetaFeatures: () => void;
}

// Create the user store with persistence
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Default state - hardcoded user for beta testing
      currentUser: {
        _id: "6572ac1c9b22cc99e7f0e923", // Hardcoded ObjectID for testing
        name: "Test User",
        email: "test@example.com",
        createdAt: new Date("2023-01-01"),
        preferences: {
          theme: "system",
          sidebarExpanded: true,
          defaultEditor: "simple",
        },
      },
      isAuthenticated: true, // Auto-authenticated for beta
      lastActive: new Date(),
      enableBetaFeatures: false,

      // User actions
      setUser: (user) =>
        set({
          currentUser: user,
          isAuthenticated: true,
          lastActive: new Date(),
        }),

      clearUser: () =>
        set({
          currentUser: null,
          isAuthenticated: false,
        }),

      updateUserPreferences: (preferences) =>
        set((state) => ({
          currentUser: state.currentUser
            ? {
                ...state.currentUser,
                preferences: {
                  ...state.currentUser.preferences,
                  ...preferences,
                },
              }
            : null,
        })),

      toggleSidebar: () =>
        set((state) => ({
          currentUser: state.currentUser
            ? {
                ...state.currentUser,
                preferences: {
                  ...state.currentUser.preferences,
                  sidebarExpanded:
                    !state.currentUser.preferences.sidebarExpanded,
                },
              }
            : null,
        })),

      setTheme: (theme) =>
        set((state) => ({
          currentUser: state.currentUser
            ? {
                ...state.currentUser,
                preferences: {
                  ...state.currentUser.preferences,
                  theme,
                },
              }
            : null,
        })),

      updateLastActive: () =>
        set({
          lastActive: new Date(),
        }),

      // Beta features toggle
      toggleBetaFeatures: () =>
        set((state) => ({
          enableBetaFeatures: !state.enableBetaFeatures,
        })),
    }),
    {
      name: "quibble-user-storage", // localStorage key
      partialize: (state) => ({
        // Only persist these fields to localStorage
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        enableBetaFeatures: state.enableBetaFeatures,
      }),
    },
  ),
);
