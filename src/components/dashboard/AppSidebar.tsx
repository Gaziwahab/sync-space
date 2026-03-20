import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Bot,
  Terminal,
  Rocket,
  Settings,
  Key,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useApiKeyContext, PROVIDER_MODELS } from "@/contexts/ApiKeyContext";
import { PROVIDER_LABELS } from "@/hooks/useApiKeys";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

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
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  
  const { apiKeys, selectedKeyId, setSelectedKeyId, selectedModel, setSelectedModel } = useApiKeyContext();
  const selectedKey = apiKeys.find((k) => k.id === selectedKeyId);
  
  const handleSelectModel = (keyId: string, model: string) => {
    setSelectedKeyId(keyId);
    setSelectedModel(model);
  };
  
  const selectedModelLabel = selectedKey && selectedModel
    ? PROVIDER_MODELS[selectedKey.provider]?.find(m => m.value === selectedModel)?.label || selectedModel
    : "Select Model";

  const renderGroup = (label: string, items: typeof workspaceItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1 mt-2">
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active}>
                  <NavLink
                    to={item.url}
                    end={item.url === "/dashboard"}
                    className={`transition-all duration-300 rounded-xl px-3 py-2 ${
                      active ? "clay-btn text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                    }`}
                    activeClassName=""
                  >
                    <item.icon className="mr-3 h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0 clay-card m-3 h-[calc(100vh-24px)] overflow-hidden">
      <SidebarContent className="pt-6 px-3 bg-transparent">
        
        {/* Global API Key Selector */}
        {!collapsed && (
          <div className="mb-6 px-2">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Key className="h-3.5 w-3.5" /> API Key
            </div>
            {apiKeys.length === 0 ? (
              <div className="clay-inset p-3 rounded-xl border border-warning/30 bg-warning/5 space-y-2">
                <p className="text-xs text-warning-foreground font-medium">No API keys found.</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-8 border-warning/50 text-warning-foreground hover:bg-warning hover:text-warning-foreground transition-colors"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  Configure keys
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10 clay-inset border-0 focus-visible:ring-1 focus-visible:ring-primary shadow-sm hover:bg-transparent">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-medium truncate">{selectedKey?.label || "Select Key"}</span>
                      {selectedKey && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {PROVIDER_LABELS[selectedKey.provider]}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)] clay-card border-0 p-1">
                  <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold px-2 py-1.5">
                    Select API & Model
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {apiKeys.map((key) => {
                    const models = PROVIDER_MODELS[key.provider] || [];
                    const isKeySelected = key.id === selectedKeyId;
                    
                    return (
                      <DropdownMenuSub key={key.id}>
                        <DropdownMenuSubTrigger className="rounded-xl px-2 py-2 data-[state=open]:bg-primary/10 transition-colors">
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium truncate">{key.label}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">
                              {PROVIDER_LABELS[key.provider]}
                            </span>
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="clay-card border-0 p-1 min-w-[200px]">
                          {models.map(model => (
                            <DropdownMenuItem 
                              key={model.value}
                              className="rounded-xl px-2 py-2 cursor-pointer focus:bg-primary/10 transition-colors flex items-center justify-between"
                              onClick={() => handleSelectModel(key.id, model.value)}
                            >
                              <span className={isKeySelected && selectedModel === model.value ? "font-semibold text-primary" : ""}>
                                {model.label}
                              </span>
                              {isKeySelected && selectedModel === model.value && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {renderGroup("Workspace", workspaceItems)}
        <div className="my-4 h-px w-full bg-border/50" />
        {renderGroup("Developer", developerItems)}
        <div className="my-4 h-px w-full bg-border/50" />
        {renderGroup("Account", accountItems)}
        
      </SidebarContent>
    </Sidebar>
  );
}
