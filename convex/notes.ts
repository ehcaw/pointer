import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const readNoteFromDb = query({
  args: { quibble_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("quibble_id"), args.quibble_id))
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
    quibble_id: v.string(), // Add quibble_id for client-side reference
    parentId: v.optional(v.string()),
    path: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store the quibble_id along with other fields
    const noteId = await ctx.db.insert("notes", {
      name: args.name,
      content: args.content,
      tenantId: args.tenantId,
      quibble_id: args.quibble_id,
      parentId: args.parentId,
      path: args.path,
      lastAccessed: args.lastAccessed,
      lastEdited: args.lastEdited,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
    return noteId;
  },
});

export const updateNoteInDb = mutation({
  args: {
    // Required fields for both update and create
    quibble_id: v.string(),
    name: v.string(),

    // Fields that are required for creation but optional for updates
    tenantId: v.optional(v.string()),
    type: v.optional(v.string()), // "file" or "folder"

    // Optional fields for both operations
    content: v.optional(
      v.object({ tiptap: v.optional(v.any()), text: v.optional(v.string()) }),
    ),
    parentId: v.optional(v.string()),
    path: v.optional(v.array(v.string())),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { quibble_id, ...fields } = args;

    // First check if the note exists
    const existingNote = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("quibble_id"), quibble_id))
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

      // Prepare document for insertion
      const doc: Record<string, any> = {
        quibble_id,
        name: fields.name,
        tenantId: fields.tenantId || "default-tenant", // Use default if not provided
        type: fields.type || "file", // Default to file if not specified
        parentId: fields.parentId || null,
        path: fields.path || [],
        createdAt: fields.createdAt || now,
        updatedAt: fields.updatedAt || now,
      };

      // Add optional fields if they exist
      if (fields.lastAccessed) doc.lastAccessed = fields.lastAccessed;
      if (fields.lastEdited) doc.lastEdited = fields.lastEdited;

      // Add content if this is a file
      if (doc.type === "file") {
        doc.content = fields.content || { tiptap: {}, text: "" };
      }

      // Insert the new document
      const newId = await ctx.db.insert("notes", doc);
      return newId; // Return the new Convex ID
    }
  },
});

// Add a query to find a note by quibble_id
export const findNoteByQuibbleId = query({
  args: { quibble_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("quibble_id"), args.quibble_id))
      .first();
  },
});

// Add a mutation to update a note by quibble_id
export const updateNoteByQuibbleId = mutation({
  args: {
    quibble_id: v.string(),
    name: v.optional(v.string()),
    content: v.optional(
      v.object({ tiptap: v.optional(v.any()), text: v.optional(v.string()) }),
    ),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { quibble_id, ...fields } = args;

    // Find the note by quibble_id
    const note = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("quibble_id"), quibble_id))
      .first();

    if (!note) {
      throw new Error(`Note with quibble_id ${quibble_id} not found`);
    }

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

// Add a mutation to delete a note by quibble_id
export const deleteNoteByQuibbleId = mutation({
  args: {
    quibble_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the note by quibble_id
    const note = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("quibble_id"), args.quibble_id))
      .first();

    if (!note) {
      throw new Error(`Note with quibble_id ${args.quibble_id} not found`);
    }

    // Delete using the Convex ID
    await ctx.db.delete(note._id);
  },
});
