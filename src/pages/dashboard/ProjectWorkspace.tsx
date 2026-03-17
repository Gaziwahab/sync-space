import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, MessageSquare, Code, Monitor,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";
import { GroupChat } from "@/components/dashboard/workspace/GroupChat";
import { CodeEditor } from "@/components/dashboard/workspace/CodeEditor";
import { LivePreview } from "@/components/dashboard/workspace/LivePreview";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Message {
  id: string;
  agent_name: string;
  agent_role: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface ProjectFile {
  id: string;
  file_path: string;
  content: string;
  updated_by_agent: string;
  updated_at: string;
}

type PanelView = "all" | "chat" | "editor" | "preview" | "editor+preview" | "chat+editor";

const ProjectWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("all");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useQuery({
    queryKey: ["project-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_messages").select("*").eq("project_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages((data as Message[]) || []);
      return data;
    },
    enabled: !!id,
  });

  useQuery({
    queryKey: ["project-files", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files").select("*").eq("project_id", id!)
        .order("file_path", { ascending: true });
      if (error) throw error;
      const filesData = (data as ProjectFile[]) || [];
      setFiles(filesData);
      if (filesData.length > 0 && !activeFile) setActiveFile(filesData[0].file_path);
      return data;
    },
    enabled: !!id,
  });

  // Realtime: messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`project-messages-${id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "project_messages",
        filter: `project_id=eq.${id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Realtime: files
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`project-files-${id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "project_files",
        filter: `project_id=eq.${id}`,
      }, (payload) => {
        const newFile = payload.new as ProjectFile;
        setFiles((prev) => {
          const idx = prev.findIndex((f) => f.id === newFile.id);
          if (idx >= 0) return prev.map((f) => (f.id === newFile.id ? newFile : f));
          return [...prev, newFile];
        });
        if (!activeFile) setActiveFile(newFile.file_path);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, activeFile]);

  const callOrchestrator = async (body: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...body, project_id: id, user_id: user.id }),
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Build failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }
  };

  const handleStartBuild = async () => {
    if (!project || !id) return;
    try {
      setIsBuilding(true);
      await callOrchestrator({ description: project.description || project.name });
      toast.success("Build complete!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleUserMessage = async (message: string) => {
    if (!id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Optimistic: show user message immediately
      const optimisticMsg: Message = {
        id: crypto.randomUUID(),
        agent_name: "You",
        agent_role: "user",
        content: message,
        message_type: "text",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      await supabase.from("project_messages").insert({
        project_id: id, user_id: user.id,
        agent_name: "You", agent_role: "user",
        content: message, message_type: "text",
      });

      setIsBuilding(true);
      await callOrchestrator({ continue_from: "user_reply", user_message: message });
      toast.success("Agents responded!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleFileChange = useCallback(async (filePath: string, newContent: string) => {
    // Optimistic update
    setFiles((prev) => prev.map((f) =>
      f.file_path === filePath ? { ...f, content: newContent, updated_by_agent: "You" } : f
    ));

    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const file = files.find((f) => f.file_path === filePath);
    if (file) {
      await supabase.from("project_files")
        .update({ content: newContent, updated_by_agent: "You", updated_at: new Date().toISOString() })
        .eq("id", file.id);
    }
  }, [files]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const showChat = panelView === "all" || panelView === "chat" || panelView === "chat+editor";
  const showEditor = panelView === "all" || panelView === "editor" || panelView === "editor+preview" || panelView === "chat+editor";
  const showPreview = panelView === "all" || panelView === "preview" || panelView === "editor+preview";

  const viewButtons: { view: PanelView; icon: React.ElementType; label: string }[] = [
    { view: "all", icon: PanelLeftOpen, label: "All Panels" },
    { view: "chat", icon: MessageSquare, label: "Chat Only" },
    { view: "editor", icon: Code, label: "Editor Only" },
    { view: "preview", icon: Monitor, label: "Preview Only" },
    { view: "editor+preview", icon: PanelLeftClose, label: "Editor + Preview" },
    { view: "chat+editor", icon: MessageSquare, label: "Chat + Editor" },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Compact Toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border shrink-0 bg-muted/30">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 mr-2">
            <h1 className="text-sm font-semibold truncate">{project.name}</h1>
          </div>

          <div className="flex items-center gap-0.5 ml-auto border border-border rounded-md p-0.5 bg-background">
            {viewButtons.map(({ view, icon: Icon, label }) => (
              <Tooltip key={view}>
                <TooltipTrigger asChild>
                  <Button
                    variant={panelView === view ? "secondary" : "ghost"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setPanelView(view)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {isBuilding && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" /> Building...
            </div>
          )}
        </div>

        {/* Panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {showChat && (
            <>
              <ResizablePanel defaultSize={showEditor || showPreview ? 25 : 100} minSize={15}>
                <GroupChat
                  messages={messages}
                  isBuilding={isBuilding}
                  onStartBuild={handleStartBuild}
                  onUserMessage={handleUserMessage}
                />
              </ResizablePanel>
              {(showEditor || showPreview) && <ResizableHandle withHandle />}
            </>
          )}
          {showEditor && (
            <>
              <ResizablePanel defaultSize={showChat && showPreview ? 40 : showChat || showPreview ? 50 : 100} minSize={20}>
                <CodeEditor
                  files={files}
                  activeFile={activeFile}
                  onSelectFile={setActiveFile}
                  onFileChange={handleFileChange}
                />
              </ResizablePanel>
              {showPreview && <ResizableHandle withHandle />}
            </>
          )}
          {showPreview && (
            <ResizablePanel defaultSize={showChat && showEditor ? 35 : showChat || showEditor ? 50 : 100} minSize={15}>
              <LivePreview files={files} />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
};

export default ProjectWorkspace;
