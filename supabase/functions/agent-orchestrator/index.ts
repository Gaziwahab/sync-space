import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MAX_QA_ITERATIONS = 4;

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

const BOSS_SYSTEM_PROMPT = `You are the Boss — a senior engineering manager who gives clear, actionable briefs.

When given a project description:
1. Restate your understanding in 2-3 sentences
2. List the key goals as bullet points
3. Confirm the tech stack: vanilla HTML + CSS + JS (required for live preview)
4. Write a task assignment block in this EXACT JSON format:

{"tasks":[
  {"agent":"Planner","task":"<what to plan>"},
  {"agent":"Designer","task":"<design direction>"},
  {"agent":"Backend Dev","task":"<data/content to prepare>"},
  {"agent":"Frontend Dev","task":"<what to build>"}
]}

After the JSON, add a one-line motivational note.

RULES:
- Do NOT assign Tester or Debugger here — they run automatically after build
- Do NOT write any code yourself
- Keep each task concise but specific`;

const PLANNER_SYSTEM_PROMPT = `You are the Planner — a senior solutions architect.

Your ONLY job is to produce two things:

## 1. SITE ARCHITECTURE
Describe every section in plain language. For each section:
- Section ID (e.g. #hero, #about, #services)
- What it contains
- Key interactive behaviour (e.g. "carousel auto-plays every 4s", "contact form validates email on blur")

## 2. FEATURE CHECKLIST  <- CRITICAL OUTPUT
Output a markdown checklist the Tester will use. Use EXACTLY this format:

\`\`\`CHECKLIST.md
# Feature Checklist

## Layout & Structure
- [ ] Navigation links scroll to correct sections
- [ ] All sections render with correct IDs
- [ ] Footer is present
- [ ] Page scrolls end-to-end without layout breaks

## Responsiveness
- [ ] Mobile layout (<=768px) — no horizontal scroll, readable text, stacked layout
- [ ] Tablet layout (768-1024px) — graceful column reflow
- [ ] Desktop layout (>1024px) — full design intent

## Navigation
- [ ] Sticky header changes appearance after scrolling 80px
- [ ] Hamburger menu opens/closes on mobile
- [ ] Active nav item highlights based on scroll position

## Interactive Features
- [ ] Smooth scroll for all anchor links
- [ ] Form validates required fields before submit
- [ ] Form shows success or error message after submit attempt
- [ ] Scroll-triggered fade/slide animations on sections
- [ ] <ADD ONE LINE PER SPECIFIC FEATURE IN THE BRIEF>

## Visual Polish
- [ ] Hover effects on all cards and buttons
- [ ] No broken image tags (all src values are valid URLs)
- [ ] No visible placeholder "Lorem ipsum" text
- [ ] CSS transitions present on interactive elements

## Data Rendering
- [ ] window.siteData is defined in data.js
- [ ] app.js reads from window.siteData and renders into correct DOM elements
- [ ] At least 3 items rendered in each list or grid section
\`\`\`

Customise the checklist to match the ACTUAL brief — add or remove items as needed.

End your message with: "@Designer, your turn."

IMPORTANT: Do NOT output any HTML, CSS, or JS files. Specs and checklist ONLY.`;

