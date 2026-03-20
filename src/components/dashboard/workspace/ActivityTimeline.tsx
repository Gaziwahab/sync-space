import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileEdit, MessageSquare, Plus, Activity, Rocket, User, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityTimelineProps {
  projectId: string;
}

interface TimelineEvent {
  id: string;
  type: "message" | "file_create" | "file_update" | "deploy";
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  actorRole: "user" | "agent";
}

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  // Fetch messages directly for the timeline
  const { data: messages } = useQuery({
    queryKey: ["timeline-messages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch files to extract created/updated logic
  const { data: files } = useQuery({
    queryKey: ["timeline-files", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Aggregate into a single timeline arrary
  let events: TimelineEvent[] = [];

  if (messages) {
    messages.forEach(msg => {
      events.push({
        id: `msg-${msg.id}`,
        type: "message",
        title: "Message Sent",
        description: msg.content,
        timestamp: msg.created_at,
        actor: msg.agent_name || "Unknown",
        actorRole: msg.agent_role === "user" ? "user" : "agent"
      });
    });
  }

  if (files) {
    files.forEach(file => {
      events.push({
        id: `file-${file.id}`,
        type: "file_update",
        title: "File Updated",
        description: `Modified ${file.file_path}`,
        timestamp: file.updated_at || file.created_at,
        actor: file.updated_by_agent || "System",
        actorRole: file.updated_by_agent === "You" ? "user" : "agent"
      });
    });
  }

  // Sort events by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit to top 30 events for performance
  events = events.slice(0, 30);

  const getEventIcon = (type: TimelineEvent["type"], role: TimelineEvent["actorRole"]) => {
    switch (type) {
      case "message": return role === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-orange-500" />;
      case "file_create": return <Plus className="h-4 w-4 text-green-500" />;
      case "file_update": return <FileEdit className="h-4 w-4 text-blue-500" />;
      case "deploy": return <Rocket className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBg = (type: TimelineEvent["type"], role: TimelineEvent["actorRole"]) => {
    switch (type) {
      case "message": return role === "user" ? "bg-primary/10" : "bg-orange-500/10";
      case "file_create": return "bg-green-500/10";
      case "file_update": return "bg-blue-500/10";
      case "deploy": return "bg-purple-500/10";
      default: return "bg-muted";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-80 shrink-0 shadow-lg">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <Activity className="h-4 w-4 text-primary" /> Activity Timeline
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Project history and agent interactions</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-5 pt-6">
          {events.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-xs bg-muted/30 rounded-lg border border-border border-dashed">
              No activity recorded yet for this project.
            </div>
          ) : (
            <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
              {events.map((event, i) => (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${getEventBg(event.type, event.actorRole)}`}>
                    {getEventIcon(event.type, event.actorRole)}
                  </span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {event.actor}
                      </span>
                      <time className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.timestamp), "MMM d, HH:mm")}
                      </time>
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground/80 font-medium">
                      {event.title}
                    </p>
                    
                    {event.type === "message" ? (
                      <div className="mt-1.5 p-2 bg-muted/40 rounded-md border border-border/50">
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-primary/80 mt-0.5 font-mono bg-primary/5 px-1.5 py-0.5 rounded w-fit border border-primary/10">
                        {event.description}
                      </p>
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
