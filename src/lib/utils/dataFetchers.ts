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
});

// Type for the data fetchers
export type DataFetchers = ReturnType<typeof createDataFetchers>;
