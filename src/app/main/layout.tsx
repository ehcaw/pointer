"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import AppSidebar from "@/components/navigation/sidebar";
import LoadingView from "@/components/views/LoadingView";
import { useNotesStore } from "@/lib/stores/notes-store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  const { setUserNotes, setDBSavedNotes, setSharedNotes } = useNotesStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  const shouldFetch = isLoaded && isSignedIn && user?.id;

  // Use Convex's reactive queries instead of SWR
  const notes = useQuery(
    api.notes.readNotesFromDbByUserId,
    shouldFetch ? { userId: user.id } : "skip",
  );

  const sharedNotes = useQuery(
    api.notes.getSharedDocumentsByUserId,
    shouldFetch ? { userId: user.id } : "skip",
  );

  const isLoading = notes === undefined || sharedNotes === undefined;

  // Sync Convex queries to Zustand store - updates automatically when data changes
  useEffect(() => {
    if (notes) {
      const updatedNotes = notes.map((note) => ({
        ...note,
        type: note.type || ("file" as const), // Default to "file" if type is undefined
      }));
      setUserNotes(updatedNotes);
      setDBSavedNotes(updatedNotes);
    }
  }, [notes]);

  useEffect(() => {
    if (sharedNotes) {
      const updatedSharedNotes = sharedNotes.map((note) => ({
        ...note,
        type: note.type || ("file" as const), // Default to "file" if type is undefined
      }));
      setSharedNotes(updatedSharedNotes);
    }
  }, [sharedNotes]);

  // Show loading while authentication is being checked or data is loading
  if (!isLoaded || isLoading) {
    return <LoadingView />;
  }

  // Don't render main app if not signed in (prevents flash)
  if (!isSignedIn) {
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
        <ResizablePanel defaultSize={75}>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
