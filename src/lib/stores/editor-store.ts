import { create } from 'zustand';
import { Editor } from '@tiptap/react';

interface EditorStore {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
  updateEditorContent: (content: Record<string, unknown>) => void;
  clearEditor: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeEditor: null,

  setActiveEditor: (editor: Editor | null) => {
    set({ activeEditor: editor });
  },

  updateEditorContent: (content: Record<string, unknown>) => {
    const { activeEditor } = get();
    if (activeEditor) {
      activeEditor.commands.setContent(content);
    }
  },

  clearEditor: () => {
    set({ activeEditor: null });
  },
}));