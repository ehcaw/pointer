/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { Editor, useEditor } from "@tiptap/react";
import { toHash } from "@/lib/utils";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extensions";
import Emoji, { emojis } from "@tiptap/extension-emoji";
import { TableKit } from "@tiptap/extension-table";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

// --- Custom Extensions ---
import { Image } from "@/components/tiptap/tiptap-extension/image-extension";
import { Link } from "@/components/tiptap/tiptap-extension/link-extension";
import { Selection } from "@/components/tiptap/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/tiptap/tiptap-extension/trailing-node-extension";
import { SlashCommand } from "@/components/tiptap/tiptap-extension/slash-command-extension";

import { useNotesStore } from "@/lib/stores/notes-store";
import { useSaveCoordinator } from "@/hooks/use-save-coordinator";
import { ensureJSONString } from "@/lib/utils";
import { useTiptapImage, extractStorageIdFromUrl } from "@/lib/tiptap-utils";
import { Id } from "../../../../../convex/_generated/dataModel";
import { isFile } from "@/types/note";
import { isEmptyContent } from "@/lib/utils/tiptapUtils";

export interface BaseEditorOptions {
  content: string | Record<string, unknown> | null | undefined;
  editorRef?: React.RefObject<{
    getJSON: () => Record<string, unknown>;
    getText: () => string;
    setJSON: (content: Record<string, unknown>) => void;
    cleanupProvider?: () => void;
    disconnectProvider?: () => void;
    reconnectProvider?: () => void;
  } | null>;
  onEditorReady?: (editor: Editor) => void;
  immediatelyRender?: boolean;
}

export interface CollaborativeEditorOptions extends BaseEditorOptions {
  id: string;
  provider?: any;
  userInfo: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  onConnectionStatusChange?: (
    status: "connecting" | "connected" | "disconnected",
  ) => void;
}

export interface CollaborativeEditorReturn {
  editor: Editor | null;
  showSlashCommand: boolean;
  setShowSlashCommand: (show: boolean) => void;
  slashCommandQuery: string;
  setSlashCommandQuery: (query: string) => void;
  slashCommandPosition: {
    top: number;
    left: number;
    position: "fixed";
    shouldFlip: boolean;
  };
  connectionStatus: "connecting" | "connected" | "disconnected";
  setConnectionStatus: (
    status: "connecting" | "connected" | "disconnected",
  ) => void;
  isInitialContentLoaded: boolean;
  handleContentUpdate: (docChanged?: boolean) => void;
  getSlashCommandPosition: () => {
    top: number;
    left: number;
    position: "fixed";
    shouldFlip: boolean;
  };
}

export interface SimpleEditorOptions extends BaseEditorOptions {
  isMobile?: boolean;
}

// Base extensions used by both editors
const getBaseExtensions = () => [
  StarterKit.configure({
    undoRedo: {
      depth: 15,
    },
  }),
  Placeholder.configure({
    placeholder: "Start writing something...",
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Underline,
  TaskList,
  TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: true }),
  Image,
  Typography,
  Superscript,
  Subscript,
  Selection,
  TrailingNode,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
  SlashCommand.configure({
    suggestion: {
      char: "/",
      startOfLine: false,
    },
  }),
  Emoji.configure({
    emojis: emojis,
    enableEmoticons: true,
  }) as any,
  TableKit.configure({
    table: { resizable: true, HTMLAttributes: { class: "tiptap-table" } },
  }),
];

