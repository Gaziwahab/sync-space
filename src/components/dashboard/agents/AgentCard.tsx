import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bot, MoreVertical, Pencil, Trash2, MessageSquare, Crown, FolderOpen } from "lucide-react";

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  role: string;
  system_prompt: string;
  model: string;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentCardProps {
  agent: Agent;
  projectName?: string | null;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onChat: (agent: Agent) => void;
}

const roleIcons: Record<string, typeof Bot> = {
  leader: Crown,
  worker: Bot,
};

export function AgentCard({ agent, projectName, onEdit, onDelete, onChat }: AgentCardProps) {
  const RoleIcon = roleIcons[agent.role] || Bot;

  return (
    <Card className="p-4 flex flex-col gap-3 group hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <RoleIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{agent.name}</h3>
            {agent.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{agent.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onChat(agent)}>
              <MessageSquare className="h-4 w-4 mr-2" /> Test Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(agent)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(agent.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs capitalize">{agent.role}</Badge>
          <Badge
            variant={agent.status === "active" ? "default" : "outline"}
            className="text-xs capitalize"
          >
            {agent.status}
          </Badge>
          {projectName && (
            <Badge variant="outline" className="text-xs gap-1">
              <FolderOpen className="h-3 w-3" /> {projectName}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {agent.model.split("/").pop()}
        </span>
      </div>
    </Card>
  );
}
