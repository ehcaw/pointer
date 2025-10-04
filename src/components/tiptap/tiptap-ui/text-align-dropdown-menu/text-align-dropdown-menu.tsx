"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap/tiptap-icons/chevron-down-icon";
import { AlignLeftIcon } from "@/components/tiptap/tiptap-icons/align-left-icon";

// --- Tiptap UI ---
import {
  TextAlignButton,
  type TextAlign,
  textAlignIcons,
} from "@/components/tiptap/tiptap-ui/text-align-button/text-align-button";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap/tiptap-ui-primitive/dropdown-menu";

export interface TextAlignDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function TextAlignDropdownMenu({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: TextAlignDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const editor = useTiptapEditor(providedEditor);

  const alignments: TextAlign[] = ["left", "center", "right", "justify"];

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const getActiveIcon = React.useCallback(() => {
    if (!editor) return <AlignLeftIcon className="tiptap-button-icon" />;

    const activeAlignment = alignments.find((align) =>
      editor.isActive("textAlign", align),
    );

    if (!activeAlignment) return <AlignLeftIcon className="tiptap-button-icon" />;

    const ActiveIcon = textAlignIcons[activeAlignment];
    return <ActiveIcon className="tiptap-button-icon" />;
  }, [editor, alignments]);

  const canToggleAnyAlignment = React.useCallback((): boolean => {
    if (!editor) return false;
    return alignments.some((align) => editor.can().setTextAlign(align));
  }, [editor, alignments]);

  const isDisabled = !canToggleAnyAlignment();
  const isAnyAlignmentActive = alignments.some((align) =>
    editor?.isActive("textAlign", align)
  );

  const show = React.useMemo(() => {
    if (!editor) {
      return false;
    }

    if (hideWhenUnavailable && !canToggleAnyAlignment()) {
      return false;
    }

    return true;
  }, [editor, hideWhenUnavailable, canToggleAnyAlignment]);

  if (!show || !editor || !editor.isEditable) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          disabled={isDisabled}
          data-style="ghost"
          data-active-state={isAnyAlignmentActive ? "on" : "off"}
          data-disabled={isDisabled}
          role="button"
          tabIndex={-1}
          aria-label="Align text"
          aria-pressed={isAnyAlignmentActive}
          tooltip="Text Alignment"
          {...props}
        >
          {getActiveIcon()}
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          {alignments.map((align) => (
            <DropdownMenuItem key={`align-${align}`} asChild>
              <TextAlignButton
                editor={editor}
                align={align}
                text={align.charAt(0).toUpperCase() + align.slice(1)}
                tooltip=""
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TextAlignDropdownMenu;