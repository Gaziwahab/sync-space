import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, RotateCcw, Trash2, GitCompare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  system_prompt: string;
  user_message_template: string;
  model: string;
  variables: string[];
  notes: string;
  created_at: string;
  user_id: string;
}

interface PromptVersionsPanelProps {
  promptId: string | null;
  promptName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: { system_prompt: string; user_message_template: string; model: string }) => void;
}

export function PromptVersionsPanel({ promptId, promptName, open, onOpenChange, onRestore }: PromptVersionsPanelProps) {
  const queryClient = useQueryClient();
  const [comparing, setComparing] = useState<[PromptVersion | null, PromptVersion | null]>([null, null]);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["prompt-versions", promptId],
    queryFn: async () => {
      if (!promptId) return [];
      const { data, error } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", promptId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as unknown as PromptVersion[];
    },
    enabled: !!promptId && open,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompt_versions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-versions", promptId] });
      toast.success("Version deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCompareToggle = (v: PromptVersion) => {
    if (comparing[0]?.id === v.id) return setComparing([null, comparing[1]]);
    if (comparing[1]?.id === v.id) return setComparing([comparing[0], null]);
    if (!comparing[0]) return setComparing([v, comparing[1]]);
    setComparing([comparing[0], v]);
  };

  const isComparing = comparing[0] && comparing[1];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Version History
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{promptName}</p>
        </SheetHeader>

        {isComparing && (
          <Card className="p-3 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <GitCompare className="h-3 w-3" /> Comparing v{comparing[0]!.version_number} ↔ v{comparing[1]!.version_number}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setComparing([null, null])}>Clear</Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <p className="text-muted-foreground mb-1">v{comparing[0]!.version_number} System Prompt</p>
                <pre className="bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">{comparing[0]!.system_prompt}</pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">v{comparing[1]!.version_number} System Prompt</p>
                <pre className="bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">{comparing[1]!.system_prompt}</pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">v{comparing[0]!.version_number} Template</p>
                <pre className="bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">{comparing[0]!.user_message_template}</pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">v{comparing[1]!.version_number} Template</p>
                <pre className="bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">{comparing[1]!.user_message_template}</pre>
              </div>
            </div>
          </Card>
        )}

        <ScrollArea className="h-[calc(100vh-220px)] mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !versions?.length ? (
            <p className="text-center text-muted-foreground py-12">
              No versions saved yet. Save your prompt to create the first version.
            </p>
          ) : (
            <div className="space-y-2 pr-2">
              {versions.map((v) => (
                <Card
                  key={v.id}
                  className={`p-3 space-y-2 ${
                    comparing[0]?.id === v.id || comparing[1]?.id === v.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono">v{v.version_number}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{v.model.split("/").pop()}</span>
                  </div>
                  {v.notes && <p className="text-xs text-muted-foreground italic">{v.notes}</p>}
                  <p className="text-xs font-mono text-foreground/80 line-clamp-2">{v.system_prompt}</p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        onRestore({ system_prompt: v.system_prompt, user_message_template: v.user_message_template, model: v.model });
                        onOpenChange(false);
                        toast.success(`Restored v${v.version_number}`);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCompareToggle(v)}
                    >
                      <GitCompare className="h-3 w-3 mr-1" /> Compare
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => deleteMutation.mutate(v.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
