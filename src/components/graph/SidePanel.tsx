"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Hash,
  Calendar,
  Type,
  LinkIcon,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BaseNode } from "@/lib/types";

interface SidePanelProps {
  node: BaseNode;
  relatedNodes: BaseNode[];
  onClose: () => void;
  onUpdate: (node: BaseNode) => void;
  onDelete: (nodeId: string) => void;
}

export function SidePanel({
  node,
  relatedNodes,
  onClose,
  onUpdate,
  onDelete,
}: SidePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNode, setEditedNode] = useState(node);

  const handleSave = () => {
    onUpdate(editedNode);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNode(node);
    setIsEditing(false);
  };

  const addTag = (tag: string) => {
    if (tag && !editedNode.tags.includes(tag)) {
      setEditedNode((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (tag: string) => {
    setEditedNode((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const getIcon = () => {
    switch (node.type) {
      case "thought":
        return <Type className="h-5 w-5 text-blue-500" />;
      case "bookmark":
        return <LinkIcon className="h-5 w-5 text-green-500" />;
      case "media":
        return <ImageIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-80 lg:w-96 bg-background border-l shadow-lg flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-medium capitalize">{node.type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(node.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(node.createdAt)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Content */}
        <div className="space-y-3">
          {node.type === "thought" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Thought</label>
              {isEditing ? (
                <Textarea
                  value={editedNode.type === "thought" ? editedNode.text : ""}
                  onChange={(e) =>
                    setEditedNode(
                      (prev) =>
                        ({
                          ...prev,
                          text: e.target.value,
                        }) as any,
                    )
                  }
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-sm leading-relaxed p-3 bg-muted rounded-lg">
                  {node.type === "thought" ? node.text : ""}
                </p>
              )}
            </div>
          )}

          {node.type === "bookmark" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                {isEditing ? (
                  <Input
                    value={
                      editedNode.type === "bookmark" ? editedNode.title : ""
                    }
                    onChange={(e) =>
                      setEditedNode(
                        (prev) =>
                          ({
                            ...prev,
                            title: e.target.value,
                          }) as any,
                      )
                    }
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {node.type === "bookmark" ? node.title : ""}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={node.type === "bookmark" ? node.url : ""}
                    readOnly={!isEditing}
                    onChange={
                      isEditing
                        ? (e) =>
                            setEditedNode(
                              (prev) =>
                                ({
                                  ...prev,
                                  url: e.target.value,
                                }) as any,
                            )
                        : undefined
                    }
                    className="flex-1"
                  />
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        window.open(
                          node.type === "bookmark" ? node.url : "",
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {((node.type === "bookmark" && node.description) ||
                isEditing) && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={
                        editedNode.type === "bookmark"
                          ? editedNode.description || ""
                          : ""
                      }
                      onChange={(e) =>
                        setEditedNode(
                          (prev) =>
                            ({
                              ...prev,
                              description: e.target.value,
                            }) as any,
                        )
                      }
                      placeholder="Add a description..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {node.type === "bookmark" ? node.description : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Tags
          </label>

          <div className="flex flex-wrap gap-2">
            {editedNode.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={isEditing ? "cursor-pointer" : ""}
                onClick={isEditing ? () => removeTag(tag) : undefined}
              >
                {tag} {isEditing && "×"}
              </Badge>
            ))}
          </div>

          {isEditing && (
            <Input
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
          )}
        </div>

        {/* Related Nodes */}
        {relatedNodes.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Related Nodes</label>
            <div className="space-y-2">
              {relatedNodes.map((relatedNode) => (
                <Card
                  key={relatedNode.id}
                  className="cursor-pointer hover:bg-accent"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {relatedNode.type === "thought" && (
                        <Type className="h-3 w-3 text-blue-500" />
                      )}
                      {relatedNode.type === "bookmark" && (
                        <LinkIcon className="h-3 w-3 text-green-500" />
                      )}
                      {relatedNode.type === "media" && (
                        <ImageIcon className="h-3 w-3 text-purple-500" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {relatedNode.type}
                      </span>
                    </div>
                    <p className="text-sm truncate">
                      {relatedNode.type === "thought"
                        ? relatedNode.text
                        : relatedNode.type === "bookmark"
                          ? relatedNode.title
                          : relatedNode.caption}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
