import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../__tests__/components/whiteboard/test.setup";
import { convexTest } from "convex-test";

describe("noteVersions", () => {
  describe("getNoteVersions", () => {
    it("throws an error for unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      await expect(
        t.query(api.noteVersions.getNoteVersions, {
          note_id: "some_note_id",
        }),
      ).rejects.toThrowError("Not authenticated");
    });
    it("should only return note versions corresponding to a certain note id", async () => {
      const t = convexTest(schema, modules);

      const noteOneId = await t.mutation(api.notes.createNoteInDb, {
        name: "note1",
        tenantId: "user-1",
        type: "file",
        pointer_id: "pointer-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        collaborative: false,
      });
      const noteTwoId = await t.mutation(api.notes.createNoteInDb, {
        name: "note2",
        tenantId: "user-2",
        type: "file",
        pointer_id: "pointer-2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        collaborative: false,
      });

      for (let i = 0; i < 5; i++) {
        const evenOrOdd = i % 2;
        await t
          .withIdentity({ subject: evenOrOdd == 0 ? "user-1" : "user-2" })
          .run(async (ctx) => {
            await ctx.db.insert("notesHistoryMetadata", {
              noteId: evenOrOdd == 0 ? noteOneId : noteTwoId,
              tenantId: evenOrOdd == 0 ? "user-1" : "user-2",
              timestamp: Date.now(),
            });
          });
      }

      const noteVersions = await t
        .withIdentity({ subject: "user-1" })
        .query(api.noteVersions.getNoteVersions, {
          note_id: noteOneId.toString(),
        });

      expect(noteVersions).toHaveLength(3);
      expect(
        noteVersions.every((v) => v.noteId.toString() === noteOneId.toString()),
      ).toBe(true);
      expect(noteVersions.every((v) => v.tenantId === "user-1")).toBe(true);
    });
  });
  describe("getNoteContentVersion", () => {
    it("throws an error for unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const noteOneId = await t.mutation(api.notes.createNoteInDb, {
        name: "note1",
        tenantId: "user-1",
        type: "file",
        pointer_id: "pointer-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        collaborative: false,
      });
      const metadataId = await t
        .withIdentity({ subject: "user-1" })
        .run(async (ctx) => {
          const id = await ctx.db.insert("notesHistoryMetadata", {
            noteId: ctx.db.normalizeId("notes", noteOneId)!,
            tenantId: "user-1",
            timestamp: Date.now(),
          });
          return id;
        });
      await expect(
        t.query(api.noteVersions.getNoteVersionContent, {
          metadata_id: metadataId,
        }),
      ).rejects.toThrowError("Not authenticated");
    });
  });
});
