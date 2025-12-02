import TiptapLink from "@tiptap/extension-link";
import type { EditorView } from "@tiptap/pm/view";
import { getMarkRange } from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";
import { fetchLinkTitle } from "@/lib/utils/simpleLinkFetcher";

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
      displayText: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-display-text"),
        renderHTML: (attributes) => {
          if (!attributes.displayText) {
            return {};
          }
          return {
            "data-display-text": attributes.displayText,
          };
        },
      },
      title: {
        default: "Double-click to open link",
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.href) {
            return {};
          }
          const linkText = attributes.displayText || attributes.href;
          return {
            title: "Double-click to open link",
            "aria-label": `Link to ${linkText}. Double-click to open in new tab.`,
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
            const node = doc.slice(range.from, range.to).content.firstChild;
            const linkMark = node?.marks.find(
              (mark) => mark.type === schema.marks.link,
            );

            if (linkMark?.attrs.href) {
              const href = linkMark.attrs.href;
              // Open the link in a new tab
              window.open(href, "_blank");
            }

            return true; // Return true to indicate we handled the double-click
          },
        },
        appendTransaction(transactions, oldState, newState) {
          // Check if any transaction created or modified a link
          const linkModified = transactions.some(tr =>
            tr.docChanged && tr.steps.some(step => {
              // Check if the step adds or modifies a link mark
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const stepType = (step as any).jsonID;
              return stepType === "addMark" || stepType === "replace";
            })
          );

          if (!linkModified) return null;

          // Find all links in the new state that don't have displayText
          const { schema } = newState;
          const linksToUpdate: Array<{from: number, to: number, href: string}> = [];

          newState.doc.descendants((node, pos) => {
            if (node.isText) {
              node.marks.forEach(mark => {
                if (mark.type === schema.marks.link && mark.attrs.href) {
                  const attrs = mark.attrs as { href: string; displayText?: string | null };

                  // Only fetch metadata if displayText is not set and the link text is the URL itself
                  if (!attrs.displayText) {
                    const text = node.text;
                    if (text && text.trim() === attrs.href) {
                      linksToUpdate.push({
                        from: pos,
                        to: pos + node.nodeSize,
                        href: attrs.href
                      });
                    }
                  }
                }
              });
            }
          });

          // If no links need updating, return null
          if (linksToUpdate.length === 0) return null;

          // Fetch metadata and update links asynchronously
          const updateLinksWithMetadata = async () => {
            for (const link of linksToUpdate) {
              try {
                const title = await fetchLinkTitle(link.href);
                if (title && title !== link.href) {
                  // Update the link text with the fetched title
                  const { tr } = editor.state;
                  tr.replaceWith(
                    link.from,
                    link.to,
                    editor.state.schema.text(title, [
                      editor.state.schema.marks.link.create({
                        href: link.href,
                        displayText: title
                      })
                    ])
                  );
                  editor.view.dispatch(tr);
                }
              } catch (error) {
                console.warn(`Failed to fetch title for ${link.href}:`, error);
              }
            }
          };

          // Don't block the transaction, fetch metadata in background
          setTimeout(updateLinksWithMetadata, 0);

          return null;
        },
      }),
    ];
  },
});

export default Link;
