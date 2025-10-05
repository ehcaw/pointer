import { useState } from "react";
import { useConvex } from "convex/react";
import { useTasksStore } from "@/lib/stores/tasks-store";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Custom hook to manage task operations.
 * Handles task creation, completion, and deletion.
 */
export function useTaskManager() {
  const convex = useConvex();
  const {
    setUserTasks,
    setIsLoading,
    removeTask,
    toggleTaskComplete: toggleComplete,
  } = useTasksStore();

  const [isCreating, setIsCreating] = useState(false);

  // Fetch tasks from database
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const tasks = await convex.query(api.taskManagement.getUserTasks);
      setUserTasks(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new task
  const createTask = async (
    taskName: string,
    taskDescription?: string,
    category?: string,
    dueBy?: string,
  ) => {
    if (!taskName.trim()) return null;

    setIsCreating(true);
    try {
      const taskId = await convex.mutation(api.taskManagement.createTask, {
        taskName: taskName.trim(),
        taskDescription,
        category,
        dueBy,
      });

      // Fetch updated tasks
      await fetchTasks();

      return taskId;
    } catch (error) {
      console.error("Error creating task:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await convex.mutation(api.taskManagement.toggleTaskComplete, {
        taskId: taskId as Id<"userTasks">, // Convex ID type
        completed,
      });

      // Update local state optimistically
      toggleComplete(taskId);
    } catch (error) {
      console.error("Error toggling task completion:", error);
      // Revert on error
      toggleComplete(taskId);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      await convex.mutation(api.taskManagement.deleteTask, {
        taskId: taskId as Id<"userTasks">, // Convex ID type
      });

      // Update local state
      removeTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Update a task
  const updateTask = async (
    taskId: string,
    updates: {
      taskName: string;
      taskDescription?: string;
      category?: string;
      dueBy?: string;
      tags?: string[];
    }
  ) => {
    try {
      await convex.mutation(api.taskManagement.updateTask, {
        taskId: taskId as Id<"userTasks">,
        ...updates,
      });

      // Refetch tasks to get updated data
      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  };

  return {
    isCreating,
    fetchTasks,
    createTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
  };
}
