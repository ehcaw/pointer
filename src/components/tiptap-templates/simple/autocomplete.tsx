import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import React from "react";
import ReactDOM from "react-dom/client";

// Define the props interface for your component
interface InlineProps {
  ghost: string;
}

// Your InlineGhost component
const InlineGhost = ({ ghost }: InlineProps) => {
  return (
    <span
      style={{
        whiteSpace: "pre",
        opacity: 0.4,
        pointerEvents: "none",
        fontStyle: "italic",
      }}
    >
      {ghost}
    </span>
  );
};

interface InlineAutocompleteState {
  suggestion: string | null;
  triggerPos: number | null;
  isLoading: boolean;
}

const inlineAutocompleteKey = new PluginKey("inline-autocomplete");

// Helper functions outside the extension
const fetchSuggestion = async (
  fullText: string,
  textBefore: string,
): Promise<string | null> => {
  try {
    const response = await fetch("/api/suggestion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullText, currLine: textBefore }),
    });

    const result = await response.json();
    console.log("Suggestion result:", result);

    if (result == null) {
      return null;
    }

    // Handle different response formats
    if (typeof result === "string") {
      return result;
    }

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];
      if (typeof firstItem === "string") {
        return firstItem;
      }
      if (typeof firstItem === "object" && firstItem.label) {
        return firstItem.label;
      }
    }

    if (typeof result === "object" && result.label) {
      return result.label;
    }

    return null;
  } catch (error) {
    console.error("Error fetching autocomplete suggestion:", error);
    return null;
  }
};

const updateSuggestion = (editor: any, suggestion: string | null) => {
  if (editor) {
    const tr = editor.state.tr;
    const pluginState = inlineAutocompleteKey.getState(editor.state);

    if (pluginState) {
      pluginState.suggestion = suggestion;
      pluginState.isLoading = false;
      editor.view.dispatch(tr);
    }
  }
};

const acceptSuggestion = (editor: any) => {
  const plugin = inlineAutocompleteKey.getState(editor.state);
  if (plugin && plugin.suggestion) {
    const selection = editor.state.selection;
    const pos = selection.from;

    editor
      .chain()
      .insertContentAt({ from: pos - 1, to: pos }, plugin.suggestion)
      .run();

    // Clear the suggestion
    dismissSuggestion(editor);
  }
};

const dismissSuggestion = (editor: any) => {
  const tr = editor.state.tr;
  const newState = inlineAutocompleteKey.getState(editor.state);
  if (newState) {
    newState.suggestion = null;
    newState.triggerPos = null;
    newState.isLoading = false;
    editor.view.dispatch(tr);
  }
};

export const InlineAutocompleteExtension = Extension.create({
  name: "quibble-inline-autocomplete",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          "data-suggestion": {
            default: null,
          },
        },
      },
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const plugin = inlineAutocompleteKey.getState(editor.state);
        if (plugin && plugin.suggestion) {
          acceptSuggestion(editor);
          return true;
        }
        return false;
      },
      Enter: ({ editor }) => {
        const plugin = inlineAutocompleteKey.getState(editor.state);
        if (plugin && plugin.suggestion) {
          acceptSuggestion(editor);
          return true;
        }
        return false;
      },
      Escape: ({ editor }) => {
        const plugin = inlineAutocompleteKey.getState(editor.state);
        if (plugin && plugin.suggestion) {
          dismissSuggestion(editor);
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: inlineAutocompleteKey,

        state: {
          init(): InlineAutocompleteState {
            return {
              suggestion: null,
              triggerPos: null,
              isLoading: false,
            };
          },

          apply(tr, oldState): InlineAutocompleteState {
            // If there's a selection change or text change, potentially trigger autocomplete
            if (tr.docChanged || tr.selectionSet) {
              const newState = { ...oldState };

              // Check if we should trigger autocomplete
              const selection = tr.selection;
              if (selection.empty) {
                const pos = selection.from;
                const textBefore = tr.doc.textBetween(
                  Math.max(0, pos - 1),
                  pos,
                );
                const fullTextBefore = tr.doc.textBetween(0, pos);

                // Trigger on @ character
                if (textBefore === "@" && !oldState.isLoading) {
                  newState.triggerPos = pos;
                  newState.isLoading = true;

                  // Fetch suggestion asynchronously
                  fetchSuggestion(tr.doc.textContent, fullTextBefore).then(
                    (suggestion) => {
                      updateSuggestion(editor, suggestion);
                    },
                  );
                } else if (
                  oldState.suggestion &&
                  oldState.triggerPos !== null
                ) {
                  // Check if cursor moved away from trigger position
                  const distanceFromTrigger = pos - oldState.triggerPos;
                  if (distanceFromTrigger < 0 || distanceFromTrigger > 50) {
                    newState.suggestion = null;
                    newState.triggerPos = null;
                    newState.isLoading = false;
                  }
                }
              } else {
                // Clear suggestion if there's a selection
                newState.suggestion = null;
                newState.triggerPos = null;
                newState.isLoading = false;
              }

              return newState;
            }

            return oldState;
          },
        },

        props: {
          decorations(state) {
            const pluginState = inlineAutocompleteKey.getState(state);
            if (!pluginState || !pluginState.suggestion) {
              return DecorationSet.empty;
            }

            const selection = state.selection;
            if (!selection.empty) {
              return DecorationSet.empty;
            }

            const pos = selection.from;

            // Render the React component as a widget decoration
            const decoration = Decoration.widget(
              pos,
              (view) => {
                const wrapper = document.createElement("span");
                // Create a React root and render the InlineGhost component
                const root = ReactDOM.createRoot(wrapper);
                root.render(<InlineGhost ghost={pluginState.suggestion!} />);

                // Store the root on the wrapper for later unmounting
                (wrapper as any).__reactRoot = root;

                return wrapper;
              },
              {
                side: 1, // Place the widget after the cursor
                destroy(dom) {
                  // Defer the unmount to avoid race conditions
                  const reactRoot = (dom as any).__reactRoot;
                  if (reactRoot) {
                    setTimeout(() => {
                      reactRoot.unmount();
                    }, 0);
                  }
                },
              },
            );

            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      acceptSuggestion:
        () =>
        ({ editor }) => {
          acceptSuggestion(editor);
          return true;
        },

      dismissSuggestion:
        () =>
        ({ editor }) => {
          dismissSuggestion(editor);
          return true;
        },
    };
  },
});

// Export both for backward compatibility
export const AutocompleteExtension = InlineAutocompleteExtension;
