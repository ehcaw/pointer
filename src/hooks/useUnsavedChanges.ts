import { useEffect } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { ask, confirm } from "@tauri-apps/plugin-dialog";

/**
 * Hook to handle unsaved changes and exit prompts
 *
 * This hook manages:
 * 1. Window beforeunload event to prompt user when closing with unsaved changes
 * 2. Tauri app close events (if using Tauri)
 * 3. Provides utilities to check for and handle unsaved changes
 */
export function useUnsavedChanges() {
  const {
    hasUnsavedChanges,
    getUnsavedChanges,
    saveAllUnsavedNotes,
    discardAllChanges,
    discardChanges,
  } = useNotesStore();

  useEffect(() => {
    // Handle browser window close attempts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        // Standard way to show a confirmation dialog when closing browser
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    // Handle Tauri app close events if available
    const setupTauriEventListener = async () => {
      try {
        // Check if we're in a Tauri app context
        if (window.__TAURI__) {
          const { appWindow } = await import("@tauri-apps/api/window");

          // Listen for close requested event
          appWindow.onCloseRequested(async (event) => {
            if (hasUnsavedChanges()) {
              // Prevent the close
              event.preventDefault();

              // Show a confirmation dialog

              const confirmed = await confirm(
                "You have unsaved changes. Do you want to save them before exiting?",
                {
                  type: "warning",
                  title: "Unsaved Changes",
                  okLabel: "Save and Exit",
                  cancelLabel: "Exit Without Saving",
                },
              );

              if (confirmed) {
                // Save changes then exit
                await saveAllUnsavedNotes();
                appWindow.close();
              } else {
                // Exit without saving
                discardAllChanges();
                appWindow.close();
              }
            }
            // If no unsaved changes, let the app close normally
          });
        }
      } catch (err: any) {
        console.log(
          "Not running in Tauri context or error setting up listeners",
          err.message,
        );
      }
    };

    // Set up event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    setupTauriEventListener();

    // Clean up
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, saveAllUnsavedNotes, discardAllChanges]);

  /**
   * Function to prompt user about saving changes
   * Returns a promise that resolves to:
   * - 'save': User wants to save changes
   * - 'discard': User wants to discard changes
   * - 'cancel': User canceled the operation
   */
  const promptForUnsavedChanges = async (): Promise<
    "save" | "discard" | "cancel"
  > => {
    if (!hasUnsavedChanges()) {
      return "save"; // No changes to save, so proceed
    }

    try {
      if (window.__TAURI__) {
        // Use Tauri dialog
        const response = await ask(
          "You have unsaved changes. Would you like to save them?",
          {
            title: "Unsaved Changes",
            okLabel: "Save",
            cancelLabel: "Discard",
          },
        );

        if (response === null) {
          return "cancel";
        } else if (response) {
          return "save";
        } else {
          return "discard";
        }
      } else {
        // Use browser confirm for web version
        const response = window.confirm(
          "You have unsaved changes. Would you like to save them?\n\nPress OK to save, Cancel to discard.",
        );

        return response ? "save" : "discard";
      }
    } catch (err) {
      console.error("Error showing dialog:", err);
      return "cancel";
    }
  };

  return {
    hasUnsavedChanges,
    getUnsavedChanges,
    saveAllUnsavedNotes,
    discardAllChanges,
    discardChanges,
    promptForUnsavedChanges,
  };
}

// Types for Tauri global
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
    };
  }
}
