import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Key } from "lucide-react";
import type { Agent } from "./AgentCard";
import { useApiKeyContext } from "@/contexts/ApiKeyContext";
import { PROVIDER_LABELS } from "@/hooks/useApiKeys";

const ROLES = [
  { value: "leader", label: "Leader" },
  { value: "worker", label: "Worker" },
];

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Agent | null;
  onSubmit: (data: {
    name: string;
    description: string;
    role: string;
    system_prompt: string;
    model: string;
    project_id: string | null;
    api_key_id: string | null;
  }) => void;
  isSaving: boolean;
  projects: { id: string; name: string }[];
}

export function AgentFormDialog({ open, onOpenChange, editing, onSubmit, isSaving, projects }: AgentFormDialogProps) {
  const { apiKeys, selectedModel } = useApiKeyContext();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("worker");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [projectId, setProjectId] = useState<string>("none");
  const [apiKeyId, setApiKeyId] = useState<string>("none");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setRole(editing.role);
      setSystemPrompt(editing.system_prompt);
      setProjectId(editing.project_id ?? "none");
      setApiKeyId(editing.api_key_id ?? "none");
    } else {
      setName("");
      setDescription("");
      setRole("worker");
      setSystemPrompt("You are a helpful AI assistant.");
      setProjectId("none");
      setApiKeyId("none");
    }
  }, [editing, open]);

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      role,
      system_prompt: systemPrompt,
      model: selectedModel || "default-model",
      project_id: projectId === "none" ? null : projectId,
      api_key_id: apiKeyId === "none" ? null : apiKeyId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Agent" : "New Agent"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="e.g. Research Assistant" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="Brief description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="clay-inset"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="clay-inset"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <Label className="flex items-center gap-1.5 text-primary"><Key className="h-3.5 w-3.5"/> Dedicated API Key</Label>
            <p className="text-xs text-muted-foreground mb-2">Optional. Override the global key for this specific agent.</p>
            <Select value={apiKeyId} onValueChange={setApiKeyId}>
              <SelectTrigger className="clay-inset bg-background"><SelectValue placeholder="Use Global Default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="font-medium">Use Global Default</SelectItem>
                {apiKeys.map(k => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.label} <span className="text-[10px] text-muted-foreground uppercase ml-1">({PROVIDER_LABELS[k.provider]})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              placeholder="Instructions for the agent..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="font-mono text-sm clay-inset"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !name.trim()} className="clay-btn">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
