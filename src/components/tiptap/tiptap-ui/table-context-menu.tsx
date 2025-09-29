"use client";

import * as React from "react";
import { Editor } from "@tiptap/react";



// --- UI Primitives ---
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap/tiptap-ui-primitive/separator";

// --- Styles ---
import "./table-context-menu.scss";

export interface TableContextMenuProps {
  editor?: Editor | null;
}

export const TableContextMenu: React.FC<TableContextMenuProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const isTableActive = editor?.isActive("table") ?? false;

  if (!editor || !isTableActive) {
    return null;
  }

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          data-style="ghost"
          data-size="small"
          className="table-context-menu-trigger"
          onClick={() => setIsOpen(true)}
        >
          Table
        </Button>
      </PopoverTrigger>
      <PopoverContent className="table-context-menu-content" align="start">
        <div className="table-context-menu-section">
          <h4 className="table-context-menu-title">Columns</h4>
          <div className="table-context-menu-buttons">
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().addColumnBefore().run())}
            >
              Add Column Before
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().addColumnAfter().run())}
            >
              Add Column After
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().deleteColumn().run())}
            >
              Delete Column
            </Button>
          </div>
        </div>
        <Separator />
        <div className="table-context-menu-section">
          <h4 className="table-context-menu-title">Rows</h4>
          <div className="table-context-menu-buttons">
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().addRowBefore().run())}
            >
              Add Row Before
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().addRowAfter().run())}
            >
              Add Row After
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().deleteRow().run())}
            >
              Delete Row
            </Button>
          </div>
        </div>
        <Separator />
        <div className="table-context-menu-section">
          <h4 className="table-context-menu-title">Cells</h4>
          <div className="table-context-menu-buttons">
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().mergeCells().run())}
            >
              Merge Cells
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().splitCell().run())}
            >
              Split Cell
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().mergeOrSplit().run())}
            >
              Merge or Split
            </Button>
          </div>
        </div>
        <Separator />
        <div className="table-context-menu-section">
          <h4 className="table-context-menu-title">Headers</h4>
          <div className="table-context-menu-buttons">
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().toggleHeaderColumn().run())}
            >
              Toggle Header Column
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().toggleHeaderRow().run())}
            >
              Toggle Header Row
            </Button>
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().toggleHeaderCell().run())}
            >
              Toggle Header Cell
            </Button>
          </div>
        </div>
        <Separator />
        <div className="table-context-menu-section">
          <div className="table-context-menu-buttons">
            <Button
              data-style="ghost"
              data-size="small"
              onClick={() => handleAction(() => editor.chain().focus().deleteTable().run())}
            >
              Delete Table
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};