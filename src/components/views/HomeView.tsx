"use client";

import * as React from "react";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  TrendingUp,
  Zap,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// UI Components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Store
import { useNotesStore } from "@/lib/notes-store";
import { FileNode, type Node } from "@/types/note";
import { useNoteEditor } from "@/hooks/use-note-editor";

export function HomeView() {
  const { userNotes, setCurrentNote, setCurrentView } = useNotesStore();

  const { createEmptyNote } = useNoteEditor();
  const [query, setQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Get filtered notes for search
  const searchResults = React.useMemo(() => {
    if (query.trim() === "") return [];

    const lowerQuery = query.toLowerCase();
    return userNotes.filter((note) => {
      const fileNote = note as FileNode;
      return (
        fileNote?.name?.toLowerCase().includes(lowerQuery) ||
        (typeof fileNote?.content?.text === "string" &&
          fileNote.content.text.toLowerCase().includes(lowerQuery))
      );
    });
  }, [query, userNotes]);

  // Organize notes by time periods
  const organizedNotes = React.useMemo(() => {
    const today: Node[] = [];
    const yesterday: Node[] = [];
    const thisWeek: Node[] = [];
    const older: Node[] = [];

    const sortedNotes = [...userNotes].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    sortedNotes.forEach((note) => {
      const noteDate = new Date(note.updatedAt);

      if (isToday(noteDate)) {
        today.push(note);
      } else if (isYesterday(noteDate)) {
        yesterday.push(note);
      } else if (Date.now() - noteDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
        thisWeek.push(note);
      } else {
        older.push(note);
      }
    });

    return { today, yesterday, thisWeek, older };
  }, [userNotes]);

  const stats = React.useMemo(
    () => ({
      total: userNotes.length,
      todayCount: organizedNotes.today.length,
      recentlyModified: userNotes.filter(
        (note) =>
          Date.now() - new Date(note.updatedAt).getTime() < 24 * 60 * 60 * 1000,
      ).length,
    }),
    [userNotes, organizedNotes],
  );

  const handleCreateNote = async () => {
    createEmptyNote("Untitled Note");
    setCurrentView("note");
  };

  const handleOpenNote = (note: Node) => {
    setCurrentNote(note);
    setCurrentView("note");
  };

  const isSearching = query.trim() !== "";

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

        <div className="relative px-6 py-12">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Welcome back to pointer
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
                Your ideas, beautifully organized
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                Capture, organize, and develop your thoughts with no B.S.
              </p>

              {/* Quick Stats */}
              <div className="flex justify-center items-center gap-8 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{stats.total} notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{stats.recentlyModified} recently modified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{stats.todayCount} created today</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search your notes..."
                  className="pl-12 pr-4 py-4 text-base bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:shadow-md transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Actions */}
            {!isSearching && (
              <div className="flex justify-center gap-4 mb-12">
                <Button
                  onClick={handleCreateNote}
                  size="lg"
                  className="rounded-xl px-8 py-3 bg-primary hover:bg-primary/90 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Note
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 py-3 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-all"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Browse All
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="px-6 pb-12">
        <div className="mx-auto max-w-6xl">
          {isSearching ? (
            <SearchResults
              results={searchResults}
              query={query}
              onOpenNote={handleOpenNote}
            />
          ) : (
            <NotesTimeline
              organizedNotes={organizedNotes}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onOpenNote={handleOpenNote}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResults({
  results,
  query,
  onOpenNote,
}: {
  results: Node[];
  query: string;
  onOpenNote: (note: Node) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Search Results
        </h2>
        <Badge variant="secondary" className="px-3 py-1">
          {results.length} results
        </Badge>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((note) => (
            <SearchResultCard
              key={note.pointer_id}
              note={note}
              query={query}
              onOpen={() => onOpenNote(note)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Search className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No results found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Try adjusting your search terms or create a new note
          </p>
        </div>
      )}
    </div>
  );
}

function NotesTimeline({
  organizedNotes,
  viewMode,
  setViewMode,
  onOpenNote,
}: {
  organizedNotes: {
    today: Node[];
    yesterday: Node[];
    thisWeek: Node[];
    older: Node[];
  };
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  onOpenNote: (note: Node) => void;
}) {
  const sections = [
    {
      title: "Today",
      notes: organizedNotes.today,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Yesterday",
      notes: organizedNotes.yesterday,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "This Week",
      notes: organizedNotes.thisWeek,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Older",
      notes: organizedNotes.older,
      color: "text-slate-600 dark:text-slate-400",
    },
  ];

  const hasAnyNotes = sections.some((section) => section.notes.length > 0);

  return (
    <div className="space-y-8">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Your Notes
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-lg"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-lg"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasAnyNotes ? (
        sections.map((section) => {
          if (section.notes.length === 0) return null;

          return (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={cn("text-lg font-medium", section.color)}>
                  {section.title}
                </h3>
                <Badge variant="outline" className="px-2 py-1">
                  {section.notes.length}
                </Badge>
              </div>

              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-3",
                )}
              >
                {section.notes.map((note) => (
                  <NoteCard
                    key={note.pointer_id}
                    note={note}
                    viewMode={viewMode}
                    onOpen={() => onOpenNote(note)}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function NoteCard({
  note,
  viewMode,
  onOpen,
}: {
  note: Node;
  viewMode: "grid" | "list";
  onOpen: () => void;
}) {
  const fileNote = note as FileNode;
  const preview = React.useMemo(() => {
    if (typeof fileNote.content?.text === "string") {
      return fileNote.content.text.slice(0, 120);
    }
    return "";
  }, [fileNote]);

  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), {
    addSuffix: true,
  });

  if (viewMode === "list") {
    return (
      <Card
        className="p-4 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        onClick={onOpen}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {note.name || "Untitled"}
              </h4>
            </div>
            {preview && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                {preview}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-slate-500">{timeAgo}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group p-6 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
      onClick={onOpen}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                {note.name || "Untitled"}
              </h4>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>

        {preview && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {preview}
          </p>
        )}
      </div>
    </Card>
  );
}

function SearchResultCard({
  note,
  query,
  onOpen,
}: {
  note: Node;
  query: string;
  onOpen: () => void;
}) {
  const fileNote = note as FileNode;
  const highlightedContent = React.useMemo(() => {
    const text = fileNote.content?.text || "";
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (!lowerText.includes(lowerQuery)) return text.slice(0, 120);

    const matchIndex = lowerText.indexOf(lowerQuery);
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(text.length, matchIndex + query.length + 100);

    return (
      (start > 0 ? "..." : "") +
      text.slice(start, end) +
      (end < text.length ? "..." : "")
    );
  }, [query, fileNote]);

  return (
    <Card
      className="p-6 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl group"
      onClick={onOpen}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                {note.name || "Untitled"}
              </h4>
              <p className="text-sm text-slate-500">
                {format(new Date(note.updatedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>

        {highlightedContent && (
          <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {highlightedContent
              .split(new RegExp(`(${query})`, "i"))
              .map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                  <span
                    key={i}
                    className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded"
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
          </div>
        )}
      </div>
    </Card>
  );
}

function EmptyState() {
  const { createEmptyNote } = useNoteEditor();
  const { setCurrentView } = useNotesStore();

  const handleCreateNote = () => {
    createEmptyNote("My First Note");
    setCurrentView("note");
  };

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-8">
        <FileText className="h-16 w-16 text-primary" />
      </div>

      <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Ready to start writing?
      </h3>

      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
        Create your first note and begin capturing your ideas, thoughts, and
        inspirations.
      </p>

      <Button
        onClick={handleCreateNote}
        size="lg"
        className="rounded-xl px-8 py-3 bg-primary hover:bg-primary/90 font-medium shadow-lg hover:shadow-xl transition-all"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create Your First Note
      </Button>
    </div>
  );
}
