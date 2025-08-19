"use client";
import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useEffect, useState } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Save, FileText, Clock, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useHotkeys } from "react-hotkeys-hook";

export const NotebookView = () => {
  const { currentNote, editorRef, isSaving, saveCurrentNote, createEmptyNote } =
    useNoteEditor(); // Imported handleEditorUpdate

  const {
    currentView,
    markNoteAsUnsaved,
    saveDBSavedNote,
    removeUnsavedNote,
    dbSavedNotes,
  } = useNotesStore();

  // Create an empty note if there isn\'t one already
  useEffect(() => {
    if (!currentNote && currentView === "note") {
      createEmptyNote("Untitled Note");
    }
  }, [currentNote, currentView, createEmptyNote]); // Added createEmptyNote to deps

  const [title, setTitle] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  useHotkeys(
    "meta+s",
    async (e) => {
      console.log("Save hotkey triggered");
      e.preventDefault();
      e.stopPropagation();
      const successful = await saveCurrentNote();
      if (successful && mostCurrentNote) {
        saveDBSavedNote(mostCurrentNote);
        removeUnsavedNote(mostCurrentNote.quibble_id);
      }
    },
    {
      enableOnContentEditable: true,
      preventDefault: true,
      scopes: ["all"],
    },
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setTitle(e.target.value);
    if (currentNote) {
      markNoteAsUnsaved({ ...currentNote, name: e.target.value });
      currentNote.name = e.target.value;
    }
  };

  useEffect(() => {
    if (currentNote) setTitle(currentNote.name);
    else setTitle("");
  }, [currentNote]);

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
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleBackToHome}
                className="rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button> */}

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>

                <Input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={() => setIsTitleFocused(false)}
                  placeholder="Untitled Note"
                  className={cn(
                    "text-xl font-semibold bg-transparent border-0 shadow-none p-0 h-auto",
                    "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    "focus:outline-none focus-visible:ring-0",
                    isTitleFocused
                      ? "border-b-2 border-primary"
                      : "hover:border-b-2 hover:border-slate-300 dark:hover:border-slate-600",
                  )}
                />
              </div>
            </div>

            {/* Right: Status and save button */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Note metadata */}
              {currentNote && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(currentNote.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Save status */}
              {isSaving && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  Saving...
                </Badge>
              )}

              {/* Save button */}
              <Button
                onClick={saveCurrentNote}
                disabled={
                  isSaving ||
                  noteContent === dbSavedNotes.get(mostCurrentNote?.quibble_id)
                    ? dbSavedNotes.get(mostCurrentNote.quibble_id).content
                        .tiptap
                    : "{}"
                }
                className={cn(
                  "rounded-lg px-4 py-2 font-medium shadow-sm transition-all",
                  isSaving
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl",
                )}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-[80%]">
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="w-full min-h-[calc(100vh-200px)]">
              <SimpleEditor
                key={currentNote?.quibble_id || "new-note"}
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
              <div className="flex items-center gap-4">
                <span>ID: {currentNote.quibble_id.slice(-8)}</span>
                <span>•</span>
                <span>Type: {currentNote.type}</span>
              </div>

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
