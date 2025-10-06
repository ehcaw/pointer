"use client";

import { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import { FileText, Plus, Search, FileDown, Moon, Sun } from "lucide-react";
import { Node } from "@/types/note";
import { useTheme } from "@/providers/ThemeProvider";
import { Kbd } from "@/components/ui/kbd";

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
      // Prevent default arrow key behavior to let cmdk handle it
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  // Auto-focus input when menu opens
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="Search notes, commands..."]',
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen]);

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

  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setIsOpen(false);
  };

  const exportNotes = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = `pointer-notes-export-${new Date().toISOString().slice(0, 10)}.json`;

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
      className="fixed inset-0 z-50 animate-in fade-in-0"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="fixed left-1/2 top-1/3 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-lg border shadow-md bg-white dark:bg-gray-900"
          loop
        >
          <div className="flex items-center border-b px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search notes, commands..."
              className="flex h-8 w-full rounded-md bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[450px] overflow-y-auto p-2">
            <Command.Empty className="py-4 text-center text-[10px]">
              No results found.
            </Command.Empty>

            {filteredNotes.length > 0 && (
              <Command.Group heading="Notes" className="text-sm mb-2">
                {filteredNotes.map((note) => (
                  <Command.Item
                    key={note.pointer_id}
                    value={note.name || "Untitled"}
                    onSelect={() => handleSelectNote(note)}
                    className="flex items-center gap-2 px-2 py-2 text-xs rounded-sm cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">
                      {note.name || "Untitled"}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="text-sm space-y-1 mt-2">
              <Command.Item
                value="create-note"
                onSelect={handleCreateNote}
                className="flex items-center gap-2 px-2 py-2 text-xs rounded-sm cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Create new note</span>
              </Command.Item>

              <Command.Item
                value="toggle-theme"
                onSelect={toggleTheme}
                className="flex items-center gap-2 px-2 py-2 text-xs rounded-sm cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <Sun className="h-4 w-4 shrink-0 dark:hidden" />
                <Moon className="hidden h-4 w-4 shrink-0 dark:block" />
                <span>Toggle theme</span>
              </Command.Item>

              <Command.Item
                value="export-notes"
                onSelect={exportNotes}
                className="flex items-center gap-2 px-2 py-2 text-xs rounded-sm cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <FileDown className="h-4 w-4 shrink-0" />
                <span>Export notes</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-gray-900">
            <div className="px-1 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex gap-2">
                <div>
                  <Kbd>↕ </Kbd> Navigate
                </div>
                <div>
                  <Kbd>↲</Kbd> Select
                </div>
                <div>
                  <Kbd>⌘ + ⇧ + ↲ </Kbd> Assistant Search
                </div>
              </div>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
