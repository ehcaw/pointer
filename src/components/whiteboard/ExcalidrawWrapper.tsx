"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import "@excalidraw/excalidraw/index.css";

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

  const handleChange = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    console.log("Excalidraw board changed!");
    console.log("Elements:", elements);
    console.log("App State:", appState);
    console.log("Files:", files);

    console.log("SKLDFJLKSDJFLKSD");

    // You can add your custom logic here
    // For example: save to localStorage, send to server, etc.
  };

  // Subscribe to changes using the API's onChange method
  useEffect(() => {
    if (!excalidrawApi) return;

    const unsubscribe = excalidrawApi.onChange((elements, appState, files) => {
      console.log("API onChange triggered!");
      console.log("Elements via API:", elements);
      console.log("App State via API:", appState);
      console.log("Files via API:", files);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [excalidrawApi]);

  // Only log app state when we're in the browser
  useEffect(() => {
    if (typeof window !== "undefined" && excalidrawApi) {
      console.log(excalidrawApi?.getAppState());
    }
  }, [excalidrawApi]);

  return (
    <div className="w-full h-full">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawApi(api)}
        onChange={handleChange}
      />
    </div>
  );
};

export default ExcalidrawWrapper;
