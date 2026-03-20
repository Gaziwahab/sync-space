import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MessageSquare, Code, Monitor, PanelLeftClose, PanelLeftOpen, Bot, History, Share2, ShieldCheck, Activity } from "lucide-react";
import { toast } from "sonner";
import { GroupChat } from "@/components/dashboard/workspace/GroupChat";
import { CodeEditor } from "@/components/dashboard/workspace/CodeEditor";
import { LivePreview } from "@/components/dashboard/workspace/LivePreview";
import { TeamOverview } from "@/components/dashboard/workspace/TeamOverview";
import { VersionHistory } from "@/components/dashboard/workspace/VersionHistory";
import { SecurityScanner } from "@/components/dashboard/workspace/SecurityScanner";
import { ActivityTimeline } from "@/components/dashboard/workspace/ActivityTimeline";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useApiKeyContext } from "@/contexts/ApiKeyContext";

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

type PanelView = "all" | "chat" | "editor" | "preview" | "editor+preview" | "chat+editor" | "team";

// ─── Maps agent name (from Boss JSON) → step string the Edge Function accepts ──
const AGENT_NAME_TO_STEP: Record<string, string> = {
  Planner: "planner",
  Designer: "designer",
  "Backend Dev": "backend",
  "Frontend Dev": "frontend",
};

const MAX_QA_ITERATIONS = 4;

const ProjectWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [panelView, setPanelView] = useState<PanelView>("all");
  const [showHistory, setShowHistory] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const { selectedKeyId, selectedModel } = useApiKeyContext();

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

  // ─── Core single-step invoker ─────────────────────────────────────────────
  // Calls the Edge Function for ONE step and returns the response data.
  // Each call finishes in ~30-60s, well under the 150s timeout limit.
  const invokeStep = async (body: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: { session } } = await supabase.auth.getSession();
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const token = session?.access_token || anonKey;

    const payload = {
      ...body,
      project_id: id,
      user_id: user.id,
      global_api_key_id: selectedKeyId,
      model: selectedModel || undefined,
    };

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": anonKey,
          "X-Client-Info": "synthi-build-hub",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }

    return await resp.json();
  };

  // ─── Step label for toast messages ───────────────────────────────────────
  const getStepLabel = (step: string, qaRound?: number) => {
    const labels: Record<string, string> = {
      boss: "Boss is reviewing the brief...",
      planner: "Planner is architecting the site...",
      designer: "Designer is creating the spec...",
      backend: "Backend Dev is preparing data...",
      frontend: "Frontend Dev is building the website...",
      tester: `Tester is running QA${qaRound && qaRound > 1 ? ` (round ${qaRound})` : ""}...`,
      debugger: `Debugger is fixing issues${qaRound ? ` (round ${qaRound})` : ""}...`,
      done: "Wrapping up...",
    };
    return labels[step] || `Running ${step}...`;
  };

  // ─── Full build pipeline ──────────────────────────────────────────────────
  // Runs boss → planner → designer → backend → frontend → tester ⟷ debugger
  // Each agent is a separate Edge Function call to avoid the 150s timeout.
  const runPipeline = async (description: string) => {
    let step = "boss";
    let qaRound = 1;
    const taskMap: Record<string, string> = {};
    let toastId: string | number | undefined;

    while (step && step !== "done") {
      setCurrentStep(step);
      toastId = toast.loading(getStepLabel(step, qaRound), { id: toastId, duration: 300000 });

      const data = await invokeStep({
        step,
        description,
        task: taskMap[step] || null,
        qa_round: qaRound,
      });

      if (!data.success) throw new Error(data.error || `Step "${step}" failed`);

      // Boss returns task_map — store tasks for each downstream agent
      if (step === "boss" && data.task_map) {
        for (const [agentName, agentTask] of Object.entries(data.task_map)) {
          const s = AGENT_NAME_TO_STEP[agentName as string];
          if (s) taskMap[s] = agentTask as string;
        }
      }

      if (data.qa_round != null) qaRound = data.qa_round;

      step = data.next_step ?? "";
    }

    toast.dismiss(toastId);
  };

  // ─── User reply pipeline ──────────────────────────────────────────────────
  // Boss reads the user message and returns a step_queue.
  // We then run each step in the queue sequentially.
  const runUserReplyPipeline = async (userMessage: string) => {
    let toastId: string | number | undefined;

    // Step 1: Boss decides what to do
    setCurrentStep("boss");
    toastId = toast.loading("Boss is reading your message...", { duration: 300000 });

    const bossData = await invokeStep({
      continue_from: "user_reply",
      user_message: userMessage,
    });

    if (!bossData.success) throw new Error(bossData.error || "Boss step failed");

    const stepQueue: Array<{ step: string; task: string }> = bossData.step_queue || [];

    // Step 2: Run each step in the queue
    let qaRound = 1;

    for (const { step, task } of stepQueue) {
      // Skip tester/debugger here — handled by QA loop below
      if (step === "tester" || step === "debugger") continue;

      setCurrentStep(step);
      toast.loading(getStepLabel(step, qaRound), { id: toastId, duration: 300000 });

      const data = await invokeStep({ step, task, qa_round: qaRound });
      if (!data.success) throw new Error(data.error || `Step "${step}" failed`);
      if (data.qa_round != null) qaRound = data.qa_round;
    }

    // Step 3: Run QA loop if any build steps were included
    const needsQA = stepQueue.some((s) => ["frontend", "debugger"].includes(s.step));
    if (needsQA) {
      let qaStep = "tester";
      let currentQaRound = 1;

      while (qaStep && qaStep !== "done") {
        setCurrentStep(qaStep);
        toast.loading(getStepLabel(qaStep, currentQaRound), { id: toastId, duration: 300000 });

        const data = await invokeStep({ step: qaStep, qa_round: currentQaRound });
        if (!data.success) throw new Error(data.error || `Step "${qaStep}" failed`);
        if (data.qa_round != null) currentQaRound = data.qa_round;

        qaStep = data.next_step ?? "";
      }
    }

    // Step 4: Boss wrap-up message
    await invokeStep({ step: "done" });

    toast.dismiss(toastId);
  };

  // ─── Handle start build ───────────────────────────────────────────────────
  const handleStartBuild = async () => {
    if (!project || !id) return;
    setIsBuilding(true);
    setCurrentStep("boss");
    try {
      await runPipeline(project.description || project.name);
      toast.success("Build complete! Your website is ready.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsBuilding(false);
      setCurrentStep("");
    }
  };

  // ─── Handle user follow-up message ───────────────────────────────────────
  const handleUserMessage = async (message: string) => {
    if (!id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Show user message immediately (optimistic)
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
      await runUserReplyPipeline(message);
      toast.success("Done! Changes applied.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsBuilding(false);
      setCurrentStep("");
    }
  };

  // ─── Handle file edits ────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (filePath: string, newContent: string) => {
    setFiles((prev) => prev.map((f) =>
      f.file_path === filePath ? { ...f, content: newContent, updated_by_agent: "You" } : f
    ));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const file = files.find((f) => f.file_path === filePath);
    if (file) {
      await supabase.from("project_files")
        .update({ content: newContent, updated_by_agent: "You", updated_at: new Date().toISOString() })
        .eq("id", file.id);
    }
  }, [files]);

  // ─── Handle file creation ─────────────────────────────────────────────────
  const handleCreateFile = async (filePath: string) => {
    if (!id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (files.some(f => f.file_path === filePath)) {
        toast.error("A file with this name already exists");
        return;
      }

      const newFile: ProjectFile = {
        id: crypto.randomUUID(),
        file_path: filePath,
        content: "",
        updated_by_agent: "You",
        updated_at: new Date().toISOString(),
      };

      setFiles(prev => [...prev, newFile]);
      setActiveFile(filePath);

      const { error } = await supabase.from("project_files").insert({
        project_id: id, user_id: user.id,
        file_path: filePath, content: "", updated_by_agent: "You",
      });

      if (error) throw error;
    } catch (e: any) {
      toast.error(e.message);
      setFiles(prev => prev.filter(f => f.file_path !== filePath));
    }
  };

  // ─── Loading / not found states ───────────────────────────────────────────
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
    { view: "team", icon: Bot, label: "Team Overview" },
  ];

  // Step label shown in the toolbar while building
  const buildingLabel: Record<string, string> = {
    boss: "Boss briefing...",
    planner: "Planning...",
    designer: "Designing...",
    backend: "Preparing data...",
    frontend: "Building...",
    tester: "QA testing...",
    debugger: "Debugging...",
    done: "Finishing...",
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Compact Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-md">
          <Button variant="ghost" size="icon" className="h-8 w-8 clay-panel hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 mr-4 ml-1">
            <h1 className="text-sm font-bold truncate tracking-wide">{project.name}</h1>
          </div>

          <div className="flex items-center gap-1 ml-auto p-1 clay-inset rounded-xl bg-muted/20">
            {viewButtons.map(({ view, icon: Icon, label }) => (
              <Tooltip key={view}>
                <TooltipTrigger asChild>
                  <Button
                    variant={panelView === view ? "default" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 transition-all duration-300 rounded-lg ${panelView === view ? "clay-btn" : "hover:bg-muted/50"}`}
                    onClick={() => setPanelView(view)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Building status indicator */}
          {isBuilding && (
            <div className="flex items-center gap-1.5 text-xs text-primary ml-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{buildingLabel[currentStep] || "Building..."}</span>
            </div>
          )}

          <div className="flex items-center ml-3 border-l border-border/50 pl-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs transition-colors clay-panel hover:bg-muted/50 gap-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Project link copied to clipboard!");
              }}
              title="Share Project"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              variant={showSecurity ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2 text-xs transition-colors ${showSecurity ? "bg-red-500 hover:bg-red-600 text-white" : "hover:text-red-500"}`}
              onClick={() => {
                setShowSecurity(!showSecurity);
                if (!showSecurity) { setShowHistory(false); setShowActivity(false); }
              }}
              title="Toggle Security Scanner"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Security
            </Button>
            <Button
              variant={showActivity ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2 text-xs transition-colors ${showActivity ? "clay-btn text-primary" : "hover:text-primary"}`}
              onClick={() => {
                setShowActivity(!showActivity);
                if (!showActivity) { setShowHistory(false); setShowSecurity(false); }
              }}
              title="Toggle Activity Timeline"
            >
              <Activity className="h-3.5 w-3.5 mr-1" />
              Activity
            </Button>
            <Button
              variant={showHistory ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2 text-xs transition-colors ${showHistory ? "clay-btn" : ""}`}
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) { setShowSecurity(false); setShowActivity(false); }
              }}
              title="Toggle Version History"
            >
              <History className="h-3.5 w-3.5 mr-1" />
              History
            </Button>
          </div>
        </div>

        {/* Panels */}
        {panelView === "team" ? (
          <div className="flex-1 overflow-hidden clay-inset m-2 rounded-2xl border border-border/50">
            <TeamOverview projectId={id} isBuilding={isBuilding} />
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="flex-1 p-2 gap-2">
            {showChat && (
              <ResizablePanel defaultSize={showEditor || showPreview ? 25 : 100} minSize={15} className="clay-card rounded-2xl overflow-hidden border border-border/50">
                <GroupChat
                  messages={messages}
                  isBuilding={isBuilding}
                  onStartBuild={handleStartBuild}
                  onUserMessage={handleUserMessage}
                  onApplyCode={(code) => {
                    if (activeFile) {
                      handleFileChange(activeFile, code);
                    } else {
                      toast.error("No active file selected to apply code to");
                    }
                  }}
                />
              </ResizablePanel>
            )}
            {showChat && (showEditor || showPreview) && <ResizableHandle withHandle className="bg-transparent w-2 -mx-1 z-10" />}
            {showEditor && (
              <ResizablePanel defaultSize={showChat && showPreview ? 40 : showChat || showPreview ? 50 : 100} minSize={20} className="clay-card rounded-2xl overflow-hidden border border-border/50">
                <div className="h-full flex relative overflow-hidden">
                  <div className="flex-1 overflow-hidden clay-inset rounded-xl m-1">
                    <CodeEditor
                      files={files}
                      activeFile={activeFile}
                      onSelectFile={setActiveFile}
                      onFileChange={handleFileChange}
                      onCreateFile={handleCreateFile}
                    />
                  </div>
                  {showHistory && activeFile && id && (
                    <VersionHistory
                      projectId={id}
                      activeFile={activeFile}
                      onRestore={handleFileChange}
                      onClose={() => setShowHistory(false)}
                    />
                  )}
                  {showSecurity && id && (
                    <SecurityScanner
                      projectId={id}
                      files={files}
                      onApplyFix={handleFileChange}
                      onClose={() => setShowSecurity(false)}
                    />
                  )}
                  {showActivity && id && (
                    <ActivityTimeline projectId={id} />
                  )}
                </div>
              </ResizablePanel>
            )}
            {showEditor && showPreview && <ResizableHandle withHandle className="bg-transparent w-2 -mx-1 z-10" />}
            {showPreview && (
              <ResizablePanel defaultSize={showChat && showEditor ? 35 : showChat || showEditor ? 50 : 100} minSize={15} className="clay-card rounded-2xl overflow-hidden border border-border/50">
                <div className="h-full w-full clay-inset m-1 rounded-xl overflow-hidden bg-white">
                  <LivePreview files={files} />
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ProjectWorkspace;