import { Id } from "../../convex/_generated/dataModel";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

export interface Whiteboard {
  _id: Id<"whiteboards">;
  _creationTime: number;

  // Basic metadata
  title: string;
  tenantId: string;

  // Excalidraw core data
  elements: ExcalidrawElement[];

  // Persistent app state (filtered from ExcalidrawAppState)
  appState: WhiteboardAppState;
  lastModified: number;
}

// Filtered app state - only persistent properties
export interface WhiteboardAppState {
  viewBackgroundColor?: string;
  theme?: "light" | "dark";
  gridSize?: number;
  name?: string;
}

// Type guard to validate theme values
export const isValidTheme = (theme: string): theme is "light" | "dark" => {
  return theme === "light" || theme === "dark";
};

// Helper to normalize theme values
export const normalizeTheme = (theme?: string): "light" | "dark" => {
  if (theme && isValidTheme(theme)) {
    return theme;
  }
  return "light"; // default fallback
};

// Type guard for Whiteboard
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isWhiteboard = (obj: any): obj is Whiteboard => {
  return (
    obj &&
    typeof obj._id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.tenantId === "string" &&
    Array.isArray(obj.elements) &&
    obj.appState &&
    typeof obj.appState === "object" &&
    obj.lastModified
  );
};

// Transformation function to safely convert Convex response to Whiteboard
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const transformConvexWhiteboard = (data: any): Whiteboard | null => {
  if (!data || !isWhiteboard(data)) {
    return null;
  }

  return {
    _id: data._id,
    _creationTime: data._creationTime,
    title: data.title,
    tenantId: data.tenantId,
    elements: data.elements || [],
    appState: {
      viewBackgroundColor: data.appState?.viewBackgroundColor,
      theme: data.appState?.theme,
      gridSize: data.appState?.gridSize,
      name: data.appState?.name,
    },
    lastModified: data.lastModified,
  };
};

// Safe theme getter for Excalidraw compatibility
export const getExcalidrawTheme = (
  whiteboard: Whiteboard,
): "light" | "dark" => {
  return normalizeTheme(whiteboard.appState.theme);
};
