"use client";
import { SimpleEditor } from "../tiptap/tiptap-templates/simple/simple-editor";
import { FloatingToolbar } from "../tiptap/tiptap-templates/toolbar/FloatingToolbar";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useEffect, useRef, useState } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Clock } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { Editor } from "@tiptap/react";

export const NotebookView = () => {
  const { currentNote, editorRef, createEmptyNote } = useNoteEditor(); // Imported handleEditorUpdate

  const { currentView } = usePreferencesStore();
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Create an empty note if there isn\'t one already
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      createEmptyNote("Untitled Note");
    }
  }, [currentNote, currentView, createEmptyNote]); // Added createEmptyNote to deps

  const mostCurrentNote = useNotesStore.getState().currentNote;
  const noteContent = mostCurrentNote
    ? mostCurrentNote.content.tiptap
    : {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Main Editor */}
      <div className="px-6 py-8 pb-20">
        <div className="mx-auto max-w-[80%]">
          {/* Floating Toolbar */}
          {editor && editorContainerRef.current && (
            <FloatingToolbar
              editor={editor}
              editorContainerRef={editorContainerRef}
            />
          )}
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div
              className="w-full min-h-[calc(100vh-240px)]"
              ref={editorContainerRef}
            >
              <SimpleEditor
                key={currentNote?.pointer_id || "new-note"}
                content={noteContent}
                editorRef={editorRef}
                onEditorReady={setEditor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with note info */}
      {currentNote && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 h-16">
          <div className="px-6 py-4 h-full">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 h-full">
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
