"use client";

import { createContext, useContext, ReactNode, useRef } from "react";
import { Editor } from "@tiptap/react";

interface EditorContextType {
  editorRef: React.MutableRefObject<{
    getJSON: () => Record<string, unknown>;
    getText: () => string;
    setJSON: (content: Record<string, unknown>) => void;
    cleanupProvider?: () => void;
    disconnectProvider?: () => void;
    reconnectProvider?: () => void;
  } | null>;
  setEditor: (editor: Editor | null) => void;
  updateEditorContent: (content: Record<string, unknown>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within EditorProvider");
  }
  return context;
}

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const editorRef = useRef<{
    getJSON: () => Record<string, unknown>;
    getText: () => string;
    setJSON: (content: Record<string, unknown>) => void;
    cleanupProvider?: () => void;
    disconnectProvider?: () => void;
    reconnectProvider?: () => void;
  }>(null);

  const setEditor = (editor: Editor | null) => {
    if (editor) {
      editorRef.current = {
        getJSON: () => editor.getJSON(),
        getText: () => editor.getText(),
        setJSON: (content: Record<string, unknown>) => {
          editor.commands.setContent(content);
        },
      };
    } else {
      editorRef.current = null;
    }
  };

  const updateEditorContent = (content: Record<string, unknown>) => {
    if (editorRef.current) {
      editorRef.current.setJSON(content);
    }
  };

  return (
    <EditorContext.Provider value={{ editorRef, setEditor, updateEditorContent }}>
      {children}
    </EditorContext.Provider>
  );
}