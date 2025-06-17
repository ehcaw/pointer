"use client";

import { Plus, Home, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNotesStore } from "@/lib/notes-store";
import { Node } from "@/types/note";
import { useNoteEditor } from "@/hooks/useNoteEditor";

export function AppSidebar() {
  const {
    userNotes,
    setCurrentView,
    unsavedNotes,
    openUserNotes,
    setCurrentNote,
  } = useNotesStore();

  const { createNewNote } = useNoteEditor();

  const handleCreateNote = () => {
    const title = `Note ${openUserNotes.length + 1}`;
    setCurrentView("note");
    createNewNote(title, null, []);
  };

  const handleHomeClick = () => {
    //addTab({ id: "home", title: "Home", type: "home" });
    setCurrentView("home");
  };

  const handleNoteClick = (note: Node) => {
    // addTab({
    //   id: note.id,
    //   title: note.title,
    //   type: "note",
    // });
    // setActiveTab(note.id);
    setCurrentNote(note);
    setCurrentView("note");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleHomeClick}>
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          {Array.from(unsavedNotes.values()).map((note) => {
            return (
              <SidebarMenuItem key={String(note.quibble_id)}>
                <SidebarMenuButton onClick={() => handleNoteClick(note)}>
                  <FileText className="h-4 w-4" />
                  <span>{note.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <SidebarGroupAction onClick={handleCreateNote}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Note</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNotes.map((note) => (
                <SidebarMenuItem key={String(note.quibble_id)}>
                  <SidebarMenuButton onClick={() => handleNoteClick(note)}>
                    <FileText className="h-4 w-4" />
                    <span>{note.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
