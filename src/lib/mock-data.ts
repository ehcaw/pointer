import type { NodeType, Edge } from "./types";

export const mockNodes: NodeType[] = [
  {
    id: "1",
    type: "thought",
    text: "The intersection of AI and creativity is fascinating. We're seeing tools that augment human creativity rather than replace it.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    tags: ["ai", "creativity", "technology"],
  },
  {
    id: "2",
    type: "bookmark",
    url: "https://www.nature.com/articles/s41586-023-06647-8",
    title: "Large language models encode clinical knowledge",
    description:
      "Research paper on how LLMs can be used in medical diagnosis and clinical decision making.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    tags: ["ai", "medicine", "research", "llm"],
  },
  {
    id: "3",
    type: "thought",
    text: "Personal knowledge management is becoming more important as information overload increases. We need better tools to connect ideas.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    tags: ["pkm", "productivity", "knowledge-work"],
  },
  {
    id: "4",
    type: "bookmark",
    url: "https://reactflow.dev/docs/introduction",
    title: "React Flow Documentation",
    description:
      "Highly customizable library for building interactive node-based UIs, editors, flow charts and diagrams.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    tags: ["react", "visualization", "development"],
  },
  {
    id: "5",
    type: "media",
    platform: "twitter",
    url: "https://twitter.com/example/status/123",
    caption:
      "Thread about the future of human-computer interaction and how spatial computing will change everything.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    tags: ["hci", "spatial-computing", "future"],
  },
  {
    id: "6",
    type: "thought",
    text: "Graph databases are perfect for knowledge management. The relationships between concepts are as important as the concepts themselves.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    tags: ["databases", "graphs", "knowledge-work"],
  },
  {
    id: "7",
    type: "bookmark",
    url: "https://obsidian.md",
    title: "Obsidian - A second brain, for you, forever",
    description:
      "Obsidian is a powerful knowledge base on top of a local folder of plain text Markdown files.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    tags: ["pkm", "obsidian", "note-taking"],
  },
  {
    id: "8",
    type: "thought",
    text: "The best ideas come from connecting seemingly unrelated concepts. Serendipity is key to innovation.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    tags: ["creativity", "innovation", "serendipity"],
  },
  {
    id: "9",
    type: "media",
    platform: "instagram",
    url: "https://instagram.com/p/example",
    caption:
      "Beautiful visualization of complex systems and emergence patterns in nature.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    tags: ["visualization", "complexity", "nature"],
  },
  {
    id: "10",
    type: "bookmark",
    url: "https://www.youtube.com/watch?v=example",
    title: "The Network Effects of Knowledge",
    description:
      "How connected knowledge creates exponential value and accelerates learning.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    tags: ["network-effects", "learning", "knowledge-work"],
  },
];

export const mockEdges: Edge[] = [
  {
    id: "e1-3",
    from: "1",
    to: "3",
    kind: "SIMILAR_TO",
  },
  {
    id: "e3-6",
    from: "3",
    to: "6",
    kind: "SIMILAR_TO",
  },
  {
    id: "e6-7",
    from: "6",
    to: "7",
    kind: "LINKS_TO",
  },
  {
    id: "e1-8",
    from: "1",
    to: "8",
    kind: "SIMILAR_TO",
  },
  {
    id: "e8-9",
    from: "8",
    to: "9",
    kind: "MENTIONS",
  },
  {
    id: "e3-10",
    from: "3",
    to: "10",
    kind: "LINKS_TO",
  },
  {
    id: "e2-1",
    from: "2",
    to: "1",
    kind: "SIMILAR_TO",
  },
];
