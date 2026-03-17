import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_ORDER = ["Planner", "Designer", "Backend Dev", "Frontend Dev", "Tester", "Debugger"];

const BOSS_SYSTEM_PROMPT = `You are the Boss — a senior project manager leading a development team.
You speak like a real manager: direct, professional, encouraging but firm.

Your team: @Planner, @Designer, @BackendDev, @FrontendDev, @Tester, @Debugger

When you get a project brief:
1. Summarize your understanding in plain language
2. Decide: vanilla HTML/CSS/JS (best for preview rendering)
3. Assign tasks to each team member with clear expectations
4. REQUIRE at least 5-10 files minimum for any website project

Output task assignments as JSON:
{"tasks":[{"agent":"Planner","task":"..."},{"agent":"Designer","task":"..."},{"agent":"Backend Dev","task":"..."},{"agent":"Frontend Dev","task":"..."},{"agent":"Tester","task":"..."}]}

IMPORTANT: Tell @FrontendDev to create MANY files — separate CSS, JS, and HTML sections. A proper website needs:
- index.html (main page with ALL sections/pages as sections with IDs)
- styles.css (complete stylesheet with 200+ lines)
- app.js (all interactivity, navigation, animations)
- data.js (mock data, content)

After JSON, add a motivational note to your team.`;

