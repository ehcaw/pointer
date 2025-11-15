import { action, mutation, query, MutationCtx } from "./_generated/server";
import { NoteContent } from "@/types/note";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const readNoteFromDb = query({
  args: { pointer_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", args.pointer_id))
      .first();
  },
});

export const readNotesFromDb = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("notes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", identity.subject))
      .collect();
  },
});

export const readNotesFromDbByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.userId))
      .collect();
  },
});

export const createNoteInDb = mutation({
  args: {
    name: v.string(),
    tenantId: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(
      v.object({
        text: v.string(),
        tiptap: v.string(),
      }),
    ),
    pointer_id: v.string(), // Add pointer_id for client-side reference
    createdAt: v.string(),
    updatedAt: v.string(),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
    collaborative: v.boolean(),
    parent_id: v.optional(v.id("notes")),
  },
  handler: async (ctx, args) => {
    // Store the pointer_id along with other fields
    const existingNote = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", args.pointer_id))
      .first();
    if (existingNote !== null) {
      return existingNote._id;
    }

    const timestamp = Date.now();

    const noteId = await ctx.db.insert("notes", {
      name: args.name,
      tenantId: args.tenantId,
      type: args.type,
      pointer_id: args.pointer_id,
      lastAccessed: args.lastAccessed || new Date().toISOString(),
      lastEdited: args.lastEdited || new Date().toISOString(),
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      collaborative: args.collaborative || false,
      parent_id: args.parent_id,
      last_backed_up_at: timestamp,
    });

    // Only create content entry for files, not folders
    if (args.type === "file" && args.content) {
      await ctx.db.insert("notesContent", {
        noteId: noteId,
        content: args.content,
        tenantId: args.tenantId,
      });

      createNoteBackupHelper(ctx, {
        noteId: noteId,
        tenantId: args.tenantId,
        timestamp: timestamp,
        content: args.content,
      });
    }

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
    type: v.optional(v.union(v.literal("file"), v.literal("folder"))),

    // Optional fields for both operations
    content: v.optional(v.object({ tiptap: v.any(), text: v.string() })),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    collaborative: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { pointer_id, ...fields } = args;

    // Validate pointer_id
    if (!pointer_id || pointer_id.trim() === "") {
      throw new Error("Invalid pointer_id: cannot be empty");
    }

    // First check if the note exists
    const existingNote = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", pointer_id))
      .first();

    if (existingNote) {
      // UPDATE: Note exists, update it
      try {
        if (args.content) {
          // Update or create the notesContent entry
          const notesContentEntry = await ctx.db
            .query("notesContent")
            .withIndex("by_noteid", (q) => q.eq("noteId", existingNote._id))
            .first();

          if (notesContentEntry) {
            // Update existing content
            await ctx.db.patch(notesContentEntry._id, {
              content: args.content,
            });
          } else {
            // Create new content entry
            await ctx.db.insert("notesContent", {
              noteId: existingNote._id,
              content: args.content,
              tenantId: existingNote.tenantId,
            });
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateFields: Record<string, any> = { ...fields };
        updateFields.updatedAt = String(new Date());

        const timestamp = Date.now();
        if (
          !existingNote.last_backed_up_at ||
          existingNote.last_backed_up_at + 900000 < timestamp // check to see if its at least 15 minutes since the last backup
        ) {
          createNoteBackupHelper(ctx, {
            noteId: existingNote._id,
            tenantId: existingNote.tenantId,
            timestamp: timestamp,
            content: updateFields.content as NoteContent,
          });
          updateFields.last_backed_up_at = timestamp;
        }
        delete updateFields.content; // Remove content as it's handled above

        // Update the note
        await ctx.db.patch(existingNote._id, updateFields);
        return existingNote._id;
      } catch (error) {
        throw new Error(
          `Failed to update note: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    } else {
      // CREATE: Note doesn't exist, create a new one
      if (!fields.tenantId) {
        throw new Error("tenantId is required when creating a new note");
      }

      try {
        const now = String(new Date());

        // Prepare document for insertion with all required fields
        const doc = {
          pointer_id,
          name: fields.name,
          tenantId: fields.tenantId,
          createdAt: fields.createdAt || now,
          updatedAt: fields.updatedAt || now,
          lastAccessed: fields.lastAccessed || now,
          lastEdited: fields.lastEdited || now,
          collaborative: fields.collaborative || false,
        };

        // Insert the new document
        const newId = await ctx.db.insert("notes", doc);

        // Create content entry
        const content: NoteContent = {
          tiptap: fields.content?.tiptap || JSON.stringify({}), // Default to empty object
          text: fields.content?.text || "", // Default to empty string
        };

        await ctx.db.insert("notesContent", {
          content: content,
          tenantId: fields.tenantId,
          noteId: newId,
        });

        return newId;
      } catch (error) {
        throw new Error(
          `Failed to create note: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
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

    // Validate pointer_id
    if (!pointer_id || pointer_id.trim() === "") {
      throw new Error("Invalid pointer_id: cannot be empty");
    }

    // Find the note by pointer_id
    const note = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", pointer_id))
      .first();

    if (!note) {
      throw new Error(`Note with pointer_id '${pointer_id}' not found`);
    }

    try {
      // Handle content updates
      if (fields.content) {
        const noteContentEntry = await ctx.db
          .query("notesContent")
          .withIndex("by_noteid", (q) => q.eq("noteId", note._id))
          .first();

        const content = {
          text: fields.content.text || "",
          tiptap: fields.content.tiptap || JSON.stringify({}),
        };

        if (noteContentEntry) {
          // Update existing content
          await ctx.db.patch(noteContentEntry._id, {
            content,
          });
        } else {
          // Create new content entry
          await ctx.db.insert("notesContent", {
            noteId: note._id,
            content,
            tenantId: note.tenantId,
          });
        }
      }

      // Prepare update fields (exclude content as it's handled above)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: Record<string, any> = {};
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && key !== "content") {
          update[key] = value;
        }
      });
      update.updatedAt = String(new Date());

      // Update the note if there are fields to update
      if (Object.keys(update).length > 1) {
        // More than just updatedAt
        await ctx.db.patch(note._id, update);
      } else if (Object.keys(update).length === 1) {
        // Only updatedAt, still update to reflect the access
        await ctx.db.patch(note._id, update);
      }

      return { success: true, noteId: note._id };
    } catch (error) {
      throw new Error(
        `Failed to update note: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});

// Add a mutation to delete a note by pointer_id
export const deleteNoteByPointerId = mutation({
  args: {
    pointer_id: v.string(),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the note by pointer_id
    const note = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", args.pointer_id))
      .first();

    if (!note) {
      throw new Error(`Note with pointer_id ${args.pointer_id} not found`);
    }

    // Validate user owns the note (add this check for security)
    if (note.tenantId !== args.user_id) {
      throw new Error("Unauthorized: You don't own this note");
    }

    // Batch all queries in parallel for better performance
    const [documentShares, imageReferences] = await Promise.all([
      ctx.db
        .query("documentShares")
        .filter((q) => q.eq(q.field("documentId"), note._id))
        .collect(),
      ctx.db
        .query("imageReferences")
        .filter((q) => q.eq(q.field("documentOwner"), note._id))
        .collect(),
    ]);

    // Batch all deletes in parallel
    const deletePromises = [
      // Delete the main note
      ctx.db.delete(note._id),

      // Delete all document shares
      ...documentShares.map((share) => ctx.db.delete(share._id)),

      // Delete all image references
      ...imageReferences.map((imgRef) => ctx.db.delete(imgRef._id)),
    ];

    // Prepare cleanup records for image references
    const cleanupPromises = imageReferences.map((imgRef) =>
      ctx.db.insert("imageReferencesCleanup", {
        tenantId: args.user_id,
        documentOwner: imgRef.documentOwner,
        storageId: imgRef.storageId,
        documentOwnerType: "notes",
        createdAt: new Date().toISOString(),
      }),
    );

    // Execute all operations in parallel
    await Promise.all([...deletePromises, ...cleanupPromises]);

    const noteContentEntry = await ctx.db
      .query("notesContent")
      .withIndex("by_noteid", (q) => q.eq("noteId", note._id))
      .first();
    if (noteContentEntry) await ctx.db.delete(noteContentEntry._id);

    // Only return updated notes if needed - consider making this optional
    // or move to a separate query function if the caller needs it
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.user_id))
      .collect();

    return notes;
  },
});

// Public query for getting note by pointer_id for preview (no auth required)
export const getPublicNote = query({
  args: { pointer_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", args.pointer_id))
      .first();
  },
});

export const generateAutocompleteSuggestion = action({
  args: {
    fullText: v.string(),
    currLine: v.string(),
  },
  handler: async () => {
    const text = "";
    //   const { text } = await generateText({
    //     model: groq("llama-3.3-70b-versatile"),
    //     system: `<task>
    // You are an autocompletion system that suggests text completions.
    // Think about what the user will want to say next.
    // Your name is pointer.

    // Rules:
    // - USE the provided context in <context> tags
    // - Read CAREFULLY the input text in <input> tags
    // - Suggest up to 10 words maximum
    // - Ensure suggestions maintain semantic meaning
    // - Wrap completion in <completion> tags
    // - Return only the completion text
    // - Periods at the end of the completion are OPTIONAL, not fully required
    // </task>

    // <example>
    // <context>Math Academy is a challenging but rewarding platform for learning math.</context>
    // <input>Math Academy teaches</input>
    // <completion> math in a fun and engaging way.</completion>
    // </example>`,
    //     prompt: `<context>
    // ${args.fullText}
    // </context>
    // <input>
    // ${args.currLine}
    // </input>
    // Do not wrap the completion in <completion> tags.
    // Your completion:`,
    //   });
    //   console.log(text);
    return text;
  },
});

export const getSharedUsers = query({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    const docId = ctx.db.normalizeId("notes", args.documentId);
    if (!docId) {
      return [];
    }

    return await ctx.db
      .query("documentShares")
      .withIndex("by_document_user", (q) => q.eq("documentId", docId))
      .collect();
  },
});

export const shareNote = mutation({
  args: {
    dId: v.string(),
    users: v.array(
      v.object({
        userEmail: v.string(),
        userId: v.string(),
      }),
    ),
    ownerEmail: v.string(),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const documentId = ctx.db.normalizeId("notes", args.dId);

    if (!documentId) {
      return {
        success: false,
        sharedWithCount: 0,
      };
    }

    // Check for existing shares and filter out duplicates
    const usersToShare = [];

    for (const user of args.users) {
      // Check if this user is already shared with this document
      const existingShare = await ctx.db
        .query("documentShares")
        .withIndex("by_document_user", (q) =>
          q
            .eq("documentId", documentId)
            .eq("userId", user.userId)
            .eq("userEmail", user.userEmail),
        )
        .first();

      // Only add if not already shared
      if (!existingShare) {
        usersToShare.push(user);
      }
    }

    // Create documentShare objects for new users only
    if (usersToShare.length > 0) {
      const sharePromises = usersToShare.map((user) =>
        ctx.db.insert("documentShares", {
          documentId: documentId,
          userEmail: user.userEmail,
          userId: user.userId,
          ownerEmail: args.ownerEmail,
          ownerId: args.ownerId,
        }),
      );
      await Promise.all(sharePromises);
    }

    return {
      success: true,
      sharedWithCount: usersToShare.length,
      totalUsersRequested: args.users.length,
      duplicatesSkipped: args.users.length - usersToShare.length,
    };
  },
});

export const unshareNote = mutation({
  args: { dId: v.string(), userEmail: v.string(), ownerEmail: v.string() },
  handler: async (ctx, args) => {
    const documentId = args.dId as Id<"notes">;

    // Find the document that matches all three conditions
    const noteToDelete = await ctx.db
      .query("documentShares")
      .filter((q) =>
        q.and(
          q.eq(q.field("documentId"), documentId),
          q.eq(q.field("userEmail"), args.userEmail),
          q.eq(q.field("ownerEmail"), args.ownerEmail),
        ),
      )
      .first();

    if (!noteToDelete) {
      throw new Error(
        "Note not found or you don't have permission to delete it",
      );
    }

    // Delete the found document
    await ctx.db.delete(noteToDelete._id);

    return { success: true, deletedId: noteToDelete._id };
  },
});

export const toggleCollaboration = mutation({
  args: { docId: v.string(), collaborative: v.boolean() },
  handler: async (ctx, { docId, collaborative }) => {
    const documentId = ctx.db.normalizeId("notes", docId);
    if (documentId) {
      await ctx.db.patch(documentId, { collaborative });
    }
  },
});

export const getSharedDocumentsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // 1. Find all document shares for the user
    const shares = await ctx.db
      .query("documentShares")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // 2. Extract the documentIds
    const documentIds = shares.map((share) => share.documentId);

    // 3. Fetch the documents for those Ids
    const documents = await Promise.all(
      documentIds.map((docId) => ctx.db.get(docId)),
    );

    // 4. Filter out any null results (if a document was deleted)
    // and return the documents
    return documents.filter((doc) => doc !== null);
  },
});

