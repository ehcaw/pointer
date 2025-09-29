import type { Attrs, Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Checks if a mark exists in the editor schema
 * @param markName - The name of the mark to check
 * @param editor - The editor instance
 * @returns boolean indicating if the mark exists in the schema
 */
export const isMarkInSchema = (
  markName: string,
  editor: Editor | null,
): boolean => {
  if (!editor?.schema) return false;
  return editor.schema.spec.marks.get(markName) !== undefined;
};

/**
 * Checks if a node exists in the editor schema
 * @param nodeName - The name of the node to check
 * @param editor - The editor instance
 * @returns boolean indicating if the node exists in the schema
 */
export const isNodeInSchema = (
  nodeName: string,
  editor: Editor | null,
): boolean => {
  if (!editor?.schema) return false;
  return editor.schema.spec.nodes.get(nodeName) !== undefined;
};

/**
 * Gets the active attributes of a specific mark in the current editor selection.
 *
 * @param editor - The Tiptap editor instance.
 * @param markName - The name of the mark to look for (e.g., "highlight", "link").
 * @returns The attributes of the active mark, or `null` if the mark is not active.
 */
export function getActiveMarkAttrs(
  editor: Editor | null,
  markName: string,
): Attrs | null {
  if (!editor) return null;
  const { state } = editor;
  const marks = state.storedMarks || state.selection.$from.marks();
  const mark = marks.find((mark) => mark.type.name === markName);

  return mark?.attrs ?? null;
}

/**
 * Checks if a node is empty
 */
export function isEmptyNode(node?: Node | null): boolean {
  return !!node && node.content.size === 0;
}

/**
 * Utility function to conditionally join class names into a single string.
 * Filters out falsey values like false, undefined, null, and empty strings.
 *
 * @param classes - List of class name strings or falsey values.
 * @returns A single space-separated string of valid class names.
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Finds the position and instance of a node in the document
 * @param props Object containing editor, node (optional), and nodePos (optional)
 * @param props.editor The TipTap editor instance
 * @param props.node The node to find (optional if nodePos is provided)
 * @param props.nodePos The position of the node to find (optional if node is provided)
 * @returns An object with the position and node, or null if not found
 */
export function findNodePosition(props: {
  editor: Editor | null;
  node?: Node | null;
  nodePos?: number | null;
}): { pos: number; node: Node } | null {
  const { editor, node, nodePos } = props;

  if (!editor || !editor.state?.doc) return null;

  // Zero is valid position
  const hasValidNode = node !== undefined && node !== null;
  const hasValidPos = nodePos !== undefined && nodePos !== null;

  if (!hasValidNode && !hasValidPos) {
    return null;
  }

  if (hasValidPos) {
    try {
      const nodeAtPos = editor.state.doc.nodeAt(nodePos!);
      if (nodeAtPos) {
        return { pos: nodePos!, node: nodeAtPos };
      }
    } catch (error) {
      console.error("Error checking node at position:", error);
      return null;
    }
  }

  // Otherwise search for the node in the document
  let foundPos = -1;
  let foundNode: Node | null = null;

  editor.state.doc.descendants((currentNode, pos) => {
    // TODO: Needed?
    // if (currentNode.type && currentNode.type.name === node!.type.name) {
    if (currentNode === node) {
      foundPos = pos;
      foundNode = currentNode;
      return false;
    }
    return true;
  });

  return foundPos !== -1 && foundNode !== null
    ? { pos: foundPos, node: foundNode }
    : null;
}

export const useTiptapImage = () => {
  const convex = useConvex();
  async function HandleImageUpload(
    file: File,
    ownerId: string,
    documentType: "notes" | "whiteboards",
    documentOwner: string,
  ): Promise<string> {
    // Validate inputs
    if (!file) {
      throw new Error("No file provided");
    }
    if (!ownerId?.trim()) {
      throw new Error("Owner ID is required");
    }
    if (!documentOwner?.trim()) {
      throw new Error("Document owner is required");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Only images are allowed.");
    }

    let storageId: string;
    let uploadUrl: string;

    try {
      // Get upload URL
      uploadUrl = await convex.mutation(api.imageReferences.generateUploadUrl);
      if (!uploadUrl) {
        throw new Error("Failed to generate upload URL");
      }
    } catch (error) {
      throw new Error(
        `Failed to get upload URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    try {
      // Upload file
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult
          .text()
          .catch(() => "Unknown error");
        throw new Error(
          `Upload failed with status ${uploadResult.status}: ${errorText}`,
        );
      }

      const uploadData = await uploadResult.json();
      if (!uploadData?.storageId) {
        throw new Error("Upload succeeded but no storage ID returned");
      }

      storageId = uploadData.storageId;
    } catch (error) {
      throw new Error(
        `File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    try {
      // Link image to document
      await convex.mutation(api.imageReferences.linkImage, {
        storageId: storageId as Id<"_storage">,
        tenantId: ownerId,
        documentOwnerType: documentType,
        documentOwner: documentOwner,
      });
    } catch (error) {
      // If linking fails, we should clean up the uploaded file
      console.warn(
        `Failed to link image ${storageId} to document, attempting cleanup:`,
        error,
      );
      try {
        await convex.mutation(api.imageReferences.unlinkImage, {
          storageId: storageId as Id<"_storage">,
          documentOwner: documentOwner,
          documentOwnerType: documentType,
        });
      } catch (cleanupError) {
        console.error("Failed to cleanup orphaned image:", cleanupError);
      }
      throw new Error(
        `Failed to link image to document: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Generate and return image URL
    try {
      const getImageUrl = new URL(
        `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/getImage`,
      );
      getImageUrl.searchParams.set("storageId", storageId);
      return getImageUrl.href;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Failed to generate image URL: ${error}`);
    }
  }

  async function HandleImageDelete(
    storageId: Id<"_storage">,
    documentOwner: string,
    documentOwnerType: "notes" | "whiteboards",
  ) {
    // Validate inputs
    if (!storageId) {
      console.warn("HandleImageDelete: No storage ID provided");
      return;
    }
    if (!documentOwner?.trim()) {
      console.warn("HandleImageDelete: No document owner provided");
      return;
    }
    if (!documentOwnerType) {
      console.warn("HandleImageDelete: No document owner type provided");
      return;
    }

    try {
      console.log("UNLINKING IMAGE ", storageId);
      await convex.mutation(api.imageReferences.unlinkImage, {
        storageId,
        documentOwner,
        documentOwnerType,
      });
    } catch (error) {
      console.error(
        `Error unlinking image ${storageId} from document ${documentOwner}:`,
        error,
      );
      // Don't throw - deletion failures shouldn't break the UI
    }
  }

  return {
    HandleImageUpload,
    HandleImageDelete,
  };
};

export const extractStorageIdFromUrl = (url: string): string | null => {
  if (!url || typeof url !== "string") {
    return null;
  }

  try {
    // Handle common Convex URL patterns
    if (
      url.includes("convex.cloud") ||
      url.includes("convex.site") ||
      url.includes("getImage")
    ) {
      const urlObj = new URL(url);
      const storageId = urlObj.searchParams.get("storageId");

      // Validate storage ID format (basic validation)
      if (storageId && storageId.length > 0 && !storageId.includes(" ")) {
        return storageId;
      }
    }

    // Handle blob URLs or data URLs
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return null;
    }

    // Handle direct storage ID patterns in path
    const pathMatch = url.match(/\/([a-zA-Z0-9_-]+)(?:\?|$)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    return null;
  } catch (error) {
    console.warn("Failed to extract storage ID from URL:", url, error);
    return null;
  }
};

/**
 * Converts a File to base64 string
 * @param file The file to convert
 * @param abortSignal Optional AbortSignal for cancelling the conversion
 * @returns Promise resolving to the base64 representation of the file
 */
export const convertFileToBase64 = (
  file: File,
  abortSignal?: AbortSignal,
): Promise<string> => {
  if (!file) {
    return Promise.reject(new Error("No file provided"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const abortHandler = () => {
      reader.abort();
      reject(new Error("Upload cancelled"));
    };

    if (abortSignal) {
      abortSignal.addEventListener("abort", abortHandler);
    }

    reader.onloadend = () => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", abortHandler);
      }

      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert File to base64"));
      }
    };

    reader.onerror = (error) =>
      reject(new Error(`File reading error: ${error}`));
    reader.readAsDataURL(file);
  });
};
