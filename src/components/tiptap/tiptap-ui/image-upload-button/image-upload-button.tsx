"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { ImagePlusIcon } from "@/components/tiptap/tiptap-icons/image-plus-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";

import { useTiptapImage } from "@/lib/tiptap-utils";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

export interface ImageUploadButtonProps extends ButtonProps {
  editor?: Editor | null;
  text?: string;
  maxFileSize?: number;
  accept?: string;
  onUploadStart?: (files: File[]) => void;
  onUploadSuccess?: (urls: string[]) => void;
  onUploadError?: (error: Error, file?: File) => void;
}

export function useImageUploadButton(
  editor: Editor | null,
  options: {
    maxFileSize?: number;
    accept?: string;
    onUploadStart?: (files: File[]) => void;
    onUploadSuccess?: (urls: string[]) => void;
    onUploadError?: (error: Error, file?: File) => void;
  } = {},
) {
  const { HandleImageUpload } = useTiptapImage();
  const { user } = useUser();
  const { currentNote } = useNotesStore();
  const { saveCurrentNote } = useNoteEditor();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    accept = "image/*",
    onUploadStart,
    onUploadSuccess,
    onUploadError,
  } = options;

  const handleImageUpload = React.useCallback(
    async (files: File[]) => {
      if (!editor || files.length === 0) return;

      // Validate files
      const validFiles = files.filter((file) => {
        if (!file.type.startsWith("image/")) {
          onUploadError?.(new Error(`${file.name} is not an image file`), file);
          return false;
        }
        if (file.size > maxFileSize) {
          onUploadError?.(
            new Error(
              `${file.name} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`,
            ),
            file,
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);
      onUploadStart?.(validFiles);

      const uploadedUrls: string[] = [];
      const currentPosition = editor.state.selection.from;

      try {
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          const filename =
            file.name.replace(/\.[^/.]+$/, "") || `image-${i + 1}`;
          const placeholderText = `Uploading ${filename}...`;

          try {
            // Insert placeholder while uploading
            const placeholderPosition = currentPosition + i * 2; // Account for spacing
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

            const userId = user?.id; // Upload to Convex
            const imageUrl = await HandleImageUpload(
              file,
              userId || "",
              "notes",
              (currentNote?._id || "") as Id<"notes">,
            );
            uploadedUrls.push(imageUrl);
            // Replace placeholder with actual image
            const doc = editor.state.doc;
            let placeholderPos = -1;
            // Search for the placeholder text
            doc.descendants((node, pos) => {
              if (node.isText && node.text === placeholderText) {
                placeholderPos = pos;
                return false; // Stop searching
              }
              return true;
            });
            if (placeholderPos !== -1) {
              // Replace the entire paragraph containing the placeholder
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
          } catch (error) {
            const uploadError =
              error instanceof Error
                ? error
                : new Error(`Failed to upload ${file.name}`);
            onUploadError?.(uploadError, file);

            // Replace placeholder with error message
            const placeholderPosition = currentPosition + i * 2;
            editor
              .chain()
              .focus()
              .insertContentAt(placeholderPosition, [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: `Failed to upload ${filename}` },
                  ],
                },
              ])
              .run();
            console.log(error);
          }
        }

        if (uploadedUrls.length > 0) {
          onUploadSuccess?.(uploadedUrls);
        }
      } finally {
        setIsUploading(false);
        await saveCurrentNote();
      }
    },
    [editor, maxFileSize, onUploadStart, onUploadSuccess, onUploadError],
  );

  const handleFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleImageUpload(Array.from(files));
      }
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleImageUpload],
  );

  const triggerFileInput = React.useCallback(() => {
    if (isUploading) return;
    fileInputRef.current?.click();
  }, [isUploading]);

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={accept}
      multiple
      onChange={handleFileInputChange}
      style={{ display: "none" }}
    />
  );

  return {
    isUploading,
    triggerFileInput,
    fileInput,
  };
}

export const ImageUploadButton = React.forwardRef<
  HTMLButtonElement,
  ImageUploadButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      className = "",
      disabled,
      onClick,
      children,
      maxFileSize,
      accept,
      onUploadStart,
      onUploadSuccess,
      onUploadError,
      ...buttonProps
    },
    ref,
  ) => {
    const editor = useTiptapEditor(providedEditor);

    const { isUploading, triggerFileInput, fileInput } = useImageUploadButton(
      editor,
      {
        maxFileSize,
        accept,
        onUploadStart,
        onUploadSuccess,
        onUploadError,
      },
    );

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);

        if (!e.defaultPrevented && !disabled && !isUploading) {
          triggerFileInput();
        }
      },
      [onClick, disabled, isUploading, triggerFileInput],
    );

    if (!editor || !editor.isEditable) {
      return null;
    }

    return (
      <>
        {fileInput}
        <Button
          ref={ref}
          type="button"
          className={className.trim()}
          data-style="ghost"
          data-active-state={isUploading ? "on" : "off"}
          role="button"
          tabIndex={-1}
          aria-label={isUploading ? "Uploading images..." : "Add image"}
          aria-pressed={isUploading}
          tooltip={isUploading ? "Uploading..." : "Add image"}
          onClick={handleClick}
          disabled={disabled || isUploading}
          {...buttonProps}
        >
          {children || (
            <>
              <ImagePlusIcon className="tiptap-button-icon" />
              {text && (
                <span className="tiptap-button-text">
                  {isUploading ? "Uploading..." : text}
                </span>
              )}
            </>
          )}
        </Button>
      </>
    );
  },
);

ImageUploadButton.displayName = "ImageUploadButton";

export default ImageUploadButton;
