import React, { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  SlashCommandItem,
  searchSlashCommands,
} from "@/components/tiptap/tiptap-ui/slash-command-registry";

// Import icons for different commands
import { BoldIcon } from "@/components/tiptap/tiptap-icons/bold-icon";
import { ItalicIcon } from "@/components/tiptap/tiptap-icons/italic-icon";
import { StrikeIcon } from "@/components/tiptap/tiptap-icons/strike-icon";
import { Code2Icon } from "@/components/tiptap/tiptap-icons/code2-icon";
import { UnderlineIcon } from "@/components/tiptap/tiptap-icons/underline-icon";
import { HeadingOneIcon } from "@/components/tiptap/tiptap-icons/heading-one-icon";
import { HeadingTwoIcon } from "@/components/tiptap/tiptap-icons/heading-two-icon";
import { HeadingThreeIcon } from "@/components/tiptap/tiptap-icons/heading-three-icon";
import { ListIcon } from "@/components/tiptap/tiptap-icons/list-icon";
import { ListOrderedIcon } from "@/components/tiptap/tiptap-icons/list-ordered-icon";
import { ListTodoIcon } from "@/components/tiptap/tiptap-icons/list-todo-icon";
import { ImagePlusIcon } from "@/components/tiptap/tiptap-icons/image-plus-icon";
import { LinkIcon } from "@/components/tiptap/tiptap-icons/link-icon";
import { BlockQuoteIcon } from "@/components/tiptap/tiptap-icons/block-quote-icon";
import { CodeBlockIcon } from "@/components/tiptap/tiptap-icons/code-block-icon";

// Image upload hooks
import { useTiptapImage } from "@/lib/tiptap-utils";
import { useUserStore } from "@/lib/stores/user-store";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useConvex } from "convex/react";

interface SlashCommandPopupProps {
  editor: Editor | null;
  onClose: () => void;
  query?: string;
}

