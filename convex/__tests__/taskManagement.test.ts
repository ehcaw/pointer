import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import { modules } from "../../__tests__/components/whiteboard/test.setup";
import schema from "../schema";
import { convexTest } from "convex-test";

describe("taskManagement", () => {
  describe("getUserTasks", async () => {
    it("returns empty array for unauthorized user", async () => {
      const t = convexTest(schema, modules);
      const result = await t.query(api.taskManagement.getUserTasks, {});
      expect(result).toEqual([]);
    });
    it("returns user tasks for authorized user", async () => {
      const t = convexTest(schema, modules);
      await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 1",
        });
      await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 2",
        });
      await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 3",
        });
      await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 4",
        });

      const result = await t
        .withIdentity({ subject: "test-12345" })
        .query(api.taskManagement.getUserTasks, {});

      expect(result).toHaveLength(4);
      expect(result[0].taskName).toBe("Task 4");
      expect(result[1].taskName).toBe("Task 3");
      expect(result[2].taskName).toBe("Task 2");
      expect(result[3].taskName).toBe("Task 1");
    });
  });
  describe("createTask", async () => {
    it("throws error for unauthorized user", async () => {
      const t = convexTest(schema, modules);
      await expect(
        t.mutation(api.taskManagement.createTask, {
          taskName: "Unauthorized Task",
        }),
      ).rejects.toThrow("Not authenticated");
    });
    it("returns task id upon successful task creation", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, { taskName: "Test 1" });
      expect(taskId).toBeDefined();
    });
  });
  describe("toggleTaskComplete", () => {
    it("throws error for unauthorized users", async () => {
      const t = convexTest(schema, modules);
      const taskid = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 1",
        });
      await expect(
        t.mutation(api.taskManagement.toggleTaskComplete, {
          taskId: taskid,
          completed: true,
        }),
      ).rejects.toThrow("Not authenticated");
    });
    it("returns the task id upon successful update", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "test-123" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task-1",
        });

      const update = await t
        .withIdentity({ subject: "test-123" })
        .mutation(api.taskManagement.toggleTaskComplete, {
          taskId,
          completed: true,
        });

      expect(update).toBeDefined();
      expect(update).toBe(taskId);

      const taskAfterUpdate = await t
        .withIdentity({ subject: "test-123" })
        .query(api.taskManagement.getUserTasks);
      expect(taskAfterUpdate[0].completed).toBeTruthy();
    });
  });
});
