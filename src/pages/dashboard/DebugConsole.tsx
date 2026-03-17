import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Trash2, Search, Clock, AlertCircle, Info, AlertTriangle, ChevronRight } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  details?: string;
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
      try { reqBody = await req.clone().text(); } catch {}

      try {
        const resp = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);
        let respBody: string | undefined;
        try { respBody = await resp.clone().text(); } catch {}

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
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/50 ${
                        log.level === "error" ? "bg-destructive/5" : log.level === "warn" ? "bg-warning/5" : ""
                      }`}
                    >
                      <span className="shrink-0 mt-0.5">{levelIcon[log.level]}</span>
                      <span className="text-muted-foreground shrink-0">{fmt(log.timestamp)}</span>
                      <span className={`break-all ${levelColor[log.level]}`}>{log.message}</span>
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
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/50 ${
                          selectedRequest?.id === req.id ? "bg-muted" : ""
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
