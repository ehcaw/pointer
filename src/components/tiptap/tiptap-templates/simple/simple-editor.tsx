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

// --- Custom Extensions ---
import { Image } from "@/components/tiptap/tiptap-extension/image-extension";
import { Link } from "@/components/tiptap/tiptap-extension/link-extension";
import { Selection } from "@/components/tiptap/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/tiptap/tiptap-extension/trailing-node-extension";
// import { AutocompleteExtension } from "../../../../providers/AutocompleteProvider";
import { SlashCommand } from "@/components/tiptap/tiptap-extension/slash-command-extension";

// --- Tiptap Node ---
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap/tiptap-node/table-node/table-node.scss";

// --- Hooks ---
import { useMobile } from "@/hooks/use-tiptap-mobile";

// --- Components ---
import { SlashCommandPopup } from "@/components/tiptap/tiptap-ui/slash-command-popup";

// --- Styles ---
import "@/components/tiptap/tiptap-templates/editor.scss";
import "@/components/tiptap/tiptap-templates/active-button.scss";

import { useNotesStore } from "@/lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { ensureJSONString } from "@/lib/utils";
import { useTiptapImage, extractStorageIdFromUrl } from "@/lib/tiptap-utils";

import { Id } from "../../../../../convex/_generated/dataModel";

interface SimpleEditorProps {
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

export function SimpleEditor({
  content,
  editorRef,
  onEditorReady,
}: SimpleEditorProps) {
  const isMobile = useMobile();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");

  // Get currentNote and state setters from the notes store
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote, dbSavedNotes } =
    useNotesStore();

  const currentNoteRef = useRef(currentNote);

  const { HandleImageDelete } = useTiptapImage();

  const { saveCurrentNote } = useNoteEditor();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SAVE_DELAY = 3000; // 2 seconds

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
    // Fallback
    return "";
  }, [content]);

  const lastContentRef = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,
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
      // AutocompleteExtension,
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
    ],
    content: initialContent,
    // Optimized onUpdate with single-timer debounced autosave
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

  // Optimized content update with single timer debouncing
  const handleContentUpdate = useCallback(() => {
    if (!currentNote || !editor) return;

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

      // Mark as unsaved
      markNoteAsUnsaved(currentNote);

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
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
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
  }, [isMobile, mobileView, editor, editorRef, onEditorReady]);

  // This ensures dbSavedNotes always holds the content *as it was loaded from the DB*.
  useEffect(() => {
    if (currentNote) {
      dbSavedNotes.set(
        currentNote.pointer_id,
        JSON.parse(JSON.stringify(currentNote)),
      );
    }
  }, [currentNote, dbSavedNotes]);

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

  useEffect(() => {
    if (currentNote && editor) {
      lastContentRef.current = JSON.stringify(editor.getJSON());
    }
  }, [currentNote, editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
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