const SlashCommandContent: React.FC<{
  editor: Editor;
  onClose: () => void;
  query?: string;
}> = ({ editor, onClose, query = "" }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Image upload hooks
  const { HandleImageUpload } = useTiptapImage();
  const { getUserId } = useUserStore();
  const { currentNote } = useNotesStore();
  const { saveCurrentNote } = useNoteEditor();
  const convex = useConvex();

  // Get items from registry and filter by query
  const items = query ? searchSlashCommands(query) : searchSlashCommands("");

  const filteredItems = items.filter((item) => {
    const queryLower = query.toLowerCase();
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();

    // More natural filtering - match from start of words
    return (
      titleLower.includes(queryLower) ||
      descLower.includes(queryLower) ||
      titleLower.split(" ").some((word) => word.startsWith(queryLower)) ||
      descLower.split(" ").some((word) => word.startsWith(queryLower))
    );
  });

  const handleSelectItem = useCallback(
    (item: SlashCommandItem) => {
      const { state } = editor;
      const { from } = state.selection;

      // Find the slash position by searching backwards from cursor
      let slashPos = from - 1;
      let foundSlash = false;

      // Search backwards for the slash, up to 50 characters
      for (let i = 0; i < 50 && slashPos >= 0; i++) {
        const char = state.doc.textBetween(slashPos, slashPos + 1);
        if (char === "/") {
          foundSlash = true;
          break;
        }
        slashPos--;
      }

      if (foundSlash) {
        const range = {
          from: slashPos,
          to: from,
        };

        // First, delete the slash and any text after it
        editor.chain().focus().deleteRange(range).run();

        // Then apply the specific command
        if (item.icon === "h1" || item.icon === "h2" || item.icon === "h3") {
          // For headings, set the node type
          const level = item.icon === "h1" ? 1 : item.icon === "h2" ? 2 : 3;
          editor.chain().setNode("heading", { level }).run();
        } else if (item.icon === "bulletList") {
          editor.chain().toggleBulletList().run();
        } else if (item.icon === "orderedList") {
          editor.chain().toggleOrderedList().run();
        } else if (item.icon === "taskList") {
          editor.chain().toggleTaskList().run();
        } else if (item.icon === "blockquote") {
          editor.chain().toggleBlockquote().run();
        } else if (item.icon === "codeBlock") {
          editor.chain().toggleCodeBlock().run();
        } else if (item.icon === "image") {
          // Create hidden file input for image selection
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = "image/*";
          fileInput.multiple = true;
          fileInput.style.display = "none";

          fileInput.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              const validFiles = Array.from(files).filter((file) => {
                if (!file.type.startsWith("image/")) {
                  console.error(`${file.name} is not an image file`);
                  return false;
                }
                if (file.size > 5 * 1024 * 1024) {
                  // 5MB limit
                  console.error(`${file.name} exceeds maximum size of 5MB`);
                  return false;
                }
                return true;
              });

              if (validFiles.length === 0) return;

              const currentPosition = editor.state.selection.from;

              try {
                for (let i = 0; i < validFiles.length; i++) {
                  const file = validFiles[i];
                  const filename =
                    file.name.replace(/\.[^/.]+$/, "") || `image-${i + 1}`;
                  const uniqueId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                  const placeholderText = `Uploading ${filename}... [${uniqueId}]`;

                  // Insert placeholder
                  const placeholderPosition = currentPosition + i * 2;
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(placeholderPosition, [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: placeholderText }],
                      },
                    ])
                    .run();

                  const userId = await getUserId(convex);
                  if (!userId) {
                    console.error("User ID is required for image upload");
                    return;
                  }
                  if (!currentNote?._id) {
                    console.error("Current note is required for image upload");
                    return;
                  }
                  const imageUrl = await HandleImageUpload(
                    file,
                    userId,
                    "notes",
                    currentNote._id as string,
                  );

                  // Replace placeholder with image using unique identifier
                  const doc = editor.state.doc;
                  let placeholderPos = -1;
                  doc.descendants((node, pos) => {
                    if (node.isText && node.text === placeholderText) {
                      placeholderPos = pos;
                      return false;
                    }
                    return true;
                  });

                  if (placeholderPos !== -1) {
                    const $pos = doc.resolve(placeholderPos);
                    const paragraphStart = $pos.start($pos.depth);
                    const paragraphEnd = $pos.end($pos.depth);

                    editor
                      .chain()
                      .focus()
                      .deleteRange({ from: paragraphStart, to: paragraphEnd })
                      .insertContentAt(paragraphStart, [
                        {
                          type: "image",
                          attrs: {
                            src: imageUrl,
                            alt: filename,
                            title: filename,
                          },
                        },
                      ])
                      .run();
                  }
                }

                await saveCurrentNote();
              } catch (error) {
                console.error("Failed to upload image:", error);
              }
            }
          };

          document.body.appendChild(fileInput);
          fileInput.click();
          document.body.removeChild(fileInput);
        } else if (item.icon === "link") {
          const url = window.prompt("Enter URL");
          if (url) {
            editor.chain().setLink({ href: url }).run();
          }
        } else {
          // For inline formatting (bold, italic, etc.)
          switch (item.icon) {
            case "bold":
              editor.chain().toggleBold().run();
              break;
            case "italic":
              editor.chain().toggleItalic().run();
              break;
            case "strike":
              editor.chain().toggleStrike().run();
              break;
            case "code":
              editor.chain().toggleCode().run();
              break;
            case "underline":
              editor.chain().toggleUnderline().run();
              break;
          }
        }
      }

      onClose();
    },
    [
      editor,
      onClose,
      HandleImageUpload,
      convex,
      currentNote?._id,
      getUserId,
      saveCurrentNote,
    ],
  );

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = itemsRef.current[selectedIndex];
    const container = popupRef.current?.querySelector(
      ".slash-command-items",
    ) as HTMLElement;

    if (selectedElement && container) {
      const elementRect = selectedElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if element is outside viewport
      if (elementRect.top < containerRect.top) {
        // Scroll up
        container.scrollTop = selectedElement.offsetTop - 8;
      } else if (elementRect.bottom > containerRect.bottom) {
        // Scroll down
        container.scrollTop =
          selectedElement.offsetTop +
          (selectedElement as HTMLElement).offsetHeight -
          container.offsetHeight +
          8;
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
        );
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, onClose, handleSelectItem]);

  const getIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (iconName) {
      case "h1":
        return <HeadingOneIcon {...iconProps} />;
      case "h2":
        return <HeadingTwoIcon {...iconProps} />;
      case "h3":
        return <HeadingThreeIcon {...iconProps} />;
      case "bold":
        return <BoldIcon {...iconProps} />;
      case "italic":
        return <ItalicIcon {...iconProps} />;
      case "strike":
        return <StrikeIcon {...iconProps} />;
      case "code":
        return <Code2Icon {...iconProps} />;
      case "underline":
        return <UnderlineIcon {...iconProps} />;
      case "bulletList":
        return <ListIcon {...iconProps} />;
      case "orderedList":
        return <ListOrderedIcon {...iconProps} />;
      case "taskList":
        return <ListTodoIcon {...iconProps} />;
      case "image":
        return <ImagePlusIcon {...iconProps} />;
      case "link":
        return <LinkIcon {...iconProps} />;
      case "blockquote":
        return <BlockQuoteIcon {...iconProps} />;
      case "codeBlock":
        return <CodeBlockIcon {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={popupRef}
      className="slash-command-popup"
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        minWidth: "280px",
        maxWidth: "360px",
        maxHeight: "380px",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.95)",
      }}
    >
      <div
        className="slash-command-items"
        style={{ maxHeight: "280px", overflowY: "auto" }}
      >
        {filteredItems.length === 0 ? (
          <div
            className="slash-command-no-results"
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {query
              ? `No commands found for "${query}"`
              : "Type to search commands..."}
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.title}
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
              onClick={() => handleSelectItem(item)}
              className={`slash-command-item ${index === selectedIndex ? "selected" : ""}`}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                cursor: "pointer",
                transition:
                  "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                backgroundColor:
                  index === selectedIndex
                    ? "rgba(59, 130, 246, 0.08)"
                    : "transparent",
                borderLeft:
                  index === selectedIndex
                    ? "3px solid #3b82f6"
                    : "3px solid transparent",
                color: index === selectedIndex ? "#111827" : "#4b5563",
              }}
            >
              <div
                className="slash-command-item-icon"
                style={{ marginRight: "12px", opacity: 0.8, flexShrink: 0 }}
              >
                {getIcon(item.icon || "")}
              </div>
              <div
                className="slash-command-item-content"
                style={{ flex: 1, minWidth: 0 }}
              >
                <div
                  className="slash-command-item-title"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#111827",
                    marginBottom: "2px",
                  }}
                >
                  {item.title}
                </div>
                <div
                  className="slash-command-item-description"
                  style={{
                    fontSize: "12px",
                    color: index === selectedIndex ? "#4b5563" : "#6b7280",
                    lineHeight: "1.4",
                  }}
                >
                  {item.description}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const SlashCommandPopup: React.FC<SlashCommandPopupProps> = ({
  editor,
  onClose,
  query,
}) => {
  if (!editor) {
    return null;
  }

  return (
    <SlashCommandContent editor={editor} onClose={onClose} query={query} />
  );
};
