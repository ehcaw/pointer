"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  ExcalidrawImperativeAPI,
  AppState,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWhiteboardStore } from "@/lib/stores/whiteboard-store";
import { useWhiteboardContext } from "@/providers/WhiteboardProvider";
import { useTheme } from "@/providers/ThemeProvider";
import {
  deserializeWhiteboardData,
  createDefaultWhiteboardState,
  serializeWhiteboardData,
} from "./whiteboard-utils";
import { FONT_FAMILY } from "@excalidraw/excalidraw";

import "@excalidraw/excalidraw/index.css";

// Utility function for throttling
//eslint-disable-next-line @typescript-eslint/no-explicit-any
function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            lastRun.current = Date.now();
            callback(...args);
          },
          delay - (now - lastRun.current),
        );
      }
    }) as T,
    [callback, delay],
  );
}

// Debounced function for auto-save
//eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay],
  );
}

// Dynamically import Excalidraw to prevent SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    ),
  },
);

const ExcalidrawWrapper: React.FC = () => {
  const [excalidrawApi, setExcalidrawApi] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [initialData, setInitialData] =
    useState<ExcalidrawInitialDataState | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { whiteboard, isLoading: whiteboardLoading } = useWhiteboardContext();
  const { setPendingChanges } = useWhiteboardStore();
  const { theme, resolvedTheme } = useTheme();
  const convex = useConvex();

  // Refs for performance optimization
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const lastWhiteboardIdRef = useRef<string | null>(null);
  const pendingSerializedDataRef = useRef<string | null>(null);
  const elementsHashRef = useRef<string>("");

  const CHANGE_THROTTLE_MS = 100; // Throttle UI updates
  const AUTO_SAVE_DEBOUNCE_MS = 2000; // Debounce auto-save

  // Lightweight hash function for change detection
  const hashElements = useCallback(
    (elements: readonly ExcalidrawElement[]): string => {
      return (
        elements.length +
        "_" +
        elements.reduce((hash, el) => {
          return (
            hash + el.id + el.x + el.y + (el.width || 0) + (el.height || 0)
          );
        }, "")
      );
    },
    [],
  );

  // Set mounted state when component is client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize whiteboard data
  useEffect(() => {
    const initializeWhiteboard = async () => {
      if (
        !isMounted ||
        isInitializingRef.current ||
        whiteboardLoading ||
        !whiteboard
      ) {
        return;
      }

      if (
        hasInitializedRef.current &&
        whiteboard._id === lastWhiteboardIdRef.current
      ) {
        return;
      }

      isInitializingRef.current = true;

      try {
        let deserializedData = null;

        if (whiteboard.serializedData) {
          deserializedData = await deserializeWhiteboardData(
            whiteboard.serializedData,
          );
          deserializedData = {
            ...deserializedData,
            appState: {
              ...deserializedData?.appState,
              currentItemFontFamily: FONT_FAMILY.Nunito,
            },
          };
        }

        if (!deserializedData) {
          deserializedData = createDefaultWhiteboardState();
        }

        setInitialData(deserializedData);
        hasInitializedRef.current = true;
        lastWhiteboardIdRef.current = whiteboard._id;

        // Initialize elements hash
        if (deserializedData?.elements) {
          elementsHashRef.current = hashElements(deserializedData.elements);
        }
      } catch (error) {
        console.error("Failed to initialize whiteboard:", error);
        setInitialData(createDefaultWhiteboardState());
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeWhiteboard();
  }, [whiteboard?._id, whiteboardLoading, hashElements, isMounted]);

  // Optimized auto-save function
  const performAutoSave = useCallback(
    async (serializedData: string) => {
      if (!whiteboard || !serializedData) return;

      try {
        await convex.mutation(api.whiteboards.updateWhiteboard, {
          id: whiteboard._id,
          serializedData: serializedData,
        });
        setPendingChanges(false);
      } catch (error) {
        console.error("Auto save failed:", error);
      }
    },
    [convex, whiteboard?._id, setPendingChanges],
  );

  // Debounced auto-save
  const debouncedAutoSave = useDebounce(performAutoSave, AUTO_SAVE_DEBOUNCE_MS);

  // Throttled change handler for immediate UI updates
  const processChange = useCallback(
    async (elements: readonly ExcalidrawElement[], appState: AppState) => {
      if (isInitializingRef.current || !whiteboard) {
        return;
      }

      // Quick change detection using hash
      const newHash = hashElements(elements);
      if (newHash === elementsHashRef.current) {
        return; // No meaningful change
      }

      elementsHashRef.current = newHash;
      setPendingChanges(true);

      try {
        const whiteboardAppState = {
          viewBackgroundColor: appState.viewBackgroundColor,
          theme: resolvedTheme,
          gridSize: appState.gridSize,
          name: appState.name ?? undefined,
        };

        const serializedData = await serializeWhiteboardData(
          elements,
          whiteboardAppState,
        );

        if (serializedData) {
          pendingSerializedDataRef.current = serializedData;

          // Update store immediately for UI consistency
          useWhiteboardStore.getState().updateSerializedData(serializedData);

          // Schedule auto-save
          debouncedAutoSave(serializedData);
        }
      } catch (error) {
        console.error("Failed to process whiteboard change:", error);
      }
    },
    [whiteboard, hashElements, setPendingChanges, debouncedAutoSave],
  );

  // Throttled change handler
  const throttledHandleChange = useThrottledCallback(
    processChange,
    CHANGE_THROTTLE_MS,
  );

  // Main change handler
  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState) => {
      throttledHandleChange(elements, appState);
    },
    [throttledHandleChange],
  );

  // Update Excalidraw theme when global theme changes
  useEffect(() => {
    if (excalidrawApi) {
      excalidrawApi.updateScene({
        appState: {
          theme: resolvedTheme,
        },
      });
    }
  }, [theme, excalidrawApi, resolvedTheme]);

  // Memoized Excalidraw component to prevent unnecessary re-renders
  const excalidrawComponent = useMemo(() => {
    if (!initialData) return null;

    const UIOptions = {
      canvasActions: {
        loadScene: false,
      },
      tools: { image: false },
    };

    return (
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawApi(api)}
        onChange={handleChange}
        initialData={{
          ...initialData,
          appState: {
            ...initialData?.appState,
            theme: resolvedTheme,
          },
        }}
        // Performance optimizations
        renderTopRightUI={() => null} // Remove if you need this UI
        UIOptions={UIOptions}
      />
    );
  }, [initialData, handleChange, resolvedTheme]);

  // Show loading until we have initial data and component is mounted
  if (!isMounted || whiteboardLoading || !initialData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return <div className="w-full h-full">{excalidrawComponent}</div>;
};

export default ExcalidrawWrapper;
