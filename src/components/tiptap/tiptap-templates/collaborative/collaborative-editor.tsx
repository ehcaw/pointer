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
import useYProvider from "y-partykit/react";

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
  } | null>;
  onEditorReady?: (editor: Editor) => void;
}

export function CollaborativeEditor({
  id,
  content,
  editorRef,
  onEditorReady,
}: CollaborativeEditorProps) {
  // const isMobile = useMobile();
  // const [editor, setEditor] = useState<any>(null);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  type ConnectionStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting";
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [editorDisabled, setEditorDisabled] = useState(false);
  const isRemoteChange = useRef(false);
  const ignoreFirstUpdate = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const isReconnectingRef = useRef(false);

  // Get currentNote and state setters from the notes store
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote, dbSavedNotes } =
    useNotesStore();
  const currentNoteRef = useRef(currentNote);

  // Get authenticated user information for collaboration
  const { user } = useUser();

  // Exponential backoff function for reconnection attempts
  const getReconnectDelay = (attempt: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  };

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

  // Create user info object for PartyKit
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

  // Collaboration - use useRef to prevent recreation on every render
  const yDocRef = useRef<Y.Doc | null>(null);
  if (!yDocRef.current) {
    yDocRef.current = new Y.Doc();
  }
  const yDoc = yDocRef.current;

  const partykitUrl = process.env.NEXT_PUBLIC_PARTYKIT_URL!;

  // Try different URL formats to debug the issue
  const debugUrls = [
    partykitUrl,
    "pointer-collaborative-editor.ehcaw.partykit.dev", // Without protocol
    "http://pointer-collaborative-editor.ehcaw.partykit.dev", // HTTP instead of HTTPS
  ];

  console.log("Trying different URL formats:", debugUrls);

  const provider = useYProvider({
    host: partykitUrl,
    room: `document-${id}`,
    doc: yDoc,
  });

  // Debug provider creation
  console.log("Provider created:", !!provider);
  console.log("Provider WebSocket available:", !!provider?.ws);

  // Add provider event listeners for debugging
  useEffect(() => {
    if (!provider) return;

    const handleProviderConnect = () => {
      console.log("Provider connect event fired");
    };

    const handleProviderDisconnect = () => {
      console.log("Provider disconnect event fired");
    };

    const handleProviderError = (error: Error) => {
      console.error("Provider error event:", error);
    };

    const handleProviderSynced = () => {
      console.log("Provider synced event fired");
    };

    provider.on("connect", handleProviderConnect);
    provider.on("disconnect", handleProviderDisconnect);
    provider.on("error", handleProviderError);
    provider.on("synced", handleProviderSynced);

    return () => {
      provider.off("connect", handleProviderConnect);
      provider.off("disconnect", handleProviderDisconnect);
      provider.off("error", handleProviderError);
      provider.off("synced", handleProviderSynced);
    };
  }, [provider]);

  // Monitor connection status and handle reconnections
  useEffect(() => {
    if (!provider) return;

    console.log("Setting up PartyKit connection monitoring...");
    console.log("PartyKit URL:", partykitUrl);
    console.log("Room:", `document-${id}`);
    console.log("Provider:", provider);

    let connectionTimeout: NodeJS.Timeout | null = null;
    let currentWebSocket: WebSocket | null = null;

    const checkConnectionState = () => {
      if (!provider.ws) {
        console.log("No WebSocket available on provider");
        return "disconnected";
      }

      const ws = provider.ws;
      console.log(
        "WebSocket readyState:",
        ws.readyState,
        {
          0: "CONNECTING",
          1: "OPEN",
          2: "CLOSING",
          3: "CLOSED",
        }[ws.readyState],
      );

      switch (ws.readyState) {
        case WebSocket.CONNECTING:
          return "connecting";
        case WebSocket.OPEN:
          return "connected";
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
          return "disconnected";
        default:
          return "disconnected";
      }
    };

    const handleConnect = () => {
      console.log("Connected to PartyKit");
      setConnectionStatus("connected");
      setEditorDisabled(false);
      reconnectAttemptsRef.current = 0;
      isReconnectingRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
    };

    const handleDisconnect = () => {
      console.log("Disconnected from PartyKit");
      console.log("WebSocket state:", provider.ws?.readyState);
      console.log("Reconnect attempts:", reconnectAttemptsRef.current);
      setConnectionStatus("disconnected");
      setEditorDisabled(true);

      // Prevent multiple concurrent reconnection attempts
      if (isReconnectingRef.current) {
        return;
      }

      // Attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        isReconnectingRef.current = true;
        const delay = getReconnectDelay(reconnectAttemptsRef.current);
        console.log(
          `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`,
        );
        console.log("Current WebSocket state:", provider.ws?.readyState);

        setConnectionStatus("reconnecting");
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Executing reconnection attempt...");
          // Force reconnection by destroying and recreating the provider connection
          if (provider.ws) {
            console.log("Closing existing WebSocket for reconnection");
            provider.ws.close();
          } else {
            console.log(
              "No WebSocket to close, provider might need to be re-initialized",
            );
          }
          // Increment counter after attempting reconnection
          reconnectAttemptsRef.current++;
        }, delay);
      } else {
        console.error("Max reconnection attempts reached");
        setConnectionStatus("disconnected");
        setEditorDisabled(true);
        isReconnectingRef.current = false;
      }
    };

    const handleError = (error: Error | unknown) => {
      console.error("PartyKit WebSocket error:", error);
      console.error("Error details:", {
        type: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (!isReconnectingRef.current) {
        setConnectionStatus("disconnected");
        handleDisconnect();
      }
    };

    // Set up connection timeout for initial connection
    const setupConnectionTimeout = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      connectionTimeout = setTimeout(() => {
        const currentState = checkConnectionState();
        if (currentState === "connecting") {
          console.log("Connection establishment timeout, forcing reconnect");
          if (provider.ws) {
            provider.ws.close();
          }
        }
      }, 15000); // 15 second timeout for connection establishment
    };

    // Clean up previous WebSocket listeners before setting up new ones
    const cleanupWebSocketListeners = () => {
      if (currentWebSocket) {
        currentWebSocket.removeEventListener("open", handleConnect);
        currentWebSocket.removeEventListener("close", handleDisconnect);
        currentWebSocket.removeEventListener("error", handleError);
        currentWebSocket = null;
      }
    };

    // Set up event listeners on the WebSocket
    const setupWebSocketListeners = () => {
      cleanupWebSocketListeners(); // Clean up previous listeners first

      if (provider.ws) {
        currentWebSocket = provider.ws;
        provider.ws.addEventListener("open", handleConnect);
        provider.ws.addEventListener("close", handleDisconnect);
        provider.ws.addEventListener("error", handleError);
      }
    };

    // Give the provider a moment to establish the WebSocket connection
    // before checking the initial state
    const initializeConnection = () => {
      console.log("Initializing connection...");
      console.log("Provider exists:", !!provider);
      console.log("Provider WebSocket exists:", !!provider?.ws);

      const initialState = checkConnectionState();
      console.log("Initial connection state:", initialState);

      if (initialState === "connected") {
        console.log("Already connected, calling handleConnect");
        handleConnect();
      } else if (initialState === "connecting") {
        console.log("Currently connecting, setting up timeout");
        setConnectionStatus("connecting");
        setupConnectionTimeout();
      } else {
        console.log("Not connected, setting connecting status and waiting");
        // For initial connection, give it some time before treating as disconnected
        setConnectionStatus("connecting");
        setupConnectionTimeout();

        // Check multiple times to see if WebSocket gets created
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          const currentState = checkConnectionState();
          console.log(
            `Connection check ${checkCount}/10:`,
            currentState,
            "WebSocket exists:",
            !!provider?.ws,
          );

          if (currentState === "connected") {
            clearInterval(checkInterval);
            handleConnect();
          } else if (checkCount >= 10) {
            clearInterval(checkInterval);
            console.log(
              "Failed to establish initial connection after 10 attempts",
            );
            console.log("Final state:", {
              currentState,
              hasProvider: !!provider,
              hasWebSocket: !!provider?.ws,
              webSocketState: provider?.ws?.readyState,
              partykitUrl,
              room: `document-${id}`,
            });

            if (
              currentState === "disconnected" &&
              reconnectAttemptsRef.current === 0 &&
              !isReconnectingRef.current
            ) {
              console.log(
                "Starting reconnection logic due to initial connection failure",
              );
              handleDisconnect();
            }
          }
        }, 500); // Check every 500ms for 5 seconds total
      }
    };

    // Set up WebSocket listeners first
    setupWebSocketListeners();

    // Small delay to allow provider to set up WebSocket
    setTimeout(initializeConnection, 100);

    // Monitor connection state changes less frequently to prevent race conditions
    const intervalId = setInterval(() => {
      const currentState = checkConnectionState();
      const currentStatus = connectionStatus;

      // Only handle state changes if we're not in the middle of reconnecting
      if (currentState !== currentStatus && !isReconnectingRef.current) {
        console.log(
          `Connection state changed from ${currentStatus} to ${currentState}`,
        );
        if (currentState === "connected") {
          handleConnect();
        } else if (
          currentState === "disconnected" &&
          currentStatus !== "reconnecting"
        ) {
          handleDisconnect();
        } else if (currentState === "connecting") {
          setConnectionStatus("connecting");
          setupConnectionTimeout();
        }
      }

      // Re-setup listeners if WebSocket instance changed
      if (provider.ws !== currentWebSocket) {
        setupWebSocketListeners();
      }
    }, 1000); // Reduced frequency to prevent race conditions

    return () => {
      cleanupWebSocketListeners();
      clearInterval(intervalId);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      isReconnectingRef.current = false;
    };
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: connectionStatus is intentionally excluded from dependencies to prevent race conditions
  // Adding it would cause the effect to re-run on every status change, creating infinite loops

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
      provider.on("synced", () => {
        if (currentEditor.isEmpty) {
          currentEditor.commands.setContent(initialContent || "");
        }
      });
    },
    immediatelyRender: false,
    editable: !editorDisabled,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "on",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
      //   handleDrop: (view, event, slice, moved) => {
      //     // Check if files are being dropped
      //     if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      //       const files = Array.from(event.dataTransfer.files);

      //       // Filter for image files
      //       const imageFiles = files.filter((file) =>
      //         file.type.startsWith("image/"),
      //       );

      //       if (imageFiles.length > 0) {
      //         event.preventDefault();

      //         // Get the drop position
      //         const coordinates = view.posAtCoords({
      //           left: event.clientX,
      //           top: event.clientY,
      //         });

      //         if (coordinates) {
      //           handleImageDrop(imageFiles, coordinates.pos);
      //         }

      //         return true; // Handled
      //       }
      //     }

      //     return false; // Not handled, let TipTap handle it
      //   },
      //   handleDOMEvents: {
      //     dragover: (view, event) => {
      //       // Check if dragging files
      //       if (event.dataTransfer?.types.includes("Files")) {
      //         event.preventDefault();
      //         // You could add visual feedback here, like highlighting the editor
      //         view.dom.classList.add("dragging-files");
      //       }
      //     },
      //     dragleave: (view, _event) => {
      //       // Remove visual feedback
      //       view.dom.classList.remove("dragging-files");
      //     },
      //     drop: (view, _event) => {
      //       // Clean up visual feedback
      //       view.dom.classList.remove("dragging-files");
      //     },
      //   },
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
      // Image,
      // ImageUploadNode.configure({
      //   accept: "image/*",
      //   maxSize: MAX_FILE_SIZE,
      //   limit: 3,
      //   upload: handleImageUpload,
      //   onError: (error) => console.error("Upload failed:", error),
      // }),
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
        document: yDoc,
      }),
      CollaborationCaret.extend().configure({
        provider,
        user: userInfo,
      }),
    ],
    content: initialContent,
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

  // Update editor editable state when connection status changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!editorDisabled);
    }
  }, [editor, editorDisabled]);

  useEffect(() => {
    if (editor && editorRef && "current" in editorRef) {
      editorRef.current = {
        getJSON: () => editor.getJSON(),
        getText: () => editor.getText(),
        setJSON: (content: Record<string, unknown>) => {
          editor.commands.setContent(content);
        },
      };
    }
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, editorRef, onEditorReady]);

  // This ensures dbSavedNotes always holds the content *as it was loaded from the DB*.
  useEffect(() => {
    if (currentNote) {
      dbSavedNotes.set(
        currentNote.pointer_id,
        JSON.parse(JSON.stringify(currentNote)),
      );
    }
  }, [currentNote, dbSavedNotes]);

  useEffect(() => {
    if (currentNote && editor) {
      lastContentRef.current = JSON.stringify(editor.getJSON());
    }
  }, [currentNote, editor]);

  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Clean up provider connection
      if (provider?.ws) {
        provider.ws.close();
      }
    };
  }, [provider]);

  return (
    <EditorContext.Provider value={{ editor }}>
      <div style={{ position: "relative", height: "100%" }}>
        {/* Connection Status Indicator */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            backgroundColor:
              connectionStatus === "connected"
                ? "#22c55e"
                : connectionStatus === "connecting"
                  ? "#3b82f6"
                  : connectionStatus === "reconnecting"
                    ? "#f59e0b"
                    : "#ef4444",
            color: "white",
            opacity: 0.8,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "white",
              opacity: connectionStatus === "connected" ? 1 : 0.5,
              animation:
                connectionStatus === "connecting" ||
                connectionStatus === "reconnecting"
                  ? "pulse 1.5s infinite"
                  : "none",
            }}
          />
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
              ? "Connecting..."
              : connectionStatus === "reconnecting"
                ? `Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
                : "Disconnected"}
        </div>

        <div className="content-wrapper relative">
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />

          {/* Disconnection Overlay */}
          {editorDisabled && (
            <div className="absolute inset-0 bg-black/ dark:bg-white/5 z-40 cursor-not-allowed">
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg   px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span className="font-medium">
                      {connectionStatus === "reconnecting"
                        ? "Reconnecting..."
                        : "Connection Lost"}
                    </span>
                    {reconnectAttemptsRef.current >= maxReconnectAttempts && (
                      <button
                        onClick={() => {
                          reconnectAttemptsRef.current = 0;
                          isReconnectingRef.current = false;
                          if (provider?.ws) {
                            provider.ws.close();
                          }
                          window.location.reload();
                        }}
                        className="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {showSlashCommand &&
            editor &&
            !editorDisabled &&
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
