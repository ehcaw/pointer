import type { Editor } from "@tiptap/react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

// Helper function to check if content is empty (works with strings and objects)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmptyContent = (content: any): boolean => {
  if (!content) return true;

  if (typeof content === "string") {
    return content.trim() === "";
  }

  if (typeof content === "object" && content.type) {
    // Check if it's a TipTap document with no content
    return !content.content || content.content.length === 0;
  }

  return false;
};

export const createHocusPocusProvider = (
  url: string,
  docName: string,
  doc: Y.Doc,
) => {
  return new HocuspocusProvider({
    url,
    name: docName,
    document: doc,
  });
};

// Calculate position for slash command popup - position relative to viewport
export const getSlashCommandPosition = (editor: Editor | null) => {
  if (!editor)
    return { top: 0, left: 0, position: "fixed" as const, shouldFlip: false };

  const { selection } = editor.state;
  const { $from } = selection;
  const coords = editor.view.coordsAtPos($from.pos);

  // Estimate popup height (rough estimate based on typical content)
  const estimatedPopupHeight = 300;
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - coords.bottom;
  const spaceAbove = coords.top;

  let topPosition;
  let shouldFlip = false;

  // Decide whether to show above or below
  if (spaceBelow < estimatedPopupHeight && spaceAbove > estimatedPopupHeight) {
    // Not enough space below, but enough space above - show above
    topPosition = coords.top - estimatedPopupHeight - 4;
    shouldFlip = true;
  } else if (
    spaceBelow < estimatedPopupHeight &&
    spaceAbove <= estimatedPopupHeight
  ) {
    // Not enough space in either direction - show in the larger space
    if (spaceBelow > spaceAbove) {
      // More space below, show below even if it might be cut off
      topPosition = coords.bottom + 4;
    } else {
      // More space above, show above even if it might be cut off
      topPosition = Math.max(4, coords.top - estimatedPopupHeight - 4);
      shouldFlip = true;
    }
  } else {
    // Enough space below, show below (default behavior)
    topPosition = coords.bottom + 4;
  }

  return {
    top: topPosition,
    left: coords.left,
    position: "fixed" as const,
    shouldFlip,
  };
};

export const generateUserColor = (
  userId: string,
  userColorCache: Map<string, string>,
): string => {
  if (userColorCache.has(userId)) {
    return userColorCache.get(userId)!;
  }
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#dda0dd",
    "#98d8c8",
    "#ff7f50",
    "#74b9ff",
    "#a29bfe",
    "#fd79a8",
    "#fdcb6e",
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  userColorCache.set(userId, color);
  return color;
};
