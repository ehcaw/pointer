"use client";

import { useState } from "react";
import { LinkIcon, Type, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BaseNode, Thought, Bookmark } from "@/lib/types";

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (node: BaseNode) => void;
  availableTags: string[];
}

export function CaptureModal({
  isOpen,
  onClose,
  onSubmit,
  availableTags,
}: CaptureModalProps) {
  const [activeTab, setActiveTab] = useState<"thought" | "bookmark">("thought");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleSubmit = () => {
    if (activeTab === "thought" && !text.trim()) return;
    if (activeTab === "bookmark" && !url.trim()) return;

    const baseNode = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      tags,
    };

    let node: BaseNode;
    if (activeTab === "thought") {
      node = {
        ...baseNode,
        type: "thought",
        text: text.trim(),
      } as Thought;
    } else {
      node = {
        ...baseNode,
        type: "bookmark",
        url: url.trim(),
        title: title.trim() || new URL(url).hostname,
        description: description.trim(),
      } as Bookmark;
    }

    onSubmit(node);
    resetForm();
  };

  const resetForm = () => {
    setText("");
    setUrl("");
    setTitle("");
    setDescription("");
    setTags([]);
    setNewTag("");
    setActiveTab("thought");
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const filteredAvailableTags = availableTags.filter(
    (tag) =>
      !tags.includes(tag) && tag.toLowerCase().includes(newTag.toLowerCase()),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Type className="h-4 w-4 text-white" />
            </div>
            Quick Capture
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "thought" | "bookmark")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="thought" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Thought
            </TabsTrigger>
            <TabsTrigger value="bookmark" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Bookmark
            </TabsTrigger>
          </TabsList>

          <TabsContent value="thought" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={280}
                className="min-h-[100px] resize-none"
                autoFocus
              />
              <div className="text-right text-sm text-muted-foreground">
                {text.length}/280
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookmark" className="space-y-4">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
            />
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </TabsContent>
        </Tabs>

        {/* Tags Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags</span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}

          <div className="relative">
            <Input
              placeholder="Add tags..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(newTag);
                }
              }}
            />

            {newTag && filteredAvailableTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 max-h-32 overflow-y-auto">
                {filteredAvailableTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={
              (activeTab === "thought" && !text.trim()) ||
              (activeTab === "bookmark" && !url.trim())
            }
          >
            Add to Graph
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
