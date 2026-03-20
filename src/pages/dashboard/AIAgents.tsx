import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bot, Plus, Loader2, Filter, Users } from "lucide-react";
import { toast } from "sonner";
import { AgentCard, type Agent } from "@/components/dashboard/agents/AgentCard";
import { AgentFormDialog } from "@/components/dashboard/agents/AgentFormDialog";
import { AgentChatPanel } from "@/components/dashboard/agents/AgentChatPanel";
import { DEFAULT_AGENTS } from "@/lib/defaultAgents";

const AIAgents = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Agent[];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; description: string; role: string; system_prompt: string; model: string; project_id: string | null; api_key_id: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("agents").insert({
        ...input,
        description: input.description || null,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent created");
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { name: string; description: string; role: string; system_prompt: string; model: string; project_id: string | null; api_key_id: string | null }) => {
      if (!editing) return;
      const { error } = await supabase
        .from("agents")
        .update({ ...input, description: input.description || null })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent updated");
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (data: { name: string; description: string; role: string; system_prompt: string; model: string; project_id: string | null; api_key_id: string | null }) => {
    if (!data.name.trim()) return toast.error("Name is required");
    editing ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const createDefaultTeam = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const inserts = DEFAULT_AGENTS.map((a) => ({
        name: a.name,
        description: a.description,
        role: a.role,
        system_prompt: a.system_prompt,
        model: a.model,
        user_id: user.id,
        project_id: null,
      }));
      const { error } = await supabase.from("agents").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Default team created! (Boss, Planner, Designer, Frontend Dev, Backend Dev, Tester, Debugger)");
    },
    onError: (e) => toast.error(e.message),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const filteredAgents = agents?.filter((a) => {
    if (projectFilter === "all") return true;
    if (projectFilter === "unassigned") return !a.project_id;
    return a.project_id === projectFilter;
  });

  const getProjectName = (id: string | null) => {
    if (!id) return null;
    return projects?.find((p) => p.id === id)?.name;
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-2"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl border border-border"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground text-sm">Create and manage your AI team members</p>
        </div>
        <div className="flex items-center gap-2">
          {projects && projects.length > 0 && (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            onClick={() => createDefaultTeam.mutate()}
            disabled={createDefaultTeam.isPending}
          >
            {createDefaultTeam.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
            Create Default Team
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Agent
          </Button>
        </div>
      </div>

      {filteredAgents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No agents yet</h2>
          <p className="text-muted-foreground mb-4">Create your first AI agent to get started</p>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Agent
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents?.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              projectName={getProjectName(agent.project_id)}
              onEdit={(a) => { setEditing(a); setDialogOpen(true); }}
              onDelete={setDeleteId}
              onChat={setChatAgent}
            />
          ))}
        </div>
      )}

      <AgentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        projects={projects || []}
      />

      <AgentChatPanel agent={chatAgent} onClose={() => setChatAgent(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The agent will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIAgents;
