import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Crown, ClipboardList, Palette, Code, Database, TestTube, Bug, Rocket, Loader2
} from "lucide-react";

interface TeamOverviewProps {
  projectId: string;
  isBuilding: boolean;
}

const roleConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  leader:   { icon: Crown,         color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Boss" },
  planner:  { icon: ClipboardList, color: "text-blue-500",   bg: "bg-blue-500/10",   label: "Planner" },
  designer: { icon: Palette,       color: "text-pink-500",   bg: "bg-pink-500/10",   label: "Designer" },
  frontend: { icon: Code,          color: "text-emerald-500",bg: "bg-emerald-500/10",label: "Frontend Dev" },
  backend:  { icon: Database,      color: "text-indigo-500", bg: "bg-indigo-500/10", label: "Backend Dev" },
  tester:   { icon: TestTube,      color: "text-orange-500", bg: "bg-orange-500/10", label: "Tester" },
  debugger: { icon: Bug,           color: "text-rose-500",   bg: "bg-rose-500/10",   label: "Debugger" },
  deployer: { icon: Rocket,        color: "text-cyan-500",   bg: "bg-cyan-500/10",   label: "Deployer" },
};

export function TeamOverview({ projectId, isBuilding }: TeamOverviewProps) {
  // Fetch agents associated with the user/project or just default team
  const { data: agents, isLoading } = useQuery({
    queryKey: ["project-agents"],
    queryFn: async () => {
      // For now, load default team from `agents` table
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Get latest activity per agent
  const { data: recentActivity } = useQuery({
    queryKey: ["project-activity", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_messages")
        .select("agent_role, content, created_at, message_type")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Group by agent_role
      const activityMap = new Map();
      data?.forEach(msg => {
        if (!activityMap.has(msg.agent_role) && msg.agent_role !== 'user') {
          activityMap.set(msg.agent_role, msg);
        }
      });
      return activityMap;
    },
    refetchInterval: isBuilding ? 3000 : false, // Poll during active builds
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Determine an agent's status based on building state and recent messages
  const getStatus = (role: string) => {
    if (!isBuilding) return "idle";
    const lastMsg = recentActivity?.get(role);
    if (!lastMsg) return "idle";
    
    // Check if it's been active in the last 60 seconds
    const timeDiff = new Date().getTime() - new Date(lastMsg.created_at).getTime();
    if (timeDiff < 60000) return "active";
    
    // If it did something but time passed, it's done for now
    return "done";
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI Development Team
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isBuilding ? "The team is actively building your project." : "The team is currently standing by."}
        </p>
      </div>
      
      <div className="p-4 grid gap-3 grid-cols-1 md:grid-cols-2 overflow-y-auto">
        {agents?.map((agent) => {
          const config = roleConfig[agent.role] || { icon: Bot, color: "text-muted-foreground", bg: "bg-muted" };
          const Icon = config.icon;
          const status = getStatus(agent.role);
          const lastActivity = recentActivity?.get(agent.role);
          
          return (
            <Card key={agent.id} className="clay-panel overflow-hidden border-border/50">
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${config.bg} ${config.color} shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-none">{agent.name}</h3>
                      <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">{agent.role}</span>
                    </div>
                  </div>
                  <div>
                    {status === "active" && (
                      <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 animate-pulse">
                        WORKING
                      </Badge>
                    )}
                    {status === "done" && (
                      <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        FINISHED
                      </Badge>
                    )}
                    {status === "idle" && (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        IDLE
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground line-clamp-2 min-h-8">
                    {lastActivity && lastActivity.message_type === "status" ? (
                      <span className="italic flex items-center gap-1">
                        {status === "active" && <Loader2 className="h-3 w-3 animate-spin inline" />}
                        {lastActivity.content}
                      </span>
                    ) : lastActivity ? (
                      <span className="text-foreground/80">{lastActivity.content.replace(/```[\s\S]*?```/g, "[Code generated]")}</span>
                    ) : (
                      "Waiting for assignment..."
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
