import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, RotateCcw } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

interface PromptTestPanelProps {
  messages: Msg[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export function PromptTestPanel({ messages, input, onInputChange, onSend, onClear, isLoading }: PromptTestPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-sm font-medium">Test Output</span>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" /> Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Run your prompt to see the output here
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground font-mono text-xs"
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

      <div className="p-3 border-t border-border">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
          <Input
            placeholder="Follow-up message..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