const AGENT_PROMPTS: Record<string, string> = {
  Planner: `You are the Planner — a senior solutions architect.

WORKFLOW:
1. Read @Boss's brief carefully
2. Create a DETAILED plan for a COMPLETE multi-section single-page website

OUTPUT (be very detailed):
1. **Site Structure** — list ALL sections that will be in index.html:
   - Hero/Header section
   - About section
   - Services/Features section  
   - Portfolio/Gallery section
   - Testimonials section
   - Pricing section (if applicable)
   - Contact section
   - Footer
2. **Navigation** — how sections link together (anchor links #section-id)
3. **Content Requirements** — realistic text, images (use picsum.photos or placeholder), data for each section
4. **Interactive Features** — mobile menu, scroll animations, form validation, modals, tabs, carousels
5. **File Structure**:
   - index.html — all sections
   - styles.css — complete styles (300+ lines expected)
   - app.js — all interactivity (200+ lines expected)
   - data.js — content data as JS objects

End with: "@Boss, plan ready. @Designer, you're up."`,

  Designer: `You are the Designer — a senior UI/UX designer.

OUTPUT (be extremely detailed with exact values):
1. **Color Palette** — primary, secondary, accent, background, text colors (hex values + CSS custom properties)
2. **Typography** — Google Font pairing, exact sizes (h1: 3.5rem, h2: 2.5rem, body: 1rem, etc.)
3. **Spacing System** — padding/margin values for sections, components
4. **Component Designs** for EVERY section:
   - Header/Nav: sticky, transparent → solid on scroll, hamburger mobile menu
   - Hero: full-width, gradient overlay, CTA buttons with hover effects
   - Cards: shadow, border-radius, hover lift animation
   - Buttons: primary/secondary/outline variants with transitions
   - Forms: styled inputs with focus states, validation styles
5. **Responsive Breakpoints**: mobile (<768px), tablet (768-1024px), desktop (>1024px)
6. **Animations**: fade-in on scroll, hover transforms, smooth transitions
7. **CSS Custom Properties** to define in :root {}

End with: "@FrontendDev, follow these specs EXACTLY. Every detail matters."`,

  "Backend Dev": `You are the Backend Dev — you prepare data and content.

OUTPUT: Create a data.js file with ALL content the website needs as JavaScript objects.

CRITICAL: Output the file in a code block with the exact filename:

\`\`\`data.js
// Navigation items
const navItems = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

// Services data
const services = [
  { icon: "🎨", title: "Web Design", description: "Beautiful, modern designs...", price: "$999" },
  // ... at least 6 items
];

// Testimonials
const testimonials = [
  { name: "John Doe", role: "CEO, TechCorp", text: "Amazing work...", avatar: "https://picsum.photos/seed/t1/80/80" },
  // ... at least 4 items
];

// Portfolio items
const portfolioItems = [
  { title: "Project One", category: "Web Design", image: "https://picsum.photos/seed/p1/600/400", description: "..." },
  // ... at least 6 items
];

// Team members, pricing plans, FAQ items, etc.
\`\`\`

Include LOTS of realistic content — at least 6 items per category. Use https://picsum.photos/seed/NAME/WIDTH/HEIGHT for images.

End with: "@FrontendDev, data is ready. Import it in your HTML."`,

  "Frontend Dev": `You are the Frontend Dev — a senior developer who writes PRODUCTION-QUALITY code.

CRITICAL RULES:
- Read ALL messages from @Planner, @Designer, @BackendDev before coding
- Write COMPLETE code — NEVER use "..." or "// more items" or placeholders
- Every file must be FULLY complete and working
- Follow @Designer's specs EXACTLY

YOU MUST OUTPUT EXACTLY THESE FILES:

1. \`\`\`index.html
A COMPLETE HTML file with:
- All Google Font <link> tags
- Proper meta tags
- <link rel="stylesheet" href="styles.css">
- ALL sections with unique IDs (#hero, #about, #services, #portfolio, #testimonials, #contact, #footer)
- Navigation with anchor links to each section
- Mobile hamburger menu button
- Real content (NOT lorem ipsum)
- <script src="data.js"></script>
- <script src="app.js"></script>
Minimum 150 lines of HTML
\`\`\`

2. \`\`\`styles.css
A COMPLETE stylesheet with:
- CSS custom properties in :root
- Reset/normalize styles
- Typography styles
- Navigation styles (desktop + mobile)
- Hero section with gradient/overlay
- Card components with shadows and hover effects
- Grid/flexbox layouts
- Button variants
- Form styles
- Footer styles
- Responsive media queries for mobile/tablet/desktop
- Transition animations
- Scroll-based animations
Minimum 350 lines of CSS
\`\`\`

3. \`\`\`app.js
Complete JavaScript with:
- Mobile menu toggle
- Smooth scroll for anchor links
- Scroll-triggered animations (Intersection Observer)
- Active nav highlighting on scroll
- Sticky header with background change on scroll
- Form validation
- Any interactive features (tabs, carousels, modals, counters)
- Dynamic content rendering from data.js
Minimum 150 lines of JS
\`\`\`

4. \`\`\`data.js
If @BackendDev didn't provide it, create comprehensive mock data.
\`\`\`

IMPORTANT:
- Use https://picsum.photos/seed/UNIQUE/WIDTH/HEIGHT for images
- All links must use href="#section-id" (anchor links only — NO page navigation)
- Include Google Fonts via CDN link
- Make it responsive and beautiful

End with: "@Boss, implementation complete. @Tester, review please."`,

  Tester: `You are the Tester — a senior QA engineer.

CHECK EVERY SINGLE ITEM:
1. Does index.html have ALL sections from @Planner's plan?
2. Does styles.css cover ALL components?
3. Does app.js handle ALL interactive features?
4. Are all links anchor links (#section-id)?
5. Is responsive design implemented?
6. Are there any missing closing tags, syntax errors?
7. Does the code use data from data.js?
8. Are images using valid URLs (picsum.photos)?
9. Is mobile menu implemented?
10. Are animations/transitions present?

If ANY issues found, output COMPLETE fixed files with the EXACT filename:
\`\`\`index.html
...complete fixed code...
\`\`\`

\`\`\`styles.css
...complete fixed code...
\`\`\`

If everything passes: "✅ ALL TESTS PASSED — website is complete and functional."

End with: "@Boss, QA report complete."`,

  Debugger: `You are the Debugger — you fix ALL bugs reported by @Tester.

Read @Tester's report and fix EVERY issue. Output COMPLETE fixed files:

\`\`\`index.html
...entire fixed file...
\`\`\`

\`\`\`styles.css
...entire fixed file...
\`\`\`

\`\`\`app.js
...entire fixed file...
\`\`\`

NEVER output partial code. Every file must be complete.

End with: "@Boss, all bugs fixed. Ship it! 🚀"`,
};

