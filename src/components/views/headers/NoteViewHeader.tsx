// Header for note view
import { useState, useEffect, useRef } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CollaborationModal from "./CollaborationModal";

import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { FileText, Home, Clock, Share2, Loader2 } from "lucide-react";

import { useNotesStore } from "@/lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { useSaveCoordinator } from "@/hooks/use-save-coordinator";
import {
  customInfoToast,
  customSuccessToast,
  customErrorToast,
} from "@/components/ui/custom-toast";
import { useDocumentHistory } from "@/providers/DocumentHistoryProvider";

export default function NoteViewHeader() {
  const [title, setTitle] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] =
    useState(false);

  const { unsavedNotes } = useNotesStore();
  const { currentNote } = useNoteEditor();
  const { saveTitle, getSaveStatus } = useSaveCoordinator();
  const { openHistory } = useDocumentHistory();
  const hasUnsavedChanges = Array.from(unsavedNotes.values()).length > 0;

  const debouncedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 800; // 800ms for title changes

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (!currentNote) return;

    // Clear existing timeout
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
    }

    // Set new debounced save
    debouncedSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveTitle(currentNote.pointer_id, newTitle);
      } catch (error) {
        console.error("Failed to save title:", error);
        customErrorToast("Failed to save title");
      }
    }, DEBOUNCE_DELAY);
  };

  const handleTitleBlur = async () => {
    setIsTitleFocused(false);

    // Immediate save on blur to ensure title is saved
    if (currentNote && title !== currentNote.name) {
      try {
        await saveTitle(currentNote.pointer_id, title);
      } catch (error) {
        console.error("Failed to save title on blur:", error);
        customErrorToast("Failed to save title");
      }
    }
  };

  const handleShareNote = async () => {
    if (!currentNote) return;
    if (typeof window === "undefined") return;

    const previewUrl = `${window.location.origin}/preview/${currentNote.pointer_id}`;

    try {
      await navigator.clipboard.writeText(previewUrl);
      customSuccessToast("Preview link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback: open the preview in a new tab
      window.open(previewUrl, "_blank");
      customInfoToast("Preview opened in new tab");
    }
  };

  // Update title when currentNote changes
  useEffect(() => {
    setTitle(currentNote?.name || "Untitled Note");
  }, [currentNote]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }
    };
  }, []);

  // Get save status for the current note
  const saveStatus = currentNote ? getSaveStatus(currentNote.pointer_id) : null;
  const isCurrentlySaving = saveStatus?.isSaving || false;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-3 w-3" />
              workspace
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block text-muted-foreground" />
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-3 w-3" />
              notes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block text-muted-foreground" />
          <BreadcrumbItem>
            <div className="relative group">
              <div className="relative">
                <Input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={handleTitleBlur}
                  placeholder="Untitled Note"
                  className={cn(
                    "text-lg font-semibold bg-transparent border-0 shadow-none px-3 py-2 h-auto rounded-md pr-10",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus-visible:ring-0 transition-all duration-200",
                    "min-w-[200px] max-w-[400px]",
                    isTitleFocused
                      ? "bg-card shadow-sm ring-2 ring-primary/20 border border-primary/30"
                      : "hover:bg-accent border border-transparent",
                    isCurrentlySaving && "text-muted-foreground",
                  )}
                />
                {/* Save indicator */}
                {isCurrentlySaving && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Visual indicator for editable state */}
              <div
                className={cn(
                  "absolute inset-0 rounded-md border-2 border-dashed transition-opacity duration-200 pointer-events-none",
                  isTitleFocused
                    ? "opacity-0"
                    : "opacity-0 group-hover:opacity-30 border-border",
                )}
              />
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Status indicators */}
      <div className="ml-auto flex items-center gap-2">
        {hasUnsavedChanges && (
          <Badge
            variant="secondary"
            className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
          >
            <Clock className="h-3 w-3 mr-1" />
            Unsaved changes
          </Badge>
        )}

        {currentNote && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={openHistory}
              title="View document history"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleShareNote}
              title="Share preview link"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <CollaborationModal
              isOpen={isCollaborationModalOpen}
              onOpenChange={setIsCollaborationModalOpen}
            />
          </div>
        )}

        <UserButton />
      </div>
    </header>
  );
}
