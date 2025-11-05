/* eslint-disable  @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Editor, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
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
import { useNoteEditor } from "@/hooks/use-note-editor";
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
  handleContentUpdate: () => void;
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
    history: {
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
  Link.configure({ openOnClick: false }),
  SlashCommand.configure({
    suggestion: {
      char: "/",
      startOfLine: false,
    },
  }),
  Emoji.configure({
    emojis: emojis,
    enableEmoticons: true,
  }),
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

// Handle image deletion logic
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
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote } = useNotesStore();
  const currentNoteRef = useRef(currentNote);

  const { HandleImageDelete } = useTiptapImage();
  const { saveCurrentNote } = useNoteEditor();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SAVE_INTERVAL = 2500;

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

  const lastContentRef = useRef<string>("");
  const [isInitialContentLoaded, setIsInitialContentLoaded] = useState(false);

  const hasInitialSyncRef = useRef(false);

  const editor = useEditor(
    {
      enableContentCheck: true,
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
              // Disable history for collaborative editing - Y.js handles this
              history: false,
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
          if (initialContent && !isEmptyContent(initialContent)) {
            lastContentRef.current = JSON.stringify(initialContent);
          } else {
            lastContentRef.current = JSON.stringify(editor.getJSON());
          }
          return;
        }

        isRemoteChange.current = !!transaction.getMeta("y-prosemirror-plugin$");

        // Enhanced check: Don't process updates if we're still loading initial content
        if (!isInitialContentLoaded) {
          return;
        }

        // Handle slash command (lightweight)
        const { selection } = editor.state;
        const { $from } = selection;
        const textBefore = $from.nodeBefore?.textContent || "";

        const slashIndex = textBefore.lastIndexOf("/");
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

        // Handle content update with single timer approach (matches simple editor)
        handleContentUpdate();

        if (transaction.docChanged && currentNote) {
          await handleImageDeletion(
            transaction,
            currentNote,
            currentNoteRef,
            HandleImageDelete,
          );
        }
      },
    },
    [id, provider, userInfo],
  );

  // Handle content update with validation (matches simple editor pattern)
  const handleContentUpdate = useCallback(() => {
    if (!currentNote || !editor) return;

    // CRITICAL: Don't save until initial content has been loaded
    if (!isInitialContentLoaded) {
      // Still update the last content ref to track the initial state
      lastContentRef.current = JSON.stringify(editor.getJSON());
      return;
    }

    // CRITICAL: Don't save if this is a remote change during initial loading
    if (isRemoteChange.current && !lastContentRef.current) {
      return;
    }

    const currentEditorJson = editor.getJSON();
    const currentEditorText = editor.getText();
    const currentContentHash = JSON.stringify(currentEditorJson);

    // Enhanced check: Only update if content actually changed significantly
    if (currentContentHash !== lastContentRef.current) {
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
        lastContentRef.current = currentContentHash;

        // Update content immediately in memory (fast) - only for FileNode
        if (isFile(currentNote)) {
          if (!currentNote.content) {
            currentNote.content = {};
          }
          currentNote.content.tiptap = ensureJSONString(currentEditorJson);
          currentNote.content.text = currentEditorText;
          currentNote.updatedAt = new Date().toISOString();

          // Mark as unsaved only if the change is not remote and not during initial loading
          if (!isRemoteChange.current) {
            markNoteAsUnsaved(currentNote);
          }
        }

        // Setup auto-save timer
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(async () => {
          try {
            await saveCurrentNote();
            autoSaveTimeoutRef.current = null;
            removeUnsavedNote(currentNote.pointer_id);
          } catch (error) {
            console.error("Auto-save failed:", error);
          }
        }, AUTO_SAVE_INTERVAL);
      }
    }
  }, [
    currentNote,
    editor,
    markNoteAsUnsaved,
    saveCurrentNote,
    removeUnsavedNote,
    isInitialContentLoaded,
    id, // Reset when note ID changes
  ]);

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
  }, [provider, onConnectionStatusChange]);

  // Reset state when id changes to prevent data mixing
  useEffect(() => {
    setIsInitialContentLoaded(false);
    ignoreFirstUpdate.current = true;
    lastContentRef.current = "";
    hasInitialSyncRef.current = false;
  }, [id]);

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
  }, [editor, showSlashCommand]); // Also recalculate when slash command is shown

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
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote } = useNotesStore();
  const currentNoteRef = useRef(currentNote);

  const { HandleImageDelete } = useTiptapImage();
  const { saveCurrentNote } = useNoteEditor();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SAVE_DELAY = 3000;

  // Parse content appropriately based on input type
  const initialContent = useMemo(() => {
    return parseInitialContent(content);
  }, [content]);

  const lastContentRef = useRef<string>("");

  const editor = useEditor({
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
      // Handle slash command (lightweight)
      const { selection } = editor.state;
      const { $from } = selection;
      const textBefore = $from.nodeBefore?.textContent || "";

      const slashIndex = textBefore.lastIndexOf("/");
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

      // Handle content update with single timer approach
      handleContentUpdate();

      if (transaction.docChanged && currentNote) {
        await handleImageDeletion(
          transaction,
          currentNote,
          currentNoteRef,
          HandleImageDelete,
        );
      }
    },
  });

  // Optimized content update with single timer debouncing
  const handleContentUpdate = useCallback(() => {
    if (!currentNote || !editor) return;

    const currentEditorJson = editor.getJSON();
    const currentEditorText = editor.getText();
    const currentContentHash = JSON.stringify(currentEditorJson);

    // Only update if content actually changed
    if (currentContentHash !== lastContentRef.current && isFile(currentNote)) {
      lastContentRef.current = currentContentHash;

      // Update content immediately in memory (fast)
      if (!currentNote.content) {
        currentNote.content = {};
      }
      const updatedNote = {
        ...currentNote,
        updatedAt: new Date().toISOString(),
        content: {
          ...currentNote.content,
          tiptap: ensureJSONString(currentEditorJson),
          text: currentEditorText,
        },
      };

      // Mark as unsaved
      markNoteAsUnsaved(updatedNote);

      // Cancel previous save timer and set new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveCurrentNote();
          saveTimeoutRef.current = null;
          removeUnsavedNote(currentNote.pointer_id);
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }, SAVE_DELAY);
    }
  }, [
    currentNote,
    editor,
    markNoteAsUnsaved,
    saveCurrentNote,
    removeUnsavedNote,
  ]);

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
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentEditorContent = editor.getJSON();
      const currentContentHash = JSON.stringify(currentEditorContent);
      const newContentHash = JSON.stringify(initialContent);

      // Only update content if it's actually different to avoid unnecessary re-renders
      if (currentContentHash !== newContentHash) {
        editor.commands.setContent(initialContent, false); // false = don't trigger update events
        lastContentRef.current = newContentHash;
      }
    }
  }, [initialContent, editor]);

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