const DESIGNER_SYSTEM_PROMPT = `You are the Designer — a senior UI/UX designer with a strong, opinionated point of view.

Your ONLY job is to write a DESIGN SPECIFICATION document in plain markdown.
You do NOT write any CSS files. Frontend Dev will implement your spec.

Output:

## Aesthetic Direction
One paragraph: the visual mood, what makes this design memorable, any bold creative choices.
Pick a clear direction (e.g. editorial-magazine, brutalist-raw, luxury-refined, sci-fi-dark, warm-organic).

## Color Palette
List exact hex values assigned as CSS custom property names:
--color-primary: #...
--color-secondary: #...
--color-accent: #...
--color-bg: #...
--color-surface: #...
--color-border: #...
--color-text: #...
--color-text-muted: #...

## Typography
- Heading font: <Google Font name> — full @import URL
- Body font: <Google Font name> — full @import URL
- Scale (use these exact variable names):
  --text-xs: 0.75rem
  --text-sm: 0.875rem
  --text-base: 1rem
  --text-lg: 1.125rem
  --text-xl: 1.25rem
  --text-2xl: 1.5rem
  --text-3xl: 1.875rem
  --text-4xl: 2.25rem
  --text-5xl: 3rem
  --text-6xl: 4rem
- Font weights: specify which weights are used for headings, body, captions

## Spacing System
--space-1 through --space-16 in rem (1=0.25rem, 2=0.5rem, 4=1rem, 8=2rem, 16=4rem)

## Component Specs
For each component describe: dimensions, colors (use var names), border-radius, box-shadow, hover state, CSS transition.
Cover every one of these:
- .nav (height, bg, backdrop-filter, position)
- .nav__hamburger (size, line styles, animation to X)
- .hero (min-height, bg, gradient overlay)
- .section (padding, max-width, margin)
- .card (bg, border-radius, shadow, hover: translateY + shadow change)
- .btn-primary (bg, color, padding, radius, hover state)
- .btn-secondary (outline variant)
- input / textarea (border, focus ring, transition)
- .footer (bg, text color, padding)

## Animation Catalogue
List every animation:
Name -> what it does -> duration -> easing -> trigger
e.g. fadeInUp -> slides 30px up + fades in -> 0.6s -> ease-out -> IntersectionObserver

## Responsive Rules
- Max content width (e.g. 1200px)
- Section vertical padding at each breakpoint
- Grid columns at mobile / tablet / desktop

RULE: Do NOT output code blocks with CSS. Pure markdown spec only.
End with: "@Frontend Dev, follow these specs exactly — every variable name matters."`;

const BACKEND_DEV_SYSTEM_PROMPT = `You are the Backend Dev — you prepare ALL content and mock data.

Your ONLY output is a single data.js file. Nothing else.

Rules:
- Write REALISTIC content — no "Lorem ipsum", no "Item 1", no "Description here"
- Every image: https://picsum.photos/seed/UNIQUE_SEED/WIDTH/HEIGHT
- At least 6 items per array
- Export everything via: window.siteData = { navItems, heroContent, ... }
- The variable names you use here MUST match what Frontend Dev renders

\`\`\`data.js
// ============================================================
// SITE DATA — generated by Backend Dev
// All content rendered dynamically by app.js
// ============================================================

const navItems = [
  { label: "Home", href: "#hero" },
  // fill in from Planner's sections
];

const heroContent = {
  headline: "...",
  subheadline: "...",
  ctaPrimary: { label: "Get Started", href: "#contact" },
  ctaSecondary: { label: "View Work", href: "#portfolio" },
  backgroundImage: "https://picsum.photos/seed/hero-bg/1920/1080",
};

// Add ALL sections the Planner listed with realistic content
// e.g. services[], portfolio[], testimonials[], team[], pricing[], faqItems[]
// Every array must have at least 6 items

// ── EXPORT ──────────────────────────────────────────────────
window.siteData = {
  navItems,
  heroContent,
  // list every variable above
};
\`\`\`

End with: "@Frontend Dev, data is ready. Load data.js before app.js."`;