// Parse content appropriately based on input type
const parseInitialContent = (
  content: string | Record<string, unknown> | null | undefined,
) => {
  if (content === null || content === undefined) {
    return "";
  }

  // If content is a string, try to parse it as JSON first
  if (typeof content === "string") {
    // If it's an empty string, return empty string for Tiptap
    if (content.trim() === "") {
      return "";
    }
    // Try to parse as JSON (for stored TipTap content)
    try {
      const parsed = JSON.parse(content);
      // Verify it looks like TipTap JSON (has type and content properties)
      if (parsed && typeof parsed === "object" && parsed.type) {
        // For simple editor, just return the parsed object
        // For collaborative editor, validation is done elsewhere
        return parsed;
      }
    } catch (e) {
      console.warn("JSON parsing failed: ", e);
    }
    return content;
  }

  // If content is already an object, return it
  if (typeof content === "object") {
    return content;
  }

  // Fallback
  return "";
};

/**
 * Performance-optimized content comparison utilities
 * These use hashing instead of JSON.stringify to avoid expensive serialization
 */

// Cache for memoizing JSON hash results to avoid redundant stringification
const jsonHashCache = new WeakMap<Record<string, unknown>, number>();

// Get a fast hash of editor text content (cheapest operation)
// Note: editor.getText() still traverses the document, use sparingly
const getContentHash = (editor: Editor): number => {
  return toHash(editor.getText());
};

// Ultra-fast check: just get document node count (doesn't traverse content)
const getDocumentNodeCount = (editor: Editor): number => {
  return editor.state.doc.nodeSize;
};

// Get a hash of the JSON structure (more expensive, but still cheaper than JSON.stringify comparison)
// Uses WeakMap cache to avoid re-hashing identical objects
const getContentJsonHash = (json: Record<string, unknown>): number => {
  // Check cache first
  const cached = jsonHashCache.get(json);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss - compute hash
  const hash = toHash(JSON.stringify(json));
  jsonHashCache.set(json, hash);
  return hash;
};

// Handle deletion of images when content changes
const handleImageDeletion = async (
  transaction: any,
  currentNote: any,
  currentNoteRef: any,
  HandleImageDelete: any,
) => {
  const getImageSrcs = (doc: typeof transaction.doc) => {
    const srcs = new Set<string>();
    doc.descendants((node: any) => {
      if (node.type.name === "image" && node.attrs?.src) {
        srcs.add(node.attrs.src);
      }
      return true;
    });
    return srcs;
  };

  const beforeSrcs = getImageSrcs(transaction.before);
  const afterSrcs = getImageSrcs(transaction.doc);

  // Find images that were deleted (in before but not in after)
  const deletedImageSrcs = [...beforeSrcs].filter((src) => !afterSrcs.has(src));

  // Process deleted images in parallel
  if (deletedImageSrcs.length > 0 && currentNote._id) {
    try {
      await Promise.all(
        deletedImageSrcs
          .map(async (src) => {
            const storageId = extractStorageIdFromUrl(src);
            if (storageId && currentNoteRef.current) {
              return HandleImageDelete(
                storageId as Id<"_storage">,
                currentNoteRef.current._id!,
                "notes",
              );
            }
          })
          .filter(Boolean), // Remove undefined promises
      );
    } catch (error) {
      console.error("Failed to unlink images:", error);
    }
  }
};

