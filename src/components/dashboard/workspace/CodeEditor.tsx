import { useState, useMemo, useCallback, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  FileCode, File, Folder, FolderOpen, ChevronRight, ChevronDown,
  FileJson, FileText, FileType, Image, Settings, X, Plus, Copy, Download,
} from "lucide-react";

interface ProjectFile {
  id: string;
  file_path: string;
  content: string;
  updated_by_agent: string;
  updated_at: string;
}

interface CodeEditorProps {
  files: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onFileChange?: (filePath: string, content: string) => void;
  onCreateFile?: (filePath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    html: "html", htm: "html", css: "css", scss: "scss", less: "less",
    js: "javascript", jsx: "javascript", mjs: "javascript",
    ts: "typescript", tsx: "typescript", json: "json",
    md: "markdown", mdx: "markdown", py: "python", rb: "ruby",
    go: "go", rs: "rust", java: "java", kt: "kotlin", swift: "swift",
    php: "php", sql: "sql", yaml: "yaml", yml: "yaml",
    xml: "xml", svg: "xml", sh: "shell", bash: "shell",
    dockerfile: "dockerfile", toml: "ini", env: "ini", txt: "plaintext",
  };
  return langMap[ext] || "plaintext";
}

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, React.ElementType> = {
    json: FileJson, html: FileCode, htm: FileCode, css: FileType,
    js: FileCode, jsx: FileCode, ts: FileCode, tsx: FileCode,
    md: FileText, png: Image, jpg: Image, svg: Image, toml: Settings,
  };
  return iconMap[ext] || File;
}

function buildFileTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.file_path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      const existing = current.find((n) => n.name === part);
      if (existing && !isFile) {
        current = existing.children || [];
      } else if (!existing) {
        const node: TreeNode = { name: part, path, type: isFile ? "file" : "folder", children: isFile ? undefined : [] };
        current.push(node);
        if (!isFile) current = node.children!;
      }
    }
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => { if (n.children) sortNodes(n.children); });
  };
  sortNodes(root);
  return root;
}

