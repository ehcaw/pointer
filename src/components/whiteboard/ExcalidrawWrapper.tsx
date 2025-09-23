"use client";
import { useRef, useState, useEffect } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";

import "@excalidraw/excalidraw/index.css";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawElement,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";

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

  console.log(excalidrawApi?.getAppState());
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
