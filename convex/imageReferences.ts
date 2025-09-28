import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const linkImage = mutation({
  args: {
    storageId: v.id("_storage"),
    tenantId: v.string(),
    documentOwner: v.string(),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, args) => {
    let documentOwnerId: Id<"notes" | "whiteboards"> | null;

    if (args.documentOwnerType === "notes") {
      documentOwnerId = ctx.db.normalizeId("notes", args.documentOwner);
    } else {
      documentOwnerId = ctx.db.normalizeId("whiteboards", args.documentOwner);
    }

    if (documentOwnerId) {
      const existing = await ctx.db
        .query("imageReferences")
        .withIndex("by_doc_storage", (q) =>
          q
            .eq("documentOwner", documentOwnerId)
            .eq("storageId", args.storageId),
        )
        .unique();
      if (existing) return;

      await ctx.db.insert("imageReferences", {
        storageId: args.storageId,
        tenantId: args.tenantId,
        documentOwnerType: args.documentOwnerType,
        documentOwner: documentOwnerId,
        format: "image" as const,
        createdAt: new Date().toISOString(),
      });
    }
  },
});

export const unlinkImage = mutation({
  args: {
    storageId: v.id("_storage"),
    documentOwner: v.string(),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, { documentOwner, documentOwnerType, storageId }) => {
    let documentOwnerId: Id<"notes" | "whiteboards"> | null;

    if (documentOwnerType === "notes") {
      documentOwnerId = ctx.db.normalizeId("notes", documentOwner);
    } else {
      documentOwnerId = ctx.db.normalizeId("whiteboards", documentOwner);
    }
    if (documentOwnerId) {
      const link = await ctx.db
        .query("imageReferences")
        .withIndex("by_doc_storage", (q) =>
          q.eq("documentOwner", documentOwnerId).eq("storageId", storageId),
        )
        .unique();
      if (!link) return;
      await ctx.db.delete(link._id);

      await ctx.db.insert("imageReferencesCleanup", {
        storageId: storageId,
        tenantId: link.tenantId,
        documentOwnerType: documentOwnerType,
        documentOwner: documentOwnerId,
        createdAt: new Date().toISOString(),
      });
    }
  },
});

export const maybeGc = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const stillUsed = await ctx.db
      .query("imageReferences")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();
    if (!stillUsed) await ctx.storage.delete(storageId);
  },
});

export const resolveImageReferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const imageReferencesCleanup = await ctx.db
      .query("imageReferencesCleanup")
      .collect();

    if (imageReferencesCleanup.length === 0) return;

    // Pre-compute the base URL once
    const baseImageUrl = `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/getImage?storageId=`;

    // Separate notes and whiteboards references
    const noteRefs = imageReferencesCleanup.filter(
      (ref) => ref.documentOwnerType === "notes",
    );
    const whiteboardRefs = imageReferencesCleanup.filter(
      (ref) => ref.documentOwnerType === "whiteboards",
    );

    // Batch fetch all documents in parallel
    const [notes, whiteboards] = await Promise.all([
      Promise.all(
        noteRefs.map((ref) =>
          ctx.db
            .get(ref.documentOwner as Id<"notes">)
            .then((note) => ({ ref, note })),
        ),
      ),
      Promise.all(
        whiteboardRefs.map((ref) =>
          ctx.db
            .get(ref.documentOwner as Id<"whiteboards">)
            .then((whiteboard) => ({ ref, whiteboard })),
        ),
      ),
    ]);

    // Process all references in memory
    const toInsert: Array<{
      storageId: string;
      tenantId: string;
      documentOwnerType: "notes" | "whiteboards";
      documentOwner: Id<"notes" | "whiteboards">;
      format: "image";
      createdAt: string;
    }> = [];
    const toDelete: Array<Id<"_storage">> = [];
    const allCleanupIds = imageReferencesCleanup.map((ref) => ref._id);

    // Process notes
    for (const { ref, note } of notes) {
      const imageUrl = baseImageUrl + ref.storageId;
      if (
        note?.content.tiptap &&
        JSON.stringify(note.content.tiptap).includes(imageUrl)
      ) {
        toInsert.push({
          storageId: ref.storageId,
          tenantId: ref.tenantId,
          documentOwnerType: ref.documentOwnerType,
          documentOwner: ref.documentOwner,
          format: "image" as const,
          createdAt: new Date().toISOString(),
        });
      } else {
        toDelete.push(ref.storageId as Id<"_storage">);
      }
    }

    // Process whiteboards
    for (const { ref, whiteboard } of whiteboards) {
      const imageUrl = baseImageUrl + ref.storageId;
      if (
        whiteboard?.serializedData &&
        whiteboard?.serializedData?.includes(imageUrl)
      ) {
        toInsert.push({
          storageId: ref.storageId,
          tenantId: ref.tenantId,
          documentOwnerType: ref.documentOwnerType,
          documentOwner: ref.documentOwner,
          format: "image" as const,
          createdAt: new Date().toISOString(),
        });
      } else {
        toDelete.push(ref.storageId as Id<"_storage">);
      }
    }

    // Execute operations in proper sequence to avoid race conditions
    // First insert all imageReferences
    await Promise.all(
      toInsert.map((data) => ctx.db.insert("imageReferences", data)),
    );

    // Then delete unused storage
    await Promise.all(
      toDelete.map((storageId) => ctx.storage.delete(storageId)),
    );

    // Finally delete cleanup records
    await Promise.all(allCleanupIds.map((id) => ctx.db.delete(id)));
  },
});
