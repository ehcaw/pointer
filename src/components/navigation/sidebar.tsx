"use client";

import React, { useState, useCallback } from "react";
import {
  Home,
  FileText,
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
import { useNotesStore } from "@/lib/stores/notes-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { Node, FileNode } from "@/types/note";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import SupportModal from "./SupportModal";

import { DisplaySurveyType } from "posthog-js";
import { usePostHog } from "posthog-js/react";
import { TreeViewComponent } from "../sidebar/Treeview";
import { CreatePopover } from "./CreatePopover";
import { useRouter } from "next/navigation";

// Memoized note item component to prevent unnecessary re-renders
const NoteItem = React.memo(
  ({
    note,
    isActive,
    onNoteClick,
    onDeleteClick,
    router,
  }: {
    note: Node;
    isActive: boolean;
    onNoteClick: (note: Node) => void;
    onDeleteClick: (e: React.MouseEvent<HTMLButtonElement>, note: Node) => void;
    router: ReturnType<typeof useRouter>;
  }) => {
    const noteButton = (
      <SidebarMenuButton
        onClick={() => onNoteClick(note)}
        onMouseEnter={() => {
          // Prefetch the route on hover for faster navigation
          if (note.collaborative) {
            router.prefetch(`/main/collab/${note.pointer_id}`);
          } else {
            router.prefetch("/main");
          }
        }}
        data-active={isActive}
        className={cn(
          "rounded-lg transition-all w-full",
          isActive
            ? "bg-primary/10 text-primary hover:bg-primary/15"
            : "hover:bg-muted/20 dark:hover:bg-muted/20 hover:text-foreground",
        )}
      >
        <FileText className="h-4 w-4" />
        <span>{note.name}</span>
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem key={String(note.pointer_id)} className="relative group">
        <div className="relative group/item">
          {noteButton}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onDeleteClick(e, note)}
            className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-sm opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/10 group-data-[collapsible=icon]:hidden"
          >
            <Trash className="h-3 w-3 text-muted-foreground group-hover/item:text-destructive" />
            <span className="sr-only">Delete note</span>
          </Button>
        </div>
      </SidebarMenuItem>
    );
  },
);

NoteItem.displayName = "NoteItem";

