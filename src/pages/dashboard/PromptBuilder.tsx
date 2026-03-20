import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Save, ChevronDown, Trash2, Loader2, Variable, History, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { SavePromptDialog } from "@/components/dashboard/prompt/PromptControls";
import { useApiKeyContext } from "@/contexts/ApiKeyContext";
import { PromptTestPanel } from "@/components/dashboard/prompt/PromptTestPanel";
import { PromptVersionsPanel } from "@/components/dashboard/prompt/PromptVersionsPanel";

type Msg = { role: "user" | "assistant"; content: string };

interface Prompt {
  id: string;
  name: string;
  system_prompt: string;
  user_message_template: string;
  model: string;
  variables: string[];
  created_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

const PromptBuilder = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [userTemplate, setUserTemplate] = useState("");
  const { selectedKeyId, selectedModel } = useApiKeyContext();
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [activePromptName, setActivePromptName] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);

  const detectedVars = extractVariables(systemPrompt + " " + userTemplate);

  const { data: savedPrompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Prompt[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = {
        name,
        system_prompt: systemPrompt,
        user_message_template: userTemplate,
        model: selectedModel || "default-model",
        variables: detectedVars,
        user_id: user.id,
      };

      let promptId = activePromptId;

      if (activePromptId) {
        const { error } = await supabase.from("prompts").update(payload).eq("id", activePromptId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("prompts").insert(payload).select("id").single();
        if (error) throw error;
        promptId = data.id;
        setActivePromptId(data.id);
      }

      // Save version snapshot
      if (promptId) {
        const { data: versions } = await supabase
          .from("prompt_versions")
          .select("version_number")
          .eq("prompt_id", promptId)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = (versions?.[0] as any)?.version_number ? (versions[0] as any).version_number + 1 : 1;

        await supabase.from("prompt_versions").insert({
          prompt_id: promptId,
          version_number: nextVersion,
          system_prompt: systemPrompt,
          user_message_template: userTemplate,
          model: selectedModel || "default-model",
          variables: detectedVars,
          user_id: user.id,
        });
      }

      setActivePromptName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      toast.success("Prompt saved (new version created)");
      setSaveOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt deleted");
      if (activePromptId) { setActivePromptId(null); setActivePromptName(""); }
    },
    onError: (e) => toast.error(e.message),
  });

  const loadPrompt = (p: Prompt) => {
    setSystemPrompt(p.system_prompt);
    setUserTemplate(p.user_message_template);
    setActivePromptId(p.id);
    setActivePromptName(p.name);
    setVariableValues({});
    setMessages([]);
  };

  const streamResponse = useCallback(async (allMessages: Msg[]) => {
    setIsStreaming(true);
    let assistantSoFar = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token || anonKey;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": anonKey,
            "X-Client-Info": "synthi-build-hub"
          },
          body: JSON.stringify({
            messages: allMessages,
            systemPrompt,
            model: selectedModel,
            global_api_key_id: selectedKeyId
          }),
        }
      );if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            // OpenAI / OpenRouter format
            let content = parsed.choices?.[0]?.delta?.content;
            // Gemini format
            if (!content) {
              content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            }

            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setIsStreaming(false);
  }, [systemPrompt, selectedModel]);

  const handleRun = () => {
    const resolved = interpolate(userTemplate, variableValues);
    if (!resolved.trim()) return toast.error("User message is empty");
    const userMsg: Msg = { role: "user", content: resolved };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    streamResponse(newMessages);
  };

  const handleFollowUp = () => {
    if (!followUp.trim()) return;
    const userMsg: Msg = { role: "user", content: followUp };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setFollowUp("");
    streamResponse(newMessages);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Prompt Builder</h1>
          <p className="text-muted-foreground text-sm">
            {activePromptName ? activePromptName : "Design, test, and iterate on prompts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedPrompts && savedPrompts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Load <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {savedPrompts.map((p) => (
                  <DropdownMenuItem key={p.id} className="flex justify-between">
                    <span className="truncate flex-1 cursor-pointer" onClick={() => loadPrompt(p)}>{p.name}</span>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 shrink-0 text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {activePromptId && (
            <Button variant="outline" size="sm" onClick={() => setVersionsOpen(true)}>
              <History className="h-4 w-4 mr-1" /> Versions
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)} className="clay-panel border-white/10 hover:border-primary/50">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define the agent's behavior..."
              rows={4}
              className="font-mono text-sm resize-none bg-background border-border/50 shadow-inner focus-visible:ring-primary/50 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              User Message Template
              <span className="ml-2 text-muted-foreground/70 normal-case tracking-normal">
                Use {"{{variable}}"} for dynamic values
              </span>
            </Label>
            <Textarea
              value={userTemplate}
              onChange={(e) => setUserTemplate(e.target.value)}
              placeholder="e.g. Summarize this article about {{topic}} in {{style}} style"
              rows={5}
              className="font-mono text-sm resize-none bg-background border-border/50 shadow-inner focus-visible:ring-primary/50 rounded-xl"
            />
          </div>
          {detectedVars.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-muted/20 clay-panel mt-2">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-primary" />
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Variables</Label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {detectedVars.map((v) => (
                  <div key={v} className="space-y-1">
                    <Badge variant="secondary" className="text-xs font-mono">{`{{${v}}}`}</Badge>
                    <Input
                      placeholder={`Value for ${v}`}
                      value={variableValues[v] ?? ""}
                      onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button onClick={handleRun} disabled={isStreaming} className="flex-1 clay-btn py-6 shadow-lg hover:shadow-xl transition-all">
              {isStreaming ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Play className="h-5 w-5 mr-2" />}
              <span className="text-base font-semibold">Run Prompt</span>
            </Button>
            <Button
              variant="outline"
              className="clay-panel hover:bg-muted/50 transition-colors py-6"
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) throw new Error("Not authenticated");
                  const promptDesc = `${systemPrompt}\n\n${interpolate(userTemplate, variableValues)}`.trim();
                  const { data, error } = await supabase
                    .from("projects")
                    .insert({
                      name: activePromptName || "Untitled Project",
                      description: promptDesc || null,
                      user_id: user.id,
                    })
                    .select("id")
                    .single();
                  if (error) throw error;
                  toast.success("Project created from prompt!");
                  navigate(`/dashboard/projects/${data.id}`);
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              <FolderPlus className="h-4 w-4 mr-2" /> Use as Project
            </Button>
          </div>
        </div>
        <PromptTestPanel
          messages={messages}
          input={followUp}
          onInputChange={setFollowUp}
          onSend={handleFollowUp}
          onClear={() => setMessages([])}
          isLoading={isStreaming}
        />
      </div>

      <SavePromptDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={(name) => saveMutation.mutate(name)}
        isSaving={saveMutation.isPending}
        defaultName={activePromptName}
      />

      <PromptVersionsPanel
        promptId={activePromptId}
        promptName={activePromptName}
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        onRestore={(v) => {
          setSystemPrompt(v.system_prompt);
          setUserTemplate(v.user_message_template);
        }}
      />
    </div>
  );
};

export default PromptBuilder;