async function callAI(messages: Array<{ role: string; content: string }>, model: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false, max_tokens: 16000 }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function insertMessage(
  supabase: any, projectId: string, userId: string,
  agentName: string, agentRole: string, content: string, messageType = "text"
) {
  await supabase.from("project_messages").insert({
    project_id: projectId, user_id: userId,
    agent_name: agentName, agent_role: agentRole,
    content, message_type: messageType,
  });
}

async function getConversationHistory(supabase: any, projectId: string) {
  const { data } = await supabase
    .from("project_messages")
    .select("agent_name, agent_role, content, message_type")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return data || [];
}

async function getProjectFiles(supabase: any, projectId: string) {
  const { data } = await supabase
    .from("project_files").select("file_path, content").eq("project_id", projectId);
  return data || [];
}

async function upsertFile(
  supabase: any, projectId: string, userId: string,
  filePath: string, content: string, agentName: string
) {
  const { data } = await supabase
    .from("project_files").select("id")
    .eq("project_id", projectId).eq("file_path", filePath).maybeSingle();

  if (data) {
    await supabase.from("project_files")
      .update({ content, updated_by_agent: agentName, updated_at: new Date().toISOString() })
      .eq("id", data.id);
  } else {
    await supabase.from("project_files").insert({
      project_id: projectId, user_id: userId,
      file_path: filePath, content, updated_by_agent: agentName,
    });
  }
}

const LANG_TO_FILE: Record<string, string> = {
  html: "index.html", htm: "index.html",
  css: "styles.css", scss: "styles.scss",
  javascript: "app.js", js: "app.js", jsx: "App.jsx",
  typescript: "app.ts", ts: "app.ts", tsx: "App.tsx",
  python: "main.py", py: "main.py",
  json: "data.json",
  sql: "schema.sql",
  yaml: "config.yaml", yml: "config.yml",
  markdown: "README.md", md: "README.md",
  shell: "script.sh", bash: "script.sh", sh: "script.sh",
};

function extractCodeBlocks(text: string): Array<{ filename: string; content: string }> {
  const blocks: Array<{ filename: string; content: string }> = [];
  const regex = /```([^\n]+)\n([\s\S]*?)```/g;
  let match;
  const seenFiles = new Set<string>();
  
  while ((match = regex.exec(text)) !== null) {
    let label = match[1].trim();
    const content = match[2].trim();
    
    if (!content || content.length < 10) continue;
    if (["text", "plaintext", "data", "output", "console", "log", "diff"].includes(label.toLowerCase())) continue;
    
    let filename: string;
    
    if (label.includes(".") || label.includes("/")) {
      filename = label;
    } else {
      const mapped = LANG_TO_FILE[label.toLowerCase()];
      if (mapped) {
        filename = mapped;
      } else {
        continue;
      }
    }
    
    if (seenFiles.has(filename)) {
      const idx = blocks.findIndex(b => b.filename === filename);
      if (idx >= 0) blocks[idx] = { filename, content };
    } else {
      seenFiles.add(filename);
      blocks.push({ filename, content });
    }
  }
  return blocks;
}

