import React, { useEffect, useRef, useState } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";

interface AutoSaveProviderProps {
  children: React.ReactNode;

  /**
   * Time in milliseconds between auto-save attempts
   * Default: 30 seconds
   */
  interval?: number;

  /**
   * Whether to show a visual indicator when auto-saving
   * Default: true
   */
  showIndicator?: boolean;

  /**
   * How long to show the indicator after saving (in ms)
   * Default: 2000ms (2 seconds)
   */
  indicatorDuration?: number;
}

/**
 * AutoSaveProvider component
 *
 * Provides automatic saving of unsaved notes at regular intervals.
 * Wrapping your app with this component will ensure that changes
 * are periodically saved to the database without user intervention.
 */
export const AutoSaveProvider: React.FC<AutoSaveProviderProps> = ({
  children,
  interval = 30000, // Default: 30 seconds
  showIndicator = true,
  indicatorDuration = 2000,
}) => {
  const { hasUnsavedChanges, saveAllUnsavedNotes } = useNotesStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const indicatorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Run auto-save at set intervals
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set up new timer for auto-save
    timerRef.current = setInterval(async () => {
      if (hasUnsavedChanges()) {
        try {
          setIsSaving(true);
          await saveAllUnsavedNotes();

          if (showIndicator) {
            setShowSaved(true);

            // Clear any existing indicator timer
            if (indicatorTimerRef.current) {
              clearTimeout(indicatorTimerRef.current);
            }

            // Set timeout to hide indicator
            indicatorTimerRef.current = setTimeout(() => {
              setShowSaved(false);
            }, indicatorDuration);
          }
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, interval);

    // Clean up on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, [
    interval,
    hasUnsavedChanges,
    saveAllUnsavedNotes,
    showIndicator,
    indicatorDuration,
  ]);

  return (
    <>
      {children}

      {/* Auto-save indicator */}
      {showIndicator && (isSaving || showSaved) && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300">
          {isSaving ? "Auto-saving..." : "Changes saved"}
        </div>
      )}
    </>
  );
};

/**
 * Hook to manually trigger auto-save functionality
 */
export function useAutoSave() {
  const { hasUnsavedChanges, saveAllUnsavedNotes } = useNotesStore();
  const [isSaving, setIsSaving] = useState(false);

  const saveChanges = async () => {
    if (!hasUnsavedChanges()) return false;

    setIsSaving(true);
    try {
      await saveAllUnsavedNotes();
      return true;
    } catch (error) {
      console.error("Manual save failed:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveChanges,
    isSaving,
    hasUnsavedChanges: hasUnsavedChanges(),
  };
}
