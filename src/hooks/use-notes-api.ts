import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNotesStore } from "@/lib/notes-store";
import { Node } from "@/types/note";

interface MutationType {
  quibble_id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  lastEdited: string;
  content: {
    tiptap?: Record<string, string> | undefined;
    text?: string | undefined;
  };
}

export function useNotesApi() {
  const convex = useConvex();
  const { setUserNotes, setIsLoading } = useNotesStore();

  const fetchAllNotes = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const notes: Node[] = await convex.query(api.notes.readNotesFromDb, {
        user_id: tenantId,
      });
      setUserNotes(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async (note: Node): Promise<Node> => {
    try {
      if (note.quibble_id.toString().startsWith("temp-")) {
        // Create new note
        const { quibble_id, ...noteData } = note;
        const mutationData: MutationType = {
          quibble_id: quibble_id,
          name: noteData.name,
          tenantId: noteData.tenantId!,
          createdAt: String(noteData.createdAt),
          updatedAt: String(noteData.updatedAt),
          lastAccessed: String(new Date()),
          lastEdited: String(noteData.lastEdited || new Date()),
          content: note.content,
        };

        await convex.mutation(api.notes.createNoteInDb, mutationData);
        return note; // Return the original note or fetch the saved version
      } else {
        // Update existing note
        const updateData: MutationType = {
          quibble_id: note.quibble_id,
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
      }
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
