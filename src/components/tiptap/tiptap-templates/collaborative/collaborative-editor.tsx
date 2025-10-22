import { useEffect, useRef, useMemo, useCallback } from "react";
import { EditorContent, EditorContext } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

import useYProvider from "y-partykit/react";
import * as Y from "yjs";

// --- Custom Hooks ---
import { useCollaborativeEditor } from "../editors/editor";

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
import { useUser } from "@clerk/nextjs";
import StatusBadge from "../toolbar/WebsocketStatusBadge";
import { generateUserColor } from "@/lib/utils/tiptapUtils";
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
  const userColorCache = new Map<string, string>();

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

  // PartyKit provider using useYProvider hook
  const provider = useYProvider({
    host:
      process.env.NODE_ENV == "development"
        ? "localhost:1999"
        : "https://pointer-collaboration.ehcaw.partykit.dev",
    room: `document-${id}`,
  });

  // Use the custom collaborative editor hook
  const {
    editor,
    showSlashCommand,
    setShowSlashCommand,
    slashCommandQuery,
    setSlashCommandQuery,
    slashCommandPosition,
    connectionStatus,
    setConnectionStatus,
    debouncedContentUpdate,
  } = useCollaborativeEditor({
    id,
    content,
    editorRef,
    onEditorReady,
    provider,
    userInfo,
    onConnectionStatusChange,
  });

  const currentNoteRef = useRef(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SAVE_INTERVAL = 2500;

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
  }, [provider, setConnectionStatus]);

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
  }, [provider, setConnectionStatus]);

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
  }, [showSlashCommand, setShowSlashCommand]);

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
  }, [connectionStatus, editor, setShowSlashCommand, setSlashCommandQuery]);

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
