/* eslint-disable  @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

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
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import useYProvider from "y-partykit/react";
import * as Y from "yjs";

// --- Custom Extensions ---
import { Image } from "@/components/tiptap/tiptap-extension/image-extension";
import { Link } from "@/components/tiptap/tiptap-extension/link-extension";
import { Selection } from "@/components/tiptap/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/tiptap/tiptap-extension/trailing-node-extension";
import { SlashCommand } from "@/components/tiptap/tiptap-extension/slash-command-extension";

// --- Tiptap Node ---
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap/tiptap-node/table-node/table-node.scss";

// --- Components ---
import { SlashCommandPopup } from "@/components/tiptap/tiptap-ui/slash-command-popup";

// --- Styles ---
import "@/components/tiptap/tiptap-templates/editor.scss";
import "@/components/tiptap/tiptap-templates/active-button.scss";

import { useNotesStore } from "@/lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { ensureJSONString } from "@/lib/utils";
import { useTiptapImage, extractStorageIdFromUrl } from "@/lib/tiptap-utils";
import { useUser } from "@clerk/nextjs";
import StatusBadge from "../toolbar/WebsocketStatusBadge";
import { generateUserColor } from "@/lib/utils/tiptapUtils";
import { isFile } from "@/types/note";

import {
  getSlashCommandPosition,
  isEmptyContent,
} from "@/lib/utils/tiptapUtils";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CollaborativeEditorProps {
  id: string;
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
  onConnectionStatusChange?: (
    status: "connecting" | "connected" | "disconnected",
  ) => void;
}

export function CollaborativeEditor({
  id,
  content,
  editorRef,
  onEditorReady,
  onConnectionStatusChange,
}: CollaborativeEditorProps) {
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  const isRemoteChange = useRef(false);
  const ignoreFirstUpdate = useRef(true);

  const userColorCache = new Map<string, string>();

  // Get currentNote and state setters from the notes store
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote, dbSavedNotes } =
    useNotesStore();
  const currentNoteRef = useRef(currentNote);

  // Get authenticated user information for collaboration
  const { user } = useUser();

  // Create user info object for Hocuspocus
  const userInfo = useMemo(() => {
    if (!user) {
      // Fallback for unauthenticated users
      return {
        id: `anonymous-${Date.now()}`,
        name: "Anonymous User",
        color: "#6b7280", // Gray for anonymous
      };
    }

    // Extract email prefix (before @) as fallback display name
    const getEmailPrefix = (email: string) => {
      return email.split("@")[0];
    };

    const displayName =
      user.fullName ||
      (user.emailAddresses?.[0]?.emailAddress
        ? getEmailPrefix(user.emailAddresses[0].emailAddress)
        : "Unknown User");

    return {
      id: user.id,
      name: displayName,
      color: generateUserColor(user.id, userColorCache),
      avatar: user.imageUrl,
    };
  }, [user]);

  const { HandleImageDelete } = useTiptapImage();

  const { saveCurrentNote } = useNoteEditor();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SAVE_INTERVAL = 2500;

  // PartyKit provider using useYProvider hook
  // Let useYProvider create and manage the Y.js document automatically
  const provider = useYProvider({
    host:
      process.env.NODE_ENV == "development"
        ? "localhost:1999"
        : "https://pointer-collaboration.ehcaw.partykit.dev",
    room: `document-${id}`,
    // Remove doc parameter - let useYProvider create the Y.Doc automatically
  });

  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  // Monitor connection status from PartyKit provider
  useEffect(() => {
    if (provider) {
      // Start with connecting status
      setConnectionStatus("connecting");
      onConnectionStatusChange?.("connecting");

      // Listen for connection events - PartyKit uses different event names
      const handleConnect = () => {
        setConnectionStatus("connected");
        onConnectionStatusChange?.("connected");
      };

      const handleDisconnect = () => {
        setConnectionStatus("disconnected");
        onConnectionStatusChange?.("disconnected");
      };

      // Subscribe to provider events - PartyKit uses specific event names
      if (provider.on) {
        // Y.js/WebRTC provider events
        provider.on("connect", handleConnect);
        provider.on("disconnect", handleDisconnect);

        // Additional Y.js events
        provider.on("sync", () => {
          // When sync fires, it usually means connection is working
          if (connectionStatus === "connecting") {
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
          // provider.off("sync", () => {});
          // provider.off("synced", () => {});
          provider.off("connection-error", () => {});
        }
      };
    }
  }, [provider, onConnectionStatusChange, connectionStatus]);

  // Reset state when id changes to prevent data mixing
  useEffect(() => {
    setIsInitialContentLoaded(false);
    ignoreFirstUpdate.current = true;
    lastContentRef.current = "";
  }, [id]);

  // Graceful disconnect function
  const disconnectProvider = useCallback(() => {
    if (provider) {
      try {
        if (provider.disconnect) {
          provider.disconnect();
        }
        setConnectionStatus("disconnected");
      } catch (error) {
        console.error("Error disconnecting provider:", error);
      }
    }
  }, [provider]);

  // Graceful reconnect function
  const reconnectProvider = useCallback(() => {
    if (provider) {
      try {
        setConnectionStatus("connecting");
        if (provider.connect) {
          provider.connect();
        }
        // Note: The actual state change to 'connected' will happen in the 'connect' event handler
      } catch (error) {
        console.error("Error reconnecting provider:", error);
        setConnectionStatus("disconnected");
      }
    }
  }, [provider]);

  // Force cleanup function for permanent component removal
  const forceCleanupProvider = useCallback(() => {
    if (provider && provider.destroy) {
      try {
        provider.destroy();
      } catch (error) {
        console.error("Error cleaning up provider:", error);
      }
    }
  }, [provider]);

  // Parse content appropriately based on input type with validation
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
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialContentLoaded, setIsInitialContentLoaded] = useState(false);

  const editor = useEditor(
    {
      enableContentCheck: true,
      onContentError: ({ disableCollaboration }) => {
        disableCollaboration();
      },
      onCreate: ({ editor: currentEditor }) => {
        // Don't clear content immediately - wait for Y.js sync to determine what to do

        // Listen for sync event to handle initial content loading
        if (provider && provider.on) {
          provider.on("synced", () => {
            // Try to access the Y.js document through different possible properties
            let yDoc: Y.Doc | null = null;
            if ((provider as any).document) {
              yDoc = (provider as any).document;
            } else if ((provider as any).ydoc) {
              yDoc = (provider as any).ydoc;
            }
            if (yDoc) {
              const yXmlFragment = yDoc.getXmlFragment("prosemirror");

              // Check if Y.js already has content from other clients
              const hasYjsContent = yXmlFragment.length > 0;

              if (hasYjsContent) {
                // Let Y.js content populate naturally - don't interfere
                setIsInitialContentLoaded(true);
              } else if (initialContent && !isEmptyContent(initialContent)) {
                // Y.js is empty and we have initial content - we're the first client
                // Clear any editor content first, then set our content
                currentEditor.commands.setContent("");
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

          // Also listen for 'sync' event as a fallback
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
      immediatelyRender: true,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "on",
          autocapitalize: "off",
          "aria-label": "Main content area, start typing to enter text.",
        },
      },
      extensions: (() => {
        const baseExtensions = [
          StarterKit.configure({
            // Disable history for collaborative editing - Y.js handles this
            history: false,
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
            table: {
              resizable: true,
              HTMLAttributes: {
                class: "tiptap-table",
              },
            },
          }),
          TableRow,
          TableHeader,
          TableCell,
        ];

        // Only add collaboration extensions if provider exists
        if (provider) {
          // Try to get the Y.js document from provider
          let yDoc: Y.Doc | null = null;
          if ((provider as any).document) {
            yDoc = (provider as any).document;
          } else if ((provider as any).ydoc) {
            yDoc = (provider as any).ydoc;
          } else if ((provider as any).doc) {
            yDoc = (provider as any).doc;
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

      // Lightweight onUpdate - only handles UI updates
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

        // Debounce the heavy content update operations
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          debouncedContentUpdate();
        }, 150); // Reduced debounce for faster updates

        if (transaction.docChanged && currentNote) {
          const getImageSrcs = (doc: typeof transaction.doc) => {
            const srcs = new Set<string>();
            doc.descendants((node) => {
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
          const deletedImageSrcs = [...beforeSrcs].filter(
            (src) => !afterSrcs.has(src),
          );

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
                        currentNoteRef.current._id!, // Use ! since we checked above
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
        }
      },
    },
    [id, provider, userInfo],
  ); // Recreate editor when id, provider, or userInfo changes

  // Enhanced debounced content update function with validation
  const debouncedContentUpdate = useCallback(() => {
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

  // Handle escape key to close slash command
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSlashCommand) {
        e.preventDefault();
        setShowSlashCommand(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSlashCommand]);

  const slashCommandPosition = useMemo(() => {
    return getSlashCommandPosition(editor);
  }, [editor]);

  // Handle enter key when slash command is open
  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && showSlashCommand) {
        e.preventDefault();
        e.stopPropagation(); // Stop the event from reaching the editor
        // Manually trigger the selection - find the popup and click the selected item
        const selectedItem = document.querySelector(
          ".slash-command-item.selected",
        ) as HTMLElement;
        if (selectedItem) {
          selectedItem.click();
        }
      }
    };

    document.addEventListener("keydown", handleEnter, true); // Use capture phase
    return () => document.removeEventListener("keydown", handleEnter, true);
  }, [showSlashCommand]);

  useEffect(() => {
    if (editor && editorRef && "current" in editorRef) {
      editorRef.current = {
        getJSON: () => editor.getJSON(),
        getText: () => editor.getText(),
        setJSON: (content: Record<string, unknown>) => {
          editor.commands.setContent(content);
        },
        cleanupProvider: forceCleanupProvider,
        disconnectProvider: disconnectProvider,
        reconnectProvider: reconnectProvider,
      };
    }
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [
    editor,
    editorRef,
    onEditorReady,
    forceCleanupProvider,
    disconnectProvider,
    reconnectProvider,
  ]);

  // This ensures dbSavedNotes always holds the content *as it was loaded from the DB*.
  useEffect(() => {
    if (currentNote) {
      dbSavedNotes.set(
        currentNote.pointer_id,
        JSON.parse(JSON.stringify(currentNote)),
      );
    }
  }, [currentNote, dbSavedNotes]);

  // Handle editor editability based on connection status
  useEffect(() => {
    if (editor) {
      // Keep editor always editable so toolbar renders properly
      // We'll handle the "disabled" state at the content level instead
      const isEditable = true; // Always editable for toolbar rendering
      editor.setEditable(isEditable);

      // Only disable slash command when not connected
      if (connectionStatus !== "connected") {
        setShowSlashCommand(false);
        setSlashCommandQuery("");
      }
    }
  }, [connectionStatus, editor]);

  // Handle initial content loading completion - simplified since we set content immediately
  useEffect(() => {
    if (
      editor &&
      !isInitialContentLoaded &&
      (!initialContent || initialContent === "")
    ) {
      // If there's no initial content, mark as loaded immediately
      setIsInitialContentLoaded(true);
    }
  }, [editor, initialContent, isInitialContentLoaded]);

  // Handle provider lifecycle and cleanup
  useEffect(() => {
    // Cleanup function for component unmount
    return () => {
      // Only disconnect gracefully, don't destroy the provider
      // This preserves the provider state for potential remount
      disconnectProvider();
    };
  }, [disconnectProvider]);

  // Handle page visibility changes to manage connection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, consider disconnecting to save resources
        disconnectProvider();
      } else {
        // Page is visible again, reconnect if needed
        reconnectProvider();
      }
    };

    // Handle beforeunload to ensure clean disconnect
    const handleBeforeUnload = () => {
      disconnectProvider();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [disconnectProvider, reconnectProvider]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      disconnectProvider();
    };
  }, [disconnectProvider]);

  return (
    <EditorContext.Provider value={{ editor }}>
      <div style={{ position: "relative", height: "100%" }}>
        <StatusBadge
          connectionStatus={connectionStatus}
          onReconnect={reconnectProvider}
        />
        <div className="content-wrapper">
          <EditorContent
            editor={editor}
            role="presentation"
            className={`simple-editor-content`}
          />
          {/* Overlay to prevent interaction when not connected */}
          {connectionStatus !== "connected" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                cursor: "not-allowed",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
              title={`Editor is ${connectionStatus}. Please wait to connect before editing.`}
            />
          )}
          {showSlashCommand &&
            editor &&
            (() => {
              return (
                <div
                  style={{
                    position: "fixed",
                    top: slashCommandPosition.top,
                    left: slashCommandPosition.left,
                    zIndex: 1000, // High z-index to ensure it's above everything
                  }}
                >
                  <SlashCommandPopup
                    editor={editor}
                    onClose={() => setShowSlashCommand(false)}
                    query={slashCommandQuery}
                    shouldFlip={slashCommandPosition.shouldFlip}
                  />
                </div>
              );
            })()}
        </div>
      </div>
    </EditorContext.Provider>
  );
}
