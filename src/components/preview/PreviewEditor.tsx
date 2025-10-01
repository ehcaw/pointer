"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@/components/tiptap/tiptap-extension/image-extension";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import { useEffect } from "react";

// Import the same Link extension as simple editor
import { Link } from "@/components/tiptap/tiptap-extension/link-extension";

// Import styles
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";

interface PreviewEditorProps {
  content: Record<string, unknown> | string | null | undefined;
  className?: string;
}

export const PreviewEditor = ({
  content,
  className = "",
}: PreviewEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 15,
        },
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
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: content,
    editable: false, // Make the editor read-only
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "preview-editor-content",
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      <EditorContent
        editor={editor}
        className="preview-editor-content focus:outline-none min-h-[200px] p-6"
      />
      <style jsx global>{`
        .preview-editor-content .ProseMirror {
          font-family: "DM Sans", sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #1a1a1a;
          outline: none;
        }

        .dark .preview-editor-content .ProseMirror {
          color: #ffffff;
        }

        .preview-editor-content .ProseMirror h1,
        .preview-editor-content .ProseMirror h2,
        .preview-editor-content .ProseMirror h3,
        .preview-editor-content .ProseMirror h4,
        .preview-editor-content .ProseMirror h5,
        .preview-editor-content .ProseMirror h6 {
          font-weight: 600;
          line-height: 1.3;
          margin: 1.5rem 0 1rem 0;
        }

        .preview-editor-content .ProseMirror p {
          margin: 0.75rem 0;
        }

        .preview-editor-content .ProseMirror ul,
        .preview-editor-content .ProseMirror ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .preview-editor-content .ProseMirror pre {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 1rem;
          overflow-x: auto;
          font-size: 14px;
          line-height: 1.4;
        }

        .dark .preview-editor-content .ProseMirror pre {
          background: #2d3748;
        }

        .preview-editor-content .ProseMirror code {
          background: #e9ecef;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-size: 0.9em;
        }

        .dark .preview-editor-content .ProseMirror code {
          background: #4a5568;
        }

        .preview-editor-content .ProseMirror blockquote {
          border-left: 4px solid #dee2e6;
          margin: 1rem 0;
          padding-left: 1rem;
          color: #6c757d;
          font-style: italic;
        }

        .dark .preview-editor-content .ProseMirror blockquote {
          border-left-color: #4a5568;
          color: #a0aec0;
        }

        .preview-editor-content .ProseMirror a {
          color: #0066cc;
          text-decoration: none;
        }

        .preview-editor-content .ProseMirror a:hover {
          text-decoration: underline;
        }

        .dark .preview-editor-content .ProseMirror a {
          color: #60a5fa;
        }

        .preview-editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 1rem 0;
        }

        .preview-editor-content .ProseMirror .task-list {
          list-style: none;
          padding-left: 0;
        }

        .preview-editor-content .ProseMirror .task-list li {
          display: flex;
          align-items: center;
          margin: 0.5rem 0;
        }

        .preview-editor-content
          .ProseMirror
          .task-list
          li
          input[type="checkbox"] {
          margin-right: 0.5rem;
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
};
