"use client";

import React, { useState } from "react";
import { Plus, FileText, FolderPlus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFolderOperations } from "@/hooks/use-folder-operations";
import { toast } from "sonner";

interface CreatePopoverProps {
  onCreateNote: () => void;
  parentId?: string;
  className?: string;
}

export function CreatePopover({
  onCreateNote,
  parentId,
  className,
}: CreatePopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { createFolder: createFolderWithMutation } = useFolderOperations();

  const handleCreateNote = () => {
    onCreateNote();
    setOpen(false);
  };

  const handleCreateFolder = () => {
    setOpen(false);
    setIsCreateDialogOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      await createFolderWithMutation(newFolderName.trim(), parentId);
      setNewFolderName("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-lg border-dashed hover:bg-primary/5 hover:border-primary/20 transition-colors",
              className,
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Create new item</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-44 p-1 shadow-lg border-border/40"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNote}
              className="w-full justify-start h-8 px-2 text-sm font-normal hover:bg-accent/50"
            >
              <FileText className="mr-2 h-4 w-4" />
              New Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              className="w-full justify-start h-8 px-2 text-sm font-normal hover:bg-accent/50"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="folder-name" className="text-sm font-medium">
                Folder Name
              </label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolderSubmit();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolderSubmit}
              disabled={!newFolderName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
