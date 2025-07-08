"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Command, Type, LinkIcon, ImageIcon, Hash } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BaseNode } from "@/lib/types";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: BaseNode[];
  onNodeSelect: (node: BaseNode) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  nodes,
  onNodeSelect,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Reset query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  // Search and filter logic
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();

    let filteredNodes = nodes.filter((node) => {
      // Search in content
      const contentMatch =
        (node.type === "thought" &&
          node.text.toLowerCase().includes(searchTerm)) ||
        (node.type === "bookmark" &&
          (node.title.toLowerCase().includes(searchTerm) ||
            node.url.toLowerCase().includes(searchTerm) ||
            (node.description &&
              node.description.toLowerCase().includes(searchTerm)))) ||
        (node.type === "media" &&
          node.caption.toLowerCase().includes(searchTerm));

      // Search in tags
      const tagMatch = node.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm),
      );

      return contentMatch || tagMatch;
    });

    // Filter by type if not "all"
    if (activeTab !== "all") {
      filteredNodes = filteredNodes.filter((node) => node.type === activeTab);
    }

    // Sort by relevance (exact matches first, then partial matches)
    return filteredNodes.sort((a, b) => {
      const getRelevanceScore = (node: BaseNode) => {
        let score = 0;
        const content =
          node.type === "thought"
            ? node.text
            : node.type === "bookmark"
              ? `${node.title} ${node.description || ""}`
              : node.caption;

        // Exact match in content
        if (content.toLowerCase() === searchTerm) score += 100;
        // Starts with search term
        else if (content.toLowerCase().startsWith(searchTerm)) score += 50;
        // Contains search term
        else if (content.toLowerCase().includes(searchTerm)) score += 25;

        // Tag matches
        node.tags.forEach((tag) => {
          if (tag.toLowerCase() === searchTerm) score += 75;
          else if (tag.toLowerCase().startsWith(searchTerm)) score += 40;
          else if (tag.toLowerCase().includes(searchTerm)) score += 20;
        });

        return score;
      };

      return getRelevanceScore(b) - getRelevanceScore(a);
    });
  }, [query, nodes, activeTab]);

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

  const handleNodeSelect = (node: BaseNode) => {
    onNodeSelect(node);
    onClose();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 rounded px-1"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search thoughts, bookmarks, and tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 text-base"
            autoFocus
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>

        {/* Search Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="thought"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Thoughts
            </TabsTrigger>
            <TabsTrigger
              value="bookmark"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Bookmarks
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="max-h-96 overflow-y-auto">
              {query.trim() === "" ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start typing to search your knowledge graph</p>
                  <p className="text-sm mt-1">
                    Search across thoughts, bookmarks, and tags
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-1">
                    Try different keywords or check your spelling
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {searchResults.map((node, index) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-accent cursor-pointer"
                      onClick={() => handleNodeSelect(node)}
                    >
                      <div className="flex items-start gap-3">
                        {getIcon(node.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium capitalize">
                              {node.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(node.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {node.type === "thought" && (
                              <p className="text-sm leading-relaxed">
                                {highlightMatch(node.text, query)}
                              </p>
                            )}

                            {node.type === "bookmark" && (
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm">
                                  {highlightMatch(node.title, query)}
                                </h4>
                                {node.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {highlightMatch(node.description, query)}
                                  </p>
                                )}
                              </div>
                            )}

                            {node.type === "media" && (
                              <p className="text-sm">
                                {highlightMatch(node.caption, query)}
                              </p>
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
                                    {highlightMatch(tag, query)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div>
            {searchResults.length > 0 && (
              <span>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
