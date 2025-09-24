"use client";

import { useState, useEffect } from "react";
import { CommandMenu } from "@/components/ui/command-menu";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Node } from "@/types/note";

export function CommandMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { userNotes, setCurrentNote, setCurrentView } = useNotesStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelectNote = (note: Node) => {
    setCurrentNote(note);
    setCurrentView("note");
  };

  const handleCreateNote = () => {
    // You can implement note creation here or pass it as a prop
    setCurrentView("note");
  };

  return (
    <>
      {children}
      <CommandMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        notes={userNotes}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
      />
    </>
  );
}
