"use client";

import { useCallback, useEffect } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Connection,
  type NodeTypes,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import { Type, LinkIcon, ImageIcon, Hash } from "lucide-react";
import type { NodeType } from "@/lib/types";
import type { Edge as GraphEdge } from "@/types/note";

interface GraphCanvasProps {
  nodes: NodeType[];
  edges: GraphEdge[];
  onNodeClick: (node: NodeType) => void;
}

interface CustomNodeData {
  type: "thought" | "bookmark" | "media" | string;
  originalNode: NodeType;
  onClick: (node: NodeType) => void;
  // Add any other properties that might be passed in the data object
  id?: string;
  text?: string;
  title?: string;
  caption?: string;
  tags?: string[];
}

// Custom node component - moved outside of the main component
function CustomNode({ data }: { data: CustomNodeData }) {
  const getIcon = () => {
    switch (data.type) {
      case "thought":
        return <Type className="h-4 w-4" />;
      case "bookmark":
        return <LinkIcon className="h-4 w-4" />;
      case "media":
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getColor = () => {
    switch (data.type) {
      case "thought":
        return "from-blue-500 to-cyan-500";
      case "bookmark":
        return "from-green-500 to-emerald-500";
      case "media":
        return "from-purple-500 to-pink-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-2xl border-2 border-white/20 bg-gradient-to-br ${getColor()} text-white shadow-lg cursor-pointer min-w-[120px] max-w-[200px]`}
      onClick={() => data.onClick(data.originalNode)}
    >
      <div className="flex items-center gap-2 mb-1">
        {getIcon()}
        <span className="text-xs font-medium capitalize">{data.type}</span>
      </div>
      <div className="text-sm font-medium truncate">
        {data.type === "thought"
          ? (data.originalNode as import("@/lib/types").ThoughtNode).text
          : data.type === "bookmark"
            ? (data.originalNode as import("@/lib/types").BookmarkNode).title
            : data.type === "media"
              ? (data.originalNode as import("@/lib/types").MediaNode).caption
              : "Unknown"}
      </div>
      {data.originalNode.tags && data.originalNode.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.originalNode.tags.slice(0, 2).map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-white/20 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {data.originalNode.tags.length > 2 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              +{data.originalNode.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Define nodeTypes outside the component
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export function GraphCanvas({ nodes, edges, onNodeClick }: GraphCanvasProps) {
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  // Convert our nodes to ReactFlow format
  useEffect(() => {
    const flowNodes: Node[] = nodes.map((node, index) => ({
      id: node.id,
      type: "custom",
      // Better initial positioning - spiral layout with more spacing
      position: {
        x: Math.cos(index * (Math.PI * 0.5)) * 300 + Math.random() * 50,
        y: Math.sin(index * (Math.PI * 0.5)) * 300 + Math.random() * 50,
      },
      data: {
        ...node,
        originalNode: node,
        onClick: onNodeClick,
      },
    }));

    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: "smoothstep",
      animated: true,
      // Ensure source and target handles are defined (fixes edge creation warning)
      sourceHandle: null, // Use null instead of undefined
      targetHandle: null, // Use null instead of undefined
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#8b5cf6",
      },
      label: edge.kind.replace("_", " ").toLowerCase(),
      labelStyle: { fontSize: 10, fontWeight: 500 },
      labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
    }));

    setReactFlowNodes(flowNodes);
    setReactFlowEdges(flowEdges);
  }, [nodes, edges, onNodeClick, setReactFlowNodes, setReactFlowEdges]);

  const onConnect = useCallback(
    (params: Connection) => setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  if (nodes.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900"
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
      >
        <div className="text-center space-y-4">
          <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Hash className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Your Knowledge Graph Awaits</h3>
          <p className="text-muted-foreground max-w-md">
            Start building your personal knowledge network by capturing
            thoughts, bookmarks, and ideas.
          </p>
          <div className="text-sm text-muted-foreground">
            Click the <span className="font-medium">+</span> button to add your
            first node
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900"
      style={{ width: "100%", height: "100%", minHeight: "500px" }}
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls className="bg-background border rounded-lg" />
        <Background color="#8b5cf6" size={1} />
      </ReactFlow>
    </div>
  );
}
