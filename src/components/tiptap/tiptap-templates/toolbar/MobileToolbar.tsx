import {
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap/tiptap-ui-primitive/toolbar";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import { ArrowLeftIcon } from "@/components/tiptap/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap/tiptap-icons/link-icon";
import { ColorHighlightPopoverContent } from "@/components/tiptap/tiptap-ui/color-highlight-popover";
import { LinkContent } from "@/components/tiptap/tiptap-ui/link-popover";
import { Editor } from "@tiptap/react";

export const MobileToolbarContent = ({
  type,
  onBack,
  editor,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
  editor?: Editor;
  isDisabled?: boolean;
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
      <ColorHighlightPopoverContent editor={editor} />
    ) : (
      <LinkContent />
    )}
  </>
);
