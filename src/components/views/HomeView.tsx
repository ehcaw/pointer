"use client";

import * as React from "react";
import { Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
    isCreating,
  } = useTaskManager();

  const [newTaskName, setNewTaskName] = React.useState("");
  const [editingTask, setEditingTask] = React.useState<Doc<"userTasks"> | null>(
    null,
  );
  const [editForm, setEditForm] = React.useState({
    taskName: "",
    taskDescription: "",
    category: "",
    dueBy: "",
  });
  const [dueDatePickerOpen, setDueDatePickerOpen] = React.useState(false);

  // Fetch tasks on component mount
  React.useEffect(() => {
    fetchTasks();
  }, []);

  // Show all tasks - don't filter out completed ones
  const visibleTasks = React.useMemo(() => {
    return userTasks;
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
      category: task.category || "",
      dueBy: task.dueBy || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    // Here you would update the task via your task manager
    // For now, just close the modal
    setEditingTask(null);
    setEditForm({
      taskName: "",
      taskDescription: "",
      category: "",
      dueBy: "",
    });
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setEditForm({
      taskName: "",
      taskDescription: "",
      category: "",
      dueBy: "",
    });
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
    <div className="max-w-2xl mx-auto p-4">
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
        <div className="space-y-1">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task._id.toString()}
              task={task}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          ))}

          {visibleTasks.length === 0 && (
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
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="Personal, Work, etc."
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

      <span
        className={cn(
          "flex-1 cursor-pointer",
          task.completed && "line-through text-slate-400",
        )}
        onClick={() => onToggleComplete(task._id.toString(), !task.completed)}
      >
        {task.taskName}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEditTask(task)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600"
        >
          <svg
            className="h-4 w-4"
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
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
