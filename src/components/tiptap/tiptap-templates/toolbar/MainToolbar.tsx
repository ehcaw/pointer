import { Mic, MicOff } from "lucide-react";
import { useVoiceRecorderStore } from "@/hooks/use-voice-recorder";
import { useHotkeys } from "react-hotkeys-hook";
import { Spacer } from "@/components/tiptap/tiptap-ui-primitive/spacer";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import {
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap/tiptap-ui-primitive/toolbar";
// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap/tiptap-ui/list-dropdown-menu";
import { BlockQuoteButton } from "@/components/tiptap/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
} from "@/components/tiptap/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkButton,
} from "@/components/tiptap/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap/tiptap-ui/mark-button";
import TextAlignDropdownMenu from "../../tiptap-ui/text-align-dropdown-menu/text-align-dropdown-menu";
import { UndoRedoButton } from "@/components/tiptap/tiptap-ui/undo-redo-button";
import ScriptDropdownMenu from "../../tiptap-ui/script-dropdown-menu/script-dropdown-menu";
import { TableContextMenu } from "@/components/tiptap/tiptap-ui/table-context-menu";
import { Editor } from "@tiptap/react";

export const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  editor,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
  editor?: Editor;
  isDisabled?: boolean;
  connectionStatus?: "connecting" | "connected" | "disconnected";
  isCollaborative?: boolean;
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
          <ColorHighlightPopover editor={editor} />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ScriptDropdownMenu editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignDropdownMenu editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton />
        <TableContextMenu editor={editor} />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <Button onClick={handleMicToggle}>
          {isRecording ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>
      </ToolbarGroup>
    </>
  );
};
