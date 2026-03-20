import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Send, Loader2, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Agent } from "./AgentCard";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

async function streamChat({
  messages,
  systemPrompt,
  model,
  onDelta,
  onDone,
  signal,
}: {
  messages: Msg[];
  systemPrompt: string;
  model: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, systemPrompt, model }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}

interface AgentChatPanelProps {
  agent: Agent | null;
  onClose: () => void;
}

export function AgentChatPanel({ agent, onClose }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load memory from localStorage
  useEffect(() => {
    if (agent?.id) {
      const saved = localStorage.getItem(`agent-chat-${agent.id}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse agent memory", e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    setInput("");
  }, [agent?.id]);

  // Save memory to localStorage
  useEffect(() => {
    if (agent?.id && messages.length > 0) {
      localStorage.setItem(`agent-chat-${agent.id}`, JSON.stringify(messages));
    }
  }, [messages, agent?.id]);

  const clearMemory = () => {
    if (agent?.id) {
      localStorage.removeItem(`agent-chat-${agent.id}`);
      setMessages([]);
      toast.success("Agent memory cleared");
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !agent || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const controller = new AbortController();
    abortRef.current = controller;

    if (isDemoMode) {
      // Simulate demo mode response
      setTimeout(() => {
        const demoResponses = [
          "This is a demo response running locally.",
          "I've analyzed your request in Demo Mode! 🚀",
          "This is just a simulated reply to save credits.",
          "Demo mode active. No API calls were made."
        ];
        const randomResp = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        let i = 0;
        const interval = setInterval(() => {
          assistantSoFar += randomResp.charAt(i);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
          i++;
          if (i >= randomResp.length) {
            clearInterval(interval);
            setIsLoading(false);
          }
        }, 50);
      }, 500);
      return;
    }

    try {
      await streamChat({
        messages: newMessages,
        systemPrompt: agent.system_prompt,
        model: agent.model,
        signal: controller.signal,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message);
      }
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={!!agent} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <SheetTitle className="text-base">{agent?.name ?? "Agent"}</SheetTitle>
              {isDemoMode && <span className="text-[9px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Demo</span>}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={clearMemory} title="Clear Memory" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-mono">{agent?.model.split("/").pop()}</p>
            <div className="flex items-center gap-2">
              <Switch id="demo-mode" checked={isDemoMode} onCheckedChange={setIsDemoMode} className="scale-75" />
              <Label htmlFor="demo-mode" className="text-xs cursor-pointer text-muted-foreground">Demo Mode</Label>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Send a message to test this agent
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
