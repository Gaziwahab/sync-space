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
  api_key_id?: string | null;
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

import { Key } from "lucide-react";
import { useApiKeyContext } from "@/contexts/ApiKeyContext";
import { PROVIDER_LABELS } from "@/hooks/useApiKeys";

export function AgentCard({ agent, projectName, onEdit, onDelete, onChat }: AgentCardProps) {
  const RoleIcon = roleIcons[agent.role] || Bot;
  const { apiKeys } = useApiKeyContext();
  
  const assignedKey = agent.api_key_id 
    ? apiKeys.find(k => k.id === agent.api_key_id) 
    : null;

  return (
    <Card 
      className="clay-card p-5 flex flex-col gap-4 group hover-float cursor-pointer relative overflow-hidden"
      onClick={() => onChat(agent)}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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

      <div className="flex flex-col gap-3 mt-auto">
        {assignedKey && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-fit px-2 py-1 rounded-lg">
            <Key className="h-3 w-3" />
            <span>Dedicated Key: {PROVIDER_LABELS[assignedKey.provider]}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize clay-inset border-0">{agent.role}</Badge>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
              className={`text-xs capitalize border-0 ${agent.status === "active" ? "bg-success text-white shadow-sm" : "clay-inset"}`}
            >
              {agent.status}
            </Badge>
            {projectName && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/20 bg-primary/5 text-primary">
                <FolderOpen className="h-3 w-3" /> {projectName}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
