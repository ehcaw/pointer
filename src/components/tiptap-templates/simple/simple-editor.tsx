import { useEffect, useRef, useState, useMemo } from "react";
import { EditorContent, EditorContext, useEditor, Editor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";

// --- Custom Extensions ---
import { Link } from "@/components/tiptap-extension/link-extension";
import { Selection } from "@/components/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/tiptap-extension/trailing-node-extension";
import { AutocompleteExtension } from "./autocomplete";
// import { AutocompleteExtension } from "./autocomplete-2";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockQuoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import { Mic, MicOff } from "lucide-react";

// --- Hooks ---
import { useMobile } from "@/hooks/use-tiptap-mobile";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import { useVoiceRecorderStore } from "@/hooks/useVoiceRecorder";
import { useHotkeys } from "react-hotkeys-hook";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";
import "@/components/tiptap-templates/active-button.scss";

import { useNotesStore } from "@/lib/notes-store";

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  editor,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
  editor?: Editor;
}) => {
  const { isRecording, stopAndTranscribe, startRecording } =
    useVoiceRecorderStore();

  useHotkeys(
    "meta+shift+v",
    async (e) => {
      console.log("Mic hotkey triggered");
      e.preventDefault();
      e.stopPropagation();
      await handleMicToggle();
    },
    {
      enableOnContentEditable: true,
      preventDefault: true,
      scopes: ["all"],
    },
  );

  const handleMicToggle = async () => {
    if (isRecording) {
      const transcription = await stopAndTranscribe();
      if (transcription) {
        console.log("Transcription:", transcription);
        if (editor) {
          editor.commands.insertContent(transcription + " ");
        }
      }
    } else {
      await startRecording();
    }
  };

  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} />
        <BlockQuoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>

      <ToolbarGroup>
        <Button onClick={handleMicToggle}>
          {isRecording ? <Mic /> : <MicOff />}
        </Button>
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

interface SimpleEditorProps {
  content: string | Record<string, unknown> | null | undefined;
  editorRef?: React.RefObject<{
    getJSON: () => Record<string, unknown>;
    getText: () => string;
    setJSON: (content: Record<string, unknown>) => void;
  } | null>;
}

export function SimpleEditor({ content, editorRef }: SimpleEditorProps) {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Get currentNote and state setters from the notes store
  const {
    currentNote,
    markNoteAsUnsaved,
    unsavedNotes,
    removeUnsavedNote,
    dbSavedNotes,
  } = useNotesStore();

  // This ref will store the "saved" state of each note, mirroring the DB

  // Parse content appropriately based on input type
  const initialContent = useMemo(() => {
    if (content === null || content === undefined) {
      return "";
    }

    // If content is an object (TipTap JSON), use it directly
    if (content && typeof content === "object") {
      // If content is an empty object, treat it as an empty string for Tiptap
      if (Object.keys(content).length === 0) {
        return "";
      }
      return content;
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
      StarterKit,
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
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      TrailingNode,
      Link.configure({ openOnClick: false }),
      AutocompleteExtension,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // 2. Logic for marking unsaved status (THIS IS WHERE THE CHANGE GOES)
      if (!currentNote) {
        // If there's no current note, we can't determine unsaved status
        return;
      }

      const noteId = currentNote.quibble_id;
      const currentEditorJson = JSON.stringify(editor.getJSON());
      const currentEditorText = editor.getText();
      const dbSavedMirror = dbSavedNotes.get(noteId);

      let changed = false;
      console.log(currentEditorText);

      if (dbSavedMirror) {
        // Note exists in our DB mirror cache, compare current editor content with it
        // Ensure the tiptap content from the mirror is also stringified for consistent comparison
        const lastSavedJson = JSON.stringify(dbSavedMirror.content.tiptap);
        const lastSavedText = dbSavedMirror.content.text;

        // Use OR (||) so if either JSON or plain text differs, it's marked as changed
        changed =
          currentEditorJson != lastSavedJson ||
          currentEditorText != lastSavedText;
      } else {
        // This case occurs if:
        // a) It's a brand new note that has never been saved to the DB.
        // b) An existing note was loaded, but dbSavedNotes.current hasn't been primed yet.
        // In both scenarios, we should generally consider it "unsaved" relative to the DB.
        changed = true;
      }

      if (changed) {
        console.log("YEA DIFF");
        markNoteAsUnsaved(currentNote);
        currentNote.content.tiptap = currentEditorJson;
        currentNote.content.text = currentEditorText;
      } else if (!changed && unsavedNotes.has(currentNote.quibble_id)) {
        console.log("BRUH");
        removeUnsavedNote(currentNote.quibble_id); // Ensure it's unmarked if content matches DB mirror
      }
    },
  });

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

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
  }, [isMobile, mobileView, editor, editorRef]);

  // **NEW useEffect**: Prime dbSavedNotes.current when the active note changes.
  // This ensures dbSavedNotes always holds the content *as it was loaded from the DB*.
  useEffect(() => {
    if (currentNote) {
      // Store the *initial* content of the currentNote as the saved state
      // This assumes `currentNote.content.tiptap` and `currentNote.content.text`
      // accurately reflect the content from the database when the note is loaded/selected.
      dbSavedNotes.set(
        currentNote.quibble_id,
        JSON.parse(JSON.stringify(currentNote)),
      );
    }
  }, [currentNote, dbSavedNotes]); // Only re-run when the currentNote object reference changes

  // Remove the old useEffect that was trying to manage unsaved state based on `mostCurrentNote` and `snapshots`.
  // It's no longer needed as the `onUpdate` callback now handles the primary logic,
  // and the new useEffect handles priming `dbSavedNotes`.

  return (
    <EditorContext.Provider value={{ editor }}>
      <Toolbar
        ref={toolbarRef}
        style={
          isMobile
            ? {
                bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
              }
            : {}
        }
      >
        {mobileView === "main" ? (
          <MainToolbarContent
            onHighlighterClick={() => setMobileView("highlighter")}
            onLinkClick={() => setMobileView("link")}
            isMobile={isMobile}
            editor={editor}
          />
        ) : (
          <MobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={() => setMobileView("main")}
          />
        )}
      </Toolbar>

      <div className="content-wrapper">
        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </div>
    </EditorContext.Provider>
  );
}
