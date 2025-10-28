"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import AppSidebar from "@/components/navigation/sidebar";
import LoadingView from "@/components/views/LoadingView";
import { useNotesStore } from "@/lib/stores/notes-store";
import { createDataFetchers } from "@/lib/utils/dataFetchers";
import useSWR from "swr";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const convex = useConvex();

  const { setUserNotes, setDBSavedNotes, setSharedNotes } = useNotesStore();
  const dataFetchers = createDataFetchers(convex);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  const shouldFetch = isLoaded && isSignedIn && user?.id;
  const { isLoading } = useSWR(
    shouldFetch ? `user-notes-${user.id}` : null,
    async () => {
      if (!user?.id) {
        throw new Error("User ID not available");
      }
      const notes = await dataFetchers.fetchUserNotes(user.id);
      const sharedNotes = await dataFetchers.fetchSharedNotes(user.id);
      return { notes, sharedNotes };
    },
    {
      onSuccess: (data) => {
        setUserNotes(data.notes);
        setDBSavedNotes(data.notes);
        setSharedNotes(data.sharedNotes);
      },
      revalidateIfStale: false, // Only fetch once per session
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes - prevents unnecessary refetches
    },
  );

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
