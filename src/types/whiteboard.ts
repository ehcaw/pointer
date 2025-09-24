import { Id } from "../../convex/_generated/dataModel";

export interface Whiteboard {
  _id: Id<"whiteboards">;
  _creationTime: number;
  title: string;
  tenantId: string;
  serializedData: string; // Only store serialized JSON
  lastModified: string;
}

// Filtered app state - only persistent properties
export interface WhiteboardAppState {
  viewBackgroundColor?: string;
  theme?: "light" | "dark";
  gridSize?: number;
  name?: string;
}
