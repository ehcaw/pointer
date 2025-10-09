"use client";

import { useState } from "react";
import {
  Plus,
  Home,
  FileText,
  Clock,
  GitGraph,
  Trash,
  LineSquiggle,
  Users,
  Cog,
  HandHelping,
} from "lucide-react";
import Image from "next/image";
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
import { useNotesStore } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { Node } from "@/types/note";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import SupportModal from "./SupportModal";

import { DisplaySurveyType } from "posthog-js";
import { usePostHog } from "posthog-js/react";

export default function AppSidebar() {
  const [noteToDelete, setNoteToDelete] = useState<Node | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const {
    userNotes,
    sharedNotes,
    unsavedNotes,
    openUserNotes,
    setCurrentNote,
    unsetCurrentNote,
    currentNote,
    dbSavedNotes,
  } = useNotesStore();

  const { currentView, setCurrentView } = usePreferencesStore();
  const { createNewNote, saveCurrentNote, deleteNote } = useNoteEditor();

  const posthog = usePostHog();

  const handleCreateNote = () => {
    const title = `Note ${openUserNotes.length + 1}`;
    setCurrentView("note");
    createNewNote(title);
  };

  const handleNavClick = (
    view: "home" | "graph" | "whiteboard" | "note" | "settings",
  ) => {
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

  const confirmDelete = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete.pointer_id || "", noteToDelete.tenantId);
      setNoteToDelete(null); // Close the dialog
    }
  };

  const recentNotes = userNotes
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  const handleForceShowInlineSurvey = () => {
    const surveyId = process.env.NEXT_PUBLIC_POSTHOG_FEEDBACK_SURVEY_ID;
    if (!surveyId || !posthog) return;

    // wait for dialog content to mount
    setTimeout(() => {
      const container = document.getElementById("pointer-survey-container");
      if (!container) return;
      container.innerHTML = "";

      let attempts = 0;
      const hasLoadedFlag = (
        ph: unknown,
      ): ph is {
        __loaded: boolean;
        displaySurvey: typeof posthog.displaySurvey;
      } =>
        typeof ph === "object" &&
        ph !== null &&
        "__loaded" in ph &&
        typeof (ph as { __loaded?: unknown }).__loaded === "boolean";
      const tryRender = () => {
        if (hasLoadedFlag(posthog) && posthog.__loaded) {
          try {
            posthog.displaySurvey(surveyId, {
              displayType: DisplaySurveyType.Inline,
              selector: "#pointer-survey-container",
              ignoreConditions: true,
              ignoreDelay: true,
            });
            // Apply opt-in "ph-list" class to choice groups for cleaner list styling
            // Delay slightly so PostHog has mounted its DOM
            setTimeout(() => {
              // container is in closure scope
              if (!container) return;
              const groups = container.querySelectorAll(
                'div[role="radiogroup"], div[role="group"]',
              );
              groups.forEach((g) => g.classList.add("ph-list"));
            }, 60);
          } catch (e) {
            console.error("Failed to display survey", e);
          }
          return;
        }
        if (attempts++ < 30) {
          setTimeout(tryRender, 150);
        }
      };

      tryRender();
    }, 50);
  };

  return (
    <Sidebar
      collapsible="none"
      className="border-r-0 flex flex-col h-screen w-full"
    >
      {/* Header */}
      <SidebarHeader className="h-16 bg-gradient-to-br from-background to-card border-b border-border p-4">
        <div className="flex items-center h-full w-full">
          {/* Expanded state */}
          <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                <Image
                  src="/images/pointerlogo-575-transparent.svg"
                  alt="Pen icon"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <h2 className="text-med font-serif text-foreground">pointer</h2>
                <p className="text-xs font-serif text-muted-foreground">
                  your digital workspace
                </p>
              </div>
            </div>
          </div>
          {/* Collapsed state */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg">
              <Image
                src="/images/pointerlogo-575-transparent.svg"
                alt="Pen icon"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background flex-1 overflow-y-auto">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground dark:text-muted-foreground font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    handleNavClick("home");
                    unsetCurrentNote();
                  }}
                  data-active={currentView === "home"}
                  className={cn(
                    "rounded-lg transition-all",
                    currentView === "home"
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "hover:bg-muted/20 dark:hover:bg-muted/20 text-foreground dark:text-foreground",
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>home</span>
                </SidebarMenuButton>
                {process.env.NODE_ENV !== "production" && (
                  <SidebarMenuButton
                    onClick={() => {
                      handleNavClick("graph");
                      unsetCurrentNote();
                    }}
                    data-active={currentView === "graph"}
                    className={cn(
                      "rounded-lg transition-all",
                      currentView === "graph"
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "hover:bg-muted/20 dark:hover:bg-muted/20 text-foreground dark:text-foreground",
                    )}
                  >
                    <GitGraph className="h-4 w-4" />
                    <span>jots</span>
                  </SidebarMenuButton>
                )}
                <SidebarMenuButton
                  onClick={() => {
                    handleNavClick("whiteboard");
                    unsetCurrentNote();
                  }}
                  data-active={currentView === "whiteboard"}
                  className={cn(
                    "rounded-lg transition-all",
                    currentView === "whiteboard"
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "hover:bg-muted/20 dark:hover:bg-muted/20 text-foreground dark:text-foreground",
                  )}
                >
                  <LineSquiggle className="h-4 w-4" />
                  <span>whiteboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Unsaved Changes */}
        {Array.from(unsavedNotes.values()).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-accent-foreground dark:text-accent-foreground font-medium flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Unsaved Changes
              <Badge
                variant="secondary"
                className="ml-auto bg-accent/20 dark:bg-accent/20 text-accent-foreground dark:text-accent-foreground"
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
                      className="rounded-lg hover:bg-accent text-accent-foreground"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-accent/20 dark:bg-accent/20">
                        <FileText className="h-3 w-3 text-accent-foreground dark:text-accent-foreground" />
                      </div>
                      <span className="truncate">{note.name}</span>
                      <div className="ml-auto h-2 w-2 rounded-full bg-accent" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Notes */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium flex items-center gap-2">
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

                const noteButton = (
                  <SidebarMenuButton
                    onClick={() => handleNoteClick(note)}
                    data-active={isActive}
                    className={cn(
                      "rounded-lg transition-all w-full",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "hover:bg-muted/20 dark:hover:bg-muted/20 text-foreground dark:text-foreground",
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span>{note.name}</span>
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem
                    key={String(note.pointer_id)}
                    className="relative group"
                  >
                    <div className="relative group/item">
                      {noteButton}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleOpenDeleteDialog(e, note)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-sm opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/10 group-data-[collapsible=icon]:hidden"
                      >
                        <Trash className="h-3 w-3 text-muted-foreground group-hover/item:text-destructive" />
                        <span className="sr-only">Delete note</span>
                      </Button>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Shared with me */}
        {sharedNotes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium flex items-center gap-2">
              <Users className="h-3 w-3" />
              Shared with me
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sharedNotes.map((note) => {
                  const isActive = currentNote?.pointer_id === note.pointer_id;

                  return (
                    <SidebarMenuItem key={String(note.pointer_id)}>
                      <SidebarMenuButton
                        onClick={() => handleNoteClick(note)}
                        data-active={isActive}
                        className={cn(
                          "rounded-lg transition-all",
                          isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "hover:bg-accent text-accent-foreground",
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        <span>{note.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* All Notes (collapsed by default) */}
        {userNotes.length > 5 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium">
              All Notes ({userNotes.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNotes.slice(5).map((note) => {
                  const isActive = currentNote?.pointer_id === note.pointer_id;

                  const noteButton = (
                    <SidebarMenuButton
                      onClick={() => handleNoteClick(note)}
                      data-active={isActive}
                      className={cn(
                        "rounded-lg transition-all w-full",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "hover:bg-accent text-accent-foreground",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{note.name}</span>
                    </SidebarMenuButton>
                  );

                  return (
                    <SidebarMenuItem
                      key={String(note.pointer_id)}
                      className="relative group"
                    >
                      <div className="relative group/item">
                        {noteButton}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenDeleteDialog(e, note)}
                          className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-sm opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/10 group-data-[collapsible=icon]:hidden"
                        >
                          <Trash className="h-3 w-3 text-muted-foreground group-hover/item:text-destructive" />
                          <span className="sr-only">Delete note</span>
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="h-16 bg-gradient-to-br from-background to-card border-t border-border p-4">
        <div className="flex items-center text-xs text-muted-foreground h-full w-full">
          {/* Expanded state */}
          <div className="group-data-[collapsible=icon]:hidden flex items-center w-full">
            <div className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground"
              >
                <ThemeToggle />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick("settings")}
                disabled={process.env.NODE_ENV === "production"}
                className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Cog className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSupportOpen(true);
                }}
                className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <HandHelping className="h-4 w-4" />
                <span className="sr-only">Support</span>
              </Button>
            </div>
          </div>
          {/* Collapsed state */}
          <div className="hidden group-data-[collapsible=icon]:flex flex-col h-full w-full py-1">
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-lg hover:bg-accent text-muted-foreground"
              >
                <ThemeToggle />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick("settings")}
                disabled={process.env.NODE_ENV === "production"}
                className="h-6 w-6 p-0 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Cog className="h-3 w-3" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSupportOpen(true)}
                className="h-6 w-6 p-0 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <HandHelping className="h-3 w-3" />
                <span className="sr-only">Support</span>
              </Button>
            </div>
          </div>
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
      <SupportModal
        isSupportOpen={isSupportOpen}
        setIsSupportOpen={setIsSupportOpen}
        onModalOpen={handleForceShowInlineSurvey}
      />
    </Sidebar>
  );
}
