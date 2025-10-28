"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { useNotesStore } from "@/lib/stores/notes-store";
import NoteViewHeader from "@/components/views/headers/NoteViewHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import AppSidebar from "@/components/navigation/sidebar";
import LoadingView from "@/components/views/LoadingView";
import { useNoteEditor } from "@/hooks/use-note-editor";
import useSWR from "swr";
import { createDataFetchers } from "@/lib/utils/dataFetchers";
import CollaborativeNotebookView from "@/components/views/CollaborativeNotebookView";

export default function CollaborativeNotePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const convex = useConvex();

  const { setUserNotes, setDBSavedNotes, setSharedNotes, currentNote } =
    useNotesStore();

  // Use hooks for editor management
  const { editorRef } = useNoteEditor();

  const dataFetchers = createDataFetchers(convex);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  // Fetch note data, content, and set in store
  // useEffect(() => {
  //   if (!slug || !isSignedIn) return;

  //   let isMounted = true;

  //   const fetchNoteAndContent = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);

  //       // Fetch note metadata
  //       const noteData = await convex.query(api.notes.readNoteFromDb, {
  //         pointer_id: slug,
  //       });

  //       if (!isMounted) return;

  //       if (!noteData) {
  //         setError("Note not found");
  //         return;
  //       }

  //       // Ensure the note is collaborative
  //       if (!noteData.collaborative) {
  //         setError("This is not a collaborative note");
  //         return;
  //       }

  //       const typedNote = noteData as FileNode;

  //       // Fetch note content separately using convex directly
  //       const noteId = typedNote._id?.toString() || typedNote.pointer_id;
  //       let contentToUse = "";

  //       try {
  //         const noteContent = await convex.query(
  //           api.notesContent.getNoteContentById,
  //           { noteId },
  //         );
  //         const contentString = JSON.stringify(noteContent);
  //         const parsed = JSON.parse(contentString);
  //         contentToUse = parsed.tiptap || "";

  //         // Update the note with the fetched content
  //         typedNote.content = parsed;
  //       } catch (contentErr) {
  //         console.warn(
  //           "Failed to fetch content, using embedded content:",
  //           contentErr,
  //         );
  //         // Fallback to embedded content if separate fetch fails
  //         contentToUse = typedNote.content?.tiptap || "";
  //       }

  //       if (!isMounted) return;

  //       // Set note in store FIRST so collaborative editor can access it
  //       setCurrentNote(typedNote);

  //       // Then set content for rendering
  //       setNoteContent(contentToUse);
  //       setContentReady(true);

  //       console.log("Collaborative note loaded:", {
  //         noteId: typedNote.pointer_id,
  //         noteName: typedNote.name,
  //         hasContent: !!contentToUse,
  //         contentLength: contentToUse?.length || 0,
  //       });
  //     } catch (err) {
  //       console.error("Error fetching note:", err);
  //       if (isMounted) {
  //         setError("Failed to load note");
  //       }
  //     } finally {
  //       if (isMounted) {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   fetchNoteAndContent();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [slug, isSignedIn, convex, setCurrentNote]);

  const shouldFetch = isLoaded && isSignedIn && user?.id;
  const { isLoading: isLoading, error } = useSWR(
    shouldFetch ? user.id : null,
    async (userId: string) => {
      const notes = await dataFetchers.fetchUserNotes(userId);
      const sharedNotes = await dataFetchers.fetchSharedNotes(userId);
      return {
        notes,
        sharedNotes,
      };
    },
    {
      onSuccess: (data) => {
        setUserNotes(data.notes);
        setDBSavedNotes(data.notes);
        setSharedNotes(data.sharedNotes);
      },
      revalidateIfStale: true,
      dedupingInterval: 60000,
    },
  );

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current?.cleanupProvider) {
        editorRef.current.cleanupProvider();
      }
    };
  }, [editorRef]);

  if (!isLoaded || isLoading) {
    return <LoadingView />;
  }

  if (!isSignedIn) {
    return <LoadingView />; // Will redirect in useEffect
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{"ERR"}</p>
          <button
            onClick={() => router.push("/main")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Back to Main
          </button>
        </div>
      </div>
    );
  }

  // Ensure both note and content are ready before rendering editor
  if (!currentNote) {
    return <LoadingView />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-card to-background dark:from-background dark:via-card dark:to-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={12} minSize={7} maxSize={40}>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col h-full bg-background">
            {/* Header for collaborative note view */}
            <NoteViewHeader />

            {/* Main Editor */}
            {/*<div className={`overflow-y-auto h-[calc(100vh-4rem)]`}>
              <div className="px-6 py-8 pb-20">
                <div className="mx-auto max-w-[100%]">
                  {/* Floating Toolbar */}
            {/*{editor && editorContainerRef.current && (
                    <FloatingToolbar
                      editor={editor}
                      editorContainerRef={editorContainerRef}
                      connectionStatus={connectionStatus}
                      isCollaborative={true}
                    />
                  )}
                  <div className="bg-card rounded-sm shadow-sm border border-border overflow-hidden">
                    <div
                      className="w-full min-h-[calc(100vh-240px)]"
                      ref={editorContainerRef}
                    >
                      <CollaborativeEditor
                        id={currentNote.pointer_id}
                        content={noteContent}
                        editorRef={editorRef}
                        onEditorReady={setEditor}
                        onConnectionStatusChange={setConnectionStatus}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>*/}
            <CollaborativeNotebookView />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