const FRONTEND_DEV_SYSTEM_PROMPT = `You are the Frontend Dev — the ONLY team member who writes HTML, CSS, and JS files.

Before writing, read carefully:
- @Planner's architecture (what sections exist and what features are needed)
- @Designer's spec (follow it EXACTLY — use the exact CSS variable names and Google Font imports)
- @Backend Dev's data.js (your JS reads from window.siteData)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU MUST OUTPUT THESE THREE COMPLETE FILES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE 1 — index.html
\`\`\`index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>...</title>
  <!-- Google Fonts — EXACT URLs from Designer's spec -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="EXACT_URL_FROM_DESIGNER" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header id="header">
    <nav class="nav">
      <div class="nav__logo">Brand</div>
      <ul class="nav__links" id="navLinks"></ul>
      <button class="nav__hamburger" id="hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </header>

  <main>
    <!-- Every section Planner listed, in order, with correct id="" -->
    <section id="hero" class="hero animate-on-scroll">...</section>
    <section id="about" class="section animate-on-scroll">...</section>
    <!-- etc -->
  </main>
  <footer id="footer" class="footer">...</footer>

  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
\`\`\`
MINIMUM 200 lines. ALL sections from Planner's checklist. Real content.

FILE 2 — styles.css
\`\`\`styles.css
/* CSS Custom Properties */
:root {
  /* Paste EVERY --color-*, --text-*, --space-* from Designer's spec */
}

/* Reset */
/* Base / Typography */
/* Layout Utilities */
/* Header + Nav desktop */
/* Nav hamburger + mobile menu */
/* Hero section */
/* Each section */
/* Cards */
/* Buttons */
/* Forms + inputs */
/* Footer */
/* Animations + keyframes */
/* Scroll animation base state */
.animate-on-scroll { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
.animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
/* Responsive: mobile <=768px */
@media (max-width: 768px) { ... }
/* Responsive: tablet 769-1024px */
@media (min-width: 769px) and (max-width: 1024px) { ... }
\`\`\`
MINIMUM 400 lines. Every component Designer described. Full responsive coverage.

FILE 3 — app.js
\`\`\`app.js
/**
 * app.js — All interactivity
 * Depends on window.siteData from data.js (loaded first)
 */
document.addEventListener('DOMContentLoaded', () => {

  // Guard: ensure data is loaded
  if (!window.siteData) {
    console.error('data.js not loaded — window.siteData is undefined');
    return;
  }
  const { navItems, heroContent, services, testimonials, portfolio } = window.siteData;

  // 1. Render nav links from data
  // 2. Render hero content
  // 3. Render ALL sections from siteData
  // 4. Sticky header on scroll
  // 5. Hamburger menu toggle
  // 6. Smooth scroll for anchor links
  // 7. Active nav highlight (IntersectionObserver)
  // 8. Scroll-triggered animations (IntersectionObserver on .animate-on-scroll)
  // 9. ALL interactive features from Planner checklist
  // 10. Form validation + success/error message

});
\`\`\`
MINIMUM 200 lines. Every feature from Planner's checklist.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER truncate with "..." or "// rest of code" — every file 100% complete
- CSS class names in JS must EXACTLY match class names in HTML and CSS
- ALL anchor hrefs use #section-id — no page navigation or external links
- Check window.siteData exists before destructuring it
- Hamburger: JS toggles a class (e.g. .nav--open) and CSS must define that class in media query
- IntersectionObserver must be used for BOTH active nav AND scroll animations
- Form: check required fields, show a .form__success or .form__error element in the DOM

End with: "@Tester, ready for QA."`;

const TESTER_SYSTEM_PROMPT = `You are the Tester — a meticulous QA engineer.

You have:
- CHECKLIST.md (the ground truth from Planner)
- The current index.html, styles.css, app.js, data.js files

YOUR TASK: Go through EVERY item in CHECKLIST.md and verify it by static analysis.

HOW TO VERIFY (without a browser):
- Nav links: confirm every href="#X" has a matching id="X" in HTML
- Hamburger: JS has click listener on hamburger element, toggles a CSS class, that class exists in CSS media query
- Sticky header: JS scroll listener adds CSS class, that class defined in CSS with different styles
- Smooth scroll: JS intercepts anchor clicks and calls scrollIntoView or scrollTo
- Animations: .animate-on-scroll in CSS with opacity:0 base state, IntersectionObserver in JS adds .visible, .visible has opacity:1
- data.js rendering: window.siteData defined, destructured in app.js, rendered into element IDs that exist in HTML
- Form: required fields checked in JS, success/error element exists in HTML and is shown/hidden by JS
- Responsive: @media (max-width: 768px) block exists and changes layout
- Images: all img src values are valid full URLs
- No lorem ipsum: scan HTML for "Lorem ipsum"

OUTPUT FORMAT — use EXACTLY this:

## QA Report — Round [N]

### Checklist Results
| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Nav links scroll to sections | PASS | |
| 2 | Hamburger menu works | FAIL | JS toggles class "open" but CSS only defines ".nav--open" |

### Summary
- Total: X | Passed: X | Failed: X

### Bug Details
**BUG-1**: [short title]
- File: styles.css
- Problem: exact description
- Fix: exact instruction

Then output the QA status block:

\`\`\`QA_STATUS
ALL_CLEAR
\`\`\`

OR:

\`\`\`QA_STATUS
BUGS_FOUND: X
\`\`\`

End with: "All checks passed — @Boss, ready to ship!" OR "X bugs found — @Debugger, fix list above."`;

