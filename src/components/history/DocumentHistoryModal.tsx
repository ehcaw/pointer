"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  RotateCcw,
  X,
  Calendar,
  FileText,
  Loader2,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Kbd } from "@/components/ui/kbd";
import { DocumentVersion } from "@/types/note";
import { Id } from "../../../convex/_generated/dataModel";
import { PreviewEditor } from "@/components/preview/PreviewEditor";
import { FileNode, isFile } from "@/types/note";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useSaveCoordinator } from "@/hooks/use-save-coordinator";
import { ensureJSONString } from "@/lib/utils";

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentHistoryModal({
  isOpen,
  onClose,
}: DocumentHistoryModalProps) {
  const { currentNote } = useNotesStore();
  const { updateEditorContent } = useEditorStore();
  const { saveContent } = useSaveCoordinator();
  const [selectedVersion, setSelectedVersion] =
    useState<Id<"notesHistoryMetadata"> | null>(null);
  const [loadingVersions, setLoadingVersions] = useState<Set<string>>(
    new Set(),
  );
  const [isRestoring, setIsRestoring] = useState(false);
  // Capture the note ID when modal opens to prevent query from skipping when currentNote changes
  const [stableNoteId, setStableNoteId] = useState<string | null>(null);

  // Update stable note ID when modal opens with a valid note - never clear it to prevent query from skipping
  // Only depends on isOpen to prevent re-setting when currentNote updates during save
  useEffect(() => {
    if (isOpen && currentNote && isFile(currentNote)) {
      let noteId = currentNote._id;

      // If _id is undefined, try to find the note in userNotes by pointer_id
      if (!noteId) {
        const { userNotes } = useNotesStore.getState();
        const foundNote = userNotes.find(
          (n) => n.pointer_id === currentNote.pointer_id,
        );
        noteId = foundNote?._id;
      }

      if (noteId) {
        setStableNoteId(noteId);
      } else {
        console.error(
          "❌ Could not find note _id! Cannot set stableNoteId",
          currentNote,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const versionsQuery = useQuery(
    api.noteVersions.getNoteVersions,
    stableNoteId ? { note_id: stableNoteId } : "skip",
  );

  const versions: DocumentVersion[] = (versionsQuery || []).sort((a, b) =>
    a.timestamp > b.timestamp ? -1 : 1,
  );
  // Get current version content (initial content)
  const currentVersionContent = (currentNote as FileNode)
    ? (currentNote as FileNode).content?.tiptap
    : null;

  // Track loading state for versions
  useEffect(() => {
    if (selectedVersion) {
      setLoadingVersions((prev) => new Set(prev).add(selectedVersion));
    }
  }, [selectedVersion]);

  // Fetch content for the selected version - let React Query handle caching
  const fetchedContent = useQuery(
    api.noteVersions.getNoteContentVersion,
    selectedVersion ? { metadata_id: selectedVersion } : "skip",
  );

  // Update loading state when content is fetched or errors
  useEffect(() => {
    if (selectedVersion) {
      setLoadingVersions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedVersion);
        return newSet;
      });
    }
  }, [fetchedContent, selectedVersion]);

  // Get the current content to display
  const getDisplayContent = () => {
    if (!selectedVersion) return null;
    if (selectedVersion === versions[0]?._id) {
      // This is the current version - use current content
      return currentVersionContent;
    }
    // Use fetched content if available
    return fetchedContent?.content?.tiptap || null;
  };

  // Close on escape - only add listener when open
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setLoadingVersions(new Set());
      setSelectedVersion(null);
      return;
    }

    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Prevent default arrow key behavior to let us handle it
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  const handleSelectVersion = (versionId: Id<"notesHistoryMetadata">) => {
    setSelectedVersion(versionId);
  };

  const handleRestoreVersion = async (
    versionId: Id<"notesHistoryMetadata">,
  ) => {
    const versionToRestore = versions.find((v) => v._id === versionId);
    if (!versionToRestore) {
      console.error("❌ Version not found:", versionId);
      return;
    }

    setIsRestoring(true);

    try {
      let contentToRestore: Record<string, unknown> | null = null;

      if (versionId === versions[0]?._id) {
        // This is the current version - use current content
        contentToRestore =
          currentVersionContent && typeof currentVersionContent === "string"
            ? JSON.parse(currentVersionContent)
            : currentVersionContent;
      } else {
        // For historical versions, we need to fetch the content if not already loaded
        const versionContent = fetchedContent?.content?.tiptap;
        if (!versionContent) {
          console.error("Version content not loaded");
          return;
        }

        // Parse the content if it's a string, otherwise use as-is
        if (typeof versionContent === "string") {
          try {
            contentToRestore = JSON.parse(versionContent);
          } catch (error) {
            console.error("Error parsing restore content:", error);
            return;
          }
        } else {
          contentToRestore = versionContent;
        }
      }

      if (!contentToRestore) {
        console.error("No valid content to restore");
        return;
      }

      // Update the editor content through the global editor store
      updateEditorContent(contentToRestore);

      // Save the restored content to database
      if (currentNote && isFile(currentNote)) {
        const restoredContent = {
          tiptap: ensureJSONString(contentToRestore),
          text:
            (isFile(currentNote) ? currentNote.content?.text : undefined) || "",
        };

        // Save to database using the save coordinator
        // Note: saveContent will handle marking the note as unsaved and updating the store
        await saveContent(currentNote.pointer_id, restoredContent);
      }

      // Close the modal after successful restore
      setTimeout(() => {
        onClose();
      }, 200);
    } finally {
      setIsRestoring(false);
    }
  };

  // Only render when open to prevent unnecessary renders
  if (!isOpen) return null;

  const selectedVersionData = versions.find((v) => v._id === selectedVersion);

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in-0" onClick={onClose}>
      <div
        className="fixed left-1/2 top-1/3 w-full max-w-6xl -translate-x-1/2 -translate-y-1/3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-[80vh] rounded-lg border shadow-md bg-white dark:bg-gray-900 overflow-hidden">
          {/* Timeline - Version List */}
          <div className="w-96 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Timeline Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 p-4">
              <h2 className="text-lg font-semibold">
                {currentNote?.name}&apos;s history
              </h2>
            </div>

            {/* Version Timeline */}
            <div className="flex-1 overflow-y-auto p-3">
              {versionsQuery === undefined ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                  <p className="text-sm">Loading version history...</p>
                </div>
              ) : versionsQuery === null ? (
                <div className="text-center py-8 text-red-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    Failed to load version history
                  </p>
                  <p className="text-xs mt-1">Please try again</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No version history available</p>
                </div>
              ) : (
                <div className="space-y-1 max-w-[320px] mx-auto">
                  {versions.map((version, index) => (
                    <div
                      key={version._id}
                      onClick={() => handleSelectVersion(version._id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-sm rounded-sm cursor-pointer",
                        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                        "hover:bg-accent/50",
                        selectedVersion === version._id &&
                          "bg-accent text-accent-foreground rounded-lg",
                      )}
                      data-selected={selectedVersion === version._id}
                    >
                      <div className="flex-shrink-0">
                        {index === 0 ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileJson className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {index === 0
                            ? "Latest Version"
                            : `Version ${versions.length - index}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.timestamp), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-gray-900">
              <div className="px-1 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex gap-2">
                  <div>
                    <Kbd>↑↓</Kbd> Navigate
                  </div>
                  <div>
                    <Kbd>↲</Kbd> Select
                  </div>
                  <div>
                    <Kbd>Esc</Kbd> Close
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden">
              {selectedVersionData ? (
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="max-w-none">
                      {/* Version Info */}
                      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(
                              selectedVersionData.timestamp,
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="max-w-none">
                          <h4 className="text-lg font-medium mb-4">
                            Content Preview
                          </h4>
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                            {(() => {
                              const displayContent = getDisplayContent();
                              const isLoading =
                                selectedVersion &&
                                loadingVersions.has(selectedVersion) &&
                                !fetchedContent;
                              const hasError =
                                selectedVersion && fetchedContent === null;

                              if (isLoading) {
                                return (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Loading content...
                                  </div>
                                );
                              }

                              if (hasError) {
                                return (
                                  <div className="flex items-center justify-center py-8 text-red-500">
                                    <div className="text-center">
                                      <p className="text-sm font-medium">
                                        Failed to load version content
                                      </p>
                                      <p className="text-xs mt-1">
                                        Please try selecting this version again
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <PreviewEditor
                                  content={
                                    displayContent
                                      ? (() => {
                                          try {
                                            return typeof displayContent ===
                                              "string"
                                              ? JSON.parse(displayContent)
                                              : displayContent;
                                          } catch (error) {
                                            console.error(
                                              "Error parsing content:",
                                              error,
                                            );
                                            return null;
                                          }
                                        })()
                                      : null
                                  }
                                  className="border-none"
                                />
                              );
                            })()}
                          </div>
                        </div>

                        {/* Restore Button */}
                        {versions.indexOf(selectedVersionData) !== 0 && (
                          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() =>
                                handleRestoreVersion(selectedVersionData._id)
                              }
                              disabled={isRestoring}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                              {isRestoring ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              {isRestoring
                                ? "Restoring..."
                                : "Restore this version"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-1">
                      No version selected
                    </p>
                    <p className="text-sm">
                      Select a version from the sidebar to preview its content
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
