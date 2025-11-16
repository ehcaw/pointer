import TiptapLink from "@tiptap/extension-link";
import type { EditorView } from "@tiptap/pm/view";
import { getMarkRange } from "@tiptap/react";
import { Plugin, TextSelection } from "@tiptap/pm/state";

export const Link = TiptapLink.extend({
  inclusive: false,

  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
      },
    ];
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
          handleClick(view, pos) {
            const { schema, doc, tr, selection } = view.state;

            // Check if we're already selecting this link
            if (selection.empty === false && schema.marks.link) {
              const { from, to } = selection;

              // Check if current selection already contains a link at this position
              const linkMarkAtPos = getMarkRange(
                doc.resolve(pos),
                schema.marks.link,
              );
              if (linkMarkAtPos) {
                const { from: linkFrom, to: linkTo } = linkMarkAtPos;
                if (from <= linkFrom && to >= linkTo) {
                  // Already selecting this link, don't interfere
                  return;
                }
              }
            }

            let range: ReturnType<typeof getMarkRange> | undefined;

            if (schema.marks.link) {
              range = getMarkRange(doc.resolve(pos), schema.marks.link);
            }

            if (!range) {
              return false; // Return false to let default handling continue
            }

            const { from, to } = range;

            // Create a more precise selection
            const $start = doc.resolve(from);
            const $end = doc.resolve(to);
            const transaction = tr.setSelection(
              new TextSelection($start, $end),
            );

            view.dispatch(transaction);
            return true; // Return true to indicate we handled the click
          },
        },
      }),
    ];
  },
});

export default Link;
