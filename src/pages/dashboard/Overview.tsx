import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Bot, MessageSquare, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Overview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [projects, agents, prompts] = await Promise.all([
        supabase.from("projects").select("id, name, updated_at", { count: "exact" }).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("agents").select("id, name, updated_at", { count: "exact" }).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("prompts").select("id, name, updated_at", { count: "exact" }).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
      ]);

      // Build recent activity from all three
      const activity = [
        ...(projects.data || []).map((p) => ({ type: "project" as const, name: p.name, date: p.updated_at })),
        ...(agents.data || []).map((a) => ({ type: "agent" as const, name: a.name, date: a.updated_at })),
        ...(prompts.data || []).map((p) => ({ type: "prompt" as const, name: p.name, date: p.updated_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

      return {
        projectCount: projects.count ?? 0,
        agentCount: agents.count ?? 0,
        promptCount: prompts.count ?? 0,
        activity,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: "Projects", value: stats?.projectCount ?? 0, icon: FolderKanban, color: "text-blue-500" },
    { label: "AI Agents", value: stats?.agentCount ?? 0, icon: Bot, color: "text-emerald-500" },
    { label: "Prompts", value: stats?.promptCount ?? 0, icon: MessageSquare, color: "text-amber-500" },
  ];

  const typeIcon = { project: FolderKanban, agent: Bot, prompt: MessageSquare } as const;
  const typeLabel = { project: "Project", agent: "Agent", prompt: "Prompt" } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back — here's an overview of your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.activity && stats.activity.length > 0 ? (
            <ul className="space-y-3">
              {stats.activity.map((item, i) => {
                const Icon = typeIcon[item.type];
                return (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {typeLabel[item.type]} · {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet. Create a project, agent, or prompt to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
