import { Editor } from "@tiptap/react";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon?: string;
  command: (props: {
    editor: Editor;
    range: { from: number; to: number };
  }) => void;
  keywords?: string[]; // Additional keywords for search
  category?: string; // Category for grouping
  priority?: number; // Priority for sorting (higher = first)
}

export interface SlashCommandRegistry {
  register(item: SlashCommandItem): void;
  unregister(title: string): void;
  getItems(): SlashCommandItem[];
  getItemsByCategory(category: string): SlashCommandItem[];
  search(query: string): SlashCommandItem[];
}

class SlashCommandRegistryImpl implements SlashCommandRegistry {
  private items: SlashCommandItem[] = [];

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    // Core formatting commands
    this.register({
      title: "Bold",
      description: "Make text bold",
      icon: "bold",
      keywords: ["bold", "strong", "weight", "b"],
      category: "formatting",
      priority: 10,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBold().run();
      },
    });

    this.register({
      title: "Italic",
      description: "Make text italic",
      icon: "italic",
      keywords: ["italic", "emphasis", "style", "i"],
      category: "formatting",
      priority: 9,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleItalic().run();
      },
    });

    this.register({
      title: "Strike",
      description: "Strikethrough text",
      icon: "strike",
      keywords: ["strike", "strikethrough", "delete", "s"],
      category: "formatting",
      priority: 8,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleStrike().run();
      },
    });

    this.register({
      title: "Code",
      description: "Inline code",
      icon: "code",
      keywords: ["code", "inline", "monospace", "c"],
      category: "formatting",
      priority: 7,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCode().run();
      },
    });

    this.register({
      title: "Underline",
      description: "Underline text",
      icon: "underline",
      keywords: ["underline", "under", "u"],
      category: "formatting",
      priority: 6,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleUnderline().run();
      },
    });

    // Headings
    this.register({
      title: "Heading 1",
      description: "Big section heading",
      icon: "h1",
      keywords: ["heading", "h1", "title", "large", "big"],
      category: "headings",
      priority: 10,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    });

    this.register({
      title: "Heading 2",
      description: "Medium section heading",
      icon: "h2",
      keywords: ["heading", "h2", "subtitle", "medium"],
      category: "headings",
      priority: 9,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    });

    this.register({
      title: "Heading 3",
      description: "Small section heading",
      icon: "h3",
      keywords: ["heading", "h3", "small", "minor"],
      category: "headings",
      priority: 8,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    });

    // Lists
    this.register({
      title: "Bullet List",
      description: "Create a bullet list",
      icon: "bulletList",
      keywords: ["list", "bullet", "unordered", "points", "ul"],
      category: "lists",
      priority: 10,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    });

    this.register({
      title: "Ordered List",
      description: "Create an ordered list",
      icon: "orderedList",
      keywords: ["list", "ordered", "numbered", "sequence", "ol"],
      category: "lists",
      priority: 9,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    });

    this.register({
      title: "Task List",
      description: "Create a task list",
      icon: "taskList",
      keywords: ["list", "task", "todo", "checkbox", "tasks"],
      category: "lists",
      priority: 8,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    });

    // Blocks
    this.register({
      title: "Blockquote",
      description: "Create a blockquote",
      icon: "blockquote",
      keywords: ["quote", "blockquote", "citation", "bq"],
      category: "blocks",
      priority: 10,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    });

    this.register({
      title: "Code Block",
      description: "Create a code block",
      icon: "codeBlock",
      keywords: ["code", "block", "preformatted", "monospace", "pre"],
      category: "blocks",
      priority: 9,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    });

    // Media
    this.register({
      title: "Image",
      description: "Insert an image",
      icon: "image",
      keywords: ["image", "picture", "photo", "media", "img"],
      category: "media",
      priority: 10,
      command: ({ editor, range }) => {
        // Image upload is handled in the slash command popup
        editor.chain().focus().deleteRange(range).run();
      },
    });

    this.register({
      title: "Link",
      description: "Create a link",
      icon: "link",
      keywords: ["link", "url", "hyperlink", "external", "a"],
      category: "media",
      priority: 9,
      command: ({ editor, range }) => {
        const url = window.prompt("Enter URL");
        if (url) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setLink({ href: url })
            .run();
        }
      },
    });

    this.register({
      title: "Table",
      description: "Create a table",
      icon: "table",
      keywords: ["table", "grid", "rows", "columns", "cells"],
      category: "media",
      priority: 8,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    });
  }

  register(item: SlashCommandItem): void {
    // Remove existing item with same title
    this.items = this.items.filter((i) => i.title !== item.title);

    // Add new item
    this.items.push(item);

    // Sort by priority (higher first)
    this.items.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  unregister(title: string): void {
    this.items = this.items.filter((i) => i.title !== title);
  }

  getItems(): SlashCommandItem[] {
    return [...this.items]; // Return copy to prevent external modification
  }

  getItemsByCategory(category: string): SlashCommandItem[] {
    return this.items.filter((item) => item.category === category);
  }

  search(query: string): SlashCommandItem[] {
    if (!query) return this.getItems();

    const queryLower = query.toLowerCase();

    return this.items.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const keywords = item.keywords || [];

      // Search in title, description, and keywords
      return (
        titleLower.includes(queryLower) ||
        descLower.includes(queryLower) ||
        keywords.some((k) => k.toLowerCase().includes(queryLower)) ||
        titleLower.split(" ").some((word) => word.startsWith(queryLower)) ||
        descLower.split(" ").some((word) => word.startsWith(queryLower))
      );
    });
  }
}

// Create and export singleton instance
export const slashCommandRegistry = new SlashCommandRegistryImpl();

// Export helper functions for easy access
export const registerSlashCommand = (item: SlashCommandItem) =>
  slashCommandRegistry.register(item);
export const unregisterSlashCommand = (title: string) =>
  slashCommandRegistry.unregister(title);
export const getSlashCommands = () => slashCommandRegistry.getItems();
export const searchSlashCommands = (query: string) =>
  slashCommandRegistry.search(query);