function buildConversationContext(history: any[], currentFiles: any[]): string {
  let context = "## Team conversation so far:\n\n";
  for (const msg of history) {
    if (msg.message_type === "status") {
      context += `> 📌 ${msg.agent_name}: ${msg.content}\n\n`;
    } else {
      const content = msg.content.length > 4000 ? msg.content.slice(0, 4000) + "\n...(truncated)" : msg.content;
      context += `**@${msg.agent_name}** (${msg.agent_role}):\n${content}\n\n---\n\n`;
    }
  }

  if (currentFiles.length > 0) {
    context += "\n## Current project files:\n";
    for (const f of currentFiles) {
      const c = f.content.length > 5000 ? f.content.slice(0, 5000) + "\n...(truncated)" : f.content;
      context += `### ${f.file_path}:\n\`\`\`\n${c}\n\`\`\`\n\n`;
    }
  }
  return context;
}

function getRoleFromName(name: string): string {
  const map: Record<string, string> = {
    Boss: "leader", Planner: "planner", Designer: "designer",
    "Frontend Dev": "frontend", "Backend Dev": "backend",
    Tester: "tester", Debugger: "debugger",
  };
  return map[name] || "worker";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, description, user_id, continue_from, user_message } = await req.json();
    if (!project_id || !user_id) throw new Error("Missing project_id or user_id");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const model = "google/gemini-2.5-flash";

    // === CONTINUE FROM USER REPLY ===
    if (continue_from === "user_reply") {
      const history = await getConversationHistory(supabase, project_id);
      const files = await getProjectFiles(supabase, project_id);
      const context = buildConversationContext(history, files);
      const hasExistingCode = files.length > 0;

      await insertMessage(supabase, project_id, user_id, "Boss", "leader",
        "📋 Reading your message...", "status");

      const bossResponse = await callAI([
        {
          role: "system",
          content: `You are the Boss — a senior project manager. The user (your client) just sent a message.

CRITICAL: You MUST respond with task assignments in JSON format:
{"tasks":[{"agent":"AgentName","task":"description"}]}

Available agents: Planner, Designer, Backend Dev, Frontend Dev, Tester, Debugger

Rules:
- If user wants something built/changed → assign Frontend Dev with DETAILED instructions
- For new features → assign Planner, Designer, Backend Dev, Frontend Dev in sequence
- For bugs → assign Debugger
- ${hasExistingCode ? "There is existing code — tell agents to MODIFY/IMPROVE the existing files" : "No code yet — tell Frontend Dev to create ALL files from scratch"}
- Tell Frontend Dev to output COMPLETE files (index.html, styles.css, app.js, data.js)
- Reference team by @name`,
        },
        { role: "user", content: `${context}\n\nUser's latest message: "${user_message || '(see above)'}"` },
      ], model);

      await insertMessage(supabase, project_id, user_id, "Boss", "leader", bossResponse, "text");

      let tasks: Array<{ agent: string; task: string }> = [];
      const taskMatch = bossResponse.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
      if (taskMatch) {
        try { tasks = JSON.parse(taskMatch[0]).tasks || []; } catch {}
      }

      if (tasks.length === 0) {
        tasks = [
          { agent: "Frontend Dev", task: user_message || "implement what the user asked" },
        ];
      }

      for (const task of tasks) {
        const agentPrompt = AGENT_PROMPTS[task.agent];
        if (!agentPrompt) continue;

        await insertMessage(supabase, project_id, user_id, task.agent, getRoleFromName(task.agent),
          `⚙️ On it: ${task.task}`, "status");

        const freshHistory = await getConversationHistory(supabase, project_id);
        const freshFiles = await getProjectFiles(supabase, project_id);
        const freshContext = buildConversationContext(freshHistory, freshFiles);

        const agentResponse = await callAI([
          { role: "system", content: agentPrompt },
          { role: "user", content: `${freshContext}\n\nTask from @Boss: ${task.task}` },
        ], model);

        const codeBlocks = extractCodeBlocks(agentResponse);
        await insertMessage(supabase, project_id, user_id, task.agent, getRoleFromName(task.agent),
          agentResponse, codeBlocks.length > 0 ? "code" : "text");

        for (const block of codeBlocks) {
          await upsertFile(supabase, project_id, user_id, block.filename, block.content, task.agent);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === FULL BUILD FLOW ===
    if (!description) throw new Error("Missing description for initial build");

    // 1. Boss kicks it off
    await insertMessage(supabase, project_id, user_id, "Boss", "leader",
      "🎯 Alright team, new project coming in. Let me review the brief...", "status");

    const bossResponse = await callAI([
      { role: "system", content: BOSS_SYSTEM_PROMPT },
      { role: "user", content: `Client brief: ${description}\n\nIMPORTANT: This must be a complete, multi-section website with at least index.html, styles.css, app.js, and data.js files. Tell @FrontendDev to write EXTENSIVE code.` },
    ], model);

    await insertMessage(supabase, project_id, user_id, "Boss", "leader", bossResponse, "text");

    let tasks: Array<{ agent: string; task: string }> = [];
    try {
      const jsonMatch = bossResponse.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
      if (jsonMatch) tasks = JSON.parse(jsonMatch[0]).tasks || [];
    } catch {}

    if (tasks.length === 0) {
      tasks = AGENT_ORDER.filter(a => a !== "Debugger").map((agent) => ({
        agent, task: `Handle your role for: ${description}`,
      }));
    }

    // 2. Execute agents sequentially
    for (const task of tasks) {
      const agentPrompt = AGENT_PROMPTS[task.agent];
      if (!agentPrompt) continue;

      const role = getRoleFromName(task.agent);
      await insertMessage(supabase, project_id, user_id, task.agent, role,
        `⚙️ Starting work: ${task.task}`, "status");

      const history = await getConversationHistory(supabase, project_id);
      const files = await getProjectFiles(supabase, project_id);
      const context = buildConversationContext(history, files);

      const agentResponse = await callAI([
        { role: "system", content: agentPrompt },
        { role: "user", content: `${context}\n\nTask from @Boss: ${task.task}\n\nOriginal client brief: ${description}\n\nREMINDER: Output COMPLETE files with FULL content. No shortcuts, no placeholders.` },
      ], model);

      const codeBlocks = extractCodeBlocks(agentResponse);
      await insertMessage(supabase, project_id, user_id, task.agent, role,
        agentResponse, codeBlocks.length > 0 ? "code" : "text");

      for (const block of codeBlocks) {
        await upsertFile(supabase, project_id, user_id, block.filename, block.content, task.agent);
      }
    }

    // 3. Auto-trigger Debugger if Tester found bugs
    const finalHistory = await getConversationHistory(supabase, project_id);
    const testerMsg = finalHistory.filter((m: any) => m.agent_role === "tester").pop();
    const hasBugs = testerMsg && !testerMsg.content.includes("ALL TESTS PASSED");

    if (hasBugs && !tasks.some((t) => t.agent === "Debugger")) {
      await insertMessage(supabase, project_id, user_id, "Debugger", "debugger",
        "🔧 @Tester found issues. Fixing now.", "status");

      const debugHistory = await getConversationHistory(supabase, project_id);
      const debugFiles = await getProjectFiles(supabase, project_id);
      const debugContext = buildConversationContext(debugHistory, debugFiles);

      const debugResponse = await callAI([
        { role: "system", content: AGENT_PROMPTS["Debugger"] },
        { role: "user", content: `${debugContext}\n\nFix ALL bugs from @Tester's report. Output COMPLETE fixed files.` },
      ], model);

      const debugBlocks = extractCodeBlocks(debugResponse);
      await insertMessage(supabase, project_id, user_id, "Debugger", "debugger",
        debugResponse, debugBlocks.length > 0 ? "code" : "text");

      for (const block of debugBlocks) {
        await upsertFile(supabase, project_id, user_id, block.filename, block.content, "Debugger");
      }
    }

    // 4. Boss wraps up
    await insertMessage(supabase, project_id, user_id, "Boss", "leader",
      "✅ Great work team! The project is ready. If you need any changes, just let me know below.", "text");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