// Folder-specific operations

export const createFolderInDb = mutation({
  args: {
    name: v.string(),
    tenantId: v.string(),
    pointer_id: v.string(),
    parent_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const parent_id =
      (args.parent_id && ctx.db.normalizeId("notes", args.parent_id)) ||
      undefined;

    const folderId = await ctx.db.insert("notes", {
      name: args.name,
      tenantId: args.tenantId,
      type: "folder",
      pointer_id: args.pointer_id,
      parent_id: parent_id,
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      lastEdited: now,
      collaborative: false,
      last_backed_up_at: Date.now(),
    });

    return folderId;
  },
});

export const moveNode = mutation({
  args: {
    pointer_id: v.string(),
    new_parent_id: v.optional(v.string()),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", args.pointer_id))
      .first();

    if (!note) {
      throw new Error(`Note with pointer_id ${args.pointer_id} not found`);
    }

    if (note.tenantId !== args.user_id) {
      throw new Error("Unauthorized: You don't own this note");
    }

    const new_parent_id =
      (args.new_parent_id && ctx.db.normalizeId("notes", args.new_parent_id)) ||
      undefined;

    // Prevent circular reference
    if (args.new_parent_id) {
      // Check if new_parent_id is a descendant of the node being moved
      const checkDescendants = async (
        nodeId: Id<"notes">,
      ): Promise<boolean> => {
        const children = await ctx.db
          .query("notes")
          .withIndex("by_parent", (q) => q.eq("parent_id", nodeId))
          .collect();

        for (const child of children) {
          if (child._id === new_parent_id) {
            return true;
          }
          if (child.type === "folder" && (await checkDescendants(child._id))) {
            return true;
          }
        }
        return false;
      };

      if (await checkDescendants(note._id)) {
        throw new Error("Cannot move a folder into its own descendant");
      }
    }

    await ctx.db.patch(note._id, {
      parent_id: new_parent_id,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const deleteFolder = mutation({
  args: {
    pointer_id: v.string(),
    user_id: v.string(),
    cascade: v.boolean(), // Whether to delete all children
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id", (q) => q.eq("pointer_id", args.pointer_id))
      .first();

    if (!note) {
      throw new Error(`Folder with pointer_id ${args.pointer_id} not found`);
    }

    if (note.tenantId !== args.user_id) {
      throw new Error("Unauthorized: You don't own this folder");
    }

    if (note.type !== "folder") {
      throw new Error("Can only delete folders with this mutation");
    }

    const deleteRecursively = async (folderId: Id<"notes">) => {
      // Find all children
      const children = await ctx.db
        .query("notes")
        .withIndex("by_parent", (q) => q.eq("parent_id", folderId))
        .collect();

      // Delete all children recursively
      for (const child of children) {
        if (child.type === "folder") {
          await deleteRecursively(child._id);
        } else {
          await deleteNoteAndContent(child._id);
        }
      }

      // Delete the folder itself
      await ctx.db.delete(folderId);
    };

    const deleteNoteAndContent = async (noteId: Id<"notes">) => {
      // Delete content
      const content = await ctx.db
        .query("notesContent")
        .withIndex("by_noteid", (q) => q.eq("noteId", noteId))
        .first();
      if (content) {
        await ctx.db.delete(content._id);
      }

      // Delete the note
      await ctx.db.delete(noteId);
    };

    if (args.cascade) {
      await deleteRecursively(note._id);
    } else {
      // Only delete if empty
      const children = await ctx.db
        .query("notes")
        .withIndex("by_parent", (q) => q.eq("parent_id", note._id))
        .collect();

      if (children.length > 0) {
        throw new Error("Cannot delete non-empty folder without cascade");
      }

      await ctx.db.delete(note._id);
    }

    return { success: true };
  },
});

export const getTreeStructure = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all notes for the user
    const allNotes = await ctx.db
      .query("notes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.userId))
      .collect();

    // Build tree structure
    const notesById = new Map(
      allNotes.map((note) => [note._id, { ...note, children: [] as any[] }]),
    );
    const rootNodes: any[] = [];

    for (const note of allNotes) {
      if (note.parent_id) {
        const parent = notesById.get(note.parent_id);
        if (parent) {
          parent.children.push(note);
        }
      } else {
        rootNodes.push(note);
      }
    }

    return rootNodes;
  },
});

// const createNoteBackup = internalMutation({
//   args: {
//     noteId: v.id("notes"),
//     tenantId: v.string(),
//     timestamp: v.string(),
//     content: v.object({
//       text: v.string(),
//       tiptap: v.optional(v.string()),
//     }),
//   },
//   handler: async (ctx, args) => {
//     const noteHistoryMetadata = await ctx.db.insert("notesHistoryMetadata", {
//       noteId: args.noteId,
//       tenantId: args.tenantId,
//       timestamp: args.timestamp,
//     });

//     await ctx.db.insert("notesHistoryContent", {
//       metadataId: noteHistoryMetadata,
//       content: args.content,
//     });
//   },
// });

// const createNoteBackup = (noteId: v.id("notes"), ) => {

// }
//
async function createNoteBackupHelper(
  ctx: MutationCtx,
  args: {
    noteId: any;
    tenantId: string;
    timestamp: number;
    content: { text: string; tiptap?: string };
  },
) {
  const noteHistoryMetadata = await ctx.db.insert("notesHistoryMetadata", {
    noteId: args.noteId,
    tenantId: args.tenantId,
    timestamp: args.timestamp,
  });

  await ctx.db.insert("notesHistoryContent", {
    metadataId: noteHistoryMetadata,
    content: args.content,
  });
}
