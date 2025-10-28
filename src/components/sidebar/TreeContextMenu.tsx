import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSub,
} from "../ui/context-menu";

const TreeContextMenu = ({ children }: { children: React.ReactNode }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move</ContextMenuSubTrigger>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TreeContextMenu;
