"use client";

import * as React from "react";
import { isNodeSelection, type Editor } from "@tiptap/react";
import type { Node } from "@tiptap/pm/model";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Lib ---
import {
  findNodePosition,
  isEmptyNode,
  isMarkInSchema,
} from "@/lib/tiptap-utils";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";

// --- Styles ---
import "@/components/tiptap/tiptap-ui/color-highlight-button/color-highlight-button.scss";

export const HIGHLIGHT_COLORS = [
  {
    label: "Default background",
    value: "#fbbf24",
    border: "#f59e0b",
  },
  {
    label: "Gray background",
    value: "rgb(120, 120, 120)",
    border: "rgba(255, 255, 255, 0.3)",
  },
  {
    label: "Brown background",
    value: "rgb(139, 69, 19)",
    border: "rgba(205, 133, 63, 0.5)",
  },
  {
    label: "Orange background",
    value: "rgb(255, 140, 0)",
    border: "rgba(255, 165, 0, 0.6)",
  },
  {
    label: "Yellow background",
    value: "#fbbf24",
    border: "#f59e0b",
  },
  {
    label: "Green background",
    value: "#22c55e",
    border: "#16a34a",
  },
  {
    label: "Blue background",
    value: "#3b82f6",
    border: "#2563eb",
  },
  {
    label: "Purple background",
    value: "#a855f7",
    border: "#9333ea",
  },
  {
    label: "Pink background",
    value: "rgb(236, 72, 153)",
    border: "rgba(219, 39, 119, 0.7)",
  },
  {
    label: "Red background",
    value: "#ef4444",
    border: "#dc2626",
  },
];

export interface ColorHighlightButtonProps extends Omit<ButtonProps, "type"> {
  /**
   * The TipTap editor instance.
   */
  editor?: Editor | null;
  /**
   * The node to apply highlight to
   */
  node?: Node | null;
  /**
   * The position of the node in the document
   */
  nodePos?: number | null;
  /**
   * The color to apply when toggling the highlight.
   * If not provided, it will use the default color from the extension.
   */
  color: string;
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
  /**
   * Whether the button should hide when the mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * Called when the highlight is applied.
   */
  onApplied?: (color: string) => void;
}

/**
 * Checks if highlight can be toggled in the current editor state
 */
export function canToggleHighlight(editor: Editor | null): boolean {
  if (!editor) return false;
  try {
    return editor.can().setMark("highlight");
  } catch {
    return false;
  }
}

/**
 * Checks if highlight is active in the current selection
 */
export function isHighlightActive(
  editor: Editor | null,
  color: string,
): boolean {
  if (!editor) return false;
  return editor.isActive("highlight", { color });
}

/**
 * Toggles highlight on the current selection or specified node
 */
export function toggleHighlight(
  editor: Editor | null,
  color: string,
  node?: Node | null,
  nodePos?: number | null,
): void {
  if (!editor) return;

  try {
    const chain = editor.chain().focus();

    if (isEmptyNode(node)) {
      chain.toggleMark("highlight", { color }).run();
    } else if (nodePos !== undefined && nodePos !== null && nodePos !== -1) {
      chain.setNodeSelection(nodePos).toggleMark("highlight", { color }).run();
    } else if (node) {
      const foundPos = findNodePosition({ editor, node });
      if (foundPos) {
        chain
          .setNodeSelection(foundPos.pos)
          .toggleMark("highlight", { color })
          .run();
      } else {
        chain.toggleMark("highlight", { color }).run();
      }
    } else {
      chain.toggleMark("highlight", { color }).run();
    }

    editor.chain().setMeta("hideDragHandle", true).run();
  } catch (error) {
    console.error("Failed to apply highlight:", error);
  }
}

/**
 * Determines if the highlight button should be disabled
 */
export function isColorHighlightButtonDisabled(
  editor: Editor | null,
  userDisabled: boolean = false,
): boolean {
  if (!editor || userDisabled) return true;

  const isIncompatibleContext =
    editor.isActive("code") ||
    editor.isActive("codeBlock") ||
    editor.isActive("imageUpload");

  return isIncompatibleContext || !canToggleHighlight(editor);
}

/**
 * Determines if the highlight button should be shown
 */
export function shouldShowColorHighlightButton(
  editor: Editor | null,
  hideWhenUnavailable: boolean,
  highlightInSchema: boolean,
): boolean {
  if (!highlightInSchema || !editor) return false;

  if (hideWhenUnavailable) {
    if (
      isNodeSelection(editor.state.selection) ||
      !canToggleHighlight(editor)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Custom hook to manage highlight button state
 */
export function useHighlightState(
  editor: Editor | null,
  color: string,
  disabled: boolean = false,
  hideWhenUnavailable: boolean = false,
) {
  const highlightInSchema = isMarkInSchema("highlight", editor);
  const isDisabled = isColorHighlightButtonDisabled(editor, disabled);
  const isActive = isHighlightActive(editor, color);

  const shouldShow = React.useMemo(
    () =>
      shouldShowColorHighlightButton(
        editor,
        hideWhenUnavailable,
        highlightInSchema,
      ),
    [editor, hideWhenUnavailable, highlightInSchema],
  );

  return {
    highlightInSchema,
    isDisabled,
    isActive,
    shouldShow,
  };
}

/**
 * ColorHighlightButton component for TipTap editor
 */
export const ColorHighlightButton = React.forwardRef<
  HTMLButtonElement,
  ColorHighlightButtonProps
>(
  (
    {
      editor: providedEditor,
      node,
      nodePos,
      color,
      text,
      hideWhenUnavailable = false,
      className = "",
      disabled,
      onClick,
      onApplied,
      children,
      style,
      ...buttonProps
    },
    ref,
  ) => {
    const editor = useTiptapEditor(providedEditor);
    const { isDisabled, isActive, shouldShow } = useHighlightState(
      editor,
      color,
      disabled,
      hideWhenUnavailable,
    );

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);

        if (!e.defaultPrevented && !isDisabled && editor) {
          toggleHighlight(editor, color, node, nodePos);
          onApplied?.(color);
        }
      },
      [color, editor, isDisabled, node, nodePos, onClick, onApplied],
    );

    const buttonStyle = React.useMemo(
      () =>
        ({
          ...style,
          "--highlight-color": color,
        }) as React.CSSProperties,
      [color, style],
    );

    if (!shouldShow || !editor || !editor.isEditable) {
      return null;
    }

    return (
      <Button
        type="button"
        className={className.trim()}
        disabled={isDisabled}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={isDisabled}
        role="button"
        tabIndex={-1}
        aria-label={`${color} highlight color`}
        aria-pressed={isActive}
        onClick={handleClick}
        style={buttonStyle}
        {...buttonProps}
        ref={ref}
      >
        {children || (
          <>
            <span
              className="tiptap-button-highlight"
              style={{ "--highlight-color": color } as React.CSSProperties}
            />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    );
  },
);

ColorHighlightButton.displayName = "ColorHighlightButton";

export default ColorHighlightButton;