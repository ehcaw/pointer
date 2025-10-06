import { useRef, useState, useEffect } from "react";
import { Editor, EditorContext } from "@tiptap/react";
import { Toolbar } from "@/components/tiptap/tiptap-ui-primitive/toolbar";
import { MainToolbarContent } from "../toolbar/MainToolbar";
import { MobileToolbarContent } from "../toolbar/MobileToolbar";
import { useMobile } from "@/hooks/use-tiptap-mobile";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

interface FloatingToolbarProps {
  editor: Editor;
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [overlayHeight, setOverlayHeight] = useState(0);

  useEffect(() => {
    if (toolbarRef.current) {
      setOverlayHeight(toolbarRef.current.getBoundingClientRect().height);
    }
  }, []);

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  if (!editor) return null;

  return (
    <EditorContext.Provider value={{ editor }}>
      <Toolbar
        ref={toolbarRef}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        style={{
          position: "sticky",
          top: isMobile ? "auto" : "20px",
          left: isMobile ? "auto" : "0",
          right: isMobile ? "auto" : "0",
          transform: "none",
          bottom: isMobile
            ? `calc(100% - ${windowSize.height - bodyRect.y}px)`
            : "auto",
          zIndex: 10,
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          padding: "8px",
          margin: "0 auto 0 auto",
          width: "100%",
        }}
      >
        {mobileView === "main" ? (
          <MainToolbarContent
            onHighlighterClick={() => setMobileView("highlighter")}
            onLinkClick={() => setMobileView("link")}
            isMobile={isMobile}
            editor={editor}
          />
        ) : (
          <MobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={() => setMobileView("main")}
          />
        )}
      </Toolbar>
    </EditorContext.Provider>
  );
}