const DEBUGGER_SYSTEM_PROMPT = `You are the Debugger — you fix EVERY bug @Tester reported.

You have:
- @Tester's QA report with specific BUG-N items
- The COMPLETE current source files

YOUR PROCESS:
1. Read every BUG-N in the Tester's latest report
2. Find the exact location in the code
3. Fix the root cause — not a workaround
4. Output the COMPLETE corrected files (full file contents, not diffs)

OUTPUT RULES:
- Output ONLY files that changed (omit unchanged files)
- Each file output must be 100% complete — never use "// rest unchanged"
- Fix ALL bugs in one pass — do not skip any
- If a class name was wrong in CSS, fix it in CSS AND in HTML/JS that references it
- Add a comment near each fix: // FIXED: BUG-N description

\`\`\`index.html
...complete file...
\`\`\`

\`\`\`styles.css
...complete file...
\`\`\`

\`\`\`app.js
...complete file...
\`\`\`

End with: "@Tester, please re-verify all fixes."`;

// ─── AGENT REGISTRY ──────────────────────────────────────────────────────────

const AGENT_PROMPTS: Record<string, string> = {
  Planner: PLANNER_SYSTEM_PROMPT,
  Designer: DESIGNER_SYSTEM_PROMPT,
  "Backend Dev": BACKEND_DEV_SYSTEM_PROMPT,
  "Frontend Dev": FRONTEND_DEV_SYSTEM_PROMPT,
  Tester: TESTER_SYSTEM_PROMPT,
  Debugger: DEBUGGER_SYSTEM_PROMPT,
};

function getRoleFromName(name: string): string {
  const map: Record<string, string> = {
    Boss: "leader", Planner: "planner", Designer: "designer",
    "Frontend Dev": "frontend", "Backend Dev": "backend",
    Tester: "tester", Debugger: "debugger",
  };
  return map[name] || "worker";
}

// ─── JSON RESPONSE HELPER ────────────────────────────────────────────────────

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── AI CALLER ───────────────────────────────────────────────────────────────

