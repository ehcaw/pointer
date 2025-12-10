import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import { modules } from "../../__tests__/components/whiteboard/test.setup";
import schema from "../schema";
import { convexTest } from "convex-test";

describe("taskManagement", () => {
  describe("getUserTasks", () => {
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
  describe("updateTask", () => {
    it("throws error for unauthorized user", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Original Task",
        });

      await expect(
        t.mutation(api.taskManagement.updateTask, {
          taskId,
          taskName: "Updated Task",
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws error when trying to update another user's task", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "user-1" })
        .mutation(api.taskManagement.createTask, {
          taskName: "User 1 Task",
        });

      await expect(
        t
          .withIdentity({ subject: "user-2" })
          .mutation(api.taskManagement.updateTask, {
            taskId,
            taskName: "Hijacked Task",
          }),
      ).rejects.toThrow("Task not found");
    });

    it("successfully updates task with all fields", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Original Task",
          taskDescription: "Original Description",
          category: "Original Category",
          dueBy: "2024-12-31",
        });

      const updateResult = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.updateTask, {
          taskId,
          taskName: "Updated Task",
          taskDescription: "Updated Description",
          category: "Updated Category",
          dueBy: "2025-01-15",
          tags: ["tag1", "tag2", "tag3"],
        });

      expect(updateResult).toBe(taskId);

      const updatedTask = await t
        .withIdentity({ subject: "test-12345" })
        .query(api.taskManagement.getUserTasks);

      expect(updatedTask).toHaveLength(1);
      expect(updatedTask[0].taskName).toBe("Updated Task");
      expect(updatedTask[0].taskDescription).toBe("Updated Description");
      expect(updatedTask[0].category).toBe("Updated Category");
      expect(updatedTask[0].dueBy).toBe("2025-01-15");
      expect(updatedTask[0].tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("successfully updates task with only required field", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Original Task",
          taskDescription: "Original Description",
          category: "Original Category",
        });

      const updateResult = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.updateTask, {
          taskId,
          taskName: "New Task Name",
        });

      expect(updateResult).toBe(taskId);

      const updatedTask = await t
        .withIdentity({ subject: "test-12345" })
        .query(api.taskManagement.getUserTasks);

      expect(updatedTask).toHaveLength(1);
      expect(updatedTask[0].taskName).toBe("New Task Name");
      expect(updatedTask[0].taskDescription).toBe("Original Description"); // Should remain unchanged
      expect(updatedTask[0].category).toBe("Original Category"); // Should remain unchanged
    });
  });

  describe("deleteTask", () => {
    it("throws error for unauthorized user", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task to Delete",
        });

      await expect(
        t.mutation(api.taskManagement.deleteTask, {
          taskId,
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws error when trying to delete another user's task", async () => {
      const t = convexTest(schema, modules);
      const taskId = await t
        .withIdentity({ subject: "user-1" })
        .mutation(api.taskManagement.createTask, {
          taskName: "User 1 Task",
        });

      await expect(
        t
          .withIdentity({ subject: "user-2" })
          .mutation(api.taskManagement.deleteTask, {
            taskId,
          }),
      ).rejects.toThrow("Task not found");
    });

    it("successfully deletes task", async () => {
      const t = convexTest(schema, modules);

      // Create multiple tasks
      const taskId1 = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 1",
        });
      const taskId2 = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 2",
        });
      const taskId3 = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 3",
        });

      // Verify all tasks exist
      const tasksBefore = await t
        .withIdentity({ subject: "test-12345" })
        .query(api.taskManagement.getUserTasks);
      expect(tasksBefore).toHaveLength(3);

      // Delete middle task
      const deleteResult = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.deleteTask, {
          taskId: taskId2,
        });

      expect(deleteResult).toBe(taskId2);

      // Verify task was deleted
      const tasksAfter = await t
        .withIdentity({ subject: "test-12345" })
        .query(api.taskManagement.getUserTasks);
      expect(tasksAfter).toHaveLength(2);
      expect(tasksAfter.map((task) => task._id)).not.toContain(taskId2);
      expect(tasksAfter.map((task) => task.taskName)).toEqual(
        expect.arrayContaining(["Task 3", "Task 1"]),
      );
    });

    it("throws error when trying to delete non-existent task", async () => {
      const t = convexTest(schema, modules);
      const taskId1 = await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.createTask, {
          taskName: "Task 1",
        });

      await t
        .withIdentity({ subject: "test-12345" })
        .mutation(api.taskManagement.deleteTask, {
          taskId: taskId1,
        });
      await expect(
        t
          .withIdentity({ subject: "test-12345" })
          .mutation(api.taskManagement.deleteTask, {
            taskId: taskId1,
          }),
      ).rejects.toThrow("Task not found");
    });
  });
});
