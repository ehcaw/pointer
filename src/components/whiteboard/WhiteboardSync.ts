import { useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  ExcalidrawElement,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import { useWhiteboardApi } from "@/hooks/use-whiteboard-api";

interface UseWhiteboardSyncProps {
  whiteboardId: Id<"whiteboards">;
  userId: string;
}

export const useWhiteboardSync = ({
  whiteboardId,
  userId,
}: UseWhiteboardSyncProps) => {
  const updateWhiteboard = useMutation(api.whiteboards.update);
  const { whiteboard } = useWhiteboardApi();

  // Debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Filter appState to only persistent properties
  const filterAppState = useCallback((appState: AppState) => {
    return {
      viewBackgroundColor: appState.viewBackgroundColor,
      theme: appState.theme,
      gridSize: appState.gridSize,
      name: appState.name,
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        try {
          const now = Date.now();

          // Optimistic concurrency control
          if (whiteboard && whiteboard.lastModified > lastSaveRef.current) {
            console.warn("Whiteboard was modified by another user");
            // Handle conflict resolution here
            return;
          }

          await updateWhiteboard({
            id: whiteboardId,
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            elements: elements as any[], // Type assertion for Convex
            appState: filterAppState(appState),
            lastModifiedBy: userId,
            version: (whiteboard?.version || 0) + 1,
          });

          lastSaveRef.current = now;
          console.log("Whiteboard saved successfully");
        } catch (error) {
          console.error("Failed to save whiteboard:", error);
        }
      }, 1000); // 1 second debounce
    },
    [whiteboardId, userId, updateWhiteboard, whiteboard, filterAppState],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    whiteboard,
    saveChanges: debouncedSave,
    isLoading: whiteboard === undefined,
  };
};