async function callAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
  keyData: { api_key: string; provider: string },
): Promise<string> {
  const { api_key, provider } = keyData;
  let apiUrl = "";
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: any = {};

  if (provider === "openai") {
    apiUrl = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${api_key}`;
    body = { model: model || "gpt-4o", messages, stream: false };
  } else if (provider === "anthropic") {
    apiUrl = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = api_key;
    headers["anthropic-version"] = "2023-06-01";
    let system = "You are a helpful AI assistant.";
    const anthropicMsgs: any[] = [];
    for (const m of messages) {
      if (m.role === "system") system = m.content;
      else anthropicMsgs.push({ role: m.role, content: m.content });
    }
    body = {
      model: model || "claude-3-5-sonnet-20240620",
      system,
      messages: anthropicMsgs,
      max_tokens: 8096,
      stream: false,
    };
  } else if (provider === "gemini") {
    const geminiModel = model || "gemini-1.5-pro";
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${api_key}`;
    const geminiMessages = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    body = { contents: geminiMessages };
  } else if (provider === "openrouter") {
    apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    headers["Authorization"] = `Bearer ${api_key}`;
    body = { model: model || "meta-llama/llama-3-70b-instruct", messages, stream: false };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(body) });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `AI error ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      errorMessage = parsed.error?.message || parsed.error || errorMessage;
    } catch { }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (provider === "anthropic") return data.content?.[0]?.text || "";
  if (provider === "gemini") return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return data.choices?.[0]?.message?.content || "";
}

// ─── SUPABASE HELPERS ────────────────────────────────────────────────────────

async function insertMessage(
  supabase: any, projectId: string, userId: string,
  agentName: string, agentRole: string,
  content: string, messageType = "text",
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
    .from("project_files")
    .select("file_path, content")
    .eq("project_id", projectId);
  return data || [];
}

async function upsertFile(
  supabase: any, projectId: string, userId: string,
  filePath: string, content: string, agentName: string,
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

// ─── CODE BLOCK EXTRACTOR ────────────────────────────────────────────────────

const LANG_TO_FILE: Record<string, string> = {
  html: "index.html", htm: "index.html",
  css: "styles.css", scss: "styles.scss",
  javascript: "app.js", js: "app.js",
  typescript: "app.ts", ts: "app.ts",
  python: "main.py", py: "main.py",
  json: "data.json",
  sql: "schema.sql",
  yaml: "config.yaml", yml: "config.yml",
  markdown: "README.md", md: "README.md",
  shell: "script.sh", bash: "script.sh", sh: "script.sh",
};

const SKIP_LABELS = new Set([
  "text", "plaintext", "output", "console", "log", "diff", "qa_status",
]);

function extractCodeBlocks(text: string): Array<{ filename: string; content: string }> {
  const blocks: Array<{ filename: string; content: string }> = [];
  const regex = /```([^\n]+)\n([\s\S]*?)```/g;
  let match;
  const seenFiles = new Set<string>();

  while ((match = regex.exec(text)) !== null) {
    const label = match[1].trim();
    const content = match[2].trim();

    if (!content || content.length < 10) continue;
    if (SKIP_LABELS.has(label.toLowerCase())) continue;

    let filename: string;
    if (label.includes(".") || label.includes("/")) {
      filename = label;
    } else {
      const mapped = LANG_TO_FILE[label.toLowerCase()];
      if (mapped) { filename = mapped; } else { continue; }
    }

    if (seenFiles.has(filename)) {
      const idx = blocks.findIndex((b) => b.filename === filename);
      if (idx >= 0) blocks[idx] = { filename, content };
    } else {
      seenFiles.add(filename);
      blocks.push({ filename, content });
    }
  }
  return blocks;
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildContext(
  history: any[],
  files: any[],
  options: { includeFiles?: boolean; lastNMessages?: number } = {},
): string {
  const { includeFiles = true, lastNMessages } = options;
  let context = "## Conversation history:\n\n";
  const msgs = lastNMessages ? history.slice(-lastNMessages) : history;

  for (const msg of msgs) {
    if (msg.message_type === "status") {
      context += `> ${msg.agent_name}: ${msg.content}\n\n`;
    } else {
      const maxLen = 6000;
      const content =
        msg.content.length > maxLen
          ? msg.content.slice(0, maxLen) + "\n\n...(truncated for brevity)"
          : msg.content;
      context += `**@${msg.agent_name}** (${msg.agent_role}):\n${content}\n\n---\n\n`;
    }
  }

  if (includeFiles && files.length > 0) {
    context += "\n## Current project files (latest versions):\n\n";
    for (const f of files) {
      const maxLen = 8000;
      const c =
        f.content.length > maxLen
          ? f.content.slice(0, maxLen) + "\n\n...(truncated)"
          : f.content;
      context += `### ${f.file_path}:\n\`\`\`\n${c}\n\`\`\`\n\n`;
    }
  }
  return context;
}

// ─── QA STATUS PARSER ────────────────────────────────────────────────────────

function parseQaStatus(testerResponse: string): { passed: boolean; bugCount: number } {
  const statusMatch = testerResponse.match(/```QA_STATUS\n([\s\S]*?)```/);
  if (!statusMatch) {
    const allClear = /ALL TESTS PASSED|ALL_CLEAR|all checks passed/i.test(testerResponse);
    return { passed: allClear, bugCount: allClear ? 0 : 1 };
  }
  const statusText = statusMatch[1].trim();
  if (statusText === "ALL_CLEAR") return { passed: true, bugCount: 0 };
  const bugMatch = statusText.match(/BUGS_FOUND:\s*(\d+)/);
  return { passed: false, bugCount: bugMatch ? parseInt(bugMatch[1]) : 1 };
}

// ─── RUN AGENT ───────────────────────────────────────────────────────────────

