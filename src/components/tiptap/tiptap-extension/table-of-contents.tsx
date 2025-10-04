import { TextSelection } from "@tiptap/pm/state";
import React from "react";
import { Node } from "@/types/note";
import { Editor } from "@tiptap/react";

interface ToCItemData {
  id: string;
  content: string;
  level: number;
  isActive: boolean;
  isScrolledOver: boolean;
  itemIndex: number;
}

interface ToCItemProps {
  item: ToCItemData;
  onItemClick: (e: React.MouseEvent, id: string) => void;
}

export const ToCItem: React.FC<ToCItemProps> = ({ item, onItemClick }) => {
  return (
    <div
      className={`${item.isActive && !item.isScrolledOver ? "is-active" : ""} ${item.isScrolledOver ? "is-scrolled-over" : ""}`}
      style={{
        "--level": item.level,
      }}
    >
      <a
        href={`#${item.id}`}
        onClick={(e) => onItemClick(e, item.id)}
        data-item-index={item.itemIndex}
      >
        {item.content}
      </a>
    </div>
  );
};

export const ToCEmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <p>Start editing your document to see the outline.</p>
    </div>
  );
};

export const ToC: React.FC<{
  currentNote: Node | null;
  editor: Editor | null;
}> = ({ currentNote, editor }) => {
  const [items, setItems] = React.useState<ToCItemData[]>([]);

  React.useEffect(() => {
    if (!editor || !currentNote) {
      setItems([]);
      return;
    }

    // Use the Table of Contents extension to get data
    const tableOfContentsData = editor.extensionStorage.tableOfContents;

    if (tableOfContentsData && tableOfContentsData.content) {
      const tocItems = tableOfContentsData.content.map((item: any, index: number) => ({
        id: item.id || `heading-${index}`,
        content: item.content || '',
        level: item.level || 1,
        isActive: item.isActive || false,
        isScrolledOver: item.isScrolledOver || false,
        itemIndex: index + 1,
      }));
      setItems(tocItems);
    } else {
      setItems([]);
    }
  }, [currentNote, editor]);

  // Listen for editor updates to refresh ToC
  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const tableOfContentsData = editor.extensionStorage.tableOfContents;

      if (tableOfContentsData && tableOfContentsData.content) {
        const tocItems = tableOfContentsData.content.map((item: any, index: number) => ({
          id: item.id || `heading-${index}`,
          content: item.content || '',
          level: item.level || 1,
          isActive: item.isActive || false,
          isScrolledOver: item.isScrolledOver || false,
          itemIndex: index + 1,
        }));
        setItems(tocItems);
      }
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  if (items.length === 0) {
    return <ToCEmptyState />;
  }

  const onItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();

    if (editor) {
      // Find the heading element in the DOM
      const element = editor.view.dom.querySelector(`[data-toc-id="${id}"]`) ||
                     editor.view.dom.querySelector(`h1[data-toc-id="${id}"], h2[data-toc-id="${id}"], h3[data-toc-id="${id}"], h4[data-toc-id="${id}"], h5[data-toc-id="${id}"], h6[data-toc-id="${id}"]`);

      if (element) {
        const pos = editor.view.posAtDOM(element, 0);

        // set focus
        const tr = editor.view.state.tr;
        tr.setSelection(new TextSelection(tr.doc.resolve(pos)));
        editor.view.dispatch(tr);
        editor.view.focus();

        // Update URL
        if (history.pushState) {
          history.pushState(null, null, `#${id}`);
        }

        // Smooth scroll to element
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.scrollY,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <>
      {items.map((item, index) => (
        <ToCItem
          key={item.id}
          item={item}
          onItemClick={onItemClick}
        />
      ))}
    </>
  );
};

export const MemorizedToC = React.memo(ToC);
