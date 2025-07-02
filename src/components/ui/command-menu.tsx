"use client";

import { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import {
  FileText,
  Plus,
  Search,
  FileDown,
  FileUp,
  Moon,
  Sun,
  FolderIcon,
} from "lucide-react";
import { Node, FileNode } from "@/types/note";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  notes: Node[];
  onSelectNote: (note: Node) => void;
  onCreateNote: () => void;
}

export function CommandMenu({
  isOpen,
  setIsOpen,
  notes,
  onSelectNote,
  onCreateNote,
}: CommandMenuProps) {
  const [search, setSearch] = useState("");

  // Close on escape - only add listener when open
  useEffect(() => {
    if (!isOpen) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  // Memoize filtered notes to prevent unnecessary re-renders
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    return notes.filter((note) =>
      note.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [notes, search]);

  const handleSelectNote = (note: Node) => {
    onSelectNote(note);
    setIsOpen(false);
    setSearch(""); // Reset search
  };

  const handleCreateNote = () => {
    onCreateNote();
    setIsOpen(false);
    setSearch(""); // Reset search
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");

    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setIsOpen(false);
  };

  const exportNotes = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = `quibble-notes-export-${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
    setIsOpen(false);
  };

  // Only render when open to prevent unnecessary renders
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="fixed left-1/2 top-1/3 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-lg border shadow-md" loop>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search notes, commands..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm">
              No results found.
            </Command.Empty>

            {filteredNotes.length > 0 && (
              <Command.Group heading="Notes">
                {filteredNotes.map((note) => (
                  <Command.Item
                    key={note.quibble_id}
                    value={`note-${note.quibble_id}`}
                    onSelect={() => handleSelectNote(note)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm"
                  >
                    {note.type === "file" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <FolderIcon className="h-4 w-4" />
                    )}
                    <span className="truncate">{note.name || "Untitled"}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions">
              <Command.Item
                value="create-note"
                onSelect={handleCreateNote}
                className="flex items-center gap-2 px-2 py-1.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create new note</span>
              </Command.Item>

              <Command.Item
                value="toggle-theme"
                onSelect={toggleTheme}
                className="flex items-center gap-2 px-2 py-1.5 text-sm"
              >
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="hidden h-4 w-4 dark:block" />
                <span>Toggle theme</span>
              </Command.Item>

              <Command.Item
                value="export-notes"
                onSelect={exportNotes}
                className="flex items-center gap-2 px-2 py-1.5 text-sm"
              >
                <FileDown className="h-4 w-4" />
                <span>Export notes</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
