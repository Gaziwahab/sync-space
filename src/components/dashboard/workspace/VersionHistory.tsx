import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, GitCommit, RefreshCcw, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface VersionHistoryProps {
  projectId: string;
  activeFile: string | null;
  onRestore: (filePath: string, content: string) => void;
  onClose: () => void;
}

// Since we don't have a dedicated file_versions table yet, we'll
// simulate version history by fetching recent project messages 
// that contain code blocks for this file, or just show the current state
// if no elaborate history exists.

export function VersionHistory({ projectId, activeFile, onRestore, onClose }: VersionHistoryProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["file-versions", projectId, activeFile],
    queryFn: async () => {
      if (!activeFile) return [];
      
      // Fetch messages that might contain this file's code
      const { data, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .eq("message_type", "code")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      // Filter messages that actually have a code block matching our active file
      // This is a naive approximation since we don't have proper version tracking
      const matchingVersions = (data || []).filter(msg => {
        // Simple regex check to see if the file name exists in a markdown block
        const fileRegex = new RegExp(`\`\`\`${activeFile.split('/').pop()}|${activeFile.split('.').pop()}`, 'i');
        return fileRegex.test(msg.content);
      }).map((msg, index) => {
        // Extract the code content
        const regex = /```([^\n]+)\n([\s\S]*?)```/g;
        let match;
        let content = "";
        
        // Find the block that matches our file type roughly
        while ((match = regex.exec(msg.content)) !== null) {
           content = match[2];
           break; // Just grab the first code block for simplicity in this demo
        }
        
        return {
          id: msg.id,
          created_at: msg.created_at,
          agent_name: msg.agent_name,
          content: content || "Code content placeholder",
          version_num: data.length - index
        };
      });
      
      return matchingVersions;
    },
    enabled: !!activeFile
  });

  const handleRestore = (version: any) => {
    if (!activeFile) return;
    setRestoringId(version.id);
    
    // Simulate slight delay for effect
    setTimeout(() => {
      onRestore(activeFile, version.content);
      toast.success(`Restored ${activeFile} to version ${version.version_num}`);
      setRestoringId(null);
      onClose();
    }, 600);
  };

  if (!activeFile) {
    return (
      <div className="flex flex-col h-full bg-background border-l border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="h-4 w-4" /> Version History
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
        </div>
        <div className="p-12 text-center text-muted-foreground text-sm">
          Select a file to view its history
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-80 shrink-0 shadow-lg">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div>
          <h3 className="font-medium text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> History
          </h3>
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">{activeFile}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : versions?.length === 0 ? (
            <div className="text-center p-8 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-border/50">
              No previous versions found for this file.
            </div>
          ) : (
            <div className="relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-border space-y-4">
              {versions?.map((version, idx) => (
                <div key={version.id} className="relative pl-8">
                  <div className="absolute left-0 p-1 bg-background border border-border rounded-full shadow-sm z-10">
                    <GitCommit className="h-3 w-3 text-primary" />
                  </div>
                  
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">v{version.version_num}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
                      <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${version.agent_name}`} alt="avatar" className="w-4 h-4 rounded-full bg-primary/10" />
                      Updated by <span className="font-medium text-foreground">{version.agent_name}</span>
                    </p>
                    
                    {idx !== 0 && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-[10px] h-7 bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        onClick={() => handleRestore(version)}
                        disabled={restoringId === version.id}
                      >
                        {restoringId === version.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-3 w-3 mr-1" />
                        )}
                        Restore this version
                      </Button>
                    )}
                    
                    {idx === 0 && (
                      <div className="text-[10px] font-medium text-emerald-500 flex items-center justify-center py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                        Current Version
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
