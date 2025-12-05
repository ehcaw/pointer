import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("userTasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const createTask = mutation({
  args: {
    taskName: v.string(),
    taskDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    dueBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }

      const taskId = await ctx.db.insert("userTasks", {
        tenantId: identity.subject,
        taskName: args.taskName,
        taskDescription: args.taskDescription,
        category: args.category,
        dueBy: args.dueBy,
        completed: false,
        createdAt: new Date().toISOString(),
      });

      return taskId;
    } catch (error) {
      throw error;
    }
  },
});

export const toggleTaskComplete = mutation({
  args: {
    taskId: v.id("userTasks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== identity.subject) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(args.taskId, {
      completed: args.completed,
    });

    return args.taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("userTasks"),
    taskName: v.string(),
    taskDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    dueBy: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== identity.subject) {
      throw new Error("Task not found");
    }

    const updateData: any = {
      taskName: args.taskName,
    };

    if (args.taskDescription !== undefined)
      updateData.taskDescription = args.taskDescription;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.dueBy !== undefined) updateData.dueBy = args.dueBy;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.taskId, updateData);

    return args.taskId;
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id("userTasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== identity.subject) {
      throw new Error("Task not found");
    }

    await ctx.db.delete(args.taskId);

    return args.taskId;
  },
});