// Memoized shared note item component
const SharedNoteItem = React.memo(
  ({
    note,
    isActive,
    onNoteClick,
    router,
  }: {
    note: Node;
    isActive: boolean;
    onNoteClick: (note: Node) => void;
    router: ReturnType<typeof useRouter>;
  }) => {
    return (
      <SidebarMenuItem key={String(note.pointer_id)}>
        <SidebarMenuButton
          onClick={() => onNoteClick(note)}
          onMouseEnter={() => {
            // Prefetch the route on hover for faster navigation
            if (note.collaborative) {
              router.prefetch(`/main/collab/${note.pointer_id}`);
            } else {
              router.prefetch("/main");
            }
          }}
          data-active={isActive}
          className={cn(
            "rounded-lg transition-all",
            isActive
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "hover:bg-accent hover:text-foreground",
          )}
        >
          <FileText className="h-4 w-4" />
          <span>{note.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  },
);

SharedNoteItem.displayName = "SharedNoteItem";

export default function AppSidebar() {
  const [noteToDelete, setNoteToDelete] = useState<Node | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Use optimized selectors

  const {
    userNotes,
    sharedNotes,
    openUserNotes,
    setCurrentNote,
    unsetCurrentNote,
    currentNote,
    dbSavedNotes,
    setOpenUserNotes,
  } = useNotesStore();

  const { currentView, setCurrentView } = usePreferencesStore();
  const { createNewNote, saveCurrentNote, deleteNote } = useNoteEditor();

  const router = useRouter();
  const posthog = usePostHog();

  const handleCreateNote = async () => {
    const title = `Note ${openUserNotes.length + 1}`;
    setCurrentView("note");
    const newNote = await createNewNote(title);
    setOpenUserNotes([...openUserNotes, newNote]);
  };

  const handleNavClick = useCallback(
    (view: "home" | "graph" | "whiteboard" | "note" | "settings") => {
      setCurrentView(view);
      router.push("/main");
    },
    [setCurrentView, router],
  );

  const handleNoteClick = useCallback(
    async (note: Node) => {
      // Optimistic navigation - update UI immediately
      setCurrentNote(note);

      if (note.collaborative) {
        router.push(`/main/collab/${note.pointer_id}`);
      } else {
        setCurrentView("note");
        router.push("/main");
      }

      // Save asynchronously after navigation (non-blocking)
      if (
        currentNote &&
        currentNote.type === "file" &&
        dbSavedNotes.get(currentNote.pointer_id) !== undefined &&
        currentNote?.content?.text !==
          (dbSavedNotes.get(currentNote.pointer_id)! as FileNode).content?.text
      ) {
        // Don't await - let it save in the background
        saveCurrentNote().catch((error) => {
          console.error("Failed to save note before navigation:", error);
        });
      }
    },
    [
      currentNote,
      dbSavedNotes,
      saveCurrentNote,
      setCurrentNote,
      setCurrentView,
      router,
    ],
  );

  const confirmDelete = useCallback(async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete.pointer_id || "", noteToDelete.tenantId);
      setNoteToDelete(null); // Close the dialog
    }
  }, [noteToDelete, deleteNote]);

  const addEmailValidation = (container: HTMLElement) => {
    // Find email inputs (first question should be email)
    const emailInputs = container.querySelectorAll(
      'input[type="email"], input[placeholder*="email" i], input[aria-label*="email" i]',
    );

    emailInputs.forEach((input) => {
      const emailInput = input as HTMLInputElement;

      // Create validation message element
      const validationMessage = document.createElement("div");
      validationMessage.className = "email-validation-message";
      validationMessage.textContent = "Please enter a valid email address";

      // Insert validation message after the input
      emailInput.parentNode?.insertBefore(
        validationMessage,
        emailInput.nextSibling,
      );

      // Email validation function
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Update validation state
      const updateValidation = () => {
        const isValid =
          emailInput.value.trim() === "" || validateEmail(emailInput.value);

        if (emailInput.value.trim() === "") {
          emailInput.classList.remove("valid", "invalid");
          validationMessage.classList.remove("show");
        } else if (isValid) {
          emailInput.classList.remove("invalid");
          emailInput.classList.add("valid");
          validationMessage.classList.remove("show");
        } else {
          emailInput.classList.remove("valid");
          emailInput.classList.add("invalid");
          validationMessage.classList.add("show");
        }

        // Enable/disable submit button based on email validity
        const submitButtons = container.querySelectorAll(
          'button[type="submit"], input[type="submit"], [role="button"]:not([aria-disabled="true"])',
        );

        submitButtons.forEach((button) => {
          if (emailInput.value.trim() !== "" && !isValid) {
            button.classList.add("email-invalid-disabled");
            (button as HTMLButtonElement).setAttribute("aria-disabled", "true");
          } else {
            button.classList.remove("email-invalid-disabled");
            (button as HTMLButtonElement).removeAttribute("aria-disabled");
          }
        });
      };

      // Add event listeners
      emailInput.addEventListener("input", updateValidation);
      emailInput.addEventListener("blur", updateValidation);

      // Initial validation
      updateValidation();
    });
  };

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
            // Add email validation for the first question
            // Delay slightly so PostHog has mounted its DOM
            setTimeout(() => {
              // container is in closure scope
              if (!container) return;
              const groups = container.querySelectorAll(
                'div[role="radiogroup"], div[role="group"]',
              );
              groups.forEach((g) => g.classList.add("ph-list"));

              // Add email validation
              addEmailValidation(container);
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
                  className="h-8 w-8 object-contain dark:bg-white"
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
          <SidebarGroupLabel className="text-muted-foreground font-medium">
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
                      : "hover:bg-muted/20 dark:hover:bg-muted/20 hover:text-foreground",
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
                        : "hover:bg-muted/20 dark:hover:bg-muted/20 hover:text-foreground",
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
                      : "hover:bg-muted/20 dark:hover:bg-muted/20 hover:text-foreground",
                  )}
                >
                  <LineSquiggle className="h-4 w-4" />
                  <span>whiteboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* All Notes Tree View */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium flex items-center justify-between">
            All Notes
            <CreatePopover onCreateNote={handleCreateNote} />
          </SidebarGroupLabel>
          {/*<SidebarGroupAction
            onClick={handleCreateNote}
            className="rounded-lg hover:bg-primary/10 text-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Note</span>
          </SidebarGroupAction>*/}
          <SidebarGroupContent className="-mx-4 pr-4 flex flex-col h-full">
            <div className="tree">
              <TreeViewComponent nodes={userNotes} />
            </div>
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
                    <SharedNoteItem
                      key={String(note.pointer_id)}
                      note={note}
                      isActive={isActive}
                      onNoteClick={handleNoteClick}
                      router={router}
                    />
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
