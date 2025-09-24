import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Node } from "@/types/note";

interface MutationType {
  pointer_id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  lastEdited: string;
  content: {
    tiptap?: string;
    text?: string | undefined;
  };
}

export function useNotesApi() {
  const convex = useConvex();
  const { setUserNotes, setIsLoading } = useNotesStore();

  const fetchAllNotes = async () => {
    setIsLoading(true);
    try {
      const notes: Node[] = await convex.query(api.notes.readNotesFromDb, {});
      setUserNotes(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async (note: Node): Promise<Node> => {
    try {
      console.log(note.content);
      // Update existing note
      const updateData: MutationType = {
        pointer_id: note.pointer_id,
        name: note.name,
        tenantId: note.tenantId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        lastAccessed: String(note.lastAccessed),
        lastEdited: String(new Date()),
        content: note.content,
      };
      await convex.mutation(api.notes.updateNoteInDb, updateData);
      return note;
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  };

  return {
    fetchAllNotes,
    saveNote,
  };
}
