"use client";
import { AppSidebar } from "@/components/navigation/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HomeView } from "@/components/views/home-view";
import React, { useEffect } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { NotebookView } from "@/components/views/notebook-view";
import { FileNode, Node } from "@/types/note";
import { useHotkeys } from "react-hotkeys-hook";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";

export default function Page() {
  const { currentView, currentNote, setUserNotes } = useNotesStore();
  const { saveCurrentNote } = useNoteEditor();

  const notes: Node[] | undefined = useQuery(api.notes.readNotesFromDb, {
    // user_id: process.env.TEMP_TENANT_ID!,
    user_id: "12345678",
  });
  useEffect(() => {
    if (notes && notes.length > 0) {
      setUserNotes(notes); // Replace state completely, don't append
    }
  }, [notes, setUserNotes]); // Only run when notes changes

  // Multiple combos in one hook (no spaces!), inspect handler.combo
  useHotkeys(
    "meta+s",
    (e) => {
      console.log("Save hotkey triggered");
      e.preventDefault();
      e.stopPropagation();
      saveCurrentNote();
    },
    {
      enableOnContentEditable: true,
      preventDefault: true,
      scopes: ["all"],
    },
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {currentView == "note" && (
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">workspace</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">notes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {(currentNote as FileNode).name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
        )}
        <div className="flex flex-1 flex-col gap-4 p-4 h-screen overflow-y-auto">
          {currentView == "home" && (
            <div style={{ maxHeight: "100vh" }}>
              <HomeView />
            </div>
          )}
          {currentView == "note" && <NotebookView />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
