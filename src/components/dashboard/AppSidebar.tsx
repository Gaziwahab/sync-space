import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Bot,
  Terminal,
  Rocket,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const workspaceItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Prompt Builder", url: "/dashboard/prompt-builder", icon: MessageSquare },
  { title: "AI Agents", url: "/dashboard/agents", icon: Bot },
];

const developerItems = [
  { title: "Debug Console", url: "/dashboard/debug", icon: Terminal },
  { title: "Deploy", url: "/dashboard/deploy", icon: Rocket },
];

const accountItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof workspaceItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  className="hover:bg-muted/50"
                  activeClassName="bg-muted text-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {renderGroup("Workspace", workspaceItems)}
        {renderGroup("Developer", developerItems)}
        {renderGroup("Account", accountItems)}
      </SidebarContent>
    </Sidebar>
  );
}
