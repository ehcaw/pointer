"use client";

import * as React from "react";
import { Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isPast, addDays } from "date-fns";

// UI Components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Store
import { useTasksStore } from "@/lib/stores/tasks-store";
import { useTaskManager } from "@/hooks/use-task-manager";
import { Doc } from "../../../convex/_generated/dataModel";

export function HomeView() {
  const { userTasks, isLoading } = useTasksStore();
  const {
    fetchTasks,
    createTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
    isCreating,
  } = useTaskManager();

  const [newTaskName, setNewTaskName] = React.useState("");
  const [editingTask, setEditingTask] = React.useState<Doc<"userTasks"> | null>(
    null,
  );
  const [editForm, setEditForm] = React.useState({
    taskName: "",
    taskDescription: "",
    dueBy: "",
    tags: [] as string[],
  });
  const [tagsInput, setTagsInput] = React.useState("");
  const [dueDatePickerOpen, setDueDatePickerOpen] = React.useState(false);

  // Fetch tasks on component mount
  React.useEffect(() => {
    fetchTasks();
  }, []);

  // Sort and organize tasks
  const organizedTasks = React.useMemo(() => {
    const today: Doc<"userTasks">[] = [];
    const general: Doc<"userTasks">[] = [];
    const thisWeek: Doc<"userTasks">[] = [];

    const sortedTasks = [...userTasks].sort((a, b) => {
      // Sort by completion status first (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    sortedTasks.forEach((task) => {
      if (task.dueBy) {
        const dueDate = new Date(task.dueBy);
        const weekFromNow = addDays(new Date(), 7);

        if (isToday(dueDate)) {
          today.push(task);
        } else if (dueDate <= weekFromNow && !isPast(dueDate)) {
          thisWeek.push(task);
        } else {
          general.push(task);
        }
      } else {
        general.push(task);
      }
    });

    return { today, general, thisWeek };
  }, [userTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const success = await createTask(newTaskName.trim());
    if (success) {
      setNewTaskName("");
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    await toggleTaskCompletion(taskId, completed);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleEditTask = (task: Doc<"userTasks">) => {
    setEditingTask(task);
    setEditForm({
      taskName: task.taskName,
      taskDescription: task.taskDescription || "",
      dueBy: task.dueBy || "",
      tags: task.tags || [],
    });
    setTagsInput((task.tags || []).join(", "));
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    const success = await updateTask(editingTask._id.toString(), {
      taskName: editForm.taskName,
      taskDescription: editForm.taskDescription || undefined,
      dueBy: editForm.dueBy || undefined,
      tags: editForm.tags.length > 0 ? editForm.tags : undefined,
    });

    if (success) {
      setEditingTask(null);
      setEditForm({
        taskName: "",
        taskDescription: "",
        dueBy: "",
        tags: [],
      });
      setTagsInput("");
    }
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setEditForm({
      taskName: "",
      taskDescription: "",
      dueBy: "",
      tags: [],
    });
    setTagsInput("");
    setDueDatePickerOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setEditForm((prev) => ({
        ...prev,
        dueBy: date.toISOString(),
      }));
    }
    setDueDatePickerOpen(false);
  };

  return (
    <div className="w-full p-4">
      <form onSubmit={handleCreateTask} className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="+ Add task"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            className="flex-1 border-0 focus:ring-0 bg-transparent text-lg placeholder:text-slate-400"
            disabled={isCreating}
          />
        </div>
      </form>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Today Section */}
          {organizedTasks.today.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                Today
              </h3>
              <div className="space-y-1">
                {organizedTasks.today.map((task) => (
                  <TaskItem
                    key={task._id.toString()}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* General Section */}
          {organizedTasks.general.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                General
              </h3>
              <div className="space-y-1">
                {organizedTasks.general.map((task) => (
                  <TaskItem
                    key={task._id.toString()}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* This Week Section */}
          {organizedTasks.thisWeek.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                This Week
              </h3>
              <div className="space-y-1">
                {organizedTasks.thisWeek.map((task) => (
                  <TaskItem
                    key={task._id.toString()}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {userTasks.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded">
                <input
                  type="checkbox"
                  disabled
                  className="h-5 w-5 rounded-full border-slate-300 text-slate-900"
                />
                <span className="flex-1 text-slate-300">
                  Welcome to your task manager
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded">
                <input
                  type="checkbox"
                  disabled
                  className="h-5 w-5 rounded-full border-slate-300 text-slate-900"
                />
                <span className="flex-1 text-slate-300">
                  Add a task above to get started
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded">
                <input
                  type="checkbox"
                  disabled
                  className="h-5 w-5 rounded-full border-slate-300 text-slate-900"
                />
                <span className="flex-1 text-slate-300">
                  Click on any task to mark it complete
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={handleCloseEdit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="taskName">Task name</Label>
              <Input
                id="taskName"
                value={editForm.taskName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, taskName: e.target.value }))
                }
                placeholder="Enter task name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taskDescription">Description (optional)</Label>
              <Textarea
                id="taskDescription"
                value={editForm.taskDescription}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    taskDescription: e.target.value,
                  }))
                }
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setTagsInput(inputValue);
                  const tags = inputValue.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
                  setEditForm((prev) => ({ 
                    ...prev, 
                    tags: tags
                  }));
                }}
                placeholder="urgent, work, personal (comma separated)"
              />
            </div>

            <div className="grid gap-2">
              <Label>Due date (optional)</Label>
              <Popover
                open={dueDatePickerOpen}
                onOpenChange={setDueDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editForm.dueBy && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.dueBy
                      ? format(new Date(editForm.dueBy), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      editForm.dueBy ? new Date(editForm.dueBy) : undefined
                    }
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskItem({
  task,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
}: {
  task: Doc<"userTasks">;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Doc<"userTasks">) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900 group">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) =>
          onToggleComplete(task._id.toString(), e.target.checked)
        }
        className="h-5 w-5 rounded-full border-slate-300 text-slate-900 focus:ring-slate-900"
      />

      <div className="flex-1">
        <span
          className={cn(
            "cursor-pointer",
            task.completed && "line-through text-slate-400",
          )}
          onClick={() => onToggleComplete(task._id.toString(), !task.completed)}
        >
          {task.taskName}
        </span>
        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onEditTask(task)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        <button
          onClick={() => onDeleteTask(task._id.toString())}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
