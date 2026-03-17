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
import { Loader2 } from "lucide-react";
import type { Agent } from "./AgentCard";

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "openai/gpt-5", label: "GPT-5" },
];

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
  }) => void;
  isSaving: boolean;
  projects: { id: string; name: string }[];
}

export function AgentFormDialog({ open, onOpenChange, editing, onSubmit, isSaving, projects }: AgentFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("worker");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [projectId, setProjectId] = useState<string>("none");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setRole(editing.role);
      setSystemPrompt(editing.system_prompt);
      setModel(editing.model);
      setProjectId(editing.project_id ?? "none");
    } else {
      setName("");
      setDescription("");
      setRole("worker");
      setSystemPrompt("You are a helpful AI assistant.");
      setModel("google/gemini-3-flash-preview");
      setProjectId("none");
    }
  }, [editing, open]);

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      role,
      system_prompt: systemPrompt,
      model,
      project_id: projectId === "none" ? null : projectId,
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              placeholder="Instructions for the agent..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