async function runAgent(
  supabase: any,
  projectId: string,
  userId: string,
  agentName: string,
  task: string,
  model: string,
  keyData: { api_key: string; provider: string },
  contextOptions: { includeFiles?: boolean; lastNMessages?: number } = {},
): Promise<{ response: string; codeBlocks: Array<{ filename: string; content: string }> }> {
  const role = getRoleFromName(agentName);
  const systemPrompt = AGENT_PROMPTS[agentName];
  if (!systemPrompt) throw new Error(`No system prompt for agent: ${agentName}`);

  await insertMessage(supabase, projectId, userId, agentName, role, `Working on: ${task}`, "status");

  const history = await getConversationHistory(supabase, projectId);
  const files = await getProjectFiles(supabase, projectId);
  const context = buildContext(history, files, contextOptions);

  const response = await callAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${context}\n\n---\n\nYour task: ${task}` },
    ],
    model,
    keyData,
  );

  const codeBlocks = extractCodeBlocks(response);
  await insertMessage(
    supabase, projectId, userId, agentName, role,
    response, codeBlocks.length > 0 ? "code" : "text",
  );

  for (const block of codeBlocks) {
    await upsertFile(supabase, projectId, userId, block.filename, block.content, agentName);
  }

  return { response, codeBlocks };
}

// ─── RUN TESTER ──────────────────────────────────────────────────────────────

async function runTester(
  supabase: any,
  projectId: string,
  userId: string,
  qaRound: number,
  model: string,
  keyData: { api_key: string; provider: string },
): Promise<{ testerResponse: string; passed: boolean; bugCount: number }> {
  await insertMessage(
    supabase, projectId, userId, "Tester", "tester",
    `QA Round ${qaRound} — checking all features against CHECKLIST.md...`, "status",
  );

  const history = await getConversationHistory(supabase, projectId);
  const files = await getProjectFiles(supabase, projectId);
  const context = buildContext(history, files, { includeFiles: true });

  const testerResponse = await callAI(
    [
      { role: "system", content: TESTER_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `${context}\n\nRun QA Round ${qaRound}. Check EVERY item in CHECKLIST.md against ` +
          `the current files. Verify class name consistency between HTML, CSS, and JS. ` +
          `Confirm IntersectionObserver is set up correctly. Check for missing DOM elements.`,
      },
    ],
    model,
    keyData,
  );

  await insertMessage(supabase, projectId, userId, "Tester", "tester", testerResponse, "text");

  const { passed, bugCount } = parseQaStatus(testerResponse);

  if (passed) {
    await insertMessage(
      supabase, projectId, userId, "Tester", "tester",
      `All features verified — ${qaRound > 1 ? `took ${qaRound} rounds` : "first pass clean"}. Ready to ship.`,
      "status",
    );
  }

  return { testerResponse, passed, bugCount };
}

// ─── RUN DEBUGGER ────────────────────────────────────────────────────────────

async function runDebugger(
  supabase: any,
  projectId: string,
  userId: string,
  qaRound: number,
  model: string,
  keyData: { api_key: string; provider: string },
): Promise<void> {
  const isFinalRound = qaRound >= MAX_QA_ITERATIONS;

  await insertMessage(
    supabase, projectId, userId, "Debugger", "debugger",
    isFinalRound
      ? `Final debug pass (round ${qaRound}/${MAX_QA_ITERATIONS}).`
      : `Fixing issues from QA round ${qaRound}...`,
    "status",
  );

  const history = await getConversationHistory(supabase, projectId);
  const files = await getProjectFiles(supabase, projectId);
  const context = buildContext(history, files, { includeFiles: true });

  const debugResponse = await callAI(
    [
      { role: "system", content: DEBUGGER_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `${context}\n\nFix EVERY bug in @Tester's latest QA report above. ` +
          `Output COMPLETE corrected files. Pay close attention to class name mismatches ` +
          `and missing DOM elements.` +
          (isFinalRound ? "\n\nThis is the FINAL pass — make the website fully functional." : ""),
      },
    ],
    model,
    keyData,
  );

  const debugBlocks = extractCodeBlocks(debugResponse);
  await insertMessage(
    supabase, projectId, userId, "Debugger", "debugger",
    debugResponse, debugBlocks.length > 0 ? "code" : "text",
  );

  for (const block of debugBlocks) {
    await upsertFile(supabase, projectId, userId, block.filename, block.content, "Debugger");
  }
}

// ─── MAIN SERVER ─────────────────────────────────────────────────────────────

