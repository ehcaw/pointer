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
    const waitForPostHogAndDisplaySurvey = () => {
      const surveyId = process.env.NEXT_PUBLIC_POSTHOG_FEEDBACK_SURVEY_ID;
      const container = document.getElementById("pointer-survey-container");

      console.log("Survey ID:", surveyId);
      console.log("Container element:", container);
      console.log("PostHog instance:", posthog);
      console.log("PostHog loaded:", posthog?.__loaded);

      if (!surveyId) {
        console.error("Survey ID is not defined");
        return;
      }

      if (!container) {
        console.error("Survey container not found");
        return;
      }

      if (!posthog) {
        console.error("PostHog not initialized");
        return;
      }

      // Check if PostHog is fully loaded
      if (!posthog.__loaded) {
        console.log("PostHog not fully loaded yet, waiting...");
        setTimeout(waitForPostHogAndDisplaySurvey, 100);
        return;
      }

      // Clear any existing content
      if (container) {
        container.innerHTML = "";
      }

      try {
        console.log("Attempting to display survey...");

        // Method 1: Try the standard displaySurvey approach
        posthog.displaySurvey(surveyId, {
          displayType: DisplaySurveyType.Inline,
          ignoreConditions: true,
          ignoreDelay: true,
          selector: "#pointer-survey-container",
        });

        // Method 2: If that doesn't work, try getting surveys manually
        setTimeout(() => {
          const surveyContainer = document.getElementById(
            "pointer-survey-container",
          );
          if (surveyContainer && surveyContainer.children.length === 0) {
            console.log("Survey didn't render, trying alternative method...");

            // Check if there are available surveys
            posthog.getSurveys((surveys) => {
              console.log("Available surveys:", surveys);
              const targetSurvey = surveys.find((s) => s.id === surveyId);

              if (targetSurvey) {
                console.log("Found target survey:", targetSurvey);
                // Try showing the survey again with different options
                posthog.displaySurvey(surveyId, {
                  displayType: DisplaySurveyType.Inline,
                  selector: "#pointer-survey-container",
                  ignoreConditions: true,
                  ignoreDelay: true,
                });
              } else {
                console.error("Target survey not found in available surveys");
                if (surveyContainer) {
                  surveyContainer.innerHTML =
                    '<p class="text-sm text-amber-600">Survey not available. Please check if it is active and published.</p>';
                }
              }
            });
          } else {
            // Apply styles with JavaScript as fallback
            setTimeout(() => {
              const applySurveyStyles = () => {
                const isDarkMode =
                  document.documentElement.classList.contains("dark");

                if (surveyContainer) {
                  const inputs = surveyContainer.querySelectorAll(
                    "input, textarea",
                  ) as NodeListOf<HTMLElement>;
                  const buttons = surveyContainer.querySelectorAll(
                    "button, [type='submit']",
                  ) as NodeListOf<HTMLElement>;
                  const questions = surveyContainer.querySelectorAll(
                    "h1, h2, h3, h4, h5, h6, p:first-child",
                  ) as NodeListOf<HTMLElement>;
                  const footers = surveyContainer.querySelectorAll(
                    "div:last-child, [class*='footer'], [class*='branding']",
                  ) as NodeListOf<HTMLElement>;

                  // Style inputs
                  inputs.forEach((input) => {
                    const borderColor = isDarkMode
                      ? "oklch(0.3240 0.0319 281.9784)"
                      : "oklch(0.8083 0.0174 271.1982)";
                    const backgroundColor = isDarkMode
                      ? "oklch(0.2429 0.0304 283.9110)"
                      : "oklch(1.0000 0 0)";
                    const textColor = isDarkMode
                      ? "oklch(0.8787 0.0426 272.2767)"
                      : "oklch(0.4355 0.0430 279.3250)";
                    const placeholderColor = isDarkMode
                      ? "oklch(0.7510 0.0396 273.9320)"
                      : "oklch(0.5471 0.0343 279.0837)";

                    input.style.cssText = `
                    width: 100% !important;
                    padding: 12px !important;
                    border: 1px solid ${borderColor} !important;
                    border-top: 1px solid ${borderColor} !important;
                    border-right: 1px solid ${borderColor} !important;
                    border-bottom: 1px solid ${borderColor} !important;
                    border-left: 1px solid ${borderColor} !important;
                    border-radius: var(--radius, 0.35rem) !important;
                    font-size: 14px !important;
                    background: ${backgroundColor} !important;
                    color: ${textColor} !important;
                    font-family: var(--font-sans, Montserrat, sans-serif) !important;
                    box-sizing: border-box !important;
                    display: block !important;
                    margin-bottom: 12px !important;
                    outline: none !important;
                    box-shadow: none !important;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    appearance: none !important;
                  `;

                    // Remove any pseudo-element borders
                    const style = document.createElement("style");
                    style.textContent = `
                      #pointer-survey-container input:before,
                      #pointer-survey-container input:after,
                      #pointer-survey-container textarea:before,
                      #pointer-survey-container textarea:after {
                        display: none !important;
                      }
                      #pointer-survey-container input:focus,
                      #pointer-survey-container textarea:focus {
                        border: 1px solid ${borderColor} !important;
                        outline: none !important;
                        box-shadow: none !important;
                      }
                      #pointer-survey-container hr {
                        display: none !important;
                      }
                      #pointer-survey-container div:empty:not([class*='input']):not([id]):not([data-testid]) {
                        display: none !important;
                      }
                      #pointer-survey-container div[style*='height: 1px'] {
                        display: none !important;
                      }
                    `;
                    document.head.appendChild(style);

                    // Fix placeholder color
                    input.style.setProperty(
                      "--placeholder-color",
                      placeholderColor,
                    );
                    input.setAttribute(
                      "style",
                      input.getAttribute("style") +
                        `; ::placeholder { color: ${placeholderColor} !important; }`,
                    );
                  });

                  // Style buttons
                  buttons.forEach((button) => {
                    const bgColor = isDarkMode
                      ? "oklch(0.7871 0.1187 304.7693)"
                      : "oklch(0.5547 0.2503 297.0156)";
                    const textColor = isDarkMode
                      ? "oklch(0.2429 0.0304 283.9110)"
                      : "oklch(1.0000 0 0)";
                    const hoverColor = isDarkMode
                      ? "oklch(0.6820 0.1448 235.3822)"
                      : "oklch(0.6820 0.1448 235.3822)";

                    button.style.cssText = `
                    background-color: ${bgColor} !important;
                    color: ${textColor} !important;
                    padding: 12px 24px !important;
                    border-radius: var(--radius, 0.35rem) !important;
                    border: none !important;
                    font-weight: 500 !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    margin-top: 0px !important;
                    margin-bottom: 12px !important;
                    font-family: var(--font-sans, Montserrat, sans-serif) !important;
                    display: block !important;
                    width: auto !important;
                  `;

                    // Don't clone buttons to preserve PostHog event handlers
                    button.addEventListener("mouseenter", () => {
                      button.style.backgroundColor = hoverColor + " !important";
                    });

                    button.addEventListener("mouseleave", () => {
                      button.style.backgroundColor = bgColor + " !important";
                    });
                  });

                  // Style questions without affecting functionality
                  questions.forEach((question) => {
                    const textColor = isDarkMode
                      ? "oklch(0.9500 0.0200 272.2767)"
                      : "oklch(0.4355 0.0430 279.3250)";

                    // Only add styles, don't replace cssText completely
                    question.style.fontSize = "14px";
                    question.style.fontWeight = "500";
                    question.style.color = textColor;
                    question.style.marginBottom = "8px";
                    question.style.marginTop = "0";
                    question.style.fontFamily =
                      "var(--font-sans, Montserrat, sans-serif)";
                  });

                  // Additional CSS for text visibility without breaking functionality
                  const additionalStyle = document.createElement("style");
                  const textColor = isDarkMode
                    ? "oklch(0.9500 0.0200 272.2767)"
                    : "oklch(0.4355 0.0430 279.3250)";
                  additionalStyle.textContent = `
                    #pointer-survey-container h1,
                    #pointer-survey-container h2,
                    #pointer-survey-container h3,
                    #pointer-survey-container h4,
                    #pointer-survey-container h5,
                    #pointer-survey-container h6,
                    #pointer-survey-container p,
                    #pointer-survey-container label,
                    #pointer-survey-container span:not([class*='icon']) {
                      color: ${textColor} !important;
                    }
                  `;
                  document.head.appendChild(additionalStyle);

                  // Style footer/branding to be below button
                  footers.forEach((footer) => {
                    const borderColor = isDarkMode
                      ? "oklch(0.3240 0.0319 281.9784)"
                      : "oklch(0.8083 0.0174 271.1982)";
                    const textColor = isDarkMode
                      ? "oklch(0.7510 0.0396 273.9320)"
                      : "oklch(0.5471 0.0343 279.0837)";

                    footer.style.cssText = `
                    margin-top: 8px !important;
                    padding-top: 8px !important;
                    border-top: 1px solid ${borderColor} !important;
                    font-size: 12px !important;
                    color: ${textColor} !important;
                    display: block !important;
                    text-align: left !important;
                    width: 100% !important;
                  `;
                  });

                  // Don't modify display properties to avoid breaking survey functionality

                  console.log("Applied JavaScript survey styles", {
                    isDarkMode,
                  });
                }
              };

              applySurveyStyles();

              // Re-apply styles after a short delay in case PostHog overwrites them
              setTimeout(applySurveyStyles, 500);

              // Watch for theme changes
              const observer = new MutationObserver(() => {
                applySurveyStyles();
              });
              observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class"],
              });
            }, 100);
          }
        }, 50);

        console.log("Survey display attempted successfully");
      } catch (error) {
        console.error("Error displaying survey:", error);
        if (container) {
          container.innerHTML =
            '<p class="text-sm text-red-500">Error loading survey. Please try again.</p>';
        }
      }
    };

    // Start checking after modal has time to render
    setTimeout(waitForPostHogAndDisplaySurvey, 100);
  };

  return (
    <Sidebar
      collapsible="none"
      className="border-r-0 flex flex-col h-screen w-full"
    >
      {/* Header */}
      <SidebarHeader className="h-16 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
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
                <h2 className="text-med font-serif text-slate-900 dark:text-slate-100">
                  pointer
                </h2>
                <p className="text-xs font-serif text-slate-500 dark:text-slate-400">
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

      <SidebarContent className="bg-white dark:bg-slate-900 flex-1 overflow-y-auto">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-medium">
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
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
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
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
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
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
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

                const noteButton = (
                  <SidebarMenuButton
                    onClick={() => handleNoteClick(note)}
                    data-active={isActive}
                    className={cn(
                      "rounded-lg transition-all w-full",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
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
                        className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-sm opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500/10 group-data-[collapsible=icon]:hidden"
                      >
                        <Trash className="h-3 w-3 text-slate-500 group-hover/item:text-red-500" />
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
            <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
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
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
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
            <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-medium">
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
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
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
                          className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-sm opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500/10 group-data-[collapsible=icon]:hidden"
                        >
                          <Trash className="h-3 w-3 text-slate-500 group-hover/item:text-red-500" />
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
      <SidebarFooter className="h-16 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 h-full w-full">
          {/* Expanded state */}
          <div className="group-data-[collapsible=icon]:hidden flex items-center w-full">
            <div className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
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
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer"
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
                className="h-6 w-6 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
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
                className="h-6 w-6 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                className="h-6 w-6 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer"
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
