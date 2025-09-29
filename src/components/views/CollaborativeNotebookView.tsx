"use client";
// import { SimpleEditor } from "../tiptap/tiptap-templates/simple/simple-editor";
import { CollaborativeEditor } from "../tiptap/tiptap-templates/collaborative/collaborative-editor";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useEffect, use } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Clock } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { usePreferencesStore } from "@/lib/stores/preferences-store";

import useSWR from "swr";
import { useConvex } from "convex/react";
import { createDataFetchers } from "@/lib/utils/dataFetchers";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const CollaborativeNotebookView = ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = use(params);
  console.log("SLUG ", slug);
  const { currentNote, editorRef, saveCurrentNote, createEmptyNote } =
    useNoteEditor(); // Imported handleEditorUpdate

  const {
    saveDBSavedNote,
    removeUnsavedNote,
    setCurrentNote,
    userNotes,
    setUserNotes,
    setDBSavedNotes,
  } = useNotesStore();
  const { currentView } = usePreferencesStore();

  const convex = useConvex();
  const dataFetchers = createDataFetchers(convex);

  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  const shouldFetch = isLoaded && isSignedIn && user?.id;
  const { isLoading } = useSWR(
    shouldFetch ? user.id : null,
    async (userId: string) => {
      const result = await dataFetchers.fetchUserNotes(userId);
      return result;
    },
    {
      onSuccess: (data) => {
        setUserNotes(data);
        setDBSavedNotes(data);
      },
      revalidateIfStale: true,
      dedupingInterval: 60000,
    },
  );

  // Handle note loading based on slug
  useEffect(() => {
    if (slug && !isLoading && userNotes.length > 0) {
      console.log("userNotes:", userNotes);
      const foundNote = userNotes.find((a) => a.pointer_id === slug);
      if (foundNote) {
        console.log("Setting currentNote:", foundNote);
        console.log("foundNote.content.tiptap:", foundNote.content.tiptap);
        setCurrentNote(foundNote);
      } else {
        console.log("No note found for slug:", slug);
      }
    }
  }, [slug, userNotes, setCurrentNote, isLoading]);

  // Create empty note only if no slug and no current note
  useEffect(() => {
    if (!slug && !currentNote && currentView === "note" && !isLoading) {
      createEmptyNote("Untitled Note");
    }
  }, [slug, createEmptyNote, currentView, isLoading]);

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

  console.log("Current note:", currentNote);
  console.log("Note content being passed to editor:", noteContent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Main Editor */}
      <div className="px-6 py-8 pb-20">
        <div className="mx-auto max-w-[80%]">
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="w-full min-h-[calc(100vh-240px)]">
              <CollaborativeEditor
                id={slug || currentNote?.pointer_id || "default-doc"}
                key={slug || currentNote?.pointer_id || "default-doc"}
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
