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

export function AppSidebar() {
  const { openUserNotes, setCurrentView } = useNotesStore();

  const handleCreateNote = () => {
    const title = `Note ${openUserNotes.length + 1}`;
    setCurrentView("note");
    //createNote(title);
  };

  const handleHomeClick = () => {
    //addTab({ id: "home", title: "Home", type: "home" });
    setCurrentView("home");
  };

  const handleNoteClick = (note: any) => {
    // addTab({
    //   id: note.id,
    //   title: note.title,
    //   type: "note",
    // });
    // setActiveTab(note.id);
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
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <SidebarGroupAction onClick={handleCreateNote}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Note</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {openUserNotes.map((note) => (
                <SidebarMenuItem key={String(note._id)}>
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
