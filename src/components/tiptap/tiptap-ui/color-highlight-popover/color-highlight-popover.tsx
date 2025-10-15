"use client";

import * as React from "react";
import { isNodeSelection, type Editor } from "@tiptap/react";

// --- Hooks ---
import { useMenuNavigation } from "@/hooks/use-menu-navigation";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { BanIcon } from "@/components/tiptap/tiptap-icons/ban-icon";
import { HighlighterIcon } from "@/components/tiptap/tiptap-icons/highlighter-icon";

// --- Lib ---
import { isMarkInSchema } from "@/lib/tiptap-utils";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/tiptap/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap/tiptap-ui-primitive/separator";

// --- Tiptap UI ---
import {
  ColorHighlightButton,
  canToggleHighlight,
} from "@/components/tiptap/tiptap-ui/color-highlight-button";

// --- Styles ---
import "@/components/tiptap/tiptap-ui/color-highlight-popover/color-highlight-popover.scss";

export interface ColorHighlightPopoverColor {
  label: string;
  value: string;
  border?: string;
}

export interface ColorHighlightPopoverContentProps {
  editor?: Editor | null;
  colors?: ColorHighlightPopoverColor[];
  onClose?: () => void;
}

export interface ColorHighlightPopoverProps extends Omit<ButtonProps, "type"> {
  /** The TipTap editor instance. */
  editor?: Editor | null;
  /** The highlight colors to display in the popover. */
  colors?: ColorHighlightPopoverColor[];
  /** Whether to hide the highlight popover when unavailable. */
  hideWhenUnavailable?: boolean;
}

export const DEFAULT_HIGHLIGHT_COLORS: ColorHighlightPopoverColor[] = [
  {
    label: "Green",
    value: "#22c55e",
    border: "#16a34a",
  },
  {
    label: "Blue",
    value: "#3b82f6",
    border: "#2563eb",
  },
  {
    label: "Red",
    value: "#ef4444",
    border: "#dc2626",
  },
  {
    label: "Purple",
    value: "#a855f7",
    border: "#9333ea",
  },
  {
    label: "Yellow",
    value: "#fbbf24",
    border: "#f59e0b",
  },
];



export const ColorHighlightPopoverButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, children, ...props }, ref) => (
  <Button
    type="button"
    className={className}
    data-style="ghost"
    data-appearance="default"
    role="button"
    tabIndex={-1}
    aria-label="Highlight text"
    tooltip="Highlight"
    ref={ref}
    {...props}
  >
    {children || <HighlighterIcon className="tiptap-button-icon" />}
  </Button>
));

ColorHighlightPopoverButton.displayName = "ColorHighlightPopoverButton";

export function ColorHighlightPopoverContent({
  editor: providedEditor,
  colors,
  onClose,
}: ColorHighlightPopoverContentProps) {
  const editor = useTiptapEditor(providedEditor);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Use dynamic colors if not provided
  const highlightColors = React.useMemo(
    () => colors || DEFAULT_HIGHLIGHT_COLORS,
    [colors]
  );

  const removeHighlight = React.useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetMark("highlight").run();
    onClose?.();
  }, [editor, onClose]);

  const menuItems = React.useMemo(
    () => [...highlightColors, { label: "Remove highlight", value: "none" }],
    [highlightColors],
  );

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: "both",
    onSelect: (item) => {
      if (item.value === "none") {
        removeHighlight();
      }
      onClose?.();
    },
    onClose,
    autoSelectFirstItem: false,
  });

  return (
    <div
      ref={containerRef}
      className="tiptap-color-highlight-content"
      tabIndex={0}
    >
      <div className="tiptap-button-group" data-orientation="horizontal">
        {highlightColors.map((color, index) => (
          <ColorHighlightButton
            key={color.value}
            editor={editor}
            color={color.value}
            aria-label={`${color.label} highlight color`}
            tabIndex={index === selectedIndex ? 0 : -1}
            data-highlighted={selectedIndex === index}
            onClick={onClose}
          />
        ))}
      </div>

      <Separator />

      <div className="tiptap-button-group">
        <Button
          onClick={removeHighlight}
          aria-label="Remove highlight"
          tabIndex={selectedIndex === highlightColors.length ? 0 : -1}
          type="button"
          role="menuitem"
          data-style="ghost"
          data-highlighted={selectedIndex === highlightColors.length}
        >
          <BanIcon className="tiptap-button-icon" />
        </Button>
      </div>
    </div>
  );
}

export function ColorHighlightPopover({
  editor: providedEditor,
  colors,
  hideWhenUnavailable = false,
  ...props
}: ColorHighlightPopoverProps) {
  const editor = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDisabled, setIsDisabled] = React.useState(false);

  const markAvailable = isMarkInSchema("highlight", editor);
  
  // Use dynamic colors if not provided
  const highlightColors = React.useMemo(
    () => colors || DEFAULT_HIGHLIGHT_COLORS,
    [colors]
  );

  React.useEffect(() => {
    if (!editor) return;

    const updateIsDisabled = () => {
      let isDisabled = false;

      if (!markAvailable || !editor) {
        isDisabled = true;
      }

      const isInCompatibleContext =
        editor.isActive("code") ||
        editor.isActive("codeBlock") ||
        editor.isActive("imageUpload");

      if (isInCompatibleContext) {
        isDisabled = true;
      }

      setIsDisabled(isDisabled);
    };

    editor.on("selectionUpdate", updateIsDisabled);
    editor.on("update", updateIsDisabled);

    return () => {
      editor.off("selectionUpdate", updateIsDisabled);
      editor.off("update", updateIsDisabled);
    };
  }, [editor, markAvailable]);

  const isActive = editor?.isActive("highlight") ?? false;

  const shouldShow = React.useMemo(() => {
    if (!hideWhenUnavailable || !editor) return true;

    return !(
      isNodeSelection(editor.state.selection) || !canToggleHighlight(editor)
    );
  }, [hideWhenUnavailable, editor]);

  if (!shouldShow || !editor || !editor.isEditable) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ColorHighlightPopoverButton
          disabled={isDisabled}
          data-active-state={isActive ? "on" : "off"}
          data-disabled={isDisabled}
          aria-pressed={isActive}
          {...props}
        />
      </PopoverTrigger>

      <PopoverContent aria-label="Highlight colors">
        <ColorHighlightPopoverContent
          editor={editor}
          colors={highlightColors}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

export default ColorHighlightPopover;
