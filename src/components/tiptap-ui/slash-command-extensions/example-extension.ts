import { Extension } from '@tiptap/core'
import { registerSlashCommand } from '@/components/tiptap-ui/slash-command-registry'
import { Editor } from '@tiptap/react'

/**
 * Example of how to make your extension add commands to the slash command menu
 */

// Example 1: Math Extension
export const MathExtension = Extension.create({
  name: 'math',
  
  onCreate() {
    // Register math commands when the extension is created
    registerSlashCommand({
      title: 'Math Equation',
      description: 'Insert a math equation',
      icon: 'math',
      keywords: ['math', 'equation', 'formula', 'latex'],
      category: 'advanced',
      priority: 5,
      command: ({ editor, range }) => {
        // This would integrate with a math extension
        const equation = window.prompt('Enter LaTeX equation:')
        if (equation) {
          editor.chain().focus().deleteRange(range).insertContent(`$$${equation}$$`).run()
        }
      },
    })
  },
})

// Example 2: Table Extension
export const TableExtension = Extension.create({
  name: 'table',
  
  onCreate() {
    // Register table commands
    registerSlashCommand({
      title: 'Table',
      description: 'Insert a table',
      icon: 'table',
      keywords: ['table', 'grid', 'spreadsheet', 'data'],
      category: 'advanced',
      priority: 8,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      },
    })
    
    registerSlashCommand({
      title: 'Table Row',
      description: 'Add a table row',
      icon: 'tableRow',
      keywords: ['table', 'row', 'add'],
      category: 'advanced',
      priority: 3,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).addTableRow().run()
      },
    })
  },
})

// Example 3: Callout/Alert Extension
export const CalloutExtension = Extension.create({
  name: 'callout',
  
  onCreate() {
    // Register different types of callouts
    const calloutTypes = [
      { title: 'Info Callout', icon: 'info', color: 'blue', keyword: 'info' },
      { title: 'Warning Callout', icon: 'warning', color: 'yellow', keyword: 'warning' },
      { title: 'Error Callout', icon: 'error', color: 'red', keyword: 'error' },
      { title: 'Success Callout', icon: 'success', color: 'green', keyword: 'success' },
    ]
    
    calloutTypes.forEach(type => {
      registerSlashCommand({
        title: type.title,
        description: `Create a ${type.color} callout box`,
        icon: type.icon,
        keywords: ['callout', 'alert', 'box', type.keyword, type.color],
        category: 'blocks',
        priority: 4,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: 'callout',
            attrs: { type: type.color },
            content: [{ type: 'paragraph', content: [] }],
          }).run()
        },
      })
    })
  },
})

// Example 4: Embed Extension (YouTube, Twitter, etc.)
export const EmbedExtension = Extension.create({
  name: 'embed',
  
  onCreate() {
    registerSlashCommand({
      title: 'YouTube',
      description: 'Embed a YouTube video',
      icon: 'youtube',
      keywords: ['youtube', 'video', 'embed', 'media'],
      category: 'media',
      priority: 7,
      command: ({ editor, range }) => {
        const url = window.prompt('Enter YouTube URL:')
        if (url) {
          editor.chain().focus().deleteRange(range).setEmbed({ url, type: 'youtube' }).run()
        }
      },
    })
    
    registerSlashCommand({
      title: 'Twitter',
      description: 'Embed a tweet',
      icon: 'twitter',
      keywords: ['twitter', 'tweet', 'embed', 'social'],
      category: 'media',
      priority: 6,
      command: ({ editor, range }) => {
        const url = window.prompt('Enter Twitter URL:')
        if (url) {
          editor.chain().focus().deleteRange(range).setEmbed({ url, type: 'twitter' }).run()
        }
      },
    })
  },
})

// Example 5: Advanced Formatting
export const AdvancedFormattingExtension = Extension.create({
  name: 'advancedFormatting',
  
  onCreate() {
    registerSlashCommand({
      title: 'Highlight',
      description: 'Highlight text with color',
      icon: 'highlight',
      keywords: ['highlight', 'color', 'background', 'mark'],
      category: 'formatting',
      priority: 5,
      command: ({ editor, range }) => {
        const color = window.prompt('Enter highlight color (e.g., #ffeb3b):', '#ffeb3b')
        if (color) {
          editor.chain().focus().deleteRange(range).setHighlight({ color }).run()
        }
      },
    })
    
    registerSlashCommand({
      title: 'Subscript',
      description: 'Subscript text',
      icon: 'subscript',
      keywords: ['subscript', 'sub', 'lower'],
      category: 'formatting',
      priority: 3,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleSubscript().run()
      },
    })
    
    registerSlashCommand({
      title: 'Superscript',
      description: 'Superscript text',
      icon: 'superscript',
      keywords: ['superscript', 'super', 'upper'],
      category: 'formatting',
      priority: 3,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleSuperscript().run()
      },
    })
  },
})