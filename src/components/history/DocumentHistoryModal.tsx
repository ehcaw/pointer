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
  User,
  FileText,
  Loader2,
  FileJson,
  File,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Kbd } from "@/components/ui/kbd";
import { DocumentVersion } from "@/types/note";
import {
  Timeline,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  TimelineDescription,
  TimelineContent,
  TimelineIcon,
} from "@/components/ui/timeline";

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentHistoryModal({
  isOpen,
  onClose,
}: DocumentHistoryModalProps) {
  const { currentNote } = useNotesStore();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const versions: DocumentVersion[] = (
    useQuery(api.noteVersions.getNoteVersions, {
      note_id: currentNote && currentNote._id ? currentNote._id : "",
    }) || []
  ).sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

  // Close on escape - only add listener when open
  useEffect(() => {
    if (!isOpen) return;

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

  const handleSelectVersion = (versionId: string) => {
    setSelectedVersion(versionId);
  };

  const handleRestoreVersion = (versionId: string) => {
    // TODO: Implement restore functionality
    console.log("Restore version:", versionId);
  };

  // Only render when open to prevent unnecessary renders
  if (!isOpen) return null;

  const selectedVersionData = versions.find((v) => v._id === selectedVersion);

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in-0" onClick={onClose}>
      <div
        className="fixed left-1/2 top-1/2 w-[90vw] h-[85vh] max-w-7xl -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg border shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full">
          {/* Timeline - Version List */}
          <div className="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Timeline Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h2 className="text-lg font-semibold">Document History</h2>
              </div>
            </div>

            {/* Version Timeline */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No version history available</p>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-[320px]">
                    {versions.map((version, index) => (
                      <TimelineItem
                        key={version._id}
                        onClick={() => handleSelectVersion(version._id)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedVersion === version._id && "bg-accent/50 rounded-lg p-2 -m-2"
                        )}
                        date={new Date(version.timestamp).toISOString()}
                        title={
                          index === 0
                            ? "Current version"
                            : `Version ${versions.length - index}`
                        }
                        description={formatDistanceToNow(new Date(version.timestamp), {
                          addSuffix: true,
                        })}
                        icon={
                          index === 0 ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <FileJson className="h-4 w-4" />
                          )
                        }
                        iconColor={index === 0 ? "primary" : "muted"}
                        status={index === 0 ? "completed" : "pending"}
                        showConnector={index !== versions.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-2 text-xs text-muted-foreground">
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

          {/* Main Content - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Preview Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
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
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(
                              selectedVersionData.timestamp,
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="prose dark:prose-invert max-w-none">
                          <h4 className="text-lg font-medium mb-4">
                            Content Preview
                          </h4>
                          {/* TODO: Add actual content preview rendering */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                            <pre className="whitespace-pre-wrap">
                              {selectedVersionData.content?.tiptap ||
                                "No content available"}
                            </pre>
                          </div>
                        </div>

                        {/* Restore Button */}
                        {versions.indexOf(selectedVersionData) !== 0 && (
                          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() =>
                                handleRestoreVersion(selectedVersionData._id)
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restore this version
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
