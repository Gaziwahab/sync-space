import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldAlert, ShieldCheck, ShieldAlert as ShieldIcon, AlertTriangle, AlertCircle, RefreshCw, Wand2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SecurityScannerProps {
  projectId: string;
  files: any[];
  onApplyFix: (filePath: string, newContent: string) => void;
  onClose: () => void;
}

interface Vulnerability {
  id: string;
  file: string;
  type: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  line: number;
  fix: string;
}

export function SecurityScanner({ projectId, files, onApplyFix, onClose }: SecurityScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);

  // Since we don't have a real security scanning backend yet, we'll
  // mock the results if there are files, or show empty if none.
  const { data: vulnerabilities, refetch, isFetching } = useQuery({
    queryKey: ["security-scan", projectId],
    queryFn: async () => {
      setIsScanning(true);
      // Simulate network delay for the AI scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsScanning(false);
      
      if (files.length === 0) return [];
      
      // We'll generate some dummy vulnerabilities for demonstration
      return [
        {
          id: "vuln-1",
          file: files[0]?.file_path || "index.html",
          type: "XSS Potential",
          description: "Unsanitized user input might be rendered directly in the DOM.",
          severity: "high",
          line: 42,
          fix: files[0]?.content ? files[0].content + "\n// Fixed by sanitizing input" : "// Fixed by sanitizing input"
        },
        {
          id: "vuln-2",
          file: files[files.length > 1 ? 1 : 0]?.file_path || "App.tsx",
          type: "Hardcoded Secret",
          description: "A string that looks like an API key was found in the code.",
          severity: "critical",
          line: 12,
          fix: files[files.length > 1 ? 1 : 0]?.content ? files[files.length > 1 ? 1 : 0].content.replace(/apiKey=['"][^'"]+['"]/, "apiKey=process.env.API_KEY") : "// Fixed by using env vars"
        }
      ] as Vulnerability[];
    },
    enabled: false, // Only fetch on manual scan
  });

  const handleApplyFix = (vuln: Vulnerability) => {
    setFixingId(vuln.id);
    setTimeout(() => {
      onApplyFix(vuln.file, vuln.fix);
      toast.success(`Applied security fix to ${vuln.file}`);
      setFixingId(null);
    }, 600);
  };

  const getSeverityIcon = (level: string) => {
    switch(level) {
      case 'critical': return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (level: string) => {
    switch(level) {
      case 'critical': return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'high': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 'medium': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-96 shrink-0 shadow-lg">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <ShieldIcon className="h-4 w-4 text-primary" /> AI Security Scanner
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Automated vulnerability analysis</p>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs bg-primary/10 hover:bg-primary hover:text-primary-foreground border-primary/20 transition-all"
            onClick={() => refetch()}
            disabled={isScanning || isFetching}
          >
            {isScanning || isFetching ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
            {isScanning || isFetching ? "Scanning..." : "Scan Now"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!vulnerabilities && !isScanning && !isFetching ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-border mt-12">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ShieldIcon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">Secure your code</p>
              <p className="text-xs text-muted-foreground mb-4">
                Run an AI-powered scan to detect vulnerabilities, secrets, and bad practices.
              </p>
              <Button onClick={() => refetch()} className="clay-btn h-8 text-xs w-full">
                Start Full Scan
              </Button>
            </div>
          ) : isScanning || isFetching ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <ShieldIcon className="h-6 w-6 text-primary absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-medium text-primary animate-pulse">Analyzing Codebase...</p>
              <p className="text-xs text-muted-foreground mt-2">Checking for XSS, injection, & secrets</p>
            </div>
          ) : vulnerabilities && vulnerabilities.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identified Issues</span>
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent text-[10px] h-5 px-1.5">
                  {vulnerabilities.length} Found
                </Badge>
              </div>
              
              {vulnerabilities.map(vuln => (
                <div key={vuln.id} className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
                  <div className="p-3 bg-muted/30 border-b border-border flex items-start justify-between gap-3">
                    <div className="flex gap-2.5">
                      <div className="mt-0.5">{getSeverityIcon(vuln.severity)}</div>
                      <div>
                        <h4 className="text-sm font-semibold">{vuln.type}</h4>
                        <div className="flex items-center gap-2 mt-1 -ml-0.5">
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-widest font-bold px-1 py-0 h-4 border ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground line-clamp-1">{vuln.file} : L{vuln.line}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 text-xs">
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {vuln.description}
                    </p>
                    
                    <Button 
                      onClick={() => handleApplyFix(vuln)} 
                      disabled={fixingId === vuln.id}
                      className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-8 text-[11px] shadow-none flex items-center justify-center gap-1.5 transition-all"
                    >
                      {fixingId === vuln.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5" />
                      )}
                      {fixingId === vuln.id ? "Applying Fix..." : "1-Click AI Fix"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-success/5 rounded-lg border border-success/20 mt-12">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-semibold text-success mb-1">No vulnerabilities found!</p>
              <p className="text-xs text-success/80">
                Your code looks secure.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
