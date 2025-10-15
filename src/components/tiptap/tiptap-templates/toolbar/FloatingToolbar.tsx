import { useRef, useState, useEffect } from "react";
import { Editor, EditorContext } from "@tiptap/react";
import { Toolbar } from "@/components/tiptap/tiptap-ui-primitive/toolbar";
import { MainToolbarContent } from "./MainToolbar";
import { MobileToolbarContent } from "./MobileToolbar";
import { useMobile } from "@/hooks/use-tiptap-mobile";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { HotkeysProvider } from "react-hotkeys-hook";

interface FloatingToolbarProps {
  editor: Editor;
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
  connectionStatus?: "connecting" | "connected" | "disconnected";
  isCollaborative?: boolean;
}

export function FloatingToolbar({
  editor,
  connectionStatus = "connected",
  isCollaborative = false
}: FloatingToolbarProps) {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Determine if toolbar should be disabled based on connection status
  const isDisabled = isCollaborative && connectionStatus !== "connected";

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
      <HotkeysProvider>
        <Toolbar
          ref={toolbarRef}
          variant="floating"
          className=""
          style={{
            position: "sticky",
            top: isMobile ? "auto" : "20px",
            left: isMobile ? "auto" : "0",
            right: isMobile ? "auto" : "0",
            transform: "none",
            bottom: isMobile
              ? `calc(100% - ${windowSize.height - bodyRect.y}px)`
              : "auto",
            zIndex: 40,
            backgroundColor: "var(--background)",
            borderRadius: "8px",
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
              isDisabled={isDisabled}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
              editor={editor}
              isDisabled={isDisabled}
            />
          )}
        </Toolbar>
      </HotkeysProvider>
    </EditorContext.Provider>
  );
}
