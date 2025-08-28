import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

interface NoteContent {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tiptap: any; // Using 'any' as requested
}

export const readNoteFromDb = query({
  args: { pointer_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("pointer_id"), args.pointer_id))
      .first();
  },
});

export const readNotesFromDb = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("tenantId"), args.user_id))
      .collect();
  },
});

export const createNoteInDb = mutation({
  args: {
    name: v.string(),
    content: v.object({
      tiptap: v.optional(v.any()),
      text: v.optional(v.string()),
    }),
    tenantId: v.string(),
    pointer_id: v.string(), // Add pointer_id for client-side reference
    createdAt: v.string(),
    updatedAt: v.string(),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store the pointer_id along with other fields
    const existingNote = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("pointer_id"), args.pointer_id))
      .first();
    if (existingNote !== null) {
      return existingNote._id;
    }

    const content = {
      // This is to satisfy type requirements
      text: args.content.text || "",
      tiptap: args.content.tiptap || "",
    };
    const noteId = await ctx.db.insert("notes", {
      name: args.name,
      content: content,
      tenantId: args.tenantId,
      pointer_id: args.pointer_id,
      lastAccessed: args.lastAccessed || new Date().toISOString(),
      lastEdited: args.lastEdited || new Date().toISOString(),
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
    return noteId;
  },
});

export const updateNoteInDb = mutation({
  args: {
    // Required fields for both update and create
    pointer_id: v.string(),
    name: v.string(),

    // Fields that are required for creation but optional for updates
    tenantId: v.optional(v.string()),
    type: v.optional(v.string()), // "file" or "folder"

    // Optional fields for both operations
    content: v.optional(
      v.object({ tiptap: v.optional(v.any()), text: v.optional(v.string()) }),
    ),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { pointer_id, ...fields } = args;

    // First check if the note exists
    const existingNote = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("pointer_id"), pointer_id))
      .first();

    if (existingNote) {
      // UPDATE: Note exists, update it
      const update: Record<string, any> = {};

      // Only include defined fields
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          update[key] = value;
        }
      });

      // Always update the updatedAt timestamp
      update.updatedAt = String(new Date());

      // Update using the Convex ID
      await ctx.db.patch(existingNote._id, update);

      return existingNote._id; // Return the Convex ID
    } else {
      // CREATE: Note doesn't exist, create a new one
      const now = String(new Date());

      // Add content
      const content: NoteContent = {
        tiptap: fields.content?.tiptap || {}, // Default to empty object
        text: fields.content?.text || "", // Default to empty string
      };

      // Prepare document for insertion with all required fields
      const doc = {
        pointer_id,
        name: fields.name,
        tenantId: fields.tenantId || "12345678", // Use default if not provided
        content: content,
        createdAt: fields.createdAt || now,
        updatedAt: fields.updatedAt || now,
        lastAccessed: fields.lastAccessed || now,
        lastEdited: fields.lastEdited || now,
      };

      // Insert the new document
      const newId = await ctx.db.insert("notes", doc);
      return newId; // Return the new Convex ID
    }
  },
});

// Add a query to find a note by pointer_id
export const findNoteByPointerId = query({
  args: { pointer_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("pointer_id"), args.pointer_id))
      .first();
  },
});

// Add a mutation to update a note by pointer_id
export const updateNoteByPointerId = mutation({
  args: {
    pointer_id: v.string(),
    name: v.optional(v.string()),
    content: v.optional(
      v.object({ tiptap: v.optional(v.any()), text: v.optional(v.string()) }),
    ),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { pointer_id, ...fields } = args;

    // Find the note by pointer_id
    const note = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("pointer_id"), pointer_id))
      .first();

    if (!note) {
      throw new Error(`Note with pointer_id ${pointer_id} not found`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        update[key] = value;
      }
    });
    update.updatedAt = String(new Date());

    // Update using the Convex ID
    await ctx.db.patch(note._id, update);
  },
});

// Add a mutation to delete a note by pointer_id
export const deleteNoteByPointerId = mutation({
  args: {
    pointer_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the note by pointer_id
    const note = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("pointer_id"), args.pointer_id))
      .first();

    if (!note) {
      throw new Error(`Note with pointer_id ${args.pointer_id} not found`);
    }

    // Delete using the Convex ID
    await ctx.db.delete(note._id);
  },
});
