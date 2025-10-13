import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Editor, EditorContent, EditorContext, useEditor } from "@tiptap/react";

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
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

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
}

const createHocusPocusProvider = (url: string, docName: string, doc: Y.Doc) => {
  return new HocuspocusProvider({
    url,
    name: docName,
    document: doc,
  });
};

export function CollaborativeEditor({
  id,
  content,
  editorRef,
  onEditorReady,
}: CollaborativeEditorProps) {
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  const isRemoteChange = useRef(false);
  const ignoreFirstUpdate = useRef(true);

  // Get currentNote and state setters from the notes store
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote, dbSavedNotes } =
    useNotesStore();
  const currentNoteRef = useRef(currentNote);

  // Get authenticated user information for collaboration
  const { user } = useUser();

  // Generate consistent user color based on user ID
  const generateUserColor = (userId: string): string => {
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

    return colors[Math.abs(hash) % colors.length];
  };

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
      color: generateUserColor(user.id),
      avatar: user.imageUrl,
    };
  }, [user]);

  const { HandleImageDelete } = useTiptapImage();

  const { saveCurrentNote } = useNoteEditor();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SAVE_INTERVAL = 2500; // 3 seconds

  const yDocRef = useRef<Y.Doc | null>(null);
  if (!yDocRef.current) {
    yDocRef.current = new Y.Doc();
  }
  const yDoc = yDocRef.current;

  // Hocuspocus provider - use useRef to prevent recreation on every render
  const hocusPocusProviderRef = useRef<HocuspocusProvider | null>(null);
  const [isProviderActive, setIsProviderActive] = useState(true);

  if (!hocusPocusProviderRef.current) {
    hocusPocusProviderRef.current = createHocusPocusProvider(
      process.env.NEXT_PUBLIC_HOCUSPOCUS_URL!,
      id,
      yDoc,
    );

    // Add debugging events
    hocusPocusProviderRef.current.on("connect", () => {
      console.log("Hocuspocus connected");
      setIsProviderActive(true);
    });

    hocusPocusProviderRef.current.on("disconnect", () => {
      console.log("Hocuspocus disconnected");
      setIsProviderActive(false);
    });

    hocusPocusProviderRef.current.on(
      "status",
      (event: { status: "connecting" | "connected" | "disconnected" }) => {
        // Auto-reconnect on connection failures
        if (event.status === "disconnected") {
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (hocusPocusProviderRef.current) {
              try {
                hocusPocusProviderRef.current.connect();
                console.log("Attempting to reconnect...");
              } catch (error) {
                console.error("Reconnection failed:", error);
              }
            }
          }, 3000); // 3 second delay
        }
      },
    );

    hocusPocusProviderRef.current.on("synced", () => {
      console.log("Hocuspocus synced");
    });
  }
  const provider = hocusPocusProviderRef.current;

  // Graceful disconnect function
  const disconnectProvider = useCallback(() => {
    if (provider && isProviderActive) {
      try {
        provider.disconnect();
        console.log("Provider disconnected gracefully");
        setIsProviderActive(false);
      } catch (error) {
        console.error("Error disconnecting provider:", error);
      }
    }
  }, [provider, isProviderActive]);

  // Graceful reconnect function
  const reconnectProvider = useCallback(() => {
    if (provider && !isProviderActive) {
      try {
        provider.connect();
        console.log("Provider reconnected gracefully");
        // Note: The actual state change will happen in the 'connect' event handler
      } catch (error) {
        console.error("Error reconnecting provider:", error);
      }
    }
  }, [provider, isProviderActive]);

  // Force cleanup function for permanent component removal
  const forceCleanupProvider = useCallback(() => {
    if (hocusPocusProviderRef.current) {
      try {
        hocusPocusProviderRef.current.destroy();
        hocusPocusProviderRef.current = null;
        console.log("Provider permanently cleaned up");
      } catch (error) {
        console.error("Error cleaning up provider:", error);
      }
    }
  }, []);

  // Parse content appropriately based on input type
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
          return parsed;
        }
      } catch (e) {
        console.warn("JSON parsing failed: ", e);
      }
      return content;
    }

    // If content is already an object, use it directly
    if (typeof content === "object") {
      return content;
    }

    // Fallback
    return "";
  }, [content]);

  const lastContentRef = useRef<string>("");
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    enableContentCheck: true,
    onContentError: ({ disableCollaboration }) => {
      disableCollaboration();
    },
    onCreate: ({ editor: currentEditor }) => {
      console.log("Editor created");

      // Listen for sync event
      provider.on("synced", () => {
        console.log("Hocuspocus synced event fired");
        const yXmlFragment = provider.document.getXmlFragment("prosemirror");
        console.log("Y.js fragment length:", yXmlFragment.length);
        if (yXmlFragment.length === 0 && initialContent) {
          console.log("Setting initial content (on sync):", initialContent);
          currentEditor.commands.setContent(initialContent);
        }
      });

      // Also try to set content after a short delay in case sync already happened
      setTimeout(() => {
        const yXmlFragment = provider.document.getXmlFragment("prosemirror");
        if (yXmlFragment.length === 0 && initialContent) {
          console.log("Setting initial content (timeout):", initialContent);
          currentEditor.commands.setContent(initialContent);
        }
      }, 1000);
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
    extensions: [
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
      Collaboration.configure({
        document: provider.document,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: userInfo.name,
          color: userInfo.color,
        },
      }),
    ],

    // Lightweight onUpdate - only handles UI updates
    onUpdate: async ({ editor, transaction }) => {
      isRemoteChange.current = !!transaction.getMeta("y-prosemirror-plugin$");
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
      }, 150); // Very short debounce for content updates

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
  });

  // Debounced content update function
  const debouncedContentUpdate = useCallback(() => {
    if (!currentNote || !editor) return;

    // On the very first update after mounting, just update the last content ref and ignore
    if (ignoreFirstUpdate.current) {
      ignoreFirstUpdate.current = false;
      lastContentRef.current = JSON.stringify(editor.getJSON());
      return;
    }

    const currentEditorJson = editor.getJSON();
    const currentEditorText = editor.getText();
    const currentContentHash = JSON.stringify(currentEditorJson);

    // Only update if content actually changed
    if (currentContentHash !== lastContentRef.current) {
      lastContentRef.current = currentContentHash;

      // Update content immediately in memory (fast)
      if (!currentNote.content) {
        currentNote.content = {};
      }
      currentNote.content.tiptap = ensureJSONString(currentEditorJson);
      currentNote.content.text = currentEditorText;
      currentNote.updatedAt = new Date().toISOString();

      // Mark as unsaved only if the change is not remote
      if (!isRemoteChange.current) {
        markNoteAsUnsaved(currentNote);
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
  }, [
    currentNote,
    editor,
    markNoteAsUnsaved,
    saveCurrentNote,
    removeUnsavedNote,
  ]);

  // Calculate position for slash command popup - position relative to viewport
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
    };
  }, []);

  return (
    <EditorContext.Provider value={{ editor }}>
      <div style={{ position: "relative", height: "100%" }}>
        <div className="content-wrapper">
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />
          {showSlashCommand &&
            editor &&
            (() => {
              const position = getSlashCommandPosition();
              return (
                <div
                  style={{
                    position: "fixed",
                    top: position.top,
                    left: position.left,
                    zIndex: 1000, // High z-index to ensure it's above everything
                  }}
                >
                  <SlashCommandPopup
                    editor={editor}
                    onClose={() => setShowSlashCommand(false)}
                    query={slashCommandQuery}
                    shouldFlip={position.shouldFlip}
                  />
                </div>
              );
            })()}
        </div>
      </div>
    </EditorContext.Provider>
  );
}
