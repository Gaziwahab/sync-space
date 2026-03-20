import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Trash2, Search, Clock, AlertCircle, Info, AlertTriangle, ChevronRight, Wand2, Loader2, CheckCircle2, Sparkles as SparklesIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  details?: string;
  analysis?: {
    explanation: string;
    severity: "low" | "medium" | "high" | "critical";
    suggestedFix?: string;
  };
}

interface RequestEntry {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status: number | null;
  duration: number;
  requestBody?: string;
  responseBody?: string;
}

const levelIcon = {
  info: <Info className="h-3 w-3 text-primary" />,
  warn: <AlertTriangle className="h-3 w-3 text-warning" />,
  error: <AlertCircle className="h-3 w-3 text-destructive" />,
  debug: <Terminal className="h-3 w-3 text-muted-foreground" />,
};

const levelColor = {
  info: "text-primary",
  warn: "text-warning",
  error: "text-destructive",
  debug: "text-muted-foreground",
};

const DebugConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<RequestEntry | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const analyzeError = async (log: LogEntry) => {
    try {
      setAnalyzingId(log.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // For this demo, we'll invoke our agent-orchestrator edge function 
      // but send a specific "analyze_error" type request
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "analyze_error",
          error_message: log.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze error");
      }

      const result = await response.json();

      setLogs((prev) => prev.map((l) =>
        l.id === log.id
          ? { ...l, analysis: result.analysis }
          : l
      ));

      toast.success("Error analyzed successfully");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze error. Ensure you have tokens available.");

      // Fallback mock analysis for demo purposes if the API call fails or isn't set up
      setTimeout(() => {
        setLogs((prev) => prev.map((l) =>
          l.id === log.id
            ? {
              ...l,
              analysis: {
                explanation: "This error typically occurs when trying to access a property of undefined, or a network request was blocked due to CORS.",
                severity: l.level === "error" ? "high" : "medium",
                suggestedFix: "Check if the variable exists before accessing its properties using optional chaining (?.), or verify your backend CORS configuration."
              }
            }
            : l
        ));
        toast.info("Showing mock analysis (API unavailable)");
      }, 1000);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Intercept console methods
  useEffect(() => {
    const original = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    const addLog = (level: LogEntry["level"], args: any[]) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        source: "console",
        message: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
      };
      setLogs((prev) => [...prev.slice(-499), entry]);
    };

    console.log = (...args) => { original.log(...args); addLog("info", args); };
    console.warn = (...args) => { original.warn(...args); addLog("warn", args); };
    console.error = (...args) => { original.error(...args); addLog("error", args); };
    console.debug = (...args) => { original.debug(...args); addLog("debug", args); };

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const req = new Request(...args);
      const id = crypto.randomUUID();
      let reqBody: string | undefined;
      try { reqBody = await req.clone().text(); } catch { }

      try {
        const resp = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);
        let respBody: string | undefined;
        try { respBody = await resp.clone().text(); } catch { }

        setRequests((prev) => [...prev.slice(-199), {
          id, timestamp: new Date(), method: req.method, url: req.url,
          status: resp.status, duration, requestBody: reqBody, responseBody: respBody,
        }]);
        return resp;
      } catch (e) {
        const duration = Math.round(performance.now() - start);
        setRequests((prev) => [...prev.slice(-199), {
          id, timestamp: new Date(), method: req.method, url: req.url,
          status: null, duration, requestBody: reqBody, responseBody: String(e),
        }]);
        throw e;
      }
    };

    return () => {
      Object.assign(console, original);
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filteredLogs = logs.filter((l) => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (filter && !l.message.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = requests.filter((r) => {
    if (filter && !r.url.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const fmt = (d: Date) => {
    const t = d.toLocaleTimeString("en-US", { hour12: false });
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    return `${t}.${ms}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6" /> Debug Console
          </h1>
          <p className="text-muted-foreground text-sm">Live logs and network inspector</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLogs([]); setRequests([]); setSelectedRequest(null); }}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter logs and requests..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Tabs defaultValue="logs" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="logs" className="gap-1">
            <Terminal className="h-3 w-3" /> Logs
            {logs.length > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-xs">{logs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-1">
            <Clock className="h-3 w-3" /> Network
            {requests.length > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-xs">{requests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="flex-1 mt-3 min-h-0">
          <div className="flex gap-1 mb-2">
            {["all", "info", "warn", "error", "debug"].map((l) => (
              <Button
                key={l}
                variant={levelFilter === l ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setLevelFilter(l)}
              >
                {l === "all" ? "All" : l.charAt(0).toUpperCase() + l.slice(1)}
              </Button>
            ))}
          </div>
          <Card className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="p-2 space-y-0.5 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12 text-sm font-sans">
                    No logs yet. Interact with the app to see console output here.
                  </p>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className={`mb-2 rounded border overflow-hidden ${log.level === "error" ? "border-destructive/30" : log.level === "warn" ? "border-warning/30" : "border-border/50"}`}>
                      <div
                        className={`flex flex-col gap-2 p-3 ${log.level === "error" ? "bg-destructive/5" : log.level === "warn" ? "bg-warning/5" : "bg-muted/30"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 overflow-hidden">
                            <span className="shrink-0 mt-0.5 relative">
                              {levelIcon[log.level]}
                            </span>
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground shrink-0 tabular-nums">{fmt(log.timestamp)}</span>
                                <Badge variant="outline" className={`text-[10px] uppercase h-5 px-1.5 font-mono ${levelColor[log.level]} border-${log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'warning' : 'primary'}/20`}>
                                  {log.level}
                                </Badge>
                              </div>
                              <span className={`break-all ${levelColor[log.level]} font-semibold`}>{log.message}</span>
                            </div>
                          </div>

                          {(log.level === "error" || log.level === "warn") && !log.analysis && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 h-7 text-xs bg-background/50 backdrop-blur-sm shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                              onClick={() => analyzeError(log)}
                              disabled={analyzingId === log.id}
                            >
                              {analyzingId === log.id ? (
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                              ) : (
                                <Wand2 className="h-3 w-3 mr-1.5 text-primary" />
                              )}
                              Analyze
                            </Button>
                          )}
                        </div>

                        {log.analysis && (
                          <div className="mt-2 text-sm border-t border-border/50 pt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`px-2 py-0 text-[10px] uppercase font-bold tracking-widest ${log.analysis.severity === 'critical' ? 'bg-red-500 hover:bg-red-600' :
                                  log.analysis.severity === 'high' ? 'bg-orange-500 hover:bg-orange-600' :
                                    log.analysis.severity === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                      'bg-blue-500 hover:bg-blue-600'
                                }`}>
                                {log.analysis.severity} SEVERITY
                              </Badge>
                              <span className="text-muted-foreground text-xs italic flex items-center gap-1">
                                <SparklesIcon className="h-3 w-3" /> AI Analysis Complete
                              </span>
                            </div>

                            <div className="grid gap-1">
                              <p className="font-semibold text-foreground">Explanation:</p>
                              <p className="text-muted-foreground leading-relaxed">{log.analysis.explanation}</p>
                            </div>

                            {log.analysis.suggestedFix && (
                              <div className="grid gap-2 bg-background rounded-md p-3 border border-primary/20 shadow-inner">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-primary flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4" /> Suggested Fix:
                                  </p>
                                </div>
                                <code className="block bg-muted/50 p-2 rounded text-[11px] font-mono whitespace-pre-wrap break-all border border-border/50 text-foreground/90">
                                  {log.analysis.suggestedFix}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="flex-1 mt-3 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100vh-340px)]">
            <Card className="overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-0.5 font-mono text-xs">
                  {filteredRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12 text-sm font-sans">
                      No requests captured yet.
                    </p>
                  ) : (
                    filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/50 ${selectedRequest?.id === req.id ? "bg-muted" : ""
                          }`}
                      >
                        <Badge
                          variant={req.status && req.status < 400 ? "secondary" : "destructive"}
                          className="text-[10px] font-mono px-1.5 shrink-0"
                        >
                          {req.method}
                        </Badge>
                        <span className="truncate flex-1 text-foreground">
                          {new URL(req.url, window.location.origin).pathname}
                        </span>
                        <span className={`shrink-0 ${req.status && req.status < 400 ? "text-success" : "text-destructive"}`}>
                          {req.status ?? "ERR"}
                        </span>
                        <span className="text-muted-foreground shrink-0">{req.duration}ms</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>

            <Card className="overflow-hidden">
              <ScrollArea className="h-full">
                {selectedRequest ? (
                  <div className="p-3 space-y-3 font-mono text-xs">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Request</p>
                      <p className="text-foreground">{selectedRequest.method} {selectedRequest.url}</p>
                      <p className="text-muted-foreground">{fmt(selectedRequest.timestamp)} · {selectedRequest.duration}ms · Status {selectedRequest.status ?? "Error"}</p>
                    </div>
                    {selectedRequest.requestBody && (
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Request Body</p>
                        <pre className="bg-muted/50 p-2 rounded overflow-x-auto text-foreground whitespace-pre-wrap">
                          {(() => { try { return JSON.stringify(JSON.parse(selectedRequest.requestBody), null, 2); } catch { return selectedRequest.requestBody; } })()}
                        </pre>
                      </div>
                    )}
                    {selectedRequest.responseBody && (
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Response Body</p>
                        <pre className="bg-muted/50 p-2 rounded overflow-x-auto text-foreground whitespace-pre-wrap max-h-80">
                          {(() => { try { return JSON.stringify(JSON.parse(selectedRequest.responseBody), null, 2); } catch { return selectedRequest.responseBody.slice(0, 5000); } })()}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12 text-sm">
                    Select a request to inspect
                  </p>
                )}
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DebugConsole;
