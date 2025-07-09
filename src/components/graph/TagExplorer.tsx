"use client";

import { useState } from "react";
import { Hash, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagExplorerProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export function TagExplorer({
  tags,
  selectedTags,
  onToggleTag,
}: TagExplorerProps) {
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onToggleTag(newTag.trim());
      setNewTag("");
      setShowAddTag(false);
    }
  };

  const sortedTags = [...tags].sort((a, b) => {
    // Selected tags first, then alphabetical
    const aSelected = selectedTags.includes(a);
    const bSelected = selectedTags.includes(b);

    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Tags</h2>
        </div>

        {selectedTags.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedTags.length} selected
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {/* Add New Tag */}
          {showAddTag ? (
            <div className="flex gap-2">
              <Input
                placeholder="New tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag();
                  } else if (e.key === "Escape") {
                    setShowAddTag(false);
                    setNewTag("");
                  }
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
              >
                Add
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddTag(true)}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          )}

          {/* Existing Tags */}
          {sortedTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tags yet</p>
              <p className="text-xs mt-1">
                Tags will appear here as you add them to your nodes
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className="cursor-pointer w-full justify-start text-left hover:bg-accent transition-colors"
                  onClick={() => onToggleTag(tag)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Clear Filters */}
      {selectedTags.length > 0 && (
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedTags.forEach((tag) => onToggleTag(tag))}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
