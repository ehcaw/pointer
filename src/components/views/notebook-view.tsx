import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import { RefObject } from "react";

export const notebookView = (
  editorRef:
    | RefObject<{
        getJSON: () => typeof JSON;
        getText: () => string;
      }>
    | undefined,
) => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 h-screen overflow-y-auto">
      <div style={{ maxHeight: "100vh" }}>
        <SimpleEditor content="" editorRef={editorRef} />
      </div>
    </div>
  );
};
