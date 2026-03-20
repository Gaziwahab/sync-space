import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban, Bot, MessageSquare, Clock, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Overview = () => {
  const navigate = useNavigate();

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
    { label: "Active Projects", value: stats?.projectCount ?? 0, icon: FolderKanban, color: "text-blue-500", bg: "bg-blue-500/10", nav: "/dashboard/projects" },
    { label: "AI Agents", value: stats?.agentCount ?? 0, icon: Bot, color: "text-emerald-500", bg: "bg-emerald-500/10", nav: "/dashboard/agents" },
    { label: "Saved Prompts", value: stats?.promptCount ?? 0, icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10", nav: "/dashboard/prompt-builder" },
  ];

  const typeIcon = { project: FolderKanban, agent: Bot, prompt: MessageSquare } as const;
  const typeLabel = { project: "Project", agent: "Agent", prompt: "Prompt" } as const;

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-8 pb-12 relative"
    >
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 mix-blend-screen opacity-50 animate-blob1"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -z-10 mix-blend-screen opacity-50 animate-blob2"></div>

      <motion.div variants={itemAnim} className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Workspace Overview
          </h1>
          <p className="text-muted-foreground text-sm">Welcome back — here's what's happening in your account.</p>
        </div>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-3">
        {statCards.map((s) => (
          <motion.div 
            key={s.label}
            variants={itemAnim}
            whileHover={{ y: -5, scale: 1.02 }}
            className="clay-card p-6 flex flex-col justify-between cursor-pointer group transition-all"
            onClick={() => navigate(s.nav)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
            <div>
              <p className="text-4xl font-black tracking-tight mb-1">{s.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemAnim} className="clay-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border/10 bg-muted/5 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Recent Activity
          </h2>
        </div>
        <div className="p-2">
          {stats?.activity && stats.activity.length > 0 ? (
            <ul className="space-y-1">
              {stats.activity.map((item, i) => {
                const Icon = typeIcon[item.type];
                return (
                  <motion.li 
                    key={i} 
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 bg-background/50 rounded-lg shadow-sm">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-medium truncate text-sm">{item.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-background border border-border/50 uppercase tracking-widest font-semibold text-[10px]">
                          {typeLabel[item.type]}
                        </span>
                        <span>{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <Clock className="h-8 w-8 opacity-50" />
              </div>
              <p>No activity yet. Create a project, agent, or prompt to get started.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Overview;
