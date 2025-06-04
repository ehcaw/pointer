import * as React from "react";
import { ChevronRight, File, Folder } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenu,
} from "./tiptap-ui-primitive/dropdown-menu";
import { BookPlusIcon } from "lucide-react";

// This is sample data.

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  Your Workspace
                  <BookPlusIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width] bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-1">
                <DropdownMenuItem className="flex items-center py-2 px-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm">
                  <span>Acme Inc</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center py-2 px-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm">
                  <span>Acme Corp.</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.changes.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton>
                    <File />
                    {item.file}
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{item.state}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.tree.map((item, index) => (
                <Tree key={index} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function Tree({
  item,
}: {
  item: string | (string | (string | (string | string[])[])[])[];
}) {
  const [name, ...items] = Array.isArray(item) ? item : [item];

  if (!items.length) {
    return (
      <SidebarMenuButton
        isActive={name === "button.tsx"}
        className="data-[active=true]:bg-transparent"
      >
        <File />
        {name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === "components" || name === "ui"}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem, index) => (
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
