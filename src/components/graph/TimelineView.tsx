"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Type,
  LinkIcon,
  ImageIcon,
  Calendar,
  Hash,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BaseNode } from "@/lib/types";

interface TimelineViewProps {
  nodes: BaseNode[];
  onNodeClick: (node: BaseNode) => void;
}

export function TimelineView({ nodes, onNodeClick }: TimelineViewProps) {
  // Group nodes by date
  const groupedNodes = useMemo(() => {
    const groups: Record<string, BaseNode[]> = {};

    nodes.forEach((node) => {
      const date = new Date(node.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(node);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
    );

    return sortedGroups;
  }, [nodes]);

  const getIcon = (type: string) => {
    switch (type) {
      case "thought":
        return <Type className="h-4 w-4 text-blue-500" />;
      case "bookmark":
        return <LinkIcon className="h-4 w-4 text-green-500" />;
      case "media":
        return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">No Entries Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Your timeline will show all your thoughts and bookmarks in
            chronological order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {groupedNodes.map(([date, dayNodes]) => (
          <div key={date} className="space-y-4">
            {/* Date Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                {formatDate(date)}
                <span className="text-sm text-muted-foreground font-normal">
                  ({dayNodes.length} {dayNodes.length === 1 ? "item" : "items"})
                </span>
              </h2>
            </div>

            {/* Nodes for this day */}
            <div className="space-y-3">
              {dayNodes
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon and Time */}
                          <div className="flex flex-col items-center gap-1 pt-1">
                            {getIcon(node.type)}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(node.createdAt)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium capitalize">
                                {node.type}
                              </span>
                              {node.type === "bookmark" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (node.type === "bookmark") {
                                      window.open(node.url, "_blank");
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            <div
                              className="space-y-2 cursor-pointer"
                              onClick={() => onNodeClick(node)}
                            >
                              {node.type === "thought" && (
                                <p className="text-sm leading-relaxed">
                                  {node.text}
                                </p>
                              )}

                              {node.type === "bookmark" && (
                                <div className="space-y-1">
                                  <h4 className="font-medium text-sm">
                                    {node.title}
                                  </h4>
                                  {node.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {node.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground truncate">
                                    {node.url}
                                  </p>
                                </div>
                              )}

                              {node.type === "media" && (
                                <div className="space-y-1">
                                  <p className="text-sm">{node.caption}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {node.platform} • {node.url}
                                  </p>
                                </div>
                              )}

                              {/* Tags */}
                              {node.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {node.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
