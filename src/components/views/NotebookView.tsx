"use client";
import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useEffect } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { Clock } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

export const NotebookView = () => {
  const { currentNote, editorRef, saveCurrentNote, createEmptyNote } =
    useNoteEditor(); // Imported handleEditorUpdate

  const { currentView, saveDBSavedNote, removeUnsavedNote } = useNotesStore();

  // Create an empty note if there isn\'t one already
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      createEmptyNote("Untitled Note");
    }
  }, [currentNote, currentView, createEmptyNote]); // Added createEmptyNote to deps

  useHotkeys(
    "meta+s",
    async (e) => {
      console.log("Save hotkey triggered");
      e.preventDefault();
      e.stopPropagation();
      const successful = await saveCurrentNote();
      if (successful && mostCurrentNote) {
        saveDBSavedNote(mostCurrentNote);
        removeUnsavedNote(mostCurrentNote.pointer_id);
      }
    },
    {
      enableOnContentEditable: true,
      preventDefault: true,
      scopes: ["all"],
    },
  );

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Main Editor */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-[80%]">
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="w-full min-h-[calc(100vh-200px)]">
              <SimpleEditor
                key={currentNote?.pointer_id || "new-note"}
                content={noteContent}
                editorRef={editorRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with note info */}
      {currentNote && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-4"></div>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  Last edited {new Date(currentNote.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
