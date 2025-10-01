"use client";
// import { SimpleEditor } from "../tiptap/tiptap-templates/simple/simple-editor";
import { CollaborativeEditor } from "../tiptap/tiptap-templates/collaborative/collaborative-editor";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useEffect } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Clock } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const CollaborativeNotebookView = ({}) => {
  const { currentNote, editorRef, saveCurrentNote } = useNoteEditor(); // Imported handleEditorUpdate

  const { saveDBSavedNote, removeUnsavedNote } = useNotesStore();

  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  useHotkeys(
    "meta+s",
    async (e) => {
      console.log("Save hotkey triggered");
      e.preventDefault();
      e.stopPropagation();
      const successful = await saveCurrentNote();
      if (successful && currentNote) {
        saveDBSavedNote(currentNote);
        removeUnsavedNote(currentNote.pointer_id);
      }
    },
    {
      enableOnContentEditable: true,
      preventDefault: true,
      scopes: ["all"],
    },
  );

  const noteContent = currentNote
    ? currentNote.content.tiptap
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
      <div className="px-6 py-8 pb-20">
        <div className="mx-auto max-w-[80%]">
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="w-full min-h-[calc(100vh-240px)]">
              <CollaborativeEditor
                id={currentNote?.pointer_id || "default-doc"}
                key={currentNote?.pointer_id || "default-doc"}
                content={noteContent}
                editorRef={editorRef}
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
