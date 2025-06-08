"use client";

import * as React from "react";
import { Search, Sparkles, Clock, File, Folder } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Store
import { useNotesStore } from "@/lib/notes-store";
import { Node } from "@/types/note";

export function HomeView() {
  const { unsavedNotes, userNotes, currentView, setCurrentView } =
    useNotesStore();
  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Node[]>([]);
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [aiResponse, setAiResponse] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Get filtered notes for search
  React.useEffect(() => {
    if (query.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();

    // Simple fuzzy search
    const results = userNotes.filter(
      (note) =>
        note.name.toLowerCase().includes(lowerQuery) ||
        (typeof note.content === "string" &&
          note.content.toLowerCase().includes(lowerQuery)),
    );

    setSearchResults(results);
  }, [query, userNotes]);

  // AI chat query handler
  const handleAiQuery = () => {
    setAiDialogOpen(true);
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      setAiResponse(
        `Based on your notes, here's what I found related to "${query}":\n\n1. You have 3 notes that mention this topic\n2. The most recent mention was in "Meeting Notes" from yesterday\n3. There seems to be a connection with your project timeline`,
      );
      setIsLoading(false);
    }, 1500);
  };

  const recentNotes = React.useMemo(() => {
    // Sort by most recently updated
    return [...unsavedNotes.values()]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 6);
  }, [unsavedNotes]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <div className="p-6 pb-4 border-b">
        <h1 className="text-2xl font-semibold mb-6">Welcome to Quibble</h1>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search notes or ask AI about your notes..."
            className="pl-10 pr-24 py-6 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() !== "" && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAiQuery}
                className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Search results when searching */}
            {isSearching ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Search Results</h2>
                  <Badge variant="outline">
                    {searchResults.length} results
                  </Badge>
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((note) => (
                      <SearchResultCard
                        key={note._id.toString()}
                        note={note}
                        query={query}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No notes found matching "{query}"
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleAiQuery}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ask AI Instead
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Recently edited notes */}
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-medium">Recently Edited</h2>
                  </div>

                  {recentNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentNotes.map((note) => (
                        <RecentNoteCard key={note._id.toString()} note={note} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-muted-foreground">
                        No recently edited notes
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick start section */}
                <div className="bg-muted/40 rounded-lg p-6 max-w-2xl mx-auto text-center">
                  <h3 className="text-lg font-medium mb-2">Quick Start</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a new note or use the search bar to find existing
                    notes
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => setCurrentView("note")}>
                      Create New Note
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* AI Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>AI Assistant</DialogTitle>
            <DialogDescription>
              Results based on your notes and query: "{query}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <Sparkles className="h-8 w-8 text-primary mb-2" />
                  <p>Analyzing your notes...</p>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                {aiResponse}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Close
            </Button>
            <Button disabled={isLoading}>Open Related Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecentNoteCard({ note }: { note: Node }) {
  const isFolder = note.type === "folder";
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), {
    addSuffix: true,
  });

  // Get content preview for files
  const previewText = React.useMemo(() => {
    if (isFolder) return "";

    if (typeof note.content === "string") {
      return note.content.slice(0, 120);
    }

    if (typeof note.content === "object") {
      try {
        return JSON.stringify(note.content).slice(0, 120);
      } catch (e) {
        return "";
      }
    }

    return "";
  }, [note, isFolder]);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer">
      <CardHeader className="p-4 pb-3 flex flex-row items-start gap-2">
        {isFolder ? (
          <Folder className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        ) : (
          <File className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        )}
        <div className="space-y-1">
          <CardTitle className="text-base font-medium leading-none">
            {note.name || "Untitled"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>

      {!isFolder && previewText && (
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {previewText}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function SearchResultCard({ note, query }: { note: Node; query: string }) {
  const isFolder = note.type === "folder";

  // Function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!text) return "";

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (!lowerText.includes(lowerQuery)) {
      return text.slice(0, 150) + (text.length > 150 ? "..." : "");
    }

    // Find position of match
    const matchIndex = lowerText.indexOf(lowerQuery);

    // Get snippet around match
    let start = Math.max(0, matchIndex - 50);
    let end = Math.min(text.length, matchIndex + query.length + 50);

    // Add ellipsis for context
    const prefix = start > 0 ? "..." : "";
    const suffix = end < text.length ? "..." : "";

    return prefix + text.slice(start, end) + suffix;
  };

  // Get content preview with query highlight
  const contentPreview = React.useMemo(() => {
    if (isFolder) return "";

    if (typeof note.content === "string") {
      return highlightText(note.content, query);
    }

    if (typeof note.content === "object") {
      try {
        return highlightText(JSON.stringify(note.content), query);
      } catch (e) {
        return "";
      }
    }

    return "";
  }, [note, query, isFolder]);

  const updatedDate = format(new Date(note.updatedAt), "MMM d, yyyy");

  return (
    <Card className="overflow-hidden hover:border-primary transition-all cursor-pointer">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-2">
          {isFolder ? (
            <Folder className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <CardTitle className="text-base font-medium">
              {note.name || "Untitled"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{updatedDate}</p>
          </div>
        </div>
      </CardHeader>

      {!isFolder && contentPreview && (
        <>
          <Separator />
          <CardContent className="p-4 pt-2">
            <p className="text-sm">
              {contentPreview
                .split(new RegExp(`(${query})`, "i"))
                .map((part, i) =>
                  part.toLowerCase() === query.toLowerCase() ? (
                    <span
                      key={i}
                      className="bg-yellow-100 dark:bg-yellow-900/40"
                    >
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
            </p>
          </CardContent>
        </>
      )}
    </Card>
  );
}