// Hook for collaborative editor
export function useCollaborativeEditor({
  id,
  content,
  provider,
  userInfo,
  onConnectionStatusChange,
  immediatelyRender = true,
}: CollaborativeEditorOptions): CollaborativeEditorReturn {
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const isRemoteChange = useRef(false);
  const ignoreFirstUpdate = useRef(true);

  // Get currentNote and state setters from the notes store
  const { currentNote } = useNotesStore();
  const currentNoteRef = useRef(currentNote);

  const { HandleImageDelete } = useTiptapImage();
  const { saveContent } = useSaveCoordinator();

  // Parse content with validation for collaborative editor
  const initialContent = useMemo(() => {
    if (content === null || content === undefined) {
      return "";
    }

    // If content is a string, try to parse it as JSON first
    if (typeof content === "string") {
      // If it's an empty string, return empty string for Tiptap
      if (content.trim() === "") {
        return "";
      }
      // Try to parse as JSON (for stored TipTap content)
      try {
        const parsed = JSON.parse(content);
        // Verify it looks like TipTap JSON (has type and content properties)
        if (parsed && typeof parsed === "object" && parsed.type) {
          // Validate the content structure - TipTap documents SHOULD have content as an array
          if (!Array.isArray(parsed.content)) {
            console.warn(
              "Invalid TipTap structure: content should be an array",
            );
            return "";
          }
          return parsed;
        }
      } catch (e) {
        console.warn("JSON parsing failed: ", e);
      }
      return content;
    }

    // If content is already an object, validate it
    if (typeof content === "object") {
      // Ensure content is a valid TipTap document object
      if (!content.type || Array.isArray(content)) {
        console.warn(
          "Invalid content structure: must have 'type' property and not be an array",
        );
        return "";
      }
      return content;
    }

    // Fallback
    return "";
  }, [content]);

  // Use hash refs instead of JSON strings for performance
  const lastTextHashRef = useRef<number>(0);
  const lastJsonHashRef = useRef<number>(0);
  const [isInitialContentLoaded, setIsInitialContentLoaded] = useState(false);

  const hasInitialSyncRef = useRef(false);

  // Use transition for non-urgent slash command updates
  const [, startTransition] = useTransition();

  // Debounce timers
  const contentUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor(
    {
      enableContentCheck: true,
      shouldRerenderOnTransaction: true,
      onContentError: ({ disableCollaboration }) => {
        disableCollaboration();
      },
      onCreate: ({ editor: currentEditor }) => {
        // Collaborative content loading logic
        if (provider && provider.on) {
          provider.on("synced", () => {
            // Only handle initial sync, not reconnection syncs
            if (hasInitialSyncRef.current) {
              // Already synced, this is a reconnection - let Y.js handle it naturally
              console.log(
                "PartyKit: Reconnection sync detected, letting Y.js handle it",
              );
              return;
            }

            hasInitialSyncRef.current = true;

            // Try to access the Y.js document through different possible properties
            let yDoc: any = null;
            if (provider.document) {
              yDoc = provider.document;
            } else if (provider.ydoc) {
              yDoc = provider.ydoc;
            }
            if (yDoc) {
              const yXmlFragment = yDoc.getXmlFragment("prosemirror");

              // Check if Y.js already has content from other clients
              const hasYjsContent = yXmlFragment.length > 0;

              if (hasYjsContent) {
                // Let Y.js content populate naturally - don't interfere
                console.log(
                  "PartyKit: Y.js has content, letting it sync naturally",
                );
                setIsInitialContentLoaded(true);
              } else if (initialContent && !isEmptyContent(initialContent)) {
                // Y.js is empty and we have initial content - we're the first client
                console.log("PartyKit: First client, setting initial content");
                currentEditor.commands.setContent(initialContent);
                setIsInitialContentLoaded(true);
              } else {
                console.log("PartyKit: No content available, starting empty");
                // Start with empty editor
                currentEditor.commands.setContent("");
                setIsInitialContentLoaded(true);
              }
            } else {
              console.log(
                "PartyKit: No Y.js document found, using initial content",
              );
              // Fallback: use initial content if available
              if (initialContent && !isEmptyContent(initialContent)) {
                currentEditor.commands.setContent(initialContent);
              } else {
                currentEditor.commands.setContent("");
              }
              setIsInitialContentLoaded(true);
            }
          });
        } else {
          // No provider available, use initial content directly
          if (initialContent && !isEmptyContent(initialContent)) {
            currentEditor.commands.setContent(initialContent);
          } else {
            currentEditor.commands.setContent("");
          }
          setIsInitialContentLoaded(true);
        }
      },
      immediatelyRender,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "on",
          autocapitalize: "off",
          "aria-label": "Main content area, start typing to enter text.",
        },
      },
      extensions: (() => {
        const baseExtensions = getBaseExtensions().map((ext) => {
          if (ext.name === "starterKit") {
            return StarterKit.configure({
              // Disable undoRedo for collaborative editing - Y.js handles this
              undoRedo: false,
            });
          }
          return ext;
        });

        // Only add collaboration extensions if provider exists
        if (provider) {
          // Try to get the Y.js document from provider
          let yDoc: any = null;
          if (provider.document) {
            yDoc = provider.document;
          } else if (provider.ydoc) {
            yDoc = provider.ydoc;
          } else if (provider.doc) {
            yDoc = provider.doc;
          }

          if (yDoc) {
            baseExtensions.push(
              Collaboration.configure({
                document: yDoc,
              }),
              CollaborationCaret.configure({
                provider: provider,
                user: {
                  name: userInfo.name,
                  color: userInfo.color,
                },
              }),
            );
          }
        }

        return baseExtensions;
      })(),

      onUpdate: async ({ editor, transaction }) => {
        // Prevent content updates when not connected
        if (connectionStatus !== "connected") {
          return;
        }

        // Enhanced first update detection to prevent saving initial content load
        if (ignoreFirstUpdate.current) {
          ignoreFirstUpdate.current = false;
          // Store the initial content hash for comparison
          lastTextHashRef.current = getDocumentNodeCount(editor);
          lastJsonHashRef.current = getContentJsonHash(editor.getJSON());
          return;
        }

        isRemoteChange.current = !!transaction.getMeta("y-prosemirror-plugin$");

        // Enhanced check: Don't process updates if we're still loading initial content
        if (!isInitialContentLoaded) {
          return;
        }

        // Handle slash command with transition (non-blocking, lower priority)
        const { selection } = editor.state;
        const { $from } = selection;
        const textBefore = $from.nodeBefore?.textContent || "";

        const slashIndex = textBefore.lastIndexOf("/");

        // Use startTransition to mark this as a non-urgent update
        startTransition(() => {
          if (slashIndex !== -1) {
            const textAfterSlash = textBefore.slice(slashIndex + 1);
            if (
              textAfterSlash.length === 0 ||
              (!textAfterSlash.includes(" ") && textAfterSlash.length < 20)
            ) {
              setShowSlashCommand(true);
              setSlashCommandQuery(textAfterSlash);
            } else {
              setShowSlashCommand(false);
              setSlashCommandQuery("");
            }
          } else {
            setShowSlashCommand(false);
            setSlashCommandQuery("");
          }
        });

        // Debounce content update - don't block typing
        if (contentUpdateTimerRef.current) {
          clearTimeout(contentUpdateTimerRef.current);
        }
        contentUpdateTimerRef.current = setTimeout(() => {
          handleContentUpdate(transaction.docChanged);
        }, 300); // 300ms debounce

        // Debounce image deletion check - expensive operation
        // Capture transaction data immediately to avoid staleness
        if (transaction.docChanged && currentNote) {
          const capturedTransaction = transaction;
          const capturedNote = currentNote;

          if (imageCheckTimerRef.current) {
            clearTimeout(imageCheckTimerRef.current);
          }
          imageCheckTimerRef.current = setTimeout(async () => {
            await handleImageDeletion(
              capturedTransaction,
              capturedNote,
              currentNoteRef,
              HandleImageDelete,
            );
          }, 1000); // 1s debounce for image checks
        }
      },
    },
    [id, provider, userInfo],
  );

  // Handle content update using the centralized save coordinator
  const handleContentUpdate = useCallback(
    (docChanged?: boolean) => {
      if (!currentNote || !editor) return;

      // CRITICAL: Don't save until initial content has been loaded
      if (!isInitialContentLoaded) {
        // Still update the last content hash to track the initial state
        lastTextHashRef.current = getContentHash(editor);
        lastJsonHashRef.current = getContentJsonHash(editor.getJSON());
        return;
      }

      // CRITICAL: Don't save if this is a remote change during initial loading
      if (isRemoteChange.current && lastTextHashRef.current === 0) {
        return;
      }

      // ULTRA-FAST: Check document size first (doesn't traverse content)
      const nodeCount = getDocumentNodeCount(editor);
      const lastNodeCount = lastTextHashRef.current;

      // If node count hasn't changed and doc didn't change, content likely hasn't changed
      // This is a very cheap check that catches most no-change cases
      // Only skip when doc didn't change AND node count is unchanged AND not initial state
      if (!docChanged && nodeCount === lastNodeCount && lastNodeCount !== 0) {
        return;
      }

      // Document structure changed, get JSON and hash it
      const currentEditorJson = editor.getJSON();
      const currentJsonHash = getContentJsonHash(currentEditorJson);

      // Only update if JSON structure actually changed
      if (currentJsonHash !== lastJsonHashRef.current) {
        const currentEditorText = editor.getText();

        // CRITICAL: Additional validation to prevent data overwriting
        const hasSignificantContent =
          currentEditorText.trim().length > 0 ||
          (currentEditorJson.content && currentEditorJson.content.length > 0);

        // CRITICAL: Prevent overwriting if this is a different note than expected
        const isMatchingNote = currentNote && currentNote.pointer_id === id;
        if (!isMatchingNote) {
          console.warn("Warning: Update attempted for wrong note ID", {
            expected: id,
            actual: currentNote?.pointer_id,
            noteName: currentNote?.name,
          });
          return;
        }

        if (
          hasSignificantContent ||
          (currentEditorText.trim() === "" && isFile(currentNote))
        ) {
          // Update hash refs (use nodeCount as text hash proxy)
          lastTextHashRef.current = nodeCount;
          lastJsonHashRef.current = currentJsonHash;

          // Save content using the centralized save coordinator
          if (isFile(currentNote) && !isRemoteChange.current) {
            saveContent(currentNote.pointer_id, {
              tiptap: ensureJSONString(currentEditorJson),
              text: currentEditorText,
            }).catch((error) => {
              console.error("Content save failed:", error);
            });
          }
        }
      }
    },
    [
      currentNote,
      editor,
      saveContent,
      isInitialContentLoaded,
      id, // Reset when note ID changes
    ],
  );

  // Monitor connection status from provider
  useEffect(() => {
    if (provider) {
      // Start with connecting status
      setConnectionStatus("connecting");
      onConnectionStatusChange?.("connecting");

      // Listen for connection events - PartyKit uses different event names
      const handleConnect = () => {
        console.log("PartyKit: Connection established");
        setConnectionStatus("connected");
        onConnectionStatusChange?.("connected");
      };

      const handleDisconnect = () => {
        console.log("PartyKit: Connection lost");
        setConnectionStatus("disconnected");
        onConnectionStatusChange?.("disconnected");
      };

      const handleSync = (isSynced: boolean) => {
        console.log("PartyKit: Sync event", isSynced);
        // When sync fires with true, it means we're properly synced
        if (isSynced) {
          setConnectionStatus("connected");
          onConnectionStatusChange?.("connected");
        }
      };

      const handleStatus = (event: { status: string }) => {
        console.log("PartyKit: Status change", event.status);
        if (event.status === "connected") {
          handleConnect();
        } else if (event.status === "disconnected") {
          handleDisconnect();
        }
      };

      // Subscribe to provider events - PartyKit uses specific event names
      if (provider.on) {
        // Y.js/WebRTC provider events
        provider.on("connect", handleConnect);
        provider.on("disconnect", handleDisconnect);
        provider.on("sync", handleSync);
        provider.on("status", handleStatus);

        // Additional synced event for when document is fully synced
        provider.on("synced", () => {
          console.log("PartyKit: Document synced");
          if (connectionStatus !== "connected") {
            handleConnect();
          }
        });

        // Listen for error events
        provider.on("connection-error", (error: { message?: string }) => {
          console.error(
            error?.message || "PartyKit: Connection error occurred",
          );
          handleDisconnect();
        });
      }

      // Check initial connection state - if provider has url, assume connecting/connected
      if (provider.url) {
        // Give it a moment to establish connection, then check
        setTimeout(() => {
          // Check if we can determine connection status from provider state
          if (provider._observers?.size > 0) {
            handleConnect();
          }
        }, 1000);
      }

      return () => {
        // Cleanup event listeners
        if (provider && provider.off) {
          provider.off("connect", handleConnect);
          provider.off("disconnect", handleDisconnect);
          provider.off("sync", handleSync);
          provider.off("synced", () => {});
          provider.off("status", handleStatus);
          provider.off("connection-error", () => {});
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, onConnectionStatusChange]);

  // Reset state when id changes to prevent data mixing
  useEffect(() => {
    setIsInitialContentLoaded(false);
    ignoreFirstUpdate.current = true;
    lastTextHashRef.current = 0; // Will store nodeCount, not text hash
    lastJsonHashRef.current = 0;
    hasInitialSyncRef.current = false;
  }, [id]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
      if (imageCheckTimerRef.current) {
        clearTimeout(imageCheckTimerRef.current);
      }
    };
  }, []);

  // Calculate position for slash command popup - position relative to viewport with awareness
  const getSlashCommandPositionDynamic = () => {
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
    if (
      spaceBelow < estimatedPopupHeight &&
      spaceAbove > estimatedPopupHeight
    ) {
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

  // Calculate slash command position dynamically
  const slashCommandPosition = useMemo(() => {
    return getSlashCommandPositionDynamic();
  }, [editor, showSlashCommand, getSlashCommandPositionDynamic]); // Also recalculate when slash command is shown

  return {
    editor,
    showSlashCommand,
    setShowSlashCommand,
    slashCommandQuery,
    setSlashCommandQuery,
    slashCommandPosition,
    connectionStatus,
    setConnectionStatus,
    isInitialContentLoaded,
    handleContentUpdate,
    getSlashCommandPosition: getSlashCommandPositionDynamic,
  };
}

// Hook for simple editor
export function useSimpleEditor({
  content,
  immediatelyRender = false,
}: SimpleEditorOptions) {
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );

  // Get currentNote and state setters from the notes store
  const { currentNote } = useNotesStore();
  const currentNoteRef = useRef(currentNote);

  const { HandleImageDelete } = useTiptapImage();
  const { saveContent } = useSaveCoordinator();

  // Parse content appropriately based on input type
  const initialContent = useMemo(() => {
    return parseInitialContent(content);
  }, [content]);

  // Use hash refs instead of JSON strings for performance
  const lastTextHashRef = useRef<number>(0);
  const lastJsonHashRef = useRef<number>(0);

  // Use transition for non-urgent slash command updates
  const [, startTransition] = useTransition();

  // Debounce timers
  const contentUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor(
    {
      immediatelyRender,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "on",
          autocapitalize: "off",
          "aria-label": "Main content area, start typing to enter text.",
        },
      },
      extensions: getBaseExtensions(),
      content: initialContent,
      onUpdate: async ({ editor, transaction }) => {
        // Handle slash command with transition (non-blocking, lower priority)
        const { selection } = editor.state;
        const { $from } = selection;
        const textBefore = $from.nodeBefore?.textContent || "";

        const slashIndex = textBefore.lastIndexOf("/");

        // Use startTransition to mark this as a non-urgent update
        startTransition(() => {
          if (slashIndex !== -1) {
            const textAfterSlash = textBefore.slice(slashIndex + 1);
            if (
              textAfterSlash.length === 0 ||
              (!textAfterSlash.includes(" ") && textAfterSlash.length < 20)
            ) {
              setShowSlashCommand(true);
              setSlashCommandQuery(textAfterSlash);
            } else {
              setShowSlashCommand(false);
              setSlashCommandQuery("");
            }
          } else {
            setShowSlashCommand(false);
            setSlashCommandQuery("");
          }
        });

        // Debounce content update - don't block typing
        if (contentUpdateTimerRef.current) {
          clearTimeout(contentUpdateTimerRef.current);
        }
        contentUpdateTimerRef.current = setTimeout(() => {
          handleContentUpdate(transaction.docChanged);
        }, 300); // 300ms debounce

        // Debounce image deletion check - expensive operation
        // Capture transaction data immediately to avoid staleness
        if (transaction.docChanged && currentNote) {
          const capturedTransaction = transaction;
          const capturedNote = currentNote;

          if (imageCheckTimerRef.current) {
            clearTimeout(imageCheckTimerRef.current);
          }
          imageCheckTimerRef.current = setTimeout(async () => {
            await handleImageDeletion(
              capturedTransaction,
              capturedNote,
              currentNoteRef,
              HandleImageDelete,
            );
          }, 1000); // 1s debounce for image checks
        }
      },
    },
    [],
  );

  // Optimized content update using the centralized save coordinator
  const handleContentUpdate = useCallback(
    (docChanged?: boolean) => {
      if (!currentNote || !editor) return;

      // ULTRA-FAST: Check document size first (doesn't traverse content)
      const nodeCount = getDocumentNodeCount(editor);
      const lastNodeCount = lastTextHashRef.current;

      // If node count hasn't changed and doc didn't change, content likely hasn't changed
      // Only skip when doc didn't change AND node count is unchanged AND not initial state
      if (!docChanged && nodeCount === lastNodeCount && lastNodeCount !== 0) {
        return;
      }

      // Document structure changed, get JSON and hash it
      const currentEditorJson = editor.getJSON();
      const currentJsonHash = getContentJsonHash(currentEditorJson);

      // Only update if JSON structure actually changed
      if (currentJsonHash !== lastJsonHashRef.current && isFile(currentNote)) {
        // Update hash refs (use nodeCount as text hash proxy)
        lastTextHashRef.current = nodeCount;
        lastJsonHashRef.current = currentJsonHash;

        const currentEditorText = editor.getText();

        // Save content using the centralized save coordinator
        saveContent(currentNote.pointer_id, {
          tiptap: ensureJSONString(currentEditorJson),
          text: currentEditorText,
        }).catch((error) => {
          console.error("Content save failed:", error);
        });
      }
    },
    [currentNote, editor, saveContent],
  );

  // Calculate position for slash command popup - position relative to viewport with awareness
  const getSlashCommandPosition = () => {
    if (!editor) return { top: 0, left: 0, position: "fixed" as const };

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
    if (
      spaceBelow < estimatedPopupHeight &&
      spaceAbove > estimatedPopupHeight
    ) {
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

  // Update editor content when content prop changes
  // Also check if initial content has changed when switching notes
  useEffect(() => {
    const currentEditorContent = editor?.getJSON();
    const currentContentHash = currentEditorContent
      ? getContentJsonHash(currentEditorContent)
      : 0;
    const newContentHash =
      typeof initialContent === "object" && initialContent !== null
        ? getContentJsonHash(initialContent as Record<string, unknown>)
        : toHash(String(initialContent));

    // Only update content if it's actually different to avoid unnecessary re-renders
    if (currentContentHash !== newContentHash && editor) {
      editor.commands.setContent(initialContent); // false = don't trigger update events
      lastTextHashRef.current = getDocumentNodeCount(editor);
      lastJsonHashRef.current = newContentHash;
    }
  }, [initialContent, editor]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
      if (imageCheckTimerRef.current) {
        clearTimeout(imageCheckTimerRef.current);
      }
    };
  }, []);

  return {
    editor,
    showSlashCommand,
    setShowSlashCommand,
    slashCommandQuery,
    setSlashCommandQuery,
    mobileView,
    setMobileView,
    getSlashCommandPosition,
    handleContentUpdate,
  };
}
