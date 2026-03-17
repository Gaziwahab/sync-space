import { useMemo, useState, useCallback } from "react";
import { Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectFile {
  id: string;
  file_path: string;
  content: string;
}

interface LivePreviewProps {
  files: ProjectFile[];
}

interface InlineScriptsResult {
  html: string;
  hadUnresolvedModuleScript: boolean;
}

function normalizePath(path: string) {
  return path.replace(/^\/+/, "").replace(/^\.\//, "").replace(/[?#].*$/, "");
}

function inlineKnownScripts(html: string, files: ProjectFile[]): InlineScriptsResult {
  const byPath = new Map(files.map((f) => [normalizePath(f.file_path), f.content]));
  const byBaseName = new Map(
    files.map((f) => [normalizePath(f.file_path).split("/").pop() || "", f.content])
  );

  let hadUnresolvedModuleScript = false;

  const inlinedHtml = html.replace(
    /<script\b([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (full, preAttrs, src, postAttrs) => {
      const normalizedSrc = normalizePath(src);
      const attrs = `${preAttrs || ""} ${postAttrs || ""}`;
      const isModuleScript = /\btype\s*=\s*["']module["']/i.test(attrs);

      const sourceContent =
        byPath.get(normalizedSrc) || byBaseName.get(normalizedSrc.split("/").pop() || "") || null;

      if (!sourceContent) {
        if (isModuleScript) {
          hadUnresolvedModuleScript = true;
        }

        // Drop unresolved external scripts for srcDoc safety.
        return "";
      }

      // Inline known script file so preview works inside srcDoc
      return `<script${preAttrs || ""}${postAttrs || ""}>\n${sourceContent}\n</script>`;
    }
  );

  return {
    html: inlinedHtml,
    hadUnresolvedModuleScript,
  };
}

function looksLikeReactEntrypoint(html: string, files: ProjectFile[]) {
  const hasRootDiv = /<div[^>]*id=["']root["'][^>]*><\/div>/i.test(html);
  const hasModuleEntrypoint = /<script[^>]*type=["']module["'][^>]*src=/i.test(html);
  const hasFrameworkEntryFile = files.some((f) => /(^|\/)main\.(tsx?|jsx?)$/i.test(f.file_path));
  return hasRootDiv && (hasModuleEntrypoint || hasFrameworkEntryFile);
}

export function LivePreview({ files }: LivePreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const srcdoc = useMemo(() => {
    const htmlFile = files.find(
      (f) => f.file_path === "index.html" || f.file_path.endsWith(".html")
    );

    const allCss = files
      .filter((f) => f.file_path.endsWith(".css"))
      .map((f) => f.content)
      .join("\n");

    const allJs = files
      .filter((f) => f.file_path.endsWith(".js") && !f.file_path.endsWith(".html"))
      .map((f) => f.content)
      .join("\n");

    const navigationInterceptor = `
<script>
(function () {
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;

    e.preventDefault();
    e.stopPropagation();

    var cleanHref = href.replace(/^\\.?\\//, '').replace(/\\.html$/, '');
    var section = document.getElementById(cleanHref) || document.querySelector('[data-page="' + cleanHref + '"]');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    e.preventDefault();
  }, true);
})();
</script>`;

    let html = htmlFile?.content || "";

    if (htmlFile && (html.includes("<!DOCTYPE") || html.includes("<html"))) {
      const originalHtml = html;
      const inlined = inlineKnownScripts(html, files);
      html = inlined.html;

      if (allCss && !html.includes(allCss.slice(0, 30))) {
        html = html.replace("</head>", `<style>${allCss}</style></head>`);
      }

      if (allJs && !html.includes(allJs.slice(0, 30))) {
        html = html.replace("</body>", `<script>${allJs}</script></body>`);
      }

      // Keep navigation inside iframe
      if (!html.includes('<base target="_self"')) {
        html = html.replace("<head>", `<head><base target="_self">`);
      }

      // Only show framework notice if the body is truly empty (just an empty root div with no other content)
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").trim() : "";
      const bodyIsEmpty = !bodyContent || /^<div[^>]*id=["']root["'][^>]*>\s*<\/div>$/i.test(bodyContent);

      if (bodyIsEmpty && !html.includes("__preview_notice__") && looksLikeReactEntrypoint(originalHtml, files)) {
        const fileList = files.map((f) => f.file_path).join(", ");
        html = html.replace(
          /<div[^>]*id=["']root["'][^>]*><\/div>/i,
          `<div id="root">
            <div id="__preview_notice__" style="padding:16px;font-family:system-ui, sans-serif;line-height:1.5;">
              <h2 style="margin:0 0 8px;">Preview note</h2>
              <p style="margin:0 0 8px;">This project uses framework/module entry scripts that cannot be fully executed in static iframe srcDoc preview.</p>
              <p style="margin:0;"><strong>Current files:</strong> ${fileList}</p>
            </div>
          </div>`
        );
      }

      if (!html.includes("document.addEventListener('click'")) {
        html = html.replace("</body>", `${navigationInterceptor}</body>`);
      }

      return html;
    }

    const fileList = files.map((f) => f.file_path).join(", ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <base target="_self">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${allCss}</style>
</head>
<body>
  ${html || `<main style="padding:16px;font-family:system-ui,sans-serif;"><h2 style="margin:0 0 8px;">Preview unavailable</h2><p style="margin:0 0 8px;">No renderable HTML file was found in generated files.</p><p style="margin:0;"><strong>Current files:</strong> ${fileList || "None"}</p></main>`}
  <script>${allJs}</script>
  ${navigationInterceptor}
</body>
</html>`;
  }, [files, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Monitor className="h-4 w-4 text-accent" />
        <span className="font-semibold text-sm">Live Preview</span>
        {files.length > 0 && (
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Monitor className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Preview will appear once code is generated</p>
          </div>
        </div>
      ) : (
        <iframe
          key={refreshKey}
          srcDoc={srcdoc}
          className="flex-1 w-full border-0 bg-background"
          sandbox="allow-scripts"
          title="Live Preview"
        />
      )}
    </div>
  );
}
