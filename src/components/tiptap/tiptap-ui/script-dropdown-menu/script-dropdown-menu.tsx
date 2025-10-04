"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap/tiptap-icons/chevron-down-icon";
import { SuperscriptIcon } from "@/components/tiptap/tiptap-icons/superscript-icon";

// --- Tiptap UI ---
import {
  MarkButton,
  type Mark,
  markIcons,
} from "@/components/tiptap/tiptap-ui/mark-button/mark-button";

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

export interface ScriptDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ScriptDropdownMenu({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: ScriptDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const editor = useTiptapEditor(providedEditor);

  const scriptTypes: Mark[] = ["superscript", "subscript"];

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const getActiveIcon = React.useCallback(() => {
    if (!editor) return <SuperscriptIcon className="tiptap-button-icon" />;

    const activeScript = scriptTypes.find((type) =>
      editor.isActive(type),
    );

    if (!activeScript) return <SuperscriptIcon className="tiptap-button-icon" />;

    const ActiveIcon = markIcons[activeScript];
    return <ActiveIcon className="tiptap-button-icon" />;
  }, [editor, scriptTypes]);

  const canToggleAnyScript = React.useCallback((): boolean => {
    if (!editor) return false;
    return scriptTypes.some((type) => editor.can().toggleMark(type));
  }, [editor, scriptTypes]);

  const isDisabled = !canToggleAnyScript();
  const isAnyScriptActive = scriptTypes.some((type) =>
    editor?.isActive(type)
  );

  const show = React.useMemo(() => {
    if (!editor) {
      return false;
    }

    if (hideWhenUnavailable && !canToggleAnyScript()) {
      return false;
    }

    return true;
  }, [editor, hideWhenUnavailable, canToggleAnyScript]);

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
          data-active-state={isAnyScriptActive ? "on" : "off"}
          data-disabled={isDisabled}
          role="button"
          tabIndex={-1}
          aria-label="Script"
          aria-pressed={isAnyScriptActive}
          tooltip="Script"
          {...props}
        >
          {getActiveIcon()}
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          {scriptTypes.map((type) => (
            <DropdownMenuItem key={`script-${type}`} asChild>
              <MarkButton
                editor={editor}
                type={type}
                text={type.charAt(0).toUpperCase() + type.slice(1)}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ScriptDropdownMenu;