import { Extension, Editor, CommandProps, RawCommands } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import React from "react";
import ReactDOM from "react-dom/client";

// Define the props interface for your component
interface InlineProps {
  ghost: string;
}

interface SpanWithReactRoot extends HTMLSpanElement {
  __reactRoot: ReactDOM.Root;
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
  lastTypingTime: number | null;
  typingTimer: NodeJS.Timeout | null;
}

const TYPING_PAUSE_THRESHOLD = 500; // Milliseconds to wait after typing stops before suggesting
const MIN_CONTENT_LENGTH = 10; // Minimum text length before we start suggesting on pauses
const MIN_TOKENS_FOR_SUGGESTION = 3; // Minimum number of words to trigger automatic suggestion
const MAX_SUGGESTION_FREQUENCY = 5000; // Minimum milliseconds between automatic suggestions
const LAST_AUTO_SUGGESTION_TIME_KEY = "lastAutoSuggestionTime";

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

const updateSuggestion = (editor: Editor, suggestion: string | null) => {
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

const acceptSuggestion = (editor: Editor) => {
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

const dismissSuggestion = (editor: Editor) => {
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
              lastTypingTime: null,
              typingTimer: null,
            };
          },

          apply(tr, oldState): InlineAutocompleteState {
            // If there's a selection change or text change, potentially trigger autocomplete
            if (tr.docChanged || tr.selectionSet) {
              const newState = { ...oldState };
              const selection = tr.selection;

              if (selection.empty) {
                const pos = selection.from;
                const textBefore = tr.doc.textBetween(
                  Math.max(0, pos - 1),
                  pos,
                );
                const fullTextBefore = tr.doc.textBetween(0, pos);

                // Clear any existing typing timer
                if (newState.typingTimer) {
                  clearTimeout(newState.typingTimer);
                  newState.typingTimer = null;
                }

                // Trigger on @ character immediately
                if (textBefore === "@" && !oldState.isLoading) {
                  newState.triggerPos = pos;
                  newState.isLoading = true;

                  // Fetch suggestion asynchronously
                  fetchSuggestion(tr.doc.textContent, fullTextBefore).then(
                    (suggestion) => {
                      updateSuggestion(editor, suggestion);
                    },
                  );
                }
                // For pause detection, we only proceed if there's enough content
                else if (
                  tr.docChanged &&
                  fullTextBefore.length > MIN_CONTENT_LENGTH
                ) {
                  // Update the last typing time
                  newState.lastTypingTime = Date.now();

                  // Count tokens (words) to ensure there's enough context
                  const wordCount = fullTextBefore.trim().split(/\s+/).length;

                  // Set a timer for pause detection
                  if (wordCount >= MIN_TOKENS_FOR_SUGGESTION) {
                    const lastSuggestionTime = parseInt(
                      localStorage.getItem(LAST_AUTO_SUGGESTION_TIME_KEY) ||
                        "0",
                    );
                    const timeSinceLastSuggestion =
                      Date.now() - lastSuggestionTime;

                    // Only set up the typing timer if enough time has passed since the last suggestion
                    if (timeSinceLastSuggestion > MAX_SUGGESTION_FREQUENCY) {
                      newState.typingTimer = setTimeout(() => {
                        // This executes after the user stops typing
                        if (!editor.isDestroyed) {
                          const currentSelection = editor.state.selection;
                          const currentPos = currentSelection.from;
                          const currentTextBefore =
                            editor.state.doc.textBetween(0, currentPos);

                          // Store the time of this auto-suggestion
                          localStorage.setItem(
                            LAST_AUTO_SUGGESTION_TIME_KEY,
                            Date.now().toString(),
                          );

                          // Update state to show we're fetching
                          const pluginState = inlineAutocompleteKey.getState(
                            editor.state,
                          );
                          if (pluginState) {
                            pluginState.isLoading = true;
                            pluginState.triggerPos = currentPos;
                            editor.view.dispatch(editor.state.tr);

                            // Fetch the suggestion
                            fetchSuggestion(
                              editor.state.doc.textContent,
                              currentTextBefore,
                            ).then((suggestion) => {
                              updateSuggestion(editor, suggestion);
                            });
                          }
                        }
                      }, TYPING_PAUSE_THRESHOLD);
                    }
                  }
                }

                // Check if cursor moved away from trigger position
                if (oldState.suggestion && oldState.triggerPos !== null) {
                  const distanceFromTrigger = pos - oldState.triggerPos;
                  if (distanceFromTrigger < 0 || distanceFromTrigger > 50) {
                    newState.suggestion = null;
                    newState.triggerPos = null;
                    newState.isLoading = false;
                    if (newState.typingTimer) {
                      clearTimeout(newState.typingTimer);
                      newState.typingTimer = null;
                    }
                  }
                }
              } else {
                // Clear suggestion if there's a selection
                newState.suggestion = null;
                newState.triggerPos = null;
                newState.isLoading = false;
                if (newState.typingTimer) {
                  clearTimeout(newState.typingTimer);
                  newState.typingTimer = null;
                }
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
              () => {
                const wrapper = document.createElement("span");
                // Create a React root and render the InlineGhost component
                const root = ReactDOM.createRoot(wrapper);
                root.render(<InlineGhost ghost={pluginState.suggestion!} />);

                // Store the root on the wrapper for later unmounting
                (wrapper as SpanWithReactRoot).__reactRoot = root;

                return wrapper;
              },
              {
                side: 1, // Place the widget after the cursor
                destroy(dom) {
                  // Defer the unmount to avoid race conditions
                  const reactRoot = (dom as SpanWithReactRoot).__reactRoot;
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
  onDestroy() {
    // Clean up any timers when the plugin is destroyed
    const state = inlineAutocompleteKey.getState(this.editor.state);
    if (state && state.typingTimer) {
      clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }
  },
  addCommands() {
    return {
      acceptSuggestion:
        () =>
        ({ editor }: CommandProps) => {
          acceptSuggestion(editor);
          return true;
        },

      dismissSuggestion:
        () =>
        ({ editor }: CommandProps) => {
          dismissSuggestion(editor);
          return true;
        },
    } as Partial<RawCommands>;
  },
});

// Export both for backward compatibility
export const AutocompleteExtension = InlineAutocompleteExtension;
