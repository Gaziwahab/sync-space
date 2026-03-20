import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot, Crown, Palette, Code, TestTube, Database, ClipboardList,
  Loader2, Bug, Send, User,
} from "lucide-react";

interface Message {
  id: string;
  agent_name: string;
  agent_role: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface GroupChatProps {
  messages: Message[];
  isBuilding: boolean;
  onStartBuild: () => void;
  onUserMessage?: (message: string) => void;
  onApplyCode?: (code: string) => void;
}

const roleConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  leader:   { icon: Crown,         color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Boss" },
  planner:  { icon: ClipboardList, color: "text-blue-400",   bg: "bg-blue-400/10",   label: "Planner" },
  designer: { icon: Palette,       color: "text-pink-400",   bg: "bg-pink-400/10",   label: "Designer" },
  frontend: { icon: Code,          color: "text-green-400",  bg: "bg-green-400/10",  label: "Frontend" },
  backend:  { icon: Database,      color: "text-purple-400", bg: "bg-purple-400/10", label: "Backend" },
  tester:   { icon: TestTube,      color: "text-orange-400", bg: "bg-orange-400/10", label: "Tester" },
  debugger: { icon: Bug,           color: "text-red-400",    bg: "bg-red-400/10",    label: "Debugger" },
  user:     { icon: User,          color: "text-primary",    bg: "bg-primary/10",    label: "You" },
  coder:    { icon: Code,          color: "text-green-400",  bg: "bg-green-400/10",  label: "Coder" },
  database: { icon: Database,      color: "text-purple-400", bg: "bg-purple-400/10", label: "Database" },
};

// Highlight @mentions in message content
function renderContent(content: string) {
  const parts = content.split(/(@\w[\w\s]*?\b)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return <span key={i} className="text-primary font-semibold">{part}</span>;
    }
    return part;
  });
}

export function GroupChat({ messages, isBuilding, onStartBuild, onUserMessage, onApplyCode }: GroupChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const msg = userInput.trim();
    if (!msg || !onUserMessage) return;
    onUserMessage(msg);
    setUserInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-semibold text-xs">Team Chat</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">{messages.length}</Badge>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 && !isBuilding && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Bot className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Your team is ready</p>
            <p className="text-xs text-muted-foreground/70 mb-4">Hit "Start Building" to begin</p>
          </div>
        )}

        <div className="space-y-2">
          {messages.map((msg) => {
            const config = roleConfig[msg.agent_role] || { icon: Bot, color: "text-muted-foreground", bg: "bg-muted", label: msg.agent_role };
            const Icon = config.icon;
            const isStatus = msg.message_type === "status";
            const isUser = msg.agent_role === "user";

            if (isStatus) {
              return (
                <div key={msg.id} className="flex items-center gap-2 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className={`text-[10px] ${config.color} flex items-center gap-1`}>
                    <Icon className="h-3 w-3" />
                    {msg.content}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2 items-start ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${config.bg} ${config.color} mt-0.5`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className={`min-w-0 max-w-[85%] ${isUser ? "items-end" : ""}`}>
                  <div className={`flex items-center gap-1.5 mb-0.5 ${isUser ? "flex-row-reverse" : ""}`}>
                    <span className={`text-[11px] font-bold ${config.color}`}>{msg.agent_name}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`text-[12px] leading-relaxed rounded-lg px-2 py-1 flex flex-col gap-2 ${
                    isUser ? "bg-primary/10" : "bg-muted/40 border border-border/50"
                  }`}>
                    {msg.content.length > 2000 ? (
                      <CollapsibleMessage content={msg.content} onApplyCode={onApplyCode} />
                    ) : (
                      renderMessageBlocks(msg.content, onApplyCode)
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isBuilding && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 justify-center">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="animate-pulse">Agents are collaborating...</span>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      <div className="p-2 border-t border-border space-y-2">
        {!isBuilding && messages.length === 0 && (
          <Button onClick={onStartBuild} className="w-full text-xs h-8">
            🚀 Start Building
          </Button>
        )}
        {onUserMessage && (
          <div className="flex gap-1.5">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Talk to the team..."
              className="flex-1 text-xs h-8"
              disabled={isBuilding}
            />
            <Button size="icon" variant="ghost" onClick={handleSend} disabled={!userInput.trim() || isBuilding} className="h-8 w-8">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function renderMessageBlocks(content: string, onApplyCode?: (code: string) => void) {
  // Simple markdown parser to separate code blocks from text
  const parts = content.split(/(```[\w]*\n[\s\S]*?\n```)/g);
  return (
    <div className="flex flex-col gap-1 w-full max-h-[400px] overflow-y-auto px-1 py-1">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.split('\n');
          const language = lines[0].replace('```', '').trim();
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={i} className="my-2 rounded-md border border-border overflow-hidden bg-background">
              <div className="flex items-center justify-between px-3 py-1 bg-muted/50 border-b border-border">
                <span className="text-[10px] font-mono text-muted-foreground">{language || 'code'}</span>
                {onApplyCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 hover:bg-primary hover:text-primary-foreground clay-panel shadow-none"
                    onClick={() => {
                      onApplyCode(code);
                      toast.success("Code applied to active file");
                    }}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Apply Code
                  </Button>
                )}
              </div>
              <pre className="p-3 text-[11px] font-mono overflow-x-auto whitespace-pre">
                {code}
              </pre>
            </div>
          );
        }
        return (
          <div key={i} className="whitespace-pre-wrap break-words">
            {renderContent(part)}
          </div>
        );
      })}
    </div>
  );
}

function CollapsibleMessage({ content, onApplyCode }: { content: string, onApplyCode?: (code: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const displayContent = expanded ? content : content.slice(0, 500);

  return (
    <div className="flex flex-col">
      {renderMessageBlocks(displayContent, onApplyCode)}
      {!expanded && "..."}
      <button
        onClick={() => setExpanded(!expanded)}
        className="self-start text-primary text-[10px] mt-1 hover:underline font-medium"
      >
        {expanded ? "Show less" : "Read full summary"}
      </button>
    </div>
  );
}
