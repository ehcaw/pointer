export interface BaseNode {
  id: string;
  type: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ThoughtNode extends BaseNode {
  type: "thought";
  text: string;
}

export interface BookmarkNode extends BaseNode {
  type: "bookmark";
  title: string;
  url: string;
  description?: string;
}

export interface MediaNode extends BaseNode {
  type: "media";
  caption: string;
  url: string;
  platform: "twitter" | "instagram";
}

export type NodeType = ThoughtNode | BookmarkNode | MediaNode;

export type Edge = {
  id: string;
  from: string;
  to: string;
  kind: "SIMILAR_TO" | "TAGGED_AS" | "LINKS_TO" | "MENTIONS";
};
