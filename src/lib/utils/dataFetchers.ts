import { ConvexReactClient } from "convex/react";

// Factory function to create data fetchers with authenticated Convex client
export const createDataFetchers = (convex: ConvexReactClient) => ({
  // Fetch user notes using the authenticated convex client
  fetchUserNotes: async (userId: string) => {
    try {
      const { api } = await import("../../../convex/_generated/api");
      const notes = await convex.query(api.notes.readNotesFromDbByUserId, {
        userId,
      });
      // Transform data to ensure type field is required with default value
      return notes.map((note) => ({
        ...note,
        type: note.type || ("file" as const), // Default to "file" if type is undefined
      }));
    } catch (error) {
      throw new Error(`Failed to fetch user notes: ${error}`);
    }
  },
  fetchSharedNotes: async (userId: string) => {
    try {
      const { api } = await import("../../../convex/_generated/api");
      const sharedNotes = await convex.query(
        api.notes.getSharedDocumentsByUserId,
        {
          userId,
        },
      );
      // Transform data to ensure type field is required with default value
      return sharedNotes.map((note) => ({
        ...note,
        type: note.type || ("file" as const), // Default to "file" if type is undefined
      }));
    } catch (error) {
      throw new Error(`Failed to fetch shared notes: ${error}`);
    }
  },

  fetchSharedUsers: async (documentId: string) => {
    try {
      const { api } = await import("../../../convex/_generated/api");
      const collaborators = await convex.query(
        api.shared.getCollaboratorsByDocId,
        {
          docId: documentId,
        },
      );
      return collaborators;
    } catch (error) {
      throw new Error(`Failed to fetch user notes: ${error}`);
    }
  },

  fetchNoteById: async (noteId: string) => {
    try {
      const { api } = await import("../../../convex/_generated/api");
      const note = await convex.query(api.notes.readNoteFromDb, {
        pointer_id: noteId,
      });
      return note;
    } catch (error) {
      throw new Error(`Failed to fetch note: ${error}`);
    }
  },

  fetchNoteContentById: async (noteId: string) => {
    try {
      const { api } = await import("../../../convex/_generated/api");
      const noteContent = await convex.query(
        api.notesContent.getNoteContentById,
        { noteId },
      );
      return JSON.stringify(noteContent);
    } catch (error) {
      throw new Error(`Failed to fetch note content: ${error}`);
    }
  },
});

// Type for the data fetchers
export type DataFetchers = ReturnType<typeof createDataFetchers>;