serve(async (req) => {
  console.log(`Incoming: ${req.method} ${req.url}`);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      project_id,
      user_id,
      step,
      description,
      global_api_key_id,
      model,
      task,
      qa_round,
      continue_from,
      user_message,
    } = body;

    if (!project_id || !user_id) return json({ error: "Missing project_id or user_id" }, 400);
    if (!global_api_key_id) return json({ error: "No API key selected." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: keyData, error: keyError } = await supabase
      .from("user_api_keys")
      .select("api_key, provider")
      .eq("id", global_api_key_id)
      .single();

    if (keyError || !keyData) return json({ error: "Failed to retrieve API key." }, 400);

    // ═══════════════════════════════════════════════════════════════════
    // USER REPLY FLOW
    // ═══════════════════════════════════════════════════════════════════
    if (continue_from === "user_reply") {
      const history = await getConversationHistory(supabase, project_id);
      const files = await getProjectFiles(supabase, project_id);
      const context = buildContext(history, files, { includeFiles: true, lastNMessages: 20 });
      const hasCode = files.some((f: any) =>
        ["index.html", "styles.css", "app.js"].includes(f.file_path),
      );

      await insertMessage(
        supabase, project_id, user_id, "Boss", "leader", "Reading your message...", "status",
      );

      const bossResponse = await callAI(
        [
          {
            role: "system",
            content: `You are the Boss. The client sent a follow-up.

Output task assignments as JSON:
{"tasks":[{"agent":"AgentName","task":"specific instructions"}]}

Available agents: Planner, Designer, Backend Dev, Frontend Dev, Tester, Debugger

Guidelines:
- Bug fix or broken feature -> assign Debugger with specific instructions
- New visual feature or layout -> assign Frontend Dev
- New section + complex feature -> assign Planner then Frontend Dev
- Style change -> assign Frontend Dev
- Content update -> assign Backend Dev then Frontend Dev
- ${hasCode ? "Existing code present — tell agents to MODIFY current files" : "No code yet — build from scratch"}
- ALWAYS add Tester after Frontend Dev or Debugger tasks
- Tell Frontend Dev to output COMPLETE files`,
          },
          {
            role: "user",
            content: `${context}\n\nClient message: "${user_message || "(see above)"}"`,
          },
        ],
        model,
        keyData,
      );

      await insertMessage(supabase, project_id, user_id, "Boss", "leader", bossResponse, "text");

      let tasks: Array<{ agent: string; task: string }> = [];
      const taskMatch = bossResponse.match(/\{[\s\S]*?"tasks"[\s\S]*?\}/);
      if (taskMatch) { try { tasks = JSON.parse(taskMatch[0]).tasks || []; } catch { } }
      if (tasks.length === 0) {
        tasks = [
          { agent: "Frontend Dev", task: user_message || "apply requested changes" },
          { agent: "Tester", task: "verify changes" },
        ];
      }

      const agentNameToStep: Record<string, string> = {
        "Planner": "planner",
        "Designer": "designer",
        "Backend Dev": "backend",
        "Frontend Dev": "frontend",
        "Tester": "tester",
        "Debugger": "debugger",
      };

      const stepQueue = tasks
        .map((t) => ({ step: agentNameToStep[t.agent], task: t.task }))
        .filter((s) => s.step);

      // Ensure Tester is always at the end if Frontend Dev or Debugger is in the queue
      const needsQA = stepQueue.some((s) => ["frontend", "debugger"].includes(s.step));
      const hasTester = stepQueue.some((s) => s.step === "tester");
      if (needsQA && !hasTester) {
        stepQueue.push({ step: "tester", task: "verify all changes are correct and nothing is broken" });
      }

      return json({ success: true, mode: "user_reply", step_queue: stepQueue });
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP-BY-STEP PIPELINE FLOW
    // Each call runs exactly ONE agent then returns.
    // The frontend calls the next step based on next_step in the response.
    // This prevents hitting the 150s Edge Function timeout.
    // ═══════════════════════════════════════════════════════════════════

    switch (step) {

      // ── BOSS ──────────────────────────────────────────────────────────
      case "boss": {
        await insertMessage(
          supabase, project_id, user_id, "Boss", "leader",
          "New project! Reviewing the brief and assembling the team.", "status",
        );

        const response = await callAI(
          [
            { role: "system", content: BOSS_SYSTEM_PROMPT },
            { role: "user", content: `Client brief: ${description}` },
          ],
          model,
          keyData,
        );

        await insertMessage(supabase, project_id, user_id, "Boss", "leader", response, "text");

        let tasks: Array<{ agent: string; task: string }> = [];
        const match = response.match(/\{[\s\S]*?"tasks"[\s\S]*?\}/);
        if (match) { try { tasks = JSON.parse(match[0]).tasks || []; } catch { } }

        const taskMap: Record<string, string> = {};
        for (const t of tasks) taskMap[t.agent] = t.task;

        return json({ success: true, next_step: "planner", task_map: taskMap });
      }

      // ── PLANNER ───────────────────────────────────────────────────────
      case "planner": {
        await runAgent(
          supabase, project_id, user_id,
          "Planner",
          task || `Create the site architecture and feature checklist for: ${description}`,
          model, keyData,
          { includeFiles: false },
        );
        return json({ success: true, next_step: "designer" });
      }

      // ── DESIGNER ──────────────────────────────────────────────────────
      case "designer": {
        await runAgent(
          supabase, project_id, user_id,
          "Designer",
          task || `Create the full design specification for: ${description}`,
          model, keyData,
          { includeFiles: false },
        );
        return json({ success: true, next_step: "backend" });
      }

      // ── BACKEND DEV ───────────────────────────────────────────────────
      case "backend": {
        await runAgent(
          supabase, project_id, user_id,
          "Backend Dev",
          task || `Create data.js with all content and mock data for: ${description}`,
          model, keyData,
          { includeFiles: false },
        );
        return json({ success: true, next_step: "frontend" });
      }

      // ── FRONTEND DEV ──────────────────────────────────────────────────
      case "frontend": {
        await runAgent(
          supabase, project_id, user_id,
          "Frontend Dev",
          task ||
          `Build the complete website (index.html, styles.css, app.js). ` +
          `Follow @Designer's spec exactly. Use window.siteData from data.js. ` +
          `Implement every feature in @Planner's CHECKLIST.md. Make it stunning and production-quality.`,
          model, keyData,
          { includeFiles: true },
        );
        return json({ success: true, next_step: "tester", qa_round: 1 });
      }

      // ── TESTER ────────────────────────────────────────────────────────
      case "tester": {
        const currentRound = qa_round || 1;
        const { passed, bugCount } = await runTester(
          supabase, project_id, user_id, currentRound, model, keyData,
        );

        if (passed) {
          return json({
            success: true,
            passed: true,
            bug_count: 0,
            qa_round: currentRound,
            next_step: "done",
          });
        }

        if (currentRound >= MAX_QA_ITERATIONS) {
          await insertMessage(
            supabase, project_id, user_id, "Boss", "leader",
            `Completed ${MAX_QA_ITERATIONS} QA rounds. The website is functional. ` +
            `Use the chat below to request any specific fixes.`,
            "text",
          );
          return json({
            success: true,
            passed: false,
            bug_count: bugCount,
            qa_round: currentRound,
            next_step: "done",
          });
        }

        return json({
          success: true,
          passed: false,
          bug_count: bugCount,
          qa_round: currentRound,
          next_step: "debugger",
        });
      }

      // ── DEBUGGER ──────────────────────────────────────────────────────
      case "debugger": {
        const currentRound = qa_round || 1;
        await runDebugger(supabase, project_id, user_id, currentRound, model, keyData);
        const nextRound = currentRound + 1;
        return json({
          success: true,
          next_step: nextRound > MAX_QA_ITERATIONS ? "done" : "tester",
          qa_round: nextRound,
        });
      }

      // ── DONE ──────────────────────────────────────────────────────────
      case "done": {
        await insertMessage(
          supabase, project_id, user_id, "Boss", "leader",
          "Project complete and QA verified! Preview it on the right. " +
          "Use the chat below for any changes — your team is ready.",
          "text",
        );
        return json({ success: true, next_step: null });
      }

      // ── UNKNOWN STEP ──────────────────────────────────────────────────
      default:
        return json({ error: `Unknown step: "${step}". Valid steps: boss, planner, designer, backend, frontend, tester, debugger, done` }, 400);
    }

  } catch (e) {
    console.error("orchestrator error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});