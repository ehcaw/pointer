import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../../../convex/_generated/api";
import { ConvexReactClient } from "convex/react";

// Define user theme preferences
export type ThemePreference = "light" | "dark" | "system";

interface UserStore {
  // User data
  userId: string | null;
  isAuthenticated: boolean;

  // Actions
  setUserId: (userId: string | null) => void;
  clearUser: () => void;
  getUserId: (convex: ConvexReactClient) => Promise<string | null>;

  // Preferences
  theme: ThemePreference;
  sidebarExpanded: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Default state
      userId: null,
      isAuthenticated: false,
      theme: "system",
      sidebarExpanded: true,

      // Actions
      setUserId: (userId) =>
        set({
          userId,
          isAuthenticated: !!userId,
        }),

      clearUser: () =>
        set({
          userId: null,
          isAuthenticated: false,
        }),

      getUserId: async (convex) => {
        const state = get();

        // If we already have a userId, return it
        if (state.userId) {
          return state.userId;
        }

        // If we don't have a userId and a convex action is provided, call it
        // if (convexAction) {
        //   try {
        //     const userId = await convexAction();
        //     if (userId) {
        //       set({ userId, isAuthenticated: true });
        //     }
        //     return userId;
        //   } catch (error) {
        //     console.error("Failed to get user ID:", error);
        //     return null;
        //   }
        // }
        //
        if (convex) {
          try {
            const userId = await convex.action(api.auth.getUserId);
            if (userId) {
              set({ userId, isAuthenticated: true });
            }
            return userId;
          } catch (error) {
            console.error("Failed to get user ID:", error);
            return null;
          }
        }

        return null;
      },

      // Preferences
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
    }),
    {
      name: "pointer-user-storage",
    },
  ),
);
