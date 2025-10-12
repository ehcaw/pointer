import { action, mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("notes")
      // .filter((q) => q.eq(q.field("tenantId"), args.user_id))
      .filter((q) => q.eq(q.field("tenantId"), identity.subject))
      .collect();
  },
});

export const readNotesFromDbByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("tenantId"), args.userId))
      .collect();
  },
});

export const createNoteInDb = mutation({
  args: {
    name: v.string(),
    tenantId: v.string(),
    content: v.object({
      text: v.string(),
      tiptap: v.string(),
    }),
    pointer_id: v.string(), // Add pointer_id for client-side reference
    createdAt: v.string(),
    updatedAt: v.string(),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
    collaborative: v.boolean(),
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

    const noteId = await ctx.db.insert("notes", {
      name: args.name,
      tenantId: args.tenantId,
      pointer_id: args.pointer_id,
      lastAccessed: args.lastAccessed || new Date().toISOString(),
      lastEdited: args.lastEdited || new Date().toISOString(),
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      collaborative: args.collaborative || false,
    });

    await ctx.db.insert("notesContent", {
      noteId: noteId,
      content: args.content,
      tenantId: args.tenantId,
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
    content: v.optional(v.object({ tiptap: v.any(), text: v.string() })),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    collaborative: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { pointer_id, ...fields } = args;

    // First check if the note exists
    const existingNote = await ctx.db
      .query("notes")
      .withIndex("by_pointer_id")
      .filter((q) => q.eq(q.field("pointer_id"), pointer_id))
      .first();

    if (existingNote) {
      // Always update the updatedAt timestamp
      //
      if (args.content) {
        // Update or create the notesContent entry
        const notesContentEntry = await ctx.db
          .query("notesContent")
          .withIndex("by_noteid", (q) => q.eq("noteId", existingNote._id))
          .first();
        if (notesContentEntry)
          await ctx.db.patch(notesContentEntry?._id, {
            content: fields.content,
          });
      }

      fields.content = undefined; // Update in notesContent above, do not update here
      fields.updatedAt = String(new Date());
      // Update using the Convex ID
      await ctx.db.patch(existingNote._id, fields);
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
        createdAt: fields.createdAt || now,
        updatedAt: fields.updatedAt || now,
        lastAccessed: fields.lastAccessed || now,
        lastEdited: fields.lastEdited || now,
        collaborative: fields.collaborative || false,
      };

      // Insert the new document
      const newId = await ctx.db.insert("notes", doc);
      await ctx.db.insert("notesContent", {
        content: content,
        tenantId: fields.tenantId || "",
        noteId: newId,
      });
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

    if (fields.content) {
      const noteContentEntry = await ctx.db
        .query("notesContent")
        .withIndex("by_noteid", (q) => q.eq("noteId", note._id))
        .first();
      if (noteContentEntry) {
        const content = {
          text: fields.content.text || "",
          tiptap: fields.content.tiptap || {},
        };
        await ctx.db.patch(noteContentEntry._id, {
          content,
        });
        fields.content = undefined; // Prevent updating in notes table
      }
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
      .filter((q) => q.eq(q.field("tenantId"), args.user_id))
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
