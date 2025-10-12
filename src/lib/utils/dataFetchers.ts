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
      return notes;
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
      return sharedNotes;
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