function FileTreeItem({ node, activeFile, onSelectFile, depth = 0 }: {
  node: TreeNode; activeFile: string | null; onSelectFile: (path: string) => void; depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = node.path === activeFile;
  const Icon = node.type === "folder" ? (expanded ? FolderOpen : Folder) : getFileIcon(node.path);

  return (
    <div>
      <button
        onClick={() => { if (node.type === "folder") setExpanded(!expanded); else onSelectFile(node.path); }}
        className={`flex items-center gap-1.5 w-full px-2 py-0.5 text-[11px] font-mono hover:bg-muted/80 transition-colors ${
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === "folder" && (expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />)}
        <Icon className={`h-3 w-3 shrink-0 ${node.type === "folder" ? "text-accent" : ""}`} />
        <span className="truncate">{node.name}</span>
      </button>
      {node.type === "folder" && expanded && node.children?.map((child) => (
        <FileTreeItem key={child.path} node={child} activeFile={activeFile} onSelectFile={onSelectFile} depth={depth + 1} />
      ))}
    </div>
  );
}

export function CodeEditor({ files, activeFile, onSelectFile, onFileChange, onCreateFile }: CodeEditorProps) {
  const currentFile = files.find((f) => f.file_path === activeFile);
  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const language = activeFile ? getLanguage(activeFile) : "plaintext";
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const tabs = useMemo(() => {
    if (!activeFile) return openTabs;
    if (!openTabs.includes(activeFile)) return [...openTabs, activeFile];
    return openTabs;
  }, [openTabs, activeFile]);

  const handleSelectFile = (path: string) => {
    if (!openTabs.includes(path)) setOpenTabs((prev) => [...prev, path]);
    onSelectFile(path);
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((p) => p !== path));
    if (activeFile === path) {
      const remaining = tabs.filter((p) => p !== path);
      onSelectFile(remaining.length > 0 ? remaining[remaining.length - 1] : files[0]?.file_path || "");
    }
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !activeFile || !onFileChange) return;
    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onFileChange(activeFile, value);
    }, 800);
  }, [activeFile, onFileChange]);

  const handleEditorMount: OnMount = (editor) => {
    // Add Ctrl+S shortcut
    editor.addCommand(2097 /* KeyMod.CtrlCmd | KeyCode.KeyS */, () => {
      if (activeFile && onFileChange) {
        const value = editor.getValue();
        onFileChange(activeFile, value);
        toast.success("File saved");
      }
    });
  };

  const handleCreateFile = () => {
    if (!newFileName.trim() || !onCreateFile) return;
    const path = newFileName.startsWith("/") ? newFileName.slice(1) : newFileName;
    onCreateFile(path);
    setNewFileName("");
    setShowNewFile(false);
    toast.success("File created");
  };

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      toast.success("Copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (currentFile) {
      const blob = new Blob([currentFile.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFile.file_path.split("/").pop() || "file.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-full bg-[#1e1e1e]">
      {/* File Explorer Sidebar */}
      {showExplorer && (
        <div className="w-56 border-r border-[#333] flex flex-col shrink-0 bg-[#252526]">
          <div className="px-3 py-2 border-b border-[#333] flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#bbbbbb]">Explorer</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowNewFile(true)} 
                className="p-1 text-[#888] hover:text-[#fff] hover:bg-[#333] rounded"
                title="New File"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setShowExplorer(false)} className="p-1 text-[#888] hover:text-[#ccc] hover:bg-[#333] rounded">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {showNewFile && (
            <div className="p-2 border-b border-[#333] bg-[#1e1e1e]">
              <div className="flex items-center gap-1">
                <Input
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFile();
                    if (e.key === "Escape") setShowNewFile(false);
                  }}
                  placeholder="filename.ext"
                  className="h-6 text-[11px] bg-[#2d2d2d] border-[#444] text-[#fff] px-2 rounded-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                />
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-1">
            {files.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <FileCode className="h-5 w-5 text-[#555] mx-auto mb-2" />
                <p className="text-[10px] text-[#888]">No files yet</p>
              </div>
            ) : (
              fileTree.map((node) => (
                <FileTreeItem key={node.path} node={node} activeFile={activeFile} onSelectFile={handleSelectFile} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex items-center border-b border-[#333] overflow-x-auto bg-[#252526]">
          {!showExplorer && (
            <button onClick={() => setShowExplorer(true)} className="px-2 py-1.5 text-[#888] hover:text-[#ccc] border-r border-[#333]">
              <Folder className="h-3.5 w-3.5" />
            </button>
          )}
          {tabs.map((tabPath) => {
            const fileName = tabPath.split("/").pop() || tabPath;
            const TabIcon = getFileIcon(tabPath);
            const isActive = tabPath === activeFile;
            return (
              <button
                key={tabPath}
                onClick={() => onSelectFile(tabPath)}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono shrink-0 border-r border-[#333] transition-colors group ${
                  isActive ? "bg-[#1e1e1e] text-[#fff] border-t-2 border-t-primary" : "text-[#969696] hover:bg-[#2d2d2d]"
                }`}
              >
                <TabIcon className="h-3 w-3" />
                {fileName}
                <span
                  onClick={(e) => handleCloseTab(tabPath, e)}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded px-0.5 transition-opacity"
                >×</span>
              </button>
            );
          })}
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 relative">
          {currentFile ? (
            <>
              <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] bg-[#333] text-[#aaa] border-[#444] px-2 py-0">
                  {currentFile.updated_by_agent}
                </Badge>
                <div className="flex items-center gap-1 bg-[#252526] border border-[#333] rounded-md p-0.5 shadow-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#aaa] hover:text-[#fff] hover:bg-[#333]" onClick={handleCopy}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">Copy Code</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#aaa] hover:text-[#fff] hover:bg-[#333]" onClick={handleDownload}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">Download File</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Editor
                height="100%"
                language={language}
                value={currentFile.content}
                theme="vs-dark"
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: true, scale: 1 },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  bracketPairColorization: { enabled: true },
                  automaticLayout: true,
                  padding: { top: 8 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  tabSize: 2,
                  folding: true,
                  foldingStrategy: "indentation",
                  showFoldingControls: "mouseover",
                  matchBrackets: "always",
                  renderWhitespace: "selection",
                  guides: { bracketPairs: true, indentation: true },
                }}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileCode className="h-10 w-10 text-[#444] mx-auto mb-3" />
                <p className="text-sm text-[#888]">
                  {files.length > 0 ? "Select a file to edit" : "Code will appear here as agents build"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-0.5 bg-primary text-primary-foreground text-[10px] border-t border-[#333]">
          <div className="flex items-center gap-3">
            <span>{activeFile || "No file"}</span>
            <span>{language}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <span>Spaces: 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
