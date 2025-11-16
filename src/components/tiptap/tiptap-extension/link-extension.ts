import TiptapLink from "@tiptap/extension-link";
import type { EditorView } from "@tiptap/pm/view";
import { getMarkRange } from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";

export const Link = TiptapLink.extend({
  inclusive: false,

  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
      },
    ];
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: "Double-click to open link",
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.href) {
            return {};
          }
          return {
            title: "Double-click to open link",
            "aria-label": `Link to ${attributes.href}. Double-click to open in new tab.`,
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      ...(this.parent?.() || []),
      new Plugin({
        props: {
          handleKeyDown: (_: EditorView, event: KeyboardEvent) => {
            const { selection } = editor.state;

            if (event.key === "Escape" && selection.empty !== true) {
              editor.commands.focus(selection.to, { scrollIntoView: false });
            }

            return false;
          },
          handleClick() {
            // Don't handle single clicks - let the default behavior work
            // This allows normal text selection instead of auto-selecting the link
            return false;
          },
          handleDoubleClick(view, pos) {
            const { schema, doc } = view.state;

            let range: ReturnType<typeof getMarkRange> | undefined;
            if (schema.marks.link) {
              range = getMarkRange(doc.resolve(pos), schema.marks.link);
            }
            if (!range) {
              return false;
            }

            // Get the link attributes from the mark
            // const node = doc.slice(range.from, range.to).content.firstChild;
            // const linkMark = node?.marks.find(
            //   (mark) => mark.type === schema.marks.link,
            // );
            const $pos = doc.resolve(range.from);
            const linkMark = $pos
              .marks()
              .find((mark) => mark.type === schema.marks.link);

            if (linkMark?.attrs.href) {
              const href = linkMark.attrs.href;
              // Open the link in a new tab
              window.open(href, "_blank", "noopener,noreferrer");
            }

            return true; // Return true to indicate we handled the double-click
          },
        },
      }),
    ];
  },
});

export default Link;
