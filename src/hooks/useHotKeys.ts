import { useEffect } from "react";

type HotKeyHandler = (event: KeyboardEvent) => void;

interface HotKeyMap {
  [key: string]: HotKeyHandler;
}

export function useHotKeys(
  handlers: Partial<{
    save: HotKeyHandler;
    search: HotKeyHandler;
    // Add more actions as needed
  }>,
) {
  useEffect(() => {
    const keyMap: HotKeyMap = {
      "mod+s": handlers.save || (() => {}),
      "mod+k": handlers.search || (() => {}),
      // Add more mappings here
    };

    function onKeyDown(e: KeyboardEvent) {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "s" && keyMap["mod+s"]) {
          e.preventDefault();
          keyMap["mod+s"](e);
        }
        if (key === "k" && keyMap["mod+k"]) {
          e.preventDefault();
          keyMap["mod+k"](e);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
