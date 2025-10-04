import { create } from "zustand";
import { Doc } from "../../../convex/_generated/dataModel";

interface TasksStore {
  // Core task collections
  userTasks: Doc<"userTasks">[];
  isLoading: boolean;

  // Basic state setters
  setUserTasks: (tasks: Doc<"userTasks">[]) => void;
  setIsLoading: (isLoading: boolean) => void;

  // Task management
  addTask: (task: Doc<"userTasks">) => void;
  updateTask: (taskId: string, updates: Partial<Doc<"userTasks">>) => void;
  removeTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  // Core task collections
  userTasks: [],
  isLoading: false,

  // Basic state setters
  setUserTasks: (tasks: Doc<"userTasks">[]) => set({ userTasks: tasks }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  // Task management
  addTask: (task: Doc<"userTasks">) => {
    const state = get();
    set({ userTasks: [task, ...state.userTasks] });
  },

  updateTask: (taskId: string, updates: Partial<Doc<"userTasks">>) => {
    const state = get();
    const userTasks = state.userTasks.map((task) =>
      task._id.toString() === taskId ? { ...task, ...updates } : task,
    );
    set({ userTasks });
  },

  removeTask: (taskId: string) => {
    const state = get();
    const userTasks = state.userTasks.filter(
      (task) => task._id.toString() !== taskId,
    );
    set({ userTasks });
  },

  toggleTaskComplete: (taskId: string) => {
    const state = get();
    const userTasks = state.userTasks.map((task) =>
      task._id.toString() === taskId
        ? { ...task, completed: !task.completed }
        : task,
    );
    set({ userTasks });
  },
}));
