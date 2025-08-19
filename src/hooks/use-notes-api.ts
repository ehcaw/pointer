import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNotesStore } from "@/lib/notes-store";
import { Node, FileNode } from "@/types/note";
import { Id } from "../../convex/_generated/dataModel";

export function useNotesApi() {
  const convex = useConvex();
  const { setUserNotes, setIsLoading, markNoteAsUnsaved } = useNotesStore();

  const fetchAllNotes = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const notes = await convex.query(api.notes.readNotesFromDb, {
        user_id: tenantId,
      });
      setUserNotes(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNoteInDb = async (note: Node): Promise<Node> => {
    try {
      const { quibble_id, ...noteData } = note;
      const newNote: any = {
        quibble_id: quibble_id,
        name: noteData.name,
        tenantId: noteData.tenantId,
        content: (note as FileNode).content,
        parentId: noteData.parentId,
        path: noteData.path,
        createdAt: String(noteData.createdAt),
        updatedAt: String(noteData.updatedAt),
        lastAccessed: String(new Date()),
        lastEdited: String(noteData.lastEdited || new Date()),
      };
      await convex.mutation(api.notes.createNoteInDb, newNote);
      return note;
    } catch (error) {
      console.error("Error creating a note: ", error);
      throw error;
    }
  };

  const saveNote = async (note: Node): Promise<Node> => {
    try {
      if (note.quibble_id.toString().startsWith("temp-")) {
        // Create new note
        const { quibble_id, ...noteData } = note;
        const mutationData: any = {
          quibble_id: quibble_id,
          name: noteData.name,
          tenantId: noteData.tenantId,
          parentId: noteData.parentId,
          path: noteData.path,
          createdAt: String(noteData.createdAt),
          updatedAt: String(noteData.updatedAt),
          lastAccessed: String(new Date()),
          lastEdited: String(noteData.lastEdited || new Date()),
        };

        // Only add content if this is a FileNode
        if (note.type === "file") {
          mutationData.content = note.content;
        }

        await convex.mutation(api.notes.createNoteInDb, mutationData);
        return note; // Return the original note or fetch the saved version
      } else {
        // Update existing note
        const updateData: any = {
          quibble_id: note.quibble_id,
          name: note.name,
          lastEdited: String(new Date()),
        };

        if (note.type === "file") {
          updateData.content = note.content;
        }

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
