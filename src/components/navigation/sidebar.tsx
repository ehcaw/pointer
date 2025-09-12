"use client";

import { useState } from "react";
import {
  Plus,
  Home,
  FileText,
  Clock,
  Edit3,
  GitGraph,
  Trash,
} from "lucide-react";
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
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useNotesStore } from "@/lib/notes-store";
import { Node } from "@/types/note";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ThemeToggle } from "../theme-toggle";

export default function AppSidebar() {
  const [noteToDelete, setNoteToDelete] = useState<Node | null>(null);

  const {
    userNotes,
    setCurrentView,
    currentView,
    unsavedNotes,
    openUserNotes,
    setCurrentNote,
    currentNote,
    dbSavedNotes,
  } = useNotesStore();

  const { createNewNote, saveCurrentNote, deleteNote } = useNoteEditor();

  const handleCreateNote = () => {
    const title = `Note ${openUserNotes.length + 1}`;
    setCurrentView("note");
    createNewNote(title);
  };

  const handleNavClick = (view: "home" | "graph") => {
    setCurrentView(view);
  };

  const handleNoteClick = async (note: Node) => {
    if (
      currentNote &&
      dbSavedNotes.get(currentNote.pointer_id) != undefined &&
      currentNote.content.text !=
        dbSavedNotes.get(currentNote.pointer_id)!.content.text
    ) {
      saveCurrentNote();
    }

    setCurrentNote(note);
    setCurrentView("note");
  };

  const handleOpenDeleteDialog = (
    e: React.MouseEvent<HTMLButtonElement>,
    note: Node,
  ) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.pointer_id || "");
      console.log("Confirmed deletion for:", noteToDelete.name);
      setNoteToDelete(null); // Close the dialog
    }
  };

  const recentNotes = userNotes
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header */}
      <SidebarHeader className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Edit3 className="h-4 w-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              pointer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your digital workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-slate-900">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavClick("home")}
                  data-active={currentView === "home"}
                  className={cn(
                    "rounded-lg transition-all",
                    currentView === "home"
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={() => handleNavClick("graph")}
                  data-active={currentView == "graph"}
                  className={cn(
                    "rounded-lg transition-all",
                    currentView === "home"
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                  )}
                >
                  <GitGraph className="h-4 w-4" />
                  <span>Jots</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Unsaved Changes */}
        {Array.from(unsavedNotes.values()).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Unsaved Changes
              <Badge
                variant="secondary"
                className="ml-auto bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
              >
                {Array.from(unsavedNotes.values()).length}
              </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from(unsavedNotes.values()).map((note) => (
                  <SidebarMenuItem key={String(note.pointer_id)}>
                    <SidebarMenuButton
                      onClick={() => handleNoteClick(note)}
                      className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 dark:bg-orange-900/30">
                        <FileText className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="truncate">{note.name}</span>
                      <div className="ml-auto h-2 w-2 rounded-full bg-orange-500" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Notes */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
            Recent Notes
          </SidebarGroupLabel>
          <SidebarGroupAction
            onClick={handleCreateNote}
            className="rounded-lg hover:bg-primary/10 text-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Note</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentNotes.map((note) => {
                const isActive = currentNote?.pointer_id === note.pointer_id;

                return (
                  <SidebarMenuItem
                    key={String(note.pointer_id)}
                    className="relative group"
                  >
                    <SidebarMenuButton
                      onClick={() => handleNoteClick(note)}
                      data-active={isActive}
                      className={cn(
                        "rounded-lg transition-all my-1.5 w-full", // Use full width
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded",
                          isActive
                            ? "bg-primary/20"
                            : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700",
                        )}
                      >
                        <FileText
                          className={cn(
                            "h-3 w-3",
                            isActive
                              ? "text-primary"
                              : "text-slate-500 dark:text-slate-400",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="truncate font-medium">{note.name}</div>
                      </div>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleOpenDeleteDialog(e, note)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                    >
                      <Trash className="h-3 w-3 text-slate-500 group-hover:text-red-500" />
                      <span className="sr-only">Delete note</span>
                    </Button>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* All Notes (collapsed by default) */}
        {userNotes.length > 5 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-medium">
              All Notes ({userNotes.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNotes.slice(5).map((note) => {
                  const isActive = currentNote?.pointer_id === note.pointer_id;

                  return (
                    <SidebarMenuItem key={String(note.pointer_id)}>
                      <SidebarMenuButton
                        onClick={() => handleNoteClick(note)}
                        size="sm"
                        className={cn(
                          "rounded-lg transition-all",
                          isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
                        )}
                      >
                        <FileText className="h-3 w-3" />
                        <span className="truncate text-xs">{note.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>{userNotes.length} notes total</span>
            </div>
          </div>
          <ThemeToggle size="sm" />
        </div>
      </SidebarFooter>
      {noteToDelete && (
        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={(isOpen) => !isOpen && setNoteToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                note titled &quot;{noteToDelete.name}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Sidebar>
  );
}
