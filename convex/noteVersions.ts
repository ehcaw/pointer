import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const getNoteVersions = query({
  args: { note_id: v.string() },
  handler: async (ctx, { note_id }) => {
    const noteId = ctx.db.normalizeId("notes", note_id);
    if (!noteId) {
      return [];
    }
    const versions = await ctx.db
      .query("notesHistoryMetadata")
      .withIndex("by_note_id", (q) => q.eq("noteId", noteId))
      .collect();

    return versions;
  },
});

export const getNoteContentVersion = query({
  args: { metadata_id: v.id("notesHistoryMetadata") },
  handler: async (ctx, { metadata_id }) => {
    const metadataId = ctx.db.normalizeId("notesHistoryMetadata", metadata_id);
    if (!metadataId) {
      throw new Error("Invalid version ID");
    }

    const content = await ctx.db
      .query("notesHistoryContent")
      .withIndex("by_metadata_id", (q) => q.eq("metadataId", metadataId))
      .unique();
    return content;
  },
});

// Calculate content difference between two text strings
function calculateTextDifference(text1: string, text2: string): number {
  // Simple character count difference - can be enhanced with more sophisticated diff algorithms
  const len1 = text1?.length || 0;
  const len2 = text2?.length || 0;
  return Math.abs(len1 - len2);
}

// Check if backup should be created based on smart criteria
export const shouldCreateBackup = internalQuery({
  args: {
    note_id: v.id("notes"),
    current_content: v.object({
      text: v.string(),
      tiptap: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { note_id, current_content }) => {
    const now = Date.now();

    // Get the most recent backup for this note
    const recentBackup = await ctx.db
      .query("notesHistoryMetadata")
      .withIndex("by_note_id", (q) => q.eq("noteId", note_id))
      .order("desc")
      .first();

    // If no previous backup exists, create one
    if (!recentBackup) {
      return { shouldBackup: true, reason: "first_backup" };
    }

    const timeSinceLastBackup = now - recentBackup.timestamp;
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in ms

    // Check if 30 minutes have passed
    if (timeSinceLastBackup >= thirtyMinutes) {
      return { shouldBackup: true, reason: "time_threshold" };
    }

    // Get the content of the most recent backup
    const recentBackupContent = await ctx.db
      .query("notesHistoryContent")
      .withIndex("by_metadata_id", (q) => q.eq("metadataId", recentBackup._id))
      .first();

    if (recentBackupContent) {
      // Calculate character difference
      const textDifference = calculateTextDifference(
        current_content.text,
        recentBackupContent.content.text,
      );

      // If content changed by more than 200 characters, create backup
      if (textDifference >= 200 && current_content.text.length > 0) {
        return {
          shouldBackup: true,
          reason: "content_threshold",
          difference: textDifference,
        };
      }
    }

    return { shouldBackup: false, reason: "no_significant_change" };
  },
});

// Clean up old backups based on tiered retention policy
export const cleanupOldBackups = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;
    const ninetyDays = 90 * oneDay;

    // Get all notes that have backups
    const allBackups = await ctx.db.query("notesHistoryMetadata").collect();

    // Group backups by noteId
    const backupsByNote = new Map();
    for (const backup of allBackups) {
      if (!backupsByNote.has(backup.noteId)) {
        backupsByNote.set(backup.noteId, []);
      }
      backupsByNote.get(backup.noteId).push(backup);
    }

    let totalDeleted = 0;

    // Process each note's backups
    for (const [_noteId, backups] of backupsByNote) {
      // Sort backups by timestamp (newest first)
      backups.sort(
        (a: Doc<"notesHistoryMetadata">, b: Doc<"notesHistoryMetadata">) =>
          b.timestamp - a.timestamp,
      );

      const toDelete = [];
      const timeSlots = new Set();

      for (let i = 0; i < backups.length; i++) {
        const backup = backups[i];
        const age = now - backup.timestamp;

        // Always keep the latest backup
        if (i === 0) continue;

        let shouldKeep = false;
        let timeSlot = "";

        if (age <= oneDay) {
          // Last 24 hours: Keep all backups
          shouldKeep = true;
        } else if (age <= sevenDays) {
          // Last 7 days: Keep 4 backups per day (every 6 hours)
          const hourSlot = Math.floor(backup.timestamp / (6 * 60 * 60 * 1000));
          timeSlot = `7d_${hourSlot}`;
        } else if (age <= thirtyDays) {
          // Last 30 days: Keep 1 backup per day
          const daySlot = Math.floor(backup.timestamp / oneDay);
          timeSlot = `30d_${daySlot}`;
        } else if (age <= ninetyDays) {
          // Last 90 days: Keep 1 backup per week
          const weekSlot = Math.floor(backup.timestamp / (7 * oneDay));
          timeSlot = `90d_${weekSlot}`;
        }

        // If we have a time slot and haven't kept a backup for this slot, keep it
        if (timeSlot && !timeSlots.has(timeSlot)) {
          shouldKeep = true;
          timeSlots.add(timeSlot);
        }

        // If older than 90 days, always delete
        if (age > ninetyDays) {
          shouldKeep = false;
        }

        if (!shouldKeep) {
          toDelete.push(backup);
        }
      }

      // Delete the old backups
      for (const backup of toDelete) {
        // Delete the content first
        const contentEntries = await ctx.db
          .query("notesHistoryContent")
          .withIndex("by_metadata_id", (q) => q.eq("metadataId", backup._id))
          .collect();

        for (const content of contentEntries) {
          await ctx.db.delete(content._id);
        }

        // Delete the metadata
        await ctx.db.delete(backup._id);
        totalDeleted++;
      }
    }

    return { deletedBackups: totalDeleted, processedNotes: backupsByNote.size };
  },
});
