"use client";
import { SimpleEditor } from "../tiptap/tiptap-templates/simple/simple-editor";
import { FloatingToolbar } from "../tiptap/tiptap-templates/toolbar/FloatingToolbar";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useNoteContent } from "@/hooks/use-note-content";
import { useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Editor } from "@tiptap/react";

export const NotebookView = () => {
  const { currentNote, editorRef } = useNoteEditor();
  const { noteContent, isLoadingContent } = useNoteContent();
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-background dark:from-background dark:via-background dark:to-background">
      {/* Main Editor */}
      <div className="px-6 py-8 pb-20">
        <div className="mx-auto max-w-[100%]">
          {/* Floating Toolbar */}
          {editor && editorContainerRef.current && (
            <FloatingToolbar
              editor={editor}
              editorContainerRef={editorContainerRef}
              connectionStatus="connected"
              isCollaborative={false}
            />
          )}
          <div className="bg-card dark:bg-card rounded-sm shadow-sm border border-border overflow-hidden">
            <div
              className="w-full min-h-[calc(100vh-240px)]"
              ref={editorContainerRef}
            >
              <SimpleEditor
                key={currentNote?.pointer_id || "new-note"}
                content={isLoadingContent ? "" : noteContent}
                editorRef={editorRef}
                onEditorReady={setEditor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with note info */}
      {currentNote && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 dark:bg-background/80 backdrop-blur-sm border-t border-border dark:border-border h-16">
          <div className="px-6 py-4 h-full">
            <div className="flex items-center justify-between text-sm text-muted-foreground h-full">
              <div className="flex items-center gap-4"></div>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  Last saved {new Date(currentNote.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

