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
import React, { useRef } from "react";
import { useNotesStore } from "@/lib/notes-store";
import { NotebookView } from "@/components/views/notebook-view";
import { BaseNode, Node, FileNode } from "@/types/note";

export default function Page() {
  const { currentView, currentNote } = useNotesStore();
  const editorRef = useRef<{ getJSON: () => any; getText: () => string }>(null);

  const handleGetJSON = () => {
    if (editorRef.current) {
      const json = editorRef.current.getJSON();
      return json;
    }
    return null;
  };

  const handleGetText = () => {
    if (editorRef.current) {
      const text = editorRef.current.getText();
      return text;
    }
    return "";
  };

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
