import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { Whiteboard } from "@/types/whiteboard";

// Your persisted app state shape
export type PersistedAppState = {
  viewBackgroundColor?: string;
  theme?: "light" | "dark";
  gridSize?: number;
  name?: string;
};

// Convert to Excalidraw's expected format
function toExcalidrawAppState(appState: PersistedAppState): Partial<AppState> {
  return {
    viewBackgroundColor: appState.viewBackgroundColor ?? "#ffffff",
    theme: (appState.theme ?? "light") as "light" | "dark",
    gridSize: appState.gridSize,
    name: appState.name,
  };
}

// Serialize for database storage (client-side only)
export async function serializeWhiteboardData(
  elements: readonly ExcalidrawElement[],
  appState: PersistedAppState,
): Promise<string | null> {
  // Only run on client side
  if (typeof window === "undefined") {
    console.warn("serializeWhiteboardData called on server side");
    return null;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { serializeAsJSON } = await import("@excalidraw/excalidraw");

    const excalidrawAppState = toExcalidrawAppState(appState);
    const emptyFiles = {} as BinaryFiles;
    return serializeAsJSON(
      elements,
      excalidrawAppState,
      emptyFiles,
      "database",
    );
  } catch (error) {
    console.error("Failed to serialize whiteboard data:", error);
    return null;
  }
}

// Deserialize whiteboard data (client-side only)
export async function deserializeWhiteboardData(
  serializedData: string,
): Promise<ExcalidrawInitialDataState | null> {
  // Only run on client side
  if (typeof window === "undefined") {
    console.warn("deserializeWhiteboardData called on server side");
    return null;
  }

  try {
    const parsed = JSON.parse(serializedData);

    if (
      !serializedData ||
      !parsed ||
      !parsed.type ||
      !parsed.version ||
      !parsed.source ||
      !parsed.elements ||
      !parsed.appState
    ) {
      return null;
    }

    // Dynamic import to avoid SSR issues
    const { loadFromBlob } = await import("@excalidraw/excalidraw");

    // Create a blob from the serialized string
    const blob = new Blob([serializedData], { type: "application/json" });

    // Use Excalidraw's loadFromBlob to parse the data
    const sceneData = await loadFromBlob(blob, null, null);

    return {
      elements: sceneData.elements,
      appState: sceneData.appState,
      scrollToContent: true, // Optional: auto-scroll to content
    };
  } catch (error) {
    console.error("Failed to deserialize whiteboard data:", error);
    return null;
  }
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
    typeof obj.serializedData === "string" &&
    typeof obj.lastModified === "string"
  );
};

// Transformation function to safely convert Convex response to Whiteboard
// Transform Convex response to Whiteboard
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const transformConvexWhiteboard = (data: any): Whiteboard | null => {
  if (!data || !isWhiteboard(data)) {
    console.warn("Invalid whiteboard data:", data);
    return null;
  }

  return {
    _id: data._id,
    _creationTime: data._creationTime,
    title: data.title,
    tenantId: data.tenantId,
    serializedData: data.serializedData,
    lastModified: data.lastModified,
  };
};

// Fallback function for when there's no serialized data
export function createDefaultWhiteboardState(): ExcalidrawInitialDataState {
  return {
    elements: [],
    appState: {
      viewBackgroundColor: "#ffffff",
      theme: "light",
    },
    scrollToContent: false,
  };
}
