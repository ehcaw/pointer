import { ConvexReactClient } from "convex/react";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Pure data fetching functions for use with SWR
export const dataFetchers = {
  // Fetch user notes
  fetchUserNotes: async () => {
    try {
      const notes = await convex.query(api.notes.readNotesFromDb);
      return notes;
    } catch (error) {
      throw new Error(`Failed to fetch user notes: ${error}`);
    }
  },
};
