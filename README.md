<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d0d0d,50:1c0a00,100:3b1200&height=200&section=header&text=SyncSpace&fontSize=65&fontColor=ff6b35&animation=fadeIn&fontAlignY=40&desc=Build%20Websites%20Using%20AI%20Agents&descAlignY=62&descSize=16&descColor=a0a0a0" width="100%"/>

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-SyncSpace-ff6b35?style=for-the-badge)](https://syncspace-rho.vercel.app/)
&nbsp;
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
&nbsp;
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br/>

> **Stop writing boilerplate. Command a team of specialized AI agents**
> **to build, test, and deploy entire web apps from a single prompt.**

<br/>

🔗 **Deployed at:** [https://syncspace-rho.vercel.app](https://syncspace-rho.vercel.app/)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [How It Works](#-how-it-works)
- [AI Agent Team](#-ai-agent-team)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Author](#-author)

---

## 🧠 Overview

**SyncSpace** is an agentic AI workspace that simulates a **real software development office** — where AI agents act as specialized employees. Instead of writing code yourself, you describe what you want and a coordinated team of AI agents — Boss, Planner, Designer, Builder, and Debugger — collaborates to build, test, and deploy your web app.

From idea to production in **minutes, not months.**

```
You describe it  →  Agents plan it  →  AI builds it  →  Auto-debugged  →  Live 🚀
```

---

## ⚙️ How It Works

SyncSpace simulates a real office environment where every agent has a **desk, a role, and a responsibility.**

```
┌─────────────────────────────────────────────────────────────────┐
│                       YOUR PROMPT                               │
│          "Build me a landing page for a SaaS product"           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✍️  PROMPT RECEIVED — Describe your idea in plain English       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │  📋  LEADER AGENT     │  — Reads your prompt,
          │  Assigning tasks...   │    breaks it into jobs
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │  🧠  PLANNER AGENT    │  — Designs the architecture,
          │  Planning...          │    creates the roadmap
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │  ⚡  BUILDER AGENT    │  — Writes the actual code,
          │  Coding...            │    components, and logic
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │  🔍  DEBUGGER AGENT   │  — Catches errors, explains
          │  Checking...          │    them, and auto-fixes
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │  🚀  DEPLOY           │  — One-click live URL,
          │  Live!                │    zero configuration
          └───────────────────────┘
```

---

## 🤖 AI Agent Team

| Agent | Role | Responsibility |
|-------|------|----------------|
| 📋 **Leader** | Project Manager | Reads your prompt, delegates tasks to each agent |
| 🧠 **Planner** | Architect | Designs structure, breaks work into steps |
| 🎨 **Designer** | UI/UX Agent | Handles layout, styling, and visual decisions |
| ⚡ **Builder** | Developer | Writes components, logic, and full code |
| 🔍 **Debugger** | QA Engineer | Detects bugs, explains errors in plain English, auto-fixes |

> Each agent sits at their own desk, passing work to the next — just like a real development team.

---

## ✨ Features

### 🏢 Multi-Agent Collaboration
- Specialized AI agents working in **sequence and in sync**
- Each agent has a **defined role** — no overlapping, no confusion
- Simulates a real software office with task delegation and handoffs

### 🔍 Smart Auto-Debugging
- The **Debug Agent** automatically scans for errors after building
- Explains bugs in **plain English** — no stack traces to decipher
- Auto-fixes issues before delivery

### 🚀 One-Click Deployment
- Deploy your generated web app **instantly**
- Get a **live public URL** — ready to share with the world
- Zero configuration, zero DevOps knowledge needed

### ✍️ Natural Language Interface
- Describe what you want in plain English
- No coding required — the agents handle everything
- Works for landing pages, dashboards, SaaS apps, and more

### 🌙 Theme Support
- Light / Dark mode toggle built-in
- Clean, minimal UI focused on the agent workflow

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| ⚛️ Frontend | React + TypeScript |
| 🎨 Styling | Tailwind CSS + shadcn/ui |
| ⚡ Build Tool | Vite |
| 🤖 AI Layer | Agentic AI Systems |
| 🌐 Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

Ensure **Node.js** and **npm** are installed.
> Recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage Node versions.

```bash
node -v   # v18+ recommended
npm -v
```

### Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/Gaziwahab/syncspace.git

# 2️⃣ Navigate into the project
cd syncspace

# 3️⃣ Install all dependencies
npm install

# 4️⃣ Start the development server
npm run dev
```

App runs at **http://localhost:5173** 🎉

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
syncspace/
├── public/                    # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── Agents/            # Agent desk & workflow components
│   │   ├── Prompt/            # User input & prompt interface
│   │   ├── Output/            # Generated code & preview panel
│   │   └── Layout/            # Nav, footer, theme toggle
│   ├── pages/                 # Route-level pages
│   │   ├── Home.tsx           # Landing page
│   │   ├── Dashboard.tsx      # Agent workspace
│   │   ├── Docs.tsx           # Documentation
│   │   └── Pricing.tsx        # Pricing page
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & AI agent logic
│   ├── types/                 # TypeScript interfaces
│   ├── context/               # Global state & auth context
│   ├── App.tsx                # Root component & routing
│   └── main.tsx               # Entry point
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 🌐 Deployment

SyncSpace is live on **Vercel** at [syncspace-rho.vercel.app](https://syncspace-rho.vercel.app/).

To deploy your own instance:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel
```

Or connect your GitHub repo to [Vercel](https://vercel.com) for **automatic deployments** on every push to `main`.

> **Custom Domain:** Navigate to your Vercel project → Settings → Domains → Connect Domain.

---

## 🤝 Contributing

Contributions are welcome — especially ideas around new agent types, UI improvements, and AI integrations!

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: describe your change"

# 4. Push and open a PR
git push origin feature/your-feature-name
```

Open issues or suggestions [here](https://github.com/Gaziwahab/syncspace/issues). 🙌

---

## 👤 Author

<div align="center">

**Gazi Wahab**
*Full Stack Developer · Agentic AI Builder · Vibe Coder*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gazi-wahab/)
&nbsp;
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Gaziwahab)
&nbsp;
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:gaziwahab58@gmail.com)

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:3b1200,100:0d0d0d&height=110&section=footer&text=Code%20the%20Future%20Without%20Coding&fontSize=14&fontColor=a0a0a0&animation=fadeIn&fontAlignY=65" width="100%"/>

<sub>Built with ❤️ and AI by <a href="https://github.com/Gaziwahab">Gazi Wahab</a></sub>

</div>