"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaptureModal } from "../graph/CaptureModal";
import { GraphCanvas } from "../graph/GraphCanvas";
import { SidePanel } from "../graph/SidePanel";
import { TimelineView } from "../graph/TimelineView";
import { SearchOverlay } from "../graph/SearchOverlay";
import { TagExplorer } from "../graph/TagExplorer";
import { mockNodes, mockEdges } from "@/lib/mock-data";
import { ThemeToggle } from "../theme-toggle";
import type { NodeType } from "@/lib/types";

export default function GraphView() {
  const [view, setView] = useState<"graph" | "timeline">("graph");
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nodes, setNodes] = useState(mockNodes);
  const [edges, setEdges] = useState(mockEdges);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter nodes based on selected tags
  const filteredNodes =
    selectedTags.length > 0
      ? nodes.filter((node) =>
          selectedTags.some((tag) => node.tags.includes(tag)),
        )
      : nodes;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowCapture(false);
        setSelectedNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAddNode = (newNode: NodeType) => {
    setNodes((prev) => [newNode, ...prev]);
    setShowCapture(false);
  };

  const handleUpdateNode = (updatedNode: NodeType) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) =>
      prev.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
    );
    setSelectedNode(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const allTags = Array.from(new Set(nodes.flatMap((node) => node.tags)));

  return (
    <div className="bg-background">
      {/* Top Bar */}
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your Neural Network
            </h1>
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={view === "graph" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("graph")}
              >
                Graph
              </Button>
              <Button
                variant={view === "timeline" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("timeline")}
              >
                Timeline
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(true)}
              className="hidden md:flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">⌘K</span>
            </Button>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t md:hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={view === "graph" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setView("graph");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1"
                  >
                    Graph
                  </Button>
                  <Button
                    variant={view === "timeline" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setView("timeline");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1"
                  >
                    Timeline
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowSearch(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-8rem)] flex overflow-hidden">
        {/* Desktop Tag Explorer */}
        <div className="hidden lg:block w-64 border-r bg-muted/30">
          <TagExplorer
            tags={allTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
          />
        </div>

        {/* Main View */}
        <div className="flex-1 relative">
          {view === "graph" ? (
            <GraphCanvas
              nodes={filteredNodes}
              edges={edges}
              onNodeClick={setSelectedNode}
            />
          ) : (
            <TimelineView nodes={filteredNodes} onNodeClick={setSelectedNode} />
          )}

          {/* Mobile Tag Filter */}
          {selectedTags.length > 0 && (
            <div className="absolute top-4 left-4 right-4 lg:hidden">
              <div className="flex flex-wrap gap-2 p-3 bg-background/95 backdrop-blur rounded-lg border">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {selectedNode && (
            <SidePanel
              node={selectedNode}
              relatedNodes={nodes
                .filter((n) => n.id !== selectedNode.id)
                .slice(0, 5)}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          onClick={() => setShowCapture(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Modals */}
      <CaptureModal
        isOpen={showCapture}
        onClose={() => setShowCapture(false)}
        onSubmit={handleAddNode}
        availableTags={allTags}
      />

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        nodes={nodes}
        onNodeSelect={setSelectedNode}
      />
    </div>
  );
}
