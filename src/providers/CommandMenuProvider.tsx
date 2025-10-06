"use client";

import { useState } from "react";
import { CommandMenu } from "@/components/ui/command-menu";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Node } from "@/types/note";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { useHotkeys } from "react-hotkeys-hook";

export function CommandMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { userNotes, setCurrentNote } = useNotesStore();
  const { setCurrentView } = usePreferencesStore();

  useHotkeys("mod+k, ctrl+k", (e) => {
    e.preventDefault();
    setIsOpen((open) => !open);
  });

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
