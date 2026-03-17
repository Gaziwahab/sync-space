

# Phase 2: Dashboard Shell with Sidebar Navigation

## What We're Building
Transform the current placeholder dashboard into a full workspace shell with a collapsible sidebar, top navbar with profile dropdown, and stub pages for each section.

## Structure

### 1. Dashboard Layout Component (`src/components/dashboard/DashboardLayout.tsx`)
- Uses `SidebarProvider` + `Sidebar` from shadcn
- Top header bar with `SidebarTrigger`, search input, notifications bell icon, ThemeToggle, and profile avatar dropdown (showing user email, logout)
- Wraps child content via `Outlet` from react-router

### 2. App Sidebar (`src/components/dashboard/AppSidebar.tsx`)
Collapsible sidebar (`collapsible="icon"`) with these nav groups:

**Workspace**
- Projects (`FolderKanban`)
- Prompt Builder (`MessageSquare`)
- AI Agents (`Bot`)

**Developer**
- Debug Console (`Terminal`)
- Deploy (`Rocket`)

**Account**
- Settings (`Settings`)

Uses `NavLink` for active route highlighting.

### 3. Profile Dropdown (`src/components/dashboard/ProfileDropdown.tsx`)
- Avatar with user initials
- Dropdown: display name/email, Settings link, Logout button
- Fetches profile from `profiles` table

### 4. Stub Pages
Create minimal placeholder pages:
- `src/pages/dashboard/Projects.tsx` -- "Your projects will appear here"
- `src/pages/dashboard/PromptBuilder.tsx`
- `src/pages/dashboard/AIAgents.tsx`
- `src/pages/dashboard/DebugConsole.tsx`
- `src/pages/dashboard/DeployPage.tsx`
- `src/pages/dashboard/SettingsPage.tsx`

### 5. Routing Updates (`src/App.tsx`)
Replace the flat `/dashboard` route with nested routes:
```
/dashboard          → redirect to /dashboard/projects
/dashboard/projects
/dashboard/prompt-builder
/dashboard/agents
/dashboard/debug
/dashboard/deploy
/dashboard/settings
```

### 6. Refactor `Dashboard.tsx`
Convert to a layout component that:
- Handles auth guard (existing logic)
- Renders `SidebarProvider` > `AppSidebar` + header + `<Outlet />`

## Files to Create/Modify
- **Create**: `src/components/dashboard/AppSidebar.tsx`
- **Create**: `src/components/dashboard/ProfileDropdown.tsx`
- **Create**: 6 stub pages under `src/pages/dashboard/`
- **Modify**: `src/pages/Dashboard.tsx` → layout with Outlet
- **Modify**: `src/App.tsx` → nested dashboard routes

No database changes needed -- existing `profiles` table and RLS policies are sufficient.

