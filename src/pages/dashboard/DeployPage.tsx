import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Rocket, Globe, GitBranch, Server, Clock, CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Spinner = () => <Loader2 className="h-4 w-4 animate-spin" />;

interface DeploymentRecord {
  id: string;
  project: string;
  project_id: string;
  environment: string;
  status: "live" | "deploying" | "failed";
  timestamp: Date;
  version: string;
}

const DeployPage = () => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [customDomain, setCustomDomain] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Since we don't have a dedicated deployment table, we'll map existing projects
  // to represent their "live" state based on the last update time.
  const deployments: DeploymentRecord[] = (projects || [])
    .filter(p => selectedProject === "all" || p.id === selectedProject)
    .map(p => ({
      id: p.id,
      project: p.name,
      project_id: p.id,
      environment: "Production",
      status: "live",
      timestamp: new Date(p.updated_at || p.created_at),
      version: `v1.0.${Math.floor(new Date(p.updated_at || p.created_at).getTime() / 10000000).toString().slice(-3)}`
    }));

  const statusBadge = (status: DeploymentRecord["status"]) => {
    const variants = {
      live: "bg-success/10 text-success border-success/20",
      deploying: "bg-warning/10 text-warning border-warning/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <Badge variant="outline" className={`${variants[status]} text-xs`}>
        {status === "live" && <CheckCircle2 className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Rocket className="h-6 w-6" /> Deploy
        </h1>
        <p className="text-muted-foreground text-sm">Manage deployments and environments</p>
      </div>

      {/* Quick Deploy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-4 w-4" /> Quick Deploy
          </CardTitle>
          <CardDescription>Deploy your project to production</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => toast.info("Deployment feature coming soon")}>
              <Rocket className="h-4 w-4 mr-2" /> Deploy to Production
            </Button>
            <Button variant="outline" onClick={() => toast.info("Staging deployment coming soon")}>
              <GitBranch className="h-4 w-4 mr-2" /> Staging
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-4 w-4" /> Custom Domain
          </CardTitle>
          <CardDescription>Connect your own domain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="yourdomain.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => {
              if (!customDomain) {
                toast.error("Please enter a domain");
                return;
              }
              toast.info("Domain configuration features are coming in Phase 8!");
              setCustomDomain("");
            }}>
              Connect
            </Button>
          </div>
          {selectedProject !== "all" && projects?.find(p => p.id === selectedProject) && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-xs text-muted-foreground flex-1 font-mono">
                {projects.find(p => p.id === selectedProject)?.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.synthi.app
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/20 hover:text-primary transition-colors duration-300"
                onClick={() => {
                  const url = `https://${projects.find(p => p.id === selectedProject)?.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.synthi.app`;
                  navigator.clipboard.writeText(url);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/20 hover:text-primary transition-colors duration-300"
                onClick={() => toast.info("Live deployment URLs require Edge Function routing.")}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Deployments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4" /> Recent Deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Spinner /> Loading deployments...
              </div>
            ) : deployments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No active projects found.
              </div>
            ) : (
              deployments.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{d.project}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <GitBranch className="h-3 w-3" /> {d.environment} · {d.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md hidden sm:inline-block">
                      {d.timestamp.toLocaleString()}
                    </span>
                    {statusBadge(d.status)}
                    <Button variant="ghost" size="sm" className="h-7 text-xs hidden sm:flex" onClick={() => {
                       toast.info("Opening live preview");
                       window.open(`/dashboard/projects/${d.project_id}`, '_blank');
                    }}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeployPage;
